"""Cliente HTTP para o portal Fundos.NET (CVM/B3).

Endpoints públicos:
- pesquisarGerenciadorDocumentosDados: lista publicações por período + tipoFundo
- exibirDocumento: baixa o documento (Base64 de PDF ou HTML Estruturado)

Observações:
- Parâmetros de paginação usam nomes curtos: d (draw), s (start), l (length).
- l máximo é 200. Se recordsTotal > 200, paginar.
- Latência alta — backend é lento. Timeouts generosos.
- tipoFundo=1 cobre FIIs e Fiagro Imobiliário (nomePregao começa com FIAGRO ou FII).
"""
from __future__ import annotations

import base64
import time
from typing import Iterator

import requests

ENDPOINT_SEARCH = "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados"
ENDPOINT_DOC = "https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento"

# Códigos tipoFundo confirmados empiricamente (scan 14/04/2026):
#   1  = FII (inclui Fiagro Imobiliário, nomePregao começa com FIAGRO)
#   2  = FIDC
#   3  = ETF / Fundo de Índice
#   11 = Fiagro (agro não-imobiliário)
TIPO_FII = 1
TIPO_FIAGRO = 11

PAGE_SIZE = 200
TIMEOUT_SEARCH = 180
TIMEOUT_DOC = 90

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RicoAosPoucos/1.0; +https://ricoaospoucos.com.br)",
    "X-Requested-With": "XMLHttpRequest",
}


def _get(url: str, params: dict, timeout: int, tentativas: int = 3) -> requests.Response:
    """GET com retry exponencial em erros transitórios."""
    ultimo = None
    for i in range(tentativas):
        try:
            r = requests.get(url, params=params, headers=_HEADERS, timeout=timeout)
            if r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code} {r.reason}")
            r.raise_for_status()
            return r
        except (requests.RequestException, requests.HTTPError) as e:
            ultimo = e
            if i < tentativas - 1:
                time.sleep(2 ** i)  # 1s, 2s, 4s
    raise RuntimeError(f"Fundos.NET indisponível após {tentativas} tentativas: {ultimo}")


def _pagina(start: int, length: int, data_inicial: str, data_final: str, tipo_fundo: int) -> dict:
    params = {
        "d": 1,
        "s": start,
        "l": length,
        "tipoFundo": tipo_fundo,
        "dataInicial": data_inicial,
        "dataFinal": data_final,
    }
    return _get(ENDPOINT_SEARCH, params, TIMEOUT_SEARCH).json()


def buscar_publicacoes(
    data_inicial: str,
    data_final: str,
    tipo_fundo: int = 1,
) -> Iterator[dict]:
    """Itera todas as publicações no período. Datas em dd/mm/YYYY."""
    first = _pagina(0, PAGE_SIZE, data_inicial, data_final, tipo_fundo)
    total = first.get("recordsTotal") or 0
    yield from (first.get("data") or [])

    got = len(first.get("data") or [])
    while got < total:
        pag = _pagina(got, PAGE_SIZE, data_inicial, data_final, tipo_fundo)
        batch = pag.get("data") or []
        if not batch:
            break
        got += len(batch)
        yield from batch


def baixar_documento(id_doc: int | str) -> bytes:
    """Baixa documento por ID. Retorna bytes de PDF ou HTML."""
    r = _get(ENDPOINT_DOC, {"id": id_doc}, TIMEOUT_DOC)
    b64 = r.text.strip().strip('"')
    return base64.b64decode(b64)
