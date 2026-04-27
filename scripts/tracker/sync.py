"""Sincroniza estado dos JSONs do disco com o MySQL.

Fontes lidas (somente leitura — JSONs no disco continuam sendo a fonte da verdade):
  - data/fiis-tickers.json                 -> universo (544)
  - data/fundosnet-liquidos.json           -> cnpj/segmento/liquidez por ticker
  - data/fiis-raw/{T}/meta.json            -> mineracao (totalDocs, atualizadoEm, documentos[])
  - data/fiis-optimized/{T}/{ID}.meta.json -> otimizacao (bytes, paginas)
  - data/fiis/{T}.json                     -> analise (meta.dataAnalise, mtime)
  - fiis/{T}/index.html                    -> publicacao (mtime)
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, date
from pathlib import Path
from typing import Iterable, Optional

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_RAW = DATA / "fiis-raw"
FIIS_OPT = DATA / "fiis-optimized"
FIIS_DIR = DATA / "fiis"
PAGES_DIR = ROOT / "fiis"

TICKERS_PATH  = DATA / "fiis-tickers.json"
LIQUIDOS_PATH = DATA / "fundosnet-liquidos.json"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _read_json(p: Path) -> Optional[dict]:
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def _parse_iso(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def _parse_data_entrega(s: Optional[str]) -> Optional[date]:
    """Aceita 'DD/MM/YYYY HH:MM' ou 'DD/MM/YYYY' ou 'YYYY-MM-DD'."""
    if not s:
        return None
    s = s.strip()
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})", s)
    if m:
        return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def _mtime(p: Path) -> Optional[datetime]:
    if not p.exists():
        return None
    return datetime.fromtimestamp(p.stat().st_mtime)


# ---------------------------------------------------------------------------
# Universo
# ---------------------------------------------------------------------------
def carregar_universo() -> set[str]:
    """Tickers conhecidos (uniao de fiis-tickers.json + presentes em fiis-raw + presentes em data/fiis)."""
    tickers: set[str] = set()
    d = _read_json(TICKERS_PATH)
    if d:
        for t in d.get("tickers", []):
            tickers.add(t.upper())
    if FIIS_RAW.exists():
        for p in FIIS_RAW.iterdir():
            if p.is_dir():
                tickers.add(p.name.upper())
    if FIIS_DIR.exists():
        for p in FIIS_DIR.glob("*.json"):
            t = p.stem.upper()
            if re.match(r"^[A-Z0-9]{4,6}$", t):
                tickers.add(t)
    if FIIS_OPT.exists():
        for p in FIIS_OPT.iterdir():
            if p.is_dir():
                tickers.add(p.name.upper())
    return tickers


def carregar_meta_universo() -> dict[str, dict]:
    """Mapeia ticker -> {cnpj, segmento, liquidez, nome_pregao} a partir de fundosnet-liquidos.json."""
    out: dict[str, dict] = {}
    d = _read_json(LIQUIDOS_PATH) or {}
    for f in d.get("fundos", []) or []:
        t = (f.get("ticker") or "").upper()
        if not t:
            continue
        out[t] = {
            "cnpj":      f.get("cnpj"),
            "segmento":  f.get("segmento"),
            "liquidez":  f.get("liquidezDiaria"),
        }
    return out


# ---------------------------------------------------------------------------
# Estado por ticker
# ---------------------------------------------------------------------------
@dataclass
class EstadoTicker:
    ticker: str
    cnpj: Optional[str]
    nome_pregao: Optional[str]
    segmento: Optional[str]
    liquidez: Optional[float]
    total_docs_raw: int
    data_ultimo_doc: Optional[date]
    id_ultimo_doc: Optional[str]
    tipo_ultimo_doc: Optional[str]
    data_ultima_mineracao: Optional[datetime]
    total_docs_otimizados: int
    data_ultima_otimizacao: Optional[datetime]
    tem_analise: bool
    data_ultima_analise: Optional[datetime]
    versao_analise: Optional[str]
    tem_pagina: bool
    data_ultima_pagina: Optional[datetime]
    docs: list[dict]  # cada um: doc_id, tipo, categoria, data_entrega, data_referencia, bytes_original, bytes_otimizado, paginas, formato, baixado_em, otimizado_em


def coletar_estado(ticker: str, meta_universo: dict[str, dict]) -> EstadoTicker:
    ticker = ticker.upper()
    info_uni = meta_universo.get(ticker, {})

    # Mineracao
    raw_meta = _read_json(FIIS_RAW / ticker / "meta.json") or {}
    docs_raw = raw_meta.get("documentos", []) or []
    total_raw = int(raw_meta.get("totalDocumentos") or len(docs_raw))
    data_ult_min = _parse_iso(raw_meta.get("atualizadoEm"))
    nome_pregao = raw_meta.get("nomePregao") or info_uni.get("nome_pregao")
    cnpj_raw = raw_meta.get("cnpj")
    if cnpj_raw and not info_uni.get("cnpj"):
        info_uni["cnpj"] = cnpj_raw

    # Mais recente por dataEntrega
    data_ultimo_doc: Optional[date] = None
    id_ultimo_doc: Optional[str] = None
    tipo_ultimo_doc: Optional[str] = None
    if docs_raw:
        docs_ordenados = sorted(
            docs_raw,
            key=lambda d: (_parse_data_entrega(d.get("dataEntrega")) or date(1970, 1, 1)),
            reverse=True,
        )
        ultimo = docs_ordenados[0]
        data_ultimo_doc = _parse_data_entrega(ultimo.get("dataEntrega"))
        id_ultimo_doc = str(ultimo.get("id")) if ultimo.get("id") is not None else None
        tipo_ultimo_doc = ultimo.get("tipoDocumento")

    # Otimizacao
    opt_dir = FIIS_OPT / ticker
    opt_metas: list[Path] = []
    if opt_dir.is_dir():
        opt_metas = list(opt_dir.glob("*.meta.json"))
    total_otim = len(opt_metas)
    data_ult_otim = max((datetime.fromtimestamp(p.stat().st_mtime) for p in opt_metas), default=None)

    # Analise
    analise_path = FIIS_DIR / f"{ticker.lower()}.json"
    tem_analise = analise_path.exists()
    data_ult_anl: Optional[datetime] = None
    versao_anl: Optional[str] = None
    if tem_analise:
        anl = _read_json(analise_path) or {}
        meta_anl = anl.get("meta") or {}
        # Preferimos meta.dataAnalise; fallback mtime
        da = meta_anl.get("dataAnalise") or meta_anl.get("geradoEm") or meta_anl.get("atualizadoEm")
        # dataAnalise costuma vir 'YYYY-MM-DD' ou ISO
        if da:
            try:
                if len(da) == 10:
                    data_ult_anl = datetime.strptime(da, "%Y-%m-%d")
                else:
                    data_ult_anl = datetime.fromisoformat(da)
            except Exception:
                data_ult_anl = _mtime(analise_path)
        else:
            data_ult_anl = _mtime(analise_path)
        versao_anl = meta_anl.get("versaoAnalise") or meta_anl.get("modeloAnalise")

    # Pagina
    pagina_path = PAGES_DIR / ticker.lower() / "index.html"
    tem_pagina = pagina_path.exists()
    data_ult_pag = _mtime(pagina_path) if tem_pagina else None

    # Docs detalhados (raw + opt overlay)
    docs_detalhados: list[dict] = []
    optmap: dict[str, Path] = {p.stem.replace(".meta", "").replace(".meta", "")
                               .rsplit(".meta", 1)[0]: p for p in opt_metas}
    # corrige: stem de "1004907.meta.json" eh "1004907.meta", precisamos do id puro
    optmap = {p.name.replace(".meta.json", ""): p for p in opt_metas}

    for d in docs_raw:
        doc_id = str(d.get("id")) if d.get("id") is not None else None
        if not doc_id:
            continue
        opt_meta = _read_json(optmap[doc_id]) if doc_id in optmap else None
        bytes_otim = (opt_meta or {}).get("bytes_otimizado")
        bytes_orig = (opt_meta or {}).get("bytes_original") or d.get("tamanhoBytes")
        paginas = (opt_meta or {}).get("paginas")
        otim_em = datetime.fromtimestamp(optmap[doc_id].stat().st_mtime) if doc_id in optmap else None
        docs_detalhados.append({
            "doc_id":          doc_id,
            "tipo":            d.get("tipoDocumento"),
            "categoria":       d.get("categoriaDocumento"),
            "data_entrega":    _parse_data_entrega(d.get("dataEntrega")),
            "data_referencia": _parse_data_entrega(d.get("dataReferencia")),
            "bytes_original":  bytes_orig,
            "bytes_otimizado": bytes_otim,
            "paginas":         paginas,
            "formato":         d.get("formato"),
            "baixado_em":      _parse_iso(d.get("baixadoEm")),
            "otimizado_em":    otim_em,
        })

    # Para tickers cujos docs SO existam em fiis-optimized/ (ex: 15 migrados sem fiis-raw)
    if not docs_detalhados and opt_metas:
        for p in opt_metas:
            m = _read_json(p) or {}
            doc_id = m.get("id") or p.name.replace(".meta.json", "")
            de = m.get("dataEntrega")
            data_ent = None
            if de:
                try: data_ent = date.fromisoformat(de) if len(de) == 10 else _parse_data_entrega(de)
                except Exception: data_ent = None
            docs_detalhados.append({
                "doc_id":          str(doc_id),
                "tipo":            m.get("tipo"),
                "categoria":       None,
                "data_entrega":    data_ent,
                "data_referencia": None,
                "bytes_original":  m.get("bytes_original"),
                "bytes_otimizado": m.get("bytes_otimizado"),
                "paginas":         m.get("paginas"),
                "formato":         None,
                "baixado_em":      None,
                "otimizado_em":    datetime.fromtimestamp(p.stat().st_mtime),
            })
        if not data_ultimo_doc and docs_detalhados:
            datas = [d["data_entrega"] for d in docs_detalhados if d["data_entrega"]]
            if datas:
                data_ultimo_doc = max(datas)
                ult = next(d for d in docs_detalhados if d["data_entrega"] == data_ultimo_doc)
                id_ultimo_doc = ult["doc_id"]
                tipo_ultimo_doc = ult["tipo"]
        total_raw = total_raw or len(docs_detalhados)

    return EstadoTicker(
        ticker=ticker,
        cnpj=info_uni.get("cnpj"),
        nome_pregao=nome_pregao,
        segmento=info_uni.get("segmento"),
        liquidez=info_uni.get("liquidez"),
        total_docs_raw=total_raw,
        data_ultimo_doc=data_ultimo_doc,
        id_ultimo_doc=id_ultimo_doc,
        tipo_ultimo_doc=tipo_ultimo_doc,
        data_ultima_mineracao=data_ult_min,
        total_docs_otimizados=total_otim,
        data_ultima_otimizacao=data_ult_otim,
        tem_analise=tem_analise,
        data_ultima_analise=data_ult_anl,
        versao_analise=versao_anl,
        tem_pagina=tem_pagina,
        data_ultima_pagina=data_ult_pag,
        docs=docs_detalhados,
    )


# ---------------------------------------------------------------------------
# Status derivado
# ---------------------------------------------------------------------------
def calcular_status(e: EstadoTicker) -> tuple[str, bool]:
    """Retorna (status_geral, precisa_reanalise)."""
    if e.total_docs_raw == 0 and e.total_docs_otimizados == 0:
        return "nao_minerado", False
    if e.tem_analise and e.tem_pagina:
        # Defasagem: doc novo apos a ultima analise
        if e.data_ultimo_doc and e.data_ultima_analise:
            if e.data_ultimo_doc > e.data_ultima_analise.date():
                return "desatualizado", True
        elif e.data_ultimo_doc and not e.data_ultima_analise:
            return "desatualizado", True
        return "analisado", False
    if e.total_docs_otimizados > 0:
        return "otimizado", False
    return "minerado", False


# ---------------------------------------------------------------------------
# UPSERT no MySQL
# ---------------------------------------------------------------------------
UPSERT_TRACKER = """
INSERT INTO fii_tracker (
  ticker, cnpj, nome_pregao, segmento, liquidez_diaria,
  total_docs_raw, data_ultimo_doc, id_ultimo_doc, tipo_ultimo_doc, data_ultima_mineracao,
  total_docs_otimizados, data_ultima_otimizacao,
  tem_analise, data_ultima_analise, versao_analise,
  tem_pagina, data_ultima_pagina,
  status_geral, precisa_reanalise
) VALUES (
  %(ticker)s, %(cnpj)s, %(nome_pregao)s, %(segmento)s, %(liquidez)s,
  %(total_docs_raw)s, %(data_ultimo_doc)s, %(id_ultimo_doc)s, %(tipo_ultimo_doc)s, %(data_ultima_mineracao)s,
  %(total_docs_otimizados)s, %(data_ultima_otimizacao)s,
  %(tem_analise)s, %(data_ultima_analise)s, %(versao_analise)s,
  %(tem_pagina)s, %(data_ultima_pagina)s,
  %(status_geral)s, %(precisa_reanalise)s
)
ON DUPLICATE KEY UPDATE
  cnpj=VALUES(cnpj), nome_pregao=VALUES(nome_pregao), segmento=VALUES(segmento), liquidez_diaria=VALUES(liquidez_diaria),
  total_docs_raw=VALUES(total_docs_raw), data_ultimo_doc=VALUES(data_ultimo_doc),
  id_ultimo_doc=VALUES(id_ultimo_doc), tipo_ultimo_doc=VALUES(tipo_ultimo_doc),
  data_ultima_mineracao=VALUES(data_ultima_mineracao),
  total_docs_otimizados=VALUES(total_docs_otimizados), data_ultima_otimizacao=VALUES(data_ultima_otimizacao),
  tem_analise=VALUES(tem_analise), data_ultima_analise=VALUES(data_ultima_analise), versao_analise=VALUES(versao_analise),
  tem_pagina=VALUES(tem_pagina), data_ultima_pagina=VALUES(data_ultima_pagina),
  status_geral=VALUES(status_geral), precisa_reanalise=VALUES(precisa_reanalise)
"""

UPSERT_DOC = """
INSERT INTO fii_doc (
  ticker, doc_id, tipo, categoria, data_entrega, data_referencia,
  bytes_original, bytes_otimizado, paginas, formato, baixado_em, otimizado_em
) VALUES (
  %(ticker)s, %(doc_id)s, %(tipo)s, %(categoria)s, %(data_entrega)s, %(data_referencia)s,
  %(bytes_original)s, %(bytes_otimizado)s, %(paginas)s, %(formato)s, %(baixado_em)s, %(otimizado_em)s
)
ON DUPLICATE KEY UPDATE
  tipo=VALUES(tipo), categoria=VALUES(categoria),
  data_entrega=VALUES(data_entrega), data_referencia=VALUES(data_referencia),
  bytes_original=VALUES(bytes_original), bytes_otimizado=VALUES(bytes_otimizado),
  paginas=VALUES(paginas), formato=VALUES(formato),
  baixado_em=VALUES(baixado_em), otimizado_em=VALUES(otimizado_em)
"""


def sincronizar(tickers: Optional[Iterable[str]] = None, verbose: bool = True) -> dict:
    """Roda sync. Se tickers=None, sincroniza universo inteiro."""
    from .db import conn

    meta_universo = carregar_meta_universo()
    universo = list(carregar_universo())
    universo.sort()
    if tickers is not None:
        alvo = {t.upper() for t in tickers}
        universo = [t for t in universo if t in alvo]

    novos_docs: dict[str, list[str]] = {}
    estatisticas = {"tickers": 0, "docs_inseridos_ou_atualizados": 0, "tickers_com_docs_novos": 0}

    with conn() as c:
        cur = c.cursor()
        for t in universo:
            # Lê IDs de docs ja conhecidos
            cur.execute("SELECT doc_id FROM fii_doc WHERE ticker=%s", (t,))
            ids_existentes = {row["doc_id"] for row in cur.fetchall()}

            estado = coletar_estado(t, meta_universo)
            status, precisa = calcular_status(estado)

            row = {
                "ticker": estado.ticker,
                "cnpj": estado.cnpj,
                "nome_pregao": estado.nome_pregao,
                "segmento": estado.segmento,
                "liquidez": estado.liquidez,
                "total_docs_raw": estado.total_docs_raw,
                "data_ultimo_doc": estado.data_ultimo_doc,
                "id_ultimo_doc": estado.id_ultimo_doc,
                "tipo_ultimo_doc": estado.tipo_ultimo_doc,
                "data_ultima_mineracao": estado.data_ultima_mineracao,
                "total_docs_otimizados": estado.total_docs_otimizados,
                "data_ultima_otimizacao": estado.data_ultima_otimizacao,
                "tem_analise": int(estado.tem_analise),
                "data_ultima_analise": estado.data_ultima_analise,
                "versao_analise": estado.versao_analise,
                "tem_pagina": int(estado.tem_pagina),
                "data_ultima_pagina": estado.data_ultima_pagina,
                "status_geral": status,
                "precisa_reanalise": int(precisa),
            }
            cur.execute(UPSERT_TRACKER, row)

            ids_novos: list[str] = []
            for d in estado.docs:
                d_full = {"ticker": estado.ticker, **d}
                cur.execute(UPSERT_DOC, d_full)
                if d["doc_id"] not in ids_existentes:
                    ids_novos.append(d["doc_id"])

            estatisticas["docs_inseridos_ou_atualizados"] += len(estado.docs)
            estatisticas["tickers"] += 1

            if ids_novos and ids_existentes:  # ja existia entrada => sao DE FATO novos
                novos_docs[estado.ticker] = ids_novos
                estatisticas["tickers_com_docs_novos"] += 1
                cur.execute(
                    "INSERT INTO fii_evento (ticker, tipo, docs_novos, ids_novos, detalhe) VALUES (%s, 'mineracao', %s, %s, 'sync detectou novos docs')",
                    (estado.ticker, len(ids_novos), json.dumps(ids_novos)),
                )

            # Enfileira reanálise se necessário (e ainda nao estiver na fila aberta)
            if precisa or (estado.total_docs_raw > 0 and not estado.tem_analise) or (estado.total_docs_otimizados > 0 and not estado.tem_analise):
                motivo = "novos_docs" if precisa and estado.tem_analise else (
                    "primeira_analise" if not estado.tem_analise else "desatualizado"
                )
                cur.execute(
                    """INSERT INTO fii_fila (ticker, motivo, prioridade)
                       VALUES (%s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         motivo=IF(concluido_em IS NULL, motivo, VALUES(motivo)),
                         enfileirado_em=IF(concluido_em IS NULL, enfileirado_em, CURRENT_TIMESTAMP),
                         iniciado_em=IF(concluido_em IS NULL, iniciado_em, NULL),
                         concluido_em=IF(concluido_em IS NULL, NULL, NULL)""",
                    (estado.ticker, motivo, 100 if motivo == "novos_docs" else 50),
                )

            if verbose:
                print(f"  {estado.ticker:6}  status={status:14}  raw={estado.total_docs_raw:4}  opt={estado.total_docs_otimizados:4}  ult_doc={estado.data_ultimo_doc}  novos_aqui={len(ids_novos)}")

    if verbose:
        print(f"\n[sync] {estatisticas['tickers']} tickers / docs={estatisticas['docs_inseridos_ou_atualizados']} / com_novos={estatisticas['tickers_com_docs_novos']}")

    return {"estatisticas": estatisticas, "novos_docs": novos_docs}
