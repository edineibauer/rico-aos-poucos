# Spike — Fundos.NET

Valida que conseguimos detectar e baixar publicações oficiais de FIIs/Fiagros
a partir do portal CVM/B3 Fundos.NET, de forma programática e sem API key.

## Resultado

**Viável.** Pipeline ponta a ponta funciona:

1. Pesquisar publicações recentes por período + tipo de fundo.
2. Baixar o arquivo por `id`.
3. Extrair texto (PDF) ou ler formulário (HTML Estruturado).

## Endpoints

**Pesquisa** — retorna JSON DataTables.

```
GET https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados
    ?d=1&s=0&l=200
    &tipoFundo=1               # 1 = FII
    &dataInicial=10/04/2026
    &dataFinal=13/04/2026
```

- Nomes curtos obrigatórios: `d` (draw), `s` (start), `l` (length).
- `l` máximo é **200** → paginar se `recordsTotal` for maior.
- Latência: ~60s para janelas de 3 dias (aceitável pra cron horário).
- Header recomendado: `X-Requested-With: XMLHttpRequest`.

**Download** — retorna string JSON contendo Base64.

```
GET https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=<id>
```

- Resposta: `"JVBERi0..."` (aspas envolvendo Base64).
- Decodificar → pode ser `%PDF-...` ou `<html>...`.
- PDFs: extrair com `pdftotext -layout`.
- HTML Estruturado: parsear tabelas (formulário digital).

## Volume observado

Janela de 24h, tipoFundo=1:
- **188 publicações** de FIIs.
- Distribuição: 146 Informes Periódicos (mensal), 13 Avisos de Rendimentos,
  11 Assembleias, 4 Relatórios Gerenciais, 1 Fato Relevante, etc.

Pra Fiagro: ainda não mapeado — precisa testar `tipoFundo=20` (Fiagro Imobiliário)
e afins, ou puxar sem filtro e segmentar pela resposta.

## Campos úteis do retorno

```json
{
  "id": 1160534,
  "descricaoFundo": "CATUAÍ VISTA FL FII",
  "nomePregao": "FII CVFL",
  "categoriaDocumento": "Relatórios",
  "tipoDocumento": "Relatório Gerencial",
  "dataReferencia": "31/03/2026",
  "dataEntrega": "13/04/2026 16:20",
  "versao": 1,
  "status": "AC"
}
```

Não vem o ticker (ex.: `CVFL11`) puro; vem o pregão (`FII CVFL`). Precisaremos
de um mapa `pregão → ticker` ou cruzar por CNPJ/descrição com `data/fiis/*.json`.

## Tipos de publicação relevantes (para gerar artigo)

Alta relevância:
- `Fato Relevante`
- `Comunicado ao Mercado` (quando substantivo)
- `Assembleia` (convocação/decisões com impacto)
- `Relatório Gerencial` (→ resumo mensal/trimestral do portfólio)

Baixa relevância (atualiza base, mas raramente vira artigo):
- `Informe Mensal Estruturado` (dados numéricos — alimenta indicadores do site)
- `Rendimentos e Amortizações` (→ atualizar preço/DY, não artigo)

## Próximos passos (arquitetura real, fora do spike)

1. Mapa `pregão → ticker` a partir de `data/fiis/*.json` + lista B3.
2. Registro de documentos vistos (`data/fundosnet-seen.json`).
3. Pipeline de absorção por ticker: se FII ainda não tem base em `data/fiis/`,
   construir base primeiro (via backfill dos N últimos documentos).
4. Motor de relevância (quais doc → quais ações).
5. Gerador de artigo (markdown + frontmatter + categorias/tags).
6. Atualizador dos JSONs de FII (preço, indicadores, pontos de atenção).
7. CronCreate disparando o pipeline a cada hora.
