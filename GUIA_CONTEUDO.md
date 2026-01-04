# Guia de Conteudo - Rico aos Poucos

Este guia explica como adicionar e atualizar conteudo no app Rico aos Poucos.
Siga estas instrucoes para manter a consistencia do projeto.

---

## Estrutura de Dados Principal

### Arquivo: `data/setores.json`

Este e o arquivo central que controla os sentimentos e exposicoes de todos os setores.

```json
{
  "ultimaAtualizacao": "2026-01-04",
  "versao": "1.0",

  "setores": {
    "dolar": {
      "id": "dolar",
      "nome": "Dolar",
      "icone": "💵",
      "descricao": "Moeda americana e exposicao cambial",
      "sentimento": "bullish",           // bullish | neutral | bearish
      "exposicaoRecomendada": 15,        // Percentual (total deve ser 100)
      "exemplosAtivos": ["ETFs", "Stocks"],
      "cor": "#3fb950"
    }
    // ... outros setores
  },

  "ordemExibicao": ["tesouro-ipca", "dolar", "fiis", "ibov", "ouro", "tlt", "bitcoin"],

  "historicoSentimentos": [
    {
      "data": "2026-01-04",
      "titulo": "Titulo da mudanca",
      "descricao": "Descricao do que mudou",
      "alteracoes": {
        "setor": { "de": "bullish", "para": "neutral" }
      }
    }
  ]
}
```

---

## Procedimento: Mudar Sentimento de um Setor

Quando o sentimento sobre um setor mudar, siga estes passos:

### Passo 1: Atualizar `data/setores.json`

```json
// Alterar o sentimento do setor
"fiis": {
  "sentimento": "bullish",  // Era "neutral", agora e "bullish"
  "exposicaoRecomendada": 20  // Atualizar se necessario
}

// Adicionar ao historico
"historicoSentimentos": [
  {
    "data": "2026-02-15",
    "titulo": "FIIs passam para otimista",
    "descricao": "Com sinalizacao de corte de juros, FIIs ficam mais atrativos.",
    "alteracoes": {
      "fiis": { "de": "neutral", "para": "bullish" }
    }
  }
]
```

### Passo 2: Atualizar `index.html` (home)

Localizar o card de Expectativas e atualizar:

1. A classe do `.setor-item` correspondente:
```html
<div class="setor-item bullish">  <!-- Era neutral, agora bullish -->
```

2. Os contadores de sentimento:
```html
<div class="sentimento-resumo">
  <div class="sentimento-stat bullish">
    <span class="sentimento-count">5</span>  <!-- Aumentou de 4 para 5 -->
    <span class="sentimento-label">Otimistas</span>
  </div>
  <div class="sentimento-stat neutral">
    <span class="sentimento-count">1</span>  <!-- Diminuiu de 2 para 1 -->
    <span class="sentimento-label">Neutros</span>
  </div>
  <!-- ... -->
</div>
```

### Passo 3: Atualizar `setores/index.html`

Localizar o card do setor e atualizar:

1. A classe do card:
```html
<a href="fiis/" class="setor-card bullish">  <!-- Era neutral -->
```

2. O badge:
```html
<div class="setor-card-badge bullish">Otimista</div>  <!-- Era Neutro -->
```

3. Os contadores no resumo de sentimento

### Passo 4: Atualizar `setores/[setor]/index.html`

Na pagina individual do setor:

1. Badge de sentimento:
```html
<span class="sentimento-badge bullish">Otimista</span>
```

2. Card de exposicao (remover classe neutral se havia):
```html
<div class="exposicao-card">  <!-- Remover classe "neutral" -->
```

3. Titulo da secao de racional:
```html
<h2>Por que estamos otimistas?</h2>  <!-- Atualizar pergunta -->
```

4. Atualizar os 3 cards de racional com novos argumentos

5. Adicionar nova publicacao na lista:
```html
<div class="publicacao-item">
  <div class="publicacao-data">
    <span class="pub-dia">15</span>
    <span class="pub-mes">Fev 2026</span>
  </div>
  <div class="publicacao-content">
    <div class="publicacao-badge bullish">Otimista</div>
    <h4>FIIs passam para otimista</h4>
    <p>Com sinalizacao de corte de juros, fundos imobiliarios ficam mais atrativos.</p>
  </div>
</div>
```

### Passo 5: Atualizar `data/publicacoes/[setor]/index.json`

Adicionar a nova publicacao:
```json
{
  "id": "2026-02-15-mudanca-sentimento",
  "data": "2026-02-15",
  "titulo": "FIIs passam para otimista",
  "resumo": "Com sinalizacao de corte de juros...",
  "sentimentoNaData": "bullish",
  "arquivo": "2026-02-15-mudanca-sentimento.html"
}
```

---

## Procedimento: Adicionar Publicacao sem Mudar Sentimento

Quando quiser adicionar uma analise sem alterar o sentimento:

### Passo 1: Atualizar `data/publicacoes/[setor]/index.json`

### Passo 2: Adicionar HTML na pagina `setores/[setor]/index.html`

A nova publicacao deve ser adicionada NO TOPO da lista `.publicacoes-lista`.

---

## Procedimento: Atualizar Exposicao Recomendada

Se mudar apenas a exposicao (percentual), sem mudar sentimento:

1. Atualizar `data/setores.json` - campo `exposicaoRecomendada`
2. Atualizar `index.html` - valores no card de Expectativas
3. Atualizar `setores/index.html` - valores nas barras e percentuais
4. Atualizar `setores/[setor]/index.html` - percentual no card de exposicao

**IMPORTANTE**: A soma de todas as exposicoes deve ser sempre 100%.

---

## Padrao de Cores por Sentimento

| Sentimento | Cor Hex | Classe CSS |
|------------|---------|------------|
| Otimista | #3fb950 | bullish |
| Neutro | #f0c14b | neutral |
| Pessimista | #f85149 | bearish |

---

## Checklist de Atualizacao

Use este checklist ao fazer alteracoes:

- [ ] Atualizei `data/setores.json`
- [ ] Atualizei o card de Expectativas em `index.html`
- [ ] Atualizei os contadores de sentimento em `index.html`
- [ ] Atualizei `setores/index.html`
- [ ] Atualizei a pagina do setor `setores/[setor]/index.html`
- [ ] Adicionei publicacao em `data/publicacoes/[setor]/index.json`
- [ ] Verifiquei que exposicoes somam 100%
- [ ] Commit com mensagem descritiva
- [ ] Push para o branch do GitHub Pages

---

## Formato de Data

Use sempre o formato ISO para datas nos JSONs:
- `"2026-01-04"` (YYYY-MM-DD)

Para exibicao no HTML:
- Dia: `04`
- Mes: `Jan 2026`

---

## Procedimento: Adicionar Novo Artigo

O sistema de artigos e **dinamico**. A pagina `artigos/index.html` carrega automaticamente
os artigos do arquivo `data/artigos.json`.

### Passo 1: Criar o arquivo HTML do artigo

1. Copie `artigos/_template.html` para um novo arquivo
2. Renomeie para o slug do artigo: `meu-novo-artigo.html`
3. Substitua todos os placeholders `{{...}}` com seu conteudo

**Placeholders principais:**
- `{{TITULO}}` - Titulo completo
- `{{TITULO_CURTO}}` - Versao curta para breadcrumb
- `{{SUBTITULO}}` - Frase que resume o artigo
- `{{DESCRICAO_SEO}}` - Descricao para Google (max 160 caracteres)
- `{{DATA}}` - "04 de Janeiro de 2026"
- `{{TEMPO_LEITURA}}` - Minutos estimados
- `{{NIVEL}}` - iniciante | intermediario | avancado
- `{{NIVEL_EMOJI}}` - 🎓 | 📊 | 🚀
- `{{NIVEL_TEXTO}}` - Iniciante | Intermediario | Avancado

### Passo 2: Adicionar ao indice JSON

Edite `data/artigos.json` e adicione o novo artigo no array `artigos`:

```json
{
  "id": "meu-novo-artigo",
  "titulo": "Titulo do Artigo",
  "subtitulo": "Subtitulo ou frase de impacto",
  "descricao": "Descricao para aparecer na listagem de artigos",
  "arquivo": "meu-novo-artigo.html",
  "nivel": "intermediario",
  "categoria": "renda-variavel",
  "tags": ["tag1", "tag2", "tag3"],
  "dataPublicacao": "2026-01-05",
  "tempoLeitura": 8,
  "destaque": false,
  "setorRelacionado": null
}
```

**Campos importantes:**
- `id` - Identificador unico (slug)
- `arquivo` - Nome do arquivo HTML
- `nivel` - iniciante | intermediario | avancado
- `categoria` - Uma das categorias do JSON (renda-variavel, renda-fixa, macroeconomia, etc)
- `tags` - Array de palavras-chave
- `destaque` - Se true, aparece com borda destacada
- `setorRelacionado` - Se o artigo e sobre um setor especifico (dolar, ibov, etc)

### Passo 3: Commit e Push

```bash
git add artigos/meu-novo-artigo.html data/artigos.json
git commit -m "feat: Adiciona artigo sobre XYZ"
git push
```

A pagina de artigos sera atualizada automaticamente ao carregar.

---

## Categorias de Artigos Disponiveis

| ID | Nome | Icone |
|----|------|-------|
| renda-variavel | Renda Variavel | 📈 |
| renda-fixa | Renda Fixa | 🏦 |
| macroeconomia | Macroeconomia | 🌍 |
| educacao | Educacao Financeira | 🎓 |
| estrategias | Estrategias | 💡 |
| psicologia | Psicologia | 🧠 |

---

## Observacoes Finais

1. O app nao usa banco de dados - tudo e estatico em arquivos JSON/HTML
2. Alteracoes sao publicadas via commit/push para GitHub Pages
3. Mantenha o historico de sentimentos para rastreabilidade
4. Sempre inclua disclaimer de que nao e recomendacao de investimento
5. Visao e de medio prazo (1-2 anos) - mencionar isso nas publicacoes

---

*Ultima atualizacao deste guia: Janeiro 2026*
