# Rico aos Poucos - Guia de Desenvolvimento

## Visão Geral
App/Site de investimentos com análises de mercado e expectativas por setor.

## Padrões de Idioma (i18n) - OBRIGATÓRIO

### Idiomas Suportados
- **pt-BR** (Português do Brasil) - PADRÃO
- **en** (English)
- **es** (Español)

### Requisitos
1. Todo novo conteúdo DEVE ser criado nos 3 idiomas
2. Arquivos de tradução: `lang/pt-br.json`, `lang/en.json`, `lang/es.json`
3. Usar atributo `data-i18n="chave.subchave"` em elementos HTML traduzíveis
4. Incluir `<script src="js/i18n.js">` em todas as páginas

### Estrutura de Tradução
```html
<!-- Exemplo de uso -->
<h2 data-i18n="home.expectations">Expectativas do Canal</h2>
<span data-i18n="sentiments.bullish">Otimista</span>
```

### Adicionando Novas Traduções
1. Adicionar chave em `lang/pt-br.json`
2. Adicionar tradução em `lang/en.json`
3. Adicionar tradução em `lang/es.json`
4. Usar `data-i18n="chave"` no HTML

## Estrutura de Setores

### Alocação Atual (Jan/2026)
- Dólar: 25%
- Caixa: 20%
- TLT: 15%
- Imóveis: 15%
- FIIs: 10%
- IPCA+: 10%
- IBOV: 5%
- Ouro: 0%
- S&P500: 0%
- Bitcoin: 0%

### Sentimentos
- **Otimistas**: Dólar, Caixa, TLT
- **Neutros**: Imóveis, FIIs, IPCA+, IBOV, Ouro
- **Pessimistas**: S&P500, Bitcoin

## Publicações

### Campo Destaque
Publicações podem ter `destaque: true` para aparecer na home em carrossel horizontal.

## Tecnologias
- HTML/CSS/JS puro (sem frameworks)
- PWA com Service Worker
- Design responsivo mobile-first

## Convenções de Código
- Usar acentos do português brasileiro em todo conteúdo PT-BR
- Manter consistência visual entre páginas
- Testar em 3 idiomas antes de commitar
