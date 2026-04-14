"""Log estruturado de execução do pipeline.

Cada execução do run.py registra uma entrada em data/fundosnet-log/YYYY-MM-DD.json
como uma lista de execuções do dia.
"""
from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

from paths import LOG_DIR


def _agora() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def nova_execucao() -> dict:
    return {
        "started_at": _agora(),
        "finished_at": None,
        "docs_fetched": 0,
        "docs_new": 0,
        "docs_by_action": {"llm_article": 0, "llm_update": 0, "deterministic": 0, "ignore": 0, "orphan": 0},
        "fiis_updated": [],
        "articles_published": [],
        "errors": [],
    }


def registrar_erro(log: dict, contexto: str, exc: Exception) -> None:
    log["errors"].append({
        "when": _agora(),
        "contexto": contexto,
        "tipo": type(exc).__name__,
        "mensagem": str(exc)[:500],
    })


def persistir(log: dict) -> Path:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log["finished_at"] = _agora()
    arquivo = LOG_DIR / f"{date.today().isoformat()}.json"
    lista = []
    if arquivo.exists():
        try:
            lista = json.loads(arquivo.read_text(encoding="utf-8"))
        except Exception:
            lista = []
    lista.append(log)
    arquivo.write_text(json.dumps(lista, indent=2, ensure_ascii=False))
    return arquivo
