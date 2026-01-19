# Rico aos Poucos - Guia de Desenvolvimento

## Visao Geral
App/Site de investimentos com analises de mercado e expectativas por setor.

## Idioma
O site e exclusivamente em **Portugues do Brasil (pt-BR)**.

## SEO - OBRIGATORIO

### Meta Tags Obrigatorias
```html
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://ricoaospoucos.com.br/[path]">

<!-- Open Graph -->
<meta property="og:title" content="[Titulo]">
<meta property="og:description" content="[Descricao]">
<meta property="og:type" content="website">
<meta property="og:url" content="[URL]">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Rico aos Poucos">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Titulo]">
<meta name="twitter:description" content="[Descricao]">
```

### JSON-LD Structured Data
Adicionar em todas as paginas:
- WebSite schema
- Organization schema
- Article schema (para artigos)

### Arquivos SEO
- `sitemap.xml` - Atualizar ao criar novas paginas
- `robots.txt` - Referencia ao sitemap

## Estrutura de Setores

### Alocacao Atual (Jan/2026)
- Dolar: 25%
- Caixa: 20%
- TLT: 15%
- Imoveis: 15%
- FIIs: 10%
- IPCA+: 10%
- IBOV: 5%
- Ouro: 0%
- S&P500: 0%
- Bitcoin: 0%

### Sentimentos
- **Otimistas**: Dolar, Caixa, TLT
- **Neutros**: Imoveis, FIIs, IPCA+, IBOV, Ouro
- **Pessimistas**: S&P500, Bitcoin

## Publicacoes

### Campo Destaque
Publicacoes podem ter `destaque: true` para aparecer na home em carrossel horizontal.

## Tecnologias
- HTML/CSS/JS puro (sem frameworks)
- PWA com Service Worker
- Design responsivo mobile-first

## Convencoes de Codigo
- Usar acentos do portugues brasileiro em todo conteudo
- Manter consistencia visual entre paginas
- Atualizar sitemap.xml ao criar novas paginas
