/**
 * Cenários Macroeconômicos - Rico aos Poucos
 * Ferramenta educacional com padrões históricos e análise de impacto por classe de ativo
 */
(function () {
  'use strict';

  // ─── DATA ────────────────────────────────────────────────────────────────────

  const CATEGORIAS = [
    {
      id: 'crises',
      nome: 'Crises Financeiras',
      icone: '💥',
      cor: '#f85149',
      resumo: 'Crises e crashes financeiros são momentos de pânico generalizado nos mercados, geralmente causados por bolhas especulativas, falências sistêmicas ou perda de confiança no sistema financeiro.',
      sobe: ['Ouro', 'Dólar (vs BRL)', 'Treasuries EUA', 'CDI/Renda Fixa'],
      desce: ['Ações (Bolsa)', 'Imóveis', 'FIIs', 'Commodities cíclicas', 'Criptomoedas'],
      neutro: ['IPCA+ (curto prazo)', 'Caixa'],
      conclusao: 'Em crises financeiras, o medo domina. Investidores fogem de ativos de risco e buscam segurança no ouro, dólar e títulos soberanos. Ações podem cair 40-60% em meses. A recuperação pode levar de 2 a 7 anos dependendo da gravidade. Quem tem caixa na crise pode comprar ativos baratos e multiplicar patrimônio na retomada.',
      eventos: [
        {
          nome: 'Bolha das .com',
          periodo: '2000–2002',
          descricao: 'O estouro da bolha da internet destruiu US$ 5 trilhões em valor de mercado. Empresas sem receita e com valuations absurdos colapsaram. O Nasdaq caiu 78% do pico ao fundo.',
          dados: [
            { ativo: 'Nasdaq', variacao: '-78%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-49%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+12%', cor: 'bullish' },
            { ativo: 'Dólar (BRL)', variacao: '+55%', cor: 'bullish' },
            { ativo: 'CDI acum.', variacao: '+53%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Subprime / Lehman Brothers',
          periodo: '2008–2009',
          descricao: 'O colapso do mercado imobiliário americano e a falência do Lehman Brothers desencadearam a pior crise financeira desde 1929. O sistema bancário global quase parou.',
          dados: [
            { ativo: 'S&P 500', variacao: '-57%', cor: 'bearish' },
            { ativo: 'Ibovespa', variacao: '-60%', cor: 'bearish' },
            { ativo: 'Imóveis EUA', variacao: '-33%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+25%', cor: 'bullish' },
            { ativo: 'Dólar (BRL)', variacao: '+48%', cor: 'bullish' },
            { ativo: 'Treasuries 10Y', variacao: '+20%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Brasil – Era Dilma',
          periodo: '2014–2016',
          descricao: 'Combinação de crise política (impeachment), recessão severa (PIB caiu 7,2% acumulado), escândalos de corrupção (Lava Jato) e descontrole fiscal. Brasil perdeu grau de investimento.',
          dados: [
            { ativo: 'Ibovespa', variacao: '-40%', cor: 'bearish' },
            { ativo: 'Dólar (BRL)', variacao: '+98%', cor: 'bullish' },
            { ativo: 'Selic (pico)', variacao: '14,25% a.a.', cor: 'neutro' },
            { ativo: 'FIIs (IFIX)', variacao: '-15%', cor: 'bearish' },
            { ativo: 'CDI acum.', variacao: '+38%', cor: 'bullish' },
            { ativo: 'Ouro (BRL)', variacao: '+130%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crash da COVID-19',
          periodo: 'Março 2020',
          descricao: 'O mercado global entrou em bear market mais rápido da história (23 dias). Circuit breakers dispararam 6 vezes na B3. A recuperação, porém, foi igualmente histórica graças a estímulos trilionários.',
          dados: [
            { ativo: 'Ibovespa', variacao: '-47%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-34%', cor: 'bearish' },
            { ativo: 'Dólar (BRL)', variacao: '+36%', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+27%', cor: 'bullish' },
            { ativo: 'Bitcoin', variacao: '-53%', cor: 'bearish' },
            { ativo: 'FIIs (IFIX)', variacao: '-35%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Bolha de IA?',
          periodo: '2024–?',
          descricao: 'As "Mag 7" concentram mais de US$ 17 trilhões em valor de mercado. P/E da Nvidia acima de 60x. Investimento massivo em infraestrutura de IA sem retorno proporcional comprovado. Paralelos com a bolha .com são crescentes.',
          dados: [
            { ativo: 'Mag 7 (peso S&P)', variacao: '~33%', cor: 'neutro' },
            { ativo: 'Nvidia P/E', variacao: '>60x', cor: 'bearish' },
            { ativo: 'CapEx Big Tech', variacao: '+320 bi USD/ano', cor: 'neutro' },
            { ativo: 'S&P 500 ex-Mag7', variacao: 'lateralizado', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'guerras',
      nome: 'Guerras e Conflitos',
      icone: '⚔️',
      cor: '#da3633',
      resumo: 'Conflitos geopolíticos geram incerteza extrema. Os mercados reagem com fuga para segurança, alta de commodities estratégicas e volatilidade cambial.',
      sobe: ['Petróleo', 'Ouro', 'Dólar (USD)', 'Treasuries EUA', 'Ações de defesa'],
      desce: ['Ações globais (curto prazo)', 'Moedas de países envolvidos', 'Turismo/Aviação', 'Mercados emergentes'],
      neutro: ['Imóveis (longe do conflito)', 'Agro (depende do conflito)'],
      conclusao: 'Guerras causam o "flight to safety": investidores fogem para ouro, dólar e treasuries. Petróleo e commodities estratégicas disparam. Historicamente, mercados se recuperam rápido de conflitos localizados, mas guerras prolongadas podem causar recessão via inflação de custos. A máxima "compre ao som dos canhões" funciona na maioria dos conflitos regionais.',
      eventos: [
        {
          nome: 'Guerra do Golfo',
          periodo: '1990–1991',
          descricao: 'A invasão do Kuwait pelo Iraque fez o petróleo dobrar de preço em meses. O S&P 500 caiu 20% mas se recuperou totalmente em 6 meses após a vitória da coalizão.',
          dados: [
            { ativo: 'Petróleo', variacao: '+130%', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: '-20%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+12%', cor: 'bullish' },
            { ativo: 'Recuperação', variacao: '6 meses', cor: 'neutro' }
          ]
        },
        {
          nome: '11 de Setembro',
          periodo: '2001',
          descricao: 'Os ataques terroristas fecharam a NYSE por 4 dias. Na reabertura, o Dow Jones caiu 14% em uma semana. Porém, em 2 meses os mercados já haviam recuperado as perdas.',
          dados: [
            { ativo: 'Dow Jones', variacao: '-14% (1 semana)', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+8%', cor: 'bullish' },
            { ativo: 'Petróleo', variacao: '-24%', cor: 'bearish' },
            { ativo: 'Ações defesa', variacao: '+30% (3 meses)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Invasão do Iraque',
          periodo: '2003',
          descricao: 'Antes da invasão, mercados caíram por incerteza. Quando a guerra começou de fato, os mercados subiram ("buy the invasion"). O S&P 500 iniciou um bull market de 5 anos.',
          dados: [
            { ativo: 'S&P 500', variacao: '+30% (12 meses)', cor: 'bullish' },
            { ativo: 'Petróleo', variacao: '+40%', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+20%', cor: 'bullish' },
            { ativo: 'Dólar (DXY)', variacao: '-15%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Rússia invade Ucrânia',
          periodo: '2022',
          descricao: 'A invasão em fevereiro de 2022 causou o maior choque energético europeu em décadas. Gás natural disparou 400%, trigo subiu 50%. Europa entrou em crise energética severa.',
          dados: [
            { ativo: 'Gás natural (EU)', variacao: '+400%', cor: 'bullish' },
            { ativo: 'Petróleo (Brent)', variacao: '+65%', cor: 'bullish' },
            { ativo: 'Trigo', variacao: '+53%', cor: 'bullish' },
            { ativo: 'Euro/USD', variacao: '-14%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+7%', cor: 'bullish' },
            { ativo: 'Bolsa Rússia (MOEX)', variacao: '-45%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Tensões Oriente Médio',
          periodo: '2023–2024',
          descricao: 'Guerra Israel-Hamas e escalada com Irã. Ataques Houthi no Mar Vermelho afetaram 12% do comércio marítimo mundial, encarecendo fretes e seguro de cargas.',
          dados: [
            { ativo: 'Petróleo (Brent)', variacao: '+12%', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+28%', cor: 'bullish' },
            { ativo: 'Frete marítimo', variacao: '+250%', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: 'Impacto limitado', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'petroleo',
      nome: 'Choque de Petróleo',
      icone: '🛢️',
      cor: '#b87333',
      resumo: 'Choques no preço do petróleo reverberam por toda a economia: encarecem transporte, energia, alimentos e insumos industriais, gerando pressão inflacionária global.',
      sobe: ['Petróleo e derivados', 'Inflação', 'Juros (BCs reagem)', 'Ouro', 'Exportadores de petróleo'],
      desce: ['Aéreas/Transporte', 'Consumo discricionário', 'Ações em geral', 'Mercados emergentes importadores'],
      neutro: ['Dólar (depende do contexto)', 'Agro (insumos sobem, mas preço do produto também)'],
      conclusao: 'Choques de petróleo são historicamente os maiores gatilhos de recessão global. O petróleo é o "sangue da economia" – quando seu preço dispara, a inflação sobe, bancos centrais apertam juros e o crescimento desacelera. Empresas aéreas e de transporte sofrem imediatamente. Brasil como produtor tem proteção parcial, mas ainda importa derivados refinados.',
      eventos: [
        {
          nome: 'Crise do Petróleo (Embargo OPEP)',
          periodo: '1973',
          descricao: 'Embargo árabe aos EUA e aliados de Israel quadruplicou o preço do petróleo de US$ 3 para US$ 12/barril. Causou recessão global, filas em postos de gasolina e o fim da era do petróleo barato.',
          dados: [
            { ativo: 'Petróleo', variacao: '+300%', cor: 'bullish' },
            { ativo: 'S&P 500', variacao: '-48%', cor: 'bearish' },
            { ativo: 'Inflação EUA', variacao: '12% a.a.', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+72%', cor: 'bullish' }
          ]
        },
        {
          nome: '2o Choque do Petróleo (Revolução Iraniana)',
          periodo: '1979–1980',
          descricao: 'A revolução no Irã e a guerra Irã-Iraque reduziram a oferta global. Petróleo saltou de US$ 14 para US$ 40. A inflação americana chegou a 14%, levando ao "Volcker Shock".',
          dados: [
            { ativo: 'Petróleo', variacao: '+185%', cor: 'bullish' },
            { ativo: 'Inflação EUA', variacao: '14,8% a.a.', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+120%', cor: 'bullish' },
            { ativo: 'Fed Funds Rate', variacao: '20% a.a.', cor: 'bearish' }
          ]
        },
        {
          nome: 'Petróleo a US$ 147',
          periodo: '2008',
          descricao: 'Combinação de demanda chinesa crescente, especulação e tensões geopolíticas levaram o petróleo ao recorde histórico de US$ 147/barril em julho de 2008, colapsando para US$ 32 em dezembro.',
          dados: [
            { ativo: 'Petróleo (pico)', variacao: 'US$ 147/barril', cor: 'bullish' },
            { ativo: 'Petróleo (fundo)', variacao: 'US$ 32/barril', cor: 'bearish' },
            { ativo: 'Aéreas (EUA)', variacao: '-70%', cor: 'bearish' },
            { ativo: 'Petrobras', variacao: '-75%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Petróleo Negativo',
          periodo: 'Abril 2020',
          descricao: 'Pela primeira vez na história, o preço do petróleo WTI ficou negativo (-US$ 37). A pandemia destruiu a demanda e não havia onde armazenar. Contratos futuros viraram passivo.',
          dados: [
            { ativo: 'WTI (mínima)', variacao: '-US$ 37/barril', cor: 'bearish' },
            { ativo: 'Demanda global', variacao: '-30%', cor: 'bearish' },
            { ativo: 'Ações de petróleo', variacao: '-60%', cor: 'bearish' },
            { ativo: 'Energias renováveis', variacao: '+45% (12 meses)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Choque Energético pós-Ucrânia',
          periodo: '2022',
          descricao: 'A guerra e as sanções à Rússia causaram o maior choque energético europeu desde os anos 1970. Gás natural na Europa subiu 400%, petróleo bateu US$ 130. Europa enfrentou risco real de apagão no inverno.',
          dados: [
            { ativo: 'Brent', variacao: 'US$ 130/barril', cor: 'bullish' },
            { ativo: 'Gás Natural (TTF)', variacao: '+400%', cor: 'bullish' },
            { ativo: 'Inflação Eurozona', variacao: '10,6% a.a.', cor: 'bearish' },
            { ativo: 'Euro/Dólar', variacao: 'Paridade (1:1)', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'protecionismo',
      nome: 'Guerras Comerciais',
      icone: '🏗️',
      cor: '#da8b45',
      resumo: 'Tarifas e barreiras comerciais disruptam cadeias produtivas globais, geram inflação de custos e provocam retaliações que prejudicam o comércio mundial.',
      sobe: ['Inflação doméstica', 'Produtores locais protegidos', 'Ouro (incerteza)', 'Dólar (curto prazo)'],
      desce: ['Comércio global', 'Empresas dependentes de importação', 'Mercados emergentes exportadores', 'Ações de tecnologia (cadeias globais)'],
      neutro: ['Imóveis', 'Renda fixa (depende da reação do BC)'],
      conclusao: 'Guerras comerciais destroem valor no curto prazo para todos os envolvidos. Tarifas funcionam como um imposto sobre o consumidor. Cadeias de suprimento levam anos para se reorganizar. Historicamente, protecionismo agravou recessões (Smoot-Hawley em 1930 aprofundou a Grande Depressão). No cenário atual, a dependência da China em semicondutores e a reorganização do "nearshoring" criam oportunidades pontuais para Brasil e México.',
      eventos: [
        {
          nome: 'Smoot-Hawley Tariff Act',
          periodo: '1930',
          descricao: 'Os EUA impuseram tarifas de até 60% sobre 20.000 produtos importados. Retaliações de 25 países causaram colapso de 65% no comércio mundial, aprofundando a Grande Depressão.',
          dados: [
            { ativo: 'Comércio global', variacao: '-65%', cor: 'bearish' },
            { ativo: 'Dow Jones', variacao: '-86% (1929-32)', cor: 'bearish' },
            { ativo: 'Desemprego EUA', variacao: '25%', cor: 'bearish' },
            { ativo: 'PIB EUA', variacao: '-30%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Plaza Accord',
          periodo: '1985',
          descricao: 'Acordo entre G5 para desvalorizar o dólar contra iene e marco alemão. O dólar perdeu 50% do valor em 2 anos. Resultado: boom exportador americano, mas bolha imobiliária no Japão que estourou em 1989.',
          dados: [
            { ativo: 'Dólar (DXY)', variacao: '-50% (em 2 anos)', cor: 'bearish' },
            { ativo: 'Iene/Dólar', variacao: 'De 240 para 120', cor: 'bullish' },
            { ativo: 'Nikkei (Japão)', variacao: '+200% (até 1989)', cor: 'bullish' },
            { ativo: 'Exportações EUA', variacao: '+35%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Guerra Comercial EUA–China',
          periodo: '2018–2019',
          descricao: 'Trump impôs tarifas sobre US$ 360 bilhões em produtos chineses. China retaliou. Cadeias de suprimento começaram a migrar para Vietnã, Índia e México. Incerteza afetou investimentos globais.',
          dados: [
            { ativo: 'S&P 500', variacao: '-20% (dez/2018)', cor: 'bearish' },
            { ativo: 'Shangai Composite', variacao: '-25%', cor: 'bearish' },
            { ativo: 'Soja (EUA→China)', variacao: '-75% volume', cor: 'bearish' },
            { ativo: 'Soja BR (exportação)', variacao: '+30%', cor: 'bullish' },
            { ativo: 'Ouro', variacao: '+18%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Tarifas Trump 2.0',
          periodo: '2025–2026',
          descricao: 'Segunda rodada de protecionismo com tarifas "universais" de 10-60% sobre importações. Tarifas de 60% sobre produtos chineses, 25% sobre aço e alumínio globais. Retaliações da China, UE e outros parceiros. Inflação de bens importados acelerando.',
          dados: [
            { ativo: 'Inflação EUA (proj.)', variacao: '+1,5 p.p.', cor: 'bearish' },
            { ativo: 'Comércio EUA-China', variacao: '-30% (proj.)', cor: 'bearish' },
            { ativo: 'Nearshoring México/BR', variacao: 'Oportunidade', cor: 'bullish' },
            { ativo: 'Semicondutores', variacao: 'Disruption', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '+22% (2025)', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'juros',
      nome: 'Ciclo de Alta de Juros',
      icone: '📈',
      cor: '#58a6ff',
      resumo: 'Quando bancos centrais sobem juros para combater inflação, o custo do dinheiro aumenta, afetando desde hipotecas até valuations de empresas de tecnologia.',
      sobe: ['Renda fixa pós-fixada (CDI, Selic)', 'Dólar (juros EUA)', 'Bancos (spread)', 'Poupança (relativo)'],
      desce: ['Ações de crescimento (tech)', 'FIIs', 'Imóveis (financiamento)', 'Bonds/Renda fixa pré-fixada', 'Criptomoedas'],
      neutro: ['Ouro (depende da inflação real)', 'Commodities', 'Ações de valor/dividendos'],
      conclusao: 'Juros altos são o "remédio amargo" da economia. Combatem inflação mas desaceleram o crescimento. Ações de crescimento (tech) são as mais afetadas porque seu valor depende de fluxos de caixa futuros – que valem menos com juros altos. FIIs e imóveis sofrem pois competem com renda fixa "sem risco". Paradoxalmente, é nesses momentos que títulos IPCA+ longos oferecem as melhores oportunidades de ganho de capital para quem aguenta o mark-to-market.',
      eventos: [
        {
          nome: 'Volcker Shock',
          periodo: '1980–1982',
          descricao: 'Paul Volcker, presidente do Fed, elevou os juros americanos para 20% a.a. para matar a inflação de 14%. Causou recessão severa, desemprego de 10%, mas quebrou a espiral inflacionária. Considerado o ciclo de alta mais agressivo da história moderna.',
          dados: [
            { ativo: 'Fed Funds Rate', variacao: '20% a.a.', cor: 'bearish' },
            { ativo: 'Inflação EUA', variacao: 'De 14% para 3%', cor: 'bullish' },
            { ativo: 'Desemprego EUA', variacao: '10,8%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-27%', cor: 'bearish' },
            { ativo: 'Bonds 30 anos (yield)', variacao: '15% a.a.', cor: 'neutro' }
          ]
        },
        {
          nome: 'Taper Tantrum',
          periodo: '2013',
          descricao: 'O Fed anunciou que iria reduzir compras de títulos (QE). Apenas o anúncio causou pânico nos mercados emergentes. O dólar disparou, yields dos treasuries saltaram e capital fugiu de países como Brasil, Turquia e Índia.',
          dados: [
            { ativo: 'Treasury 10Y yield', variacao: 'De 1,6% para 3%', cor: 'bearish' },
            { ativo: 'Ibovespa', variacao: '-18%', cor: 'bearish' },
            { ativo: 'Real (BRL)', variacao: '-17%', cor: 'bearish' },
            { ativo: 'Rupia indiana', variacao: '-20%', cor: 'bearish' },
            { ativo: 'Ouro', variacao: '-28%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Ciclo Fed 2022–2023',
          periodo: '2022–2023',
          descricao: 'O ciclo de alta mais rápido em 40 anos: de 0% para 5,5% em 16 meses. O Fed tentou controlar inflação pós-pandemia e pós-estímulos. Bonds tiveram o pior ano da história. SVB e outros bancos regionais quebraram.',
          dados: [
            { ativo: 'Fed Funds Rate', variacao: 'De 0% para 5,50%', cor: 'bearish' },
            { ativo: 'Nasdaq', variacao: '-33% (2022)', cor: 'bearish' },
            { ativo: 'Bonds globais', variacao: '-15% (pior ano da história)', cor: 'bearish' },
            { ativo: 'Bitcoin', variacao: '-65%', cor: 'bearish' },
            { ativo: 'Dólar (DXY)', variacao: '+16%', cor: 'bullish' },
            { ativo: 'Bancos regionais EUA', variacao: 'SVB, Signature quebraram', cor: 'bearish' }
          ]
        },
        {
          nome: 'Selic alta no Brasil',
          periodo: '2021–2025',
          descricao: 'O Banco Central brasileiro iniciou um dos ciclos de alta mais longos: Selic de 2% para 14,25%. Inflação, fiscal deteriorado e dólar alto forçaram juros restritivos. CDI virou "rei" do mercado, FIIs e ações sofreram forte desconto.',
          dados: [
            { ativo: 'Selic', variacao: 'De 2% para 14,25%', cor: 'bearish' },
            { ativo: 'CDI acumulado (3 anos)', variacao: '+42%', cor: 'bullish' },
            { ativo: 'IFIX (FIIs)', variacao: '-18% (2021-22)', cor: 'bearish' },
            { ativo: 'Ibovespa', variacao: 'Lateralizado', cor: 'neutro' },
            { ativo: 'IPCA+ longo (NTN-B 2045)', variacao: 'IPCA+7,5%', cor: 'bullish' },
            { ativo: 'Dólar (BRL)', variacao: '+35%', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'hiperinflacao',
      nome: 'Hiperinflação / Crise Cambial',
      icone: '💸',
      cor: '#f0c14b',
      resumo: 'Quando um país perde o controle da inflação e sua moeda derrete, todos os preços em moeda local disparam. É a destruição silenciosa do patrimônio de quem não se protege.',
      sobe: ['Dólar (contra a moeda local)', 'Ouro', 'Imóveis (reserva de valor)', 'Ativos dolarizados', 'Ações (nominal, mas não real)'],
      desce: ['Poder de compra', 'Salários reais', 'Renda fixa prefixada', 'Poupança', 'Títulos de dívida do governo'],
      neutro: ['Ações de exportadoras (proteção parcial)'],
      conclusao: 'Hiperinflação é o cenário mais destrutivo para o patrimônio da classe média. A moeda perde valor diariamente. Quem tem ativos reais (imóveis, terra) ou dolarizados sobrevive. Quem tem apenas dinheiro em conta ou renda fixa sem correção perde tudo. No Brasil dos anos 80-90, preços dobravam a cada poucos meses. A lição: sempre manter parte do patrimônio em ativos que não dependem de uma única moeda ou governo.',
      eventos: [
        {
          nome: 'Brasil – Hiperinflação',
          periodo: '1980–1994',
          descricao: 'O Brasil viveu 14 anos de hiperinflação com 6 moedas diferentes (Cruzeiro, Cruzado, Cruzado Novo, Cruzeiro, Cruzeiro Real, Real). A inflação chegou a 2.477% em 1993. Supermercados remarcavam preços 2x por dia. O Plano Real em 1994 finalmente estabilizou a economia.',
          dados: [
            { ativo: 'Inflação (1993)', variacao: '2.477% a.a.', cor: 'bearish' },
            { ativo: 'Moedas trocadas', variacao: '6 moedas em 14 anos', cor: 'bearish' },
            { ativo: 'Dólar paralelo', variacao: 'Disparou', cor: 'bullish' },
            { ativo: 'Imóveis', variacao: 'Preservaram valor real', cor: 'bullish' },
            { ativo: 'Ouro', variacao: 'Refúgio principal', cor: 'bullish' }
          ]
        },
        {
          nome: 'Argentina – Crises Recorrentes',
          periodo: '2001, 2018–atual',
          descricao: 'A Argentina é o exemplo moderno de crises cambiais repetidas. O "corralito" de 2001 congelou depósitos. Em 2023, a inflação chegou a 211% a.a. O dólar blue (paralelo) chegou a 3x o oficial. Milei assumiu com plano de dolarização parcial.',
          dados: [
            { ativo: 'Peso argentino (2018-24)', variacao: '-98% vs USD', cor: 'bearish' },
            { ativo: 'Inflação (2023)', variacao: '211% a.a.', cor: 'bearish' },
            { ativo: 'Dólar Blue/Oficial', variacao: 'Spread de 200%', cor: 'bearish' },
            { ativo: 'Imóveis (em USD)', variacao: '-60% (Buenos Aires)', cor: 'bearish' },
            { ativo: 'Merval (nominal)', variacao: '+500% (ilusório)', cor: 'neutro' }
          ]
        },
        {
          nome: 'Venezuela',
          periodo: '2016–atual',
          descricao: 'Hiperinflação de 1.000.000%+ destruiu a economia. PIB caiu 75%. 7 milhões de venezuelanos emigraram. Bolívar virou papel sem valor. Economia dolarizada informalmente.',
          dados: [
            { ativo: 'Inflação (2018)', variacao: '1.698.488%', cor: 'bearish' },
            { ativo: 'PIB', variacao: '-75% (2013-2020)', cor: 'bearish' },
            { ativo: 'Emigração', variacao: '7 milhões de pessoas', cor: 'bearish' },
            { ativo: 'Salário mínimo (USD)', variacao: 'US$ 3-5/mês', cor: 'bearish' }
          ]
        },
        {
          nome: 'Turquia – Crise da Lira',
          periodo: '2021–2023',
          descricao: 'Erdogan forçou cortes de juros apesar da inflação crescente (teoria heterodoxa). A lira turca perdeu 80% do valor. Inflação bateu 85% a.a. Turcos correram para ouro e dólar.',
          dados: [
            { ativo: 'Lira Turca', variacao: '-80% vs USD', cor: 'bearish' },
            { ativo: 'Inflação (pico)', variacao: '85% a.a.', cor: 'bearish' },
            { ativo: 'Ouro (demanda turca)', variacao: 'Recorde histórico', cor: 'bullish' },
            { ativo: 'Imóveis (Istambul, em USD)', variacao: '-40%', cor: 'bearish' },
            { ativo: 'BIST 100 (nominal)', variacao: '+200%', cor: 'neutro' }
          ]
        }
      ]
    },
    {
      id: 'bolhas',
      nome: 'Bolhas Especulativas',
      icone: '🫧',
      cor: '#bc8cff',
      resumo: 'Bolhas especulativas seguem padrão repetitivo: nova narrativa sedutora → euforia → "dessa vez é diferente" → crash de 80%+. O ativo muda, a psicologia humana é sempre a mesma.',
      sobe: ['O ativo da bolha (fase euforia)', 'Ativos correlatos', 'Corretoras/exchanges'],
      desce: ['O ativo da bolha (fase crash: -80% a -99%)', 'Confiança do investidor', 'Ativos correlatos', 'Regulação aumenta'],
      neutro: ['Ativos não correlatos', 'Ouro', 'Imóveis (exceto se for a bolha)'],
      conclusao: 'A história mostra que TODA bolha estoura. O padrão é sempre o mesmo: uma inovação real cria entusiasmo genuíno, que atrai especuladores, que inflam preços muito além do valor fundamental. A narrativa do "dessa vez é diferente" é o sinal mais clássico de topo. A queda costuma ser de 80-99%. Mas atenção: muitas bolhas acontecem em cima de tecnologias que realmente transformam o mundo – a internet sobreviveu à bolha .com, imóveis continuam existindo após 2008. O excesso de preço é que estava errado, não necessariamente o ativo.',
      eventos: [
        {
          nome: 'Tulipas (Tulipomania)',
          periodo: '1637',
          descricao: 'A primeira bolha especulativa documentada da história. Na Holanda, bulbos de tulipa raros chegaram a valer mais que casas em Amsterdã. O crash foi instantâneo e devastou famílias.',
          dados: [
            { ativo: 'Tulipa Semper Augustus', variacao: '10.000 florins (= 1 mansão)', cor: 'bullish' },
            { ativo: 'Queda', variacao: '-99% em semanas', cor: 'bearish' },
            { ativo: 'Duração da bolha', variacao: '~3 anos', cor: 'neutro' }
          ]
        },
        {
          nome: 'Bolha das .com',
          periodo: '1999–2000',
          descricao: 'Empresas de internet sem receita valiam bilhões. Pets.com, Webvan, eToys – todas quebraram. O Nasdaq subiu 400% em 5 anos e caiu 78% nos 2,5 anos seguintes. Mas Amazon, Google e eBay sobreviveram.',
          dados: [
            { ativo: 'Nasdaq (pico→fundo)', variacao: '-78%', cor: 'bearish' },
            { ativo: 'Pets.com', variacao: '-99,7%', cor: 'bearish' },
            { ativo: 'Amazon', variacao: '-93% (mas sobreviveu)', cor: 'bearish' },
            { ativo: 'Tempo de recuperação (Nasdaq)', variacao: '15 anos', cor: 'bearish' },
            { ativo: 'IPOs sem lucro', variacao: '80% do total', cor: 'neutro' }
          ]
        },
        {
          nome: 'Bolha Imobiliária EUA',
          periodo: '2006–2008',
          descricao: 'Empréstimos "subprime" para quem não podia pagar, securitizados em CDOs com rating AAA fraudulento. Preços de imóveis dobraram em 5 anos e caíram 33%. 10 milhões de americanos perderam suas casas.',
          dados: [
            { ativo: 'Imóveis EUA (mediana)', variacao: '-33%', cor: 'bearish' },
            { ativo: 'Hipotecas subprime', variacao: 'Default de 40%', cor: 'bearish' },
            { ativo: 'Bear Stearns', variacao: 'Faliu', cor: 'bearish' },
            { ativo: 'Lehman Brothers', variacao: 'Faliu', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-57%', cor: 'bearish' }
          ]
        },
        {
          nome: 'Ciclos do Bitcoin',
          periodo: '2017 e 2021',
          descricao: 'Bitcoin segue ciclos de ~4 anos ligados ao halving. Em 2017: de US$ 1k para US$ 20k e queda para US$ 3k (-85%). Em 2021: de US$ 10k para US$ 69k e queda para US$ 16k (-76%). Cada ciclo atinge novo patamar.',
          dados: [
            { ativo: 'BTC 2017 (pico→fundo)', variacao: '-85%', cor: 'bearish' },
            { ativo: 'BTC 2021 (pico→fundo)', variacao: '-76%', cor: 'bearish' },
            { ativo: 'Altcoins', variacao: '-90 a -99%', cor: 'bearish' },
            { ativo: 'Exchanges (FTX)', variacao: 'Faliu (2022)', cor: 'bearish' },
            { ativo: 'Recuperação', variacao: '~2-3 anos por ciclo', cor: 'neutro' }
          ]
        },
        {
          nome: 'Meme Stocks',
          periodo: '2021',
          descricao: 'Reddit (WallStreetBets) coordenou compras massivas de GameStop e AMC contra hedge funds vendidos. GME subiu 1.900% em semanas. Fenômeno de varejo vs institucional sem precedentes.',
          dados: [
            { ativo: 'GameStop (GME)', variacao: '+1.900% (jan/2021)', cor: 'bullish' },
            { ativo: 'AMC', variacao: '+3.000%', cor: 'bullish' },
            { ativo: 'Melvin Capital', variacao: 'Perdeu 53%, fechou', cor: 'bearish' },
            { ativo: 'GME (após pico)', variacao: '-90%', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'pandemia',
      nome: 'Pandemias',
      icone: '🦠',
      cor: '#39d353',
      resumo: 'Emergências sanitárias globais causam crash inicial em todos os ativos, seguido de estímulos governamentais massivos. O padrão é: pânico → estímulo → euforia → inflação.',
      sobe: ['Farmacêuticas/Saúde', 'Tecnologia/E-commerce', 'Ouro', 'Renda fixa (curto prazo)', 'Delivery/Streaming'],
      desce: ['Turismo/Aviação', 'Varejo físico', 'Petróleo', 'Shopping centers/FIIs de laje', 'Entretenimento presencial'],
      neutro: ['Imóveis residenciais', 'Agro/Alimentos'],
      conclusao: 'Pandemias causam o pior tipo de choque: simultâneo de oferta e demanda. Tudo para ao mesmo tempo. Mas a resposta dos governos modernos é massiva – trilhões em estímulos. O padrão COVID mostrou: crash brutal e rápido (semanas) seguido de recuperação igualmente rápida (meses) e depois inflação como custo dos estímulos (anos). Setores de tecnologia e saúde saem fortalecidos. Turismo e varejo físico demoram anos para se recuperar.',
      eventos: [
        {
          nome: 'Gripe Espanhola',
          periodo: '1918–1919',
          descricao: 'Infectou 500 milhões de pessoas e matou 50-100 milhões (3-5% da população mundial). O Dow Jones caiu 30% durante a pandemia mas se recuperou totalmente em 1919. A economia rugiu nos "Roaring Twenties" que se seguiram.',
          dados: [
            { ativo: 'Dow Jones', variacao: '-30% (durante)', cor: 'bearish' },
            { ativo: 'Mortes globais', variacao: '50-100 milhões', cor: 'bearish' },
            { ativo: 'Recuperação', variacao: '< 1 ano', cor: 'bullish' },
            { ativo: 'Pós-pandemia', variacao: 'Boom dos anos 1920', cor: 'bullish' }
          ]
        },
        {
          nome: 'SARS',
          periodo: '2003',
          descricao: 'Epidemia de SARS infectou 8.000 pessoas na Ásia. Impacto econômico concentrado em China e Hong Kong. Mercados globais caíram moderadamente e se recuperaram em meses.',
          dados: [
            { ativo: 'Hang Seng (HK)', variacao: '-15%', cor: 'bearish' },
            { ativo: 'S&P 500', variacao: '-5%', cor: 'bearish' },
            { ativo: 'Turismo Ásia', variacao: '-60%', cor: 'bearish' },
            { ativo: 'Recuperação global', variacao: '~3 meses', cor: 'bullish' }
          ]
        },
        {
          nome: 'COVID-19',
          periodo: '2020–2022',
          descricao: 'A pandemia mais impactante economicamente da história moderna. Lockdowns globais, 14 trilhões em estímulos, taxa de juros zero em todos os países desenvolvidos. O resultado: crash de 35% em março, recuperação total em 5 meses, seguida de bolha especulativa e depois inflação recorde.',
          dados: [
            { ativo: 'S&P 500 (mar/2020)', variacao: '-34%', cor: 'bearish' },
            { ativo: 'S&P 500 (dez/2020)', variacao: '+68% do fundo', cor: 'bullish' },
            { ativo: 'Estímulos globais', variacao: 'US$ 14 trilhões', cor: 'neutro' },
            { ativo: 'Zoom Video', variacao: '+750%', cor: 'bullish' },
            { ativo: 'Petróleo (abr/2020)', variacao: '-US$ 37 (negativo)', cor: 'bearish' },
            { ativo: 'Inflação EUA (2022)', variacao: '9,1% (40 anos de alta)', cor: 'bearish' },
            { ativo: 'Bitcoin', variacao: '+1.200% (2020-21)', cor: 'bullish' }
          ]
        }
      ]
    },
    {
      id: 'cambial',
      nome: 'Desvalorização Cambial BR',
      icone: '🇧🇷',
      cor: '#f78166',
      resumo: 'Quando o Real perde valor aceleradamente contra o dólar, o custo de vida sobe (via importados), a inflação pressiona, o BC sobe juros e a economia desacelera. Quem tem ativos dolarizados ganha; quem não tem, perde poder de compra.',
      sobe: ['Dólar', 'Exportadoras (Petrobras, Vale)', 'Ouro (BRL)', 'CDI/Selic', 'Ativos dolarizados'],
      desce: ['Poder de compra do salário', 'Importadores', 'Viagens internacionais', 'Eletrônicos/Carros importados', 'FIIs (migração para RF)'],
      neutro: ['Imóveis (proteção parcial no longo prazo)', 'Agro (insumo sobe, mas preço do produto também)'],
      conclusao: 'Desvalorizações do Real acontecem periodicamente e são o maior risco para o investidor brasileiro que tem 100% do patrimônio em reais. O padrão se repete: crise fiscal ou política → fuga de capital → dólar dispara → inflação sobe → Selic sobe → economia freia. A proteção é simples: manter 20-30% do patrimônio em ativos dolarizados (S&P 500, ouro, TLT). Não é "torcer contra o Brasil" – é gestão de risco básica.',
      eventos: [
        {
          nome: 'Maxidesvalorização',
          periodo: '1999',
          descricao: 'O Real, que era fixo ao dólar (~R$ 1,20), foi liberado para flutuar. Em poucas semanas foi de R$ 1,20 para R$ 2,20 – desvalorização de 83%. O Brasil recorreu ao FMI. Selic foi a 45% a.a.',
          dados: [
            { ativo: 'Dólar (BRL)', variacao: 'De R$ 1,20 para R$ 2,20', cor: 'bullish' },
            { ativo: 'Ibovespa', variacao: '-37%', cor: 'bearish' },
            { ativo: 'Selic', variacao: '45% a.a.', cor: 'bearish' },
            { ativo: 'FMI', variacao: 'Empréstimo de US$ 41 bi', cor: 'neutro' }
          ]
        },
        {
          nome: 'Crise Lula (pré-eleição)',
          periodo: '2002',
          descricao: 'O medo da eleição de Lula levou o dólar de R$ 2,30 para R$ 4,00 (+74%). Risco-país explodiu para 2.400 pontos. Após a eleição e a "Carta ao Povo Brasileiro", o mercado se acalmou gradualmente.',
          dados: [
            { ativo: 'Dólar (BRL)', variacao: '+74%', cor: 'bullish' },
            { ativo: 'Risco-país (EMBI)', variacao: '2.400 pontos', cor: 'bearish' },
            { ativo: 'Ibovespa', variacao: '-30%', cor: 'bearish' },
            { ativo: 'C-Bond (dívida BR)', variacao: '45 centavos de dólar', cor: 'bearish' }
          ]
        },
        {
          nome: 'Crise Dilma',
          periodo: '2015',
          descricao: 'Combinação de crise fiscal (pedaladas), recessão, perda do grau de investimento e processo de impeachment. Dólar foi de R$ 2,65 para R$ 4,17 (+57%) só em 2015.',
          dados: [
            { ativo: 'Dólar (BRL)', variacao: '+57% (2015)', cor: 'bullish' },
            { ativo: 'Ibovespa', variacao: '-13% (2015)', cor: 'bearish' },
            { ativo: 'Rating Brasil', variacao: 'Perdeu grau de investimento', cor: 'bearish' },
            { ativo: 'Selic (pico)', variacao: '14,25% a.a.', cor: 'bearish' },
            { ativo: 'PIB', variacao: '-3,5% (2015)', cor: 'bearish' }
          ]
        },
        {
          nome: 'COVID e dólar a R$ 5,90',
          periodo: '2020',
          descricao: 'A pandemia combinada com Selic a 2% (mínima histórica) e incerteza fiscal levou o dólar de R$ 4,00 para R$ 5,90. O fluxo de capital estrangeiro secou. Brasil se tornou "hostil" para carry trade.',
          dados: [
            { ativo: 'Dólar (BRL)', variacao: 'De R$ 4,00 para R$ 5,90', cor: 'bullish' },
            { ativo: 'Selic', variacao: '2% a.a. (mínima histórica)', cor: 'neutro' },
            { ativo: 'Fluxo estrangeiro (B3)', variacao: '-R$ 87 bi (saída)', cor: 'bearish' },
            { ativo: 'Ouro (BRL)', variacao: '+65%', cor: 'bullish' }
          ]
        },
        {
          nome: 'Crise Fiscal / Dólar a R$ 6,30',
          periodo: '2024',
          descricao: 'Desconfiança com a política fiscal do governo, gastos crescentes, arcabouço fiscal desidratado e cenário externo adverso levaram o dólar a R$ 6,30 no fim de 2024 – máxima nominal histórica.',
          dados: [
            { ativo: 'Dólar (BRL)', variacao: 'R$ 6,30 (recorde)', cor: 'bullish' },
            { ativo: 'CDS Brasil 5 anos', variacao: '230 bps', cor: 'bearish' },
            { ativo: 'NTN-B 2045', variacao: 'IPCA + 7,4%', cor: 'bullish' },
            { ativo: 'Ibovespa', variacao: '-10% (4o tri)', cor: 'bearish' },
            { ativo: 'FIIs (IFIX)', variacao: '-12% (4o tri)', cor: 'bearish' }
          ]
        }
      ]
    },
    {
      id: 'commodities',
      nome: 'Boom de Commodities',
      icone: '🌾',
      cor: '#3fb950',
      resumo: 'Quando commodities disparam (minério, soja, petróleo, agro), o Brasil é um dos maiores beneficiados. Superávit comercial cresce, Real se fortalece e a Bolsa brasileira sobe puxada por exportadoras.',
      sobe: ['Ibovespa (Vale, Petrobras, JBS)', 'Real (BRL se fortalece)', 'Superávit comercial BR', 'Mercados emergentes', 'Agro/Mineração'],
      desce: ['Dólar (contra BRL)', 'Importadores de commodities', 'Tech relativo (rotação para valor)'],
      neutro: ['Renda fixa', 'FIIs', 'Imóveis'],
      conclusao: 'O Brasil é uma potência em commodities (2o maior produtor de soja, ferro, carne bovina). Quando o mundo demanda mais matéria-prima, o Brasil prospera: o Real se valoriza, a balança comercial gera superávits recordes, e ações de exportadoras disparam. O risco é a "doença holandesa" – depender demais de commodities e não desenvolver indústria. Historicamente, booms de commodities duram 5-10 anos e são seguidos por ciclos de baixa igualmente longos.',
      eventos: [
        {
          nome: 'Superciclo da China',
          periodo: '2003–2011',
          descricao: 'A industrialização e urbanização chinesa demandaram quantidades sem precedentes de minério, soja, petróleo e metais. O Brasil viveu sua "década de ouro": PIB cresceu 4,5% a.a., Real se valorizou de R$ 3,50 para R$ 1,55, Ibovespa multiplicou por 6x.',
          dados: [
            { ativo: 'Ibovespa', variacao: '+530% (2003-2008)', cor: 'bullish' },
            { ativo: 'Dólar (BRL)', variacao: 'De R$ 3,50 para R$ 1,55', cor: 'bullish' },
            { ativo: 'Minério de ferro', variacao: '+900%', cor: 'bullish' },
            { ativo: 'Soja', variacao: '+250%', cor: 'bullish' },
            { ativo: 'Petrobras', variacao: '+1.200%', cor: 'bullish' },
            { ativo: 'Vale', variacao: '+2.100%', cor: 'bullish' },
            { ativo: 'PIB Brasil', variacao: '4,5% a.a. (média)', cor: 'bullish' }
          ]
        },
        {
          nome: 'Boom Agro pós-COVID',
          periodo: '2021–2022',
          descricao: 'Estímulos globais, guerra na Ucrânia (celeiro do mundo) e problemas climáticos fizeram commodities agrícolas e energéticas dispararem. Balança comercial brasileira bateu recorde de US$ 99 bi em 2023.',
          dados: [
            { ativo: 'Soja (bushel)', variacao: '+80%', cor: 'bullish' },
            { ativo: 'Milho', variacao: '+115%', cor: 'bullish' },
            { ativo: 'Balança comercial BR', variacao: 'Recorde US$ 99 bi (2023)', cor: 'bullish' },
            { ativo: 'JBS', variacao: '+120% (2020-22)', cor: 'bullish' },
            { ativo: 'Dólar (BRL)', variacao: 'Queda para R$ 4,70', cor: 'bullish' },
            { ativo: 'SLC Agrícola', variacao: '+200% (2020-22)', cor: 'bullish' }
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

    /* Category pills */
    .cm-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .cm-cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--text-secondary);
      font-size: 0.82rem;
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
      font-size: 1rem;
      line-height: 1;
    }

    /* Conclusion card */
    .cm-conclusion {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      border-left: 4px solid var(--cm-active-color, var(--primary-light));
    }

    .cm-conclusion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
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

    .cm-conclusion-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .cm-conclusion-summary {
      font-size: 0.9rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    /* Impact indicators */
    .cm-impacts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .cm-impact-box {
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 0.82rem;
    }

    .cm-impact-box.sobe {
      background: rgba(63, 185, 80, 0.08);
      border: 1px solid rgba(63, 185, 80, 0.2);
    }

    .cm-impact-box.desce {
      background: rgba(248, 81, 73, 0.08);
      border: 1px solid rgba(248, 81, 73, 0.2);
    }

    .cm-impact-box.neutro {
      background: rgba(240, 193, 75, 0.08);
      border: 1px solid rgba(240, 193, 75, 0.2);
    }

    .cm-impact-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }

    .cm-impact-label.sobe { color: var(--bullish); }
    .cm-impact-label.desce { color: var(--bearish); }
    .cm-impact-label.neutro { color: var(--neutral); }

    .cm-impact-list {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .cm-impact-list span {
      display: inline;
    }

    .cm-impact-list span::after {
      content: ' · ';
      color: var(--text-muted);
    }

    .cm-impact-list span:last-child::after {
      content: '';
    }

    /* Key takeaway */
    .cm-takeaway {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 0.88rem;
      line-height: 1.7;
      color: var(--text-secondary);
      border-left: 3px solid var(--cm-active-color, var(--primary-light));
    }

    .cm-takeaway-title {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
      font-size: 0.9rem;
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
      gap: 16px;
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
      padding: 16px 20px;
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
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .cm-event-period {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .cm-event-toggle {
      font-size: 1.2rem;
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
      padding: 0 20px 20px;
    }

    .cm-event-desc {
      font-size: 0.85rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    /* Data table inside events */
    .cm-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
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
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .cm-empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .cm-empty-text {
      font-size: 1rem;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .cm-empty-sub {
      font-size: 0.85rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .cm-categories {
        gap: 6px;
        margin-bottom: 16px;
      }

      .cm-cat-pill {
        padding: 7px 10px;
        font-size: 0.72rem;
        gap: 4px;
      }

      .cm-cat-pill .cm-pill-icon {
        font-size: 0.85rem;
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

      .cm-conclusion-summary {
        font-size: 0.82rem;
      }

      .cm-impacts {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .cm-impact-box {
        padding: 12px 14px;
      }

      .cm-takeaway {
        padding: 14px 16px;
        font-size: 0.82rem;
      }

      .cm-event-header {
        padding: 12px 16px;
      }

      .cm-event-name {
        font-size: 0.88rem;
      }

      .cm-event-content {
        padding: 0 16px 16px;
      }

      .cm-event-desc {
        font-size: 0.8rem;
      }

      .cm-data-table {
        font-size: 0.75rem;
      }

      .cm-data-table th,
      .cm-data-table td {
        padding: 6px 8px;
      }
    }

    @media (max-width: 480px) {
      .cm-cat-pill {
        padding: 6px 8px;
        font-size: 0.68rem;
        border-radius: 16px;
      }

      .cm-cat-pill .cm-pill-icon {
        font-size: 0.78rem;
      }

      .cm-impacts {
        gap: 6px;
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

  function renderEmptyState() {
    return `
      <div class="cm-empty">
        <div class="cm-empty-icon">🌍</div>
        <div class="cm-empty-text">Selecione um cenário macroeconômico acima</div>
        <div class="cm-empty-sub">Explore padrões históricos e entenda o que acontece com cada classe de ativo</div>
      </div>
    `;
  }

  function renderConclusion(cat) {
    const sobeHtml = cat.sobe.map(s => `<span>${s}</span>`).join('');
    const desceHtml = cat.desce.map(d => `<span>${d}</span>`).join('');
    const neutroHtml = cat.neutro.map(n => `<span>${n}</span>`).join('');

    return `
      <div class="cm-conclusion" style="--cm-active-color: ${cat.cor}; border-left-color: ${cat.cor};">
        <div class="cm-conclusion-header">
          <div class="cm-conclusion-icon">${cat.icone}</div>
          <div>
            <h2 class="cm-conclusion-title">${cat.nome}</h2>
            <div class="cm-conclusion-subtitle">O que tipicamente acontece</div>
          </div>
        </div>
        <div class="cm-conclusion-summary">${cat.resumo}</div>
        <div class="cm-impacts">
          <div class="cm-impact-box sobe">
            <div class="cm-impact-label sobe">▲ Tende a subir</div>
            <div class="cm-impact-list">${sobeHtml}</div>
          </div>
          <div class="cm-impact-box desce">
            <div class="cm-impact-label desce">▼ Tende a cair</div>
            <div class="cm-impact-list">${desceHtml}</div>
          </div>
          <div class="cm-impact-box neutro">
            <div class="cm-impact-label neutro">► Neutro / Depende</div>
            <div class="cm-impact-list">${neutroHtml}</div>
          </div>
        </div>
        <div class="cm-takeaway" style="border-left-color: ${cat.cor};">
          <div class="cm-takeaway-title">💡 Conclusão para o investidor</div>
          ${cat.conclusao}
        </div>
      </div>
    `;
  }

  function renderEvents(cat) {
    const eventsHtml = cat.eventos.map((ev, idx) => {
      const rowsHtml = ev.dados.map(d =>
        `<tr>
          <td>${d.ativo}</td>
          <td class="cm-val-${d.cor}">${d.variacao}</td>
        </tr>`
      ).join('');

      return `
        <div class="cm-event-card${idx === 0 ? ' open' : ''}" data-event-idx="${idx}">
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
      <div class="cm-events-title">📜 Eventos históricos (${cat.eventos.length})</div>
      <div class="cm-events-grid">${eventsHtml}</div>
    `;
  }

  function renderCategory(cat) {
    return renderConclusion(cat) + renderEvents(cat);
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
