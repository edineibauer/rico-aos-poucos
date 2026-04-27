# Schema v2 — aba Dividendos

**Status:** piloto em BLMG11 a partir de 25/04/2026. Promover a padrão apos validacao.

A chave `dividendos` em `data/fiis/{ticker}.json` passa a ter a forma abaixo.
Todos os novos campos sao **opcionais** para manter compatibilidade com JSONs v1;
o renderer degrada graciosamente quando um campo nao existe.

## Objetivo

Responder 4 perguntas que o v1 nao responde:

1. **Sustentabilidade** — o fundo esta distribuindo dentro do que gera? Queimando caixa? Fazendo caixa?
2. **Horizonte** — como o dividendo se comportou desde o IPO? Esta subindo, estavel, caindo?
3. **Futuro conhecido** — ha eventos anunciados (cashbacks, vencimentos de contratos, obras entregando, vendas em negociacao) que vao impactar dividendo?
4. **Projecao** — o DY atual e sustentavel nos proximos 12 meses? O fundo tem espaco para aumentar sem sacrificar caixa?

## Estrutura

```jsonc
{
  "dividendos": {

    // ──────────────────────────────────────────────────────────────────────
    // Historico mensal completo (desde o IPO ou desde a primeira distribuicao conhecida)
    // ──────────────────────────────────────────────────────────────────────
    "historico": [
      {
        "data":            "YYYY-MM",       // mes de referencia (competencia)
        "dividendo":       0.40,             // R$/cota distribuido
        "dataPagamento":   "YYYY-MM-DD",    // opcional, quando foi pago
        "lucroLiquido":    1234567.89,       // R$ absoluto do mes (do Informe Mensal/Gerencial)
        "caixaMes":        234567.89,        // R$ = lucroLiquido - (dividendo * cotasEmCirculacao). >0 fez caixa, <0 queimou
        "caixaAcumulado":  4567890.12,       // R$ reserva de resultado acumulado ao fim do mes
        "dyMes":           0.85,             // % sobre cota media do mes (opcional)
        "fonte":           "Informe Mensal (ID 985081)",
        "docId":           "985081"          // referencia ao doc em fiis-optimized
      }
    ],

    // ──────────────────────────────────────────────────────────────────────
    // Leitura macro de sustentabilidade (derivado de historico[])
    // ──────────────────────────────────────────────────────────────────────
    "sustentabilidade": {
      "status":           "fazendo_caixa" | "queimando_caixa" | "estavel" | "misto",
      "cor":              "emerald" | "red" | "amber" | "blue",
      "payoutMedio12m":   0.96,              // fracao (0-1) do lucro distribuida nos ultimos 12m
      "caixaAcumulado":   6500000,           // R$ ao fim do mes mais recente
      "coberturaMeses":   8.3,               // quantos meses de distribuicao atual o caixa cobre (0 = esgotado)
      "tendencia":        "estavel com reserva crescente",
      "leitura":          "Texto HTML curto (1-3 frases) explicando o status para leitor leigo."
    },

    // ──────────────────────────────────────────────────────────────────────
    // Eventos passados que impactaram dividendo (citacoes diretas em .md)
    // ──────────────────────────────────────────────────────────────────────
    "eventosPassados": [
      {
        "data":            "YYYY-MM",
        "dataExata":       "YYYY-MM-DD",    // opcional
        "titulo":          "Venda do CD Extrema",
        "tipo":            "venda" | "aquisicao" | "cashback_inicio" | "cashback_fim" | "vacancia" | "reducao_taxa" | "emissao" | "amortizacao" | "evento_credito" | "outro",
        "descricao":       "HTML curto: o que aconteceu e porque impactou dividendo",
        "impactoDividendo": "+R$ 0,05/cota por 6 meses" | "-R$ 0,08/cota mensal continuo" | "distribuicao extraordinaria de R$ 1,20/cota em dez/2024",
        "severidade":      "positivo" | "negativo" | "neutro",
        "fonte":           "Fato Relevante (ID 1091574)",
        "docId":           "1091574"
      }
    ],

    // ──────────────────────────────────────────────────────────────────────
    // Eventos futuros projetados (cashback conhecido, obras, vendas em negociacao,
    // vencimentos, extraordinarias historicas)
    // ──────────────────────────────────────────────────────────────────────
    "eventosFuturos": [
      {
        "data":            "YYYY-MM",       // periodo estimado
        "titulo":          "Termino do cashback da Venda Galpao Cajamar",
        "tipo":            "cashback_fim" | "cashback_inicio" | "extraordinaria_historica" | "aumento_sustentavel" | "venda_em_analise" | "obra_entrega" | "contrato_revisional" | "amortizacao_programada" | "outro",
        "descricao":       "HTML curto",
        "impactoEstimado": "-R$ 0,04/cota mensal apos mai/2026",
        "certeza":         "confirmado" | "projetado" | "possivel",  // confirmado = doc oficial; projetado = calculo a partir de padrao historico; possivel = hipotese / noticia
        "premissa":        "Baseado no anexo X do Relatorio Gerencial de mar/2026",
        "fonte":           "Relatorio Gerencial mar/2026 (ID 1139263)",
        "docId":           "1139263"
      }
    ],

    // ──────────────────────────────────────────────────────────────────────
    // Guidance — oficial (do gestor) ou estimativa (nossa leitura do portfolio)
    // ──────────────────────────────────────────────────────────────────────
    "guidance": {
      "fonte":    "gestor" | "estimativa",
      "periodo":  "1S2026" | "proximos 6 meses" | "2T2026",
      "faixaMin": 0.35,
      "faixaMax": 0.42,
      "unidade":  "R$/cota/mes",
      "validade": "YYYY-MM-DD",              // ate quando a informacao eh confiavel
      "documento": "Relatorio Gerencial mar/2026",  // se fonte=gestor
      "premissas": [                         // se fonte=estimativa
        "Contratos atuais sem reajuste extraordinario",
        "Selic estavel em 15%",
        "Vacancia fisica mantida em 7,2%"
      ],
      "nota":     "texto curto de observacao"
    },

    // ──────────────────────────────────────────────────────────────────────
    // Projecao do DY considerando historico + eventos futuros + preco atual
    // ──────────────────────────────────────────────────────────────────────
    "projecaoDy": {
      "precoReferencia":  9.57,              // preco de cota usado nos calculos
      "dyAtual12m":       13.5,              // % a.a. (historico 12m)
      "dyProjetado6m":    13.8,              // % a.a. anualizado dos proximos 6m
      "dyProjetado12m":   14.2,              // % a.a. com eventos futuros embutidos
      "cenarios": [
        { "rotulo": "Base",       "dy12m": 14.2, "dividendoMes": 0.40, "descricao": "Cenario central com contratos atuais" },
        { "rotulo": "Otimista",   "dy12m": 15.1, "dividendoMes": 0.43, "descricao": "Venda ativos X concluida, cashback estendido" },
        { "rotulo": "Pessimista", "dy12m": 11.8, "dividendoMes": 0.34, "descricao": "Inadimplencia locatario Y" }
      ],
      "retornoTotal12m": 19.5,                // DY + potencial valorizacao (se PVP<1)
      "premissas":       ["Cota mantida a R$ 9,57", "Sem nova emissao diluidora", "IPCA 4,5%"]
    },

    // ──────────────────────────────────────────────────────────────────────
    // Alertas curtos para o topo da aba (1-3 chips com icones)
    // ──────────────────────────────────────────────────────────────────────
    "alertas": [
      {
        "mensagem": "Caixa caiu 38% em 6 meses — payout acima de 100% desde set/2025",
        "severidade": "red" | "amber" | "emerald" | "blue",
        "icone":     "trending-down"
      }
    ],

    // ──────────────────────────────────────────────────────────────────────
    // Retrocompatibilidade — v1 continua valido
    // ──────────────────────────────────────────────────────────────────────
    "chartLabels":   ["..."],   // opcional; se ausente, derivar de historico[]
    "chartData":     [...],     // opcional; idem
    "chartCor":      "#10b981", // opcional
    "totaisAnuais":  [ { "ano": "2025", "valor": "R$ 4,47" } ],
    "stats":         [ { "label": "Atual", "valor": "R$ 0,40" } ]
  }
}
```

## Regras de preenchimento

1. **historico[]** eh o alicerce. Todos os widgets derivam dele quando possivel.
2. **caixaMes** = `lucroLiquido - totalDistribuido`, onde `totalDistribuido = dividendo * cotasEmCirculacaoDoMes`. Se cotasEmCirculacao nao for conhecido com precisao, **omitir `caixaMes`** em vez de chutar.
3. **caixaAcumulado** vem direto do Informe Mensal quando presente (campo "Resultado acumulado nao distribuido"). Se nao encontrar, calcular como soma das `caixaMes`.
4. **eventosPassados** — incluir apenas eventos que aparecem citados em Fato Relevante, Relatorio Gerencial ou Informe que *explicitamente* mencionam impacto em dividendo. Nao inventar.
5. **eventosFuturos** — certeza seguindo a ordem:
   - `confirmado`: o doc oficial ja estabelece (cashback contratado, amortizacao com prazo fixo, emissao aprovada).
   - `projetado`: calculo nosso a partir do historico do fundo (ex: "HGLG11 distribui extraordinaria todo dezembro").
   - `possivel`: hipotese citada pelo gestor como em analise, ou eventos de mercado com impacto provavel.
6. **guidance.fonte="gestor"** exige documento referenciado. Se o gestor nao divulga, usar `fonte="estimativa"` + `premissas[]`.
7. **projecaoDy** sempre usa `precoReferencia` explicito (a cota vigente no momento da analise). Nunca assumir cota futura.
8. **alertas[]** maximo 3. Curtos (ate 80 char). Severidade `red` so para coisa real.

## Campos derivados pelo renderer (nao enviar no JSON)

- `tendenciaHistorica` — calculado pelo renderer com regressao simples nos `historico[].dividendo`.
- `mediaMensal12m` — `sum(ultimos 12m) / 12`.
- `grafico de caixa acumulado` — plot direto de `historico[].caixaAcumulado`.

## Exemplo mínimo (FII sem dados aprofundados)

Se a analise nao conseguiu extrair lucroLiquido mensal, o JSON ainda eh valido
com apenas:

```json
{
  "dividendos": {
    "historico": [
      { "data": "2024-01", "dividendo": 0.35, "fonte": "Rendimento ID 880001", "docId": "880001" },
      ...
    ],
    "sustentabilidade": {
      "status": "estavel",
      "cor": "blue",
      "leitura": "Dados insuficientes para medir sustentabilidade com precisao. Com base no historico de rendimentos, a distribuicao esta estavel em R$ 0,40/cota."
    }
  }
}
```

O renderer mostra historico longo + leitura qualitativa e oculta widgets dependentes de `lucroLiquido`.
