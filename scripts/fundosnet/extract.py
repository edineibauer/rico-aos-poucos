"""Extração de texto a partir do conteúdo baixado pelo client.

Fundos.NET entrega:
  - PDF comum (%PDF-...)
  - HTML Estruturado (formulário digital XML-like)

Esta camada normaliza para string. Parsers específicos (informe_mensal, etc.)
consomem o HTML Estruturado em outro módulo.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


def eh_pdf(raw: bytes) -> bool:
    return raw.startswith(b"%PDF")


def eh_html(raw: bytes) -> bool:
    head = raw[:200].lstrip().lower()
    return head.startswith(b"<!doctype html") or head.startswith(b"<html")


def pdf_para_texto(raw: bytes) -> str:
    """Usa pdftotext -layout. Requer poppler-utils instalado."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(raw)
        tmp_path = Path(tmp.name)
    try:
        out = subprocess.run(
            ["pdftotext", "-layout", str(tmp_path), "-"],
            capture_output=True, text=True, timeout=120,
        )
        if out.returncode != 0:
            raise RuntimeError(f"pdftotext falhou: {out.stderr[:200]}")
        return out.stdout
    finally:
        tmp_path.unlink(missing_ok=True)


def html_para_texto(raw: bytes) -> str:
    """Extração simples de texto — não parseia formulário, só tira tags."""
    import re
    html = raw.decode("utf-8", errors="replace")
    # remove scripts e styles
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    # tira tags
    txt = re.sub(r"<[^>]+>", " ", html)
    # compacta whitespace
    txt = re.sub(r"\s+", " ", txt)
    return txt.strip()


def para_texto(raw: bytes) -> tuple[str, str]:
    """Retorna (formato, texto). formato in {'pdf', 'html', 'unknown'}."""
    if eh_pdf(raw):
        return "pdf", pdf_para_texto(raw)
    if eh_html(raw):
        return "html", html_para_texto(raw)
    return "unknown", raw.decode("utf-8", errors="replace")
