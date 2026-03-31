/**
 * Cenários Macroeconômicos - Rico aos Poucos
 * Ferramenta educacional com padrões históricos e análise de impacto por classe de ativo
 */
(function () {
  'use strict';

  // ─── DATA ────────────────────────────────────────────────────────────────────

  const CENARIO_ATUAL = {
    titulo: 'CENÁRIO ATUAL',
    periodo: 'Março 2026',
    itens: [
      { texto: 'Guerra comercial EUA (tarifas): afeta S&P 500, dólar, commodities', categorias: ['protecionismo'] },
      { texto: 'Selic alta no Brasil (14,25%): CDI rendendo ~1%/mês, FIIs pressionados', categorias: ['juros'] },
      { texto: 'Petróleo em alta por conflitos no Oriente Médio', categorias: ['petroleo'] }
    ]
  };

  const CATEGORIAS = [
    {
      id: 'crises',
      nome: 'Crises Financeiras',
      icone: '💥',
      cor: '#f85149',
      sobe: ['Ouro', 'Dólar', 'CDI', 'TLT'],
      desce: ['IBOV', 'S&P 500', 'FIIs', 'Imóveis', 'Bitcoin'],
      detalhes: 'Renda fixa brasileira (CDI) é porto seguro local. Ouro e dólar são os grandes vencedores. Ações podem cair 40-60%.',
      conclusao: 'Mantenha reserva de emergência robusta em CDI e diversifique com ouro e dólar. Quem tem caixa na crise compra ativos baratos e multiplica patrimônio na retomada.',
      eventos: [
        {
          nome: 'Bolha das .com',
          periodo: '2000–2002',
          descricao: 'O estouro da bolha da internet destruiu US$ 5 trilhões em valor de mercado. Empresas sem receita e com valuations absurdos colapsaram. O Nasdaq caiu 78% do pico ao fundo.',
          dados: [
            { ativo: 'S&P 500', variacao: '-49%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+12%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: '+55% (vs BRL)', cor: 'bullish' },
            { ativo: 'CDI', variacao: '+53% acum.', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Subprime / Lehman Brothers',
          periodo: '2008–2009',
          descricao: 'O colapso do mercado imobiliário americano e a falência do Lehman Brothers desencadearam a pior crise financeira desde 1929. O sistema bancário global quase parou.',
          dados: [
            { ativo: 'S&P 500', variacao: '-57%', cor: 'bearish' },
            { ativo: 'IBOV', variacao: '-60%', cor: 'bearish' },
            { ativo: 'Imóveis', variacao: '-33% (EUA)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+25%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: '+48% (vs BRL)', cor: 'bullish' },
            { ativo: 'TLT', variacao: '+20%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Brasil – Era Dilma',
          periodo: '2014–2016',
          descricao: 'Combinação de crise política (impeachment), recessão severa (PIB caiu 7,2% acumulado), escândalos de corrupção (Lava Jato) e descontrole fiscal. Brasil perdeu grau de investimento.',
          dados: [
            { ativo: 'IBOV', variacao: '-40%', cor: 'bearish' },
            { ativo: 'Dólar', variacao: '+98% (vs BRL)', cor: 'bullish' },
            { ativo: 'FIIs', variacao: '-15% (IFIX)', cor: 'bearish' },
            { ativo: 'CDI', variacao: '+38% acum.', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+130% (BRL)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crash da COVID-19',
          periodo: 'Março 2020',
          descricao: 'O mercado global entrou em bear market mais rápido da história (23 dias). Circuit breakers dispararam 6 vezes na B3. A recuperação, porém, foi igualmente histórica graças a estímulos trilionários.',
          dados: [
            { ativo: 'IBOV', variacao: '-47%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-34%', cor: 'bearish' },
            { ativo: 'Dólar', variacao: '+36% (vs BRL)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+27%', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: '-53%', cor: 'bearish' },
            { ativo: 'FIIs', variacao: '-35% (IFIX)', cor: 'bearish' }
          ]
        },
        {
          nome: 'Bolha de IA?',
          periodo: '2024–?',
          descricao: 'As "Mag 7" concentram mais de US$ 17 trilhões em valor de mercado. P/E da Nvidia acima de 60x. Investimento massivo em infraestrutura de IA sem retorno proporcional comprovado. Paralelos com a bolha .com são crescentes.',
          dados: [
            { ativo: 'S&P 500', variacao: 'Mag 7 = ~33% do índice', cor: 'neutro' },
            { ativo: 'IBOV', variacao: 'Descolado do rali de IA', cor: 'neutro' },
            { ativo: 'Ouro', variacao: 'Renovando máximas', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'guerras',
      nome: 'Guerras e Conflitos',
      icone: '⚔️',
      cor: '#da3633',
      sobe: ['Ouro', 'Dólar', 'TLT'],
      desce: ['IBOV', 'S&P 500', 'Bitcoin'],
      detalhes: 'Petrobras e petroleiras tendem a subir isoladamente. Companhias aéreas sofrem. Ouro é o hedge clássico de guerra.',
      conclusao: 'Historicamente, mercados se recuperam rápido de conflitos localizados. Mantenha ouro e dólar como proteção e evite pânico em vendas.',
      eventos: [
        {
          nome: 'Guerra do Golfo',
          periodo: '1990–1991',
          descricao: 'A invasão do Kuwait pelo Iraque fez o petróleo dobrar de preço em meses. O S&P 500 caiu 20% mas se recuperou totalmente em 6 meses após a vitória da coalizão.',
          dados: [
            { ativo: 'S&P 500', variacao: '-20%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+12%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: 'Fortalecido', cor: 'bullish' }
          ]
        },
        {
          nome: '11 de Setembro',
          periodo: '2001',
          descricao: 'Os ataques terroristas fecharam a NYSE por 4 dias. Na reabertura, o Dow Jones caiu 14% em uma semana. Porém, em 2 meses os mercados já haviam recuperado as perdas.',
          dados: [
            { ativo: 'S&P 500', variacao: '-14% (1 semana)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+8%', cor: 'bullish' },
            { ativo: 'TLT', variacao: 'Alta (flight to safety)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Invasão do Iraque',
          periodo: '2003',
          descricao: 'Antes da invasão, mercados caíram por incerteza. Quando a guerra começou de fato, os mercados subiram ("buy the invasion"). O S&P 500 iniciou um bull market de 5 anos.',
          dados: [
            { ativo: 'S&P 500', variacao: '+30% (12 meses)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+20%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: '-15% (DXY)', cor: 'bearish' }
          ]
        },
        {
          nome: 'Rússia invade Ucrânia',
          periodo: '2022',
          descricao: 'A invasão em fevereiro de 2022 causou o maior choque energético europeu em décadas. Gás natural disparou 400%, trigo subiu 50%. Europa entrou em crise energética severa.',
          dados: [
            { ativo: 'S&P 500', variacao: '-19% (2022)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+7%', cor: 'bullish' },
            { ativo: 'IBOV', variacao: '+5% (beneficiado por commodities)', cor: 'bullish' },
            { ativo: 'Dólar', variacao: 'Forte globalmente', cor: 'bullish' }
          ]
        },
        {
          nome: 'Tensões Oriente Médio',
          periodo: '2023–2026',
          descricao: 'Guerra Israel-Hamas e escalada com Irã. Ataques Houthi no Mar Vermelho afetaram 12% do comércio marítimo mundial, encarecendo fretes e seguro de cargas. Petróleo em alta.',
          dados: [
            { ativo: 'Ouro', variacao: '+28%', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Impacto limitado', cor: 'neutro' },
            { ativo: 'TLT', variacao: 'Volátil', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'petroleo',
      nome: 'Choque de Petróleo',
      icone: '🛢️',
      cor: '#b87333',
      sobe: ['Ouro', 'Dólar', 'CDI', 'IMA-B 5+'],
      desce: ['IBOV', 'S&P 500', 'FIIs', 'Imóveis'],
      detalhes: 'Inflação sobe, forçando alta de juros. Petrobras sobe, mas a bolsa em geral cai. FIIs sofrem com juros altos. Imóveis esfriam.',
      conclusao: 'Proteja-se com renda fixa atrelada à inflação (IMA-B 5+) e ouro. Petrobras é proteção parcial, mas a bolsa como um todo sofre com a inflação de custos.',
      eventos: [
        {
          nome: 'Crise do Petróleo (Embargo OPEP)',
          periodo: '1973',
          descricao: 'Embargo árabe aos EUA e aliados de Israel quadruplicou o preço do petróleo de US$ 3 para US$ 12/barril. Causou recessão global, filas em postos de gasolina e o fim da era do petróleo barato.',
          dados: [
            { ativo: 'S&P 500', variacao: '-48%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+72%', cor: 'bullish' },
            { ativo: 'IMA-B 5+', variacao: 'N/A (índice não existia)', cor: 'neutro' }
          ]
        },
        {
          nome: '2o Choque do Petróleo (Revolução Iraniana)',
          periodo: '1979–1980',
          descricao: 'A revolução no Irã e a guerra Irã-Iraque reduziram a oferta global. Petróleo saltou de US$ 14 para US$ 40. A inflação americana chegou a 14%, levando ao "Volcker Shock".',
          dados: [
            { ativo: 'Ouro', variacao: '+120%', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Volátil, lateralizado', cor: 'bearish' },
            { ativo: 'CDI', variacao: 'Juros globais dispararam', cor: 'bullish' }
          ]
        },
        {
          nome: 'Petróleo a US$ 147',
          periodo: '2008',
          descricao: 'Combinação de demanda chinesa crescente, especulação e tensões geopolíticas levaram o petróleo ao recorde histórico de US$ 147/barril em julho de 2008, colapsando para US$ 32 em dezembro.',
          dados: [
            { ativo: 'IBOV', variacao: '-60%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-57%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+25%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: '+48% (vs BRL)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Petróleo Negativo',
          periodo: 'Abril 2020',
          descricao: 'Pela primeira vez na história, o preço do petróleo WTI ficou negativo (-US$ 37). A pandemia destruiu a demanda e não havia onde armazenar.',
          dados: [
            { ativo: 'IBOV', variacao: '-47% (no período)', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-34% (no período)', cor: 'bearish' },
            { ativo: 'FIIs', variacao: '-35% (IFIX)', cor: 'bearish' },
            { ativo: 'CDI', variacao: 'Selic cortada para 2%', cor: 'neutro' }
          ]
        },
        {
          nome: 'Choque Energético pós-Ucrânia',
          periodo: '2022',
          descricao: 'A guerra e as sanções à Rússia causaram o maior choque energético europeu desde os anos 1970. Gás natural na Europa subiu 400%, petróleo bateu US$ 130.',
          dados: [
            { ativo: 'Ouro', variacao: '+7%', cor: 'bullish' },
            { ativo: 'Dólar', variacao: 'Forte (DXY +16%)', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: '-19% (2022)', cor: 'bearish' },
            { ativo: 'IMA-B 5+', variacao: 'Pressionado por juros', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'protecionismo',
      nome: 'Guerras Comerciais',
      icone: '🏗️',
      cor: '#da8b45',
      sobe: ['Ouro', 'CDI', 'IMA-B 5+'],
      desce: ['IBOV', 'S&P 500'],
      detalhes: 'Incerteza favorece renda fixa. Exportadoras brasileiras podem ser beneficiadas se não forem alvo. Dólar volátil.',
      conclusao: 'Aumente posição em renda fixa (CDI e IPCA+) e ouro. Tarifas funcionam como imposto sobre o consumidor e destroem valor no curto prazo para todos.',
      eventos: [
        {
          nome: 'Smoot-Hawley Tariff Act',
          periodo: '1930',
          descricao: 'Os EUA impuseram tarifas de até 60% sobre 20.000 produtos importados. Retaliações de 25 países causaram colapso de 65% no comércio mundial, aprofundando a Grande Depressão.',
          dados: [
            { ativo: 'S&P 500', variacao: '-86% (1929-32)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: 'Reserva de valor', cor: 'bullish' },
            { ativo: 'IBOV', variacao: 'N/A (não existia)', cor: 'neutro' }
          ]
        },
        {
          nome: 'Plaza Accord',
          periodo: '1985',
          descricao: 'Acordo entre G5 para desvalorizar o dólar contra iene e marco alemão. O dólar perdeu 50% do valor em 2 anos. Resultado: boom exportador americano, mas bolha imobiliária no Japão.',
          dados: [
            { ativo: 'Dólar', variacao: '-50% (DXY em 2 anos)', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '+35% (exportações)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: 'Estável', cor: 'neutro' }
          ]
        },
        {
          nome: 'Guerra Comercial EUA–China',
          periodo: '2018–2019',
          descricao: 'Trump impôs tarifas sobre US$ 360 bilhões em produtos chineses. China retaliou. Cadeias de suprimento começaram a migrar para Vietnã, Índia e México.',
          dados: [
            { ativo: 'S&P 500', variacao: '-20% (dez/2018)', cor: 'bearish' },
            { ativo: 'IBOV', variacao: 'Volátil', cor: 'neutro' },
            { ativo: 'Ouro', variacao: '+18%', cor: 'bullish' },
            { ativo: 'CDI', variacao: 'Estável', cor: 'neutro' }
          ]
        },
        {
          nome: 'Tarifas Trump 2.0',
          periodo: '2025–2026',
          descricao: 'Segunda rodada de protecionismo com tarifas "universais" de 10-60% sobre importações. Tarifas de 60% sobre produtos chineses, 25% sobre aço e alumínio globais. Retaliações da China, UE e outros parceiros.',
          dados: [
            { ativo: 'S&P 500', variacao: 'Pressionado', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+22% (2025)', cor: 'bullish' },
            { ativo: 'CDI', variacao: 'Selic 14,25%', cor: 'bullish' },
            { ativo: 'IBOV', variacao: 'Volátil, nearshoring é oportunidade', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'juros',
      nome: 'Ciclo de Alta de Juros',
      icone: '📈',
      cor: '#58a6ff',
      sobe: ['CDI', 'Dólar'],
      desce: ['IBOV', 'FIIs', 'Imóveis', 'S&P 500', 'TLT', 'Bitcoin'],
      detalhes: 'CDI rende mais, atraindo capital de risco para renda fixa. FIIs perdem atratividade vs CDI. Imóveis esfriam com crédito caro. TLT cai (títulos longos perdem valor com juros subindo).',
      conclusao: 'Aproveite CDI elevado e IPCA+ longos com taxas históricas. É o melhor momento para travar renda fixa. FIIs e ações ficam descontados — oportunidade para quem pensa no longo prazo.',
      eventos: [
        {
          nome: 'Volcker Shock',
          periodo: '1980–1982',
          descricao: 'Paul Volcker, presidente do Fed, elevou os juros americanos para 20% a.a. para matar a inflação de 14%. Causou recessão severa mas quebrou a espiral inflacionária.',
          dados: [
            { ativo: 'S&P 500', variacao: '-27%', cor: 'bearish' },
            { ativo: 'TLT', variacao: 'Yield de 15% a.a.', cor: 'bearish' },
            { ativo: 'Ouro', variacao: 'Volátil', cor: 'neutro' }
          ]
        },
        {
          nome: 'Taper Tantrum',
          periodo: '2013',
          descricao: 'O Fed anunciou que iria reduzir compras de títulos (QE). Apenas o anúncio causou pânico nos mercados emergentes. O dólar disparou e capital fugiu de Brasil, Turquia e Índia.',
          dados: [
            { ativo: 'TLT', variacao: 'Yield de 1,6% → 3%', cor: 'bearish' },
            { ativo: 'IBOV', variacao: '-18%', cor: 'bearish' },
            { ativo: 'Dólar', variacao: '+17% (vs BRL)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '-28%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Ciclo Fed 2022–2023',
          periodo: '2022–2023',
          descricao: 'O ciclo de alta mais rápido em 40 anos: de 0% para 5,5% em 16 meses. Bonds tiveram o pior ano da história. SVB e outros bancos regionais quebraram.',
          dados: [
            { ativo: 'S&P 500', variacao: '-19% (2022)', cor: 'bearish' },
            { ativo: 'TLT', variacao: '-30% (pior ano da história)', cor: 'bearish' },
            { ativo: 'Bitcoin', variacao: '-65%', cor: 'bearish' },
            { ativo: 'Dólar', variacao: '+16% (DXY)', cor: 'bullish' },
            { ativo: 'FIIs', variacao: 'Pressionados', cor: 'bearish' }
          ]
        },
        {
          nome: 'Selic alta no Brasil',
          periodo: '2021–2026',
          descricao: 'O Banco Central brasileiro iniciou um dos ciclos de alta mais longos: Selic de 2% para 14,25%. Inflação, fiscal deteriorado e dólar alto forçaram juros restritivos. CDI virou "rei" do mercado.',
          dados: [
            { ativo: 'CDI', variacao: '+42% acum. (3 anos)', cor: 'bullish' },
            { ativo: 'FIIs', variacao: '-18% (IFIX 2021-22)', cor: 'bearish' },
            { ativo: 'IBOV', variacao: 'Lateralizado', cor: 'neutro' },
            { ativo: 'IMA-B 5+', variacao: 'IPCA+7,5% (oportunidade)', cor: 'bullish' },
            { ativo: 'Dólar', variacao: '+35% (vs BRL)', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: 'Financiamento caro, vendas caem', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'hiperinflacao',
      nome: 'Hiperinflação / Crise Cambial',
      icone: '💸',
      cor: '#f0c14b',
      sobe: ['Dólar', 'Ouro', 'Bitcoin', 'S&P 500'],
      desce: ['IBOV', 'FIIs', 'CDI', 'Imóveis'],
      detalhes: 'Ativos dolarizados protegem. CDI pode render nominalmente mas perde da inflação real. Imóveis mantêm valor no longo prazo mas travam no curto.',
      conclusao: 'Mantenha 20-30% do patrimônio em ativos dolarizados. Não é "torcer contra o Brasil" — é gestão de risco contra a destruição do poder de compra.',
      eventos: [
        {
          nome: 'Brasil – Hiperinflação',
          periodo: '1980–1994',
          descricao: 'O Brasil viveu 14 anos de hiperinflação com 6 moedas diferentes. A inflação chegou a 2.477% em 1993. Supermercados remarcavam preços 2x por dia. O Plano Real em 1994 finalmente estabilizou a economia.',
          dados: [
            { ativo: 'Dólar', variacao: 'Disparou (paralelo)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: 'Refúgio principal', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: 'Preservaram valor real (longo prazo)', cor: 'bullish' },
            { ativo: 'CDI', variacao: 'Corroído pela inflação real', cor: 'bearish' }
          ]
        },
        {
          nome: 'Argentina – Crises Recorrentes',
          periodo: '2001, 2018–atual',
          descricao: 'A Argentina é o exemplo moderno de crises cambiais repetidas. O "corralito" de 2001 congelou depósitos. Em 2023, a inflação chegou a 211% a.a. O dólar blue (paralelo) chegou a 3x o oficial.',
          dados: [
            { ativo: 'Dólar', variacao: 'Peso -98% vs USD (2018-24)', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: 'Refúgio alternativo', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Proteção em USD', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: '-60% em USD (Buenos Aires)', cor: 'bearish' }
          ]
        },
        {
          nome: 'Venezuela',
          periodo: '2016–atual',
          descricao: 'Hiperinflação de 1.000.000%+ destruiu a economia. PIB caiu 75%. 7 milhões de venezuelanos emigraram. Bolívar virou papel sem valor.',
          dados: [
            { ativo: 'Dólar', variacao: 'Economia dolarizada informalmente', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: 'Usado como refúgio', cor: 'bullish' },
            { ativo: 'Ouro', variacao: 'Reserva de valor', cor: 'bullish' }
          ]
        },
        {
          nome: 'Turquia – Crise da Lira',
          periodo: '2021–2023',
          descricao: 'Erdogan forçou cortes de juros apesar da inflação crescente (teoria heterodoxa). A lira turca perdeu 80% do valor. Inflação bateu 85% a.a. Turcos correram para ouro e dólar.',
          dados: [
            { ativo: 'Dólar', variacao: 'Lira -80% vs USD', cor: 'bullish' },
            { ativo: 'Ouro', variacao: 'Demanda turca recorde', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: 'Demanda alternativa alta', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: '-40% em USD (Istambul)', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'bolhas',
      nome: 'Bolhas Especulativas',
      icone: '🫧',
      cor: '#bc8cff',
      sobe: ['CDI', 'Ouro', 'TLT'],
      desce: ['S&P 500', 'IBOV', 'Bitcoin'],
      detalhes: 'O ativo da bolha cai 60-90%. Há contágio para ativos correlatos. A recuperação pode levar 3-15 anos. Renda fixa e ouro são refúgio.',
      conclusao: 'Quando "todo mundo está ganhando dinheiro fácil", é hora de cautela. Reduza exposição ao ativo em euforia e aumente posições em CDI, ouro e títulos longos (TLT).',
      eventos: [
        {
          nome: 'Tulipas (Tulipomania)',
          periodo: '1637',
          descricao: 'A primeira bolha especulativa documentada da história. Na Holanda, bulbos de tulipa raros chegaram a valer mais que casas em Amsterdã. O crash foi instantâneo e devastou famílias.',
          dados: [
            { ativo: 'Ouro', variacao: 'Preservou valor', cor: 'bullish' }
          ]
        },
        {
          nome: 'Bolha das .com',
          periodo: '1999–2000',
          descricao: 'Empresas de internet sem receita valiam bilhões. O Nasdaq subiu 400% em 5 anos e caiu 78% nos 2,5 seguintes. Mas Amazon, Google e eBay sobreviveram.',
          dados: [
            { ativo: 'S&P 500', variacao: '-49%', cor: 'bearish' },
            { ativo: 'CDI', variacao: '+53% acum. (2000-02)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+12%', cor: 'bullish' },
            { ativo: 'TLT', variacao: 'Flight to safety', cor: 'bullish' }
          ]
        },
        {
          nome: 'Bolha Imobiliária EUA',
          periodo: '2006–2008',
          descricao: 'Empréstimos "subprime" para quem não podia pagar. Preços de imóveis dobraram em 5 anos e caíram 33%. 10 milhões de americanos perderam suas casas.',
          dados: [
            { ativo: 'S&P 500', variacao: '-57%', cor: 'bearish' },
            { ativo: 'IBOV', variacao: '-60%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+25%', cor: 'bullish' },
            { ativo: 'TLT', variacao: '+20%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Ciclos do Bitcoin',
          periodo: '2017 e 2021',
          descricao: 'Bitcoin segue ciclos de ~4 anos ligados ao halving. Em 2017: de US$ 1k para US$ 20k e queda para US$ 3k (-85%). Em 2021: de US$ 10k para US$ 69k e queda para US$ 16k (-76%).',
          dados: [
            { ativo: 'Bitcoin', variacao: '-76% a -85% (pico ao fundo)', cor: 'bearish' },
            { ativo: 'CDI', variacao: 'Estável, sem volatilidade', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Impacto limitado', cor: 'neutro' }
          ]
        },
        {
          nome: 'Meme Stocks',
          periodo: '2021',
          descricao: 'Reddit (WallStreetBets) coordenou compras massivas de GameStop e AMC contra hedge funds vendidos. GME subiu 1.900% em semanas e depois caiu 90%.',
          dados: [
            { ativo: 'S&P 500', variacao: 'Impacto limitado', cor: 'neutro' },
            { ativo: 'CDI', variacao: 'Estável', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: 'Alta correlacionada', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'pandemia',
      nome: 'Pandemias',
      icone: '🦠',
      cor: '#39d353',
      sobe: ['Ouro', 'Dólar', 'CDI', 'TLT', 'Bitcoin'],
      desce: ['IBOV', 'S&P 500', 'FIIs', 'Imóveis'],
      detalhes: 'Crash inicial generalizado seguido de estímulos massivos dos governos. Tech e saúde se recuperam primeiro. FIIs de shopping e escritório sofrem mais.',
      conclusao: 'Pandemias causam crashes brutais mas recuperações igualmente rápidas graças a estímulos. Não venda no pânico. Quem manteve posição em 2020 dobrou o patrimônio em 18 meses.',
      eventos: [
        {
          nome: 'Gripe Espanhola',
          periodo: '1918–1919',
          descricao: 'Infectou 500 milhões de pessoas e matou 50-100 milhões (3-5% da população mundial). Mercados caíram 30% mas se recuperaram em menos de 1 ano. A economia rugiu nos "Roaring Twenties".',
          dados: [
            { ativo: 'S&P 500', variacao: '-30% (durante)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: 'Reserva de valor', cor: 'bullish' }
          ]
        },
        {
          nome: 'SARS',
          periodo: '2003',
          descricao: 'Epidemia de SARS infectou 8.000 pessoas na Ásia. Impacto econômico concentrado em China e Hong Kong. Mercados globais caíram moderadamente e se recuperaram em meses.',
          dados: [
            { ativo: 'S&P 500', variacao: '-5%', cor: 'bearish' },
            { ativo: 'IBOV', variacao: 'Impacto limitado', cor: 'neutro' },
            { ativo: 'Ouro', variacao: 'Estável', cor: 'neutro' }
          ]
        },
        {
          nome: 'COVID-19',
          periodo: '2020–2022',
          descricao: 'A pandemia mais impactante economicamente da história moderna. Lockdowns globais, US$ 14 trilhões em estímulos, juros zero globais. Crash de 35% em março, recuperação total em 5 meses, inflação recorde depois.',
          dados: [
            { ativo: 'S&P 500', variacao: '-34% → +68% do fundo', cor: 'bearish' },
            { ativo: 'IBOV', variacao: '-47%', cor: 'bearish' },
            { ativo: 'FIIs', variacao: '-35% (IFIX)', cor: 'bearish' },
            { ativo: 'Dólar', variacao: '+36% (vs BRL)', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+27%', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: '-53% → +1.200% (2020-21)', cor: 'bullish' },
            { ativo: 'TLT', variacao: 'Flight to safety inicial', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'cambial',
      nome: 'Desvalorização Cambial BR',
      icone: '🇧🇷',
      cor: '#f78166',
      sobe: ['Dólar', 'Ouro', 'S&P 500', 'Bitcoin'],
      desce: ['IBOV', 'FIIs', 'Imóveis'],
      detalhes: 'CDI sobe com Selic em reação. Exportadoras (Vale, Suzano) se beneficiam em reais. Quem tem patrimônio dolarizado se protege.',
      conclusao: 'Mantenha 20-30% do patrimônio em ativos dolarizados (S&P 500, ouro, TLT, Bitcoin). Desvalorizações do Real são recorrentes e a melhor proteção é diversificação cambial.',
      eventos: [
        {
          nome: 'Maxidesvalorização',
          periodo: '1999',
          descricao: 'O Real, que era fixo ao dólar (~R$ 1,20), foi liberado para flutuar. Em poucas semanas foi de R$ 1,20 para R$ 2,20. O Brasil recorreu ao FMI. Selic foi a 45% a.a.',
          dados: [
            { ativo: 'Dólar', variacao: 'De R$ 1,20 para R$ 2,20', cor: 'bullish' },
            { ativo: 'IBOV', variacao: '-37%', cor: 'bearish' },
            { ativo: 'CDI', variacao: 'Selic 45% a.a.', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Lula (pré-eleição)',
          periodo: '2002',
          descricao: 'O medo da eleição de Lula levou o dólar de R$ 2,30 para R$ 4,00 (+74%). Risco-país explodiu para 2.400 pontos. Após a eleição e a "Carta ao Povo Brasileiro", o mercado se acalmou.',
          dados: [
            { ativo: 'Dólar', variacao: '+74% (vs BRL)', cor: 'bullish' },
            { ativo: 'IBOV', variacao: '-30%', cor: 'bearish' },
            { ativo: 'FIIs', variacao: 'Mercado incipiente', cor: 'neutro' }
          ]
        },
        {
          nome: 'Crise Dilma',
          periodo: '2015',
          descricao: 'Combinação de crise fiscal (pedaladas), recessão, perda do grau de investimento e processo de impeachment. Dólar foi de R$ 2,65 para R$ 4,17 (+57%) só em 2015.',
          dados: [
            { ativo: 'Dólar', variacao: '+57% (2015)', cor: 'bullish' },
            { ativo: 'IBOV', variacao: '-13% (2015)', cor: 'bearish' },
            { ativo: 'FIIs', variacao: '-15% (IFIX)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+130% (BRL acum.)', cor: 'bullish' }
          ]
        },
        {
          nome: 'COVID e dólar a R$ 5,90',
          periodo: '2020',
          descricao: 'A pandemia combinada com Selic a 2% (mínima histórica) e incerteza fiscal levou o dólar de R$ 4,00 para R$ 5,90. O fluxo de capital estrangeiro secou.',
          dados: [
            { ativo: 'Dólar', variacao: 'De R$ 4,00 para R$ 5,90', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+65% (BRL)', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Proteção cambial', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: '+1.200% (2020-21)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Fiscal / Dólar a R$ 6,30',
          periodo: '2024',
          descricao: 'Desconfiança com a política fiscal do governo, gastos crescentes e cenário externo adverso levaram o dólar a R$ 6,30 no fim de 2024 — máxima nominal histórica.',
          dados: [
            { ativo: 'Dólar', variacao: 'R$ 6,30 (recorde)', cor: 'bullish' },
            { ativo: 'IBOV', variacao: '-10% (4o tri)', cor: 'bearish' },
            { ativo: 'FIIs', variacao: '-12% (IFIX 4o tri)', cor: 'bearish' },
            { ativo: 'IMA-B 5+', variacao: 'IPCA+7,4% (oportunidade)', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'commodities',
      nome: 'Boom de Commodities',
      icone: '🌾',
      cor: '#3fb950',
      sobe: ['IBOV', 'Imóveis', 'FIIs'],
      desce: ['Dólar', 'TLT', 'CDI'],
      detalhes: 'Brasil é superbeneficiado como exportador de commodities. Ibovespa e real se fortalecem. Inflação global pode subir. Ouro pode subir ou cair dependendo do contexto.',
      conclusao: 'Aumente exposição a ações brasileiras (IBOV) e FIIs em ciclos de alta de commodities. O real se fortalece, tornando ativos em reais mais valiosos. Momento de reduzir hedge cambial.',
      eventos: [
        {
          nome: 'Superciclo da China',
          periodo: '2003–2011',
          descricao: 'A industrialização e urbanização chinesa demandaram quantidades sem precedentes de minério, soja, petróleo e metais. O Brasil viveu sua "década de ouro": PIB cresceu 4,5% a.a., Real se valorizou de R$ 3,50 para R$ 1,55.',
          dados: [
            { ativo: 'IBOV', variacao: '+530% (2003-2008)', cor: 'bullish' },
            { ativo: 'Dólar', variacao: 'De R$ 3,50 para R$ 1,55 (caiu)', cor: 'bearish' },
            { ativo: 'FIIs', variacao: 'Mercado em crescimento', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: 'Boom imobiliário BR', cor: 'bullish' }
          ]
        },
        {
          nome: 'Boom Agro pós-COVID',
          periodo: '2021–2022',
          descricao: 'Estímulos globais, guerra na Ucrânia (celeiro do mundo) e problemas climáticos fizeram commodities agrícolas e energéticas dispararem. Balança comercial brasileira bateu recorde de US$ 99 bi em 2023.',
          dados: [
            { ativo: 'IBOV', variacao: 'Beneficiado por Vale/Petrobras', cor: 'bullish' },
            { ativo: 'Dólar', variacao: 'Queda para R$ 4,70', cor: 'bearish' },
            { ativo: 'Imóveis', variacao: 'Aquecido pelo agro', cor: 'bullish' },
            { ativo: 'CDI', variacao: 'Selic subindo (relativo)', cor: 'neutro' }
          ]
        }
      ]
    }
  ];

  // ─── CSS ─────────────────────────────────────────────────────────────────────

  const CSS = `
    .cm-container {
      padding: 0;
    }

    /* Cenário Atual banner */
    .cm-cenario-atual {
      background: linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(248, 81, 73, 0.06));
      border: 1px solid rgba(88, 166, 255, 0.25);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .cm-cenario-atual-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .cm-cenario-atual-pin {
      font-size: 1.2rem;
      line-height: 1;
    }

    .cm-cenario-atual-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .cm-cenario-atual-periodo {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      margin-left: 4px;
    }

    .cm-cenario-atual-list {
      list-style: none;
      padding: 0;
      margin: 0 0 16px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cm-cenario-atual-list li {
      font-size: 0.84rem;
      color: var(--text-secondary);
      line-height: 1.5;
      padding-left: 8px;
      border-left: 2px solid rgba(88, 166, 255, 0.3);
    }

    .cm-cenario-atual-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .cm-cenario-atual-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .cm-cenario-atual-btn:hover {
      border-color: var(--text-muted);
      color: var(--text-primary);
      background: var(--bg-card);
    }

    /* Category pills */
    .cm-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 24px;
    }

    .cm-cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      user-select: none;
    }

    .cm-cat-pill:hover {
      border-color: var(--text-muted);
      color: var(--text-primary);
      background: var(--bg-card);
    }

    .cm-cat-pill.active {
      border-color: var(--cm-active-color, var(--primary-light));
      background: var(--cm-active-bg, rgba(88, 166, 255, 0.1));
      color: var(--text-primary);
      font-weight: 600;
    }

    .cm-cat-pill .cm-pill-icon {
      font-size: 0.9rem;
      line-height: 1;
    }

    /* Main conclusion card */
    .cm-conclusion {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      border-left: 4px solid var(--cm-active-color, var(--primary-light));
    }

    .cm-conclusion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .cm-conclusion-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .cm-conclusion-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    /* Two-column impact layout */
    .cm-impacts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .cm-impact-box {
      padding: 16px 18px;
      border-radius: 12px;
    }

    .cm-impact-box.sobe {
      background: rgba(63, 185, 80, 0.08);
      border: 1px solid rgba(63, 185, 80, 0.2);
    }

    .cm-impact-box.desce {
      background: rgba(248, 81, 73, 0.08);
      border: 1px solid rgba(248, 81, 73, 0.2);
    }

    .cm-impact-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      margin-bottom: 12px;
      font-size: 0.88rem;
    }

    .cm-impact-label.sobe { color: var(--bullish); }
    .cm-impact-label.desce { color: var(--bearish); }

    .cm-impact-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .cm-asset-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .cm-asset-badge.sobe {
      background: rgba(63, 185, 80, 0.15);
      color: var(--bullish);
    }

    .cm-asset-badge.desce {
      background: rgba(248, 81, 73, 0.15);
      color: var(--bearish);
    }

    /* Detail text */
    .cm-detalhes {
      background: var(--bg-tertiary);
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 0.85rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .cm-detalhes-label {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      font-size: 0.82rem;
    }

    /* Investor takeaway */
    .cm-takeaway {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      border-left: 3px solid var(--cm-active-color, var(--primary-light));
    }

    .cm-takeaway-text {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.6;
    }

    .cm-takeaway-prefix {
      color: var(--cm-active-color, var(--primary-light));
      margin-right: 4px;
    }

    /* Events section */
    .cm-events-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cm-events-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cm-event-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .cm-event-card:hover {
      border-color: var(--text-muted);
    }

    .cm-event-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      cursor: pointer;
      user-select: none;
    }

    .cm-event-header:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .cm-event-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cm-event-name {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .cm-event-period {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .cm-event-toggle {
      font-size: 1.1rem;
      color: var(--text-muted);
      transition: transform 0.3s ease;
      flex-shrink: 0;
      margin-left: 12px;
    }

    .cm-event-card.open .cm-event-toggle {
      transform: rotate(180deg);
    }

    .cm-event-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s ease;
    }

    .cm-event-card.open .cm-event-body {
      max-height: 800px;
    }

    .cm-event-content {
      padding: 0 18px 18px;
    }

    .cm-event-desc {
      font-size: 0.84rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 14px;
    }

    /* Data table inside events */
    .cm-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .cm-data-table th {
      text-align: left;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-weight: 600;
      border-bottom: 1px solid var(--border-color);
    }

    .cm-data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .cm-data-table tr:last-child td {
      border-bottom: none;
    }

    .cm-data-table .cm-val-bullish {
      color: var(--bullish);
      font-weight: 600;
    }

    .cm-data-table .cm-val-bearish {
      color: var(--bearish);
      font-weight: 600;
    }

    .cm-data-table .cm-val-neutro {
      color: var(--neutral);
      font-weight: 600;
    }

    /* Empty state */
    .cm-empty {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
    }

    .cm-empty-icon {
      font-size: 2.5rem;
      margin-bottom: 14px;
      opacity: 0.5;
    }

    .cm-empty-text {
      font-size: 0.95rem;
      margin-bottom: 6px;
      color: var(--text-secondary);
    }

    .cm-empty-sub {
      font-size: 0.82rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .cm-cenario-atual {
        padding: 16px 18px;
        margin-bottom: 18px;
      }

      .cm-cenario-atual-title {
        font-size: 0.85rem;
      }

      .cm-cenario-atual-list li {
        font-size: 0.8rem;
      }

      .cm-categories {
        gap: 5px;
        margin-bottom: 18px;
      }

      .cm-cat-pill {
        padding: 5px 9px;
        font-size: 0.72rem;
        gap: 4px;
      }

      .cm-cat-pill .cm-pill-icon {
        font-size: 0.8rem;
      }

      .cm-conclusion {
        padding: 16px;
        margin-bottom: 16px;
      }

      .cm-conclusion-icon {
        font-size: 1.6rem;
      }

      .cm-conclusion-title {
        font-size: 1.05rem;
      }

      .cm-impacts {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .cm-impact-box {
        padding: 12px 14px;
      }

      .cm-detalhes {
        padding: 12px 14px;
        font-size: 0.82rem;
      }

      .cm-takeaway {
        padding: 14px 16px;
      }

      .cm-takeaway-text {
        font-size: 0.84rem;
      }

      .cm-event-header {
        padding: 12px 14px;
      }

      .cm-event-name {
        font-size: 0.86rem;
      }

      .cm-event-content {
        padding: 0 14px 14px;
      }

      .cm-event-desc {
        font-size: 0.8rem;
      }

      .cm-data-table {
        font-size: 0.74rem;
      }

      .cm-data-table th,
      .cm-data-table td {
        padding: 6px 8px;
      }
    }

    @media (max-width: 480px) {
      .cm-cat-pill {
        padding: 5px 8px;
        font-size: 0.68rem;
        border-radius: 14px;
      }

      .cm-cat-pill .cm-pill-icon {
        font-size: 0.75rem;
      }

      .cm-cenario-atual-btn {
        font-size: 0.7rem;
        padding: 4px 10px;
      }
    }
  `;

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('cm-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function renderCenarioAtual() {
    const ca = CENARIO_ATUAL;
    const itensHtml = ca.itens.map(item =>
      `<li>${item.texto}</li>`
    ).join('');

    // Collect unique category references from items
    const catRefs = [];
    ca.itens.forEach(item => {
      item.categorias.forEach(catId => {
        if (!catRefs.find(c => c.id === catId)) {
          const cat = CATEGORIAS.find(c => c.id === catId);
          if (cat) catRefs.push(cat);
        }
      });
    });

    const btnsHtml = catRefs.map(cat =>
      `<button class="cm-cenario-atual-btn" data-cat-id="${cat.id}">
        <span>${cat.icone}</span> ${cat.nome}
      </button>`
    ).join('');

    return `
      <div class="cm-cenario-atual">
        <div class="cm-cenario-atual-header">
          <span class="cm-cenario-atual-pin">📍</span>
          <span class="cm-cenario-atual-title">${ca.titulo} <span class="cm-cenario-atual-periodo">(${ca.periodo})</span></span>
        </div>
        <ul class="cm-cenario-atual-list">${itensHtml}</ul>
        <div class="cm-cenario-atual-links">${btnsHtml}</div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="cm-empty">
        <div class="cm-empty-icon">🌍</div>
        <div class="cm-empty-text">Selecione um cenário macroeconômico acima</div>
        <div class="cm-empty-sub">Explore padrões históricos e entenda o impacto em cada classe de ativo</div>
      </div>
    `;
  }

  function renderCategory(cat) {
    // Impact badges
    const sobeBadges = cat.sobe.map(s =>
      `<span class="cm-asset-badge sobe">${s}</span>`
    ).join('');
    const desceBadges = cat.desce.map(d =>
      `<span class="cm-asset-badge desce">${d}</span>`
    ).join('');

    // Events accordion
    const eventsHtml = cat.eventos.map((ev, idx) => {
      const rowsHtml = ev.dados.map(d =>
        `<tr>
          <td>${d.ativo}</td>
          <td class="cm-val-${d.cor}">${d.variacao}</td>
        </tr>`
      ).join('');

      return `
        <div class="cm-event-card" data-event-idx="${idx}">
          <div class="cm-event-header" onclick="CenariosMacro.toggleEvent(this)">
            <div class="cm-event-info">
              <div class="cm-event-name">${ev.nome}</div>
              <div class="cm-event-period">${ev.periodo}</div>
            </div>
            <div class="cm-event-toggle">▼</div>
          </div>
          <div class="cm-event-body">
            <div class="cm-event-content">
              <div class="cm-event-desc">${ev.descricao}</div>
              <table class="cm-data-table">
                <thead>
                  <tr>
                    <th>Ativo / Indicador</th>
                    <th>Variação / Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cm-conclusion" style="--cm-active-color: ${cat.cor}; border-left-color: ${cat.cor};">
        <div class="cm-conclusion-header">
          <div class="cm-conclusion-icon">${cat.icone}</div>
          <h2 class="cm-conclusion-title">${cat.nome}</h2>
        </div>
        <div class="cm-impacts">
          <div class="cm-impact-box sobe">
            <div class="cm-impact-label sobe">📈 Tende a subir</div>
            <div class="cm-impact-badges">${sobeBadges}</div>
          </div>
          <div class="cm-impact-box desce">
            <div class="cm-impact-label desce">📉 Tende a cair</div>
            <div class="cm-impact-badges">${desceBadges}</div>
          </div>
        </div>
        <div class="cm-detalhes">
          <div class="cm-detalhes-label">🔍 Na prática</div>
          ${cat.detalhes}
        </div>
        <div class="cm-takeaway" style="border-left-color: ${cat.cor};">
          <div class="cm-takeaway-text">
            <span class="cm-takeaway-prefix" style="color: ${cat.cor};">💡</span>
            ${cat.conclusao}
          </div>
        </div>
      </div>
      <div class="cm-events-title">📜 Eventos históricos (${cat.eventos.length})</div>
      <div class="cm-events-grid">${eventsHtml}</div>
    `;
  }

  function renderPills(activeId) {
    return CATEGORIAS.map(cat => {
      const isActive = cat.id === activeId;
      const activeStyle = isActive
        ? `style="--cm-active-color: ${cat.cor}; --cm-active-bg: ${cat.cor}18; border-color: ${cat.cor};"`
        : '';
      return `<button class="cm-cat-pill${isActive ? ' active' : ''}" data-cat-id="${cat.id}" ${activeStyle}>
        <span class="cm-pill-icon">${cat.icone}</span>
        <span>${cat.nome}</span>
      </button>`;
    }).join('');
  }

  function render(activeId) {
    const container = document.getElementById('cm-root');
    if (!container) return;

    const cat = activeId ? CATEGORIAS.find(c => c.id === activeId) : null;

    container.innerHTML = `
      ${renderCenarioAtual()}
      <div class="cm-categories">${renderPills(activeId)}</div>
      <div class="cm-body">${cat ? renderCategory(cat) : renderEmptyState()}</div>
    `;

    // Bind pill clicks
    container.querySelectorAll('.cm-cat-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        const catId = this.dataset.catId;
        render(catId);
      });
    });

    // Bind cenário atual buttons
    container.querySelectorAll('.cm-cenario-atual-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const catId = this.dataset.catId;
        render(catId);
      });
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────────

  window.CenariosMacro = {
    toggleEvent: function (headerEl) {
      const card = headerEl.closest('.cm-event-card');
      if (card) {
        card.classList.toggle('open');
      }
    }
  };

  // ─── INIT ────────────────────────────────────────────────────────────────────

  function init() {
    const section = document.getElementById('comp2-padroes');
    if (!section) return;

    injectStyles();

    // Replace entire section content
    const panel = section.querySelector('.comp2-panel');
    if (panel) {
      panel.innerHTML = '<div id="cm-root" class="cm-container"></div>';
    }

    render(null);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
