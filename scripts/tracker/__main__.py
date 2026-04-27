"""CLI do tracker.

Uso:
  python3 -m tracker sync                       # sync universo inteiro
  python3 -m tracker sync --ticker FTCA11       # sync só um ticker
  python3 -m tracker sync --quiet               # sem print por ticker
  python3 -m tracker status                     # resumo por estagio
  python3 -m tracker status --ticker FTCA11     # detalhe de um ticker
  python3 -m tracker pendentes                  # fundos com analise desatualizada/inexistente
  python3 -m tracker pendentes --top 30
  python3 -m tracker novos --dias 7             # docs adicionados nos ultimos 7 dias
  python3 -m tracker fila                       # estado da fila de reanalise
  python3 -m tracker fila --proximo             # imprime proximo ticker da fila
  python3 -m tracker fila --concluir TICKER     # marca como concluido
  python3 -m tracker fila --erro TICKER 'msg'   # registra erro e incrementa tentativas
  python3 -m tracker evento TICKER tipo [docs] [detalhe]
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta

from .db import conn
from .sync import sincronizar


def cmd_sync(args) -> int:
    tickers = [args.ticker] if args.ticker else None
    res = sincronizar(tickers=tickers, verbose=not args.quiet)
    if args.quiet:
        print(json.dumps(res["estatisticas"]))
    return 0


def cmd_status(args) -> int:
    with conn() as c:
        cur = c.cursor()
        if args.ticker:
            cur.execute("SELECT * FROM fii_tracker WHERE ticker=%s", (args.ticker.upper(),))
            row = cur.fetchone()
            if not row:
                print(f"ticker {args.ticker} nao encontrado", file=sys.stderr)
                return 1
            for k, v in row.items():
                print(f"  {k:25} {v}")
            print()
            cur.execute(
                "SELECT doc_id, tipo, data_entrega FROM fii_doc WHERE ticker=%s ORDER BY data_entrega DESC LIMIT 10",
                (args.ticker.upper(),),
            )
            print("  ultimos 10 docs:")
            for d in cur.fetchall():
                print(f"    {d['data_entrega']}  {d['doc_id']:>10}  {d['tipo']}")
            return 0

        cur.execute("SELECT status_geral, COUNT(*) AS qtd FROM fii_tracker GROUP BY status_geral")
        rows = cur.fetchall()
        print("estagios:")
        for r in rows:
            print(f"  {r['status_geral']:20} {r['qtd']:4}")

        cur.execute(
            """SELECT COUNT(*) AS n,
                      SUM(precisa_reanalise) AS reanalise,
                      SUM(tem_analise=0) AS sem_analise,
                      SUM(tem_pagina=0) AS sem_pagina
               FROM fii_tracker"""
        )
        r = cur.fetchone()
        print()
        print(f"total tickers:        {r['n']}")
        print(f"sem analise:          {r['sem_analise']}")
        print(f"sem pagina:           {r['sem_pagina']}")
        print(f"precisa reanalise:    {r['reanalise']}")
    return 0


def cmd_pendentes(args) -> int:
    top = args.top
    with conn() as c:
        cur = c.cursor()
        cur.execute(
            """SELECT ticker, status_geral, total_docs_raw, data_ultimo_doc, data_ultima_analise,
                      DATEDIFF(CURRENT_DATE, COALESCE(DATE(data_ultima_analise), '2000-01-01')) AS dias
               FROM fii_tracker
               WHERE precisa_reanalise=1 OR tem_analise=0
               ORDER BY (tem_analise=0) DESC, data_ultimo_doc DESC
               LIMIT %s""",
            (top,),
        )
        rows = cur.fetchall()
        print(f"{len(rows)} pendentes (top {top})")
        print(f"{'ticker':8} {'status':14} {'docs':>5} {'ult_doc':12} {'ult_analise':22} {'dias':>5}")
        for r in rows:
            ult_anl = r["data_ultima_analise"].isoformat(sep=" ", timespec="minutes") if r["data_ultima_analise"] else "-"
            print(f"{r['ticker']:8} {r['status_geral']:14} {r['total_docs_raw']:>5} {str(r['data_ultimo_doc'] or '-'):12} {ult_anl:22} {r['dias']:>5}")
    return 0


def cmd_novos(args) -> int:
    dias = args.dias
    desde = (datetime.now() - timedelta(days=dias)).date()
    with conn() as c:
        cur = c.cursor()
        cur.execute(
            """SELECT ticker, COUNT(*) AS n, MAX(data_entrega) AS ultimo
               FROM fii_doc
               WHERE data_entrega >= %s
               GROUP BY ticker
               ORDER BY n DESC""",
            (desde,),
        )
        rows = cur.fetchall()
        print(f"docs novos desde {desde} (em {len(rows)} tickers)")
        for r in rows:
            print(f"  {r['ticker']:8} {r['n']:>4} docs  ultimo={r['ultimo']}")
    return 0


def cmd_fila(args) -> int:
    with conn() as c:
        cur = c.cursor()
        if args.proximo:
            cur.execute(
                """SELECT ticker FROM fii_fila
                   WHERE concluido_em IS NULL AND iniciado_em IS NULL
                   ORDER BY prioridade DESC, enfileirado_em ASC LIMIT 1"""
            )
            r = cur.fetchone()
            if not r:
                return 1
            cur.execute(
                "UPDATE fii_fila SET iniciado_em=NOW(), tentativas=tentativas+1 WHERE ticker=%s",
                (r["ticker"],),
            )
            print(r["ticker"])
            return 0
        if args.concluir:
            cur.execute(
                "UPDATE fii_fila SET concluido_em=NOW() WHERE ticker=%s",
                (args.concluir.upper(),),
            )
            cur.execute(
                "UPDATE fii_tracker SET precisa_reanalise=0 WHERE ticker=%s",
                (args.concluir.upper(),),
            )
            print(f"concluida {args.concluir.upper()}")
            return 0
        if args.erro:
            ticker, msg = args.erro
            cur.execute(
                "UPDATE fii_fila SET ultimo_erro=%s, iniciado_em=NULL WHERE ticker=%s",
                (msg, ticker.upper()),
            )
            print(f"erro registrado em {ticker.upper()}")
            return 0
        cur.execute(
            """SELECT ticker, motivo, prioridade, enfileirado_em, iniciado_em, concluido_em, tentativas
               FROM fii_fila
               WHERE concluido_em IS NULL
               ORDER BY prioridade DESC, enfileirado_em ASC"""
        )
        rows = cur.fetchall()
        print(f"fila aberta: {len(rows)}")
        for r in rows:
            est = "EM_PROCESSO" if r["iniciado_em"] else "PENDENTE"
            print(f"  {r['ticker']:8} prio={r['prioridade']:>3} {r['motivo']:18} {est:12} tent={r['tentativas']}  desde {r['enfileirado_em']}")
    return 0


def cmd_evento(args) -> int:
    with conn() as c:
        cur = c.cursor()
        cur.execute(
            "INSERT INTO fii_evento (ticker, tipo, docs_novos, duracao_s, detalhe) VALUES (%s, %s, %s, %s, %s)",
            (args.ticker.upper(), args.tipo, args.docs or 0, args.duracao, args.detalhe),
        )
    print(f"evento registrado: {args.ticker} {args.tipo}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="tracker")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("sync", help="sincroniza estado dos JSONs com MySQL")
    p.add_argument("--ticker", help="apenas um ticker")
    p.add_argument("--quiet", action="store_true")
    p.set_defaults(fn=cmd_sync)

    p = sub.add_parser("status", help="resumo por estagio ou detalhe de ticker")
    p.add_argument("--ticker")
    p.set_defaults(fn=cmd_status)

    p = sub.add_parser("pendentes", help="fundos com analise pendente/desatualizada")
    p.add_argument("--top", type=int, default=50)
    p.set_defaults(fn=cmd_pendentes)

    p = sub.add_parser("novos", help="docs novos por ticker")
    p.add_argument("--dias", type=int, default=7)
    p.set_defaults(fn=cmd_novos)

    p = sub.add_parser("fila", help="fila de reanalise")
    p.add_argument("--proximo", action="store_true", help="extrai proximo da fila e marca iniciado")
    p.add_argument("--concluir", help="marca ticker como concluido")
    p.add_argument("--erro", nargs=2, metavar=("TICKER", "MSG"), help="registra erro")
    p.set_defaults(fn=cmd_fila)

    p = sub.add_parser("evento", help="registra evento manual")
    p.add_argument("ticker")
    p.add_argument("tipo", choices=["mineracao", "otimizacao", "analise", "publicacao", "erro"])
    p.add_argument("--docs", type=int, default=0)
    p.add_argument("--duracao", type=float)
    p.add_argument("--detalhe")
    p.set_defaults(fn=cmd_evento)

    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
