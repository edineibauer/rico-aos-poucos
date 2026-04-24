"""Sumarização semestral (Fase 2 / map) via Claude CLI headless.

Lê data/fiis-extracted/{TICKER}/ e produz data/fiis-extracted/{TICKER}/sumarios/{YYYY}S{1|2}.json
com análise estruturada de cada semestre.

Objetivo: preservar 100% da informação textual em sumários compactos que cabem na
consolidação final.

Uso:
  python3 sumarizar.py HGLG11
  python3 sumarizar.py HGLG11 --workers 4
  python3 sumarizar.py HGLG11 --forcar       # re-sumariza mesmo se JSON existe
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from paths import DATA

FIIS_EXTRACTED = DATA / "fiis-extracted"
# Sumarização = extração factual → Haiku 4.5 (mais barato, rápido). A análise
# final é feita pelo Opus 4.7 1M em consolidar.py.
MODELO = "claude-haiku-4-5-20251001"
TIMEOUT_SEMESTRE = 600
MAX_TEXT_POR_CHAMADA = 400_000  # ~400KB — margem confortável em 200k tokens de Haiku


SYSTEM_SUMARIZACAO = """Você é um analista de FIIs brasileiros. Você recebe documentos oficiais CVM/B3 de um FII referentes a um SEMESTRE específico e produz um sumário estruturado em JSON.

Sua missão: preservar toda informação relevante do semestre em formato compacto, para que seja consolidada depois em análise completa.

Diretrizes de extração:

1. INDICADORES CITADOS: Vasculhe os Informes Mensais, Trimestrais e Anuais (formato tabelar) para extrair os valores numéricos do fundo no final do semestre. Campos esperados:
   - patrimonio_liquido (R$)
   - vp_cota (valor patrimonial por cota, R$)
   - cotistas (número total)
   - quantidade_cotas (emitidas)
   - resultado_liquido_semestre (R$)
   - distribuicao_total_semestre (R$ por cota)
   - dy_anualizado (%, estimativa ou citado)
   - vacancia (%)
   - ocupacao (%)
   - numero_imoveis (se for FII de tijolo)
   - numero_cris (se for FII de papel)
   - pl_por_segmento (opcional, se fundo diversificado)

2. EVENTOS PRINCIPAIS: liste os 3-10 eventos mais relevantes do semestre. Cada evento deve ter:
   - data (YYYY-MM-DD)
   - tipo: "aquisicao" | "venda" | "fato_relevante" | "assembleia" | "emissao" | "amortizacao" | "distribuicao_extraordinaria" | "mudanca_gestao" | "outro"
   - titulo (curto)
   - descricao (1-3 linhas)
   - impacto_percebido: "positivo" | "neutro" | "negativo"
   - valor (R$, se aplicável)

3. MOVIMENTOS_PORTFOLIO: aquisições e vendas concretas com:
   - tipo
   - ativo (nome do imóvel/CRI)
   - valor
   - data
   - cap_rate (se citado)
   - localizacao (se imóvel)

4. INQUILINOS/DEVEDORES (se citados): lista dos principais com % da receita, vencimento contratual, indexador.

5. DECISÕES DA GESTORA: ações tomadas no semestre — alavancagem, emissão, recompra, mudança estratégica.

6. RISCOS IDENTIFICADOS: o que o próprio relatório aponta como ponto de atenção (inadimplência, vacância, distrato, exposição setorial).

7. TENDÊNCIAS/GUIDANCE: frases textuais em que a gestora projeta resultado ou distribuição. Capture citações literais ("esperamos", "tendência", "nos próximos meses", guidance formal).

8. CONTEXTO_MACRO: menções a Selic, IPCA, IGP-M, juros longos, cenário setorial — tudo que contextualize o resultado.

9. DISTRIBUIÇÕES_RESUMO:
   - total_semestre (soma dos dividendos pagos)
   - media_mensal
   - teve_extraordinario (bool)
   - mudancas_notaveis (redução, aumento, zeragem)

10. DESTAQUES_QUANTITATIVOS: métricas relevantes que não caibam acima (ex.: TIR, CAP rate médio, prazo médio dos contratos, WAULT, duration do portfólio de CRI).

REGRAS:
- Use português brasileiro com acentos corretos.
- Datas em ISO (YYYY-MM-DD).
- Valores em R$ sempre como número (sem "R$" na string).
- NUNCA invente dados. Se não está no documento, não escreva.
- Se um campo não aplica (ex.: vacância em FII de papel), use null.
- Seja CONCISO mas COMPLETO. Priorize fatos verificáveis.

Responda APENAS com o JSON, sem texto antes ou depois."""


OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["semestre", "periodo", "resumo_executivo"],
    "properties": {
        "semestre": {"type": "string"},
        "periodo": {
            "type": "object",
            "required": ["inicio", "fim"],
            "properties": {
                "inicio": {"type": "string"},
                "fim": {"type": "string"},
            },
        },
        "resumo_executivo": {"type": "string"},
        "indicadores_citados": {"type": "object"},
        "eventos_principais": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "data": {"type": ["string", "null"]},
                    "tipo": {"type": "string"},
                    "titulo": {"type": "string"},
                    "descricao": {"type": "string"},
                    "impacto_percebido": {"type": "string"},
                    "valor": {"type": ["number", "null"]},
                },
            },
        },
        "movimentos_portfolio": {"type": "array"},
        "inquilinos_devedores": {"type": "array"},
        "decisoes_gestora": {"type": "array"},
        "riscos_identificados": {"type": "array"},
        "tendencias_guidance": {"type": ["string", "array"]},
        "contexto_macro": {"type": ["string", "null"]},
        "distribuicoes_resumo": {"type": "object"},
        "destaques_quantitativos": {"type": ["array", "object"]},
    },
}


def semestre(data_entrega: str) -> str | None:
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(data_entrega[:19 if " " in data_entrega else 10], fmt)
            h = 1 if dt.month <= 6 else 2
            return f"{dt.year}S{h}"
        except ValueError:
            continue
    return None


def trimestre(data_entrega: str) -> str | None:
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(data_entrega[:19 if " " in data_entrega else 10], fmt)
            t = (dt.month - 1) // 3 + 1
            return f"{dt.year}T{t}"
        except ValueError:
            continue
    return None


def agrupar_periodo(data_entrega: str, granularidade: str) -> str | None:
    if granularidade == "trimestre":
        return trimestre(data_entrega)
    return semestre(data_entrega)


def _parse_date_br(s: str) -> str | None:
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19 if " " in s else 10], fmt).date().isoformat()
        except Exception:
            continue
    return None


def sumarizar_um(ticker: str, sem: str, docs: list[dict],
                 pasta_extracted: Path, dividendos_do_sem: list[dict]) -> dict:
    """Sumariza UM semestre via claude CLI."""
    pasta_textos = pasta_extracted / "textos"
    pasta_sum = pasta_extracted / "sumarios"
    pasta_sum.mkdir(exist_ok=True)

    saida = pasta_sum / f"{sem}.json"

    # Monta o payload de texto
    partes = [f"# Semestre: {sem}", f"# Total de documentos: {len(docs)}"]
    partes.append(f"# Dividendos pagos neste semestre (extraídos):")
    if dividendos_do_sem:
        for d in dividendos_do_sem:
            partes.append(f"  - data_base={d.get('data_base')}, valor_cota={d.get('valor_cota')}")
    else:
        partes.append("  (nenhum)")
    partes.append("")
    partes.append("# DOCUMENTOS:")

    tamanho_acumulado = 0
    total_truncados = 0
    for doc in sorted(docs, key=lambda d: d.get("dataEntrega", "")):
        fp = pasta_textos / Path(doc["arquivo"]).name
        if not fp.exists():
            continue
        try:
            texto = fp.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        cabecalho = f"\n\n---\n## {doc['tipo']} — {doc.get('dataReferencia','?')} (id={doc['id']})\n"
        bloco = cabecalho + texto
        if tamanho_acumulado + len(bloco) > MAX_TEXT_POR_CHAMADA:
            # trunca o texto deste doc
            restante = MAX_TEXT_POR_CHAMADA - tamanho_acumulado
            if restante < 2000:
                total_truncados += 1
                continue
            bloco = cabecalho + texto[:restante - len(cabecalho)] + "\n[...texto truncado...]"
        partes.append(bloco)
        tamanho_acumulado += len(bloco)

    user_msg = (
        f"Sumarize o semestre {sem} do FII {ticker.upper()} em JSON conforme o schema.\n\n"
        + "\n".join(partes)
        + "\n\nLembre: responda APENAS com JSON."
    )

    cmd = [
        "claude", "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", MODELO,
        "--system-prompt", SYSTEM_SUMARIZACAO,
        "--json-schema", json.dumps(OUTPUT_SCHEMA),
    ]

    inicio = time.time()
    try:
        proc = subprocess.run(cmd, input=user_msg, capture_output=True, text=True,
                              timeout=TIMEOUT_SEMESTRE)
    except subprocess.TimeoutExpired:
        return {"semestre": sem, "ok": False, "erro": "timeout", "duracao": time.time() - inicio}

    dt = time.time() - inicio
    if proc.returncode != 0:
        return {"semestre": sem, "ok": False,
                "erro": f"code={proc.returncode} stderr={proc.stderr[:200]!r}",
                "duracao": dt}

    try:
        envelope = json.loads(proc.stdout)
        if isinstance(envelope.get("structured_output"), dict):
            resultado = envelope["structured_output"]
        else:
            raw = envelope.get("result") or envelope
            if isinstance(raw, str):
                m = re.search(r"\{.*\}", raw, re.DOTALL)
                resultado = json.loads(m.group(0)) if m else {}
            else:
                resultado = raw
    except Exception as e:
        return {"semestre": sem, "ok": False,
                "erro": f"parse: {e} stdout={proc.stdout[:200]!r}",
                "duracao": dt}

    # Salva
    resultado.setdefault("semestre", sem)
    saida.write_text(json.dumps(resultado, indent=2, ensure_ascii=False), encoding="utf-8")
    return {"semestre": sem, "ok": True, "tamanho_json": saida.stat().st_size,
            "duracao": round(dt, 1), "docs_input": len(docs),
            "texto_bytes": tamanho_acumulado, "truncados": total_truncados}


def main() -> int:
    ap = argparse.ArgumentParser(description="Sumarização periódica via Claude")
    ap.add_argument("ticker")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--forcar", action="store_true")
    ap.add_argument("--granularidade", choices=["trimestre", "semestre"], default="trimestre")
    ap.add_argument("--apenas", help="Apenas estes períodos (CSV: 2025T1,2024T4)")
    args = ap.parse_args()

    ticker = args.ticker.upper()
    pasta = FIIS_EXTRACTED / ticker
    if not pasta.exists():
        print(f"[erro] {pasta} não existe. Rode extrair.py antes.")
        return 1

    idx = json.loads((pasta / "index-textos.json").read_text(encoding="utf-8"))
    divs = json.loads((pasta / "dividendos.json").read_text(encoding="utf-8"))

    grupos_docs = defaultdict(list)
    for d in idx:
        s = agrupar_periodo(d.get("dataEntrega", ""), args.granularidade)
        if s:
            grupos_docs[s].append(d)

    grupos_divs = defaultdict(list)
    for d in divs:
        db = d.get("data_base") or d.get("data_pagamento") or d.get("data_referencia")
        if db:
            try:
                dt = datetime.strptime(db, "%Y-%m-%d")
                if args.granularidade == "trimestre":
                    t = (dt.month - 1) // 3 + 1
                    grupos_divs[f"{dt.year}T{t}"].append(d)
                else:
                    h = 1 if dt.month <= 6 else 2
                    grupos_divs[f"{dt.year}S{h}"].append(d)
            except Exception:
                pass

    semestres = sorted(grupos_docs.keys())
    if args.apenas:
        alvo = set(s.strip() for s in args.apenas.split(","))
        semestres = [s for s in semestres if s in alvo]

    # Filtra quem já tem sumário
    pasta_sum = pasta / "sumarios"
    pasta_sum.mkdir(exist_ok=True)
    if not args.forcar:
        pendentes = [s for s in semestres if not (pasta_sum / f"{s}.json").exists()]
        pulados = len(semestres) - len(pendentes)
    else:
        pendentes = semestres
        pulados = 0

    print(f"[sumarizar] {ticker}: {len(semestres)} semestres, pendentes={len(pendentes)}, "
          f"pulados={pulados}, workers={args.workers}")

    if not pendentes:
        print("[ok] nada a fazer.")
        return 0

    inicio_global = time.time()
    resultados = []

    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        futuros = {}
        for sem in pendentes:
            futuros[ex.submit(sumarizar_um, ticker, sem, grupos_docs[sem],
                               pasta, grupos_divs[sem])] = sem
        for i, fut in enumerate(as_completed(futuros), start=1):
            sem = futuros[fut]
            try:
                r = fut.result()
            except Exception as e:
                r = {"semestre": sem, "ok": False, "erro": str(e)[:200]}
            resultados.append(r)
            status = "OK" if r.get("ok") else f"ERR({r.get('erro','?')[:40]})"
            print(f"  [{i:2d}/{len(pendentes)}] {sem:6s} {status:30s} "
                  f"{r.get('duracao',0):.0f}s  docs={r.get('docs_input','?')}  "
                  f"out_bytes={r.get('tamanho_json','?')}",
                  flush=True)

    dt = time.time() - inicio_global
    ok = sum(1 for r in resultados if r.get("ok"))
    print(f"\n[sumarizar] concluído em {dt/60:.1f}min — ok={ok}/{len(pendentes)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
