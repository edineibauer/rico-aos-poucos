# Padrão de slides para artigos

Cada artigo de FII deve ter **três versões**, geradas em conjunto:

| Versão | Arquivo | Para quê |
|---|---|---|
| Artigo | `artigos/{slug}.html` | leitura linear, SEO, indexável |
| Slides | `artigos/{slug}-slides.html` | apresentação navegável, gravar vídeo, embedar |
| Instagram | `artigos/{slug}-instagram.html` | carrossel exportável em PNG (1080×1350) |

A barra `view-modes` no topo de cada artigo conecta as três.

## Estrutura do deck (slides)

Em torno de **12–14 slides**, sempre nesta ordem:

1. **Capa** (`.slide.cover`) — título-soco em 1 linha + subtítulo + meta
2. **O risco em 3 números** (`.slide.alert`) — `.big-number` com o ponto central
3. **Foto atual** (`.slide.data`) — `.slide-kpis` com 8 KPIs
4. **Imagem ilustrativa** (`.img-slot` ou foto real) — portfólio / empresa / cidade
5. **Concentração / risco principal** — gráfico de barras (`.bar-row`)
6. **Conceito-chave** (`.slide.alert`) — explicar o termo técnico em texto + 3 bullets
7. **Espelho histórico** — casos análogos (Marisa, Americanas, etc.)
8. **Os N riscos reais** (`.slide.alert`) — `.slide-bullets` 2×2
9. **Sinal técnico que poucos veem** (`.slide.data`) — tabela curta
10. **Diluição / contexto financeiro** — 2 colunas texto + KPIs
11. **Cenários** (`.slide.data`) — barras com probabilidade
12. **Faz sentido / não faz sentido** — `.pros-cons-grid`
13. **Plano de jogo mensal** — checklist do que monitorar
14. **Veredicto + CTA** (`.slide.verdict`) — `.verdict-card` com selo + 3 botões

## Estrutura do Instagram (5 cards 4:5)

Em torno de **5 cards**, sempre 4:5 (1080×1350):

1. **Capa / hook** (`.ig-card.cover`) — título-soco + subtítulo + slot de imagem
2. **O número** (`.ig-card.alert`) — `.big-num` com o dado central
3. **Foto rápida** (`.ig-card.data`) — `.stat-pair` com 4 KPIs
4. **Cenários** (`.ig-card.scenario`) — `.ig-bar` com probabilidades
5. **Veredicto + CTA** (`.ig-card.cta-final`) — domínio + handle

Sempre incluir `.ig-brand` no topo e `.ig-footer` na base de cada card.

## Imagens

Onde o artigo precisa de imagem real (capas, fachadas, ilustrações editoriais), usar **`.img-slot`** (deck) ou **`.ig-img-slot`** (Instagram) com o **prompt de geração** descrito dentro. O fluxo:

1. O slot fica como placeholder visível durante o desenvolvimento.
2. Pegar o prompt, gerar a imagem no ChatGPT (DALL·E) ou Gemini.
3. Salvar como `artigos/imagens/slide-{slug}-{nome}.jpg`.
4. Substituir o `.img-slot` por `<img src="imagens/slide-{slug}-{nome}.jpg" alt="..." class="slide-img">`.

As mesmas imagens geradas para os slides devem ser **intercaladas no artigo**, em `<figure>` posicionadas após os `<h2>` correspondentes, para deixar a leitura mais visual.

## Padrão de cores

- `accent-bear` (`var(--bearish)`, vermelho `#f85149`) — risco, número que dói, alerta
- `accent-bull` (`var(--bullish)`, verde `#3fb950`) — número bom, base/positivo
- `accent-warn` (`var(--neutral)`, amarelo `#f0c14b`) — atenção, intermediário
- `accent-mint` (`var(--primary-light)`, verde-esmeralda) — branding / CTA

## Quando criar um artigo novo

A geração de artigo deve produzir os **três arquivos** ao mesmo tempo. O slug é compartilhado. As três páginas se referenciam mutuamente via `view-modes` (artigo) e botões/toolbar (slides e Instagram).

Boilerplates: copiar a tripla do TRXF11 como template:

- `artigos/trxf11-gpa-recuperacao-24-pct-dividendo-2026.html`
- `artigos/trxf11-gpa-recuperacao-24-pct-dividendo-2026-slides.html`
- `artigos/trxf11-gpa-recuperacao-24-pct-dividendo-2026-instagram.html`
