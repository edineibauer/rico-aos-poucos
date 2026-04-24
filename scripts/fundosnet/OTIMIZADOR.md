# Otimizador de Documentos — especificação formal

> Processo que converte os documentos brutos do Fundos.NET (`data/fiis-raw/{TICKER}/`) em um formato denso, leve e preservando contexto, adequado para análise via LLM (`data/fiis-optimized/{TICKER}/`).

## Contrato

### Entrada
- Pasta `data/fiis-raw/{TICKER}/` contendo:
  - `meta.json` com a lista de documentos e metadados
  - `docs/{id}.pdf|.html` com os binários originais

### Saída
- Pasta `data/fiis-optimized/{TICKER}/` contendo:
  - `{id}.md` — Markdown denso por documento, com hierarquia de páginas preservada e ordem natural de leitura (texto ↔ imagem)
  - `{id}.meta.json` — Metadados da otimização: tamanho antes/depois, imagens descartadas/mantidas, razões
  - `imagens/{id}/p{pagina:03d}_x{xref}.{ext}` — imagens sobreviventes, referenciadas no `.md`
  - `_sumario.json` — estatísticas consolidadas do ticker
  - `_caches.json` — cache de pHashes (persiste entre execuções para idempotência)

### Invariantes
- **Idempotente**: rodar novamente não reprocessa docs já otimizados (checa existência de `{id}.meta.json`).
- **Fail-soft**: um doc com erro não aborta o ticker.
- **Sem API**: roda 100% com scripts locais (PyMuPDF, imagehash, Pillow, pdftotext).

## Pipeline

### 1. Classificação de documento

Determina o modo de processamento baseado no arquivo.

| Classificação | Critério | Pipeline |
|---|---|---|
| `html_estruturado` | Extensão `.html`/`.htm` | Parser HTML com BeautifulSoup, preserva estrutura tabular |
| `pdf_texto` | PDF com ≥ 200 chars/página extraíveis | PyMuPDF extrai texto + imagens com posições |
| `pdf_imagem` | PDF com < 200 chars/página | Marcado para tratamento especial (hoje: mesmo pipeline; FUTURO: conversão de páginas em imagens para classificação manual) |
| `outro` | Demais | Lê os primeiros 100 KB como texto bruto |

### 2. Extração PDF (`pdf_texto`)

Para cada página:
1. Lista imagens embedded via `page.get_images(full=True)` (captura xref).
2. Lê blocos ordenados top→bottom via `page.get_text("dict", sort=True)`.
3. Para cada bloco:
   - **Texto**: junta spans. Heurística de fragmentação: se o bloco tem > 1 linha e a média de caracteres por linha < 50, junta as linhas com espaço (um parágrafo fragmentado por colunas). Senão preserva quebras (lista/tabela).
   - **Imagem**: correla com `xref` via bbox (mais preciso que `number`). Extrai com `doc.extract_image(xref)`. Aplica triagem heurística. Se sobrevive, grava em disco. Insere marker `<<IMG:pagina:xref>>` no Markdown na posição correta.
4. Final: `reconstruir_md` substitui markers por `![TIPO: descrição](caminho.ext)` para imagens mantidas, remove markers de imagens descartadas.

### 3. Triagem heurística de imagens (sem LLM)

Ordem de filtros (qualquer um que bate → descarte):

| Filtro | Regra | Descarta |
|---|---|---|
| `muito_pequena_em_bytes` | `len(bytes) < 3.000` | Ícones, pixels |
| `dimensao_pequena` | `largura < 150 OU altura < 100` | Ícones, bullets |
| `area_pequena` | `largura × altura < 30.000` | Mini-thumbnails |
| `aspect_ratio_N` | `max/min > 6.0` | Banners, linhas decorativas |
| `baixa_entropia_N` | Entropia Shannon do histograma < 3.5 bits | Fundos sólidos, gradientes simples |
| `repetida_no_fundo_Nx` | pHash idêntico a imagem já vista em outro doc do mesmo fundo (cache persistente) | Logos de capa, rodapés |

**Nota crítica**: o filtro `repetida_no_fundo` usa **identidade estrita** (pHash igual). Não detecta variações visuais do MESMO template com dados diferentes (ex.: gráfico mensal com barras em valores distintos).

### 4. HTML estruturado

Delegado a `extrair._html_to_text()`:
- BeautifulSoup remove `<script>`, `<style>`, `<head>`.
- Para `<tr>` → junta `<td>` com ` | `, cada linha em sua própria linha → preserva estrutura de tabela.
- Para `<p>`, `<div>`, `<h1-4>`, `<li>` → recursivo, quebra de linha no final.

### 5. Metadados produzidos

```json
{
  "id": "937592",
  "tipo": "Relatório Gerencial",
  "ticker": "HGLG11",
  "classificacao_doc": "pdf_texto",
  "paginas": 23,
  "bytes_original": 2581020,
  "bytes_otimizado": 28800,
  "reducao_percentual": 98.9,
  "imagens_brutas": 167,
  "imagens_relevantes": 19,
  "imagens_descartadas": 148,
  "razoes_descarte": {"muito_pequena_em_bytes": 139, "repetida_no_fundo_2x": 5, ...},
  "imagens_mantidas": [{"arquivo": "...", "pagina": 1, "hash_perceptual": "...", ...}],
  "otimizador_versao": "1.0"
}
```

## Resultado empírico — HGLG11 (394 docs)

- **281 MB → 7 MB** de `.md` (97,5% de redução)
- **5.856 imagens brutas → 624 mantidas** (89% descartadas heuristicamente)
- **Tempo**: 206 s (~3,5 min) em máquina local

## Limitações conhecidas (onde a análise pode mudar)

### 1. Gráficos de linha históricos com forma relevante
**Exemplo**: evolução de cota/dividendos ao longo de 10-15 anos.
**No bruto**: o traçado conta a história (volatilidade em 2020, recuperação em 2021, platô 2022-2024, retomada).
**No otimizado**: captura os pontos-chave (início, fim, máximos) via tabela adjacente, mas **perde a forma da curva**.
**Impacto analítico**: um analista que precisa falar sobre drawdowns, volatilidade temporal ou padrões sazonais perde substrato visual.

### 2. Gráficos de proporção/contribuição (barras, pizzas)
**Exemplo**: contribuição setorial do IFIX, composição da carteira por segmento.
**No bruto**: proporções relativas visualmente imediatas (barra CRIs 3x maior que Office).
**No otimizado**: números soltos em sequência — LLM precisa associar manualmente com labels. Se a sequência embaralhar, a associação corrompe.
**Impacto analítico**: análise de concentração e composição pode ficar menos confiável.

### 3. Gráficos waterfall / funnel
**Exemplo**: "receita recorrente 1,00 → -0,26 despesas → +0,35 lucro retido → 1,10 distribuído".
**No bruto**: fluxo visual de transformação claro.
**No otimizado**: números isolados sem o fluxo explícito.
**Impacto analítico**: entendimento da ponte entre métricas pode se perder.

### 4. Tabelas renderizadas como imagem (sem texto extraível)
**Quando**: gestoras que exportam relatórios direto de apresentações PowerPoint como JPEG de alta resolução, ou PDFs escaneados.
**Detecção atual**: `classificacao_doc = pdf_imagem` quando `chars/página < 200`.
**Tratamento atual**: **incompleto** — o pipeline cai no mesmo caminho de `pdf_texto` e extrai pouco.
**Impacto**: dados críticos (composição de carteira, DRE) podem sumir por inteiro.

### 5. Infográficos densos (mapas de localização com labels)
**Exemplo**: mapa do Brasil com % de receita por estado.
**No bruto**: visualização espacial clara.
**No otimizado**: imagem descartada por heurística (se for pequena) ou mantida mas sem extração de conteúdo.
**Impacto**: perde-se a distribuição geográfica com valores.

### 6. Variações do mesmo template
**Exemplo**: "Alocação por Inquilino" aparece em 50 Relatórios Gerenciais com valores diferentes a cada mês.
**Hoje**: cada uma é considerada única (pHash diferente) → cada uma vira uma imagem candidata.
**Desejado**: reconhecer o template "mesmo gráfico, dados diferentes" e classificar a família inteira de uma vez.

## Casos por tipo de documento

| Tipo | Volume típico | Risco analítico | Tratamento |
|---|---|---|---|
| Informe Mensal/Trimestral/Anual Estruturado | Pequeno (HTML tabular) | **Baixo** — parser captura bem tabelas | Pipeline atual é suficiente |
| Rendimentos e Amortizações | Pequeno (HTML) | **Zero** — parser determinístico em `extrair.py` produz série temporal | Já otimizado, sem perda |
| Fato Relevante / Comunicado | Pequeno-médio (PDF texto-dominante) | **Baixo** — texto corrido | Pipeline atual OK |
| Assembleia (convocação, ata) | Médio (PDF texto) | **Baixo** — documento formal | Pipeline atual OK |
| Relatório Gerencial | Grande (PDF visual) | **ALTO** — muitos gráficos de negócio | Ver limitações 1-3 |
| Demonstrações Financeiras | Grande (PDF tabular) | **Médio** — tabelas grandes | Pipeline atual captura |
| Prospecto / Regulamento | Muito grande (PDF texto) | **Baixo** — texto jurídico | Pipeline atual OK, pode truncar sem dano |

## Estado atual do pipeline (v1.0)

**O que funciona muito bem:**
- PDFs texto-dominantes com estrutura clara (Pátria, Kinea, XP padrão)
- HTMLs estruturados CVM (100% dos Informes)
- Fatos Relevantes e Comunicados (texto puro)
- Rendimentos (série temporal via parser determinístico)

**O que precisa de melhoria (v2.0):**
- Detecção e tratamento de `pdf_imagem` (scans, relatórios 100% em imagem)
- Extração de dados de gráficos críticos (linha histórica, waterfall, barras proporcionais)
- Clustering de imagens por template (mesmo layout, dados diferentes) para classificação em família
- Legenda estruturada de gráficos reconhecidos

**O que pode ser feito com LLM (via refinamento manual aqui no chat):**
- Classificar imagens ambíguas (gráfico vs decorativa)
- Extrair dados de gráficos complexos em tabela Markdown
- Revisar trechos onde a extração ficou ambígua

## Pipeline de refinamento manual (LLM no chat)

Os casos onde o otimizador automático perde contexto são identificados pela heurística de `candidata_refinamento` e refinados **manualmente aqui no chat**, sem custo de API.

### Heurística de candidata_refinamento (v1.2)

Uma imagem que passou na triagem vira candidata quando:
1. **Texto com números sobreposto**: ≥ 4 blocos de texto dentro da bbox da imagem E ≥ 2 desses blocos contêm números/percentuais → provável gráfico com labels embutidos (donut, waterfall).
2. **Imagem grande isolada**: área ≥ 100.000 px E ocupa ≥ 15% da página → provável gráfico standalone com labels fora da imagem (treemap, mapa, gráfico de barras).

### Fluxo de uso

```bash
# 1. Otimizar (marca candidatas automaticamente)
python3 otimizar.py MXRF11

# 2. No chat, leio cada imagem candidata e gravo extração em
#    data/fiis-optimized/{TICKER}/_refinamento.json

# 3. Aplicar o refinamento no .md
python3 aplicar_refinamento.py MXRF11
```

O `_refinamento.json` tem estrutura:
```json
{
  "ticker": "MXRF11",
  "extracoes": [
    {
      "arquivo_imagem": "imagens/811468/p010_x429.png",
      "tipo": "treemap",
      "titulo": "Portfólio por Setor",
      "dados_markdown": "| Setor | % |\n|---|---|\n| Residencial | 30,35% |\n..."
    }
  ]
}
```

O script `aplicar_refinamento.py` é idempotente — aplica cada extração no .md do(s) doc(s) que referenciam aquela imagem, inserindo bloco Markdown estruturado logo depois do `![IMAGEM: ...](...)`.

### Resultado da validação v1.2

Testes em MXRF11 e AAZQ11 (casos onde v1.0 perdeu informação crítica):
- Treemap "Portfólio por Setor" (MXRF11 pág 10) → detectada como candidata → extraída manualmente → aplicada no .md ✅
- Treemap "Concentração por Risco" (AAZQ11 pág 21) → detectada como candidata → extraída manualmente → aplicada no .md ✅

## Tratamento de `pdf_imagem` (v1.3)

**Problema identificado:** alguns PDFs (típicos de exportação PowerPoint/InDesign) têm o texto renderizado como **paths/curvas** em vez de fonte real. Nem pymupdf nem pdftotext extraem o conteúdo — o .md fica vazio mesmo com PDF rico em informação.

**Exemplo concreto:** HGLG11 Relatório Gerencial out/2024 (id=776145), 17 páginas, 4,3 MB — 157 chars/pg extraíveis (bullets vazios), mas visualmente contém tabelas, gráficos e comentários completos.

**Solução:** quando `classificacao_doc == "pdf_imagem"`:
1. Renderiza cada página do PDF como PNG (144 DPI) em `imagens/{did}/paginas/p001.png`, `p002.png`, ...
2. Marca cada página renderizada como `candidata_refinamento=true` no `.meta.json`.
3. Gera `.md` mínimo com placeholder `![PAGINA_IMAGEM: página N](imagens/{did}/paginas/p00N.png)` por página.
4. Durante o refinamento manual (LLM Opus 4.7 no chat), eu leio cada página via `Read` e extraio o conteúdo completo em Markdown estruturado → grava no `_refinamento.json` → `aplicar_refinamento.py` injeta no `.md`.

**Limite:** até 40 páginas por doc (docs maiores são geralmente prospectos com muito texto jurídico não-analítico).

## Versionamento

A versão é gravada em cada `.meta.json` sob `otimizador_versao`.

- **v1.0**: heurística pura, sem detecção de gráficos.
- **v1.1**: detecção de texto sobreposto em imagens (falso-positivo em agendas).
- **v1.2**: detecção refinada — exige números OU imagem grande isolada.
- **v1.3** (atual): tratamento de `pdf_imagem` via renderização de páginas + leitura manual no chat. Limiar do classificador elevado de 200→400 chars/pg para pegar melhor os casos fronteiriços.

## Referência rápida de uso

```bash
# Otimiza um ticker
python3 scripts/fundosnet/otimizar.py HGLG11

# Apenas um doc (útil para debug)
python3 scripts/fundosnet/otimizar.py HGLG11 --doc 937592

# Sem classificação vision (padrão hoje; obrigatório pois não há API)
python3 scripts/fundosnet/otimizar.py HGLG11 --sem-vision

# Agrupa imagens candidatas por pHash similar (para classificação em família)
python3 scripts/fundosnet/agrupar_imagens.py HGLG11 --limiar 10
```
