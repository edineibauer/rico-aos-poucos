# Plano — Pipeline Fundos.NET → Rico aos Poucos

> Automatizar **ingestão + análise + publicação** de informações de FIIs/Fiagros
> a partir das publicações oficiais do portal Fundos.NET (CVM/B3), sem
> intervenção humana a cada ciclo.

## Objetivo em uma frase

> A cada hora, um cron lê o que foi publicado no Fundos.NET, identifica
> documentos relevantes para fundos que a gente cobre, atualiza o JSON
> daquele fundo e publica um artigo se for material — tudo idempotente
> e auditável.

## Arquitetura resumida

```
┌─────────────────────────────────────────────────────────────┐
│  CRON horário (CronCreate / Remote Trigger)                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  scripts/fundosnet/run.py  (orquestrador com lock)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. client.py        → GET pesquisarGerenciadorDocumentos  │
│                                                             │
│  2. mapper.py        → nomePregao + CNPJ → ticker local    │
│                        (descarta fundos fora do universo)  │
│                                                             │
│  3. seen.py          → filtra IDs já processados            │
│                                                             │
│  4. triage.py        → classifica por tipoDocumento:        │
│                        • ALTA  → análise LLM + artigo       │
│                        • MÉDIA → análise LLM (só update)    │
│                        • BAIXA → extração determinística    │
│                        • NULA  → descarta                   │
│                                                             │
│  5. client.py        → exibirDocumento (Base64 → PDF/HTML) │
│     extract.py       → pdftotext / html parser              │
│                                                             │
│  6. ai.py            → Claude API (prompt cached)           │
│                        input: JSON atual do fundo + texto   │
│                        output: diff JSON + rascunho artigo  │
│                                                             │
│  7. apply.py         → valida diff, faz backup, aplica      │
│                        atualiza data/fiis/<ticker>.json     │
│                        publica artigos/<slug>.html          │
│                        registra em seen.json                │
│                                                             │
│  8. report.py        → log estruturado da execução          │
│                        (data/fundosnet-log/YYYY-MM-DD.json) │
└─────────────────────────────────────────────────────────────┘
```

## Fases

### Fase 0 — Fundações (sem isso nada roda)

**0.1. Universo coberto**
- Listar: 87 FIIs atuais em `data/fiis/` + fundos recomendados em `data/fiis-recomendados.json` que ainda não tenham JSON + Fiagros (novo universo).
- Saída: `data/fundosnet-universo.json` — `{ ticker, cnpj, nomePregao[], nomeCompleto, cobertura: "ativa" | "backfill_pendente" }`.

**0.2. Mapa pregão → ticker**
- Endpoint Fundos.NET entrega `nomePregao` (ex.: `FII BLMG`), não `BLMG11`.
- Construir cruzando `nomePregao`/CNPJ com JSONs locais + lista B3 oficial.
- Saída: `data/fundosnet-mapa.json` — `{ nomePregao: ticker, cnpj: ticker }`.
- Heurística de fallback: se não mapear, não processa mas registra no log de "órfãos" pra revisão.

**0.3. Descobrir Fiagros**
- Testar `tipoFundo=20` e variantes no endpoint.
- Listar universo Fiagro; decidir quais cobrir.

**0.4. Schema do JSON de FII (contrato do template)**
- Documentar campos obrigatórios e opcionais com base no BLMG11.
- Implementar validador (`validate.py`) usado por `apply.py` antes de gravar.
- Nunca deixar o site quebrar por JSON inválido — se inválido, salva em `data/fiis/<ticker>.invalid.json` e alerta.

**0.5. Registro de idempotência**
- `data/fundosnet-seen.json`:
  ```json
  {
    "last_run": "2026-04-14T11:00:00-03:00",
    "documents": {
      "1160534": {
        "ticker": "CVFL11",
        "tipoDocumento": "Relatório Gerencial",
        "processed_at": "2026-04-13T16:22:00-03:00",
        "action": "update+article",
        "articleSlug": "cvfl11-relatorio-gerencial-mar-2026",
        "confidence": 0.92
      }
    }
  }
  ```
- Documento nunca é reprocessado a menos que marcado como `reprocess: true`.

### Fase 1 — Cliente + Triagem (sem IA ainda)

**1.1. Consolidar spike em `scripts/fundosnet/`**
- Mover código dos spikes para módulos reutilizáveis.
- `client.py`: busca paginada, download, retries exponenciais, timeout generoso (~120s).
- `extract.py`: PDF → texto, HTML Estruturado → dict.

**1.2. Motor de triagem determinístico**
- Tabela de `tipoDocumento → severidade → ação`:
  - `Fato Relevante` / `Comunicado ao Mercado` → ALTA (LLM + artigo)
  - `Assembleia` (convocação/ata) → ALTA
  - `Relatório Gerencial` → MÉDIA (LLM só pra update + timeline)
  - `Informe Mensal Estruturado` → BAIXA (parse do HTML → update de números)
  - `Rendimentos e Amortizações` → BAIXA (atualiza dividendos direto)
  - `Demonstrações Financeiras` → MÉDIA
  - Demais → NULA (ignora)

**1.3. Extratores determinísticos**
- `informe_mensal.py`: do HTML Estruturado do Informe Mensal, tirar
  patrimônio, nº cotistas, valor patrimonial, dividendo do mês, etc.
  Atualiza o JSON do FII **sem** chamar LLM.
- `rendimentos.py`: anúncios de distribuição → atualiza `dividendos.chartData` e `indicadores`.

### Fase 2 — Integração com Claude Code CLI (análise de conteúdo não-estruturado)

> **Decisão:** não usar Claude API direto. O pipeline invoca `claude -p`
> (modo headless / one-shot) que já usa a assinatura do Claude Code do
> usuário — zero custo por chamada.

**2.1. Invocação headless**
- Comando: `claude -p "<prompt>" --output-format json --permission-mode bypassPermissions`.
- Prompt contém: (a) schema + diretrizes editoriais, (b) JSON atual do fundo, (c) texto do documento, (d) instrução de saída em JSON estrito.
- Timeout generoso (5 min) — headless pode demorar em docs longos.
- Retry com backoff se parser de JSON falhar.

**2.2. Contrato de saída**
```json
{
  "relevance": "alta|média|baixa|nula",
  "confidence": 0.0-1.0,
  "reasoning": "por que essa classificação",
  "patch": {
    "pontosAtencao": [...],
    "timeline.periodos[2026].pontos.add": ["..."],
    "indicadores.dividendoMensal": 0.42,
    "recomendacao.resumo": "..."
  },
  "article": null | {
    "title": "...",
    "slug": "ticker-assunto-mes-ano",
    "categoria": "renda-variavel",
    "tags": ["FII", "ticker", "fato-relevante"],
    "destaque": true|false,
    "body_md": "..."
  }
}
```

**2.3. Guardrails (sem revisão humana)**
- Publicação 100% automática. Sem fila de revisão.
- `confidence < 0.5` → descarta silenciosamente (só loga) — evita ruído quando a IA mesma não confia.
- `0.5 ≤ confidence < 0.75` → aplica só patches em campos "factuais" (dividendos, indicadores, timeline.pontos), não gera artigo.
- `confidence ≥ 0.75` → aplica tudo, incluindo artigo.
- Allowlist de paths: IA nunca reescreve `meta.ticker`, `meta.nome`, `seo.*`.
- Artigo precisa passar por validação de slug único e frontmatter completo antes de publicar.

**2.4. Volume**
- Backfill: ~200 docs/FII × 87 FIIs ≈ 17k chamadas ao `claude -p`. Rodar em lotes com retomada.
- Delta horário: ~6 docs/hora → insignificante.

### Fase 3 — Aplicador e publicação

**3.1. `apply.py`**
- Lê patch do LLM.
- Valida contra schema + allowlist.
- Backup: `data/fiis/<ticker>.json` → `data/fiis/.backups/<ticker>-YYYYMMDD-HHMMSS.json`.
- Aplica patch.
- Revalida.
- Commita no git (opcional, atrás de flag).

**3.2. Gerador de artigo**
- Renderiza `body_md` em HTML usando template de artigo existente do site.
- Escreve em `artigos/<slug>.html` + atualiza `data/artigos.json` + atualiza `sitemap.xml`.
- Bump do Service Worker (`sw.js` APP_VERSION) — ou deixa isso como job separado diário.

### Fase 4 — Backfill (construir a base dos fundos)

**4.1. Piloto (3 fundos)**
- Pegar 3 FIIs: 1 com JSON já bom (BLMG11), 1 com JSON magro, 1 Fiagro novo.
- Rodar pipeline em modo "build from scratch" usando histórico completo.
- Comparar saída com BLMG11 manualmente — se qualidade ≥ expectativa, seguir.

**4.2. Massa (87+ fundos)**
- Script de backfill por ticker com retomada após crash.
- Processar em paralelo (concorrência controlada — Fundos.NET é lento).
- Gerar relatório final de cobertura.

### Fase 5 — Cron + observabilidade

**5.1. Trigger horário (crontab local)**
- Crontab do usuário Linux:
  ```
  0 * * * * cd /home/nenabauer/projetos/rico-aos-poucos && /usr/bin/python3 scripts/fundosnet/run.py >> /tmp/fundosnet.log 2>&1
  ```
- Exige WSL rodando. Alternativa: systemd timer se quiser mais robustez.
- Lock de arquivo (`/tmp/fundosnet.lock`) pra evitar sobreposição.

**5.2. Logs**
- `data/fundosnet-log/<YYYY-MM-DD>.json` — uma entrada por execução.
- Resumo no final: docs analisados, FIIs atualizados, artigos publicados, erros.

**5.3. Dashboard (página interna)**
- `admin/fundosnet.html` — lista últimas execuções, docs pendentes de revisão, tickers órfãos.

### Fase 6 — Qualidade e blindagem

- Testes com fixtures: documentos conhecidos → patches esperados.
- Circuit breaker: se 3 execuções seguidas falharem, para o cron.
- Alerting: log de ERROR → arquivo sentinel que a UI exibe.
- Replay: conseguir re-executar qualquer documento por ID.

## Decisões fundantes

| Decisão | Escolha | Razão |
|---|---|---|
| LLM | `claude -p` headless (CLI do Claude Code) | Sem custo extra de API, usa assinatura do usuário |
| Onde roda | crontab local (WSL) | Decisão do usuário — mantém controle local |
| Publicação | 100% automática (sem revisão humana) | Decisão do usuário — sistema se retroalimenta sozinho |
| Escopo Fiagro | apenas líquidos (negociados em bolsa com volume) | Decisão do usuário — evita ruído de fundos inativos |
| Idempotência | seen.json + backups versionados | Simples, auditável |
| Estrutura | monolito Python em scripts/fundosnet/ | Sem over-engineering; pode virar pacote depois |
| Falhas | fail-soft; alerta mas não quebra site | Sistema é aditivo, nunca destrutivo |

## Sequência de entrega (ordem recomendada)

1. Fase 0 completa → temos o universo e a idempotência.
2. Fase 1 completa → temos pipeline determinístico capaz de atualizar
   indicadores e dividendos sem IA. Já é útil sozinho.
3. Fase 2 + 3 pra Fato Relevante + Relatório Gerencial → parte inteligente.
4. Piloto (4.1) → validação de qualidade.
5. Backfill massa (4.2) + Cron (5).
6. Qualidade (6) e iteração.

## O que fica fora (por ora)

- Geração de imagens para artigos (usa `icon-512.png` como placeholder OG).
- Tradução para ES/EN (já existem `artigos-en.json` / `artigos-es.json`).
- Análise de redes sociais / notícias fora do Fundos.NET.
- Painel admin rico (começa com arquivo JSON lido num HTML simples).
