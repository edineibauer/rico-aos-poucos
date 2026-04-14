"""Parser para avisos de distribuição de rendimentos / amortização.

Geralmente são PDFs curtos (1-2 páginas) com campos chave:
    - Valor por cota
    - Data de pagamento
    - Data ex
    - Período de competência

Como o texto vem de pdftotext, estamos parseando texto linear.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class RendimentoDados:
    valor_cota: float | None = None
    data_pagamento: str | None = None
    data_com: str | None = None
    data_ex: str | None = None
    competencia: str | None = None


def _numero(texto: str) -> float | None:
    if not texto:
        return None
    t = texto.strip().replace("R$", "").replace(".", "").replace(",", ".").strip()
    t = re.sub(r"[^0-9.\-]", "", t)
    try:
        return float(t)
    except ValueError:
        return None


VALOR_PATTERNS = [
    r"valor[^\n]*cota[^\n]*?R?\$?\s*([\d.,]+)",
    r"rendimento[^\n]*cota[^\n]*?R?\$?\s*([\d.,]+)",
    r"R\$\s*([\d.,]+)\s*/\s*cota",
]

DATA_PAGAMENTO_PATTERNS = [
    r"data[^\n]*pagamento[^\n]*?(\d{2}/\d{2}/\d{4})",
    r"data[^\n]*pgto[^\n]*?(\d{2}/\d{2}/\d{4})",
]


def extrair(texto: str) -> RendimentoDados:
    t = texto.lower()
    dados = RendimentoDados()

    for pat in VALOR_PATTERNS:
        m = re.search(pat, t, re.IGNORECASE)
        if m:
            dados.valor_cota = _numero(m.group(1))
            if dados.valor_cota:
                break

    for pat in DATA_PAGAMENTO_PATTERNS:
        m = re.search(pat, t, re.IGNORECASE)
        if m:
            dados.data_pagamento = m.group(1)
            break

    m = re.search(r"data[^\n]*ex[\b-][^\n]*?(\d{2}/\d{2}/\d{4})", t, re.IGNORECASE)
    if m:
        dados.data_ex = m.group(1)
    m = re.search(r"data[^\n]*com[^\n]*?(\d{2}/\d{2}/\d{4})", t, re.IGNORECASE)
    if m:
        dados.data_com = m.group(1)

    m = re.search(r"compet[eê]ncia[^\n]*?([\w./-]+)", t, re.IGNORECASE)
    if m:
        dados.competencia = m.group(1).strip()

    return dados


def gerar_patch(dados: RendimentoDados) -> dict:
    if dados.valor_cota is None:
        return {}
    indicadores = {"dividendoMensal": round(dados.valor_cota, 2)}
    # dividendo anual estimado a partir do mensal (1 publicação)
    indicadores["dividendoAnual"] = round(dados.valor_cota * 12, 2)
    return {"indicadores": indicadores}
