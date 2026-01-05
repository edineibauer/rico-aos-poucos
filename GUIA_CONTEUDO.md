# Guia de Conteudo - Rico aos Poucos

Este guia explica como adicionar e atualizar conteudo no app Rico aos Poucos.
Siga estas instrucoes para manter a consistencia do projeto.

---

## Estrutura do Projeto

O app e totalmente estatico, com paginas HTML separadas para cada idioma:

- `/` - Portugues (padrao)
- `/en/` - Ingles
- `/es/` - Espanhol

Cada idioma tem sua propria estrutura de pastas com paginas independentes.

---

## Procedimento: Mudar Sentimento de um Setor

Quando o sentimento sobre um setor mudar, atualize todas as versoes de idioma:

### Passo 1: Atualizar `index.html` (home) - todos os idiomas

Arquivos: `index.html`, `en/index.html`, `es/index.html`

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
</div>
```

### Passo 2: Atualizar `setores/index.html` - todos os idiomas

Arquivos: `setores/index.html`, `en/setores/index.html`, `es/setores/index.html`

1. A classe do card:
```html
<a href="fiis/" class="setor-card bullish">  <!-- Era neutral -->
```

2. O badge:
```html
<div class="setor-card-badge bullish">Otimista</div>  <!-- Era Neutro -->
```

3. Os contadores no resumo de sentimento

### Passo 3: Atualizar `setores/[setor]/index.html` - todos os idiomas

Arquivos para cada setor em PT, EN e ES.

1. Badge de sentimento:
```html
<span class="sentimento-badge bullish">Otimista</span>
```

2. Titulo da secao de racional:
```html
<h2>Por que estamos otimistas?</h2>  <!-- Atualizar pergunta -->
```

3. Atualizar os cards de racional com novos argumentos

4. Adicionar nova publicacao na lista:
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

---

## Procedimento: Atualizar Exposicao Recomendada

Se mudar apenas a exposicao (percentual), sem mudar sentimento:

1. Atualizar `index.html` - valores no card de Expectativas (PT, EN, ES)
2. Atualizar `setores/index.html` - valores nas barras e percentuais (PT, EN, ES)
3. Atualizar `setores/[setor]/index.html` - percentual no card de exposicao (PT, EN, ES)

**IMPORTANTE**: A soma de todas as exposicoes deve ser sempre 100%.

---

## Padrao de Cores por Sentimento

| Sentimento | Cor Hex | Classe CSS |
|------------|---------|------------|
| Otimista | #3fb950 | bullish |
| Neutro | #f0c14b | neutral |
| Pessimista | #f85149 | bearish |

---

## Procedimento: Adicionar Novo Artigo

O sistema de artigos carrega dinamicamente do arquivo JSON.

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
- `{{NIVEL_EMOJI}}` - iniciante | intermediario | avancado
- `{{NIVEL_TEXTO}}` - Iniciante | Intermediario | Avancado

### Passo 2: Adicionar ao indice JSON (todos os idiomas)

Edite os arquivos:
- `data/artigos.json` (PT)
- `data/artigos-en.json` (EN)
- `data/artigos-es.json` (ES)

Adicione o novo artigo no array `artigos`:

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

### Passo 3: Criar versoes traduzidas

1. Crie o artigo em ingles: `en/artigos/meu-novo-artigo.html`
2. Crie o artigo em espanhol: `es/artigos/meu-novo-artigo.html`
3. Adicione as entradas nos JSONs de cada idioma

### Passo 4: Commit e Push

```bash
git add .
git commit -m "feat: Adiciona artigo sobre XYZ em todos os idiomas"
git push
```

A pagina de artigos sera atualizada automaticamente ao carregar.

---

## Categorias de Artigos Disponiveis

| ID | Nome | Icone |
|----|------|-------|
| renda-variavel | Renda Variavel | chart-emoji |
| renda-fixa | Renda Fixa | bank-emoji |
| macroeconomia | Macroeconomia | globe-emoji |
| educacao | Educacao Financeira | graduation-emoji |
| estrategias | Estrategias | bulb-emoji |
| psicologia | Psicologia | brain-emoji |

---

## Checklist de Atualizacao

Use este checklist ao fazer alteracoes de sentimento:

- [ ] Atualizei `index.html` (PT, EN, ES)
- [ ] Atualizei `setores/index.html` (PT, EN, ES)
- [ ] Atualizei `setores/[setor]/index.html` (PT, EN, ES)
- [ ] Verifiquei que exposicoes somam 100%
- [ ] Commit com mensagem descritiva
- [ ] Push para o branch do GitHub Pages

Checklist para novos artigos:

- [ ] Criei artigo em PT, EN, ES
- [ ] Atualizei `data/artigos.json`
- [ ] Atualizei `data/artigos-en.json`
- [ ] Atualizei `data/artigos-es.json`
- [ ] Commit e push

---

## Formato de Data

Use sempre o formato ISO para datas nos JSONs:
- `"2026-01-04"` (YYYY-MM-DD)

Para exibicao no HTML:
- Dia: `04`
- Mes: `Jan 2026`

---

## Observacoes Finais

1. O app nao usa banco de dados - tudo e estatico em arquivos HTML/JSON
2. Alteracoes sao publicadas via commit/push para GitHub Pages
3. Sempre inclua disclaimer de que nao e recomendacao de investimento
4. Visao e de medio prazo (1-2 anos) - mencionar isso nas publicacoes
5. **Todo conteudo deve existir em 3 idiomas: PT, EN, ES**

---

*Ultima atualizacao deste guia: Janeiro 2026*
