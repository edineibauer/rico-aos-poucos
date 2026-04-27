"""
Normalizador automático de JSONs de análise FII (schema v3).

Workers às vezes entregam o JSON com pequenas variações de schema:
- Campos array escritos como string (ex: tipoSobreposicao, paraQuem.objetivo)
- Aliases de nomes (percentual vs pct, percentualPL vs percPL)
- Campos opcionais como null em lugar de array vazio
- Schema flag faltando (portfolio.schema = null)

Esse script aplica TODAS as regras conhecidas de normalização ANTES da publicação.
Roda como sanity check e auto-fix — não rejeita JSONs, só normaliza.

Uso:
    python3 -m fundosnet.normalizar_json --ticker JSRE11 --write
    python3 -m fundosnet.normalizar_json --todos --dry-run     # só reporta
    python3 -m fundosnet.normalizar_json --todos --write       # aplica
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_FIIS = ROOT / "data" / "fiis"


def _to_array(v):
    """Converte string para array de 1 elemento; None vira []; preserva array."""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        return [v] if v else []
    if v is None:
        return []
    return [v]  # qualquer outra coisa (number, dict) também vira lista


def _rename_key(d, old, new):
    """Se d[old] existe e d[new] não, renomeia."""
    if isinstance(d, dict) and old in d and new not in d:
        d[new] = d.pop(old)
        return True
    return False


def normalizar(d: dict, ticker: str) -> list[str]:
    """
    Aplica regras de normalização in-place. Retorna lista de mudanças aplicadas.
    """
    changes: list[str] = []

    # ---- meta ----
    meta = d.setdefault("meta", {})
    if not meta.get("ticker"):
        meta["ticker"] = ticker.upper()
        changes.append("meta.ticker preenchido")

    # ---- portfolio ----
    p = d.get("portfolio")
    if isinstance(p, dict):
        # schema deve ser "v2" se tem alocacaoPL ou ativos[]
        if not p.get("schema"):
            stats = p.get("stats")
            if (isinstance(stats, dict) and stats.get("alocacaoPL")) or p.get("ativos"):
                p["schema"] = "v2"
                changes.append("portfolio.schema=v2 inferido")

        # alocacaoPL: percentual → pct
        stats = p.get("stats")
        if isinstance(stats, dict):
            aloc = stats.get("alocacaoPL")
            if isinstance(aloc, list):
                for a in aloc:
                    if isinstance(a, dict) and _rename_key(a, "percentual", "pct"):
                        changes.append("alocacaoPL[].percentual→pct")

        # ativos[]: campos array que podem vir como string + percentualPL→percPL
        ativos = p.get("ativos")
        if isinstance(ativos, list):
            for i, a in enumerate(ativos):
                if not isinstance(a, dict):
                    continue
                if _rename_key(a, "percentualPL", "percPL"):
                    changes.append(f"ativos[{i}].percentualPL→percPL")
                for arr_field in ("garantias", "riscos", "certificacoes"):
                    if arr_field in a and not isinstance(a[arr_field], list):
                        a[arr_field] = _to_array(a[arr_field])
                        changes.append(f"ativos[{i}].{arr_field} → array")
                # locatarios[]
                locs = a.get("locatarios")
                if isinstance(locs, list):
                    for j, loc in enumerate(locs):
                        if not isinstance(loc, dict):
                            continue
                        c = loc.get("contrato")
                        if isinstance(c, dict):
                            for arr_field in ("garantias",):
                                if arr_field in c and not isinstance(c[arr_field], list):
                                    c[arr_field] = _to_array(c[arr_field])
                                    changes.append(f"ativos[{i}].locatarios[{j}].contrato.{arr_field} → array")

        # taxas.detalhes: array de {label, valor} OU string HTML solta vai para observacao
        tx = d.get("taxas")
        if isinstance(tx, dict):
            det = tx.get("detalhes")
            if isinstance(det, str) and det.strip():
                tx["observacao"] = det.strip()
                tx["detalhes"] = []
                changes.append("taxas.detalhes string → observacao + detalhes=[]")
            elif det is None:
                tx["detalhes"] = []
                changes.append("taxas.detalhes null → []")

    # ---- timeline ----
    tl = d.get("timeline")
    if isinstance(tl, dict):
        # crescimento: deve ser array de {label, valor, detalhe}; string vai para campo separado
        cresc = tl.get("crescimento")
        if isinstance(cresc, str) and cresc.strip():
            # Worker escreveu como texto livre — preserva, renderer ENTENDE string agora
            # mas zerar para não quebrar templates legados que usem .forEach
            # (renderer atual já lida com string; deixar como está é OK)
            pass
        elif cresc is None:
            # nada a fazer — renderer pula campo ausente
            pass
        # periodos[].pontos → array
        pers = tl.get("periodos")
        if isinstance(pers, list):
            for i, per in enumerate(pers):
                if not isinstance(per, dict):
                    continue
                if "pontos" in per and not isinstance(per["pontos"], list):
                    per["pontos"] = _to_array(per["pontos"])
                    changes.append(f"timeline.periodos[{i}].pontos → array")

    # ---- tese ----
    tese = d.get("tese")
    if isinstance(tese, dict):
        for f in ("paraQuem", "naoParaQuem"):
            if f in tese and not isinstance(tese[f], list):
                tese[f] = _to_array(tese[f])
                changes.append(f"tese.{f} → array")

    # ---- encaixe ----
    enc = d.get("encaixe")
    if isinstance(enc, dict):
        # sobreposicaoPares.pares[].tipoSobreposicao → array
        sp = enc.get("sobreposicaoPares")
        if isinstance(sp, dict):
            pares = sp.get("pares")
            if isinstance(pares, list):
                for i, par in enumerate(pares):
                    if isinstance(par, dict) and "tipoSobreposicao" in par:
                        if not isinstance(par["tipoSobreposicao"], list):
                            par["tipoSobreposicao"] = _to_array(par["tipoSobreposicao"])
                            changes.append(f"encaixe.sobreposicaoPares.pares[{i}].tipoSobreposicao → array")
        # paraQuem.objetivo, paraQuem.perfisExemplo, paraQuemNao.perfilExclusao → arrays
        pq = enc.get("paraQuem")
        if isinstance(pq, dict):
            for f in ("objetivo", "perfisExemplo"):
                if f in pq and not isinstance(pq[f], list):
                    pq[f] = _to_array(pq[f])
                    changes.append(f"encaixe.paraQuem.{f} → array")
        pqn = enc.get("paraQuemNao")
        if isinstance(pqn, dict):
            if "perfilExclusao" in pqn and not isinstance(pqn["perfilExclusao"], list):
                pqn["perfilExclusao"] = _to_array(pqn["perfilExclusao"])
                changes.append("encaixe.paraQuemNao.perfilExclusao → array")
        # estrategias[], cenarios[], riscosOcultos[] devem ser arrays
        for f in ("estrategias", "cenarios", "riscosOcultos"):
            if f in enc and not isinstance(enc[f], list):
                enc[f] = _to_array(enc[f])
                changes.append(f"encaixe.{f} → array")
        # perfilRisco.componentes[] array
        pr = enc.get("perfilRisco")
        if isinstance(pr, dict) and "componentes" in pr and not isinstance(pr["componentes"], list):
            pr["componentes"] = _to_array(pr["componentes"])
            changes.append("encaixe.perfilRisco.componentes → array")

    # ---- conclusão ----
    conc = d.get("conclusao")
    if isinstance(conc, dict):
        for f in ("paragrafos", "pontosFortes", "pontosDeAtencao"):
            if f in conc and not isinstance(conc[f], list):
                conc[f] = _to_array(conc[f])
                changes.append(f"conclusao.{f} → array")

    # ---- HHI fora de [0, 1] (alguns workers dão em escala 0-10000) ----
    if isinstance(p, dict):
        c = p.get("concentracao")
        if isinstance(c, dict):
            hhi = c.get("hhi")
            if isinstance(hhi, (int, float)) and hhi > 1:
                c["hhi"] = round(hhi / 10000, 4)
                changes.append(f"concentracao.hhi normalizado de {hhi} → {c['hhi']}")

    return changes


def validar(d: dict, ticker: str) -> list[str]:
    """
    Validações duras pós-normalização. Retorna lista de avisos (não bloqueia).
    """
    avisos: list[str] = []

    chaves_esperadas = {
        "meta", "seo", "indicadores", "recomendacao", "quickStats",
        "pontosAtencao", "gestora", "taxas", "portfolio", "timeline",
        "tese", "encaixe", "dividendos", "valuation", "conclusao", "footer",
    }
    presentes = set(d.keys())
    faltando = chaves_esperadas - presentes
    if faltando:
        avisos.append(f"chaves top-level faltando: {sorted(faltando)}")

    p = d.get("portfolio")
    if isinstance(p, dict):
        stats = p.get("stats")
        if isinstance(stats, dict):
            aloc = stats.get("alocacaoPL")
            if isinstance(aloc, list) and aloc:
                soma = sum((a.get("pct") or 0) for a in aloc if isinstance(a, dict))
                if abs(soma - 1.0) > 0.005:
                    avisos.append(f"alocacaoPL soma = {soma:.4f} (esperado 1.0 ± 0.005)")

    enc = d.get("encaixe")
    if isinstance(enc, dict):
        pr = enc.get("perfilRisco")
        if isinstance(pr, dict):
            comps = pr.get("componentes")
            if isinstance(comps, list) and comps:
                soma = sum((c.get("peso") or 0) for c in comps if isinstance(c, dict))
                if abs(soma - 1.0) > 0.005:
                    avisos.append(f"perfilRisco.componentes pesos soma = {soma:.4f}")

    v = d.get("valuation")
    if isinstance(v, dict):
        pj = v.get("precoJustoMercado")
        if isinstance(pj, dict):
            comps = pj.get("componentes")
            if isinstance(comps, list) and comps:
                soma = sum((c.get("peso") or 0) for c in comps if isinstance(c, dict))
                if abs(soma - 1.0) > 0.005:
                    avisos.append(f"precoJustoMercado.componentes pesos soma = {soma:.4f}")

    return avisos


def processar_ticker(ticker: str, write: bool) -> tuple[int, int]:
    path = DATA_FIIS / f"{ticker.lower()}.json"
    if not path.exists():
        print(f"  [{ticker}] JSON não existe — pulando")
        return 0, 0
    d = json.loads(path.read_text(encoding="utf-8"))
    changes = normalizar(d, ticker)
    avisos = validar(d, ticker)

    if changes:
        print(f"  [{ticker}] {len(changes)} normalizações:")
        for c in changes:
            print(f"      ↳ {c}")
    if avisos:
        for a in avisos:
            print(f"  [{ticker}] ⚠ {a}")
    if write and changes:
        path.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  [{ticker}] ✓ salvo")
    return len(changes), len(avisos)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--ticker", help="Único ticker (ex: JSRE11)")
    g.add_argument("--tickers", help="Lista CSV (JSRE11,VRTA11,...)")
    g.add_argument("--todos", action="store_true", help="Todos os JSONs em data/fiis/")
    ap.add_argument("--write", action="store_true", help="Aplica mudanças (default: dry-run)")
    ap.add_argument("--dry-run", action="store_true", help="Apenas reporta (default)")
    args = ap.parse_args()

    if args.ticker:
        tickers = [args.ticker.upper()]
    elif args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    else:
        tickers = sorted(p.stem.upper() for p in DATA_FIIS.glob("*.json"))

    write = args.write and not args.dry_run
    if not write:
        print("[normalizar_json] DRY-RUN — use --write para aplicar")

    total_changes = 0
    total_avisos = 0
    for t in tickers:
        c, a = processar_ticker(t, write)
        total_changes += c
        total_avisos += a

    print(f"\n[normalizar_json] {len(tickers)} ticker(s) | {total_changes} mudanças | {total_avisos} avisos")


if __name__ == "__main__":
    main()
