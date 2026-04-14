"""Orquestrador do pipeline Fundos.NET — ponto de entrada do cron.

Fluxo (cron horário):
  1. Busca publicações tipoFundo=1 e 11 das últimas 48h (seen.json faz dedupe).
  2. Para cada doc, mapeia pregão → ticker via data/fundosnet-mapa.json.
  3. Filtra docs novos via seen.py.
  4. Classifica via triage.py.
  5. Executa:
       - deterministic → informe_mensal / rendimentos → patch
       - llm_update    → ai.analisar → patch (sem artigo)
       - llm_article   → ai.analisar → patch + artigo
       - ignore        → pula
  6. Aplica patches validados.
  7. Publica artigos com confidence adequada.
  8. Marca seen.json e grava log.

Uso:
    python3 run.py                     # rotina horária (últimas 48h)
    python3 run.py --lookback 168      # últimos 7 dias
    python3 run.py --doc-id 1160534    # replay de um doc específico
    python3 run.py --ticker BLMG11     # processa só um ticker (útil pra piloto)
    python3 run.py --dry-run           # não aplica patches, só loga
"""
from __future__ import annotations

import argparse
import fcntl
import json
import sys
import traceback
from datetime import date, datetime, timedelta
from pathlib import Path

from ai import analisar as ai_analisar, AiError, MODELO_BACKFILL, MODELO_DELTA
from apply import aplicar_patch, PatchError
from client import TIPO_FIAGRO, TIPO_FII, baixar_documento, buscar_publicacoes
from extract import para_texto
from paths import MAPA, MAPA_OVERLAY, UNIVERSO, ensure_dirs
from publisher import PublishError, publicar
from report import nova_execucao, persistir, registrar_erro
from seen import SeenStore
from triage import classify

LOCK_FILE = Path("/tmp/fundosnet.lock")
CONFIDENCE_APPLY_PATCH = 0.5
CONFIDENCE_PUBLISH_ARTICLE = 0.75


def _adquirir_lock():
    """Bloqueia execução paralela. Retorna file handle (mantém aberto)."""
    fh = LOCK_FILE.open("w")
    try:
        fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        fh.close()
        print("[run] outra execução em andamento — saindo.")
        sys.exit(0)
    fh.write(f"pid={os.getpid()}\nstarted={datetime.now().isoformat()}\n")
    fh.flush()
    return fh


def _carregar_mapa() -> dict:
    if not MAPA.exists():
        print(f"[run] {MAPA} não existe — rode build_mapa.py primeiro.")
        sys.exit(2)
    mapa = json.loads(MAPA.read_text(encoding="utf-8"))
    # Mescla overlay manual (descoberta direcionada) — tem prioridade sobre auto.
    if MAPA_OVERLAY.exists():
        overlay = json.loads(MAPA_OVERLAY.read_text(encoding="utf-8"))
        mapa["mapa"].update(overlay.get("mapa", {}))
    return mapa


def _carregar_universo() -> dict:
    if not UNIVERSO.exists():
        print(f"[run] {UNIVERSO} não existe — rode build_universo.py primeiro.")
        sys.exit(2)
    return json.loads(UNIVERSO.read_text(encoding="utf-8"))


def _ticker_do_doc(doc: dict, mapa: dict) -> str | None:
    pregao = (doc.get("nomePregao") or "").strip()
    if not pregao:
        return None
    entrada = mapa["mapa"].get(pregao)
    return entrada["ticker"].upper() if entrada else None


def _processar_doc(
    doc: dict,
    ticker: str,
    universo_fundos: list[dict],
    seen: SeenStore,
    log: dict,
    *,
    dry_run: bool,
    modelo: str,
    mapa_ambiguo: set[str] | None = None,
) -> None:
    doc_id = str(doc["id"])
    decisao = classify(doc)
    log["docs_by_action"][decisao.action] = log["docs_by_action"].get(decisao.action, 0) + 1

    if decisao.action == "ignore":
        if not dry_run:
            seen.mark(doc_id, ticker=ticker, tipo_documento=doc.get("tipoDocumento"), action="ignored")
        return

    print(f"  [proc] doc={doc_id} ticker={ticker} "
          f"tipo={doc.get('tipoDocumento','?')[:40]} acao={decisao.action}", flush=True)

    # Observação sobre RCVM 175: docs "Classe" podem ser de classes diferentes.
    # Passamos fundoOuClasse + nomePregao pra IA decidir via confidence.

    # Baixa e extrai texto
    try:
        raw = baixar_documento(doc_id)
        formato, texto = para_texto(raw)
    except Exception as e:
        registrar_erro(log, f"download/extract doc={doc_id} ticker={ticker}", e)
        return

    # Pré-processamento: dados extraídos por parsers determinísticos (se houver)
    # São passados à IA como "dica" pra reduzir alucinação.
    dados_extraidos = None
    if decisao.parser:
        try:
            if decisao.parser == "informe_mensal":
                from parsers.informe_mensal import extrair as im_extrair
                dados_extraidos = im_extrair(raw.decode("utf-8", errors="replace"))
            elif decisao.parser == "rendimentos":
                from parsers.rendimentos import extrair as rd_extrair
                dados_extraidos = rd_extrair(texto)
        except Exception:
            pass

    # Caminho determinístico (raramente escolhido após RCVM 175)
    if decisao.action == "deterministic":
        patch: dict = {}
        try:
            if decisao.parser == "informe_mensal":
                from parsers.informe_mensal import extrair as im_extrair, gerar_patch as im_patch
                # Informe Mensal vem em HTML; se pdftotext retornou "unknown" ou "html", usar raw
                patch = im_patch(im_extrair(
                    raw.decode("utf-8", errors="replace") if formato != "pdf" else texto
                ))
            elif decisao.parser == "rendimentos":
                from parsers.rendimentos import extrair as rd_extrair, gerar_patch as rd_patch
                patch = rd_patch(rd_extrair(texto))
        except Exception as e:
            registrar_erro(log, f"parser {decisao.parser} doc={doc_id}", e)

        if dry_run:
            print(f"[dry-run] determ | doc={doc_id} ticker={ticker} parser={decisao.parser} patch_keys={list(patch.keys())}")
            return

        if patch and not dry_run:
            try:
                aplicar_patch(ticker, patch)
                if ticker not in log["fiis_updated"]:
                    log["fiis_updated"].append(ticker)
            except PatchError as e:
                registrar_erro(log, f"apply deterministic doc={doc_id} ticker={ticker}", e)

        if not dry_run:
            seen.mark(doc_id, ticker=ticker, tipo_documento=doc.get("tipoDocumento"),
                      action="deterministic" if patch else "deterministic_noop")
        return

    # Em dry-run, pula chamada de IA (salva tempo/recursos)
    if dry_run:
        if decisao.action in {"llm_article", "llm_update"}:
            print(f"[dry-run] skip IA | doc={doc_id} ticker={ticker} motivo={decisao.motivo}")
        return

    # Caminho IA (llm_update ou llm_article)
    fundo = next((f for f in universo_fundos if f["ticker"] == ticker), None)
    if not fundo:
        registrar_erro(log, f"ticker {ticker} não está no universo", RuntimeError("sem JSON base"))
        return
    try:
        fundo_json = json.loads(Path(fundo["arquivoJson"]).read_text(encoding="utf-8"))
    except Exception as e:
        # tentativa com caminho relativo à raiz
        from paths import ROOT
        try:
            fundo_json = json.loads((ROOT / fundo["arquivoJson"]).read_text(encoding="utf-8"))
        except Exception as e2:
            registrar_erro(log, f"ler JSON do fundo {ticker}", e2)
            return

    try:
        meta_doc = {
            "id": doc_id,
            "tipoDocumento": doc.get("tipoDocumento"),
            "categoriaDocumento": doc.get("categoriaDocumento"),
            "dataReferencia": doc.get("dataReferencia"),
            "dataEntrega": doc.get("dataEntrega"),
            "descricaoFundo": doc.get("descricaoFundo"),
            "nomePregao": doc.get("nomePregao"),
            "fundoOuClasse": doc.get("fundoOuClasse"),
            "formato": formato,
        }
        if dados_extraidos:
            meta_doc["dados_extraidos"] = dados_extraidos.__dict__

        analise = ai_analisar(
            ticker=ticker,
            fundo_json=fundo_json,
            documento_texto=texto,
            documento_meta=meta_doc,
            modelo=modelo,
        )
    except AiError as e:
        print(f"    [ai-erro] {e}", flush=True)
        registrar_erro(log, f"ai doc={doc_id} ticker={ticker}", e)
        return

    print(f"    [ai] relevance={analise.relevance} confidence={analise.confidence:.2f} "
          f"patch_keys={list(analise.patch.keys())[:5]} article={'sim' if analise.article else 'nao'}", flush=True)

    # Decisão de aplicação
    if analise.confidence < CONFIDENCE_APPLY_PATCH:
        print(f"    [descartado] confidence {analise.confidence:.2f} < {CONFIDENCE_APPLY_PATCH}", flush=True)
        if not dry_run:
            seen.mark(doc_id, ticker=ticker, tipo_documento=doc.get("tipoDocumento"),
                      action="discarded_low_confidence", confidence=analise.confidence)
        return

    # Aplica patch
    patch_aplicado = False
    if analise.patch and not dry_run:
        try:
            relat = aplicar_patch(ticker, analise.patch)
            patch_aplicado = True
            if ticker not in log["fiis_updated"]:
                log["fiis_updated"].append(ticker)
            print(f"    [patch-aplicado] backup={relat.get('backup')} paths={relat.get('paths_alterados')[:5]}", flush=True)
        except PatchError as e:
            print(f"    [patch-erro] {e}", flush=True)
            registrar_erro(log, f"apply doc={doc_id} ticker={ticker}", e)

    # Publica artigo se qualificado
    publicou_slug = None
    if (
        analise.article
        and analise.confidence >= CONFIDENCE_PUBLISH_ARTICLE
        and decisao.action == "llm_article"
        and not dry_run
    ):
        try:
            caminho = publicar(analise.article)
            publicou_slug = analise.article["slug"]
            log["articles_published"].append({
                "slug": publicou_slug,
                "ticker": ticker,
                "arquivo": str(caminho),
            })
            print(f"    [ARTIGO PUBLICADO] {publicou_slug} → {caminho}", flush=True)
        except PublishError as e:
            print(f"    [publish-erro] {e}", flush=True)
            registrar_erro(log, f"publish doc={doc_id} ticker={ticker}", e)

    if not dry_run:
        seen.mark(
            doc_id,
            ticker=ticker,
            tipo_documento=doc.get("tipoDocumento"),
            action="update+article" if publicou_slug else "update_only" if patch_aplicado else "analyzed_only",
            article_slug=publicou_slug,
            confidence=analise.confidence,
        )


def main() -> int:
    ap = argparse.ArgumentParser(description="Pipeline Fundos.NET → Rico aos Poucos")
    ap.add_argument("--lookback", type=int, default=48, help="Horas para trás (default 48)")
    ap.add_argument("--doc-id", help="Replay de um ID específico (bypassa busca)")
    ap.add_argument("--ticker", help="Filtra por um ou mais tickers (separados por vírgula)")
    ap.add_argument("--tipo-fundo", type=int, default=None, help="1=FII, 11=Fiagro. Default: ambos.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--modelo", default=MODELO_DELTA, choices=[MODELO_DELTA, MODELO_BACKFILL])
    args = ap.parse_args()

    ensure_dirs()
    global os
    import os  # lazy import para _adquirir_lock

    lock = _adquirir_lock()
    log = nova_execucao()

    try:
        mapa = _carregar_mapa()
        universo = _carregar_universo()
        seen = SeenStore.load()
        seen.touch_run()

        if args.doc_id:
            # Modo replay
            from client import ENDPOINT_SEARCH  # noqa
            # Busca 30d para achar o doc específico — simples
            hoje = date.today()
            di = (hoje - timedelta(days=30)).strftime("%d/%m/%Y")
            df = hoje.strftime("%d/%m/%Y")
            for tipo in [TIPO_FII, TIPO_FIAGRO]:
                for doc in buscar_publicacoes(di, df, tipo_fundo=tipo):
                    if str(doc["id"]) == args.doc_id:
                        ticker = _ticker_do_doc(doc, mapa)
                        if not ticker:
                            print(f"[run] doc {args.doc_id} órfão (sem ticker no mapa)")
                            return 1
                        if args.ticker:
                            alvos = {t.strip().upper() for t in args.ticker.split(",")}
                            if ticker.upper() not in alvos:
                                continue
                        log["docs_fetched"] = 1
                        log["docs_new"] = 1
                        _processar_doc(doc, ticker, universo["fundos"], seen, log,
                                       dry_run=args.dry_run, modelo=args.modelo)
                        break
        else:
            # Rotina normal
            hoje = datetime.now()
            inicio = hoje - timedelta(hours=args.lookback)
            di = inicio.strftime("%d/%m/%Y")
            df = hoje.strftime("%d/%m/%Y")

            # Identifica tickers que têm múltiplos pregões no mapa (classes
            # ambíguas no regime RCVM 175). run pula docs de Classe desses tickers.
            from collections import Counter
            pregoes_por_ticker = Counter(m["ticker"] for m in mapa["mapa"].values())
            ambiguos = {t for t, n in pregoes_por_ticker.items() if n > 1}

            tipos = [TIPO_FII, TIPO_FIAGRO] if args.tipo_fundo is None else [args.tipo_fundo]
            for tipo in tipos:
                for doc in buscar_publicacoes(di, df, tipo_fundo=tipo):
                    log["docs_fetched"] += 1
                    if seen.is_seen(doc["id"]):
                        continue
                    log["docs_new"] += 1
                    ticker = _ticker_do_doc(doc, mapa)
                    if not ticker:
                        log["docs_by_action"]["orphan"] = log["docs_by_action"].get("orphan", 0) + 1
                        if not args.dry_run:
                            seen.mark(doc["id"], action="orphan",
                                      tipo_documento=doc.get("tipoDocumento"))
                        continue
                    if args.ticker:
                        alvos = {t.strip().upper() for t in args.ticker.split(",")}
                        if ticker.upper() not in alvos:
                            continue
                    try:
                        _processar_doc(
                            doc, ticker, universo["fundos"], seen, log,
                            dry_run=args.dry_run, modelo=args.modelo,
                            mapa_ambiguo=ambiguos,
                        )
                    except Exception as e:
                        registrar_erro(log, f"doc {doc.get('id')}", e)

        if not args.dry_run:
            seen.save()
    except Exception as e:
        log["errors"].append({
            "contexto": "main",
            "tipo": type(e).__name__,
            "mensagem": str(e),
            "traceback": traceback.format_exc()[-2000:],
        })
    finally:
        arquivo = persistir(log)
        fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
        lock.close()
        LOCK_FILE.unlink(missing_ok=True)

    print(f"[run] concluído — log em {arquivo}")
    print(f"       fetched={log['docs_fetched']} new={log['docs_new']} "
          f"updated={len(log['fiis_updated'])} artigos={len(log['articles_published'])} "
          f"erros={len(log['errors'])}")
    return 0 if not log["errors"] else 1


if __name__ == "__main__":
    sys.exit(main())
