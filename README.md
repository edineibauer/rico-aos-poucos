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
├── index.html                    # Pagina inicial (PT-BR)
├── en/                          # Versao em ingles
│   ├── index.html
│   ├── setores/
│   ├── artigos/
│   └── desempenho/
├── es/                          # Versao em espanhol
│   ├── index.html
│   ├── setores/
│   ├── artigos/
│   └── desempenho/
├── css/
│   └── style.css                # Estilos globais
├── js/
│   ├── app.js                   # JavaScript principal
│   └── i18n.js                  # Sistema de idiomas
├── data/
│   ├── artigos.json             # Metadados dos artigos (PT-BR)
│   ├── artigos-en.json          # Metadados dos artigos (EN)
│   └── artigos-es.json          # Metadados dos artigos (ES)
├── setores/                     # Paginas dos setores (PT-BR)
│   ├── index.html
│   ├── dolar/
│   ├── caixa/
│   ├── tlt/
│   ├── imoveis/
│   ├── fiis/
│   ├── tesouro-ipca/
│   ├── ibov/
│   ├── ouro/
│   ├── sp500/
│   └── bitcoin/
├── artigos/                     # Artigos e analises (PT-BR)
├── desempenho/                  # Performance da carteira
├── carteira/                    # Alocacao de carteira
├── macroeconomia/               # Cenario macro
├── ativos/                      # Analise de ativos
├── sobre/                       # Sobre o canal
└── .nojekyll                    # Marker para GitHub Pages
```

## Como Atualizar o Conteudo

### Alterar Sentimento de um Setor

1. Atualizar a pagina do setor em `setores/[setor]/index.html`:
   - Alterar a classe do badge (`.bullish`, `.neutral`, `.bearish`)
   - Atualizar o texto "Por que estamos [sentimento]?"
   - Adicionar nova publicacao na lista

2. Atualizar versoes em outros idiomas:
   - `en/setores/[setor]/index.html`
   - `es/setores/[setor]/index.html`

3. Atualizar a home `index.html` (e versoes en/es):
   - Ajustar os contadores de sentimento no card principal
   - Atualizar as classes dos itens `.setor-item`

4. Atualizar `setores/index.html` (e versoes en/es):
   - Ajustar badge e barra de exposicao do setor alterado

### Adicionar Novo Artigo

1. Criar o arquivo HTML do artigo em `artigos/[nome-do-artigo].html`

2. Adicionar entrada em `data/artigos.json`:
```json
{
  "id": "nome-do-artigo",
  "titulo": "Titulo do Artigo",
  "subtitulo": "Subtitulo explicativo",
  "descricao": "Descricao breve...",
  "arquivo": "nome-do-artigo.html",
  "nivel": "intermediario",
  "categoria": "macroeconomia",
  "tags": ["tag1", "tag2"],
  "dataPublicacao": "2026-02-15",
  "tempoLeitura": 8,
  "destaque": false
}
```

3. Criar versoes traduzidas:
   - `en/artigos/[nome-do-artigo].html`
   - `es/artigos/[nome-do-artigo].html`
   - Adicionar entradas em `data/artigos-en.json` e `data/artigos-es.json`

### Adicionar Publicacao na Pagina do Setor

Adicionar o HTML na pagina do setor `setores/[setor]/index.html`:
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
