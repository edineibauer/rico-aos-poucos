#!/usr/bin/env python3
"""
Spike 2 — Baixa um documento do Fundos.NET por ID e extrai o texto.

Valida o pipeline: ID → Base64 → PDF → texto pronto pra LLM.

Uso:
    python3 02_baixar_documento.py <id>
    python3 02_baixar_documento.py 562520        # fato relevante do ABCP11
"""
import base64
import subprocess
import sys
from pathlib import Path

import requests

DOWNLOAD = "https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def baixar_pdf(id_doc: int | str) -> bytes:
    resp = requests.get(
        DOWNLOAD,
        params={"id": id_doc},
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=60,
    )
    resp.raise_for_status()
    b64 = resp.text.strip().strip('"')
    pdf = base64.b64decode(b64)
    if not pdf.startswith(b"%PDF"):
        raise ValueError(f"conteúdo não parece PDF: {pdf[:20]!r}")
    return pdf


def pdf_para_texto(pdf_bytes: bytes) -> str:
    pdf_path = OUTPUT_DIR / "_tmp.pdf"
    pdf_path.write_bytes(pdf_bytes)
    out = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        capture_output=True, text=True, check=True,
    )
    return out.stdout


def main():
    if len(sys.argv) < 2:
        print("uso: python3 02_baixar_documento.py <id>")
        return 1
    id_doc = sys.argv[1]

    print(f"[spike] baixando documento id={id_doc}…")
    pdf = baixar_pdf(id_doc)
    pdf_path = OUTPUT_DIR / f"doc_{id_doc}.pdf"
    pdf_path.write_bytes(pdf)
    print(f"[spike] PDF salvo ({len(pdf)} bytes) em {pdf_path}")

    texto = pdf_para_texto(pdf)
    txt_path = OUTPUT_DIR / f"doc_{id_doc}.txt"
    txt_path.write_text(texto)
    print(f"[spike] texto extraído ({len(texto)} chars) em {txt_path}")

    print("\n--- primeiros 800 chars ---")
    print(texto[:800])
    return 0


if __name__ == "__main__":
    sys.exit(main())
