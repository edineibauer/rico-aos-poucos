# Roteiro de Atualização — Rico aos Poucos

Quando o usuário pedir **"atualize o site"**, siga este checklist completo.
Após cada item, faça commit e no final faça deploy (push para master + Cloudflare Pages).

---

## 1. Cenário Atual (Cenários Macroeconômicos)

**Arquivo:** `js/cenarios-macro.js`
**Onde:** Objeto `CENARIO_ATUAL` no topo do arquivo

### O que fazer:
1. Pesquise na web os principais acontecimentos macroeconômicos do momento
2. Atualize o campo `data` para o mês/ano atual
3. Atualize os `itens` (máximo 3-4 itens) com os cenários mais relevantes agora:
   - Cada item tem: `texto` (descrição curta), `categorias` (IDs das categorias relacionadas)
   - Categorias válidas: `crises`, `guerras`, `petroleo`, `comercial`, `juros`, `inflacao`, `bolhas`, `pandemias`, `cambio`, `commodities`
4. Os itens devem refletir o que um investidor brasileiro precisa saber AGORA

### Exemplo de como está:
```js
const CENARIO_ATUAL = {
  data: 'Março 2026',
  itens: [
    { texto: 'Guerra comercial EUA...', categorias: ['comercial'] },
    { texto: 'Selic a 14,25%...', categorias: ['juros'] },
    { texto: 'Petróleo em alta...', categorias: ['petroleo', 'guerras'] }
  ]
};
```

---

## 2. Dados Históricos de Investimentos

**Arquivo:** `data/historico-investimentos.json` e `data/historico-mensal.json`
**Impacto:** Comparador histórico, gráficos, ranking de ativos

### O que fazer:
1. Verificar se os dados incluem o mês/ano mais recente
2. Se não, pesquisar e adicionar os dados faltantes:
   - IBOV, IBOV TR, CDI, Dólar, Ouro, FIIs (IFIX), IMA-B 5+, S&P 500, TLT, Imóveis (FipeZap), Bitcoin, IPCA
3. Fontes: B3, BCB, FipeZap, Yahoo Finance, Tesouro Direto

---

## 3. Alocação de Setores (Página Inicial)

**Arquivo:** `CLAUDE.md` (seção "Alocação Atual") e páginas de setores
**Impacto:** Cards de sentimento na home, páginas de setores

### O que fazer:
1. Verificar se a alocação e sentimentos em CLAUDE.md estão atualizados
2. Se o usuário informou nova alocação, atualizar
3. As páginas de setores (`setores/*/index.html`) podem precisar de atualização de análise

---

## 4. Service Worker

**Arquivo:** `sw.js`
**Impacto:** Cache do PWA

### O que fazer:
1. Incrementar o `APP_VERSION` para forçar atualização do cache nos dispositivos dos usuários

---

## 5. Deploy

### Passos finais:
1. Commit todas as mudanças com mensagem descritiva
2. Push para `master`
3. Deploy no Cloudflare Pages:
```bash
mkdir -p /tmp/rico-deploy && rm -rf /tmp/rico-deploy/*
git archive master | tar -x -C /tmp/rico-deploy/
wrangler pages deploy /tmp/rico-deploy --project-name rico-aos-poucos --branch master --commit-dirty=true
rm -rf /tmp/rico-deploy
```

---

## Notas
- Sempre pesquisar na web antes de atualizar dados econômicos
- Manter textos em pt-BR
- Atualizar sitemap.xml se novas páginas forem criadas
- Testar no site após deploy
