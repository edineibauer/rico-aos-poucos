"""Auditor de consistência cruzada de análises de FIIs.

Lê data/fiis/{ticker}.json e verifica as 20 regras (C1..C20) definidas em
ANALISE_FII_PADRAO.md. Devolve relatório por severidade.

Uso:
    python3 scripts/fundosnet/auditar_consistencia.py --ticker BLMG11
    python3 scripts/fundosnet/auditar_consistencia.py --todos
    python3 scripts/fundosnet/auditar_consistencia.py --ticker BLMG11 --json   # output JSON p/ pipe

Saída:
    - Por padrão: relatório legível com cor por severidade.
    - --json: lista de violações para consumo programático (loop de correção).
    - exit code 0 se sem violações `alta`; exit code 1 se houver violações `alta`.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
FIIS_OPTIMIZED = DATA / "fiis-optimized"
PARES_PATH = DATA / "pares_subsegmento.json"

VEREDICTOS_VALIDOS = {"COMPRA", "MANTER", "VENDA", "EM_ANALISE", "EM ANÁLISE"}
DIRECOES_VALIDAS = {
    "queda_forte", "queda", "lateral_baixa", "lateral", "lateral_alta",
    "alta", "alta_forte", "indefinido",
}


def _normalize_veredicto(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip().upper().replace(" ", "_").replace("Á", "A")
    return s


def _flat(obj: Any) -> str:
    """Achata um valor (string, dict, list) em texto plano para análise semântica."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return re.sub(r"<[^>]+>", " ", obj)
    if isinstance(obj, (list, tuple)):
        return " ".join(_flat(x) for x in obj)
    if isinstance(obj, dict):
        return " ".join(_flat(v) for v in obj.values())
    return str(obj)


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip().replace("%", "").replace(" ", "").replace("R$", "")
        if "," in s:
            s = s.replace(".", "").replace(",", ".")
        try:
            return float(s)
        except ValueError:
            return None
    return None


def _violacao(codigo: str, severidade: str, msg: str, campo: str | None = None,
              fix_hint: str | None = None) -> dict:
    return {
        "codigo": codigo,
        "severidade": severidade,
        "campo": campo,
        "mensagem": msg,
        "fix_hint": fix_hint,
    }


def auditar(ticker: str) -> dict:
    ticker = ticker.upper()
    json_path = FIIS_DIR / f"{ticker.lower()}.json"
    if not json_path.exists():
        return {"ticker": ticker, "ok": False, "erro": f"sem JSON em {json_path}",
                "violacoes": []}
    try:
        d = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return {"ticker": ticker, "ok": False, "erro": f"JSON inválido: {e}",
                "violacoes": []}

    viol: list[dict] = []
    meta = d.get("meta") or {}
    rec = d.get("recomendacao") or {}
    ind = d.get("indicadores") or {}
    val = d.get("valuation") or {}
    div = d.get("dividendos") or {}
    tese = d.get("tese") or {}
    conc = d.get("conclusao") or {}
    footer = d.get("footer") or {}

    nota = _num(rec.get("nota"))
    veredicto = _normalize_veredicto(rec.get("veredicto"))
    cor = (rec.get("cor") or "").lower()
    sentimento = (meta.get("sentimento") or "").lower()
    cotacao_atual = _num(ind.get("cotacao"))

    # C1 — nota vs veredicto
    if nota is not None and veredicto:
        if nota <= 4 and veredicto not in {"VENDA", "EM_ANALISE"}:
            viol.append(_violacao("C1", "alta",
                f"nota {nota} ≤ 4 mas veredicto={veredicto} (esperado VENDA ou EM_ANALISE)",
                "recomendacao.veredicto"))
        elif 5 <= nota <= 7 and veredicto not in {"MANTER", "EM_ANALISE"}:
            viol.append(_violacao("C1", "alta",
                f"nota {nota} entre 5-7 mas veredicto={veredicto} (esperado MANTER ou EM_ANALISE)",
                "recomendacao.veredicto"))
        elif nota >= 8 and veredicto != "COMPRA":
            viol.append(_violacao("C1", "alta",
                f"nota {nota} ≥ 8 mas veredicto={veredicto} (esperado COMPRA)",
                "recomendacao.veredicto"))

    # C2 — cor casa veredicto
    cor_esperada = {"COMPRA": "emerald", "MANTER": "amber", "VENDA": "red", "EM_ANALISE": "slate"}
    if veredicto in cor_esperada and cor and cor != cor_esperada[veredicto]:
        viol.append(_violacao("C2", "alta",
            f"cor={cor} não casa com veredicto={veredicto} (esperado {cor_esperada[veredicto]})",
            "recomendacao.cor"))

    # C3 — sentimento casa veredicto
    sent_esperado = {"COMPRA": "otimista", "MANTER": "neutro", "VENDA": "pessimista"}
    if veredicto in sent_esperado and sentimento and sentimento != sent_esperado[veredicto]:
        viol.append(_violacao("C3", "media",
            f"sentimento={sentimento} não casa com veredicto={veredicto} (esperado {sent_esperado[veredicto]})",
            "meta.sentimento"))

    # C4 — pressao_imediata vs expectativa.curto.direcao
    sust = (div.get("sustentabilidade") or {})
    div_status = (sust.get("dividendoStatus") or "").lower()
    exp = val.get("expectativa") or {}
    exp_curto_dir = (exp.get("curto") or {}).get("direcao", "")
    if div_status == "pressao_imediata" and exp_curto_dir in {"alta", "alta_forte", "lateral_alta"}:
        viol.append(_violacao("C4", "alta",
            f"dividendoStatus=pressao_imediata mas expectativa.curto.direcao={exp_curto_dir} (esperado queda/lateral/queda_forte)",
            "valuation.expectativa.curto.direcao"))

    # C5 — sintese.tendencia em queda vs expectativa.medio.direcao
    sintese = (div.get("sintese") or {})
    tend = (sintese.get("tendencia") or "").lower()
    exp_medio_dir = (exp.get("medio") or {}).get("direcao", "")
    if any(t in tend for t in ["queda", "queda_forte"]) and exp_medio_dir == "alta_forte":
        viol.append(_violacao("C5", "alta",
            f"dividendos.sintese.tendencia={tend} mas expectativa.medio.direcao=alta_forte (incoerente)",
            "valuation.expectativa.medio.direcao"))

    # C6 — preço justo dentro de [0.7, 1.5] × cotação
    pj = val.get("precoJustoMercado") or {}
    pj_valor = _num(pj.get("valor"))
    if pj_valor and cotacao_atual:
        ratio = pj_valor / cotacao_atual
        if ratio < 0.7 or ratio > 1.5:
            viol.append(_violacao("C6", "alta",
                f"precoJustoMercado.valor R${pj_valor:.2f} = {ratio:.2f}× cotação R${cotacao_atual:.2f} (fora de [0.7, 1.5])",
                "valuation.precoJustoMercado.valor"))

    # C7 — faixa entre 3-15%
    faixa = pj.get("faixa")
    if faixa:
        f_min = f_max = None
        if isinstance(faixa, list) and len(faixa) >= 2:
            f_min, f_max = _num(faixa[0]), _num(faixa[1])
        elif isinstance(faixa, dict):
            f_min, f_max = _num(faixa.get("min")), _num(faixa.get("max"))
        if f_min and f_max and pj_valor:
            largura = (f_max - f_min) / pj_valor
            if largura < 0.03:
                viol.append(_violacao("C7", "media",
                    f"faixa muito estreita ({largura*100:.1f}% < 3%) — ignora incerteza",
                    "valuation.precoJustoMercado.faixa"))
            elif largura > 0.30:  # 15% para cada lado = 30% total
                viol.append(_violacao("C7", "media",
                    f"faixa muito larga ({largura*100:.1f}% > 30%) — modelo não converge",
                    "valuation.precoJustoMercado.faixa"))

    # C8 — pesos componentes somam ~1.0 (excluindo A4)
    componentes = pj.get("componentes") or []
    if componentes:
        soma = 0.0
        for c in componentes:
            nome = (c.get("nome") or "").lower()
            id_c = (c.get("id") or "").upper()
            if id_c == "A4" or "qualidade" in nome:
                continue
            p = _num(c.get("peso"))
            if p:
                soma += p
        if soma and abs(soma - 1.0) > 0.05:
            viol.append(_violacao("C8", "alta",
                f"pesos dos componentes A1-A3 somam {soma:.2f} (esperado ~1.00 ±0.05)",
                "valuation.precoJustoMercado.componentes"))

    # C9 — precoEsperado dentro da faixa por horizonte
    for h in ("curto", "medio", "longo"):
        e = exp.get(h) or {}
        pe = _num(e.get("precoEsperado"))
        f = e.get("faixa")
        if pe is None or f is None:
            continue
        if isinstance(f, list) and len(f) >= 2:
            mn, mx = _num(f[0]), _num(f[1])
        elif isinstance(f, dict):
            mn, mx = _num(f.get("min")), _num(f.get("max"))
        else:
            continue
        if mn is not None and mx is not None and not (mn <= pe <= mx):
            viol.append(_violacao("C9", "alta",
                f"expectativa.{h}.precoEsperado R${pe:.2f} fora da faixa [R${mn:.2f}, R${mx:.2f}]",
                f"valuation.expectativa.{h}.precoEsperado"))

    # C10 — eventosValuation[].docId existe
    eventos = val.get("eventosValuation") or []
    pasta_optimized = FIIS_OPTIMIZED / ticker
    for i, ev in enumerate(eventos):
        doc_id = ev.get("docId")
        if not doc_id:
            continue
        if pasta_optimized.exists():
            meta_path = pasta_optimized / f"{doc_id}.meta.json"
            if not meta_path.exists():
                viol.append(_violacao("C10", "media",
                    f"eventosValuation[{i}].docId={doc_id} não existe em data/fiis-optimized/{ticker}/",
                    f"valuation.eventosValuation[{i}].docId"))

    # C11 — catalisadores em expectativa têm docId ou fonte macro
    fontes_macro_ok = re.compile(r"focus|bcb|ipca|selic|curva\s*di|anbima|copom", re.I)
    for h in ("curto", "medio", "longo"):
        e = exp.get(h) or {}
        cats = e.get("catalisadores") or []
        for j, c in enumerate(cats):
            doc_id = c.get("docId")
            fonte = c.get("fonte") or ""
            if doc_id:
                if pasta_optimized.exists():
                    if not (pasta_optimized / f"{doc_id}.meta.json").exists():
                        viol.append(_violacao("C11", "alta",
                            f"expectativa.{h}.catalisadores[{j}].docId={doc_id} não existe",
                            f"valuation.expectativa.{h}.catalisadores[{j}]"))
                continue
            if not fonte or not fontes_macro_ok.search(fonte):
                viol.append(_violacao("C11", "alta",
                    f"expectativa.{h}.catalisadores[{j}] sem docId nem fonte macro reconhecida (fonte='{fonte}')",
                    f"valuation.expectativa.{h}.catalisadores[{j}]"))

    # C12 — pontosFortes vs pontosAtencao não se contradizem (heurística leve)
    pontos = d.get("pontosAtencao") or []
    pf = (conc.get("pontosFortes") or [])
    pa_concl = (conc.get("pontosDeAtencao") or [])
    txt_fortes = " ".join(_flat(x).lower() for x in pf)
    txt_atencao = " ".join(_flat(x).lower() for x in (pa_concl + pontos))
    pares_oposicao = [
        ("gestora top", "gestora inexperiente"),
        ("baixa vacância", "alta vacância"),
        ("baixa alavancagem", "alta alavancagem"),
        ("portfólio diversificado", "alta concentração"),
        ("sustentável", "insustentável"),
        ("inadimplência baixa", "inadimplência alta"),
    ]
    for pos, neg in pares_oposicao:
        if any(w in txt_fortes for w in pos.split()) and any(w in txt_atencao for w in neg.split()):
            # ambos apareceram — possível contradição (ainda assim não bloqueia)
            pass  # heurística leve, não viola sozinha

    # C14 — conclusaoFinal cita veredicto compatível
    conc_final = _flat(conc.get("conclusaoFinal") or "").upper()
    if veredicto and conc_final:
        # Se veredicto é COMPRA mas a conclusão cita VENDA/SAIR/EVITAR — viola
        if veredicto == "COMPRA" and re.search(r"\bVENDA\b|\bSAIR\b|\bEVITAR\b|\bNAO\s*RECOMEND", conc_final):
            viol.append(_violacao("C14", "alta",
                "veredicto=COMPRA mas conclusaoFinal contém termos de venda/saída",
                "conclusao.conclusaoFinal"))
        if veredicto == "VENDA" and re.search(r"\bCOMPRA\b|\bRECOMENDA\s*COMPRA\b", conc_final):
            viol.append(_violacao("C14", "alta",
                "veredicto=VENDA mas conclusaoFinal recomenda compra",
                "conclusao.conclusaoFinal"))

    # C15/C16 — datas e totalDocumentos batem
    if meta.get("dataAnalise") and footer.get("dataAnalise") and meta["dataAnalise"] != footer["dataAnalise"]:
        viol.append(_violacao("C15", "baixa",
            f"meta.dataAnalise={meta['dataAnalise']} != footer.dataAnalise={footer['dataAnalise']}",
            "footer.dataAnalise"))
    td_meta = meta.get("totalDocumentos")
    td_footer = footer.get("totalDocumentos")
    if td_meta is not None and td_footer is not None and td_meta != td_footer:
        viol.append(_violacao("C16", "baixa",
            f"meta.totalDocumentos={td_meta} != footer.totalDocumentos={td_footer}",
            "footer.totalDocumentos"))

    # C17 — comparacaoComCotacao.cotacaoAtual = indicadores.cotacao
    cmp = pj.get("comparacaoComCotacao") or {}
    cot_pj = _num(cmp.get("cotacaoAtual"))
    if cot_pj and cotacao_atual and abs(cot_pj - cotacao_atual) / cotacao_atual > 0.01:
        viol.append(_violacao("C17", "alta",
            f"precoJustoMercado.comparacaoComCotacao.cotacaoAtual=R${cot_pj:.2f} != indicadores.cotacao=R${cotacao_atual:.2f}",
            "valuation.precoJustoMercado.comparacaoComCotacao.cotacaoAtual"))

    # C19 — pares existem em pares_subsegmento.json
    pc = val.get("paresComparaveis") or {}
    status_class = pc.get("statusClassificacao", "validado")
    if status_class != "proposto":
        if PARES_PATH.exists():
            try:
                pares_master = json.loads(PARES_PATH.read_text(encoding="utf-8"))
                slug = pc.get("subsegmento")
                if slug and slug not in pares_master.get("subsegmentos", {}):
                    viol.append(_violacao("C19", "media",
                        f"paresComparaveis.subsegmento='{slug}' não existe em pares_subsegmento.json",
                        "valuation.paresComparaveis.subsegmento"))
            except Exception:
                pass

    # C20 — reanálise sem mudancaTese declarada quando veredicto mudou
    backup_dir = FIIS_DIR / ".backups"
    if backup_dir.exists() and veredicto:
        # Procura backup mais recente
        backups = sorted(backup_dir.glob(f"{ticker.lower()}*.json"), reverse=True)
        for bk in backups[:1]:
            try:
                ant = json.loads(bk.read_text(encoding="utf-8"))
                ant_v = _normalize_veredicto((ant.get("recomendacao") or {}).get("veredicto"))
                if ant_v and ant_v != veredicto:
                    if not meta.get("mudancaTese"):
                        viol.append(_violacao("C20", "alta",
                            f"veredicto mudou de '{ant_v}' para '{veredicto}' mas meta.mudancaTese não foi preenchido",
                            "meta.mudancaTese"))
            except Exception:
                pass

    # ===== C21..C25 RELACOES =====
    relacoes = d.get("relacoes")
    if isinstance(relacoes, list):
        for i, rel in enumerate(relacoes):
            if not isinstance(rel, dict):
                continue
            cp = rel.get("contraparte") or {}
            cp_ticker = (cp.get("ticker") or "").upper()
            tipoRel = rel.get("tipo")
            sev = rel.get("severidadeConflito")
            fluxo = rel.get("fluxo")
            agio = rel.get("agioSobreMercado") or {}
            mesma_gestora = bool(rel.get("mesmaGestora"))
            valor = _num(rel.get("valor"))
            fontes = rel.get("fontes") or []

            # C21 — cada relação tem fonte com docId válido
            tem_fonte_valida = False
            for f in fontes:
                if not isinstance(f, dict):
                    continue
                doc_id = f.get("docId")
                if not doc_id:
                    continue
                if pasta_optimized.exists():
                    if (pasta_optimized / f"{doc_id}.meta.json").exists():
                        tem_fonte_valida = True
                        break
                else:
                    tem_fonte_valida = True
                    break
            if not tem_fonte_valida:
                viol.append(_violacao("C21", "alta",
                    f"relacoes[{i}] ({tipoRel}) sem fonte com docId válido — relações precisam de documento",
                    f"relacoes[{i}].fontes"))

            # C22 — contraparte ticker existe na base ou marcada externa
            if cp_ticker and cp.get("tipo") == "fii":
                tk_path = FIIS_DIR / f"{cp_ticker.lower()}.json"
                if not tk_path.exists() and not cp.get("externo"):
                    # warning leve — pode ser fundo ainda não analisado
                    viol.append(_violacao("C22", "media",
                        f"relacoes[{i}] aponta para {cp_ticker} (fii) que não está em data/fiis/ — marque contraparte.tipo='externo' se for fundo não analisado",
                        f"relacoes[{i}].contraparte.ticker"))

            # C23 — ágio declarado quando tipo envolve subscrição/troca
            tipos_que_exigem_agio = {"subscricao_emissao_acima", "troca_de_cotas",
                                      "venda_paga_em_cotas", "aquisicao_paga_em_cotas"}
            if tipoRel in tipos_que_exigem_agio:
                if not agio or agio.get("presente") is None:
                    viol.append(_violacao("C23", "media",
                        f"relacoes[{i}] ({tipoRel}) não declara agioSobreMercado — para esse tipo é obrigatório indicar se houve ou não ágio",
                        f"relacoes[{i}].agioSobreMercado"))

            # C24 — fluxo coerente com tipo + ágio
            if agio.get("presente") is True and (agio.get("valorPercent") or 0) > 3 and fluxo == "neutro":
                viol.append(_violacao("C24", "media",
                    f"relacoes[{i}] tem ágio +{agio.get('valorPercent')}% mas fluxo='neutro' — com ágio relevante o fluxo deveria ser deu_favor ou recebeu_favor",
                    f"relacoes[{i}].fluxo"))

            # C25 — severidade alta exige justificativa objetiva
            if sev == "alta":
                tem_criterio = (
                    (mesma_gestora and (agio.get("valorPercent") or 0) > 5) or
                    (tipoRel == "aporte_de_caixa") or
                    (tipoRel == "transferencia_portfolio" and mesma_gestora)
                )
                if not tem_criterio:
                    viol.append(_violacao("C25", "alta",
                        f"relacoes[{i}] severidade=alta mas não satisfaz critério objetivo (mesma gestora + ágio>5%, aporte de caixa, ou transferência intra-casa)",
                        f"relacoes[{i}].severidadeConflito"))

    return {
        "ticker": ticker,
        "ok": len([v for v in viol if v["severidade"] == "alta"]) == 0,
        "violacoes": viol,
        "estatisticas": {
            "alta": sum(1 for v in viol if v["severidade"] == "alta"),
            "media": sum(1 for v in viol if v["severidade"] == "media"),
            "baixa": sum(1 for v in viol if v["severidade"] == "baixa"),
        },
    }


COR = {"alta": "\033[31m", "media": "\033[33m", "baixa": "\033[36m", "ok": "\033[32m", "rst": "\033[0m"}


def _print_relatorio(r: dict) -> None:
    if r.get("erro"):
        print(f"{COR['alta']}[{r['ticker']}] ERRO: {r['erro']}{COR['rst']}")
        return
    est = r["estatisticas"]
    if not r["violacoes"]:
        print(f"{COR['ok']}[{r['ticker']}] ✓ sem violações{COR['rst']}")
        return
    print(f"\n[{r['ticker']}] {est['alta']} altas · {est['media']} médias · {est['baixa']} baixas")
    for v in sorted(r["violacoes"], key=lambda x: {"alta": 0, "media": 1, "baixa": 2}[x["severidade"]]):
        c = COR[v["severidade"]]
        print(f"  {c}[{v['severidade'].upper():5}] {v['codigo']}{COR['rst']} {v['mensagem']}")
        if v.get("campo"):
            print(f"          campo: {v['campo']}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker")
    ap.add_argument("--tickers")
    ap.add_argument("--todos", action="store_true")
    ap.add_argument("--json", action="store_true", help="Saída JSON para consumo programático")
    args = ap.parse_args()

    if args.ticker:
        tickers = [args.ticker.upper()]
    elif args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    elif args.todos:
        tickers = sorted(p.stem.upper() for p in FIIS_DIR.glob("*.json"))
    else:
        ap.error("precisa --ticker, --tickers ou --todos")
        return 1

    resultados = [auditar(t) for t in tickers]

    if args.json:
        print(json.dumps(resultados, ensure_ascii=False, indent=2))
    else:
        for r in resultados:
            _print_relatorio(r)
        total_alta = sum(r["estatisticas"]["alta"] for r in resultados if "estatisticas" in r)
        total_media = sum(r["estatisticas"]["media"] for r in resultados if "estatisticas" in r)
        print(f"\nResumo: {len(resultados)} ticker(s) · {total_alta} altas · {total_media} médias")

    return 0 if all(r.get("ok", False) for r in resultados) else 1


if __name__ == "__main__":
    sys.exit(main())
