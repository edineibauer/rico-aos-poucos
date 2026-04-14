"""Aplicador de patches no JSON de FII.

Recebe um patch (dict) do pipeline (IA ou extrator determinístico) e:
1. Faz backup de data/fiis/<ticker>.json em data/fiis/.backups/
2. Aplica o patch por deep-merge controlado
3. Valida estrutura final
4. Grava. Se validação falhar, salva como <ticker>.invalid.json e alerta.

Formato de patch aceito:
    {
      "indicadores": { "dividendoMensal": 0.42 },              # substitui
      "pontosAtencao.add": [ {...novo ponto...} ],             # appenda em lista
      "timeline.periodos[2026].pontos.add": [ "..." ]          # append em sublista
    }
"""
from __future__ import annotations

import copy
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from paths import BACKUP_DIR, FIIS_DIR
from validate import paths_protegidos_tocados, validar


class PatchError(Exception):
    pass


def _carregar(ticker: str) -> dict:
    p = FIIS_DIR / f"{ticker.lower()}.json"
    if not p.exists():
        raise PatchError(f"JSON não existe para {ticker}: {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def _backup(ticker: str, conteudo_original: dict) -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dst = BACKUP_DIR / f"{ticker.lower()}-{stamp}.json"
    dst.write_text(json.dumps(conteudo_original, indent=2, ensure_ascii=False))
    return dst


def _coletar_paths(patch: dict, prefixo: str = "") -> list[str]:
    """Caminhos que o patch vai tocar — pra checar allowlist."""
    paths: list[str] = []
    for k, v in patch.items():
        key_limpa = k.replace(".add", "")
        full = f"{prefixo}.{key_limpa}" if prefixo else key_limpa
        if isinstance(v, dict):
            paths.append(full)
            paths.extend(_coletar_paths(v, full))
        else:
            paths.append(full)
    return paths


def _navegar_por_path(obj: Any, path: str) -> Any:
    """Suporta 'timeline.periodos[2026].pontos' — índice pode ser int ou chave."""
    for token in re.split(r"\.", path):
        m = re.match(r"(.+)\[(.+)\]$", token)
        if m:
            key, idx = m.group(1), m.group(2)
            obj = obj[key]
            # lista: índice numérico; dict: chave string (ex. ano)
            if isinstance(obj, list):
                obj = obj[int(idx)]
            else:
                # tenta achar item da lista cujo campo "periodo" ou "ano" == idx
                if isinstance(obj, list):
                    for item in obj:
                        if isinstance(item, dict) and (
                            item.get("periodo") == idx or item.get("ano") == idx
                        ):
                            obj = item
                            break
                else:
                    obj = obj.get(idx)
        else:
            if isinstance(obj, dict):
                obj = obj[token]
            else:
                raise PatchError(f"path inválido em {path!r}")
    return obj


def _aplicar_merge(target: dict, patch: dict) -> None:
    """Deep-merge in-place. Sufixo '.add' em chave → append em lista no path."""
    for k, v in patch.items():
        if k.endswith(".add"):
            path = k[:-4]
            # navega até a lista destino
            parent_path, _, leaf = path.rpartition(".")
            parent = _navegar_por_path(target, parent_path) if parent_path else target
            if isinstance(parent, dict) and parent.get(leaf) is None:
                parent[leaf] = []
            lista = parent.get(leaf) if isinstance(parent, dict) else None
            if not isinstance(lista, list):
                raise PatchError(f"esperava lista em {path!r}")
            if not isinstance(v, list):
                v = [v]
            lista.extend(v)
        elif isinstance(v, dict) and isinstance(target.get(k), dict):
            _aplicar_merge(target[k], v)
        else:
            target[k] = v


def aplicar_patch(ticker: str, patch: dict) -> dict:
    """Aplica patch no JSON do FII. Retorna relatório.

    Levanta PatchError se inválido ou se tocar paths protegidos.
    """
    ticker = ticker.upper()
    paths = _coletar_paths(patch)
    violados = paths_protegidos_tocados(paths)
    if violados:
        raise PatchError(f"patch tenta tocar paths protegidos: {violados}")

    original = _carregar(ticker)
    novo = copy.deepcopy(original)
    _aplicar_merge(novo, patch)

    erros = validar(novo)
    if erros:
        invalid_path = FIIS_DIR / f"{ticker.lower()}.invalid.json"
        invalid_path.write_text(json.dumps(novo, indent=2, ensure_ascii=False))
        raise PatchError(f"patch produziu JSON inválido: {erros}. Salvo em {invalid_path}")

    backup_path = _backup(ticker, original)
    dst = FIIS_DIR / f"{ticker.lower()}.json"
    dst.write_text(json.dumps(novo, indent=2, ensure_ascii=False))

    return {
        "ticker": ticker,
        "backup": str(backup_path.relative_to(FIIS_DIR.parent.parent)),
        "paths_alterados": paths,
        "ok": True,
    }
