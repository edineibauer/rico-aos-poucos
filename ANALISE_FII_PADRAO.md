# Análise Completa de FII — Padrão v2

**Status:** padrão ativo a partir de 25/04/2026 (piloto BLMG11 validado).

Todo worker de análise de FII **DEVE** seguir este documento. Qualquer JSON em
`data/fiis/{ticker}.json` produzido por workers precisa ter as chaves descritas
aqui, nessa estrutura, com a aba `dividendos` no schema v2 completo.

## Contratos

| Chave top-level | Obrigatório? | Descrição |
|---|---|---|
| `meta` | sim | ticker, nome, nomeExtra, segmento, badges[], sentimento, dataAnalise, totalDocumentos |
| `seo` | sim | title/description/keywords + og/twitter |
| `indicadores` | sim | cotacao, cotacaoData, pvp, dividendYield, dividendoMensal, dividendoAnual, patrimonioLiquido, vpCota, cotistas, ocupacao (se aplicável), numImoveis (se aplicável) |
| `recomendacao` | sim | nota (0–10), veredicto, cor, resumo (HTML) |
| `quickStats` | sim | 4 cards no topo |
| `pontosAtencao` | sim | lista de riscos com severidade |
| `gestora` | sim | nome, nota, stats, resumo, link |
| `taxas` | sim | subtitulo, glowCor, itens, detalhes |
| **`portfolio`** | **sim (schema v2)** | **ver seção "Aba Portfolio v2" abaixo** — schema, tipoFundo, stats, ativos[] estruturado por tipo (imovel/cri/cra/fii), concentracao (HHI, geográfica, locatário, devedor) |
| `timeline` | sim | subtitulo, periodos[] (eventos históricos do fundo em si, não só dividendo) |
| `tese` | sim | resumo, paraQuem, naoParaQuem |
| **`encaixe`** | **sim (schema v1)** | **ver seção "Aba Encaixe v1" abaixo** — identidade, perfilRisco (score 1-5 + componentes), estrategias[], riscosOcultos[], liquidez, volatilidade, sobreposicaoPares, cenarios[], paraQuem, paraQuemNao |
| **`dividendos`** | **sim (schema v2)** | **ver `docs/schema-dividendos-v2.md`** |
| **`valuation`** | **sim (schema v2)** | **ver seção "Aba Valuation v2" abaixo** — pvp, spread, historicoPrecos, historicoVp, eventosValuation, paresComparaveis, precoJustoMercado, expectativa (curto/medio/longo) |
| **`relacoes`** | **sim quando aplicável (schema v1)** | **ver seção "Aba Relações v1" abaixo** — array com vínculos do fundo (subscrição com ágio, troca de cotas, mesma gestora, contrapartes recorrentes), severidade do conflito e fluxo (deu/recebeu favor). Pode ser array vazio se nenhuma relação foi identificada. |
| `conclusao` | sim | paragrafos, pontosFortes, pontosDeAtencao, conclusaoFinal |
| `footer` | sim | dataAnalise, totalDocumentos, disclaimer |

**Dica de profundidade:** JSON final 35–65 KB é saudável. < 25 KB indica stub ou análise rasa e deve ser refeita.

## Aba Dividendos v2 — checklist obrigatório

Ao produzir `dividendos`, o worker deve entregar:

### 1. `historico[]` — esforço principal

Array **mês a mês desde o IPO** até o último rendimento pago. Para BLMG11 foram 66 entradas; para fundos mais antigos pode chegar a 120+.

Cada entrada (v2.1, atualizado em 26/04/2026 com payout mensal):

```json
{
  "data": "YYYY-MM",
  "dividendo": 0.40,
  "dataPagamento": "YYYY-MM-DD",
  "cotas": 4670000,
  "lucroCaixa": 1700000,
  "distribuicao": 1868000,
  "resultadoCaixa": -168000,
  "payout": 1.099,
  "lucroLiquido": 1850000,
  "caixaLiquidoFimMes": 4567890,
  "fonte": "Rendimentos e Amortizações (ID 985081)",
  "docId": "985081"
}
```

**Definições (sem ambiguidade):**

- `dividendo` — DPS bruto do mês (R$/cota). Vem do "Valor do provento (R$/unidade)" do Rendimento.
- `dataPagamento` — data do crédito ao cotista (ISO `YYYY-MM-DD`).
- `cotas` — `cotasEmCirculacao` no fechamento do mês. Vem do Informe Mensal Estruturado.
- **`lucroCaixa`** — quanto o fundo **GEROU** de caixa naquele mês (receita de aluguel/juros/recebíveis menos despesas operacionais). Fonte: campo "Resultado do período" ou "Resultado líquido do mês" do **Informe Mensal Estruturado**. R$ absoluto. NÃO é o resultado contábil (que pode incluir reavaliação não-caixa) — sempre o que efetivamente entrou e saiu.
- **`distribuicao`** — `dividendo × cotas`. R$ absoluto efetivamente pago aos cotistas.
- **`resultadoCaixa`** — `lucroCaixa − distribuicao`. Saldo do mês. **Positivo = fez caixa**; **negativo = pagou da reserva**. Diagnóstico fundamental para a aba.
- **`payout`** — `distribuicao / lucroCaixa`. Decimal (0.85, 1.04, etc — não em %). Pode ser > 1.0 (queimou reserva), pode ser negativo se `lucroCaixa < 0` (mês de prejuízo de caixa) — nesse caso marcar `payout: null` e o renderer pula o ponto na linha.
- `lucroLiquido` — lucro **contábil** do mês (campo do Informe Mensal). MANTIDO para compatibilidade com fundos cujo resultado contábil ≠ lucroCaixa (ex: ganho de reavaliação não-caixa). Para a maioria dos FIIs `lucroLiquido ≈ lucroCaixa`.
- `caixaLiquidoFimMes` — saldo do **item 9 do Informe Mensal** ("Total mantido para Necessidades de Liquidez") no fechamento. Substitui o antigo `caixaAcumulado`. Disponível só nos meses que têm Informe Mensal Estruturado publicado (geralmente trimestrais — usar forward-fill no renderer).

**Campos LEGADOS** (manter null/omitir; renderer faz fallback):
- `caixaMes` — substituído por `resultadoCaixa`. Se aparecer em JSON antigo, renderer trata como sinônimo.
- `caixaAcumulado` — substituído por `caixaLiquidoFimMes`.

**Regras duras do `historico[]`:**

1. Se Informe Mensal NÃO tem `Resultado do período` extraível: omitir `lucroCaixa`, `distribuicao`, `resultadoCaixa`, `payout`. Manter `dividendo` e `dataPagamento` (vêm do Rendimento — sempre disponíveis).
2. Se `cotas` mudou no mês (emissão/amortização), usar a média ponderada por dias se possível; senão usar `cotas` do fechamento e citar em `fonte`.
3. Se `lucroCaixa < 0`: `payout: null` (não calcular razão com denominador negativo). `resultadoCaixa` continua válido.
4. Valores R$ **absolutos** (use `1700000`, não `"R$ 1,7 mi"`).
5. `payout` em **decimal** (`1.099`, não `109.9`). Renderer multiplica por 100 para exibir.

### 1b. `acumuladoSemestral[]` — visão de janelas semestrais (NOVO em v2.1)

Array de **TODOS os semestres desde o IPO** (1S = jan-jun, 2S = jul-dez), agregando `lucroCaixa` e `distribuicao` mês a mês para responder:

> "No semestre fechado, o fundo distribuiu acima ou abaixo do que gerou? Há reserva acumulada que justifica extraordinária? Há buraco que prenuncia corte?"

```json
{
  "semestre": "2026-1",
  "label": "1º Sem 2026",
  "ano": 2026,
  "metade": 1,
  "completo": false,
  "mesesContados": 4,
  "lucroCaixa": 6800000,
  "distribuicao": 7472000,
  "resultadoCaixa": -672000,
  "payout": 1.099,
  "interpretacao": "queimou_caixa"
}
```

**Definições:**

- `semestre` — chave canônica `YYYY-N` onde `N=1` (jan-jun) ou `N=2` (jul-dez).
- `completo` — `true` se os 6 meses do semestre já passaram; `false` se ainda em andamento.
- `mesesContados` — número de meses com `lucroCaixa` válido nesse semestre. Em semestres parciais (ano corrente) ou semestres com gaps de Informe Mensal pode ser < 6.
- `lucroCaixa` — soma dos `lucroCaixa` dos meses contabilizados.
- `distribuicao` — soma das `distribuicao` dos meses contabilizados.
- `resultadoCaixa` — `lucroCaixa − distribuicao` do semestre.
- `payout` — `distribuicao / lucroCaixa` do semestre.
- `interpretacao` — `"fez_caixa"` (resultadoCaixa > 0), `"queimou_caixa"` (resultadoCaixa < 0), `"equilibrio"` (|resultadoCaixa| < 1% do lucroCaixa).

**Por que semestral e não anual:** anual mascara o ciclo de extraordinárias (ex: fundos que pagam extra em jun/dez com base no resultado do semestre encerrado). Semestral revela o padrão de retenção/distribuição que o gestor usa para programar pagamentos extras.

**Por que TODOS os semestres desde o IPO:** o renderer mostra esse acumulado como **mini-cards** ou **mini-gráfico de barras** abaixo do gráfico principal de dividendos — leitor consegue ver visualmente a sequência de "fez caixa, fez caixa, fez caixa, distribuiu extra" típica de FIIs disciplinados, ou o oposto em fundos pressionados.

**Regras duras do `acumuladoSemestral[]`:**

1. Só incluir semestres que têm **pelo menos 1 mês com `lucroCaixa` válido**. Semestre sem Informe Mensal nenhum não vira card vazio — omitir.
2. `mesesContados` aparece sempre — leitor precisa saber se o número está completo ou parcial.
3. Em semestres em andamento (ex: 1S2026 lido em abr/2026 → `mesesContados: 4`), `payout` reflete só os meses contados — não anualizar nem extrapolar.
4. Calcular **somente sobre meses com dado completo** (ambos `lucroCaixa` e `distribuicao` presentes). Mês com gap não soma em nenhum dos dois.

### 1c. Linha de payout no gráfico de Dividendos (v2.1)

O gráfico unificado da aba Dividendos passa a ter **três séries**:

1. **Barras verdes** (eixo Y esquerdo, R$/cota) — `dividendo` mensal. *(já existia)*
2. **Linha laranja** (eixo Y direito, %) — `payout × 100`. **NOVO.** Linha contínua, marker apenas nos meses com `payout` válido, gap onde `payout: null`. Linha de referência horizontal em **100%** pontilhada (`payout = 1.0` = limiar entre fazer/queimar caixa).
3. **Barras roxas translúcidas** (eixo Y direito secundário, R$ absoluto) — `caixaLiquidoFimMes` (item 9 do Informe Mensal). *(já existia, agora renomeado de `caixaAcumulado`)*

**Lógica visual:** quando o user vê a linha de payout passando de 100% por vários meses seguidos, sabe que o fundo está em pressão. Quando vê 80% sustentado, sabe que extraordinária está se acumulando.

### 2. `sustentabilidade` (DO DIVIDENDO, não só do caixa)

O card responde **"o dividendo é sustentável? Por quanto tempo?"**, não apenas
"o fundo está queimando caixa?". Um fundo pode estar `queimando_caixa` mas com
dividendo sustentável até X (caso BLMG11: queima leve compensada pela contraprestação
GGRC11 até set/2027).

**Campos obrigatórios novos:**

```json
{
  "dividendoStatus": "sustentavel_longo" | "sustentavel_ate_horizonte" | "sustentavel_curto" | "pressao_imediata" | "insustentavel",
  "dividendoLabel": "Sustentável até set/2027",
  "dividendoCor":   "emerald" | "amber" | "red",
  "horizonte":      "set/2027 (fim da contraprestação GGRC11)",

  "status": "fazendo_caixa" | "queimando_caixa" | "estavel" | "misto",
  "cor": "emerald" | "red" | "amber" | "blue",
  "payoutMedio12m": 1.04,
  "caixaLiquido": 1943675,
  "caixaLiquidoData": "2026-03",
  "caixaLiquidoComposicao": "R$ X,XX em Títulos Públicos + R$ Y em Fundos de RF + R$ Z em disponibilidades (item 9 do Informe Mensal)",
  "resultadoAcumuladoRetido": 21700000,
  "resultadoAcumuladoNota": "Lucro contábil retido. Não é dinheiro líquido — está alocado em FIIs/SPEs/imóveis.",
  "queimaMediaMensal": 167000,
  "queimaPorCota": 0.036,
  "coberturaMeses": 11.6,
  "tendencia": "texto curto",
  "leitura": "HTML curto (1–3 frases) explicando para leitor leigo"
}
```

**ATENÇÃO — `caixaLiquido` ≠ `resultadoAcumuladoRetido` ≠ `caixaAcumulado`:**

- **`caixaLiquido`** (PREFERIDO) = item 9 do Informe Mensal Estruturado: "Total mantido para as Necessidades de Liquidez" — soma de Disponibilidades + Títulos Públicos + Títulos Privados + Fundos de Renda Fixa. **É o dinheiro que pode ser usado para complementar distribuição sem vender ativo.**
- **`resultadoAcumuladoRetido`** = lucro contábil retido desde o IPO. Pode estar alocado em cotas de FIIs, SPEs, imóveis. **NÃO é dinheiro líquido.** Citar como informação adicional.
- **`caixaAcumulado`** (legado v2-piloto) = só usar se for sinônimo de `caixaLiquido`. Para fundos novos, preferir `caixaLiquido`.
- **`queimaMediaMensal`** = R$ absoluto que o fundo precisa retirar do caixa líquido por mês para manter a distribuição atual. Calcular como média dos últimos 3-6 meses do "Retenção ou Distribuição de Caixa" do Relatório Gerencial (sinal negativo = está retirando).
- **`coberturaMeses`** = `caixaLiquido / queimaMediaMensal`. Se `queimaMediaMensal == 0`, é infinito (omitir ou marcar como "indefinido"). Se queima > 0, esse é o tempo até o caixa líquido esgotar nesse ritmo.

Classificação técnica de caixa (`status`):
- `fazendo_caixa` — payout 12m < 95% **e** caixaLiquido crescente.
- `queimando_caixa` — payout 12m > 100% **ou** queimaMediaMensal > 0 consistente.
- `estavel` — payout ~100% (95–100%) com caixa estável.
- `misto` — oscilou (ex: alternou períodos).

Classificação do **dividendo** (`dividendoStatus`) — responde "por quanto tempo o DPS atual se sustenta?":
- `sustentavel_longo` (cor `emerald`): nenhum ponto de inflexão visível em 24+ meses.
- `sustentavel_ate_horizonte` (cor `amber`): tem prazo de validade documentado (ex: cashback acabando, contraprestação encerrando, reserva esgotando). **Preencher `horizonte`** com a descrição do que vai mudar.
- `sustentavel_curto` (cor `amber`): cobertura < 12 meses sem evento positivo confirmado para esticar.
- `pressao_imediata` (cor `red`): cobertura < 6 meses ou queima > 50% da geração.
- `insustentavel` (cor `red`): payout > 130% sem reserva nem evento positivo confirmado.

**Atenção:** os dois status são independentes. Caso clássico: BLMG11 com `status: queimando_caixa` (técnico) + `dividendoStatus: sustentavel_ate_horizonte` (até set/2027 via contraprestação GGRC11). Sem essa distinção o card vira contraditório com a Síntese e o Guidance.

**Quando `status = queimando_caixa`, OBRIGATÓRIO adicionar evento futuro de risco** em `eventosFuturos[]` com tipo "outro" (ou "risco_corte_dividendo"), data = hoje + `coberturaMeses`, descrevendo o ajuste esperado de dividendo se o ritmo se mantiver e nenhuma aquisição/evento positivo ocorrer.

### 3. `eventosPassados[]`

Eventos **documentados** em Fato Relevante / Relatório Gerencial / Informe que
**explicitamente** mencionam impacto no dividendo. Não inventar.

Tipos aceitos: `venda`, `aquisicao`, `cashback_inicio`, `cashback_fim`,
`vacancia`, `reducao_taxa`, `emissao`, `amortizacao`, `evento_credito`, `outro`.

```json
{
  "data": "YYYY-MM",
  "dataExata": "YYYY-MM-DD",
  "titulo": "...",
  "tipo": "emissao",
  "descricao": "HTML curto",
  "impactoDividendo": "+R$ 0,05/cota por 6 meses",
  "severidade": "positivo" | "negativo" | "neutro",
  "fonte": "Fato Relevante (ID 1091574)",
  "docId": "1091574"
}
```

### 4. `eventosFuturos[]`

Projeções dos próximos 12–18 meses com **certeza explícita E severidade explícita**:

**`certeza`** — quão sólido é o evento:
- `confirmado` — documento oficial já estabelece (cashback contratado, amortização com prazo fixo, emissão aprovada).
- `projetado` — cálculo a partir de padrão histórico do próprio fundo (ex: HGLG11 distribui extraordinária toda virada de semestre).
- `possivel` — hipótese citada pelo gestor em relatório ou evento de mercado com impacto provável.

**`severidade`** — direção do impacto no dividendo (OBRIGATÓRIA, igual a `eventosPassados`):
- `positivo` — recebimento que entra no caixa, recompra que aumenta DPS por cota, aquisição com cap rate atrativo, cashback iniciando, contraprestação que o fundo recebe.
- `negativo` — saída de caixa, vencimento de contrato sem renovação, vacância prevista, fim de cashback, possível corte de dividendo.
- `neutro` — evento sem impacto líquido (ex: prazo formal já absorvido, mudança regulatória sem efeito financeiro).

Tipos aceitos: `cashback_inicio`, `cashback_fim`, `extraordinaria_historica`,
`aumento_sustentavel`, `venda_em_analise`, `obra_entrega`, `contrato_revisional`,
`amortizacao_programada`, `outro`.

**Crítico ao classificar contraprestações:** identificar **quem paga para quem**.
Se o fundo analisado RECEBE → `positivo`. Se PAGA → `negativo`. Em casos de venda
de ativo com pagamento parcial em cotas + complemento mensal, o complemento é
quase sempre RECEITA do fundo vendedor (positivo).

Cada item exige `premissa` explícita.

#### Campos numéricos para a projeção cumulativa (recomendados)

A aba de Dividendos plota um gráfico de barras dos próximos **12 meses** com lógica
**cumulativa**: cada evento futuro **altera o estado-base do dividendo a partir do
mês em que ocorre**, e esse novo patamar persiste até o próximo evento (em vez de
mostrar picos isolados de 1 mês). Para isso, preencher dois campos por evento:

```jsonc
{
  "data": "2026-09",
  "titulo": "Avanço do programa de recompra",
  "tipo": "amortizacao_programada",
  "severidade": "positivo",
  "certeza": "projetado",
  "impactoValor": 0.01,        // delta R$/cota mensal: +0,01 (positivo) ou -0,05 (negativo)
  "duracaoMeses": null         // null/omitido = contínuo (afeta todos os meses dali em diante);
                                // valor numérico = pontual ou temporário (ex: 6 = volta ao normal após 6 meses)
}
```

**Quando usar `duracaoMeses`:**
- **`null` (contínuo)** — recompras, novas aquisições, ajustes estruturais de DPS, vencimentos de contrato (perda permanente).
- **`1`** — distribuição extraordinária pontual (ex: HGLG11 paga 1 vez em dez/2024).
- **`6`, `12`, `24`...** — cashbacks com prazo definido, contraprestação por X meses, carências temporárias.

**Quando usar `impactoValor`:**
- Sempre que possível, calcular a partir do documento (ex: contraprestação de R$ 350 mil/mês ÷ 4,67 mi cotas = R$ 0,075/cota).
- Se não der pra calcular, omitir — o renderer faz fallback usando 50% do espaço entre `ultimoDPS` e `faixaMin`/`faixaMax`.

#### Padrão sazonal (`padraoSazonal`, opcional)

**REGRA DE OURO:** sazonalidade **só** existe quando o gestor **paga
sistematicamente mais ou menos no mesmo mês ano após ano**, *removida a tendência geral*.
Variação derivada de mudança de regime, alavancagem inicial, transformação de portfólio
ou tendência decrescente **NÃO É sazonalidade** — é ruído que vai distorcer a projeção.

**Como verificar de forma robusta:**

1. Calcular `dpsAnual[ano]` = média de DPS de cada ano completo (ex: 2023, 2024, 2025).
2. Para cada mês, comparar `dps_mes_2023 / dpsAnual[2023]` com `dps_mes_2024 / dpsAnual[2024]` e `dps_mes_2025 / dpsAnual[2025]`.
3. **Só** marcar `tem: true` se o desvio relativo do mesmo mês for consistente **na mesma direção** em ≥3 anos.
4. Em qualquer dúvida → `tem: false`. O renderer não aplica ajuste e o gráfico fica plano (estado-base + eventos).

**Quando preencher (exemplo válido):**

```jsonc
{
  "padraoSazonal": {
    "tem": true,
    "mediaGeral": 0.95,
    "ajusteRelativoPorMes": { "6": 0.20, "12": 0.25 },
    "observacao": "HGLG11 paga distribuição extraordinária em junho e dezembro consistentemente desde 2018 (semestres fiscais) — eventos repetidos com mesmo magnitude relativa em ≥5 anos."
  }
}
```

**Quando NÃO preencher (`tem: false`):**

- Fundo está em regime estável recente (DPS flat nos últimos 4-6 meses): qualquer variância é da fase pré-regime atual.
- Fundo passou por transformação relevante (mudança de gestora, troca de portfólio, alavancagem encerrada): histórico antigo não reflete o futuro.
- Variância entre meses é < 8% e não há justificativa documental para o padrão.
- Worker tem dúvida: melhor `tem: false` que aplicar ajuste duvidoso que vai poluir a projeção.

```jsonc
{
  "padraoSazonal": {
    "tem": false,
    "observacao": "DPS flat há 6 meses pós-consolidação GGRC11. Variância detectada no histórico longo reflete tendência decrescente, não sazonalidade verdadeira."
  }
}
```

**O renderer aplica 50% do ajuste** sobre o valor base (não 100%) **somente quando `tem: true`**.

#### `guidance.cobreMeses`

Quando `guidance.fonte = "gestor"` e o relatório cobre apenas alguns meses:

```jsonc
{
  "guidance": {
    "fonte": "gestor",
    "periodo": "1S2026",
    "cobreMeses": 6,        // os 6 primeiros meses do gráfico de 12m são "coberto pelo gestor"
    "faixaMin": 0.35, "faixaMax": 0.42
  }
}
```

O gráfico mostra os 6 meses cobertos com **borda ciano** (#22d3ee) e os 6 seguintes
como estimativa nossa (borda padrão). Sempre 12 meses no gráfico, independentemente
do período do guidance do gestor.

#### Gráfico de Guidance — banda (linhas min/max + média) + barras de estimativa

O gráfico de "Próximos 12 meses" mostra **três linhas + barras**:

1. **Linha verde** = `valorMax` (limite superior da banda).
2. **Linha pontilhada branca** = `valorMedio` (média da banda — referência visual do meio).
3. **Linha vermelha** = `valorMin` (limite inferior da banda).
4. **Barras** = `valorEstimado` (valor central que acreditamos mais provável para aquele mês — cor por impacto: verde se evento positivo, vermelho se negativo, roxo se neutro). As barras ficam DENTRO da banda, podendo encostar no piso, no teto ou ficar próximas do meio dependendo do cenário.

A área entre min e max fica levemente preenchida em verde claro, dando o efeito de "envelope".

**Lógica de derivação** (`_buildGuidanceProjection`):
- **Banda base**: `guidance.faixaMin` a `guidance.faixaMax` (ou `ultimoDPS × 0,97` a `× 1,03` se ausentes).
- **`valorEstimado` base**: último DPS conhecido (cenário-base).
- **Eventos `confirmado`**: deslocam min, max E `valorEstimado` em conjunto pelo `impactoValor`.
- **Eventos `projetado`/`possivel`** (incerteza): alargam só um lado da banda:
  - `impactoValor > 0` → só `valorMax` sobe (a estimativa central NÃO sobe — gestão pode ou não decidir aproveitar).
  - `impactoValor < 0` → só `valorMin` desce.
- `valorEstimado` é sempre clamped entre min e max.
- Y-axis com **zoom adaptativo** (não força zero) — diferenças de centavos visíveis.

Schema opcional para sobrescrever a derivação automática:

```jsonc
"projecaoMensal": [
  { "data": "2026-05", "valorMin": 1.00, "valorMax": 1.05, "valorEstimado": 1.00, "certeza": "projetado", "comentario": "Conclusão do investimento" }
]
```

### 5. `guidance`

Se o gestor divulgou faixa no Relatório Gerencial recente:
```json
{ "fonte": "gestor", "periodo": "1S2026", "faixaMin": 0.35, "faixaMax": 0.42,
  "unidade": "R$/cota/mês", "validade": "2026-09-30",
  "documento": "Relatório Gerencial mar/2026" }
```

Se não divulgou, calcular estimativa com premissas explícitas:
```json
{ "fonte": "estimativa", "periodo": "próximos 6 meses",
  "faixaMin": 0.35, "faixaMax": 0.40, "unidade": "R$/cota/mês",
  "premissas": ["DPS sustentável estimado em R$ 0,35", "DPS atual mantido em R$ 0,40", "..."] }
```

**REGRA CRÍTICA — distinguir o que o gestor declarou do que você projetou:**

Quando `fonte: "gestor"`, **só inclua na faixa o que o gestor declarou textualmente**.
Não extrapolar para cima usando eventos que VOCÊ projetou (ex: nova aquisição "deve agregar +R$ 0,05/cota"). Para fundos em `queimando_caixa`, o gestor tipicamente usa novas
receitas para **reduzir queima**, não para elevar DPS — então um evento positivo de receita
geralmente tem `impactoValor: 0` no DPS (o efeito vai para o caixa, não para o cotista).

Exemplo BTAL11: o gestor declarou apenas piso de R$ 1,00/cota. O worker inicialmente
projetou R$ 1,05 com a "Conclusão do novo investimento" — isso é otimismo indevido. Para
fundo em payout 117%, o cenário-base é manter R$ 1,00 e usar a nova receita para alongar
a reserva. A faixa correta ficou R$ 1,00–1,02 (estreita, refletindo o piso declarado +
ruído marginal).

**REGRA CRÍTICA — calibração da faixa:**

A faixa precisa refletir o cenário **realista**, não o histórico cego dos últimos meses.
Use o status de `sustentabilidade` para definir os limites:

- **`status = queimando_caixa`** (payout > 100%, queima > 0):
  - **`faixaMin`** = **DPS sustentável** = resultado real médio gerado dividido pelo total de cotas (esse é o piso para o qual o dividendo tende quando a reserva esgotar).
  - **`faixaMax`** = **DPS atual** (não projetar aumento — o fundo já está distribuindo acima do que gera; aumento exigiria aquisição com cap rate > 11% concretizada no período).
  - Aumento de DPS para fundo queimando caixa só faz sentido se houver **evento futuro confirmado positivo** no período.

- **`status = fazendo_caixa`** (payout < 95%, caixa crescente):
  - **`faixaMin`** = DPS atual.
  - **`faixaMax`** = DPS sustentável (resultado gerado / cotas) + reserva acumulando — reflete espaço para distribuição extraordinária ou aumento gradual.

- **`status = estavel`** (payout 95–100%):
  - Faixa estreita (~±5%) em torno do DPS atual, ajustada por eventos futuros confirmados.

- **`status = misto`**:
  - Documentar nas premissas o motivo da oscilação. Faixa larga é aceitável.

Em qualquer caso: NUNCA projetar `faixaMax` significativamente acima do DPS atual sem
um evento futuro confirmado que justifique. NUNCA projetar `faixaMin` acima do DPS sustentável
quando o fundo está queimando caixa.

#### `guidance.cronogramaAnuncio` (opcional, recomendado)

Quando o gestor divulga **cronograma fixo** de anúncio/pagamento (ex: "todo 5º dia útil do mês"
em Regulamento ou Relatório Gerencial), preencher:

```json
{
  "cronogramaAnuncio": {
    "fonte": "gestor",
    "regraTexto": "Anúncio até o 5º dia útil; pagamento até o 12º dia útil",
    "dataAnuncioEstimada": "2026-05-08",
    "dataPagamentoEstimada": "2026-05-19"
  }
}
```

Se a gestão não divulga regra fixa, mas o histórico mostra um padrão claro:
```json
{
  "cronogramaAnuncio": {
    "fonte": "heuristica",
    "regraTexto": null,
    "observacao": "Histórico do fundo: anúncio entre o 1º e 5º dia útil",
    "dataAnuncioEstimada": "2026-05-08",
    "dataPagamentoEstimada": "2026-05-19"
  }
}
```

Onde procurar nos `.md`:
- **Regulamento** (campo "Política de distribuição") — fonte mais autoritativa.
- **Relatório Gerencial recente** — gestão às vezes recapitula a política.
- **Histórico de Rendimentos** (data de entrega vs. mês de competência) — para inferir padrão se a gestão não declara.

O renderer da aba Dividendos exibe o rótulo correto no card "PRÓXIMO DIVIDENDO":
- `fonte=gestor` → "cronograma divulgado pela gestão"
- `fonte=heuristica` → "estimativa pelo padrão histórico do fundo"
- ausente → "estimativa pelo padrão FundosNet"

### 6. `projecaoDy`

3 cenários com `precoReferencia` explícito:
```json
{
  "precoReferencia": 33.00,
  "dyAtual12m": 13.5,
  "dyProjetado12m": 13.8,
  "cenarios": [
    { "rotulo": "Base",       "dy12m": 13.8, "dividendoMes": 0.40, "descricao": "..." },
    { "rotulo": "Otimista",   "dy12m": 15.6, "dividendoMes": 0.43, "descricao": "..." },
    { "rotulo": "Pessimista", "dy12m": 11.6, "dividendoMes": 0.32, "descricao": "..." }
  ],
  "retornoTotal12m": 19.5,
  "premissas": ["..."]
}
```

### Layout final da aba Dividendos (ordem definitiva)

A ordem de blocos na aba Dividendos é:

1. **3 cards no topo** (último DPS / próximo esperado / pontos de atenção)
2. **Gráfico unificado de Histórico** (barras verdes = dividendo eixo Y esquerdo R$/cota; **linha laranja = payout % no eixo Y direito** com referência horizontal em 100%; barras roxas translúcidas = caixa líquido eixo Y direito secundário R$) com filtros "Por mês / Por ano" e ranges (12m/24m/5 anos/Desde IPO)
3. **Faixa de mini-cards `acumuladoSemestral`** (estilo carrossel ou grid horizontal — um card por semestre desde o IPO com `payout`, `resultadoCaixa`, badge de cor por `interpretacao`)
4. **Card de Sustentabilidade** (badge ↕, leitura, payout, caixa líquido, queima, cobertura)
5. **Card de Síntese compilada** (leitura compilada — vem DEPOIS dos dados duros, antes da timeline e projeções)
6. **Timeline de eventos**
7. **Card de Estimativa** (gráfico 12m + faixa)
8. **Projeção DY** (3 cenários)

**Layout do bloco de gráficos:** dois painéis empilhados, separados por linha tracejada sutil:
- **Em cima:** barras verdes do dividendo + **linha laranja do payout** (eixo Y direito %). Linha pontilhada horizontal em 100% como referência crítica.
- **Em baixo (altura menor):** barras roxas do caixa líquido (item 9 do Informe Mensal — campo `caixaLiquidoFimMes`). Só aparece se houver série em `historico[].caixaLiquidoFimMes`.

**Forward-fill do caixa:** Informes Mensais Estruturados são publicados **trimestralmente** (jan/abr/jul/out + mar/jun/set/dez tipicamente), então a maioria dos meses do `historico[]` não terá `caixaLiquidoFimMes`. O renderer faz **forward-fill**: meses sem dado herdam o valor do mês anterior conhecido e são renderizados como **barras fantasmas** (translúcidas, borda mais clara). Tooltip nessas barras diz *"Sem informação para este mês — repetido do mês anterior"*. Legenda do gráfico explica as duas cores: "com dado oficial" vs "repetido do mês anterior". O ideal é o worker preencher todos os meses que conseguir extrair de Informes Mensais.

**Linha de payout — comportamento:** marker apenas nos meses com `payout` válido (não-null). Onde `payout: null` (mês sem Informe Mensal ou `lucroCaixa < 0`), a linha **interrompe** (gap visível) — evita extrapolação enganosa. Tooltip da linha mostra `lucroCaixa` e `distribuicao` separadamente para o leitor entender de onde vem o número.

### Cálculo do "próximo dividendo" (card do topo)

**Cenário-base:** o próximo dividendo **repete o último DPS conhecido**. Não usar a média da faixa do guidance como expectativa — isso gera valor irreal quando o fundo está em regime estável.

**Ajuste por evento futuro:** se houver evento em `eventosFuturos[]` cuja `data` casa com o mês seguinte ao último histórico, somar o `impactoValor` ao último DPS. Limitar à faixa do guidance só como sanity check (clip).

**Justificativa exibida no card** (rodapé):
- Sem evento: *"repete o último DPS conhecido (Mar/26)"*
- Com evento: *"repete o último DPS conhecido (Mar/26) + R$ 0,03 (Aquisição projetada)"*

**Countdown de dias:** o card mostra ao lado das datas:
- *"Para receber, ter cota até: DD/MM/YYYY (em N dias)"* — data-base ≈ data de anúncio na maioria dos FIIs (no padrão FundosNet, ambas coincidem). Se a data já passou, mostra *"há N dias"* em cinza.
- *"Pagamento esperado: DD/MM/YYYY (em N dias)"* — data prevista para o crédito.
- O cálculo é simples: `Math.round((alvo − hoje) / 86400000)`, com hora zerada nos dois lados para não ter erro de fuso/duração de dia.

### 7a. `sintese` — leitura compilada (OBRIGATÓRIA)

Após mapear `eventosPassados`, `eventosFuturos`, `sustentabilidade` e `guidance`, o
worker **deve** sintetizar tudo em um bloco que diga ao leitor **para qual direção o
dividendo está caminhando** e **com qual nível de risco**:

```jsonc
{
  "sintese": {
    "tendencia": "estavel_ate_set2027" | "alta" | "queda" | "lateral_com_risco" | "...",
    "tendenciaLabel": "Estável até set/2027, queda projetada depois",  // 1 frase curta
    "cor": "amber" | "emerald" | "red" | "blue",  // borda esquerda do card
    "direcao": "Texto curto (1-2 frases) explicando para onde o dividendo vai e por quê",
    "pontosPositivos": [
      { "texto": "...", "peso": "alto" | "medio" | "baixo" }
    ],
    "pontosNegativos": [
      { "texto": "...", "peso": "alto" | "medio" | "baixo" }
    ],
    "veredicto": "<p>HTML 2-4 frases conectando os pontos: o que sustenta o DPS atual, o que pressiona, qual o ponto de inflexão e em que cenário o tese funciona.</p>"
  }
}
```

**O veredicto é o destaque:** deve responder em uma leitura compilada — não apenas listar
positivos/negativos isoladamente. Exemplo (BLMG11): *"O DPS de R$ 0,40 é sustentável até
~set/2027 graças à contraprestação do GGRC11. O ponto de inflexão é set/2027: se o gestor
não conseguir aquisição que reponha os R$ 350 mil/mês, o ajuste para R$ 0,32–0,35 é o
cenário-base."*

**Ordem de raciocínio recomendada:**
1. Listar todos os eventos positivos vigentes/futuros e estimar peso (alto se muda DPS em ≥10%, médio se 3-10%, baixo se <3%).
2. Listar todos os eventos negativos vigentes/futuros com mesmo critério.
3. Identificar o **ponto de inflexão** principal (geralmente o evento de maior peso).
4. Escrever o `veredicto` mostrando: situação atual → próximos catalisadores → ponto de inflexão → cenário-base após.
5. Definir `cor` pelo balanço:
   - `emerald` — positivos dominam, dividendo tende a subir.
   - `amber` — equilibrado ou estável com ponto de inflexão futuro.
   - `red` — negativos dominam, dividendo tende a cair em prazo curto.
   - `blue` — informativo/lateral, sem direção clara.

**Crítico:** não confundir um evento "início" com um evento "fim". Se uma contraprestação
ou cashback **já está embutido no DPS atual**, o evento futuro relevante é o **fim** dela
(negativo), não o início (que já passou). Em BLMG11 o erro inicial foi marcar
"Consolidação da contraprestação GGRC11" em jun/2026 como positivo — quando na verdade
ela já estava no estado-base e o evento real era o fim em set/2027 (negativo).

### 7. `alertas[]`

Máximo 3. Até 80 caracteres cada. `sev-red` apenas para coisa real e documentada.

### 8. v1-compat (também preencher)

`chartLabels`, `chartData`, `chartCor`, `chartYMin/Max`, `stats` —
para fallback e ferramentas antigas. O renderer prioriza `historico[]` quando disponível.

> **`totaisAnuais` foi descontinuado** a partir de 25/04/2026. O gráfico de Histórico
> agora tem filtro **"Por mês / Por ano"** que substitui visualmente a tabela. Quando
> o usuário escolhe "Por ano", o renderer agrupa o `historico[]` automaticamente
> (soma dos dividendos do ano + último `caixaAcumulado` do ano). Os botões de range
> "12m" e "24m" são desabilitados nesse modo (não fazem sentido com agrupamento anual);
> só ficam habilitados "5 anos" e "Desde IPO".

## Aba Valuation v2 — checklist obrigatório

A aba Valuation responde **três perguntas**, nessa ordem:

1. **Como o preço da cota se moveu até hoje?** (gráficos históricos: preço, P/VP, VP/cota com marcadores de eventos)
2. **Qual deveria ser o preço hoje, considerando o mercado e a qualidade do fundo?** (`precoJustoMercado` com componentes quantitativos + leitura qualitativa)
3. **Para onde o preço tende a ir no curto, médio e longo prazo, e por quê?** (`expectativa` com catalisadores documentados)

Sem responder as três, a aba é incompleta.

### 0. Pré-coleta obrigatória (rodar ANTES da chamada ao LLM)

Antes do `gerar_pagina_fii.py` invocar Opus, o pipeline DEVE ter atualizado:

| Arquivo | Origem | Atualização |
|---|---|---|
| `data/fiis/{ticker}/historico_precos.csv` | `scripts/cotacoes/coletar_historico.py` (yfinance) | mensal por fundo, diária para o lote ativo |
| `data/fiis/{ticker}/historico_vp.csv` | `scripts/cotacoes/extrair_vp_historico.py` (varre `data/fiis-optimized/{TICKER}/*.md`) | a cada mineração |
| `data/macro_snapshot.json` | `scripts/cotacoes/macro_snapshot.py` (BCB SGS + curva DI) | semanal |
| `data/pares_subsegmento.json` | mantido manualmente + sugestões do LLM | incremental |

Esses 4 arquivos são anexados ao prompt do worker (junto do dossiê de docs). **Sem eles, o worker NÃO produz `valuation` v2 — devolve apenas `pvp` e `spread` (modo legado) e marca `valuation.schema: "v1"`.**

### 1. `historicoPrecos` — ponteiro para CSV

O JSON principal **não armazena a série de preços** (~1250 pontos × 12 bytes = ~15KB consumiriam metade do orçamento de 36KB). Armazena ponteiro:

```jsonc
"historicoPrecos": {
  "csvPath": "data/fiis/blmg11/historico_precos.csv",
  "frequencia": "diaria" | "semanal",
  "dataInicio": "2021-08-12",
  "dataFim":    "2026-04-25",
  "fonte":      "yfinance:BLMG11.SA",
  "naoAjustado": true,
  "ultimoFechamento": 32.85,
  "minHistorico": { "valor": 28.10, "data": "2024-08-30" },
  "maxHistorico": { "valor": 51.40, "data": "2021-11-15" }
}
```

Frequência **semanal** por padrão (~260 pontos para 5 anos — leve). **Diária** apenas para fundos com histórico < 1 ano. O CSV no disco tem todas as datas; o renderer reamostra conforme o filtro escolhido pelo usuário.

**REGRA DURA:** sempre o `Close` **não-ajustado** do yfinance. Nunca `Adj Close`. O usuário quer ver o preço que foi de fato negociado naquele dia, não o ajustado por dividendos.

### 2. `historicoVp` — VP/cota mês a mês

Mesma lógica — ponteiro para CSV:

```jsonc
"historicoVp": {
  "csvPath": "data/fiis/blmg11/historico_vp.csv",
  "fonte":   "Informes Mensais Estruturados + Relatórios Gerenciais",
  "ultimoVpCota":  47.40,
  "ultimoVpData":  "2026-03"
}
```

Schema do CSV: `data,vp_cota,patrimonio_liquido,n_cotas,fonte_doc_id`.

**P/VP histórico não tem chave própria** — é derivado pelo renderer: para cada data `d` do histórico de preços, busca o `vp_cota` do mês de `d` e calcula `preço[d] / vp_cota[mês_de_d]`.

### 3. `eventosValuation[]` — marcadores no gráfico

Eventos que **explicam** descontinuidades nos gráficos de preço/VP/PVP. Diferente de `timeline.periodos` (épocas amplas), são pontos **datados** com impacto numérico.

```jsonc
{
  "data": "2026-02-14",
  "tipo": "emissao" | "reavaliacao_positiva" | "reavaliacao_negativa"
        | "venda_relevante" | "aquisicao_relevante"
        | "mudanca_gestor" | "evento_credito" | "amortizacao_extraordinaria",
  "titulo": "5ª Emissão (R$ 350 mi, R$ 9,80/cota)",
  "descricao": "<p>HTML curto: contexto + impacto esperado.</p>",
  "impactoVp":    -1.20,    // delta R$/cota no VP (se aplicável)
  "impactoPreco": null,     // delta % no preço observado (se relevante)
  "fonte": "Fato Relevante (ID 1234567)",
  "docId": "1234567"
}
```

Tipos e sinais esperados:
- `emissao` — VP/cota tipicamente cai (diluição se preço de emissão < VP); preço da cota costuma cair leve no anúncio.
- `reavaliacao_positiva` — VP/cota sobe; preço pode subir.
- `reavaliacao_negativa` / `venda_relevante` (com prejuízo) — VP/cota cai; preço cai.
- `aquisicao_relevante` — VP/cota neutro; preço pode subir se a aquisição foi com cap rate atrativo.
- `mudanca_gestor` — preço costuma reagir forte; VP neutro.
- `evento_credito` — papel: default de CRI; tijolo: vacância de inquilino-âncora. Ambos tipicamente derrubam preço.
- `amortizacao_extraordinaria` — VP/cota cai pelo valor amortizado; preço cai junto.

### 4. `paresComparaveis` — agrupamento por subsegmento

O LLM usa `data/pares_subsegmento.json` para identificar o subsegmento do fundo, e popula:

```jsonc
"paresComparaveis": {
  "subsegmento": "papel_high_yield",
  "criterioAgrupamento": "FIIs de CRI com >40% em ativos high yield, gestoras independentes, alavancagem leve.",
  "tickers": ["KNCR11", "KNIP11", "DEVA11", "VGIR11", "CXRI11"],
  "estatisticas": {
    "dataSnapshot": "2026-04-25",
    "pvpMediano":   0.92,
    "pvpMin":       0.78,
    "pvpMax":       1.04,
    "dyMediano":    14.8,
    "dyMin":        12.1,
    "dyMax":        19.5,
    "premioRiscoSegmento": 0.045
  },
  "posicaoFundo": {
    "pvpRanking": "5° de 6 — abaixo da mediana em 12%",
    "dyRanking":  "1° de 6 — acima da mediana em 380bps",
    "leitura": "<p>HTML 1-2 frases: o desconto vs pares é justificado pela exposição de 40% a CRIs inadimplentes; o prêmio de DY reflete esse risco específico, não anomalia de precificação.</p>"
  },
  "statusClassificacao": "validado" | "proposto"
}
```

`statusClassificacao: "proposto"` quando o subsegmento do fundo não está em `pares_subsegmento.json` — a sugestão fica no JSON e exige validação humana antes de virar default permanente.

### 5. `precoJustoMercado` — modelo híbrido (4 componentes + camada LLM)

#### 5a. Os quatro componentes

| Componente | Cálculo | Quando pesa mais |
|---|---|---|
| **A1. DY-alvo Selic** | `preço = DPS_sustentável_anual / (Selic + premioRiscoSegmento)` | Sempre — âncora macro. Peso típico **0.40**. |
| **A2. P/VP relativo** | `preço = vpCotaAtual × pvpMediano_pares` | Quando há ≥5 pares válidos. Peso típico **0.25**. |
| **A3. DY relativo** | `preço = DPS_sustentável_anual / dyMediano_pares` | Idem A2. Peso típico **0.20**. |
| **A4. Fator qualidade** | Multiplicador ∈ [0.85, 1.15], **não preço próprio** | Sempre. Aplica-se ao preço médio ponderado de A1-A3. |

**`DPS_sustentável_anual`:**
- Se `dividendos.sustentabilidade.dividendoStatus = "sustentavel_longo"`: usa DPS dos últimos 12m × 12.
- Se `sustentavel_ate_horizonte`: usa **DPS pós-horizonte** (citado em `sustentabilidade.horizonte` ou estimado pela `queimaPorCota`).
- Se `pressao_imediata` ou `insustentavel`: usa DPS sustentável real (`resultado_gerado / cotas`).

**`Selic` e `premioRiscoSegmento`:** vêm de `data/macro_snapshot.json` e `data/pares_subsegmento.json`. Prêmios típicos:

| Subsegmento | Prêmio |
|---|---|
| Papel HG (CRIs investment grade) | 2-3% |
| Papel HY (CRIs high yield) | 4-6% |
| Logística HG (inquilinos AAA) | 3-4% |
| Logística HY | 4-5% |
| Shoppings premium | 4-5% |
| Shoppings regional | 5-6% |
| Escritórios AAA | 4-5% |
| Escritórios B/C | 6-7% |
| FoF | 3-4% |
| Agro CRA | 4-5% |
| Híbrido | 4-5% |

**Fator qualidade A4** — score ∈ [0, 1], com pesos:

| Sub-componente | Peso | Como pontuar |
|---|---|---|
| Gestora | 0.25 | Track record, AuM, transparência. Top-3 do mercado = 1.0; gestora desconhecida = 0.4. |
| Vacância | 0.20 | `1 - vacancia_pct/30%`. Tijolo: 0% = 1.0, 30%+ = 0. Papel: ignorar (peso 0, redistribuir). |
| Alavancagem | 0.15 | `1 - LTV/50%`. 0% = 1.0, 50%+ = 0. |
| Inadimplência (papel) | 0.15 | `1 - inadimplencia_pct/15%`. Tijolo: ignorar. |
| Estabilidade DPS | 0.15 | `1 - desvio_padrao_24m / DPS_medio`. Coeficiente de variação. |
| dividendoStatus (Dividendos v2) | 0.10 | longo=1.0, horizonte=0.85, curto=0.7, pressao=0.5, insustentavel=0.3 |

`fatorQualidade = 0.85 + score × 0.30` — varia entre 0.85 e 1.15 (ajusta ±15% no preço final).

#### 5b. Cálculo final

```
preco_quantitativo = (peso_A1·A1 + peso_A2·A2 + peso_A3·A3) / (peso_A1+peso_A2+peso_A3)
                     × fatorQualidade
faixa = preco_quantitativo ± 5–10%
```

A faixa é mais larga (até ±10%) quando os pares são pobres (<5 tickers) ou quando há divergência grande entre A1, A2, A3 (>15% entre eles).

**A camada LLM (Opus 4.7 1M) recebe os 4 componentes calculados** e pode:
- Ajustar pesos com justificativa (ex: "fundo está em transformação de portfólio — A2 perde relevância porque o VP histórico não reflete a tese futura").
- Ajustar o preço final em até ±10% além da faixa quantitativa, **com racional concreto**.
- **NUNCA** ajustar mais de ±10% sem citar fato documentado (mudança de gestor, evento de crédito iminente, vencimento de contrato).

#### 5c. Schema na saída

```jsonc
"precoJustoMercado": {
  "valor": 9.50,
  "faixa": [9.00, 10.00],
  "comparacaoComCotacao": {
    "cotacaoAtual": 8.50,
    "diferencaPct": 11.8,
    "leitura": "subvalorizado em 11,8% vs mercado — janela de entrada"
  },
  "componentes": [
    {
      "nome": "DY-alvo Selic+prêmio",
      "peso": 0.40,
      "preco": 9.30,
      "calculo": "DPS sustentável R$ 1,20/ano ÷ (15% Selic + 4% prêmio HY) = R$ 9,30",
      "racional": "DPS de R$ 0,10/mês considerado sustentável após fim do cashback em set/27."
    },
    {
      "nome": "P/VP pares",
      "peso": 0.25,
      "preco": 9.80,
      "calculo": "VP/cota R$ 10,55 × P/VP mediano dos pares (0,92) = R$ 9,71 → arredondado",
      "racional": "Pares: KNCR11, DEVA11, KNIP11, VGIR11, CXRI11."
    },
    {
      "nome": "DY pares",
      "peso": 0.20,
      "preco": 9.40,
      "calculo": "DPS R$ 1,20/ano ÷ DY mediano dos pares (12,8%) = R$ 9,40",
      "racional": "..."
    }
  ],
  "fatorQualidade": {
    "valor": 0.97,
    "score": 0.62,
    "componentes": [
      { "nome": "Gestora",       "peso": 0.25, "score": 0.75, "racional": "Top-5 em FIIs de papel." },
      { "nome": "Inadimplência", "peso": 0.15, "score": 0.40, "racional": "12% dos CRIs com atraso > 90d." },
      { "nome": "Alavancagem",   "peso": 0.15, "score": 0.85, "racional": "LTV de 8%." },
      { "nome": "Estabilidade",  "peso": 0.15, "score": 0.70, "racional": "DPS oscilou ±8% em 24m." },
      { "nome": "dividendoStatus","peso": 0.10, "score": 0.85, "racional": "sustentavel_ate_horizonte (set/27)." }
    ]
  },
  "explicacao": "<p>HTML 3-5 frases conectando os componentes em uma leitura única — qual é o preço justo, por que está descontado/premiado vs mercado, qual é o risco principal embutido nessa leitura.</p>"
}
```

### 6. `expectativa` — curto, médio, longo prazo

A regra-mãe: **toda projeção precisa citar evento concreto e datado.** Vibe macro genérica não conta. Catalisadores aceitos:

- Evento documentado do fundo: vencimento de contrato, fim de cashback, amortização programada, emissão aprovada (com `docId`).
- Evento macro com curva pública: Selic projetada (Focus do BCB), curva DI, PIB Boletim Macroeconômico.
- Sazonalidade do segmento documentada: ex. shoppings têm DPS extra em jan/fev por causa de outubro/dezembro.

**Se o LLM não consegue justificar concretamente, devolve `precoEsperado: null` e `direcao: "indefinido"`.**

```jsonc
"expectativa": {
  "curto": {
    "horizonte": "3-6 meses",
    "horizonteAte": "2026-10-31",
    "precoEsperado": 9.40,
    "faixa": [9.00, 9.80],
    "direcao": "lateral_alta",
    "catalisadores": [
      {
        "evento": "Vencimento de CRI XPTO12 com pagamento integral",
        "data":   "2026-07",
        "impactoEsperado": "+R$ 0,15/cota em jul/26",
        "fonte":  "Relatório Gerencial mar/2026 (ID 1234567)",
        "docId":  "1234567"
      }
    ],
    "racional": "<p>HTML 2-3 frases — citar eventos e datas do array acima e como compõem o cenário.</p>"
  },
  "medio": { /* horizonte "1-2 anos", horizonteAte "2028-04-30", ... */ },
  "longo": { /* horizonte "3-5 anos", horizonteAte "2031-04-30", ... */ }
}
```

#### 6a. Padrão fixo de `direcao`

| Valor | Significado | Variação esperada |
|---|---|---|
| `queda_forte` | preço cai > 15% | < -15% |
| `queda` | preço cai entre 5-15% | -5% a -15% |
| `lateral_baixa` | preço de lado, levemente para baixo | -2% a -5% |
| `lateral` | sem direção clara | ±2% |
| `lateral_alta` | de lado, levemente para cima | +2% a +5% |
| `alta` | sobe entre 5-15% | +5% a +15% |
| `alta_forte` | sobe > 15% | > +15% |
| `indefinido` | sem catalisadores claros | n/a |

#### 6b. Lógica de horizontes

- **Curto (3-6 meses):** dominado por catalisadores próprios do fundo (eventos em `eventosFuturos[]` da aba Dividendos com data ≤ hoje+6m). Selic praticamente não muda nesse horizonte.
- **Médio (1-2 anos):** já considera ciclo de Selic projetado pela curva DI. Vencimentos de contratos longos começam a pesar.
- **Longo (3-5 anos):** macro domina — ciclo de Selic completo, ciclo imobiliário (vacância sistêmica, pipeline de novos empreendimentos no segmento).

**Casos típicos:**
- Fundo de papel HY com Selic em alta: curto positivo (DY alto remunera bem), longo negativo (queda de Selic comprime spread).
- Fundo de tijolo logística HG: curto neutro, médio/longo positivo se Selic cai (reprecificação para cima).
- FII em transformação de portfólio (BLMG11 atual): curto incerto, médio depende da execução, longo só com tese de aquisições concretizadas.

### 7. Schema completo da chave `valuation`

```jsonc
"valuation": {
  "schema": "v2",
  "dataAnalise": "2026-04-26",

  "historicoPrecos": { "csvPath": "...", "frequencia": "...", ... },
  "historicoVp":     { "csvPath": "...", ... },
  "eventosValuation": [...],
  "paresComparaveis": {...},

  "pvp":    { "valor": "0,70", "descricao": "<p>...", "detalhes": [...] },
  "spread": { "valor": "13,5%", "label": "...", "cor": "...", "descricao": "<p>...", "detalhe": "..." },

  "precoJustoMercado": { ... seção 5c ... },
  "expectativa":       { ... seção 6 ... },

  "recomendacoes": null   // OBSOLETO — substituído por precoJustoMercado. Manter null por compat.
}
```

### 8. Regras duras (Valuation v2)

1. **Preço sempre não-ajustado.** `Close` do yfinance ou equivalente. Nunca `Adj Close`.
2. **Catalisadores citáveis.** Cada item de `expectativa.*.catalisadores[]` precisa ter `docId` (doc do fundo) ou `fonte` (referência macro pública).
3. **Não inventar pares.** Se o subsegmento não está em `data/pares_subsegmento.json`, marcar `paresComparaveis.statusClassificacao: "proposto"` e listar 4-6 candidatos com explicação.
4. **`precoJustoMercado.valor` dentro de `[0.7, 1.5] × cotacao_atual`.** Distância maior que isso exige justificativa documentada explícita no `explicacao` (evento esperado de magnitude X). Acima de 1.5× ou abaixo de 0.7× sem catalisador documentado é red flag — provavelmente o cálculo está errado.
5. **Faixa de `precoJustoMercado` mínimo ±3%, máximo ±15%.** Faixa < 3% ignora incerteza inerente; > 15% indica que o modelo não está convergindo e a leitura qualitativa precisa explicar por quê.
6. **`expectativa` é coerente com `dividendos.sintese.tendencia`.** Se Dividendos diz "queda projetada após set/27" e Valuation curto/médio diz `alta_forte`, o JSON está internamente inconsistente — worker precisa revisar.
7. **`precoJustoMercado.componentes[].peso` soma 1.0** (excluindo o A4 que é multiplicador).
8. **Se algum dos 4 arquivos da pré-coleta (seção 0) estiver ausente:** worker emite `valuation.schema: "v1"` (modo legado) e adiciona alerta em `pontosAtencao` indicando que a aba Valuation está incompleta. Não tenta inventar gráficos.

### 9. Onde cada dado vem (referência rápida)

| Campo | Fonte primária |
|---|---|
| `historicoPrecos.csvPath` | `data/fiis/{ticker}/historico_precos.csv` (yfinance) |
| `historicoVp.csvPath` | `data/fiis/{ticker}/historico_vp.csv` (extraído de Informes Mensais) |
| `eventosValuation[].emissao` | Fato Relevante de Aprovação de Emissão |
| `eventosValuation[].reavaliacao_*` | Laudo de Avaliação no Informe Anual ou Fato Relevante específico |
| `eventosValuation[].venda_relevante` | Fato Relevante de venda + Relatório Gerencial subsequente |
| `paresComparaveis.tickers` | `data/pares_subsegmento.json` |
| `paresComparaveis.estatisticas.*` | snapshot atual dos JSONs em `data/fiis/{par}.json` |
| `precoJustoMercado.componentes[A1].calculo` | Selic vem de `data/macro_snapshot.json` |
| `expectativa.medio.catalisadores[].evento (macro)` | curva DI / Focus em `data/macro_snapshot.json` |

## Aba Portfolio v2 — checklist obrigatório

A aba Portfolio v2 substitui a Portfolio v1 (que só tinha `stats`, `tipologiaChart`, `locatarios`, `riscoNota` em texto livre). O objetivo da v2 é **dados estruturados por ativo**, para permitir:
1. Renderização granular (timeline de contratos, mapa de imóveis, look-through em FoF).
2. Cálculo programático de concentração (HHI, top-N, geografia, indexador).
3. Cruzamento futuro com a "Carteira do Usuário" (sobreposição real entre fundos).

A regra dura permanece: **se não está no `.md`, omite ou seta `null`**. Nunca inventar rating, expectativa de renovação, valor de mercado.

### 1. `tipoFundo` — classificação primária

```jsonc
"tipoFundo": "tijolo" | "papel" | "cra" | "fof" | "hibrido" | "desenvolvimento"
```

- `tijolo` — > 70% do PL em imóveis físicos (galpão, escritório, shopping, varejo, hospital).
- `papel` — > 70% do PL em CRIs.
- `cra` — > 70% em CRAs (agronegócio).
- `fof` — > 70% em cotas de outros FIIs.
- `hibrido` — nenhuma categoria > 70%. Caso BLMG11 (43% GGRC11 + 33% SPE + 17% imóvel + 4% caixa).
- `desenvolvimento` — fundo em fase de obra/incorporação, receita ainda não estabilizada.

### 1a. `tipoFundo: "fof"` — TRATAMENTO ESPECIAL (VP em tempo real)

FoFs publicam VP/cota apenas mensalmente (Informe Mensal Estruturado), mas suas cotas detidas têm **preço diário** no mercado. O renderer do site calcula em tempo real o VP estimado e o P/VP real do FoF a partir da carteira — antes do gestor publicar o VP oficial.

**Para que isso funcione, o `ativos[]` do FoF DEVE ter, para cada FII detido:**

```jsonc
{
  "tipo": "fii",                 // OBRIGATÓRIO
  "ticker": "HGLG11",            // OBRIGATÓRIO — em CAIXA ALTA
  "nome": "CSHG Logística",      // recomendado
  "qtdCotas": 125840,            // OBRIGATÓRIO — número de cotas detidas
  "precoMedio": 145.20,          // recomendado — preço médio de aquisição (preço de livro)
  "valorPresente": 18272368,     // OBRIGATÓRIO se possível — valor pelo qual está contabilizado no PL do FoF
  "percPL": 0.082,               // % do PL (decimal — 0.082 = 8.2%)
  "segmentoFinal": "logistica_industrial",  // segmento do par
  "fonte": "Informe Trimestral 2T26 (ID 982341)",
  "docId": "982341"
}
```

**Onde achar nos `.md` de `data/fiis-optimized/{TICKER}/`:**
- **Informes Trimestrais** (categoria `Informe Trimestral` ou `Demonstrações Financeiras`) — em FoFs, listam composição da carteira com qtd de cotas + valor.
- **Relatórios Gerenciais** — geralmente trazem tabela "Carteira de FIIs" ou "Composição" com pesos e cotas.
- **Informe Anual** — visão consolidada da carteira no fechamento do ano.

**Regras duras para FoF:**
1. Cobertura mínima: **≥ 90% do PL** representado em `ativos[].tipo="fii"` ou em outras categorias explícitas (caixa, CRI, etc. via `tipo:"outro"` com `categoria`).
2. **Sempre incluir `qtdCotas`** mesmo que tenha que aproximar a partir de `valorPresente / precoMedio` (com nota em `fonte: "estimado de valor / preço médio"`).
3. **Não inventar `precoMedio`** — se o relatório não informa, deixar `null`.
4. Tickers que não existem mais (fundos liquidados) — manter na lista apenas se o relatório os cita; o renderer trata graceful (mostra "n/d" no preço atual).
5. Se o FoF tem caixa relevante (>10%) ou CRIs além das cotas de FII, incluir como `tipo:"outro"` com `categoria:"caixa"` / `categoria:"cri"` para o cálculo de VP estimado considerar (renderer subtrai PL livro – PL de FIIs livros e adiciona ao valor de mercado).

**O renderer faz, sem precisar nada do LLM:**
- Para cada `ativos[].tipo="fii"`, busca último fechamento em `data/fiis/{ticker}/historico_precos.csv`.
- `valorMercadoFII = qtdCotas × ultimoFechamento`.
- `Σ valorMercadoFII + (PL_oficial − Σ valorPresente_dos_FIIs) = PL estimado`.
- `VP_estimado = PL estimado / cotasEmitidas_do_FoF` (cotasEmitidas vem do Informe Mensal — `indicadores.cotasEmitidas` ou derivado de `patrimonioLiquido / vpCota`).
- `P/VP_real = cotacaoAtual / VP_estimado`.
- Tabela detalhada por FII com Δ% vs preço médio (alfa do FoF na carteira).

**O LLM NÃO calcula nada disso.** Apenas garante o `ativos[]` populado conforme o schema acima.

### 2. `stats` — métricas agregadas (não é mais array de chips)

Schema fixo, campos opcionais conforme tipo:

```jsonc
"stats": {
  "totalAtivos": 18,                     // contagem única (imóveis + CRIs + FIIs)
  "abl":             1654000,            // m² (tijolo) — null se não aplicável
  "ocupacaoFisica":  96.4,               // % (tijolo)
  "ocupacaoFinanceira": 98.1,            // % (tijolo)
  "vacanciaFisica":  3.6,                // % (tijolo)
  "wault":           5.8,                // anos (tijolo) — weighted avg unexpired lease term
  "ltv":             0.0,                // % do PL em dívida
  "alavancagemPct":  12.0,               // % de alavancagem específica do fundo
  "duration":        4.1,                // anos (papel) — duration média ponderada
  "yieldCarregamento": 14.2,             // % a.a. (papel) — yield-to-maturity médio
  "inadimplenciaPct": 0.0,               // % (papel)
  "alocacaoPL": [                        // composição percentual obrigatória
    { "categoria": "FII (cotas GGRC11)",     "pct": 0.43, "cor": "#3b82f6" },
    { "categoria": "SPE Bluemacaw Portfólio", "pct": 0.33, "cor": "#8b5cf6" },
    { "categoria": "Imóvel direto",           "pct": 0.17, "cor": "#10b981" },
    { "categoria": "Caixa/RF",                "pct": 0.04, "cor": "#64748b" },
    { "categoria": "Outros FIIs",             "pct": 0.03, "cor": "#f59e0b" }
  ]
}
```

`alocacaoPL` substitui o `tipologiaChart` v1 — mesma função (gráfico donut), nome semântico melhor. Soma deve ser 1.0 ± 0.005.

### 3. `ativos[]` — array discriminado por `tipo`

Cada item tem `tipo: "imovel" | "cri" | "cra" | "fii"` (FoF) — schema correspondente abaixo.

#### 3a. Ativo tipo `imovel`

```jsonc
{
  "tipo": "imovel",
  "id": "salvador-atento",                   // slug único dentro do fundo
  "nome": "Edifício Atento Salvador",
  "endereco": "Av. Tancredo Neves, 2585 — Salvador/BA",
  "geo": {
    "cidade": "Salvador",
    "uf": "BA",
    "regiao": "Nordeste",                    // Nordeste/Sudeste/Sul/Norte/Centro-Oeste
    "subregiao": "Salvador-Itaigara",
    "lat": -12.989,
    "lng": -38.466
  },
  "abl": 12257,                              // m²
  "padrao": "B" | "A" | "AA" | "AAA" | "C",  // OPCIONAL — só preencher se doc cita classe
  "tipologia": "escritorio_back_office",     // logistica_modular | escritorio_aaa | escritorio_back_office | shopping_premium | shopping_regional | varejo_strip | galpao_industrial | hospital | hotel | agencias | ...
  "participacao": 1.0,                       // 0–1 (% que o fundo detém)
  "valorContabil": 26000000,
  "valorMercado": 28500000,                  // OPCIONAL — só se houver laudo recente
  "capRateAtual": 0.112,
  "ocupacao": 1.0,
  "locatarios": [
    {
      "nome": "Atento Brasil S/A",
      "setor": "BPO/Call Center (operação Itaú)",
      "rating": null,                        // OPCIONAL — só se documento cita
      "abl": 12257,
      "percAbl": 1.0,
      "contrato": {
        "tipo": "tipico" | "atipico" | "built_to_suit",
        "inicio": "2019-05-01",
        "vencimento": "2029-05-31",
        "indexador": "IPCA",
        "valorMensal": 243000,
        "valorM2": 19.82,
        "multa": "Sem multa rescisória após carência (típico)",
        "renovacao": {                       // OPCIONAL TODO o objeto se doc não opina
          "probabilidade": "media",          // alta | media | baixa | indefinida
          "racional": "Operação dedicada ao Itaú; saída implica realocar 1.500 PAs",
          "fonte": "Relatório Gerencial mar/2026 (ID 1119307)"
        }
      }
    }
  ],
  "riscos": ["concentracao_locatario", "regiao_secundaria"],
  "fonte": "Informe Anual 2025 (ID 1085253)"
}
```

**Tipologias canônicas** (usar exatamente estes valores):
- `logistica_modular`, `logistica_last_mile`, `galpao_industrial`, `galpao_frigorificado`
- `escritorio_aaa`, `escritorio_a`, `escritorio_back_office`
- `shopping_premium`, `shopping_regional`, `shopping_outlet`, `varejo_strip`
- `hospital`, `clinica`, `laboratorio`
- `hotel_premium`, `hotel_economico`, `agencias_bancarias`
- `educacao`, `data_center`, `varejo_supermercado`

#### 3b. Ativo tipo `cri`

```jsonc
{
  "tipo": "cri",
  "id": "cri-iguatemi-2030",
  "codigoCetip": "21H1234567",                  // OPCIONAL
  "devedor": "Iguatemi S.A.",
  "setorDevedor": "Shoppings",                  // setor canônico (ver lista)
  "lastro": "Aluguéis Shopping Iguatemi SP",
  "garantias": ["alienacao_fiduciaria_imovel", "cessao_fiduciaria_recebiveis"],
  "rating": "AAA(bra)",                          // OPCIONAL
  "agenciaRating": "Fitch",                      // OPCIONAL
  "indexador": "IPCA" | "CDI" | "PreFixado" | "IPCA+" | "CDI+",
  "spread": 0.072,                                // 7,20% (decimal)
  "taxaTotal": 0.142,                             // % a.a. equivalente (decimal)
  "duration": 4.1,                                // anos
  "vencimento": "2030-06-15",
  "valorPresente": 38000000,                      // R$ absolutos
  "percPL": 0.062,                                // 0–1
  "perfilRisco": "high_grade" | "mid_grade" | "high_yield",
  "status": "em_dia" | "atraso_30d" | "atraso_60d" | "atraso_90d" | "default" | "renegociado",
  "ltv": 0.45,                                    // OPCIONAL (LTV específico do CRI)
  "fonte": "Relatório Gerencial mar/2026"
}
```

**Setores de devedor canônicos:** `Shoppings`, `Logística`, `Escritórios`, `Hospitalar`, `Educação`, `Varejo`, `Residencial`, `Loteamento`, `Multipropriedade`, `Hotéis`, `Industrial`, `Agronegócio`, `Outros`.

**Garantias canônicas:** `alienacao_fiduciaria_imovel`, `alienacao_fiduciaria_cotas`, `cessao_fiduciaria_recebiveis`, `aval_pessoa_fisica`, `fianca_corporativa`, `coobrigacao`, `fundo_reserva`, `seguro_credito`, `subordinacao`, `sem_garantia_real`.

#### 3c. Ativo tipo `cra`

Mesmo schema do `cri` com campos extra:

```jsonc
{
  "tipo": "cra",
  // ... campos do cri ...
  "cultura": "Soja" | "Milho" | "Cana" | "Algodão" | "Café" | "Pecuária" | "Misto",
  "regiaoProducao": "Centro-Oeste"
}
```

#### 3d. Ativo tipo `fii` (FoF look-through)

```jsonc
{
  "tipo": "fii",
  "ticker": "GGRC11",
  "nome": "GGR Covepi Renda",
  "segmentoFinal": "logistica_industrial",       // look-through pro segmento real do FII investido
  "valorPresente": 95000000,
  "percPL": 0.43,
  "qtdCotas": 9614000,
  "precoMedio": 9.80,                            // R$ (preço médio de aquisição se documentado)
  "fonte": "Informe Mensal mar/2026 (ID 1119307)"
}
```

`segmentoFinal` é crítico: para fins de diversificação, ter "GGRC11 = logística industrial" via FoF tem **mesmo risco subjacente** que ter cotas de um FII de logística diretamente. O renderer e a aba Encaixe usam esse campo para look-through.

### 3e. `analise` — interpretação humana do portfólio (opcional, recomendado)

Bloco em formato livre para responder ao leitor: **"esse portfólio é bom? para quem serve? qual o risco interno?"**. Diferente de Encaixe (responde "para qual perfil de investidor"), `portfolio.analise` responde **sobre a qualidade interna do portfólio**.

```jsonc
"analise": {
  "rotulo":   "Diversificação ampla com peso em logística HG e papel high yield",
  "cor":      "amber" | "emerald" | "red" | "blue" | "slate",
  "tags": [ "36 FIIs subjacentes", "HHI 0,034 (muito diversificado)", "Camada dupla de taxas" ],
  "veredicto": "<p>HTML 2-4 frases — leitura compilada sobre o portfólio.</p>",
  "pontosFortes": [ "Diversificação real ampla — HHI 0,034, top-10 cobre apenas 32% do PL", "..." ],
  "pontosFracos": [ "Custo total efetivo 1,5–1,7% a.a. (camada dupla)", "..." ],
  "perfilInvestidor": "Investidor que quer exposição diversificada... NÃO é para quem busca DPS crescente."
}
```

**Quando preencher:** sempre que o fundo justifica uma leitura interpretativa (concentração relevante, mix complexo, custo não-óbvio, qualidade variável dos ativos). Para fundos triviais (1 imóvel/1 locatário) pode ser omitido.

### 3f. Bloco "VP em tempo real" para FoF (renderer automático)

Quando `tipoFundo: "fof"` e os ativos `tipo: "fii"` têm `qtdCotas` preenchido, o renderer mostra automaticamente um bloco "VP em tempo real" calculando o VP/cota look-through (cotas detidas × preço atual de cada FII subjacente).

**Regra dura:** se < 50% dos ativos `tipo: "fii"` têm `qtdCotas` preenchido, o bloco **NÃO é exibido** (ficaria enganoso/incompleto). Para fundos onde o gestor não publica cotas detidas mensalmente, o bloco fica oculto e o VP/cota oficial declarado pelo fundo segue como referência principal.

### 4. `concentracao` — métricas estruturais

```jsonc
"concentracao": {
  "hhi":              0.34,              // Herfindahl-Hirschman: Σ(pct_i)² para os ativos. 0–1.
  "interpretacaoHhi": "alta",            // baixa < 0.15, moderada 0.15–0.25, alta > 0.25
  "topN": {
    "top1Pct":  0.43,
    "top3Pct":  0.93,
    "top5Pct":  1.00,
    "top10Pct": 1.00
  },
  "geografica": [                         // só tijolo. Soma = 1.0
    { "regiao": "Nordeste",  "pct": 1.00, "ativos": 1 }
  ],
  "porLocatario": [                       // só tijolo. Top 5
    { "nome": "Atento Brasil",   "pct": 1.00, "rating": null }
  ],
  "porDevedor": [                         // só papel/cra. Top 10
    { "nome": "Iguatemi",        "pct": 0.062 }
  ],
  "porIndexador": [                       // só papel/cra. Soma = 1.0
    { "indexador": "IPCA",        "pct": 0.61 },
    { "indexador": "CDI",         "pct": 0.34 },
    { "indexador": "PreFixado",   "pct": 0.05 }
  ],
  "porSetorDevedor": [                    // só papel/cra. Soma = 1.0
    { "setor": "Shoppings", "pct": 0.30 }
  ]
}
```

**Cálculo do HHI** (a fazer programaticamente):
- Para cada ativo, pegar `percPL` (ou equivalente `valorPresente / patrimonioLiquido`).
- HHI = Σ(percPL²). Caixa/RF e ativos < 1% podem ser agregados em "Outros".
- Interpretação: < 0.15 baixa concentração, 0.15–0.25 moderada, > 0.25 alta.

### 5. Regras duras (Portfolio v2)

1. **Soma de `alocacaoPL` = 1.0 ± 0.005.** Se faltar arredondamento, ajustar a categoria "Caixa/RF".
2. **`participacao` ∈ (0, 1].** Se o fundo detém via SPE com participação minoritária, aplicar o `participacao` no `valorContabil` e `valorMercado` apropriadamente.
3. **`vencimento` em ISO** (`YYYY-MM-DD`). Se documento só tem mês, usar `YYYY-MM-01`.
4. **`renovacao` é OPCIONAL.** Não inventar probabilidade. Se documento não opina, omitir o objeto inteiro.
5. **`rating` é OPCIONAL.** Só preencher se há agência citada explicitamente.
6. **`status` (papel) é OBRIGATÓRIO.** Se documento não diz, assumir `em_dia` somente se o último Relatório Gerencial cita o CRI sem flag de inadimplência. Caso contrário, omitir o ativo (preferir incompletude a erro).
7. **`segmentoFinal` (FoF) é OBRIGATÓRIO.** Se o FII investido não tem análise no projeto, o worker deve buscar o segmento no Informe Anual do FII investido (ou inferir pelo nome/setor declarado).

### 6. Onde cada dado vem (referência rápida — Portfolio v2)

| Campo | Fonte primária |
|---|---|
| `ativos[].tipo=imovel.endereco/abl/padrao` | Informe Anual + Laudo de Avaliação |
| `ativos[].tipo=imovel.locatarios[].contrato` | Relatório Gerencial recente (item "Inquilinos" ou "Carteira de Contratos") |
| `ativos[].tipo=imovel.locatarios[].contrato.indexador/valorMensal` | Relatório Gerencial recente |
| `ativos[].tipo=cri.devedor/lastro/garantias/indexador/spread/vencimento` | Relatório Gerencial mensal (tabela de CRIs) + Termo de Securitização |
| `ativos[].tipo=cri.status` | Coluna "Status" ou "Inadimplência" do Relatório Gerencial mais recente |
| `ativos[].tipo=fii.segmentoFinal` | Informe Anual do FII investido (data/fiis-optimized/{TICKER_INVESTIDO}/) |
| `concentracao.hhi` | Cálculo programático sobre `ativos[].percPL` |
| `concentracao.geografica` | Agregar `ativos[].geo.regiao` ponderado por `percPL` |

## Aba Encaixe v1 — checklist obrigatório

A aba Encaixe responde a pergunta que nenhuma outra aba responde sozinha: **"onde esse fundo se encaixa na carteira de um investidor real, e em que estratégia ele faz sentido?"**.

Não é redundante com `tese` (que descreve "o que o fundo é") nem com `recomendacao` (que dá uma nota geral): a Encaixe **operacionaliza** essas respostas em estratégias, riscos ocultos, sobreposição com pares, e cenários macro/micro.

A aba é renderizada **depois de Tese, antes de Dividendos** no menu da página.

### 1. `identidade` — a frase única

```jsonc
"identidade": {
  "rotulo":     "FII híbrido pós-turnaround em transformação de portfólio",   // 5–10 palavras
  "subrotulo":  "Trade especulativo de reestruturação — desconto patrimonial em troca de risco de execução",  // 1 frase
  "cor":        "amber" | "emerald" | "red" | "blue"
}
```

A `cor` é o tom geral do encaixe — `emerald` para fundos seguros e previsíveis, `amber` para situações que exigem cuidado, `red` para alto risco/especulativo, `blue` para casos atípicos/informativos.

### 2. `perfilRisco` — score quantitativo

Score em escala 1.0–5.0 (1 = baixíssimo risco, 5 = altíssimo risco), composto por 6 sub-componentes ponderados:

```jsonc
"perfilRisco": {
  "nivel":  "baixo" | "medio" | "alto" | "muito_alto",
  "score":  3.7,                    // arredondado a 1 casa decimal
  "componentes": [
    { "nome": "Concentração",                  "score": 4.5, "peso": 0.20, "metrica": "...", "leitura": "..." },
    { "nome": "Volatilidade do preço",         "score": 3.5, "peso": 0.15, "metrica": "...", "leitura": "..." },
    { "nome": "Volatilidade do dividendo",     "score": 4.0, "peso": 0.20, "metrica": "...", "leitura": "..." },
    { "nome": "Liquidez",                      "score": 4.5, "peso": 0.15, "metrica": "...", "leitura": "..." },
    { "nome": "Risco do ativo subjacente",     "score": 3.0, "peso": 0.20, "metrica": "...", "leitura": "..." },
    { "nome": "Risco financeiro/alavancagem",  "score": 1.0, "peso": 0.10, "metrica": "...", "leitura": "..." }
  ]
}
```

**Soma dos pesos = 1.0** (rígido). **Faixas de `nivel`:** `baixo` < 2.0; `medio` 2.0–3.0; `alto` 3.0–4.0; `muito_alto` > 4.0.

**Como pontuar cada componente** (todos em escala 1–5, onde 1 = melhor para o investidor):

| Componente | Métrica | 1 (melhor) | 5 (pior) |
|---|---|---|---|
| Concentração | HHI do `concentracao.hhi` | < 0.10 | > 0.50 |
| Volatilidade do preço | σ12m anualizado | < 12% | > 30% |
| Volatilidade do dividendo | CV24m do DPS | < 3% | > 15% |
| Liquidez | Volume médio 21d | > R$ 10M | < R$ 500k |
| Risco do ativo subjacente | Vacância + WAULT (tijolo) / Inadimplência + Rating médio (papel) | Vacância 0% + WAULT 8a / 0% inad + AAA | Vacância > 20% / > 10% inad |
| Risco financeiro | LTV / cobertura de dívida | LTV 0% / cobertura ∞ | LTV > 50% |

A coluna `metrica` no JSON deve trazer **o número observado** (não a faixa); a coluna `leitura` traz uma frase curta de leitor leigo.

### 3. `estrategias[]` — em que estratégia o fundo cabe

Lista de estratégias canônicas (avaliar todas, não selecionar). Cada item tem `encaixa: true | false | "parcial"`:

```jsonc
"estrategias": [
  {
    "nome":     "Renda mensal previsível",
    "encaixa":  false,
    "racional": "DPS oscilou entre R$ 0,40–0,725 nos últimos 24 meses — fundo em transformação, sem regime estável"
  },
  {
    "nome":     "Hedge inflacionário (IPCA)",
    "encaixa":  "parcial",
    "racional": "Receita do imóvel Atento é IPCA, mas só 17% do PL — exposição diluída"
  },
  {
    "nome":     "Swing por desconto patrimonial",
    "encaixa":  true,
    "racional": "P/VP 0,70 com programa de recompra ativo — convergência ao VP é o trade central"
  },
  {
    "nome":     "Especulação em queda de Selic",
    "encaixa":  true,
    "racional": "FIIs descontados costumam reprecificar mais que a média em ciclo de queda"
  },
  {
    "nome":     "Exposição setorial concentrada (logística HG)",
    "encaixa":  "parcial",
    "racional": "43% via cotas GGRC11 dão exposição indireta — para tese pura, comprar GGRC11 direto é mais limpo"
  },
  {
    "nome":     "Núcleo de carteira para aposentado",
    "encaixa":  false,
    "racional": "Volatilidade alta + DPS oscilando + baixa liquidez incompatíveis com objetivo de renda estável"
  },
  {
    "nome":     "Diversificação setorial",
    "encaixa":  false,
    "racional": "Composição 43% GGRC11 + 17% imóvel + 33% SPE — quem busca diversificação setorial monta direto"
  }
]
```

**Estratégias canônicas (avaliar todas):**
- `Renda mensal previsível`
- `Hedge inflacionário (IPCA)`
- `Hedge cambial / dolarização`  *(quando aplicável — fundos com receita em USD)*
- `Swing por desconto patrimonial`
- `Especulação em queda de Selic`
- `Especulação em alta de Selic` *(papel CDI, principalmente)*
- `Exposição setorial concentrada` *(citar setor)*
- `Núcleo de carteira para aposentado`
- `Diversificação setorial`
- `Tax-shield (rendimento isento)` *(genérico para todo FII brasileiro — destacar quando é a principal razão)*

### 4. `riscosOcultos[]` — o que o rótulo não diz

Lista de até 5 riscos não óbvios pela leitura superficial do prospecto/segmento. Cada item:

```jsonc
{
  "titulo":     "Concentração em GGR Covepi (43% do PL)",
  "severidade": "alta",                                // baixa | media | alta
  "descricao":  "Quase metade do PL está em cotas de um único FII (GGRC11). Risco de gestora, governança e liquidez se transmite integralmente",
  "mitigacao":  "Programa de recompra reduz exposição relativa; gestor sinalizou intenção de reciclar para imóveis diretos"   // OPCIONAL — null se não há
}
```

**Distinguir de `pontosAtencao` (top-level):** `pontosAtencao` lista riscos visíveis e numéricos (vacância X%, P/VP Y); `riscosOcultos` é interpretativo — o "porquê esse fundo é mais arriscado do que parece".

### 5. `liquidez` — quanto tempo para sair

```jsonc
"liquidez": {
  "volumeMedio21d":      308000,                 // R$ médio por dia útil
  "volumeMedio252d":     412000,
  "diasParaSair": {                              // assumindo absorver no máximo 20% do volume diário
    "10mil":     0.16,
    "100mil":    1.6,
    "500mil":    8.1,
    "1milhao":   16.2,
    "10milhoes": 162.3
  },
  "spread":  0.0042,                             // bid-ask % médio (OPCIONAL — pode não existir no histórico)
  "leitura": "Liquidez baixa. Posição de R$ 1M leva ~16 dias úteis para liquidar sem mover preço — incompatível com saída rápida"
}
```

**Premissa fixa:** `diasParaSair[X] = X / (volumeMedio21d × 0.20)`. O fator 0.20 vem do consenso de mercado (não absorver mais que 20% do volume diário sem mover preço).

**Fonte do volume:** `data/fiis/{ticker}/historico_volume.csv` (a ser criado). Enquanto o CSV não existir, o worker pode estimar a partir de menção no Relatório Gerencial ou usar o último observado citado em algum doc — flag `liquidez.fonte: "estimativa_relatorio"` nesse caso.

### 6. `volatilidade` — preço e dividendo

```jsonc
"volatilidade": {
  "preco": {
    "sigma12m":         0.28,                    // desvio padrão dos retornos diários × √252
    "sigma24m":         0.31,
    "drawdownMax24m":   -0.34,
    "drawdownMaxData":  "2024-10",
    "tempoRecuperacao": null                     // meses — null se ainda não recuperou
  },
  "dividendo": {
    "cv12m":             0.082,                  // coef. variação = σ/μ do DPS dos últimos 12m
    "cv24m":             0.184,
    "minDps24m":         0.40,
    "maxDps24m":         0.725,
    "amplitudeRelativa": 0.81                    // (max-min)/min
  }
}
```

**Cálculo de `sigma`:** o worker usa `data/fiis/{ticker}/historico_precos.csv` (já existente). Retorno log diário, σ amostral × √252.

**Cálculo de `cv`:** desvio padrão amostral / média, sobre os últimos N meses do `dividendos.historico[]`.

### 7. `sobreposicaoPares` — diversificação real

A chave da feature futura "Minha Carteira". Hoje preenchida pelo Opus de forma qualitativa; quando a feature existir, será calculada programaticamente.

```jsonc
"sobreposicaoPares": {
  "subsegmento":  "hibrido_em_transformacao",    // mesmo de paresComparaveis.subsegmento
  "pares": [
    {
      "ticker":               "GGRC11",
      "sobreposicaoEstimada": 0.43,              // 0–1
      "tipoSobreposicao":     ["look_through_direto"],
      "leitura":              "BLMG11 detém 43% do PL em cotas de GGRC11. Quem já tem GGRC11 está duplicando exposição diretamente — não há diversificação real"
    },
    {
      "ticker":               "ONDV11",
      "sobreposicaoEstimada": 0.03,
      "tipoSobreposicao":     ["look_through_direto"],
      "leitura":              "Sobreposição marginal — 3% do PL"
    }
  ],
  "diversificacaoReal": "Para investidor com posição relevante em GGRC11, BLMG11 NÃO é diversificação. Para quem quer exposição ao trade de turnaround sem GGRC11, considerar fundos de reestruturação puros (ex: análise específica caso a caso)"
}
```

**`tipoSobreposicao` canônico** (lista — pode ter múltiplos):
- `look_through_direto` — o fundo investe em cotas do par diretamente.
- `geografica` — mesma região/cidade dominante.
- `tipologia` — mesma tipologia (galpão modular, escritório AAA).
- `perfil_inquilinos` — mesmo segmento de locatários (e-commerce, bancos, varejo).
- `setor_devedor` — papel: mesmo setor de devedor (shoppings, residencial).
- `indexador` — papel: mesmo indexador dominante.
- `gestora` — mesma gestora (risco de governança se transmite).

**`sobreposicaoEstimada` é qualitativa hoje** — Opus pondera os tipos de sobreposição e estima 0–1. Premissa: peso `look_through_direto` = % direto; outros tipos somam max 0.5 (não há sobreposição real "perfeita" sem look-through).

### 8. `cenarios[]` — quando brilha vs sofre

Lista de até 6 cenários (favoráveis e desfavoráveis), com probabilidade relativa qualitativa:

```jsonc
"cenarios": [
  {
    "tipo":                  "favoravel",
    "titulo":                "Selic em queda + IFIX em alta",
    "descricao":             "FIIs descontados reprecificam para o VP — BLMG11 com P/VP 0,70 captura mais que a média em rally",
    "probabilidadeRelativa": "alta"          // alta | media | baixa
  },
  {
    "tipo":                  "favoravel",
    "titulo":                "Aquisição transformacional bem-sucedida",
    "descricao":             "Gestor anuncia compra de portfólio com cap rate ≥ 11% usando o caixa atual — DPS sobe e desconto fecha"
  },
  {
    "tipo":                  "desfavoravel",
    "titulo":                "Renovação Atento 2029 não acontece",
    "descricao":             "Único locatário do imóvel direto sai sem substituto imediato — perda de 17% da receita imobiliária + vacância prolongada"
  },
  {
    "tipo":                  "desfavoravel",
    "titulo":                "GGRC11 corta dividendo",
    "descricao":             "43% do PL exposto via cotas — corte do GGRC11 transmite proporcionalmente para BLMG11"
  }
]
```

### 9. `paraQuem` e `paraQuemNao` — operacionalização da tese

```jsonc
"paraQuem": {
  "objetivo":       ["especulacao_curto", "swing_desconto", "trade_turnaround"],   // tags
  "horizonte":      "curto_medio",                  // curto | curto_medio | medio | medio_longo | longo
  "perfil":         "arrojado",                     // conservador | moderado | arrojado
  "carteiraTipica": "Posição satélite (≤ 5% da carteira de FIIs) para investidor que aceita volatilidade em troca de prêmio de desconto patrimonial",
  "perfisExemplo": [
    "Investidor que acompanha turnarounds e topa monitorar trimestralmente a execução do gestor",
    "Posição complementar para quem não tem exposição a GGRC11 e quer um veículo descontado"
  ]
},
"paraQuemNao": {
  "perfilExclusao": [
    "Aposentado que precisa de DPS estável — fundo em transformação não dá previsibilidade",
    "Quem já tem posição grande em GGRC11 — sobreposição direta de 43% não diversifica",
    "Quem busca alta liquidez — R$ 308 mil/dia limita posições > R$ 100k",
    "Investidor iniciante — exige acompanhamento ativo de execução pós-turnaround"
  ]
}
```

**Tags `objetivo` canônicas:** `renda_mensal`, `preservacao_capital`, `hedge_inflacao`, `hedge_cambial`, `especulacao_curto`, `swing_desconto`, `trade_turnaround`, `crescimento_patrimonial`, `diversificacao_setorial`, `tax_shield`.

### 10. Schema completo da chave `encaixe`

```jsonc
"encaixe": {
  "schema": "v1",
  "dataAnalise": "2026-04-26",

  "identidade":        { ... seção 1 ... },
  "perfilRisco":       { ... seção 2 ... },
  "estrategias":       [ ... seção 3 ... ],
  "riscosOcultos":     [ ... seção 4 ... ],
  "liquidez":          { ... seção 5 ... },
  "volatilidade":      { ... seção 6 ... },
  "sobreposicaoPares": { ... seção 7 ... },
  "cenarios":          [ ... seção 8 ... ],
  "paraQuem":          { ... seção 9 ... },
  "paraQuemNao":       { ... seção 9 ... }
}
```

### 11. Regras duras (Encaixe v1)

1. **Soma de `perfilRisco.componentes[].peso` = 1.0** (rígido).
2. **`liquidez.diasParaSair[X]` = X / (volumeMedio21d × 0.20)** (fórmula fixa, não interpretar).
3. **`sobreposicaoPares.pares[]` lista no mínimo 3 e no máximo 6 pares** — usar os mesmos tickers de `valuation.paresComparaveis.tickers` quando aplicável; adicionar look-through (ativos do tipo `fii` em `portfolio.ativos[]`) sempre.
4. **`estrategias[]` avalia TODAS as estratégias canônicas** — não selecionar só as que encaixam. Usuário precisa ver explicitamente o que NÃO serve.
5. **Coerência com outras abas:**
   - `perfilRisco.nivel` deve ser coerente com `recomendacao.nota` (fundos com nota ≥ 8.0 raramente são `alto` ou `muito_alto`; se forem, justificar em `riscosOcultos`).
   - `estrategias[].encaixa = true` para "Renda mensal previsível" exige `dividendos.sintese.tendencia ∈ {sustentavel_longo, estavel}`.
   - `cenarios[]` desfavoráveis devem incluir pelo menos 1 risco já listado em `pontosAtencao` ou `riscosOcultos`.
6. **`identidade.rotulo` ≤ 60 caracteres**; `subrotulo` ≤ 120 caracteres.
7. **`riscosOcultos[].severidade = alta` exige descrição com número** (% PL, vencimento, %vacância) — sem números, é opinião e deve descer para `media` ou virar `pontosAtencao`.

### 12. Onde cada dado vem (referência rápida — Encaixe v1)

| Campo | Fonte primária |
|---|---|
| `perfilRisco.componentes[Concentração]` | Cálculo sobre `portfolio.concentracao.hhi` |
| `perfilRisco.componentes[Volatilidade preço]` | Cálculo sobre `data/fiis/{ticker}/historico_precos.csv` |
| `perfilRisco.componentes[Volatilidade dividendo]` | Cálculo sobre `dividendos.historico[]` |
| `perfilRisco.componentes[Liquidez]` | `data/fiis/{ticker}/historico_volume.csv` (a criar) ou estimativa de Relatório Gerencial |
| `perfilRisco.componentes[Risco subjacente]` | `portfolio.stats.vacancia/wault` (tijolo) ou `portfolio.stats.inadimplenciaPct` (papel) |
| `riscosOcultos[]` | Síntese qualitativa do worker — base é `pontosAtencao` + análise de `portfolio.ativos[]` |
| `sobreposicaoPares.pares[].look_through_direto` | `portfolio.ativos[]` filtrado por `tipo: "fii"` |
| `cenarios[]` | Combinação de `dividendos.eventosFuturos[]` + `valuation.expectativa.*` + macro |

## Aba Relações v1 — checklist obrigatório

A aba Relações registra **vínculos do fundo com outros FIIs, gestoras ou contrapartes recorrentes** que possam configurar conflito de interesse. O leitor que clica nessa aba quer saber: *este fundo deve favores para alguém? está sendo usado para "salvar" outro fundo da mesma gestora? está com o portfólio inflado por subscrição artificial?*

A presença de uma relação NÃO é veredicto automático de "fraude" — muitas relações são legítimas (CRIs com mesmo originador, locatário comum, FoF que opera dentro do ecossistema da gestora). Mas o cotista precisa ver e tirar suas conclusões.

### 0. Quando preencher

**OBRIGATÓRIO** registrar uma relação quando, durante a análise dos documentos do fundo, qualquer uma dessas situações for identificada:

1. **Subscrição em emissão acima de mercado** — o fundo subscreveu cotas de outro FII num preço claramente acima da cotação de mercado na data, ou vice-versa.
2. **Troca de cotas / dação em pagamento** — pagamento de aquisição/venda total ou parcial em cotas do outro fundo.
3. **Mesma gestora em ambos os lados** com transação bilateral relevante (compra/venda, contrato, contraprestação).
4. **CRI/CRA com mesmo devedor** que aparece em ≥ 3 outros FIIs do mercado — devedor "comum" cria correlação oculta.
5. **Locatário compartilhado** quando representa > 10% da receita de cada um dos lados.
6. **Contraprestação contratada por X anos** entre dois FIIs (caso clássico GGRC11→BLMG11 em SBC).
7. **Mudança de gestor** que envolveu transferência de cotas/portfólio para outro FII da nova gestora.
8. **Empréstimo ou aporte de caixa** entre fundos da mesma casa (raro, mas existe).

### 1. Schema `relacoes[]` — top-level

```jsonc
"relacoes": [
  {
    "id": "BLMG11-GGRC11-2024-06",
    "contraparte": {
      "ticker": "GGRC11",                 // ticker do outro lado; null se "externo"
      "tipo": "fii",                       // fii | gestora | locatario | devedor_cri | spe | externo
      "nome": "GGR Covepi Renda",
      "gestora": "TC Gestora"             // nome da gestora da contraparte (para detectar conflito)
    },
    "tipo": "venda_paga_em_cotas",        // ver tabela de tipos abaixo
    "data": "2024-06-15",
    "valor": 130000000,                    // R$ — valor envolvido na transação
    "fluxo": "deu_favor",                  // deu_favor | recebeu_favor | reciproco | neutro
    "favorAberto": false,                  // true se a contrapartida ainda não foi prestada
    "agioSobreMercado": {
      "presente": true,
      "valorPercent": 8.5,                 // % acima da cotação de mercado na data
      "leituraMercado": "BLMG11 negociava R$ 30 em jun/2024; cotas pagas a R$ 32,55"
    },
    "mesmaGestora": false,                // true quando ambos os lados têm a mesma gestora
    "severidadeConflito": "media",        // alta | media | baixa | inexistente
    "descricao": "<p>HTML 1-3 frases descrevendo o vínculo de forma factual, sem opinião.</p>",
    "leituraInterpretativa": "<p>HTML 1-2 frases — o que o cotista deve observar nessa relação. Pode ser neutro.</p>",
    "fontes": [
      { "documento": "Fato Relevante 14/06/2024", "docId": "947799", "trecho": "BLMG11 vende galpão SBC ao GGRC11 por R$ 130 Mi, recebendo R$ 91 Mi à vista e R$ 39 Mi em 4.674.548 cotas do GGRC11" }
    ]
  }
]
```

### 2. Tipos canônicos de relação

| Tipo | Descrição | Quando severidade é alta |
|---|---|---|
| `subscricao_emissao_acima` | Fundo A subscreveu emissão de B com ágio sobre cotação | Mesma gestora + ágio > 5% |
| `troca_de_cotas` | Pagamento de transação em cotas (não em caixa) | Mesma gestora + sem laudo de avaliação independente |
| `venda_paga_em_cotas` | Vendeu ativo recebendo cotas como contrapartida | Cotas com ágio relevante |
| `aquisicao_paga_em_cotas` | Comprou ativo emitindo cotas próprias com ágio | Sempre flag se > 5% acima |
| `contraprestacao_contratada` | Pagamento periódico (X anos) entre fundos | Independente — só registrar |
| `cri_devedor_comum` | Mesmo devedor em CRIs detidos por vários FIIs | Devedor com problema (default, atraso) |
| `locatario_compartilhado` | Mesmo inquilino em vários FIIs (concentração sistêmica) | Locatário > 15% de cada fundo |
| `mesma_gestora_transacao` | Transação bilateral entre dois fundos da mesma casa | Sempre flag |
| `transferencia_portfolio` | Mudança de gestor levou ativos de A para B (mesma nova gestora) | Sempre flag |
| `aporte_de_caixa` | Empréstimo direto entre fundos | Sempre alta severidade |
| `emprestimo_cri_intra` | Emissão de CRI tendo outro FII da casa como subscritor | Sempre flag |
| `outro_vinculo` | Vínculo material que não cabe nos tipos acima | A julgar pelo LLM |

### 3. Critérios para detectar "favor"

O LLM marca `fluxo: "deu_favor"` ou `recebeu_favor` quando algum desses sinais aparecer:

1. **Ágio sobre mercado:** o subscritor pagou > 3% acima da cotação média dos 30 dias anteriores. Quanto maior o ágio, mais clara a transferência de valor.
2. **Unilateralidade da operação:** A subscreveu B (favor de A para B) sem que B tenha subscrito A no mesmo intervalo de tempo (12 meses).
3. **Disponibilidade alternativa:** o subscritor tinha caixa para comprar a cota em mercado e mesmo assim escolheu a emissão com ágio.
4. **Contexto da contraparte:** o fundo que recebeu o favor estava em situação de pressão (vacância, queima de caixa, vencimento de CRI).

`favorAberto: true` quando a transação foi unilateral e nenhuma operação recíproca foi documentada nos 12 meses seguintes — fica como "dívida moral" pendente.

### 4. Severidade do conflito

- **`alta`** — mesma gestora dos dois lados + ágio > 5% + ausência de laudo independente; OU aporte de caixa direto entre fundos; OU aquisição que alivia caixa de outro fundo da casa.
- **`media`** — mesma gestora dos dois lados em transação bilateral material, mas com laudo / preço justificável; OU contraparte recorrente sem afinidade societária (CRI mesmo devedor em ≥ 3 fundos sem evidência de coordenação).
- **`baixa`** — vínculo legítimo já público (FoF que detém cotas dentro do mandato declarado, locatário comum não-âncora).
- **`inexistente`** — relação informativa só (ex: contraprestação contratada com prazo definido sem ágio nem mesmo gestor).

### 5. Onde achar nos `.md` de `data/fiis-optimized/{TICKER}/`

| Sinal | Documento típico |
|---|---|
| Subscrição em emissão | Comunicado ao Cotista de Subscrição / Fato Relevante de Aprovação de Emissão |
| Troca de cotas / dação | Fato Relevante de Aquisição/Venda + tabela de pagamento no Relatório Gerencial seguinte |
| Contraprestação | Fato Relevante de Venda + Demonstrações Financeiras (nota explicativa "Contas a receber de partes relacionadas") |
| Mesma gestora | comparar `gestora.nome` do fundo analisado com `gestora.nome` do JSON da contraparte |
| Devedor comum em CRI | `portfolio.ativos[]` tipo `cri` com mesmo `devedor` em outros fundos |
| Locatário compartilhado | `portfolio.ativos[].locatarios[]` cruzado com outros fundos |
| Aporte/empréstimo | DEMONSTRAÇÕES FINANCEIRAS — nota explicativa "Operações com partes relacionadas" |

**Regra dura:** cada item de `relacoes[]` precisa de pelo menos UMA `fontes[]` com `docId` válido. Se não tem fonte documentada, NÃO REGISTRAR.

### 6. Schema agregado `data/conexoes-fiis.json`

Após cada análise, o pipeline executa `scripts/fundosnet/construir_grafo_relacoes.py` que varre todos os `data/fiis/*.json`, extrai os arrays `relacoes[]`, deduplica e produz `nodes[]` e `edges[]` para a tela visual `/fiis/conexoes/`.

### 7. Regras duras (Relações)

1. **NÃO inventar relação.** Sem fonte documental (`docId`), não registra.
2. **NÃO classificar como "favor" sem critério objetivo.** Use a tabela da seção 3.
3. **NÃO classificar severidade `alta`** sem que pelo menos UM dos critérios da seção 4 seja satisfeito.
4. **`fluxo` é direcional do ponto de vista DESTE fundo.** Se este fundo subscreveu emissão de outro com ágio, marcar `deu_favor`. Se este fundo recebeu subscrição com ágio, `recebeu_favor`.
5. **`mesmaGestora`** sempre verificar comparando `gestora.nome` (normalizar acentos e abreviações).
6. **Não confundir relações com `eventosValuation[]`.** Relações falam de **vínculos persistentes ou potencial conflito**; eventos falam de **fatos pontuais**. Mesma operação pode aparecer em ambos.
7. **Reanálise:** relações passadas permanecem, apenas adiciona-se as novas. Atualizar `favorAberto` para `false` quando uma operação recíproca for identificada nos 12 meses subsequentes.

## Consistência cruzada — REGRA-MÃE

**Toda análise é uma narrativa única.** Cada seção do JSON conta a mesma história — não pode haver divergência entre o que `recomendacao` afirma e o que `expectativa` sugere, ou entre `dividendos.sustentabilidade` e `valuation.expectativa`. O leitor que pula entre abas precisa encontrar a mesma tese.

Inconsistências aparecem com mais frequência em **reanálises** (refazer a análise de um fundo já analisado), porque o LLM regenera do zero perdendo o contexto da versão anterior. **Em reanálise, sempre considere a análise anterior como ponto de partida** — você é o autor dela. Mantenha o que continua válido. Mude apenas o que mudou, e cite o motivo.

### Princípios

1. **Você é o autor da análise anterior.** Quando refazendo, leia primeiro `data/fiis/{ticker}.json` que já existe. O que estava lá é seu. Não contradiga sem motivo documentado (novo doc, novo evento, mudança de cenário macro).
2. **Uma só voz.** O fundo recebe uma única tese. Se positivo em `recomendacao`, deve ser positivo em `tese.paraQuem`, em `valuation.expectativa.medio` e em `conclusao.conclusaoFinal`. Se houver tese mista, a contradição deve ser **explicitada** ("é positivo para X, negativo para Y") nas duas pontas.
3. **Mudança de tese exige motivo.** Se a recomendação muda entre análises, `meta.mudancaTese` documenta: o que mudou nos documentos novos, evento ou indicador específico, data exata. Sem motivo concreto, mantenha a tese anterior.

### Regras de coerência (auditadas automaticamente)

Estas verificações rodam após cada análise via `scripts/fundosnet/auditar_consistencia.py`. Falhas em regras `severidade: alta` disparam segunda passada do LLM com lista de divergências.

| # | Regra | Severidade |
|---|---|---|
| C1 | `recomendacao.nota` 0–4 ⇒ `veredicto` ∈ {VENDA, EM_ANALISE}; 5–7 ⇒ MANTER ou EM_ANALISE; 8–10 ⇒ COMPRA | alta |
| C2 | `recomendacao.cor` casa com veredicto: COMPRA=emerald, MANTER=amber, VENDA=red, EM_ANALISE=slate | alta |
| C3 | `meta.sentimento` casa com veredicto: COMPRA→otimista, MANTER→neutro, VENDA→pessimista | média |
| C4 | `dividendos.sustentabilidade.dividendoStatus = pressao_imediata` ⇒ `valuation.expectativa.curto.direcao` ∈ {queda, queda_forte, lateral_baixa, lateral} | alta |
| C5 | `dividendos.sintese.tendencia` ∈ {queda, queda_forte} ⇒ `valuation.expectativa.medio.direcao` NÃO pode ser `alta_forte` | alta |
| C6 | `valuation.precoJustoMercado.valor` dentro de [0.7×, 1.5×] da cotação atual | alta |
| C7 | `valuation.precoJustoMercado.faixa` com largura entre 3% e 15% | média |
| C8 | Pesos de `valuation.precoJustoMercado.componentes` (excluindo A4) somam ~1.0 (±0.05) | alta |
| C9 | `valuation.expectativa.{h}.precoEsperado` dentro de `valuation.expectativa.{h}.faixa` | alta |
| C10 | Cada `valuation.eventosValuation[].docId` existe em `data/fiis-optimized/{TICKER}/{docId}.meta.json` | média |
| C11 | Cada `valuation.expectativa.{h}.catalisadores[]` tem `docId` válido OU `fonte` macro reconhecida (Focus/BCB/IPCA/Selic/curva DI) | alta |
| C12 | `pontosFortes` e `pontosAtencao` não se contradizem semanticamente | alta |
| C13 | `tese.paraQuem` e `tese.naoParaQuem` não conflitam | média |
| C14 | `conclusao.conclusaoFinal` cita o veredicto compatível com `recomendacao.veredicto` | alta |
| C15 | `meta.dataAnalise` e `footer.dataAnalise` iguais | baixa |
| C16 | `meta.totalDocumentos` e `footer.totalDocumentos` iguais | baixa |
| C17 | `valuation.precoJustoMercado.comparacaoComCotacao.cotacaoAtual` igual a `indicadores.cotacao` (±1%) | alta |
| C18 | `valuation.spread` consistente com `indicadores.dividendYield` e Selic atual | média |
| C19 | Pares em `valuation.paresComparaveis.tickers` existem em `data/pares_subsegmento.json` ou marcados como `statusClassificacao: proposto` | média |
| C20 | Reanálise: se `recomendacao.veredicto` mudou, `meta.mudancaTese` documenta o porquê com `docId` ou evento macro datado | alta |

### Reanálise — fluxo obrigatório

Quando `data/fiis/{ticker}.json` já existe ao iniciar a análise:

1. **Carregar o JSON anterior.** Pipeline anexa ao prompt como contexto explícito.
2. **Identificar o que mudou.** Comparar com `data/fiis-optimized/{TICKER}/` — quais docs são novos desde a `dataAnalise` anterior?
3. **Decidir o que reescrever** por nível de estabilidade:
   - **Imutáveis** a menos que doc explícito contradiga: `meta.nome`, `meta.segmento`, `gestora`, `taxas`, `timeline.periodos[]` (eventos passados), `valuation.eventosValuation[]` passados.
   - **Atualizar com novos docs**: `indicadores`, `dividendos.historico[]`, `dividendos.sustentabilidade`, `valuation.precoJustoMercado` (com Selic/IPCA atual), `valuation.expectativa`.
   - **Repensar com motivo registrado**: `recomendacao`, `tese`, `pontosAtencao`, `conclusao`, `valuation.paresComparaveis.posicaoFundo.leitura`.
4. **Se a tese mudou, registrar em `meta.mudancaTese`:**
   ```jsonc
   "mudancaTese": {
     "anteriorVeredicto": "MANTER",
     "anteriorNota": 6.5,
     "anteriorData": "2026-01-15",
     "atualVeredicto": "VENDA",
     "motivo": "Reavaliação patrimonial -5% em dez/2025 + venda do galpão Jandira com prejuízo de R$ 12 Mi. VP/cota caiu R$ 71→48 entre set/dez 2025.",
     "documentosCausadores": ["1085253", "947799"]
   }
   ```
5. **Se a tese se mantém, NÃO mexer.** A maioria das reanálises não muda recomendação. Mudar por mudar é ruído que confunde o leitor.

### Auditor pós-análise

Após o JSON ser salvo:

```bash
python3 scripts/fundosnet/auditar_consistencia.py --ticker BLMG11
```

Saída: relatório por regra. Divergências `severidade: alta` disparam **segunda passada** do Opus com a lista — o LLM gera patches só para os campos divergentes, sem reescrever o JSON inteiro. Severidades média/baixa viram `meta.consistencyWarnings[]` para revisão humana.

## Fluxo de execução do worker

1. **Ler universo do ticker:** `data/fiis-optimized/{TICKER}/*.meta.json` para indexar (id → tipo → dataEntrega).
2. **Priorizar docs:** ler primeiro `Prospecto` + `Informe Anual mais antigo` para pegar IPO; depois todos os `Rendimentos` cronologicamente; depois `Informes Mensais Estruturados`; depois `Relatórios Gerenciais` dos últimos 36 meses; depois `Fatos Relevantes`.
3. **Extrair `historico[]`:** montar mês a mês. Cruzar Rendimento (dividendo) com Informe Mensal (lucroLiquido, cotas, caixaAcumulado).
4. **Derivar `sustentabilidade`:** calcular payout dos últimos 12 meses com base em `historico[-12:]`.
5. **Identificar `eventosPassados[]`:** varrer Fatos Relevantes e Relatórios Gerenciais procurando termos como "cashback", "amortização extraordinária", "venda de ativo", "vacância", "redução de taxa".
6. **Projetar `eventosFuturos[]`:** revisar o Relatório Gerencial mais recente + guidance. Marcar certeza correta.
7. **Gerar `guidance` + `projecaoDy`:** usar `indicadores.cotacao` como `precoReferencia`.
8. **Pré-coleta Valuation (seção 0 acima):** rodar `coletar_historico.py`, `extrair_vp_historico.py`, `macro_snapshot.py` (se desatualizado >7d) ANTES da chamada ao LLM. Verificar que `pares_subsegmento.json` cobre o ticker — se não, anexar lista de candidatos + critério para o LLM propor.
9. **Extrair `eventosValuation[]`:** segunda varredura nos Fatos Relevantes e Informes Anuais focada em emissão / reavaliação / venda relevante / aquisição / mudança de gestor / evento de crédito (distinta da varredura de eventosPassados de Dividendos, que foca em impacto no DPS).
10. **Calcular componentes A1-A4** do `precoJustoMercado` programaticamente (script auxiliar) e passar como input para o LLM.
11. **Camada qualitativa (LLM Opus 4.7 1M):** com séries históricas + componentes calculados + dossiê completo, gera `precoJustoMercado.explicacao`, `expectativa.curto/medio/longo` com catalisadores documentados.
12. **Validar consistência:** `precoJustoMercado.valor` dentro de [0.7, 1.5]× cotação atual; `expectativa` coerente com `dividendos.sintese.tendencia`; pesos somam 1.0; faixa entre 3-15%.
13. **Escrever `alertas[]`:** máximo 3 chips.
14. **Pré-coleta Volume (para Encaixe):** rodar coletor de volume diário (yfinance — coluna Volume × cotação) e gravar em `data/fiis/{ticker}/historico_volume.csv`. Se ausente, marcar `encaixe.liquidez.fonte: "estimativa_relatorio"`.
15. **Estruturar `portfolio` v2:** ler Relatório Gerencial mais recente (Inquilinos / Carteira de Contratos / Tabela de CRIs) + Informe Anual (laudo de imóveis) + Informe Mensal Estruturado (composição PL); montar `ativos[]` discriminado por `tipo`; calcular `concentracao` (HHI sobre `percPL`, top-N, geográfica, indexador).
16. **Construir `encaixe` v1:**
    - Calcular `perfilRisco.componentes[]` com fórmulas duras (HHI, σ12m anualizado, CV24m do DPS, R$ médio diário, vacância/WAULT ou inadimplência, LTV).
    - Compor `perfilRisco.nivel` e `score` ponderado (pesos somam 1.0).
    - Avaliar TODAS as estratégias canônicas (true/false/parcial) com racional.
    - Listar até 5 `riscosOcultos[]` interpretativos — não duplicar `pontosAtencao`.
    - Calcular `liquidez.diasParaSair` com fórmula fixa (X / volumeMedio21d × 0.20).
    - `sobreposicaoPares.pares[]`: 3–6 itens, com look-through obrigatório de FIIs em `portfolio.ativos[]`.
    - `cenarios[]`: 4–6 itens, derivados de `dividendos.eventosFuturos` + `valuation.expectativa` + macro.
    - `paraQuem`/`paraQuemNao`: operacionalizar em tags + perfis-exemplo concretos.
17. **Validar coerência inter-abas (Encaixe):** `perfilRisco.nivel` vs `recomendacao.nota`; `estrategias[Renda mensal previsível]` vs `dividendos.sintese.tendencia`; `cenarios[desfavoráveis]` cita risco listado em `pontosAtencao` ou `riscosOcultos`.
18. **Backup antes de sobrescrever:** `data/fiis/.backups/{ticker}-v1-YYYYMMDD.json`.

## Regras duras

1. **NUNCA inventar.** Se não está no `.md`, omite. Cita `docId` em todos os campos com fonte.
2. Usar **Opus 4.7 1M context** (`model: "opus"`). Ler docs em profundidade — você tem 1M de contexto.
3. Valores R$ como número absoluto, datas ISO (`YYYY-MM` ou `YYYY-MM-DD`), texto em pt-BR com HTML inline usando classes Tailwind (`text-blue-400`, `text-emerald-400`, `text-amber-400`, `text-red-400`).
4. Preservar o que já existia: o worker sobrescreve `dividendos`, `valuation`, `portfolio`, `encaixe`, `meta.dataAnalise`, `meta.totalDocumentos`, `footer.dataAnalise`, `footer.totalDocumentos`. Demais chaves permanecem a menos que tenha nova info que mereça atualização.
5. **Validar** ao final: todas as 16 chaves top-level presentes (incluindo `encaixe`), `historico.length >= número_de_meses_desde_IPO - 3`, `portfolio.stats.alocacaoPL` soma 1.0 ± 0.005, `encaixe.perfilRisco.componentes[].peso` soma 1.0.

## Pipeline obrigatório de pré-publicação

**Nunca publique um JSON sem rodar essa sequência.** Workers entregam JSONs quase corretos mas com pequenas variações de schema (campo array escrito como string, `percentual` em vez de `pct`, `taxas.detalhes` como HTML solto, schemas null). Sem normalização automática, o renderer quebra com `forEach is not a function`.

**Após cada análise nova:**

```bash
# 1. Normalizar (corrige string→array, percentual→pct, schemas, etc.)
cd scripts && python3 -m fundosnet.normalizar_json --ticker {TICKER} --write
cd ..

# 2. Rodar VP histórico (preciso para gráfico P/VP da aba Valuation v2)
cd scripts && python3 -m cotacoes.extrair_vp_historico --ticker {TICKER}
cd ..

# 3. Atualizar historicoVp.csvPath no JSON, se ainda não está
python3 -c "
import json, os
d = json.load(open('data/fiis/{ticker}.json'))
csv = 'data/fiis/{ticker}/historico_vp.csv'
if os.path.exists(csv):
    d.setdefault('valuation', {}).setdefault('historicoVp', {})['csvPath'] = csv
    json.dump(d, open('data/fiis/{ticker}.json','w'), ensure_ascii=False, indent=2)
"

# 4. Criar HTML
mkdir -p fiis/{ticker} && cp fiis/blmg11/index.html fiis/{ticker}/index.html
sed -i "s/blmg11/{ticker}/g; s/BLMG11/{TICKER}/g" fiis/{ticker}/index.html

# 5. Consolidar e sitemap
python3 scripts/fundosnet/consolidar_fiis_json.py
python3 scripts/fundosnet/atualizar_sitemap.py

# 6. Smoke test (opcional mas recomendado)
node /tmp/test_render.js     # se o teste estiver no /tmp

# 7. Commit + push individual
git add data/fiis/{ticker}.json data/fiis/{ticker}/ fiis/{ticker}/ data/fiis.json sitemap.xml
git commit -m "feat: análise v3 {TICKER} (...)"
git push
```

**Regras duras pós-normalização:**

- 16 chaves top-level
- `portfolio.schema === "v2"` (alocacaoPL não-vazio implica isso)
- `alocacaoPL` soma 1.0 ± 0.005 (campo `pct`, não `percentual`)
- `perfilRisco.componentes` pesos somam 1.0
- `precoJustoMercado.componentes` pesos somam 1.0
- `tipoSobreposicao`, `garantias`, `riscos`, `paraQuem`, `paraQuemNao`, `objetivo`, `perfisExemplo`, `perfilExclusao`, `pontos`, `paragrafos`, `pontosFortes`, `pontosDeAtencao`: SEMPRE arrays (normalizador converte string→array automaticamente)
- `taxas.detalhes` SEMPRE array de `{label, valor}` (string HTML solta vai para `taxas.observacao`)
- `concentracao.hhi` em escala 0–1 (não 0–10000 — normalizador divide por 10000 se detectar)

## Referência canônica

- Template JSON: `data/fiis/blmg11.json` (v3 piloto: Dividendos v2 + Valuation v2 + Portfolio v2 + Encaixe v1).
- Template JSON v1 legado: `data/fiis/ftca11.json` (28-36KB, sem encaixe/portfolio v2).
- Renderer: `js/fii-template.js` → funções `renderDividendos()`, `renderValuation()`, `renderPortfolio()`, `renderEncaixe()`.
- Schema detalhado: `docs/schema-dividendos-v2.md`, este arquivo (`ANALISE_FII_PADRAO.md`) para Portfolio v2 + Encaixe v1.
- CSS da aba: `css/fii-page.css`.
