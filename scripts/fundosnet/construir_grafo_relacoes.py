"""Constrói o grafo agregado de relações entre FIIs.

Varre todos os data/fiis/*.json, extrai os arrays `relacoes[]`, deduplica
arestas bidirecionais (se A→B e B→A descrevem a mesma operação) e produz
data/conexoes-fiis.json com:
  - nodes[]: cada FII analisado + cada gestora distinta
  - edges[]: cada vínculo deduplicado, agregando ocorrências, valores e severidade
  - estatisticas: contagens por tipo, severidade, gestora

Uso:
    python3 scripts/fundosnet/construir_grafo_relacoes.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
OUT_PATH = DATA / "conexoes-fiis.json"


def _normalizar_gestora(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip().lower()
    s = re.sub(r"[áàâã]", "a", s)
    s = re.sub(r"[éèê]", "e", s)
    s = re.sub(r"[íì]", "i", s)
    s = re.sub(r"[óòôõ]", "o", s)
    s = re.sub(r"[úù]", "u", s)
    s = re.sub(r"[ç]", "c", s)
    s = re.sub(r"\b(asset management|gestao|gestora|investimentos|capital|partners|administradora|distribuidora|adm|dtvm|ctvm|s\.a\.|sa|ltda)\b", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _arr(x):
    return x if isinstance(x, list) else []


def _safe(x):
    return x if isinstance(x, dict) else {}


def main() -> int:
    if not FIIS_DIR.exists():
        print(f"[grafo] sem data/fiis/")
        return 1

    nodes_fii: dict[str, dict] = {}        # ticker → node
    nodes_gestora: dict[str, dict] = {}    # gestora_norm → node
    edges_brutas: list[dict] = []          # antes da dedup bidirecional
    estat = {
        "porTipo": defaultdict(int),
        "porSeveridade": defaultdict(int),
        "porGestora": defaultdict(int),
        "favoresAbertos": 0,
    }

    for jp in sorted(FIIS_DIR.glob("*.json")):
        if jp.parent.name == ".backups":
            continue
        try:
            d = json.loads(jp.read_text(encoding="utf-8"))
        except Exception:
            continue

        meta = _safe(d.get("meta"))
        ind = _safe(d.get("indicadores"))
        rec = _safe(d.get("recomendacao"))
        gestora_raw = _safe(d.get("gestora")).get("nome")
        ticker = (meta.get("ticker") or jp.stem).upper()

        # Node FII
        nodes_fii[ticker] = {
            "id": ticker,
            "tipo": "fii",
            "label": ticker,
            "nome": meta.get("nome"),
            "segmento": meta.get("segmento"),
            "gestora": gestora_raw,
            "gestoraNorm": _normalizar_gestora(gestora_raw),
            "nota": rec.get("nota"),
            "veredicto": rec.get("veredicto"),
            "cotacao": ind.get("cotacao"),
            "dy": ind.get("dividendYield"),
            "pvp": ind.get("pvp"),
            "url": f"/fiis/{ticker.lower()}/",
        }
        # Node Gestora (agrupa fundos da mesma casa)
        gnorm = _normalizar_gestora(gestora_raw)
        if gnorm and gnorm not in nodes_gestora:
            nodes_gestora[gnorm] = {
                "id": "GESTORA::" + gnorm,
                "tipo": "gestora",
                "label": gestora_raw,
                "nome": gestora_raw,
                "fundos": [],
            }
        if gnorm:
            nodes_gestora[gnorm]["fundos"].append(ticker)

        # Coleta relações
        for rel in _arr(d.get("relacoes")):
            if not isinstance(rel, dict):
                continue
            cp = _safe(rel.get("contraparte"))
            cp_ticker = (cp.get("ticker") or "").upper() or None
            cp_tipo = cp.get("tipo") or "externo"
            tipoRel = rel.get("tipo") or "outro_vinculo"
            severidade = rel.get("severidadeConflito") or "inexistente"
            valor = rel.get("valor")
            data_rel = rel.get("data")
            fluxo = rel.get("fluxo") or "neutro"
            favor_aberto = bool(rel.get("favorAberto"))
            agio = _safe(rel.get("agioSobreMercado"))
            mesma_gestora = bool(rel.get("mesmaGestora"))
            fontes = _arr(rel.get("fontes"))

            estat["porTipo"][tipoRel] += 1
            estat["porSeveridade"][severidade] += 1
            if favor_aberto:
                estat["favoresAbertos"] += 1
            if mesma_gestora and gnorm:
                estat["porGestora"][gnorm] += 1

            if not cp_ticker and not cp.get("nome"):
                continue
            target_id = cp_ticker if cp_ticker else "EXT::" + (cp.get("nome") or "?")
            edges_brutas.append({
                "id": rel.get("id") or f"{ticker}-{target_id}-{data_rel or '?'}",
                "from": ticker,
                "to": target_id,
                "fromTicker": ticker,
                "toTicker": cp_ticker,
                "toNome": cp.get("nome"),
                "toTipo": cp_tipo,
                "toGestora": cp.get("gestora"),
                "tipo": tipoRel,
                "data": data_rel,
                "valor": valor,
                "fluxo": fluxo,
                "favorAberto": favor_aberto,
                "mesmaGestora": mesma_gestora,
                "severidade": severidade,
                "agioPct": agio.get("valorPercent"),
                "descricao": rel.get("descricao"),
                "leitura": rel.get("leituraInterpretativa"),
                "fontes": fontes,
            })

            # Garante node externo quando contraparte não foi analisada
            if cp_ticker and cp_ticker not in nodes_fii and not (FIIS_DIR / f"{cp_ticker.lower()}.json").exists():
                nodes_fii[cp_ticker] = {
                    "id": cp_ticker,
                    "tipo": "fii",
                    "label": cp_ticker,
                    "nome": cp.get("nome"),
                    "gestora": cp.get("gestora"),
                    "gestoraNorm": _normalizar_gestora(cp.get("gestora")),
                    "external": True,
                    "url": None,
                }
            if not cp_ticker:
                nodes_fii.setdefault(target_id, {
                    "id": target_id,
                    "tipo": cp_tipo,
                    "label": cp.get("nome") or "?",
                    "nome": cp.get("nome"),
                    "external": True,
                    "url": None,
                })

    # Dedup bidirecional: (A,B) e (B,A) com mesmo tipo + janela 30d → 1 aresta
    edges_agg: dict[str, dict] = {}
    sev_rank = {"alta": 3, "media": 2, "baixa": 1, "inexistente": 0}
    for e in edges_brutas:
        a, b = e["from"], e["to"]
        par = tuple(sorted([a, b]))
        # mantém tipos separados — A↔B com 2 tipos vira 2 arestas distintas
        key = f"{par[0]}|{par[1]}|{e['tipo']}"
        agg = edges_agg.get(key)
        if not agg:
            edges_agg[key] = {
                "id": key,
                "from": par[0],
                "to": par[1],
                "tipo": e["tipo"],
                "ocorrencias": 1,
                "valorTotal": e["valor"] or 0,
                "severidadeMax": e["severidade"],
                "favorAberto": e["favorAberto"],
                "mesmaGestora": e["mesmaGestora"],
                "ultimaData": e["data"],
                "primeiraData": e["data"],
                "agioMaxPct": e["agioPct"],
                "ids": [e["id"]],
                "evidencias": [{
                    "ladoOrigem": e["fromTicker"],
                    "data": e["data"],
                    "valor": e["valor"],
                    "fluxo": e["fluxo"],
                    "agioPct": e["agioPct"],
                    "descricao": e["descricao"],
                    "leitura": e["leitura"],
                    "fontes": e["fontes"],
                }],
            }
        else:
            agg["ocorrencias"] += 1
            agg["valorTotal"] = (agg["valorTotal"] or 0) + (e["valor"] or 0)
            if sev_rank.get(e["severidade"], 0) > sev_rank.get(agg["severidadeMax"], 0):
                agg["severidadeMax"] = e["severidade"]
            if e["favorAberto"]:
                agg["favorAberto"] = True
            if e["mesmaGestora"]:
                agg["mesmaGestora"] = True
            if e["data"] and (not agg["ultimaData"] or e["data"] > agg["ultimaData"]):
                agg["ultimaData"] = e["data"]
            if e["data"] and (not agg["primeiraData"] or e["data"] < agg["primeiraData"]):
                agg["primeiraData"] = e["data"]
            if e["agioPct"] is not None:
                agg["agioMaxPct"] = max(agg["agioMaxPct"] or 0, e["agioPct"])
            agg["ids"].append(e["id"])
            agg["evidencias"].append({
                "ladoOrigem": e["fromTicker"],
                "data": e["data"],
                "valor": e["valor"],
                "fluxo": e["fluxo"],
                "agioPct": e["agioPct"],
                "descricao": e["descricao"],
                "leitura": e["leitura"],
                "fontes": e["fontes"],
            })

    edges = list(edges_agg.values())

    out = {
        "schema": "v1",
        "atualizadoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalFundos": sum(1 for n in nodes_fii.values() if not n.get("external")),
        "totalFundosExternos": sum(1 for n in nodes_fii.values() if n.get("external")),
        "totalGestoras": len(nodes_gestora),
        "totalRelacoes": len(edges_brutas),
        "totalArestas": len(edges),
        "estatisticas": {
            "porTipo": dict(estat["porTipo"]),
            "porSeveridade": dict(estat["porSeveridade"]),
            "favoresAbertos": estat["favoresAbertos"],
            "gestorasComConflito": dict(estat["porGestora"]),
        },
        "nodes": list(nodes_fii.values()) + list(nodes_gestora.values()),
        "edges": edges,
    }

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[grafo] {out['totalFundos']} FIIs, {out['totalArestas']} arestas, "
          f"{out['estatisticas']['favoresAbertos']} favores abertos · "
          f"salvo em {OUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
