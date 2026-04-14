"""Validador leve do schema do JSON de FII.

O template (js/fii-template.js) consome um JSON com as seções abaixo.
Esta validação é defensiva: grava `<ticker>.invalid.json` e alerta
quando o patch produzir algo que quebraria a página.

Não valida semântica (valores de campos), só estrutura essencial.
"""
from __future__ import annotations

# Seções obrigatórias no topo do JSON.
SECOES_OBRIGATORIAS = ["meta", "seo", "indicadores", "recomendacao"]

# Campos obrigatórios dentro de meta.
META_OBRIGATORIOS = ["ticker", "nome", "segmento"]

# Paths que a IA NUNCA pode reescrever (allowlist inversa).
PROTEGIDOS = {
    "meta.ticker",
    "meta.nome",
    "seo.title",
    "seo.description",
    "seo.canonical",
}


def validar(data: dict) -> list[str]:
    """Retorna lista de erros. Vazia = válido."""
    erros: list[str] = []

    if not isinstance(data, dict):
        return ["root não é objeto"]

    for sec in SECOES_OBRIGATORIAS:
        if sec not in data:
            erros.append(f"seção obrigatória ausente: {sec}")

    meta = data.get("meta", {})
    if isinstance(meta, dict):
        for campo in META_OBRIGATORIOS:
            if not meta.get(campo):
                erros.append(f"meta.{campo} ausente ou vazio")
    else:
        erros.append("meta não é objeto")

    return erros


def paths_protegidos_tocados(patch_paths: list[str]) -> list[str]:
    """Retorna subset dos paths que NÃO podem ser tocados pela IA."""
    violados = []
    for p in patch_paths:
        for prot in PROTEGIDOS:
            if p == prot or p.startswith(prot + "."):
                violados.append(p)
                break
    return violados


def eh_valido(data: dict) -> bool:
    return not validar(data)
