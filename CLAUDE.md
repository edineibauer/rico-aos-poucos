# Rico aos Poucos - Guia de Desenvolvimento

## Visão Geral
App/Site de investimentos com análises de mercado e expectativas por setor.

## Padrões de Idioma (i18n) - OBRIGATÓRIO

### Idiomas Suportados
- **pt-BR** (Português do Brasil) - PADRÃO (raiz `/`)
- **en** (English) - Pasta `/en/`
- **es** (Español) - Pasta `/es/`

### Estrutura de URLs
```
/              → Português (padrão)
/en/           → English
/es/           → Español
/setores/      → Setores PT-BR
/en/setores/   → Sectors EN
/es/setores/   → Sectores ES
```

### Requisitos
1. Todo novo conteúdo DEVE ter versões nos 3 idiomas
2. Cada idioma tem sua própria pasta com páginas separadas
3. Incluir `<script src="js/i18n.js">` para seletor de idioma
4. Idioma salvo em localStorage (`rico-lang`)

### Adicionando Novas Páginas
1. Criar página em `/` (português)
2. Criar versão em `/en/` (inglês)
3. Criar versão em `/es/` (espanhol)
4. Adicionar hreflang tags em todas as versões
5. Adicionar ao sitemap.xml

## SEO - OBRIGATÓRIO

### Meta Tags Obrigatórias
```html
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://ricoaospoucos.com/[path]">

<!-- Hreflang -->
<link rel="alternate" hreflang="pt-BR" href="https://ricoaospoucos.com/[path]">
<link rel="alternate" hreflang="en" href="https://ricoaospoucos.com/en/[path]">
<link rel="alternate" hreflang="es" href="https://ricoaospoucos.com/es/[path]">
<link rel="alternate" hreflang="x-default" href="https://ricoaospoucos.com/[path]">

<!-- Open Graph -->
<meta property="og:title" content="[Título]">
<meta property="og:description" content="[Descrição]">
<meta property="og:type" content="website">
<meta property="og:url" content="[URL]">
<meta property="og:locale" content="[pt_BR|en_US|es_ES]">
<meta property="og:site_name" content="Rico aos Poucos">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Título]">
<meta name="twitter:description" content="[Descrição]">
```

### JSON-LD Structured Data
Adicionar em todas as páginas:
- WebSite schema
- Organization schema
- Article schema (para artigos)

### Arquivos SEO
- `sitemap.xml` - Atualizar ao criar novas páginas
- `robots.txt` - Referência ao sitemap

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
- Atualizar sitemap.xml ao criar novas páginas
