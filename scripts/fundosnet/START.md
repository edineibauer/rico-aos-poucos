# Pipeline Fundos.NET — guia rápido

## Iniciar loop contínuo

```bash
cd /home/nenabauer/projetos/rico-aos-poucos/scripts/fundosnet
nohup ./loop.sh > /dev/null 2>&1 &
```

## Parar

```bash
kill $(cat /tmp/fundosnet-loop.pid)
```

## Monitorar

```bash
tail -f /tmp/fundosnet-loop.log                 # log consolidado
ls -lt /tmp/fundosnet-iter/ | head              # logs por iteração
cat data/fundosnet-log/$(date +%F).json         # log estruturado do dia
```

## Dashboard

Abrir no navegador (com servidor local rodando):

    http://localhost/rico-aos-poucos/admin/fundosnet.html

## Comandos úteis

```bash
# Dry-run sem aplicar nada:
python3 run.py --dry-run --lookback 48

# Forçar processamento de um doc específico:
python3 run.py --doc-id 1160534 --ticker BLMG11

# Processar só um ticker, últimas 24h:
python3 run.py --ticker MFII11 --lookback 24

# Reconstruir mapa pregão → ticker:
python3 build_mapa.py

# Descobrir pregão de tickers novos:
python3 discover_pregao.py --dias 60 BTAL11 KFOF11

# Criar stub para ticker ainda sem página:
python3 stub_fii.py NEWC11 "Novo Fundo FII" "Lajes"
```

## Arquivos-chave

| Arquivo | Função |
|---|---|
| `data/fundosnet-universo.json` | 87 FIIs cobertos (gerado por build_universo) |
| `data/fundosnet-mapa.json` | pregão → ticker automático (build_mapa) |
| `data/fundosnet-mapa-overlay.json` | overrides manuais (discover_pregao) |
| `data/fundosnet-orfaos.json` | pregões sem ticker no universo |
| `data/fundosnet-seen.json` | idempotência — IDs já processados |
| `data/fundosnet-log/YYYY-MM-DD.json` | log estruturado por dia |
| `data/fiis/.backups/*.json` | backup antes de cada patch aplicado |

## Fluxo

1. `client.py` busca publicações (tipoFundo=1 FII, 11 Fiagro) em janela de lookback
2. `mapa + overlay` traduz `nomePregao` → `ticker` do universo
3. `seen.py` filtra IDs já processados
4. `triage.py` classifica por tipoDocumento:
   - **Fato Relevante, Comunicado, Assembleia** → IA com opção de artigo
   - **Relatório Gerencial** → IA só atualização do JSON
   - **Informe Mensal, Rendimentos** → IA (contexto classe RCVM 175)
   - **Outros** → ignora
5. `ai.py` invoca `claude -p` headless (Sonnet)
6. `apply.py` aplica patch validado + backup
7. `publisher.py` publica artigo HTML + atualiza artigos.json + sitemap
8. `seen.py` marca doc como processado
9. `report.py` grava log estruturado
