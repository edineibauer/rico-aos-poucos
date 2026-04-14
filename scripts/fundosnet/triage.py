"""Triagem determinística de documentos do Fundos.NET.

Decide o que fazer com cada documento a partir de `categoriaDocumento` +
`tipoDocumento`, sem custo de IA.

Ações possíveis:
    - llm_article  → relevância alta, merece análise + artigo
    - llm_update   → merece análise, mas só atualiza JSON (sem artigo)
    - deterministic→ não precisa IA, parser dedicado extrai dados
    - ignore       → descarta
"""
from __future__ import annotations

from dataclasses import dataclass

# (categoria, tipo) → ação.  Match por substring case-insensitive no tipo.
# Categorias principais vistas no Fundos.NET:
#   "Aviso aos Cotistas"
#   "Comunicado ao Mercado"
#   "Fato Relevante"
#   "Informes Periódicos"
#   "Assembleia"
#   "Demonstrações Financeiras"
#   "Relatórios"
#   "Política de Governança"


@dataclass(frozen=True)
class TriageDecision:
    severity: str   # "alta" | "media" | "baixa" | "nula"
    action: str     # "llm_article" | "llm_update" | "deterministic" | "ignore"
    parser: str | None = None  # nome do parser determinístico, se aplicável
    motivo: str = ""


def _n(s: str | None) -> str:
    return (s or "").strip().lower()


def classify(doc: dict) -> TriageDecision:
    cat = _n(doc.get("categoriaDocumento"))
    tipo = _n(doc.get("tipoDocumento"))

    # ALTA — material para artigo + update
    if "fato relevante" in tipo or "fato relevante" in cat:
        return TriageDecision("alta", "llm_article", motivo="fato relevante")
    if "comunicado ao mercado" in tipo:
        return TriageDecision("alta", "llm_article", motivo="comunicado ao mercado")
    if "convocação" in tipo or "convocacao" in tipo or "ata" in tipo and "assembleia" in cat:
        return TriageDecision("alta", "llm_article", motivo="assembleia — deliberação")

    # BAIXA — Informe Mensal e Rendimentos são complexos no regime RCVM 175
    # (tudo marcado como "Classe", PLs refletem apenas a classe específica).
    # Estratégia: IA decide se os números se aplicam à classe principal do ticker.
    # O parser determinístico é invocado como pré-processamento pra REDUZIR
    # tokens enviados à IA (passamos dados extraídos + texto curto).
    if "informe mensal" in tipo:
        return TriageDecision("baixa", "llm_update", parser="informe_mensal",
                              motivo="informe mensal estruturado (via IA p/ decidir classe)")
    if "rendimentos" in tipo or "amortizações" in tipo or "amortizacoes" in tipo:
        return TriageDecision("baixa", "llm_update", parser="rendimentos",
                              motivo="distribuição/amortização (via IA p/ decidir classe)")

    # MÉDIA — análise IA só para timeline/pontos de atenção, sem artigo
    if "relatório gerencial" in tipo or "relatorio gerencial" in tipo:
        return TriageDecision("media", "llm_update", motivo="relatório gerencial")
    if "demonstrações financeiras" in tipo or "demonstracoes financeiras" in tipo:
        return TriageDecision("media", "llm_update", motivo="demonstrações financeiras")
    if "informe trimestral" in tipo or "informe anual" in tipo:
        return TriageDecision("media", "llm_update", motivo="informe periódico não-mensal")

    # NULA — descarta
    return TriageDecision("nula", "ignore", motivo=f"tipo não mapeado: {tipo!r}")
