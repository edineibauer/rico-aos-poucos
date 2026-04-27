# Tracker de FIIs — Controle de mineracao, otimizacao e analise

Sistema central que mapeia, para cada um dos 551 fundos do universo, em que estagio
do pipeline esta (nao_minerado / minerado / otimizado / analisado / desatualizado),
quantos documentos tem, qual o mais recente, quando foi a ultima analise e o que
precisa ser refeito.

A fonte da verdade continua sendo os JSONs em disco (`data/fiis-raw/`,
`data/fiis-optimized/`, `data/fiis/`); o **MySQL local eh apenas espelho consultavel
+ fila de reanalise**. Se o banco for apagado, basta rodar `python3 -m tracker sync`
e o estado eh reconstruido a partir do disco.

## Quando rodar

| Acao                                | Comando                                   |
|-------------------------------------|-------------------------------------------|
| Sincronizar tudo (1x ao dia)        | `python3 -m tracker sync`                 |
| Ver resumo de estagios              | `python3 -m tracker status`               |
| Ver detalhe de um fundo             | `python3 -m tracker status --ticker FTCA11` |
| Listar fundos pendentes             | `python3 -m tracker pendentes --top 30`   |
| Ver docs novos da semana            | `python3 -m tracker novos --dias 7`       |
| Ver fila de reanalise               | `python3 -m tracker fila`                 |
| Ligar loop de analise (consome fila)| `./scripts/fundosnet/start_analise.sh`    |

> O `loop_minerar.sh` ja chama `tracker sync --ticker {T}` automaticamente apos cada
> mineracao, entao docs novos sao detectados e enfileirados no mesmo ciclo.

## Pipeline diario (proposto)

```
00:00  cron: ./scripts/fundosnet/start_minerar.sh   (4 workers, round-robin)
       └─ minerar.py grava data/fiis-raw/{T}/
          └─ tracker sync --ticker {T} (espelha + enfileira novos_docs)

(continuo) ./scripts/fundosnet/start_analise.sh
       └─ tracker fila --proximo  -> {TICKER}
       └─ gerar_pagina_fii.py --ticker {TICKER}
          └─ tracker fila --concluir {TICKER}
          └─ tracker sync --ticker {TICKER}
          └─ git_publish.sh  (commit + push para CloudFlare Pages)
```

## Arquitetura

### MySQL: rico_aos_poucos (4 tabelas + 2 views)

- **fii_tracker** (1 linha por ticker) — o estado completo.
- **fii_doc** (1 linha por documento) — historico granular: tipo, data_entrega, bytes_otimizado, paginas, formato.
- **fii_evento** (auditoria) — toda mineracao/otimizacao/analise/publicacao registrada com timestamp e quantos docs novos.
- **fii_fila** — fila de reanalise consumida pelo `loop_analise.sh`.
- **v_fundos_pendentes**, **v_resumo_estagios** — views de conveniencia.

Schema completo: `scripts/tracker/schema.sql`. Recriar:
```bash
mysql -u root < scripts/tracker/schema.sql
```

### Codigo: scripts/tracker/

- `db.py`        — conexao MySQL (config via env: `TRACKER_DB_HOST`, `_USER`, `_PASS`, `_NAME`).
- `sync.py`     — varre os JSONs e faz upsert no banco.
- `__main__.py` — CLI (`python3 -m tracker ...`).

## Estados possiveis

| status_geral    | significado                                                             |
|-----------------|-------------------------------------------------------------------------|
| nao_minerado    | sem `data/fiis-raw/{T}/` e sem `data/fiis-optimized/{T}/`               |
| minerado        | `data/fiis-raw/{T}/meta.json` existe, sem otimizacao                    |
| otimizado       | tem docs em `fiis-optimized/`, mas sem `data/fiis/{T}.json`             |
| analisado       | tem `data/fiis/{T}.json` e `fiis/{T}/index.html`, em dia                |
| desatualizado   | analisado, mas `data_ultimo_doc > data_ultima_analise`                  |
| em_processo     | reservado para futuro lock                                              |

## Queries SQL uteis

```sql
USE rico_aos_poucos;

-- Resumo por estagio
SELECT * FROM v_resumo_estagios;

-- Top 20 atrasados (analisados com docs novos)
SELECT ticker, total_docs_raw, data_ultimo_doc, data_ultima_analise,
       DATEDIFF(CURRENT_DATE, DATE(data_ultima_analise)) AS dias_atraso
FROM fii_tracker
WHERE precisa_reanalise = 1
ORDER BY data_ultimo_doc DESC LIMIT 20;

-- Docs adicionados esta semana (audit log)
SELECT ticker, ocorreu_em, docs_novos, ids_novos
FROM fii_evento
WHERE tipo = 'mineracao' AND ocorreu_em > NOW() - INTERVAL 7 DAY
ORDER BY ocorreu_em DESC;

-- Maiores fundos por documentos (potencial = profundidade de analise)
SELECT ticker, total_docs_raw, total_docs_otimizados, segmento
FROM fii_tracker
ORDER BY total_docs_raw DESC LIMIT 20;
```

## Detectando docs novos

Apos a primeira sync (baseline), toda nova execucao de `tracker sync` compara os
IDs de `fii_doc` ja conhecidos contra os IDs em `data/fiis-raw/{T}/meta.json`.
Diferencas viram:

1. Linhas novas em `fii_doc`.
2. Evento `mineracao` em `fii_evento` com lista de `ids_novos`.
3. Entrada em `fii_fila` com motivo=`novos_docs`, prioridade=100.

A fila eh consumida em ordem por `prioridade DESC, enfileirado_em ASC`.

## Configuracao MySQL

Por padrao o cliente conecta em `localhost:3306` como `root` sem senha (dev local).
Para apontar pra outro banco, exporte:

```bash
export TRACKER_DB_HOST=...
export TRACKER_DB_USER=...
export TRACKER_DB_PASS=...
export TRACKER_DB_NAME=rico_aos_poucos
```

## O que NAO esta no banco

- Conteudo dos `.md` (continua so no disco em `data/fiis-optimized/{T}/`).
- JSONs de analise consolidada (continuam em `data/fiis/{T}.json`).
- HTMLs publicados (continuam em `fiis/{T}/index.html`).

O banco tem **metadados** de tudo. O conteudo permanece no disco e eh o que o site
estatico publica no CloudFlare Pages.
