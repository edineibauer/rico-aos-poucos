# Calculadoras Rico aos Poucos - Referência Interna

Este arquivo contém as fórmulas e lógica das calculadoras do site para uso interno do agente.

## 1. Calculadora de Aposentadoria / FIRE

### Fórmulas Principais

**Patrimônio necessário (Regra dos 4%):**
```
Patrimônio = Renda mensal desejada × 300
Patrimônio = Gasto anual × 25
```

**Exemplos:**
- R$ 3.000/mês → R$ 900.000
- R$ 5.000/mês → R$ 1.500.000
- R$ 10.000/mês → R$ 3.000.000
- R$ 20.000/mês → R$ 6.000.000

**Aporte mensal necessário (Valor Futuro):**
```
PMT = VF × i / [(1+i)^n - 1]

Onde:
- PMT = Aporte mensal
- VF = Valor futuro desejado (patrimônio)
- i = Taxa mensal (taxa anual / 12)
- n = Número de meses
```

**Tempo para atingir meta:**
```
n = log(1 + VF × i / PMT) / log(1 + i)
```

**Valor futuro com aportes:**
```
VF = VP × (1+i)^n + PMT × [(1+i)^n - 1] / i

Onde:
- VP = Valor presente (quanto já tem)
- PMT = Aporte mensal
- i = Taxa mensal
- n = Número de meses
```

**Regra do 72 (dobrar patrimônio):**
```
Anos para dobrar = 72 / taxa anual
```
- Taxa 6% → 12 anos
- Taxa 8% → 9 anos
- Taxa 10% → 7,2 anos
- Taxa 12% → 6 anos

### Taxas de Referência (Rentabilidade Real - acima da inflação)
- Conservador: 4-5% a.a. (Renda fixa, Tesouro IPCA+)
- Moderado: 6-8% a.a. (Mix RF + RV)
- Arrojado: 10-12% a.a. (Predominância RV)

### Tabela Rápida: Aporte Mensal para R$ 1 milhão

| Prazo | Taxa 6% a.a. | Taxa 8% a.a. | Taxa 10% a.a. |
|-------|-------------|-------------|--------------|
| 10 anos | R$ 6.102 | R$ 5.466 | R$ 4.882 |
| 15 anos | R$ 3.439 | R$ 2.890 | R$ 2.413 |
| 20 anos | R$ 2.164 | R$ 1.698 | R$ 1.317 |
| 25 anos | R$ 1.443 | R$ 1.052 | R$ 754 |
| 30 anos | R$ 996 | R$ 671 | R$ 442 |

---

## 2. Calculadora de Construção

### Custo por m² (2026)

**Por padrão de acabamento:**
- Econômico: R$ 1.500 - R$ 2.000/m²
- Médio: R$ 2.000 - R$ 2.800/m²
- Alto: R$ 2.800 - R$ 3.500/m²
- Luxo: R$ 3.500 - R$ 5.000+/m²

**Por método construtivo:**
- Alvenaria convencional: Referência base
- EPS (Isopor + concreto): -5% a -10% vs alvenaria
- Steel Frame: +10% a +20% vs alvenaria
- Wood Frame: Similar ao Steel Frame
- Container: -20% a -30% (depende do projeto)

**Tempo de obra:**
- Alvenaria: 10-14 meses
- EPS: 6-8 meses
- Steel/Wood Frame: 4-6 meses

### Cálculo Total

```
Custo total = Área × Custo/m² × Fator regional × Fator método

Itens NÃO inclusos (adicionar separado):
- Terreno
- Projetos arquitetônicos: 3-5% do custo da obra
- Taxas prefeitura: 1-3%
- Piscina: R$ 30.000 - R$ 100.000
- Muro/cerca: R$ 200 - R$ 400/m linear
- Paisagismo: variável
```

### Fator Regional (CUB por estado)
- SP, RJ, SC: +15% a +25%
- Sul/Sudeste (outros): +5% a +10%
- Centro-Oeste: Referência base
- Nordeste: -5% a -10%
- Norte: -10% a -15%

### Exemplos Práticos

**Casa 100m² padrão médio em SP:**
```
100m² × R$ 2.400 × 1.20 (SP) = R$ 288.000
+ Projetos (4%): R$ 11.520
+ Taxas (2%): R$ 5.760
= Total estimado: R$ 305.280
```

**Casa 150m² padrão alto em SC:**
```
150m² × R$ 3.200 × 1.15 (SC) = R$ 552.000
+ Projetos (4%): R$ 22.080
+ Taxas (2%): R$ 11.040
= Total estimado: R$ 585.120
```

---

## 3. Simulador de Carteira / Setores

### Retornos Históricos Médios (Últimos 20 anos - rentabilidade real)

| Ativo | Retorno médio a.a. | Volatilidade | Característica |
|-------|-------------------|--------------|----------------|
| CDI | 4-5% | Muito baixa | Segurança |
| IPCA+ | 5-6% | Baixa | Proteção inflação |
| IBOV | 6-8% | Alta | Crescimento Brasil |
| FIIs | 8-10% | Média | Renda + valorização |
| S&P500 (em R$) | 12-15% | Alta | Exposição global |
| Dólar | 3-5% | Alta | Hedge |
| Ouro | 5-7% | Alta | Proteção crises |
| Bitcoin | 50%+ | Extrema | Especulativo |

### Perfis de Risco

**Conservador (pouco capital ou idade avançada):**
- Renda Fixa: 60-70%
- FIIs: 15-20%
- Ações: 10-15%
- Dólar/Ouro: 5-10%

**Moderado (capital médio, horizonte longo):**
- Renda Fixa: 30-40%
- FIIs: 20-25%
- Ações Brasil: 15-20%
- Ações EUA: 10-15%
- Dólar/Ouro: 10%

**Arrojado (pouco capital, muito tempo):**
- Renda Fixa: 10-20%
- FIIs: 15-20%
- Ações Brasil: 25-30%
- Ações EUA: 20-25%
- Cripto: 5-10%
- Dólar: 5%

---

## 4. Regras de Perfil (IMPORTANTE)

### Lógica de Recomendação

**POUCO CAPITAL (< R$ 50.000) → Perfil ARROJADO**
- Razão: Precisa de crescimento acelerado
- Pode assumir mais risco pois tem tempo para recuperar
- Foco em ativos de maior potencial de retorno
- Aceita volatilidade em troca de crescimento

**CAPITAL MÉDIO (R$ 50.000 - R$ 500.000) → Perfil MODERADO**
- Razão: Equilíbrio entre crescimento e proteção
- Diversificação entre classes
- Risco controlado

**MUITO CAPITAL (> R$ 500.000) → Perfil CONSERVADOR**
- Razão: Prioridade é PRESERVAR o patrimônio
- Foco em renda passiva e proteção
- Evita ativos muito voláteis
- Prefere consistência a grandes ganhos

### Ajustes por Idade

- 20-35 anos: +10% em renda variável
- 35-50 anos: Perfil padrão
- 50-65 anos: +10% em renda fixa
- 65+ anos: +20% em renda fixa, foco em renda

---

## 5. Fórmulas Úteis

**Rentabilidade real:**
```
Taxa real = [(1 + taxa nominal) / (1 + inflação)] - 1
Simplificado: Taxa real ≈ Taxa nominal - Inflação
```

**Dividend Yield:**
```
DY = (Dividendos anuais / Preço da cota) × 100
DY mensal × 12 ≈ DY anual
```

**P/VP (Preço sobre Valor Patrimonial):**
```
P/VP = Preço da cota / Valor patrimonial por cota
P/VP < 1 = "barato" (abaixo do patrimônio)
P/VP > 1 = "caro" (acima do patrimônio)
```

**Renda passiva de FIIs:**
```
Renda mensal = Capital investido × DY mensal
Ex: R$ 100.000 × 1% = R$ 1.000/mês
```

---

## Notas de Uso

1. **Sempre consultar o site** para dados atualizados de carteiras recomendadas
2. **Não é recomendação de investimento** - fins educacionais
3. **Taxas são aproximadas** - usar como referência
4. **Ajustar para cenário atual** - verificar SELIC, inflação, momento de mercado
