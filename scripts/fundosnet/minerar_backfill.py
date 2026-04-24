"""Mineração HISTÓRICA completa de um FII/FIAGRO desde o IPO.

Diferente de minerar.py (janela curta para update periódico), este script
constrói o dossiê histórico completo de um fundo: baixa TODOS os documentos
relevantes desde o primeiro registro no Fundos.NET até hoje.

Estratégia:
  - Usa filtro server-side cnpjFundo no endpoint Fundos.NET (reduz tráfego ~100x).
  - Varre em janelas anuais (ou semestrais para fundos com muito doc).
  - Prioriza: Relatório Gerencial, Fato Relevante, Assembleia, Informe Anual,
    Informe Trimestral, Demonstrações Financeiras (pega TUDO).
  - Amostra: Informe Mensal (1 por trimestre), Rendimentos (1 por mês).
  - Idempotente: se doc já baixado, não rebaixa.

Saída:
  data/fiis-raw/{TICKER}/
    meta.json              # consolidado
    docs/{id}.pdf|.html    # conteúdo bruto

Uso:
  python3 minerar_backfill.py HGLG11 11728688000147
  python3 minerar_backfill.py HGLG11 11728688000147 --desde 2010 --ate 2026
  python3 minerar_backfill.py --lista data/fundosnet-liquidos.json
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterator

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from client import ENDPOINT_SEARCH, _HEADERS
from paths import DATA

ENDPOINT_DOC = "https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento"

FIIS_RAW = DATA / "fiis-raw"
MAX_PDF_BYTES = 15 * 1024 * 1024   # 15MB — cobre relatórios gerenciais grandes; prospectos maiores ainda são pulados
PAGE_SIZE = 200
TIMEOUT_SEARCH = 180
TIMEOUT_DOC_CONNECT = 15
TIMEOUT_DOC_READ = 45
DOWNLOAD_WORKERS = 4


def _nova_sessao() -> requests.Session:
    s = requests.Session()
    retry = Retry(
        total=2, backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=DOWNLOAD_WORKERS*2, pool_maxsize=DOWNLOAD_WORKERS*2)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    s.headers.update(_HEADERS)
    return s


_SESSAO: requests.Session | None = None


def _sessao() -> requests.Session:
    global _SESSAO
    if _SESSAO is None:
        _SESSAO = _nova_sessao()
    return _SESSAO


def baixar_doc_robusto(id_doc: int | str, timeout_connect: int = TIMEOUT_DOC_CONNECT,
                       timeout_read: int = TIMEOUT_DOC_READ) -> bytes:
    """Baixa documento com timeout absoluto (não espera indefinidamente)."""
    r = _sessao().get(ENDPOINT_DOC, params={"id": id_doc},
                      timeout=(timeout_connect, timeout_read))
    r.raise_for_status()
    b64 = r.text.strip().strip('"')
    return base64.b64decode(b64)

# Anos cobertos pelo Fundos.NET — antes de 2010 praticamente não há FII publicado.
# Se o fundo for mais novo, o servidor retorna vazio para anos antigos (sem custo).
ANO_MIN_GLOBAL = 2005


# ---------------------------------------------------------------------------
# Classificação de prioridade do documento
# ---------------------------------------------------------------------------

# bucket -> (substring no tipo, "todos" ou int de amostragem por trimestre)
PRIORIDADES: list[tuple[str, str, str | int]] = [
    ("fato_relevante",     "fato relevante",         "todos"),
    ("comunicado",         "comunicado",             "todos"),
    ("assembleia",         "assembleia",             "todos"),
    ("assembleia2",        "assembléia",             "todos"),
    ("convocacao",         "convocação",             "todos"),
    ("relatorio",          "relatório gerencial",    "todos"),
    ("relatorio2",         "relatorio gerencial",    "todos"),
    ("informe_anual",      "informe anual",          "todos"),
    ("informe_trim",       "informe trimestral",     "todos"),
    ("demonstracoes",      "demonstrações",          "todos"),
    ("demonstracoes2",     "demonstracoes",          "todos"),
    ("regulamento",        "regulamento",            "todos"),
    ("oferta",             "oferta pública",         "todos"),
    ("prospecto",          "prospecto",              "todos"),
    ("informe_mensal",     "informe mensal",         1),     # 1 por trimestre
    ("rendimentos",        "rendimentos",            "todos"),
    ("amortizacoes",       "amortizações",           "todos"),
    ("esclarecimentos",    "esclarecimentos",        "todos"),
]


def _bucket(tipo_doc: str) -> str | None:
    t = (tipo_doc or "").lower()
    for bucket, padrao, _regra in PRIORIDADES:
        if padrao in t:
            return bucket
    return None


def _regra_amostragem(bucket: str) -> str | int:
    for b, _padrao, regra in PRIORIDADES:
        if b == bucket:
            return regra
    return "todos"


# ---------------------------------------------------------------------------
# Cliente Fundos.NET com filtro por CNPJ
# ---------------------------------------------------------------------------

def _only_digits(cnpj: str) -> str:
    return re.sub(r"\D", "", cnpj or "")


def _http_get(params: dict, tentativas: int = 4) -> dict:
    atraso = 2
    erro_ultimo = None
    for i in range(tentativas):
        try:
            r = _sessao().get(ENDPOINT_SEARCH, params=params, timeout=(15, TIMEOUT_SEARCH))
            r.raise_for_status()
            return r.json()
        except Exception as e:
            erro_ultimo = e
            if i < tentativas - 1:
                time.sleep(atraso)
                atraso = min(atraso * 2, 60)
    raise RuntimeError(f"Fundos.NET indisponível: {erro_ultimo}")


def _buscar_por_cnpj_janela(
    cnpj_digits: str,
    data_inicial: str,
    data_final: str,
    tipo_fundo: int = 1,
) -> Iterator[dict]:
    """Pagina resultados filtrados por CNPJ em uma janela de datas."""
    start = 0
    while True:
        data = _http_get({
            "d": 1,
            "s": start,
            "l": PAGE_SIZE,
            "tipoFundo": tipo_fundo,
            "dataInicial": data_inicial,
            "dataFinal": data_final,
            "cnpjFundo": cnpj_digits,
        })
        batch = data.get("data") or []
        if not batch:
            return
        for doc in batch:
            yield doc
        total = data.get("recordsTotal") or 0
        start += len(batch)
        if start >= total:
            return


def listar_historico(cnpj: str, *, desde: int, ate: int) -> list[dict]:
    """Retorna todos os documentos do fundo entre anos `desde` e `ate` (inclusive).

    Vai ano a ano, tentando FII (tipoFundo=1) e Fiagro (tipoFundo=11).
    """
    cnpj_digits = _only_digits(cnpj)
    if not cnpj_digits:
        raise ValueError(f"CNPJ inválido: {cnpj!r}")

    todos: dict[str, dict] = {}
    for ano in range(desde, ate + 1):
        di = f"01/01/{ano}"
        df = f"31/12/{ano}"
        n_ano = 0
        for tf in (1, 11):
            try:
                for doc in _buscar_por_cnpj_janela(cnpj_digits, di, df, tipo_fundo=tf):
                    did = str(doc["id"])
                    if did not in todos:
                        todos[did] = doc
                        n_ano += 1
            except Exception as e:
                print(f"  [warn] ano {ano} tf={tf}: {e}", file=sys.stderr)
        print(f"  [{ano}] {n_ano} docs", flush=True)
    return list(todos.values())


# ---------------------------------------------------------------------------
# Priorização e seleção
# ---------------------------------------------------------------------------

def _parse_data(d: dict) -> datetime:
    s = d.get("dataEntrega") or d.get("dataReferencia") or ""
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:len(fmt.replace('%', ''))+5], fmt)
        except ValueError:
            pass
    try:
        return datetime.strptime(s[:10], "%d/%m/%Y")
    except Exception:
        return datetime.min


def _trimestre(d: datetime) -> str:
    return f"{d.year}Q{(d.month - 1)//3 + 1}"


def priorizar(docs: list[dict]) -> tuple[list[dict], dict]:
    """Aplica política de priorização por tipo + amostragem por trimestre.

    Retorna (selecionados, stats_por_bucket).
    """
    por_bucket: dict[str, list[dict]] = {}
    for doc in docs:
        b = _bucket(doc.get("tipoDocumento") or "")
        if not b:
            continue
        por_bucket.setdefault(b, []).append(doc)

    selecionados: list[dict] = []
    stats: dict = {}
    for bucket, lista in por_bucket.items():
        regra = _regra_amostragem(bucket)
        lista.sort(key=_parse_data)
        if regra == "todos":
            selecionados.extend(lista)
            stats[bucket] = {"total": len(lista), "mantidos": len(lista), "regra": "todos"}
        else:
            # amostra N por trimestre
            por_trim: dict[str, list[dict]] = {}
            for d in lista:
                por_trim.setdefault(_trimestre(_parse_data(d)), []).append(d)
            mantidos: list[dict] = []
            for trim, trim_docs in por_trim.items():
                mantidos.extend(trim_docs[:regra])
            selecionados.extend(mantidos)
            stats[bucket] = {"total": len(lista), "mantidos": len(mantidos), "regra": f"{regra}/trim"}
    # unifica e ordena
    vistos = set()
    unicos: list[dict] = []
    for d in sorted(selecionados, key=_parse_data):
        did = str(d["id"])
        if did in vistos:
            continue
        vistos.add(did)
        unicos.append(d)
    return unicos, stats


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def _baixar_um(doc: dict, pasta_docs: Path) -> tuple[str, dict | None, str | None]:
    """Baixa um doc. Retorna (id, entrada_meta_ou_None, erro_ou_None)."""
    doc_id = str(doc["id"])
    try:
        raw = baixar_doc_robusto(doc_id)
        ext = "pdf" if raw[:4] == b"%PDF" else "html"
        if ext == "pdf" and len(raw) > MAX_PDF_BYTES:
            return doc_id, None, f"PDF {len(raw)//1024}kb > limite {MAX_PDF_BYTES//1024}kb"
        dst = pasta_docs / f"{doc_id}.{ext}"
        dst.write_bytes(raw)
        return doc_id, {
            "id": doc_id,
            "tipoDocumento": doc.get("tipoDocumento"),
            "categoriaDocumento": doc.get("categoriaDocumento"),
            "especieDocumento": doc.get("especieDocumento"),
            "dataEntrega": doc.get("dataEntrega"),
            "dataReferencia": doc.get("dataReferencia"),
            "nomePregao": doc.get("nomePregao"),
            "descricaoFundo": doc.get("descricaoFundo"),
            "versao": doc.get("versao"),
            "formato": ext,
            "arquivo": f"docs/{dst.name}",
            "tamanhoBytes": len(raw),
            "baixadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        }, None
    except Exception as e:
        return doc_id, None, str(e)[:200]


def baixar_docs(ticker: str, docs: list[dict], *, cnpj: str) -> dict:
    pasta = FIIS_RAW / ticker.upper()
    pasta_docs = pasta / "docs"
    pasta_docs.mkdir(parents=True, exist_ok=True)

    meta_path = pasta / "meta.json"
    meta_anterior = {}
    if meta_path.exists():
        try:
            meta_anterior = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            meta_anterior = {}
    anteriores = {str(d["id"]): d for d in meta_anterior.get("documentos", [])}

    lista_meta: list[dict] = []
    pendentes: list[dict] = []
    pulados = 0
    for doc in docs:
        if str(doc["id"]) in anteriores:
            lista_meta.append(anteriores[str(doc["id"])])
            pulados += 1
        else:
            pendentes.append(doc)

    print(f"  [download] {len(pendentes)} novos | {pulados} já existentes | {DOWNLOAD_WORKERS} workers")

    baixados = 0
    erros = 0
    if pendentes:
        with ThreadPoolExecutor(max_workers=DOWNLOAD_WORKERS) as ex:
            futuros = {ex.submit(_baixar_um, d, pasta_docs): d for d in pendentes}
            total = len(pendentes)
            for i, fut in enumerate(as_completed(futuros), start=1):
                doc_id, entrada, erro = fut.result()
                doc = futuros[fut]
                tipo = (doc.get("tipoDocumento") or "?")[:35]
                dref = doc.get("dataReferencia") or doc.get("dataEntrega", "?")
                if entrada:
                    lista_meta.append(entrada)
                    baixados += 1
                    print(f"    [{i:4d}/{total}] {tipo:35s} {dref:12s} {entrada['formato']} ({entrada['tamanhoBytes']//1024}kb)", flush=True)
                else:
                    erros += 1
                    print(f"    [{i:4d}/{total}] ERRO doc={doc_id} {tipo[:30]}: {erro}", flush=True)

    # Ordena meta por data
    lista_meta.sort(key=lambda d: d.get("dataEntrega") or "")

    pregao = next((d.get("nomePregao") for d in docs if d.get("nomePregao")), None)
    descr = next((d.get("descricaoFundo") for d in docs if d.get("descricaoFundo")), None)

    meta = {
        "ticker": ticker.upper(),
        "cnpj": cnpj,
        "nomePregao": pregao,
        "descricaoFundo": descr,
        "modo": "backfill",
        "atualizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "totalDocumentos": len(lista_meta),
        "documentos": lista_meta,
    }
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    return {"ticker": ticker, "docs_selecionados": len(docs),
            "baixados": baixados, "pulados_ja_existentes": pulados, "erros": erros,
            "total_no_meta": len(lista_meta)}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def _descobrir_periodo(docs: list[dict]) -> tuple[str, str]:
    if not docs:
        return "?", "?"
    datas = [_parse_data(d) for d in docs if _parse_data(d) != datetime.min]
    if not datas:
        return "?", "?"
    return min(datas).date().isoformat(), max(datas).date().isoformat()


def rodar(ticker: str, cnpj: str, *, desde: int, ate: int) -> dict:
    print(f"\n=== backfill {ticker.upper()} — CNPJ {cnpj} — {desde} a {ate} ===")
    print(f"[1/3] listando docs históricos via cnpjFundo…")
    docs = listar_historico(cnpj, desde=desde, ate=ate)
    dmin, dmax = _descobrir_periodo(docs)
    print(f"      total encontrados: {len(docs)} (período real {dmin} → {dmax})")

    print(f"[2/3] priorizando por tipo/amostragem…")
    selecionados, stats = priorizar(docs)
    print(f"      selecionados: {len(selecionados)}")
    for b, s in sorted(stats.items(), key=lambda kv: -kv[1]["mantidos"]):
        print(f"        {b:20s} {s['mantidos']:4d}/{s['total']:4d}  ({s['regra']})")

    print(f"[3/3] baixando documentos…")
    resultado = baixar_docs(ticker, selecionados, cnpj=cnpj)
    resultado["periodo_coberto"] = {"inicio": dmin, "fim": dmax}
    resultado["total_historico_encontrado"] = len(docs)
    resultado["stats_priorizacao"] = stats
    print(f"\n[ok] {ticker.upper()}: total meta={resultado['total_no_meta']} "
          f"(baixados novos={resultado['baixados']}, já existentes={resultado['pulados_ja_existentes']}, "
          f"erros={resultado['erros']})")
    return resultado


def main() -> int:
    ap = argparse.ArgumentParser(description="Backfill histórico de FII/Fiagro via Fundos.NET")
    ap.add_argument("ticker", nargs="?", help="Ticker (ex.: HGLG11)")
    ap.add_argument("cnpj", nargs="?", help="CNPJ do fundo (com ou sem pontuação)")
    ap.add_argument("--desde", type=int, default=ANO_MIN_GLOBAL, help=f"Ano inicial (default {ANO_MIN_GLOBAL})")
    ap.add_argument("--ate", type=int, default=date.today().year, help="Ano final (default atual)")
    ap.add_argument("--lista", help="JSON com {tickers:[{ticker,cnpj}]} para lote")
    args = ap.parse_args()

    if args.lista:
        lista = json.loads(Path(args.lista).read_text(encoding="utf-8"))
        entries = lista.get("tickers") or lista.get("fundos") or lista
        resultados = []
        for entry in entries:
            t = entry.get("ticker") if isinstance(entry, dict) else entry
            c = entry.get("cnpj") if isinstance(entry, dict) else None
            if not c:
                print(f"[skip] {t}: sem CNPJ")
                continue
            resultados.append(rodar(t, c, desde=args.desde, ate=args.ate))
        print(f"\n[lote] {len(resultados)} tickers processados")
        return 0

    if not args.ticker or not args.cnpj:
        ap.error("precisa passar TICKER CNPJ ou --lista")

    rodar(args.ticker, args.cnpj, desde=args.desde, ate=args.ate)
    return 0


if __name__ == "__main__":
    sys.exit(main())
