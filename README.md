# Rico aos Poucos

App de investimentos focado em **expectativas de sentimento por setor** do canal Rico aos Poucos. O objetivo principal e comunicar a visao de medio prazo (1-2 anos) sobre diferentes classes de ativos e setores da economia.

## Objetivo do App

O app tem como foco principal:

1. **Expectativas do Canal** - Visao de sentimento (otimista/neutro/pessimista) para 7 setores principais
2. **Exposicao Recomendada** - Percentual sugerido de alocacao em cada setor (total 100%)
3. **Historico de Mudancas** - Registro temporal de alteracoes de sentimento
4. **Publicacoes por Setor** - Artigos explicando o racional por tras de cada sentimento

## Setores Analisados

| Setor | Icone | Descricao |
|-------|-------|-----------|
| Tesouro IPCA+ | 🏦 | Titulos publicos atrelados a inflacao |
| Dolar | 💵 | Exposicao cambial e ativos em moeda americana |
| FIIs | 🏢 | Fundos Imobiliarios brasileiros |
| IBOV | 📈 | Acoes brasileiras e indice Bovespa |
| Ouro | 🥇 | Metal precioso como reserva de valor |
| TLT | 📊 | Titulos longos do tesouro americano |
| Bitcoin | ₿ | Criptomoeda como ativo de reserva digital |

## Estrutura do Projeto

```
rico-aos-poucos/
├── index.html                    # Pagina inicial do app
├── css/
│   └── style.css                # Estilos globais
├── js/
│   └── app.js                   # JavaScript principal
├── data/
│   ├── config.json              # Configuracoes gerais
│   ├── setores.json             # Dados dos setores e sentimentos
│   └── publicacoes/             # Publicacoes por setor
│       ├── dolar/
│       │   └── index.json       # Lista de publicacoes do setor
│       ├── ouro/
│       ├── bitcoin/
│       ├── tlt/
│       ├── fiis/
│       ├── ibov/
│       └── tesouro-ipca/
├── setores/
│   ├── index.html               # Visao geral dos setores
│   ├── dolar/
│   │   └── index.html           # Pagina do setor Dolar
│   ├── ouro/
│   ├── bitcoin/
│   ├── tlt/
│   ├── fiis/
│   ├── ibov/
│   └── tesouro-ipca/
├── artigos/                     # Publicacoes gerais
├── carteira/                    # Alocacao de carteira (secundario)
├── macroeconomia/               # Cenario macro (secundario)
├── ativos/                      # Analise de ativos (secundario)
├── sobre/                       # Sobre o canal
└── .nojekyll                    # Marker para GitHub Pages
```

## Como Atualizar o Conteudo

### Alterar Sentimento de um Setor

1. Editar `data/setores.json`:
   - Alterar o campo `sentimento` do setor desejado (`bullish`, `neutral`, `bearish`)
   - Atualizar `exposicaoRecomendada` se necessario (total deve ser 100%)
   - Adicionar entrada no `historicoSentimentos`

2. Atualizar a pagina do setor em `setores/[setor]/index.html`:
   - Alterar a classe do badge (`.bullish`, `.neutral`, `.bearish`)
   - Atualizar o texto "Por que estamos [sentimento]?"
   - Adicionar nova publicacao na lista

3. Atualizar a home `index.html`:
   - Ajustar os contadores de sentimento no card principal
   - Atualizar as classes dos itens `.setor-item`

4. Atualizar `setores/index.html`:
   - Ajustar badge e barra de exposicao do setor alterado

### Adicionar Nova Publicacao

1. Adicionar entrada em `data/publicacoes/[setor]/index.json`:
```json
{
  "id": "2026-02-15-nova-analise",
  "data": "2026-02-15",
  "titulo": "Titulo da Nova Publicacao",
  "resumo": "Breve resumo do conteudo...",
  "sentimentoNaData": "bullish",
  "arquivo": "2026-02-15-nova-analise.html"
}
```

2. Adicionar o HTML da publicacao na pagina do setor `setores/[setor]/index.html`:
```html
<div class="publicacao-item">
  <div class="publicacao-data">
    <span class="pub-dia">15</span>
    <span class="pub-mes">Fev 2026</span>
  </div>
  <div class="publicacao-content">
    <div class="publicacao-badge bullish">Otimista</div>
    <h4>Titulo da Nova Publicacao</h4>
    <p>Breve resumo do conteudo...</p>
  </div>
</div>
```

### Atualizar Historico de Sentimentos

Adicionar entrada em `data/setores.json` no array `historicoSentimentos`:
```json
{
  "data": "2026-02-15",
  "titulo": "Mudanca de visao para FIIs",
  "descricao": "FIIs passam de neutro para otimista com sinalizacao de corte de juros.",
  "alteracoes": {
    "fiis": { "de": "neutral", "para": "bullish" }
  }
}
```

## Legendas de Sentimento

| Sentimento | Cor | Classe CSS | Significado |
|------------|-----|------------|-------------|
| Otimista | Verde | `.bullish` | Expectativa positiva para o setor |
| Neutro | Amarelo | `.neutral` | Sem direcao clara, aguardando |
| Pessimista | Vermelho | `.bearish` | Expectativa negativa para o setor |

## Publicacao via GitHub Pages

O app e servido diretamente via GitHub Pages. Para publicar alteracoes:

1. Fazer commit das alteracoes
2. Push para o branch configurado no GitHub Pages
3. Aguardar deploy automatico (geralmente 1-2 minutos)

## Avisos Importantes

- Todas as expectativas sao **opinioes do canal** e nao constituem recomendacao de investimento
- As analises sao de **medio prazo (1-2 anos)** e podem mudar conforme o cenario evolui
- Sempre consulte um profissional antes de tomar decisoes de investimento

## Tecnologias

- HTML5 / CSS3 / JavaScript Vanilla
- Sem dependencias externas
- Totalmente estatico (GitHub Pages)
- Mobile-first design

## Versao

v2.0 - Janeiro 2026

---

Desenvolvido pelo canal **Rico aos Poucos**
