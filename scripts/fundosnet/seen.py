"""Registro de documentos já processados — idempotência entre execuções.

Estado persistido em data/fundosnet-seen.json:

    {
      "last_run": "2026-04-14T11:00:00-03:00",
      "documents": {
        "1160534": {
          "ticker": "CVFL11",
          "tipoDocumento": "Relatório Gerencial",
          "processed_at": "2026-04-14T11:02:00-03:00",
          "action": "update+article" | "update_only" | "ignored" | "orphan",
          "articleSlug": "cvfl11-...",
          "confidence": 0.92,
          "reprocess": false
        }
      }
    }

Uso:
    store = SeenStore.load()
    if not store.is_seen(doc_id):
        ...processa...
        store.mark(doc_id, ticker=..., action=..., confidence=...)
    store.save()
"""
from __future__ import annotations

import fcntl
import json
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator

from paths import SEEN


def _agora_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


@dataclass
class SeenStore:
    path: Path = field(default_factory=lambda: SEEN)
    data: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def load(cls, path: Path | None = None) -> "SeenStore":
        p = path or SEEN
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                data = {}
        else:
            data = {}
        data.setdefault("documents", {})
        return cls(path=p, data=data)

    def is_seen(self, doc_id: int | str) -> bool:
        entry = self.data["documents"].get(str(doc_id))
        if not entry:
            return False
        return not entry.get("reprocess", False)

    def filter_new(self, doc_ids: list) -> list[str]:
        return [str(i) for i in doc_ids if not self.is_seen(i)]

    def mark(
        self,
        doc_id: int | str,
        *,
        ticker: str | None = None,
        tipo_documento: str | None = None,
        action: str = "processed",
        article_slug: str | None = None,
        confidence: float | None = None,
    ) -> None:
        entry: dict[str, Any] = {
            "ticker": ticker,
            "tipoDocumento": tipo_documento,
            "processed_at": _agora_iso(),
            "action": action,
            "reprocess": False,
        }
        if article_slug:
            entry["articleSlug"] = article_slug
        if confidence is not None:
            entry["confidence"] = confidence
        self.data["documents"][str(doc_id)] = {k: v for k, v in entry.items() if v is not None}

    def touch_run(self) -> None:
        self.data["last_run"] = _agora_iso()

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        tmp.replace(self.path)

    @contextmanager
    def atomic(self) -> "Iterator[SeenStore]":
        try:
            yield self
        finally:
            self.save()
