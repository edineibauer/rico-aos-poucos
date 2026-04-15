"""Mineração de documentos do Fundos.NET por FII.

Baixa os últimos N docs representativos de cada ticker e salva em
data/fiis-raw/{TICKER}/:
  meta.json          # lista consolidada com metadados de cada doc
  docs/{id}.pdf|.html  # conteúdo bruto do doc

Não chama IA. Só download + organização.

Uso:
    python3 minerar.py --ticker ABCP11             # mina 1 ticker
    python3 minerar.py --todos                     # todos do universo
    python3 minerar.py --max-docs 12 --dias 180    # customiza janela
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

from client import TIPO_FII, TIPO_FIAGRO, baixar_documento, buscar_publicacoes
from paths import DATA, MAPA, MAPA_OVERLAY, UNIVERSO
from triage import classify

FIIS_RAW = DATA / "fiis-raw"

# Prioridade de tipos de docs a preservar (em ordem). O objetivo é construir
# um dossiê representativo sem baixar tudo.
TIPOS_PRIORITARIOS = [
    ("fato relevante", 3),
    ("comunicado", 2),
    ("assembleia", 2),
    ("convocação", 1),
    ("relatório gerencial", 3),
    ("relatorio gerencial", 3),
    ("informe anual", 1),
    ("informe trimestral", 2),
    ("demonstrações", 1),
    ("informe mensal", 2),
    ("rendimentos", 2),
    ("amortizações", 1),
]


def _carregar_mapa() -> dict:
    mapa = json.loads(MAPA.read_text(encoding="utf-8"))
    if MAPA_OVERLAY.exists():
        overlay = json.loads(MAPA_OVERLAY.read_text(encoding="utf-8"))
        mapa["mapa"].update(overlay.get("mapa", {}))
    return mapa


def _ticker_do_doc(doc: dict, mapa: dict) -> str | None:
    pregao = (doc.get("nomePregao") or "").strip()
    if not pregao:
        return None
    entrada = mapa["mapa"].get(pregao)
    return entrada["ticker"].upper() if entrada else None


def _tipo_fundo(ticker: str, mapa: dict) -> int:
    for e in mapa.get("mapa", {}).values():
        if e.get("ticker", "").upper() == ticker.upper():
            tf = e.get("tipoFundo")
            if tf in (1, 11):
                return tf
    return 1


def _bucket(tipo_doc: str) -> tuple[str, int] | None:
    """Classifica doc em um bucket de prioridade. Retorna (bucket, limite) ou None se ignorar."""
    t = (tipo_doc or "").lower()
    for padrao, limite in TIPOS_PRIORITARIOS:
        if padrao in t:
            return (padrao, limite)
    return None


def _ja_minerado(ticker: str, doc_id: int | str) -> bool:
    meta_path = FIIS_RAW / ticker / "meta.json"
    if not meta_path.exists():
        return False
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    return any(str(d.get("id")) == str(doc_id) for d in meta.get("documentos", []))


def _minerar_ticker(ticker: str, mapa: dict, *, dias: int, max_docs: int) -> dict:
    ticker = ticker.upper()
    print(f"\n[minerar] {ticker} — janela {dias} dias, max {max_docs} docs")

    hoje = datetime.now()
    di = (hoje - timedelta(days=dias)).strftime("%d/%m/%Y")
    df = hoje.strftime("%d/%m/%Y")

    tf = _tipo_fundo(ticker, mapa)
    print(f"  tipoFundo={tf}  periodo={di} a {df}")

    encontrados: list[dict] = []
    for doc in buscar_publicacoes(di, df, tipo_fundo=tf):
        t = _ticker_do_doc(doc, mapa)
        if t and t == ticker:
            encontrados.append(doc)
            if len(encontrados) >= max_docs * 2:  # folga pra priorizar depois
                break

    print(f"  candidatos brutos: {len(encontrados)}")

    if not encontrados:
        return {"ticker": ticker, "total": 0, "baixados": 0, "erros": 0}

    # Seleciona respeitando buckets/prioridade, pegando os mais recentes
    def _data(d):
        s = d.get("dataEntrega") or d.get("dataReferencia") or ""
        try:
            return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S")
        except Exception:
            try:
                return datetime.strptime(s[:10], "%Y-%m-%d")
            except Exception:
                return datetime.min

    encontrados.sort(key=_data, reverse=True)

    contagem_bucket: dict[str, int] = {}
    selecionados: list[dict] = []
    for doc in encontrados:
        if len(selecionados) >= max_docs:
            break
        bucket_info = _bucket(doc.get("tipoDocumento") or "")
        if bucket_info is None:
            continue
        bucket, limite = bucket_info
        if contagem_bucket.get(bucket, 0) >= limite:
            continue
        contagem_bucket[bucket] = contagem_bucket.get(bucket, 0) + 1
        selecionados.append(doc)

    print(f"  selecionados: {len(selecionados)} (buckets: {contagem_bucket})")

    # Baixa
    pasta = FIIS_RAW / ticker
    pasta_docs = pasta / "docs"
    pasta_docs.mkdir(parents=True, exist_ok=True)

    # Carrega meta anterior pra preservar docs já baixados
    meta_path = pasta / "meta.json"
    meta_anterior = {}
    if meta_path.exists():
        try:
            meta_anterior = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            meta_anterior = {}
    anteriores_por_id = {str(d["id"]): d for d in meta_anterior.get("documentos", [])}

    baixados, erros = 0, 0
    lista_meta = []
    for doc in selecionados:
        doc_id = str(doc["id"])
        if doc_id in anteriores_por_id:
            lista_meta.append(anteriores_por_id[doc_id])
            continue
        try:
            raw = baixar_documento(doc_id)
            # descobre extensão grosseira (PDF começa com %PDF)
            ext = "pdf" if raw[:4] == b"%PDF" else "html"
            dst = pasta_docs / f"{doc_id}.{ext}"
            dst.write_bytes(raw)
            lista_meta.append({
                "id": doc_id,
                "tipoDocumento": doc.get("tipoDocumento"),
                "categoriaDocumento": doc.get("categoriaDocumento"),
                "dataEntrega": doc.get("dataEntrega"),
                "dataReferencia": doc.get("dataReferencia"),
                "nomePregao": doc.get("nomePregao"),
                "descricaoFundo": doc.get("descricaoFundo"),
                "fundoOuClasse": doc.get("fundoOuClasse"),
                "formato": ext,
                "arquivo": f"docs/{dst.name}",
                "tamanhoBytes": len(raw),
                "baixadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
            })
            baixados += 1
            print(f"    [{baixados}/{len(selecionados)}] {doc_id} {doc.get('tipoDocumento','?')[:45]:45s} {ext} ({len(raw)//1024}kb)")
        except Exception as e:
            erros += 1
            print(f"    [erro] {doc_id}: {e}")

    meta = {
        "ticker": ticker,
        "nomePregao": selecionados[0].get("nomePregao") if selecionados else None,
        "descricaoFundo": selecionados[0].get("descricaoFundo") if selecionados else None,
        "tipoFundo": tf,
        "janelaDias": dias,
        "atualizadoEm": datetime.now().astimezone().isoformat(timespec="seconds"),
        "totalDocumentos": len(lista_meta),
        "documentos": lista_meta,
    }
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    return {"ticker": ticker, "total": len(lista_meta), "baixados": baixados, "erros": erros}


def main() -> int:
    ap = argparse.ArgumentParser(description="Mina docs do Fundos.NET por FII")
    ap.add_argument("--ticker", help="Ticker único a minerar")
    ap.add_argument("--tickers", help="Lista separada por vírgula")
    ap.add_argument("--todos", action="store_true", help="Minera todos os FIIs do universo")
    ap.add_argument("--dias", type=int, default=180, help="Janela em dias (default 180)")
    ap.add_argument("--max-docs", type=int, default=12, help="Max docs por ticker (default 12)")
    args = ap.parse_args()

    mapa = _carregar_mapa()

    if args.todos:
        universo = json.loads(UNIVERSO.read_text(encoding="utf-8"))
        tickers = [f["ticker"].upper() for f in universo["fundos"]]
    elif args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    elif args.ticker:
        tickers = [args.ticker.upper()]
    else:
        ap.error("precisa passar --ticker, --tickers ou --todos")
        return 1

    print(f"[minerar] {len(tickers)} ticker(s) — {tickers[:5]}{'…' if len(tickers) > 5 else ''}")

    FIIS_RAW.mkdir(parents=True, exist_ok=True)
    total = {"ok": 0, "erros": 0, "docs": 0}
    for t in tickers:
        try:
            r = _minerar_ticker(t, mapa, dias=args.dias, max_docs=args.max_docs)
            total["ok"] += 1
            total["docs"] += r["baixados"]
            total["erros"] += r["erros"]
        except Exception as e:
            total["erros"] += 1
            print(f"  [falha] {t}: {e}")

    print(f"\n[minerar] concluído — {total['ok']} tickers, {total['docs']} docs baixados, {total['erros']} erros")
    return 0


if __name__ == "__main__":
    sys.exit(main())
