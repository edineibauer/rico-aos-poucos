"""Parser do Informe Mensal Estruturado (Anexo 39-I).

Formato: HTML com entidades (&ocirc;, &iacute;, etc.) e classe `valores`
marcando células de dado. Exemplo:

    <tr>
      <td>Patrim&ocirc;nio L&iacute;quido &ndash; R$</td>
      <td class="valores">235.612.345,67</td>
    </tr>

Extração: desescapar HTML, achar label, ler próxima célula `class="valores"`.
"""
from __future__ import annotations

import html as _html
import re
from dataclasses import dataclass


@dataclass
class InformeMensalDados:
    patrimonio_liquido: float | None = None
    valor_patrimonial_cota: float | None = None
    cotistas: int | None = None
    cotas_emitidas: int | None = None
    rendimento_mes: float | None = None
    mes_referencia: str | None = None


def _numero_br(texto: str) -> float | None:
    """Converte '235.612.345,67' → 235612345.67."""
    if not texto:
        return None
    t = texto.strip()
    # remove R$ e qualquer coisa não-numérica exceto . , -
    t = re.sub(r"[^\d.,\-]", "", t)
    # formato BR: . é milhar, , é decimal
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    elif t.count(".") > 1:
        # vários pontos sem vírgula → tratamos como milhar
        t = t.replace(".", "")
    try:
        return float(t)
    except ValueError:
        return None


def _inteiro(valor: float | None) -> int | None:
    if valor is None:
        return None
    try:
        n = int(round(valor))
        return n if n > 0 else None
    except (TypeError, ValueError):
        return None


def _normalizar_html(html: str) -> str:
    """Unescape + colapsa whitespace. Mantém tags."""
    txt = _html.unescape(html)
    txt = re.sub(r"\s+", " ", txt)
    return txt


def _extrair_valor_apos_label(html_norm: str, *labels: str) -> str | None:
    """Encontra primeiro `<span class="dado-valores">VALOR</span>` após o label.

    Estrutura típica do Anexo 39-I:
        <td><b>Patrimônio Líquido – R$ </b></td>
        <td><span class="dado-valores">354.069.711,85</span></td>

    Aceita label parcial (ex.: 'Patrimônio Líquido' encontra 'Patrimônio Líquido – R$').
    """
    for label in labels:
        pattern = re.compile(
            re.escape(label)
            + r'.{0,200}?<span\s+class="dado-valores"[^>]*>\s*([^<]+?)\s*</span>',
            re.IGNORECASE | re.DOTALL,
        )
        m = pattern.search(html_norm)
        if m:
            return m.group(1).strip()
    return None


def extrair(html: str) -> InformeMensalDados:
    norm = _normalizar_html(html)
    dados = InformeMensalDados()

    pl = _extrair_valor_apos_label(norm, "Patrimônio Líquido")
    if pl:
        dados.patrimonio_liquido = _numero_br(pl)

    vp = _extrair_valor_apos_label(norm, "Valor Patrimonial das Cotas",
                                   "Patrimonial das Cotas", "Valor Patrimonial")
    if vp:
        dados.valor_patrimonial_cota = _numero_br(vp)

    # Cotistas: procura em seção específica. Se não achar, fica None.
    cots = _extrair_valor_apos_label(norm, "Número de Cotistas",
                                     "Quantidade de Cotistas",
                                     "Total de Cotistas")
    if cots:
        n_cots = _inteiro(_numero_br(cots))
        # filtro de sanidade: cotistas plausível (100 ≤ N ≤ 10M); exclui datas.
        if n_cots and 100 <= n_cots <= 10_000_000:
            dados.cotistas = n_cots

    cotas = _extrair_valor_apos_label(norm, "Número de Cotas Emitidas",
                                      "Quantidade de Cotas Emitidas", "Cotas Emitidas")
    if cotas:
        dados.cotas_emitidas = _inteiro(_numero_br(cotas))

    rend = _extrair_valor_apos_label(norm, "Rendimentos a distribuir",
                                     "Rendimento Distribuído")
    if rend:
        dados.rendimento_mes = _numero_br(rend)

    mes = _extrair_valor_apos_label(norm, "Mês de Referência", "Mes de Referencia", "Competência")
    if mes:
        dados.mes_referencia = mes

    return dados


def _formatar_moeda_resumida(valor: float) -> str:
    if valor >= 1_000_000_000:
        return f"R$ {valor / 1_000_000_000:.1f}B"
    if valor >= 1_000_000:
        return f"R$ {valor / 1_000_000:.0f}M"
    if valor >= 1_000:
        return f"R$ {valor / 1_000:.0f}k"
    return f"R$ {valor:.2f}"


def gerar_patch(dados: InformeMensalDados) -> dict:
    """Transforma dados extraídos em patch para o JSON do fundo.

    Calcula dividendo por cota = rendimento_total / cotas_emitidas quando
    ambos disponíveis (o Anexo 39-I traz o total agregado, não o valor unitário).
    """
    indicadores: dict = {}
    if dados.patrimonio_liquido and dados.patrimonio_liquido > 1_000_000:
        indicadores["patrimonioLiquido"] = _formatar_moeda_resumida(dados.patrimonio_liquido)
    if dados.valor_patrimonial_cota and dados.valor_patrimonial_cota > 0:
        indicadores["vpCota"] = round(dados.valor_patrimonial_cota, 2)
    if dados.cotistas:
        indicadores["cotistas"] = dados.cotistas
    # Dividendo/cota = total distribuído / cotas emitidas
    if (dados.rendimento_mes and dados.cotas_emitidas
            and dados.rendimento_mes > 0 and dados.cotas_emitidas > 0):
        por_cota = dados.rendimento_mes / dados.cotas_emitidas
        if 0 < por_cota < 1000:  # sanidade (dividendos típicos de FII: R$ 0,05–R$ 20/cota)
            indicadores["dividendoMensal"] = round(por_cota, 2)
            indicadores["dividendoAnual"] = round(por_cota * 12, 2)

    return {"indicadores": indicadores} if indicadores else {}
