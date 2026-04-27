"""Snapshot do cenário macro brasileiro relevante para valuation de FIIs.

Coleta:
  - Selic atual (Banco Central, série SGS 432).
  - Selic projetada 12m (Focus do BCB — top do "Selic" para dez do próximo ano).
  - IPCA acumulado 12m (SGS 13522) e projetado 12m (Focus).
  - Curva DI futuro (B3 — DI1 vencimentos < 5y) — quando disponível;
    fallback para o que estiver no arquivo anterior.

Salva data/macro_snapshot.json. Idealmente atualizar 1x por semana.

Uso:
    python3 scripts/cotacoes/macro_snapshot.py
    python3 scripts/cotacoes/macro_snapshot.py --selic 14.75 --selic-projetada 11.0  # input manual
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
SNAPSHOT_PATH = DATA / "macro_snapshot.json"

USER_AGENT = "Mozilla/5.0 (compatible; RicoAosPoucos/1.0; +https://ricoaospoucos.com.br)"


def _http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _bcb_sgs(serie: int, ultimos: int = 1) -> list[dict] | None:
    """Banco Central — Sistema Gerenciador de Séries Temporais."""
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados/ultimos/{ultimos}?formato=json"
    try:
        raw = _http_get(url)
        return json.loads(raw)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        print(f"  [BCB SGS {serie}] falha: {e}", file=sys.stderr)
        return None


def _focus_top(indicador: str = "Selic") -> dict | None:
    """Focus do BCB — última projeção mediana para o final do próximo ano.
    Fonte: olinda.bcb.gov.br ExpectativasMercadoAnuais."""
    ano_alvo = datetime.now(timezone.utc).year + 1
    url = (
        "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/"
        "ExpectativasMercadoAnuais"
        f"?$top=1&$filter=Indicador%20eq%20%27{urllib.parse.quote(indicador)}%27"
        f"%20and%20DataReferencia%20eq%20%27{ano_alvo}%27"
        "&$orderby=Data%20desc&$format=json"
    )
    try:
        raw = _http_get(url)
        data = json.loads(raw)
        items = data.get("value") or []
        return items[0] if items else None
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        print(f"  [Focus {indicador}] falha: {e}", file=sys.stderr)
        return None


def _selic_atual() -> float | None:
    """Série 432 — meta Selic % a.a."""
    pontos = _bcb_sgs(432, ultimos=1)
    if not pontos:
        return None
    try:
        return float(pontos[0]["valor"])
    except (KeyError, ValueError):
        return None


def _ipca_12m_acumulado() -> float | None:
    """Série 13522 — IPCA acumulado 12m % a.a."""
    pontos = _bcb_sgs(13522, ultimos=1)
    if not pontos:
        return None
    try:
        return float(pontos[0]["valor"])
    except (KeyError, ValueError):
        return None


def _ler_existente() -> dict:
    if SNAPSHOT_PATH.exists():
        try:
            return json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def coletar(selic_manual: float | None = None, selic_proj_manual: float | None = None,
            ipca_proj_manual: float | None = None) -> dict:
    print("[macro] coletando snapshot…")
    existente = _ler_existente()

    selic = selic_manual if selic_manual is not None else _selic_atual()
    if selic is None:
        selic = existente.get("selicAtual")
        print(f"  [warn] Selic atual indisponível, usando último conhecido: {selic}")
    else:
        print(f"  Selic atual: {selic:.2f}%")

    selic_proj = selic_proj_manual
    if selic_proj is None:
        focus = _focus_top("Selic")
        if focus and focus.get("Mediana") is not None:
            selic_proj = float(focus["Mediana"])
            print(f"  Selic projetada (Focus, fim de {focus.get('DataReferencia')}): {selic_proj:.2f}%")
    if selic_proj is None:
        selic_proj = existente.get("selicProjetada12m")
        if selic_proj is not None:
            print(f"  [warn] Selic projetada indisponível, usando último: {selic_proj}")

    ipca12 = _ipca_12m_acumulado()
    if ipca12 is not None:
        print(f"  IPCA 12m: {ipca12:.2f}%")
    else:
        ipca12 = existente.get("ipcaAcumulado12m")

    ipca_proj = ipca_proj_manual
    if ipca_proj is None:
        focus_ipca = _focus_top("IPCA")
        if focus_ipca and focus_ipca.get("Mediana") is not None:
            ipca_proj = float(focus_ipca["Mediana"])
            print(f"  IPCA projetado (Focus, fim de {focus_ipca.get('DataReferencia')}): {ipca_proj:.2f}%")
    if ipca_proj is None:
        ipca_proj = existente.get("ipcaProjetado12m")

    snapshot = {
        "dataSnapshot": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "atualizadoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "selicAtual": selic,
        "selicProjetada12m": selic_proj,
        "ipcaAcumulado12m": ipca12,
        "ipcaProjetado12m": ipca_proj,
        # Os campos abaixo são preenchidos manualmente quando há dado de curva DI.
        # Anbima publica curva diária mas exige autenticação; B3 publica via FTP.
        # Por enquanto deixamos null e o LLM trata como ausente.
        "diCurto": existente.get("diCurto"),  # ~6 meses
        "diMedio": existente.get("diMedio"),  # ~2 anos
        "diLongo": existente.get("diLongo"),  # ~5 anos
        "fontes": {
            "selicAtual": "BCB SGS 432",
            "selicProjetada12m": "BCB Focus (mediana, fim do ano alvo)",
            "ipcaAcumulado12m": "BCB SGS 13522",
            "ipcaProjetado12m": "BCB Focus (mediana, fim do ano alvo)",
            "di": "input manual (Anbima/B3)",
        },
    }

    DATA.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  snapshot salvo em {SNAPSHOT_PATH.relative_to(ROOT)}")
    return snapshot


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selic", type=float, help="Override manual Selic atual %")
    ap.add_argument("--selic-projetada", type=float, help="Override manual Selic projetada 12m %")
    ap.add_argument("--ipca-projetado", type=float, help="Override manual IPCA projetado 12m %")
    args = ap.parse_args()

    coletar(selic_manual=args.selic, selic_proj_manual=args.selic_projetada,
            ipca_proj_manual=args.ipca_projetado)
    return 0


if __name__ == "__main__":
    sys.exit(main())
