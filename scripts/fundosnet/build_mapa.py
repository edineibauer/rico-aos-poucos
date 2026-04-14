"""Cruza pregão / descricaoFundo do Fundos.NET com universo local → mapa.

Estratégia (após spike mostrar que cnpjFundo vem sempre None):
    1. Normaliza nome: remove stopwords ("FUNDO DE INVESTIMENTO IMOBILIÁRIO",
       "RESPONSABILIDADE LIMITADA", artigos, etc.), ascii-fold, upper.
    2. Extrai "tokens significativos" — palavras que carregam o nome comercial.
    3. Casa local×remoto exigindo interseção de >= 2 tokens significativos
       (ou 1 token único em ambos os lados).
    4. Ambiguidades (>1 candidato) ficam como órfãos com anotação.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from datetime import date, timedelta

from client import TIPO_FII, buscar_publicacoes
from paths import MAPA, ORFAOS, UNIVERSO

JANELA_DIAS = 21  # 3 semanas → cobre Informes Mensais + Rendimentos

# Progresso: imprime a cada N docs coletados
PROGRESS_EVERY = 500

# Palavras de baixo valor no match de nomes de FII.
# Lista ampla — todas essas aparecem em dezenas/centenas de FIIs e NÃO
# identificam um fundo específico, então não devem contar como "token forte".
STOPWORDS = {
    # Artigos e preposições
    "DE", "DO", "DA", "DOS", "DAS", "E", "A", "O", "OS", "AS",
    "EM", "NO", "NA", "NOS", "NAS", "PARA", "POR", "COM", "SEM", "AO", "AOS",
    # Palavras estruturais do nome jurídico
    "FUNDO", "FUNDOS", "INVESTIMENTO", "INVESTIMENTOS",
    "IMOBILIARIO", "IMOBILIARIA", "IMOBILIARIOS", "IMOBILIARIAS",
    "FII", "FIAGRO", "RESPONSABILIDADE", "LIMITADA", "LTDA",
    "COTAS", "COTA", "FINANCEIRO", "FINANCEIROS",
    "CLASSE", "SUBCLASSE", "UNICA", "PRINCIPAL",
    "PARTICIPACOES", "PARTICIPACAO",
    # Segmentos genéricos (muito repetidos — não identificam)
    "REAL", "ESTATE", "ESTATES",
    "RENDA", "RENDAS", "RENDIMENTO",
    "RECEBIVEIS", "RECEBIVEL", "CREDITO", "CREDITOS",
    "LOGISTICA", "LOGISTICO", "LOGISTICOS", "GALPOES", "GALPAO",
    "SHOPPING", "SHOPPINGS", "VAREJO",
    "CORPORATIVO", "CORPORATIVA", "CORPORATIVOS", "CORPORATIVAS",
    "LAJES", "LAJE", "OFFICE", "OFFICES", "EDIFICIOS", "EDIFICIO", "TORRE", "TORRES",
    "MULTIESTRATEGIA", "MULTIESTRATEGICO", "MULTIMERCADO",
    "DESENVOLVIMENTO", "DESENVOLVIMENTOS",
    "HIBRIDO", "HIBRIDOS",
    "AGRO", "AGRICOLA", "AGRONEGOCIO", "AGROPECUARIO", "AGROPECUARIA",
    "HOTEL", "HOTELARIA", "HOTELEIRO",
    "EDUCACIONAL", "HOSPITAL", "HOSPITALAR", "RESIDENCIAL",
    "INFRA", "INFRAESTRUTURA",
    # Tipologia / estrutura de captação
    "FOF", "FOFS", "EQUITY", "DEBT", "YIELD", "HIGH",
    "CONSOLIDADO", "MASTER", "FEEDER", "ESPELHO",
    # Palavras genéricas recorrentes
    "BRASIL", "BRASILEIRO", "BRASILEIRA",
    "CAPITAL", "CAPITAIS", "GESTORA", "GESTAO", "RECURSOS", "ASSET", "ASSETS",
    "PLUS", "PREMIUM", "PRIMEIRO", "PRIMEIRA", "SEGUNDO", "SEGUNDA",
    "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    # Curtas sem valor discriminatório
    "LA", "DU", "EL", "SAO", "SANTA", "SANTO",
}


def _ascii_upper(s: str) -> str:
    s = s or ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return s.upper()


def _tokens(nome: str) -> set[str]:
    """Tokens significativos de um nome de fundo."""
    limpo = _ascii_upper(nome)
    # remove pontuação e separadores
    limpo = re.sub(r"[^A-Z0-9 ]+", " ", limpo)
    palavras = [p for p in limpo.split() if p and p not in STOPWORDS and len(p) >= 2]
    return set(palavras)


def main() -> None:
    universo = json.loads(UNIVERSO.read_text(encoding="utf-8"))
    fundos_locais = universo["fundos"]

    # Índice: tokens significativos de cada fundo local.
    tokens_por_ticker: dict[str, set[str]] = {}
    for f in fundos_locais:
        tk = _tokens(f.get("nome") or f["ticker"])
        # adiciona o radical do ticker (BLMG11 → BLMG)
        tk.add(re.sub(r"\d+$", "", f["ticker"].upper()))
        tokens_por_ticker[f["ticker"].upper()] = tk

    # Coleta de pregões
    hoje = date.today()
    di = (hoje - timedelta(days=JANELA_DIAS)).strftime("%d/%m/%Y")
    df = hoje.strftime("%d/%m/%Y")
    print(f"[mapa] coletando publicações de {di} até {df}…")

    pregoes: dict[str, dict] = defaultdict(lambda: {"nomes": set(), "docs": 0})
    vistos = 0
    import sys
    for doc in buscar_publicacoes(di, df, tipo_fundo=TIPO_FII):
        vistos += 1
        pregao = (doc.get("nomePregao") or "").strip()
        nome = (doc.get("descricaoFundo") or "").strip()
        if pregao:
            pregoes[pregao]["nomes"].add(nome)
            pregoes[pregao]["docs"] += 1
        if vistos % PROGRESS_EVERY == 0:
            print(f"  [progresso] {vistos} docs, {len(pregoes)} pregões únicos até agora")
            sys.stdout.flush()
    print(f"[mapa] total: {vistos} docs, {len(pregoes)} pregões únicos")

    mapa: dict[str, dict] = {}
    orfaos: list[dict] = []
    ambiguos: list[dict] = []

    # Mapeamento radical-do-pregão → ticker, baseado em radical do ticker
    radicais_locais = {
        re.sub(r"\d+$", "", t.upper()): t
        for t in tokens_por_ticker
    }

    for pregao, info in pregoes.items():
        base = {
            "nomePregao": pregao,
            "descricaoFundo": next(iter(info["nomes"]), None),
            "docs": info["docs"],
        }

        # Caminho 1: radical do pregão bate EXATAMENTE com radical de algum ticker.
        # "FII BLMG" → BLMG → BLMG11
        rad_pregao_tokens = _ascii_upper(pregao).replace("FII ", "").replace("FIAGRO ", "").strip().split()
        rad_pregao_colado = "".join(rad_pregao_tokens)  # "BLMG" ou "BLUE LOG" → "BLUELOG"
        match_radical = None
        for candidato_rad in {rad_pregao_colado, *rad_pregao_tokens}:
            if candidato_rad and candidato_rad in radicais_locais:
                match_radical = radicais_locais[candidato_rad]
                break

        if match_radical:
            mapa[pregao] = {**base, "ticker": match_radical,
                            "metodo": "radical", "tokensComuns": [candidato_rad]}
            continue

        # Caminho 2: tokens fortes (pós-stopwords).
        tokens_remoto: set[str] = set()
        for n in info["nomes"]:
            tokens_remoto |= _tokens(n)
        # adiciona radical do pregão (palavras curtas incluídas aqui — sem stopword)
        tokens_remoto |= {t for t in rad_pregao_tokens if len(t) >= 3}

        candidatos: list[tuple[str, int, set[str]]] = []
        for ticker, tk in tokens_por_ticker.items():
            inter = tk & tokens_remoto
            if len(inter) >= 2:
                candidatos.append((ticker, len(inter), inter))

        if not candidatos:
            # Caminho 3 (fallback): 1 token, mas precisa ser raro (aparece em ≤ 2 tickers)
            # E o token precisa ter ≥ 4 chars (evita ruído tipo "II", "SP", "RJ").
            for ticker, tk in tokens_por_ticker.items():
                inter = tk & tokens_remoto
                if len(inter) == 1:
                    tok = next(iter(inter))
                    if len(tok) < 4:
                        continue
                    raridade = sum(1 for tks in tokens_por_ticker.values() if tok in tks)
                    if raridade <= 2:
                        candidatos.append((ticker, 1, inter))

        if not candidatos:
            orfaos.append(base)
            continue

        candidatos.sort(key=lambda c: (-c[1], c[0]))
        melhor = candidatos[0]
        if len(candidatos) > 1 and candidatos[1][1] == melhor[1]:
            ambiguos.append({
                **base,
                "candidatos": [{"ticker": c[0], "tokens_comuns": sorted(c[2])} for c in candidatos[:4]],
            })
            continue

        mapa[pregao] = {
            **base,
            "ticker": melhor[0],
            "metodo": "tokens",
            "tokensComuns": sorted(melhor[2]),
        }

    saida_mapa = {
        "ultimaAtualizacao": hoje.isoformat(),
        "janelaDias": JANELA_DIAS,
        "total": len(mapa),
        "mapa": mapa,
    }
    saida_orfaos = {
        "ultimaAtualizacao": hoje.isoformat(),
        "janelaDias": JANELA_DIAS,
        "totalOrfaos": len(orfaos),
        "totalAmbiguos": len(ambiguos),
        "orfaos": orfaos,
        "ambiguos": ambiguos,
    }

    MAPA.write_text(json.dumps(saida_mapa, indent=2, ensure_ascii=False))
    ORFAOS.write_text(json.dumps(saida_orfaos, indent=2, ensure_ascii=False))

    tickers_locais = {f["ticker"] for f in fundos_locais}
    casados = {m["ticker"] for m in mapa.values()}
    faltam = tickers_locais - casados
    print(f"[ok] {MAPA.name}: {len(mapa)} pregões → {len(casados)} tickers distintos")
    print(f"[ok] {ORFAOS.name}: {len(orfaos)} órfãos + {len(ambiguos)} ambíguos")
    print(f"[mapa] cobertura do universo local: {len(casados)}/{len(tickers_locais)}")
    if faltam:
        print(f"[mapa] tickers sem match nos últimos {JANELA_DIAS}d ({len(faltam)}): {sorted(faltam)[:15]}…")


if __name__ == "__main__":
    main()
