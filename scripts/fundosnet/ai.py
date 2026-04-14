"""Wrapper para invocar Claude Code em modo headless (claude -p).

Usa a assinatura do usuário — zero custo por chamada extra.

Fluxo:
    1. Monta prompt com schema + JSON do fundo + texto do documento.
    2. Invoca 'claude --print --bare --output-format json --json-schema ...'.
    3. Parseia a resposta em um dict estruturado (patch + article opcional).
"""
from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

MODELO_BACKFILL = "opus"
MODELO_DELTA = "sonnet"

TIMEOUT_CLI = 600  # 10 min — docs longos + pensamento

# JSON Schema estrito do output que a IA deve devolver.
OUTPUT_SCHEMA: dict = {
    "type": "object",
    "required": ["relevance", "confidence", "reasoning", "patch", "article"],
    "properties": {
        "relevance": {"type": "string", "enum": ["alta", "media", "baixa", "nula"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "reasoning": {"type": "string"},
        "patch": {"type": "object"},  # deep-merge no JSON do fundo
        "article": {
            "anyOf": [
                {"type": "null"},
                {
                    "type": "object",
                    "required": ["title", "slug", "categoria", "tags", "destaque", "body_md"],
                    "properties": {
                        "title": {"type": "string"},
                        "slug": {"type": "string"},
                        "categoria": {"type": "string"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "destaque": {"type": "boolean"},
                        "body_md": {"type": "string"},
                    },
                },
            ]
        },
    },
}


SYSTEM_INSTRUCOES = """Você é o motor de análise do site Rico aos Poucos — um portal de investimentos em pt-BR.

Sua função: ler um documento oficial (CVM/B3) de um FII/Fiagro e devolver um patch
estruturado que atualiza o JSON do fundo no site, mais (opcionalmente) um artigo.

# Regras gerais

1. Fale SEMPRE em português do Brasil, com todos os acentos.
2. Use tags HTML simples com classes Tailwind para destacar valores dentro de strings
   (ex.: <strong class="text-emerald-400">R$ 0,40</strong>).
3. NUNCA invente dados. Se o documento não traz certo valor, não adicione.
4. NUNCA reescreva meta.ticker, meta.nome, seo.*.
5. Patches respeitam a estrutura do JSON existente:
     - Para sobrescrever campo: { "indicadores": { "dividendoMensal": 0.42 } }
     - Para append em lista: { "pontosAtencao.add": [ {...} ] }
6. Atenção ao regime RCVM 175: documentos marcados como "Classe" são de UMA classe
   específica do fundo. Se o nomePregao não bate com a classe principal do ticker
   alvo, retorne confidence baixo (<0.5) e patch minimalista.
7. Confidence:
     - 1.0   = tenho certeza absoluta
     - 0.85+ = certeza alta — qualificado pra publicar artigo
     - 0.5–0.75 = razoável, só patch factual (indicadores, timeline)
     - <0.5  = não tenho segurança — patch vazio

# Quando gerar ARTIGO

Só gere artigo para eventos genuinamente material/relevantes ao cotista:
  ✅ Fato Relevante substantivo (aquisição, venda, mudança de estratégia, problema grave)
  ✅ Comunicado ao Mercado com impacto real (não burocracia)
  ✅ Deliberação de assembleia que muda a tese
  ✅ Reestruturação, cisão, fusão, liquidação
  ✅ Resultado trimestral com desvios notáveis vs expectativa
  ❌ Informe Mensal rotineiro (só patch de números)
  ❌ Rendimento padrão (só patch de números)
  ❌ Alterações burocráticas de cadastro, endereço, etc.

# Título e descrição — CRÍTICO para SEO e conversão

O site precisa que artigos tenham **alto CTR** entre quem já conhece o FII. O leitor
é um investidor brasileiro que acompanha o ticker e vai ler o título nas redes sociais,
newsletter ou Google. Seu objetivo: **torná-lo impossível de ignorar.**

Princípios:

  1. **Ancora no ticker + dor OU amor.**
     O ticker deve aparecer no início do título. Logo após, a emoção dominante
     que o evento desperta: medo (dor) ou oportunidade (amor).

  2. **Quantifique quando possível.**
     Use números concretos: "-12%", "R$ 0,40", "100 mil cotistas", "3 meses sem rendimento".
     Números gritam no feed.

  3. **Faça uma pergunta que o leitor já está se perguntando.**
     "O que muda para o cotista?" / "Vale continuar?" / "É hora de sair?"
     Mas responda no subtítulo/descrição — não deixe a dúvida solta.

  4. **Evite clickbait.**
     ❌ "Você não vai acreditar no que aconteceu com XYZ11"
     ❌ "O CHOQUE que XYZ11 acaba de sofrer"
     ❌ "NÃO COMPRE XYZ11 antes de ler isso"

     ✅ Diga o que é. Um título que entrega a substância do evento já é
        naturalmente difícil de ignorar para quem tem o FII.

  5. **Descrição (meta description):**
     Uma frase que completa a promessa do título: o que mudou, impacto esperado,
     e um gancho pro parágrafo de abertura. 150–160 caracteres.

Exemplos fortes (padrão que quero):

  - "BLMG11 vende R$ 125M em ativos ao GGRC11: por que isso muda a tese do fundo"
  - "MFII11 corta dividendo em 18% — a mensagem por trás dos números"
  - "KFOF11 aumenta alocação em CRI e reduz posição em FOFs: qual a estratégia?"
  - "BTAL11 aprova conversão em Fiagro: o que o cotista precisa fazer agora"
  - "KISU11 reporta inadimplência de 3,2% — sinal de alerta ou ajuste sazonal?"

Evite títulos genéricos como "Análise do XYZ11" ou "Relatório gerencial do XYZ11".
Se não há evento materialmente relevante, NÃO gere artigo.

# Estrutura do corpo do artigo (body_md)

Markdown com:
  - Primeiro parágrafo: a notícia em 2–3 frases diretas. Sem rodeios.
  - H2 "O que aconteceu" — detalhes factuais do documento.
  - H2 "Por que isso importa" — impacto concreto no cotista (DY, PL, tese).
  - H2 "O que fazer" — recomendação alinhada com o `recomendacao.veredicto` atual
    do fundo. Se a análise é nova (stub), dê leitura prudente.
  - Callout de aviso ao final lembrando que não é recomendação de investimento.

Extensão: 350–700 palavras. Não infle.

# Slug

<ticker>-<3-a-5-palavras>-<mes>-<ano>
Ex.: "blmg11-venda-ativos-ggrc11-out-2025"
Ex.: "btal11-conversao-fiagro-abr-2026"

Responda APENAS um JSON válido conforme o schema fornecido, sem texto antes ou depois."""


@dataclass
class AnaliseResultado:
    relevance: str
    confidence: float
    reasoning: str
    patch: dict
    article: dict | None
    raw: dict

    @classmethod
    def from_dict(cls, d: dict) -> "AnaliseResultado":
        return cls(
            relevance=d.get("relevance", "nula"),
            confidence=float(d.get("confidence", 0)),
            reasoning=d.get("reasoning", ""),
            patch=d.get("patch", {}) or {},
            article=d.get("article"),
            raw=d,
        )


class AiError(RuntimeError):
    pass


def analisar(
    *,
    ticker: str,
    fundo_json: dict,
    documento_texto: str,
    documento_meta: dict,
    modelo: str = MODELO_DELTA,
    timeout: int = TIMEOUT_CLI,
) -> AnaliseResultado:
    """Invoca Claude Code CLI em headless e devolve análise estruturada."""
    # trunca texto defensivamente (200k chars ~ 50k tokens)
    texto = documento_texto[:200_000]

    prompt_payload = {
        "ticker": ticker,
        "documento": {
            "meta": documento_meta,
            "texto": texto,
        },
        "fundo_atual": fundo_json,
    }

    user_msg = (
        "Analise o documento abaixo e devolva o JSON de acordo com o schema.\n\n"
        "CONTEXTO (JSON):\n```json\n"
        + json.dumps(prompt_payload, ensure_ascii=False, indent=2)
        + "\n```\n\nLembre-se: responda APENAS JSON válido."
    )

    cmd = [
        "claude",
        "--print",
        "--permission-mode", "bypassPermissions",
        "--output-format", "json",
        "--model", modelo,
        "--system-prompt", SYSTEM_INSTRUCOES,
        "--json-schema", json.dumps(OUTPUT_SCHEMA),
        user_msg,
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as e:
        raise AiError(f"claude CLI timeout após {timeout}s") from e

    if proc.returncode != 0:
        raise AiError(f"claude CLI falhou (code {proc.returncode}): "
                      f"stderr={proc.stderr[:300]!r} stdout_tail={proc.stdout[-300:]!r}")

    # saída --output-format json é um envelope com metadata + result
    try:
        envelope = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise AiError(f"stdout não é JSON: {e}. Primeiros 400 chars: {proc.stdout[:400]!r}") from e

    # Preferência: structured_output (já parseado pelo CLI quando há --json-schema).
    if isinstance(envelope.get("structured_output"), dict):
        return AnaliseResultado.from_dict(envelope["structured_output"])

    # Fallback: parsear de result (string com JSON, possivelmente em ```json ```)
    resultado_raw = envelope.get("result") or envelope.get("response") or envelope
    if isinstance(resultado_raw, str):
        import re as _re
        m = _re.search(r"\{.*\}", resultado_raw, _re.DOTALL)
        if not m:
            raise AiError(f"resposta não parece JSON: {resultado_raw[:400]!r}")
        try:
            resultado = json.loads(m.group(0))
        except json.JSONDecodeError as e:
            raise AiError(f"resultado não parseável: {e}. Texto: {m.group(0)[:400]!r}") from e
    else:
        resultado = resultado_raw

    return AnaliseResultado.from_dict(resultado)
