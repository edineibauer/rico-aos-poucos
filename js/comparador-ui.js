/**
 * Comparador v2 - Versão com UX Melhorado
 * Usa as mesmas funções e dados do Comparador original
 */

const Comparador2 = {
  currentTab: 'historico',
  charts: {},
  viewMode: 'nominal',
  dueloViewReal: false,
  dueloResultados: null,

  // Configurações de ajuste para ativos
  ajustes: {
    dolarExtra: 0,        // Rendimento extra anual do dólar (%)
    imoveisRenda: 0       // Rendimento anual líquido de aluguel (% do valor do imóvel)
  },

  // Configurações de duelo
  dueloConfigs: {
    'ibov-sp500': {
      titulo: 'IBOV TR vs S&P 500',
      ativo1: { key: 'ibovtr', nome: 'IBOV TR', icone: '🇧🇷' },
      ativo2: { key: 'sp500_brl', nome: 'S&P 500 (R$)', icone: '🇺🇸' }
    },
    'ouro-bitcoin': {
      titulo: 'Ouro vs Bitcoin',
      ativo1: { key: 'ouro', nome: 'Ouro', icone: '🥇' },
      ativo2: { key: 'bitcoin_brl', nome: 'Bitcoin', icone: '₿' }
    },
    'ipca-tlt': {
      titulo: 'IMA-B 5+ vs TLT',
      ativo1: { key: 'imab5', nome: 'IMA-B 5+', icone: '🇧🇷' },
      ativo2: { key: 'tlt_brl', nome: 'TLT (Tesouro EUA)', icone: '🇺🇸' }
    },
    'ibov-cdi': {
      titulo: 'IBOV TR vs CDI',
      ativo1: { key: 'ibovtr', nome: 'IBOV TR', icone: '📈' },
      ativo2: { key: 'cdi', nome: 'CDI', icone: '💰' }
    },
    'fii-imovel': {
      titulo: 'FII vs Imóvel',
      ativo1: { key: 'fii_ifix', nome: 'FIIs (IFIX)', icone: '🏢' },
      ativo2: { key: 'imoveis_fipezap', nome: 'Imóveis', icone: '🏠' }
    },
    'dolar-ouro': {
      titulo: 'Dólar vs Ouro',
      ativo1: { key: 'dolar', nome: 'Dólar', icone: '💵' },
      ativo2: { key: 'ouro', nome: 'Ouro', icone: '🥇' }
    }
  },

  // Análises conceituais para cada duelo
  dueloAnalises: {
    'ibov-sp500': {
      contexto: `
        <p><strong>O que é o IBOV TR (Total Return)?</strong></p>
        <p>O Ibovespa Total Return mede a performance das ações brasileiras <em>com dividendos reinvestidos</em>. Isso é crucial porque muitas empresas brasileiras (bancos, elétricas, estatais) distribuem dividendos gordos. Sem considerar dividendos, a comparação seria injusta.</p>

        <p><strong>O que é o S&P 500?</strong></p>
        <p>Índice das 500 maiores empresas americanas por capitalização de mercado. Representa cerca de 80% do valor total do mercado acionário dos EUA. Aqui, convertido para reais para comparação direta.</p>

        <p><strong>Por que o S&P 500 em reais costuma ganhar?</strong></p>
        <p>Dois fatores trabalham a favor do investidor brasileiro no S&P 500:</p>
        <ul>
          <li><strong>Valorização das ações:</strong> Empresas americanas (Apple, Microsoft, Google) dominam setores globais</li>
          <li><strong>Desvalorização do real:</strong> Em 2011, US$1 = R$1,60. Em 2025, US$1 = R$6,20. Só o câmbio multiplicou o investimento por 3,8x</li>
        </ul>

        <p><strong>Quando o IBOV pode ganhar?</strong></p>
        <p>Em ciclos de otimismo com o Brasil (commodities em alta, juros caindo, reformas), o IBOV pode superar o S&P 500 em reais. Isso ocorreu em 2003-2007 e brevemente em 2016-2017.</p>`,
      pontoChave: `O "efeito câmbio" é o fator decisivo. Quando o Brasil vai mal, o dólar sobe - e o investidor em S&P 500 ganha duas vezes. Quando o Brasil vai bem, o real se valoriza - e o ganho do S&P 500 em reais diminui. É uma proteção natural contra crises brasileiras.`,
      reflexao: `<strong>Nossa Tese:</strong> Diversificar parte do patrimônio em ativos dolarizados não é "torcer contra o Brasil" - é gestão de risco básica. Se sua renda é em reais, seu emprego é no Brasil, e seu imóvel é aqui, você já está muito exposto ao país. Ter 20-30% em ativos dolarizados equilibra essa concentração.`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>IBOV TR</th><th>S&P 500 (R$)</th></tr>
          <tr><td>Moeda base</td><td>Real (BRL)</td><td>Dólar convertido para BRL</td></tr>
          <tr><td>Setores dominantes</td><td>Bancos, commodities, estatais</td><td>Tecnologia, saúde, consumo</td></tr>
          <tr><td>Dividend yield médio</td><td class="positivo">~5-7% a.a.</td><td>~1,5% a.a.</td></tr>
          <tr><td>Volatilidade histórica</td><td class="negativo">~25-30% a.a.</td><td class="positivo">~15-20% a.a.</td></tr>
          <tr><td>Correlação com crises BR</td><td class="negativo">Cai junto</td><td class="positivo">Sobe (via câmbio)</td></tr>
          <tr><td>Acesso para brasileiro</td><td class="positivo">Direto (B3)</td><td>Via BDRs ou corretora externa</td></tr>
          <tr><td>Tributação</td><td>15-22,5% sobre ganho</td><td>15% (até R$35k/mês isento)</td></tr>
        </table>`
    },
    'ouro-bitcoin': {
      contexto: `
        <p><strong>O que é o Ouro?</strong></p>
        <p>O ouro é a reserva de valor mais antiga da humanidade. Usado como moeda desde 3000 a.C., sobreviveu à queda de impérios, guerras mundiais, hiperinflações e crises financeiras. Em 2025, teve seu melhor ano em quase 50 anos, subindo 65% e ultrapassando US$4.000/oz pela primeira vez na história.</p>
        <ul>
          <li><strong>Escassez natural:</strong> Todo o ouro já minerado na história cabe em um cubo de 22 metros de lado</li>
          <li><strong>Indestrutível:</strong> Não oxida, não se degrada, dura para sempre</li>
          <li><strong>Reconhecimento universal:</strong> Aceito como valor em qualquer país do mundo</li>
          <li><strong>Demanda institucional recorde:</strong> Bancos centrais compraram +1.000 toneladas/ano nos últimos 3 anos</li>
          <li><strong>Sem risco de contraparte:</strong> Não depende de nenhum governo ou empresa</li>
        </ul>

        <p><strong>O que é o Bitcoin?</strong></p>
        <p>Criado em 2009 por Satoshi Nakamoto, o Bitcoin é um ativo digital descentralizado. Em 2024-2025, passou por transformação institucional significativa com aprovação de ETFs spot nos EUA e adoção como reserva estratégica por alguns países.</p>
        <ul>
          <li><strong>Escassez programada:</strong> Máximo de 21 milhões de unidades (~19,5 milhões já minerados)</li>
          <li><strong>Descentralizado:</strong> Não controlado por nenhum governo ou banco central</li>
          <li><strong>Institucionalização acelerada:</strong> ETFs com US$123+ bilhões em ativos (jan/2026), BlackRock detém ~805.000 BTC</li>
          <li><strong>Volatilidade ainda alta:</strong> Quedas de 25-30% continuam frequentes (março e outubro 2025)</li>
        </ul>

        <p><strong>O Cenário em 2026: Uma Nova Era?</strong></p>
        <p>Bitcoin amadureceu significativamente: ETFs spot aprovados, custódia institucional (Coinbase Prime, Fidelity), regulação mais clara (GENIUS Act nos EUA, MiCA na Europa). Mas ainda está longe de ser comparável ao ouro em termos de aceitação global e estabilidade.</p>`,
      pontoChave: `<strong>O argumento central:</strong> Ouro acaba de ter seu melhor ano em 50 anos (+65% em 2025), com bancos centrais comprando volumes recordes como proteção geopolítica. Bitcoin ganhou legitimidade institucional com ETFs de US$123 bilhões e reservas estratégicas em alguns países (EUA, El Salvador, Brasil), mas ainda apresenta volatilidade 3-4x maior que o ouro. A questão não é mais "Bitcoin vai sobreviver?", mas "quanto de cada faz sentido para seu perfil de risco?"`,
      reflexao: `<strong>Nossa Tese:</strong> O cenário mudou. Bitcoin não é mais apenas especulação - tem infraestrutura institucional real. Mas ouro continua sendo o porto seguro comprovado, especialmente em cenários de fragmentação geopolítica. Nossa sugestão: Ouro (5-10%) como proteção patrimonial base. Bitcoin (0-5%) dependendo da sua tolerância a volatilidade e horizonte de investimento. A soma dos dois não deve exceder 15% de uma carteira diversificada.`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>Ouro</th><th>Bitcoin</th></tr>
          <tr><td>Histórico</td><td class="positivo">5.000+ anos</td><td>17 anos (desde 2009)</td></tr>
          <tr><td>Performance 2025</td><td class="positivo">+65% (melhor ano em 50 anos)</td><td>~0% (flat após alta volatilidade)</td></tr>
          <tr><td>Volatilidade típica</td><td class="positivo">~15-20%</td><td class="negativo">~40-60%</td></tr>
          <tr><td>Maior queda histórica</td><td class="positivo">-46% (1980-1982)</td><td class="negativo">-77% (2021-2022)</td></tr>
          <tr><td>Reservas soberanas</td><td class="positivo">36.000+ ton (quase todos os países)</td><td>EUA, El Salvador, Bhutan, Brasil, Rep. Tcheca</td></tr>
          <tr><td>ETFs/Fundos</td><td class="positivo">Consolidados há décadas</td><td class="positivo">US$123B+ em ETFs spot (2026)</td></tr>
          <tr><td>Custódia institucional</td><td class="positivo">Bancos, cofres, ETFs</td><td class="positivo">Coinbase Prime, Fidelity, BitGo</td></tr>
          <tr><td>Regulação</td><td class="positivo">Clara e universal</td><td>Em evolução (GENIUS Act, MiCA)</td></tr>
          <tr><td>Uso além de reserva</td><td class="positivo">Joias, eletrônicos, medicina</td><td>Pagamentos, DeFi, remessas</td></tr>
          <tr><td>Comportamento em crises</td><td class="positivo">Sobe consistentemente</td><td>Misto (caiu em 2022, subiu pós-eleição 2024)</td></tr>
          <tr><td>Projeções 2026</td><td>US$5.000/oz (JPMorgan)</td><td>US$150-200k (analistas otimistas)</td></tr>
          <tr><td>Risco de perda total</td><td class="positivo">Praticamente zero</td><td class="negativo">Baixo mas existente</td></tr>
        </table>`
    },
    'ipca-tlt': {
      contexto: `
        <p><strong>O que é o IMA-B 5+ (Tesouro IPCA+ longo)?</strong></p>
        <p>Índice que mede a performance de títulos públicos brasileiros atrelados à inflação com vencimento acima de 5 anos. Características:</p>
        <ul>
          <li><strong>Proteção contra inflação:</strong> Rende IPCA + taxa real prefixada</li>
          <li><strong>Juros reais altos:</strong> Historicamente 5-7% acima da inflação no Brasil</li>
          <li><strong>Risco de marcação a mercado:</strong> Se juros sobem, o preço do título cai (e vice-versa)</li>
          <li><strong>Risco soberano:</strong> Depende da capacidade do governo brasileiro de pagar</li>
        </ul>

        <p><strong>O que é o TLT (Treasury Long Term)?</strong></p>
        <p>ETF que investe em títulos do Tesouro americano com vencimento de 20+ anos. Características:</p>
        <ul>
          <li><strong>Ativo mais seguro do mundo:</strong> Governo dos EUA nunca deu calote</li>
          <li><strong>Juros reais baixos:</strong> Historicamente 0-2% acima da inflação americana</li>
          <li><strong>Moeda forte:</strong> Rendimento em dólar - moeda de reserva global</li>
          <li><strong>Alta sensibilidade a juros:</strong> Duration de ~17 anos = muita volatilidade</li>
        </ul>

        <p><strong>Por que o Brasil paga juros tão altos?</strong></p>
        <p>Para atrair capital estrangeiro, o Brasil precisa compensar o risco maior com juros maiores. Isso beneficia o investidor local, mas reflete a percepção de risco do país. Países desenvolvidos não precisam pagar 6-7% de juros reais.</p>`,
      pontoChave: `<strong>O trade-off fundamental:</strong> No IMA-B você ganha juros muito maiores (6-7% real vs 1-2% real), mas assume risco Brasil e risco de marcação a mercado em cenários de crise. No TLT você ganha menos, mas em dólar e com risco soberano mínimo.`,
      reflexao: `<strong>Nossa Tese:</strong> Aproveite os juros altos brasileiros enquanto durarem, mas mantenha uma reserva em ativos dolarizados como proteção. Uma combinação de IMA-B (para renda) + TLT (para proteção) pode oferecer o melhor dos dois mundos: retorno alto no Brasil com hedge em dólar para crises.`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>IMA-B 5+</th><th>TLT</th></tr>
          <tr><td>Juros reais históricos</td><td class="positivo">5-7% a.a.</td><td>0-2% a.a.</td></tr>
          <tr><td>Moeda</td><td>Real (BRL)</td><td class="positivo">Dólar (USD)</td></tr>
          <tr><td>Risco soberano</td><td class="negativo">Médio-alto (Brasil)</td><td class="positivo">Mínimo (EUA)</td></tr>
          <tr><td>Proteção contra inflação</td><td class="positivo">Sim (IPCA)</td><td class="negativo">Não diretamente</td></tr>
          <tr><td>Volatilidade (duration)</td><td class="negativo">Alta (~7-10 anos)</td><td class="negativo">Muito alta (~17 anos)</td></tr>
          <tr><td>Comportamento em crise BR</td><td class="negativo">Pode cair muito</td><td class="positivo">Tende a subir (dólar)</td></tr>
          <tr><td>Liquidez</td><td class="positivo">Alta (Tesouro Direto)</td><td class="positivo">Alta (NYSE)</td></tr>
          <tr><td>Tributação</td><td>15-22,5% (tabela regressiva)</td><td>15% sobre ganho de capital</td></tr>
        </table>`
    },
    'ibov-cdi': {
      contexto: `
        <p><strong>O Dilema Clássico do Investidor Brasileiro (Versão 2026)</strong></p>
        <p>Em países desenvolvidos, a resposta é clara: no longo prazo, ações superam renda fixa. Nos EUA, o S&P 500 rendeu ~10% a.a. contra ~4% dos bonds. No Brasil, essa certeza não existe - e em 2026, menos ainda.</p>

        <p><strong>O que é o IBOV TR?</strong></p>
        <p>Ibovespa Total Return = variação das ações + dividendos reinvestidos. Representa o retorno real de quem investe em ações brasileiras e reinveste os proventos.</p>

        <p><strong>O que é o CDI?</strong></p>
        <p>Certificado de Depósito Interbancário - taxa que os bancos cobram entre si. Segue de perto a Selic. É o benchmark da renda fixa brasileira e, historicamente, paga muito bem.</p>

        <p><strong>O Cenário Atual: Selic a 15%</strong></p>
        <p>Em dezembro de 2025, o Banco Central manteve a Selic em 15% a.a. pelo quarto mês consecutivo - o maior nível desde julho de 2006. Com inflação em ~4,4%, isso significa <strong>juros reais de ~10,5% ao ano</strong> - entre os mais altos do mundo.</p>

        <p><strong>O Fenômeno Brasileiro</strong></p>
        <p>Em muitos períodos de 10-20 anos, o CDI superou o Ibovespa - algo raríssimo no mundo. Com Selic a 15%, a pergunta fica ainda mais difícil: por que correr risco em ações se a renda fixa paga ~1,2% ao mês com segurança?</p>`,
      pontoChave: `<strong>O paradoxo brasileiro em 2026:</strong> Com Selic a 15%, o CDI paga ~1,2% ao mês garantido. Para a bolsa valer o risco, precisaria entregar bem mais - mas historicamente entrega retornos semelhantes com muito mais volatilidade. O consenso espera cortes de ~2,75 pontos em 2026 (Selic para 12-12,25%), o que poderia beneficiar a bolsa. Mas "esperar queda de juros" é uma das apostas mais frustrantes da história recente.`,
      reflexao: `<strong>Nossa Tese:</strong> Com Selic a 15%, o CDI é imbatível no curto prazo. Mas se você acredita que os juros vão cair para 12% ou menos em 2026-2027, a bolsa pode surpreender positivamente - especialmente empresas sensíveis a juros (varejo, construtoras, small caps). A estratégia prudente: manter uma base sólida em CDI/Tesouro Selic e alocar gradualmente em bolsa conforme os cortes acontecerem de fato (não antes).`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>IBOV TR</th><th>CDI</th></tr>
          <tr><td>Retorno atual (jan/2026)</td><td>Variável</td><td class="positivo">~15% a.a. (1,2%/mês)</td></tr>
          <tr><td>Juros reais</td><td>Depende do lucro empresas</td><td class="positivo">~10,5% a.a. (Selic - IPCA)</td></tr>
          <tr><td>Volatilidade anual</td><td class="negativo">~25-30%</td><td class="positivo">~0,5%</td></tr>
          <tr><td>Maior queda histórica</td><td class="negativo">-50% (2008)</td><td class="positivo">Nunca negativo nominal</td></tr>
          <tr><td>Retorno em anos ruins</td><td class="negativo">Pode perder 30-50%</td><td class="positivo">Sempre positivo nominal</td></tr>
          <tr><td>Previsibilidade</td><td class="negativo">Baixa</td><td class="positivo">Alta (acompanha Selic)</td></tr>
          <tr><td>Sensibilidade a juros</td><td class="positivo">Beneficia-se de queda</td><td class="negativo">Rende menos se Selic cair</td></tr>
          <tr><td>Proteção contra inflação</td><td>Moderada</td><td>Boa enquanto Selic > IPCA</td></tr>
          <tr><td>Liquidez</td><td class="positivo">D+2</td><td class="positivo">D+0 a D+1</td></tr>
          <tr><td>Potencial de ganho</td><td class="positivo">Ilimitado</td><td>Limitado à Selic (15% atual)</td></tr>
        </table>`
    },
    'fii-imovel': {
      contexto: `
        <p><strong>Duas Filosofias de Investimento Imobiliário (Cenário 2026)</strong></p>
        <p>Investir em imóveis no Brasil é tradição. Mas há duas formas muito diferentes de fazer isso, cada uma com vantagens e desvantagens claras - especialmente no cenário atual de Selic a 15%.</p>

        <p><strong>Imóvel Físico: O Investimento Tradicional</strong></p>
        <ul>
          <li><strong>Você é dono do tijolo:</strong> Pode usar, alugar, reformar ou vender</li>
          <li><strong>Controle total:</strong> Você decide inquilino, preço do aluguel, manutenção</li>
          <li><strong>Alavancagem:</strong> Pode financiar 70-80% do valor (mas cuidado: juros de financiamento estão altíssimos)</li>
          <li><strong>Mercado aquecido:</strong> Preços subiram ~8% em 2025, vendas +9,6% no 1º semestre</li>
        </ul>
        <p><strong>Mas exige:</strong> Capital alto, tempo para gestão, lidar com inquilinos, vacância, manutenção, IPTU, condomínio...</p>

        <p><strong>FIIs (Fundos Imobiliários): O Investimento Moderno</strong></p>
        <ul>
          <li><strong>Cotas acessíveis:</strong> Invista a partir de R$100 em grandes empreendimentos</li>
          <li><strong>Renda mensal:</strong> Dividendos distribuídos todo mês, isentos de IR para pessoa física (por enquanto - pode mudar para 5% em 2026)</li>
          <li><strong>Diversificação:</strong> Um FII pode ter 50+ imóveis em diferentes cidades</li>
          <li><strong>Liquidez:</strong> Venda suas cotas em D+2 na bolsa</li>
        </ul>
        <p><strong>Mas você abre mão de:</strong> Controle sobre o ativo, possibilidade de usar o imóvel, alavancagem via financiamento.</p>

        <p><strong>O Impacto da Selic a 15%</strong></p>
        <p>Com juros tão altos, FIIs enfrentam forte concorrência do CDI - por que arriscar em imóveis se a renda fixa paga 15% ao ano? Mas se a Selic cair para 12% em 2026 (consenso do mercado), FIIs podem se valorizar significativamente. É uma aposta em queda de juros.</p>`,
      pontoChave: `<strong>A questão central em 2026:</strong> Com Selic a 15%, tanto FIIs quanto financiamento imobiliário estão em desvantagem vs. renda fixa. Mas se os juros caírem como o mercado espera (para ~12% até fim de 2026), ambos podem se beneficiar. FIIs são mais líquidos e práticos; imóveis físicos oferecem mais controle e possibilidade de alavancagem quando os juros baixarem.`,
      reflexao: `<strong>Nossa Tese:</strong> No cenário atual (Selic 15%), o momento é de cautela com imóveis. Se for comprar imóvel físico, evite financiamento caro - ou negocie forte desconto à vista. FIIs de tijolo (logística, shoppings) podem ser boas opções para quem acredita na queda de juros, mas prepare-se para volatilidade. Uma mudança tributária (possível IR de 5% sobre dividendos) está no radar para 2026 - fique atento.`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>FIIs (IFIX)</th><th>Imóvel Físico</th></tr>
          <tr><td>Capital mínimo</td><td class="positivo">~R$100</td><td class="negativo">R$200.000+</td></tr>
          <tr><td>Liquidez</td><td class="positivo">Alta (D+2)</td><td class="negativo">Baixa (meses para vender)</td></tr>
          <tr><td>Diversificação</td><td class="positivo">Fácil (várias cotas)</td><td class="negativo">Difícil (capital concentrado)</td></tr>
          <tr><td>Gestão necessária</td><td class="positivo">Nenhuma</td><td class="negativo">Alta (inquilinos, manutenção)</td></tr>
          <tr><td>Controle sobre o ativo</td><td class="negativo">Nenhum</td><td class="positivo">Total</td></tr>
          <tr><td>Alavancagem (financiamento)</td><td class="negativo">Não disponível</td><td>Até 80% (mas juros de ~12% a.a.)</td></tr>
          <tr><td>IR sobre rendimentos</td><td class="positivo">Isento (pode mudar p/ 5%)</td><td class="negativo">Tributado (27,5% aluguel)</td></tr>
          <tr><td>IR sobre ganho de capital</td><td>20%</td><td>15% (pode isentar)</td></tr>
          <tr><td>Dividend yield atual</td><td class="positivo">~10-12% a.a.</td><td>~4-6% a.a. líquido</td></tr>
          <tr><td>Valorização 2025</td><td class="negativo">IFIX pressionado pela Selic</td><td class="positivo">+8% nominal (FIPEZAP)</td></tr>
          <tr><td>Risco de vacância</td><td class="positivo">Diluído (muitos imóveis)</td><td class="negativo">Concentrado (1 imóvel)</td></tr>
          <tr><td>Sensibilidade a juros</td><td>Alta (valoriza se Selic cair)</td><td>Moderada</td></tr>
          <tr><td>Uso próprio</td><td class="negativo">Não</td><td class="positivo">Sim</td></tr>
        </table>`
    },
    'dolar-ouro': {
      contexto: `
        <p><strong>Dois Pilares de Proteção Patrimonial (Cenário 2026)</strong></p>
        <p>Tanto o dólar quanto o ouro são considerados "ativos de proteção" - refúgios em momentos de crise. Em 2025, o ouro teve desempenho espetacular (+65%), enquanto o dólar teve comportamento misto. O que isso significa para 2026?</p>

        <p><strong>Dólar: A Moeda de Reserva Mundial</strong></p>
        <ul>
          <li><strong>Dominância global:</strong> ~60% das reservas cambiais mundiais ainda são em dólar</li>
          <li><strong>Flight to quality:</strong> Em crises, investidores correm para o dólar</li>
          <li><strong>Proteção contra Brasil:</strong> Em crises locais, o real desvaloriza e o dólar sobe</li>
          <li><strong>Rende juros:</strong> Treasury ainda paga ~4,25-4,50% a.a. (Fed em janeiro 2026)</li>
        </ul>

        <p><strong>Ouro: O Ativo Que Brilhou em 2025</strong></p>
        <ul>
          <li><strong>Performance histórica:</strong> +65% em 2025 - melhor ano desde a era Jimmy Carter</li>
          <li><strong>Novo recorde:</strong> Ultrapassou US$4.000/oz pela primeira vez, chegando a US$4.500</li>
          <li><strong>Compra recorde de BCs:</strong> Bancos centrais compraram +1.000 toneladas/ano nos últimos 3 anos</li>
          <li><strong>Geopolítica:</strong> Congelamento de reservas russas acelerou diversificação para ouro</li>
        </ul>

        <p><strong>A Mudança Estrutural</strong></p>
        <p>Após o congelamento das reservas russas em 2022, bancos centrais (especialmente China, Índia, Turquia) aumentaram significativamente suas compras de ouro. Pela primeira vez desde 1996, o ouro superou os títulos do Tesouro americano nas reservas de bancos centrais. É uma mudança geopolítica profunda.</p>`,
      pontoChave: `<strong>O que mudou:</strong> Antes de 2022, o dólar era o "porto seguro" indiscutível. Após o congelamento de reservas russas e a fragmentação geopolítica, o ouro ganhou relevância como ativo verdadeiramente neutro. Bancos centrais estão diversificando suas reservas de dólar para ouro. JPMorgan projeta ouro a US$5.000/oz até fim de 2026.`,
      reflexao: `<strong>Nossa Tese:</strong> O momento é de ter ambos, mas o ouro ganhou protagonismo. Com a fragmentação do sistema financeiro global, ter parte do patrimônio em um ativo que não pode ser congelado por nenhum governo faz cada vez mais sentido. Sugestão: 15-20% em dólar (proteção contra Brasil + rendimento) e 5-10% em ouro (proteção contra cenários extremos). A soma protege contra a maioria dos riscos.`,
      tabelaComparativa: `
        <table class="tabela-comparativa">
          <tr><th>Característica</th><th>Dólar</th><th>Ouro</th></tr>
          <tr><td>Tipo de ativo</td><td>Moeda fiduciária</td><td>Commodity / metal precioso</td></tr>
          <tr><td>Performance 2025</td><td>Mista (variou por período)</td><td class="positivo">+65% (melhor em 50 anos)</td></tr>
          <tr><td>Dependência</td><td class="negativo">Governo dos EUA / Fed</td><td class="positivo">Nenhuma (neutro)</td></tr>
          <tr><td>Rende juros</td><td class="positivo">Sim (Treasury ~4,25%)</td><td class="negativo">Não</td></tr>
          <tr><td>Pode ser congelado</td><td class="negativo">Sim (reservas russas 2022)</td><td class="positivo">Não (ativo físico)</td></tr>
          <tr><td>Demanda de BCs</td><td class="negativo">Reduzindo % nas reservas</td><td class="positivo">+1.000 ton/ano (recorde)</td></tr>
          <tr><td>Proteção contra crise BR</td><td class="positivo">Excelente</td><td class="positivo">Muito boa</td></tr>
          <tr><td>Proteção contra crise global</td><td class="positivo">Boa</td><td class="positivo">Excelente</td></tr>
          <tr><td>Proteção contra inflação</td><td class="negativo">Fraca</td><td class="positivo">Forte (histórica)</td></tr>
          <tr><td>Liquidez no Brasil</td><td class="positivo">Alta (fundos, BDRs)</td><td class="positivo">Alta (ETFs, fundos)</td></tr>
          <tr><td>Projeções 2026</td><td>Estável ou queda leve</td><td class="positivo">US$5.000/oz (JPMorgan)</td></tr>
          <tr><td>Histórico</td><td>~80 anos (pós Bretton Woods)</td><td class="positivo">5.000+ anos</td></tr>
        </table>`
    }
  },

  init() {
    this.bindNavigation();
    this.bindAssetChips();
    this.bindDueloButtons();
    this.bindDueloFilters();
    this.bindPresets();
    this.bindAllocationSliders();
    this.bindPatternButtons();
    this.bindPeriodButtons();
    this.bindRunButtons();
    this.bindToggleButtons();
    this.applyPercentageMasks();
    this.applyCurrencyMasks();
    this.bindPortfolioEvents();
    this.bindHistoricoSliders();
    this.handleUrlHash();
    this.waitForData();
  },

  // Handle URL hash to open specific tab (e.g., #calculadora)
  handleUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const tabBtn = document.querySelector(`.comp2-nav-btn[data-tab="${hash}"]`);
      if (tabBtn) {
        // Simulate click to switch tab
        document.querySelectorAll('.comp2-nav-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        document.querySelectorAll('.comp2-tab').forEach(t => t.classList.remove('active'));
        const tabEl = document.getElementById(`comp2-${hash}`);
        if (tabEl) tabEl.classList.add('active');
        this.currentTab = hash;
      }
    }
  },

  // Listen for portfolio updates from the user menu
  bindPortfolioEvents() {
    window.addEventListener('portfolioUpdated', () => {
      // If Carteira tab is active, reload portfolio
      if (this.currentTab === 'carteira') {
        this.loadSavedPortfolioToTab('comp2Allocation', 'allocTotal');
      } else if (this.currentTab === 'rebalancear') {
        this.loadSavedPortfolioToTab('comp2RebalAllocation', 'comp2RebalTotal', '#comp2RebalPresets');
      }
    });
  },

  // Função auxiliar para parsear período (YYYY-MM) para objeto {ano, mes}
  parsePeriodo(valor) {
    const [ano, mes] = valor.split('-').map(Number);
    return { ano, mes };
  },

  // Filtrar dados mensais por período
  filtrarDadosMensais(periodoInicio, periodoFim) {
    const inicio = this.parsePeriodo(periodoInicio);
    const fim = this.parsePeriodo(periodoFim);

    return Comparador.dadosMensais.meses.filter(d => {
      const dataInicio = inicio.ano * 12 + inicio.mes;
      const dataFim = fim.ano * 12 + fim.mes;
      const dataMes = d.ano * 12 + d.mes;
      return dataMes >= dataInicio && dataMes <= dataFim;
    });
  },

  waitForData() {
    const checkData = () => {
      if (typeof Comparador !== 'undefined' && Comparador.dadosMensais && Comparador.dadosMensais.meses) {
        setTimeout(() => {
          this.showPattern('dotcom');
          // Auto-executar comparação histórica ao carregar
          this.compararHistorico();
        }, 300);
      } else {
        setTimeout(checkData, 100);
      }
    };
    checkData();
  },

  // Sliders reativas do Histórico + auto-comparar
  // Atualiza o preenchimento visual do slider (cor da esquerda)
  _updateSliderFill(range) {
    if (!range) return;
    const min = parseFloat(range.min) || 0;
    const max = parseFloat(range.max) || 100;
    const val = parseFloat(range.value) || 0;
    const pct = ((val - min) / (max - min)) * 100;
    range.style.setProperty('--fill', pct + '%');
  },

  // Atualiza fill de todos os sliders do histórico
  _updateAllSliderFills() {
    document.querySelectorAll('#comp2-historico .comp2-range').forEach(r => this._updateSliderFill(r));
  },

  bindHistoricoSliders() {
    let debounce = null;
    const autoCompare = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.compararHistorico(), 150);
    };

    const valRange = document.getElementById('comp2ValorRange');
    const valDisplay = document.getElementById('comp2ValorDisplay');
    const valHidden = document.getElementById('comp2Valor');
    const valEdit = document.getElementById('comp2ValorEdit');
    const valManual = document.querySelector('.comp2-input-manual');

    if (valRange) {
      // Step dinâmico: 10k até 500k, 25k de 500k a 1M
      valRange.addEventListener('input', () => {
        let v = parseInt(valRange.value);
        // Snap to nice intervals
        if (v <= 500000) v = Math.round(v / 10000) * 10000;
        else v = Math.round(v / 25000) * 25000;
        valRange.value = v;
        valDisplay.textContent = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
        valHidden.value = v.toLocaleString('pt-BR');
        this._updateSliderFill(valRange);
        autoCompare();
      });
    }

    if (valEdit && valManual) {
      valEdit.addEventListener('click', () => {
        const isShowing = valManual.style.display !== 'none';
        valManual.style.display = isShowing ? 'none' : '';
        valRange.parentElement.style.display = isShowing ? '' : 'none';
      });
      valManual.addEventListener('input', () => {
        let raw = valManual.value.replace(/\D/g, '');
        if (raw) {
          const v = parseInt(raw);
          valManual.value = v.toLocaleString('pt-BR');
          valHidden.value = v.toLocaleString('pt-BR');
          if (v <= 1000000) { valRange.value = v; this._updateSliderFill(valRange); }
          valDisplay.textContent = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
        }
        autoCompare();
      });
    }

    // Helper para sliders de porcentagem
    const bindPctSlider = (rangeId, displayId, hiddenId, suffix) => {
      const range = document.getElementById(rangeId);
      const display = document.getElementById(displayId);
      const hidden = document.getElementById(hiddenId);
      if (!range) return;
      range.addEventListener('input', () => {
        const v = parseFloat(range.value);
        if (suffix === 'inflacao' && v === 0) {
          display.textContent = 'Histórica';
          hidden.value = '';
        } else {
          display.textContent = v.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + '%';
          hidden.value = v.toString().replace('.', ',');
        }
        this._updateSliderFill(range);
        autoCompare();
      });
    };

    // Dólar slider: só recalcula dólar no gráfico
    bindPctSlider('comp2DolarExtraRange', 'comp2DolarExtraDisplay', 'comp2DolarExtra', 'pct');
    // Imóveis slider: só recalcula imóveis no gráfico
    bindPctSlider('comp2ImoveisRendaRange', 'comp2ImoveisRendaDisplay', 'comp2ImoveisRenda', 'pct');
    // Inflação: afeta todos (muda retorno real)
    bindPctSlider('comp2InflacaoRange', 'comp2InflacaoDisplay', 'comp2InflacaoCustom', 'inflacao');

    // Auto-comparar ao mudar período
    document.querySelectorAll('.comp2-date-select select').forEach(sel => {
      sel.addEventListener('change', autoCompare);
    });

    // Chips: atualização incremental do gráfico (sem rebuild)
    document.querySelectorAll('#comp2-historico .comp2-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const asset = chip.dataset.asset;
        const isActive = chip.classList.contains('active');
        // O toggle já foi feito pelo bindAssetChips
        setTimeout(() => {
          if (this.charts.main && this._allResultados) {
            this._updateChartForChipToggle(asset, isActive);
            this._updateNonChartResults();
          } else {
            autoCompare();
          }
        }, 50);
      });
    });

    // Preencher todos os sliders na inicialização
    setTimeout(() => this._updateAllSliderFills(), 100);
  },

  // ==========================================
  // NAVEGAÇÃO E BINDINGS
  // ==========================================
  bindNavigation() {
    document.querySelectorAll('.comp2-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.comp2-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.comp2-tab').forEach(t => t.classList.remove('active'));
        const tabEl = document.getElementById(`comp2-${tab}`);
        if (tabEl) tabEl.classList.add('active');
        this.currentTab = tab;

        // Clear dropup active states when switching via main nav
        document.querySelectorAll('.comp2-dropup-btn').forEach(b => b.classList.remove('active'));
        const moreBtn = document.getElementById('comp2NavMore');
        if (moreBtn) {
          moreBtn.classList.remove('has-active');
        }

        // Auto-load saved portfolio when clicking on Carteira or Rebalancear tabs
        if (tab === 'carteira' && this.hasSavedPortfolio()) {
          this.loadSavedPortfolioToTab('comp2Allocation', 'allocTotal');
        } else if (tab === 'rebalancear' && this.hasSavedPortfolio()) {
          this.loadSavedPortfolioToTab('comp2RebalAllocation', 'comp2RebalTotal', '#comp2RebalPresets');
        }
      });
    });
  },

  // Load saved portfolio and activate "Minha Carteira" button
  loadSavedPortfolioToTab(containerId, totalElId, presetsSelector = '.comp2-presets:not(#comp2RebalPresets)') {
    const savedAllocation = this.getSavedPortfolio();
    if (savedAllocation && Object.keys(savedAllocation).length > 0) {
      // Apply allocation
      this.applyAllocation(savedAllocation, containerId, totalElId);

      // Apply extra yield fields
      const rawPortfolio = this.getRawPortfolio();
      if (rawPortfolio) {
        // Determine field IDs based on tab
        const isRebalTab = containerId === 'comp2RebalAllocation';
        const dolarExtraId = isRebalTab ? 'comp2RebalDolarExtra' : 'comp2CarteiraDolarExtra';

        // Fill Dólar extra yield
        const dolarExtraInput = document.getElementById(dolarExtraId);
        if (dolarExtraInput && rawPortfolio.dolar_extra) {
          dolarExtraInput.value = rawPortfolio.dolar_extra.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }
      }

      // Activate "Minha Carteira" button
      const presetsContainer = document.querySelector(presetsSelector);
      if (presetsContainer) {
        presetsContainer.querySelectorAll('.comp2-preset').forEach(b => b.classList.remove('active'));
        const myPortfolioBtn = presetsContainer.querySelector('[data-preset="myportfolio"]');
        if (myPortfolioBtn) myPortfolioBtn.classList.add('active');
      }
    }
  },

  // Get raw portfolio from localStorage (including extra yield values)
  getRawPortfolio() {
    try {
      const saved = localStorage.getItem('rico-portfolio');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  bindAssetChips() {
    document.querySelectorAll('.comp2-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });
  },

  bindDueloButtons() {
    document.querySelectorAll('.comp2-duelo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comp2-duelo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.iniciarDuelo();
      });
    });
  },

  // Bind filter changes to auto-recalculate duelo
  bindDueloFilters() {
    const self = this;

    // Debounce function to avoid too many recalculations
    let debounceTimer;
    const recalcularDuelo = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (self.currentTab === 'comparacao' && Comparador.dadosMensais?.meses) {
          self.iniciarDuelo();
        }
      }, 300);
    };

    // Date selects for Duelo tab (inside #comp2-comparacao)
    const dueloTab = document.getElementById('comp2-comparacao');
    if (dueloTab) {
      // Listen for changes on date-month and date-year selects
      dueloTab.querySelectorAll('.comp2-date-select .date-month, .comp2-date-select .date-year').forEach(select => {
        select.addEventListener('change', recalcularDuelo);
      });

      // Listen for changes on text inputs (valor, dolar extra, imoveis renda)
      const valorInput = document.getElementById('comp2DueloValor');
      const dolarExtraInput = document.getElementById('comp2DueloDolarExtra');
      const imoveisRendaInput = document.getElementById('comp2DueloImoveisRenda');

      [valorInput, dolarExtraInput, imoveisRendaInput].forEach(input => {
        if (input) {
          // Use 'change' for when user finishes editing, 'blur' as backup
          input.addEventListener('change', recalcularDuelo);
          input.addEventListener('blur', recalcularDuelo);
        }
      });
    }
  },

  bindPresets() {
    // Carteira tab presets
    document.querySelectorAll('.comp2-presets:not(#comp2RebalPresets) .comp2-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.comp2-presets').querySelectorAll('.comp2-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(btn.dataset.preset, 'comp2Allocation', 'allocTotal');
      });
    });

    // Rebalancear tab presets
    document.querySelectorAll('#comp2RebalPresets .comp2-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#comp2RebalPresets .comp2-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(btn.dataset.preset, 'comp2RebalAllocation', 'comp2RebalTotal');
      });
    });
  },

  bindAllocationSliders() {
    // Carteira tab sliders
    document.querySelectorAll('#comp2Allocation input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const item = e.target.closest('.alloc-item');
        const pctEl = item.querySelector('.alloc-pct');
        pctEl.textContent = `${e.target.value}%`;
        this.updateAllocationTotal('comp2Allocation', 'allocTotal');
      });
    });

    // Rebalancear tab sliders
    document.querySelectorAll('#comp2RebalAllocation input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const item = e.target.closest('.alloc-item');
        const pctEl = item.querySelector('.alloc-pct');
        pctEl.textContent = `${e.target.value}%`;
        this.updateAllocationTotal('comp2RebalAllocation', 'comp2RebalTotal');
      });
    });
  },

  updateAllocationTotal(containerId, totalElId) {
    let total = 0;
    document.querySelectorAll(`#${containerId} input[type="range"]`).forEach(slider => {
      total += parseInt(slider.value) || 0;
    });
    const totalEl = document.getElementById(totalElId);
    if (totalEl) {
      totalEl.textContent = `${total}%`;
      totalEl.style.color = total === 100 ? 'var(--bullish)' : total > 100 ? 'var(--bearish)' : 'var(--text-primary)';
    }
  },

  bindPatternButtons() {
    document.querySelectorAll('.comp2-pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comp2-pattern-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.showPattern(btn.dataset.pattern);
      });
    });
  },

  bindPeriodButtons() {
    document.querySelectorAll('.comp2-period-btns button').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.comp2-period-btns');
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Re-executar duelo com novo período
        this.iniciarDuelo();
      });
    });
  },

  bindRunButtons() {
    document.getElementById('comp2BtnRun')?.addEventListener('click', () => this.compararHistorico());
    document.getElementById('comp2BtnDuelo')?.addEventListener('click', () => this.iniciarDuelo());
    document.getElementById('comp2BtnCarteira')?.addEventListener('click', () => this.simularCarteira());
    document.getElementById('comp2BtnRebal')?.addEventListener('click', () => this.simularRebalanceamento());
  },

  bindToggleButtons() {
    document.querySelectorAll('.comp2-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.comp2-toggle');
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.dataset.view;
        // Atualizar dados do gráfico sem rebuild (só muda nominal/real)
        if (this._chartData && this.charts.main) {
          this._syncChartDatasets(this._chartData.resultados, this._chartData.dadosFiltrados);
        } else if (this._chartData) {
          this.renderChartEvolucao(this._chartData.resultados, this._chartData.dadosFiltrados, this._chartData.valorInicial);
        }
      });
    });
  },

  // Asset name mapping from portfolio modal to comparador
  portfolioToComparadorMap: {
    dolar: 'dolar',
    caixa: 'cdi',
    tlt: 'tlt_brl',
    imoveis: 'imoveis_fipezap',
    fiis: 'fii_ifix',
    ipca: 'imab5',
    ibov: 'ibovespa',
    ibovtr: 'ibovtr',
    idiv: 'idiv',
    ouro: 'ouro',
    sp500: 'sp500_brl',
    bitcoin: 'bitcoin_brl'
  },

  // Get saved portfolio from localStorage and convert to comparador format
  getSavedPortfolio() {
    try {
      const saved = localStorage.getItem('rico-portfolio');
      if (!saved) return null;

      const portfolio = JSON.parse(saved);
      const comparadorAllocation = {};

      Object.entries(portfolio).forEach(([key, value]) => {
        // Skip extra yield keys (like dolar_extra)
        if (key.endsWith('_extra')) return;

        const comparadorKey = this.portfolioToComparadorMap[key];
        if (comparadorKey && value > 0) {
          comparadorAllocation[comparadorKey] = value;
        }
      });

      return comparadorAllocation;
    } catch (e) {
      console.error('Erro ao carregar carteira:', e);
      return null;
    }
  },

  // Check if user has saved portfolio
  hasSavedPortfolio() {
    try {
      const saved = localStorage.getItem('rico-portfolio');
      return saved !== null && saved !== '{}';
    } catch (e) {
      return false;
    }
  },

  applyPreset(preset, containerId = 'comp2Allocation', totalElId = 'allocTotal') {
    // Handle 'myportfolio' preset
    if (preset === 'myportfolio') {
      const savedAllocation = this.getSavedPortfolio();
      if (savedAllocation && Object.keys(savedAllocation).length > 0) {
        this.applyAllocation(savedAllocation, containerId, totalElId);

        // Also apply extra yield fields
        const rawPortfolio = this.getRawPortfolio();
        if (rawPortfolio) {
          const isRebalTab = containerId === 'comp2RebalAllocation';
          const dolarExtraId = isRebalTab ? 'comp2RebalDolarExtra' : 'comp2CarteiraDolarExtra';

          const dolarExtraInput = document.getElementById(dolarExtraId);
          if (dolarExtraInput && rawPortfolio.dolar_extra) {
            dolarExtraInput.value = rawPortfolio.dolar_extra.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        }
      } else {
        // No portfolio saved - open portfolio modal if available
        if (typeof window.openPortfolioModal === 'function') {
          window.openPortfolioModal();
        } else {
          alert('Nenhuma carteira salva. Configure sua carteira no menu do usuário.');
        }
      }
      return;
    }

    const presets = {
      '5050': { ibovespa: 50, cdi: 50 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25 },
      'global': { ibovespa: 25, cdi: 25, sp500_brl: 25, tlt_brl: 25 }
    };
    const allocation = presets[preset];
    if (!allocation) return;

    this.applyAllocation(allocation, containerId, totalElId);
  },

  // Apply allocation to sliders
  applyAllocation(allocation, containerId = 'comp2Allocation', totalElId = 'allocTotal') {
    document.querySelectorAll(`#${containerId} input[type="range"]`).forEach(slider => {
      const asset = slider.dataset.asset;
      const value = allocation[asset] || 0;
      slider.value = value;
      const item = slider.closest('.alloc-item');
      const pctEl = item.querySelector('.alloc-pct');
      if (pctEl) pctEl.textContent = `${value}%`;
    });
    this.updateAllocationTotal(containerId, totalElId);
  },

  // ==========================================
  // FUNÇÕES AUXILIARES (iguais ao Comparador)
  // ==========================================
  parseCurrency(value) {
    if (!value || value === '') return 0;
    return parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;
  },

  parsePercentage(value) {
    if (!value || value === '') return 0;
    return parseFloat(value.toString().replace(',', '.')) || 0;
  },

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  },

  formatPercent(value, decimals = 2) {
    return value.toFixed(decimals) + '%';
  },

  // Máscara para campos de porcentagem (ex: 4,50)
  maskPercentage(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d]/g, '');
      if (value === '') { e.target.value = ''; return; }
      let numValue = parseInt(value, 10);
      if (numValue > 9999) numValue = 9999; // Máximo 99,99%
      e.target.value = (numValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });

    // Formatar valor inicial se existir
    if (input.value && input.value !== '') {
      const numValue = parseFloat(input.value.toString().replace(',', '.'));
      if (!isNaN(numValue)) {
        input.value = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  },

  // Aplicar máscaras em todos os campos de porcentagem
  applyPercentageMasks() {
    const percentageInputIds = [
      // Aba Histórico
      'comp2DolarExtra',
      'comp2RendaMaisTaxa',
      'comp2ImoveisRenda',
      'comp2InflacaoCustom',
      // Aba Duelo
      'comp2DueloDolarExtra',
      'comp2DueloRendaMaisTaxa',
      'comp2DueloImoveisRenda',
      'comp2DueloInflacaoCustom',
      // Aba Carteira
      'comp2CarteiraDolarExtra',
      'comp2CarteiraImoveisRenda',
      'comp2CarteiraInflacaoCustom',
      // Aba Rebalancear
      'comp2RebalDolarExtra',
      'comp2RebalImoveisRenda',
      'comp2RebalInflacaoCustom',
      'comp2Tolerancia'
    ];

    percentageInputIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskPercentage(input);
    });
  },

  // Máscara para campos monetários (formato brasileiro: 100.000)
  maskCurrency(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value;
      // Remove tudo exceto dígitos
      value = value.replace(/\D/g, '');
      // Formata com pontos como separador de milhar
      if (value) {
        value = parseInt(value, 10).toLocaleString('pt-BR');
      }
      e.target.value = value;
    });

    // Formatar valor inicial
    let initialValue = input.value.replace(/\D/g, '');
    if (initialValue) {
      input.value = parseInt(initialValue, 10).toLocaleString('pt-BR');
    }
  },

  // Aplicar máscaras em todos os campos monetários
  applyCurrencyMasks() {
    const currencyInputIds = [
      'comp2Valor',
      'comp2DueloValor',
      'comp2CarteiraValor',
      'comp2RebalValor'
    ];

    currencyInputIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskCurrency(input);
    });
  },

  calcularInflacaoAcumulada(dados, inflacaoCustom = 0) {
    let acumulada = 1;
    // Se inflação customizada, converter taxa anual para mensal
    const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;
    dados.forEach(d => {
      const inflacaoMes = inflacaoCustom > 0 ? inflacaoMensalCustom : d.inflacao_ipca;
      acumulada *= (1 + inflacaoMes / 100);
    });
    return (acumulada - 1) * 100;
  },

  /**
   * Simula o retorno do Tesouro Renda+ 2065 (título de longo prazo)
   * Baseado na variação das taxas de juros (SELIC) e na duration do título
   *
   * Duration modificada do Renda+ 2065: aproximadamente 15-18 anos
   * Fórmula: Retorno = Cupom + Variação de Preço
   *   - Cupom = IPCA + Taxa Fixa (ex: 6%)
   *   - Variação de Preço ≈ -Duration × (Taxa_final - Taxa_inicial)
   *
   * Quando SELIC sobe: preço cai (variação negativa)
   * Quando SELIC cai: preço sobe (variação positiva)
   */

  /**
   * Obtém o retorno de um ativo, aplicando ajustes quando necessário
   */
  getRetornoAjustado(ativo, dadoAno, dolarExtra = 0, dadoAnoAnterior = null) {
    // Obter retorno base do ativo
    let retorno = dadoAno[ativo];
    if (retorno === null || retorno === undefined) retorno = 0;

    // Aplicar ajuste extra para o dólar (converter taxa anual para mensal)
    if (ativo === 'dolar' && dolarExtra > 0) {
      // Converter taxa anual para mensal: (1 + taxa_anual)^(1/12) - 1
      const taxaMensal = Math.pow(1 + dolarExtra / 100, 1/12) - 1;
      // Composição: (1 + retorno_dolar) × (1 + rendimento_mensal) - 1
      const retornoComposto = (1 + retorno / 100) * (1 + taxaMensal) - 1;
      retorno = retornoComposto * 100;
    }

    // Aplicar ajuste para imóveis (rendimento de aluguel)
    if (ativo === 'imoveis_fipezap') {
      const imoveisRenda = this.ajustes.imoveisRenda || 0;

      if (imoveisRenda !== 0) {
        // Converter taxa anual para mensal: (1 + taxa_anual)^(1/12) - 1
        const taxaMensal = Math.pow(1 + imoveisRenda / 100, 1/12) - 1;
        // Composição: (1 + valorização) × (1 + renda_mensal) - 1
        const retornoComposto = (1 + retorno / 100) * (1 + taxaMensal) - 1;
        retorno = retornoComposto * 100;
      }
    }

    return retorno;
  },

  calcularEvolucao(ativo, dados, valorInicial, dolarExtra = 0, inflacaoCustom = 0) {
    // Usar periodo para dados mensais
    const primeiroRegistro = dados[0];
    const periodoInicial = primeiroRegistro.periodo || `${primeiroRegistro.ano}`;
    const evolucao = [{ periodo: 'Início', nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;
    // Se inflação customizada, converter taxa anual para mensal
    const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;

    dados.forEach((d, index) => {
      // Obter dado do mês anterior para cálculos que precisam de variação
      const dadoAnterior = index > 0 ? dados[index - 1] : null;

      // Usar função de retorno ajustado
      const retorno = this.getRetornoAjustado(ativo, d, dolarExtra, dadoAnterior);

      valorNominal *= (1 + retorno / 100);
      // Usar inflação customizada se informada, senão usar a histórica
      const inflacaoMes = inflacaoCustom > 0 ? inflacaoMensalCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoMes / 100);

      evolucao.push({
        periodo: d.periodo || `${d.ano}`,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada
      });
    });

    const retornoNominal = ((valorNominal / valorInicial) - 1) * 100;
    const valorReal = valorNominal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;

    // Calcular retornos mensais para média
    const retornosMensais = [];
    for (let i = 1; i < evolucao.length; i++) {
      const retMensal = ((evolucao[i].nominal / evolucao[i-1].nominal) - 1) * 100;
      retornosMensais.push(retMensal);
    }

    // Média mensal simples
    const mediaMensal = retornosMensais.length > 0
      ? retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length
      : 0;

    // Retorno anualizado (CAGR - Compound Annual Growth Rate)
    const numMeses = dados.length;
    const numAnos = numMeses / 12;
    const retornoAnualizado = numAnos > 0
      ? (Math.pow(valorNominal / valorInicial, 1 / numAnos) - 1) * 100
      : 0;

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorReal,
      retornoNominal,
      retornoReal,
      mediaMensal,
      retornoAnualizado,
      ganhouDaInflacao: retornoReal > 0
    };
  },

  calcularVolatilidade(retornos) {
    if (retornos.length < 2) return 0;
    const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const somaQuadrados = retornos.reduce((acc, r) => acc + Math.pow(r - media, 2), 0);
    return Math.sqrt(somaQuadrados / (retornos.length - 1));
  },

  // ==========================================
  // ABA 1: COMPARADOR HISTÓRICO
  // ==========================================
  // Lista de todos os ativos possíveis
  _allAssets: ['ibovespa', 'ibovtr', 'dolar', 'ouro', 'fii_ifix', 'idiv', 'cdi', 'imab5', 'sp500_brl', 'tlt_brl', 'imoveis_fipezap', 'bitcoin_brl'],
  _allResultados: null,
  _lastPeriodo: null,

  compararHistorico() {
    if (!Comparador.dadosMensais?.meses) return;

    const periodoInicio = document.getElementById('comp2PeriodoInicio')?.value || '2011-01';
    const periodoFim = document.getElementById('comp2PeriodoFim')?.value || '2025-12';
    const valorStr = document.getElementById('comp2Valor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

    const dolarExtra = this.parsePercentage(document.getElementById('comp2DolarExtra')?.value) || 0;
    const imoveisRenda = this.parsePercentage(document.getElementById('comp2ImoveisRenda')?.value) || 0;
    const inflacaoCustom = this.parsePercentage(document.getElementById('comp2InflacaoCustom')?.value) || 0;

    this.ajustes.dolarExtra = dolarExtra;
    this.ajustes.imoveisRenda = imoveisRenda;
    this.ajustes.inflacaoCustom = inflacaoCustom;

    const dadosFiltrados = this.filtrarDadosMensais(periodoInicio, periodoFim);
    if (dadosFiltrados.length === 0) return;

    // Calcular TODOS os ativos (não só os selecionados)
    const allResultados = {};
    const inflacaoAcumulada = this.calcularInflacaoAcumulada(dadosFiltrados, inflacaoCustom);

    this._allAssets.forEach(ativo => {
      allResultados[ativo] = this.calcularEvolucao(ativo, dadosFiltrados, valorInicial, dolarExtra, inflacaoCustom);
    });

    this._allResultados = allResultados;
    this._lastDados = dadosFiltrados;
    this._lastValorInicial = valorInicial;
    this._lastInflacao = inflacaoAcumulada;

    // Pegar ativos selecionados
    const ativosSelecionados = [];
    document.querySelectorAll('#comp2-historico .comp2-chip.active').forEach(chip => {
      ativosSelecionados.push(chip.dataset.asset);
    });

    // Filtrar resultados dos selecionados
    const resultados = {};
    ativosSelecionados.forEach(a => { if (allResultados[a]) resultados[a] = allResultados[a]; });

    this._chartData = { resultados, dadosFiltrados, valorInicial };

    const resultsContainer = document.getElementById('comp2Results');
    if (resultsContainer) resultsContainer.style.display = 'block';

    // Verificar se período mudou (precisa rebuild do chart)
    const periodoKey = periodoInicio + '-' + periodoFim;
    const needsRebuild = !this.charts.main || this._lastPeriodo !== periodoKey;
    this._lastPeriodo = periodoKey;

    if (needsRebuild) {
      this.renderChartEvolucao(resultados, dadosFiltrados, valorInicial);
    } else {
      this._syncChartDatasets(resultados, dadosFiltrados);
    }

    this.renderRanking(resultados, inflacaoAcumulada);
    this.renderStats(resultados, inflacaoAcumulada);
    this.renderConclusoes(resultados, inflacaoAcumulada);
  },

  // Atualização incremental: adicionar/remover dataset por chip toggle
  _updateChartForChipToggle(asset, wasActive) {
    const chart = this.charts.main;
    if (!chart || !this._allResultados) return;

    const isNowActive = document.querySelector(`.comp2-chip[data-asset="${asset}"]`)?.classList.contains('active');

    if (isNowActive && this._allResultados[asset]) {
      // Adicionar dataset
      const data = this._allResultados[asset];
      const values = data.evolucao.map(e => this.viewMode === 'real' ? e.real : e.nominal);
      chart.data.datasets.push({
        label: Comparador.assetNames[asset] || asset,
        data: values,
        borderColor: Comparador.chartColors[asset] || '#888',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2.5,
        _asset: asset
      });
    } else {
      // Remover dataset
      const idx = chart.data.datasets.findIndex(ds => ds._asset === asset || ds.label === (Comparador.assetNames[asset] || asset));
      if (idx >= 0) chart.data.datasets.splice(idx, 1);
    }

    chart.update('none'); // Sem animação de rebuild

    // Atualizar _chartData para o toggle nominal/real
    const resultados = {};
    document.querySelectorAll('#comp2-historico .comp2-chip.active').forEach(chip => {
      const a = chip.dataset.asset;
      if (this._allResultados[a]) resultados[a] = this._allResultados[a];
    });
    this._chartData = { resultados, dadosFiltrados: this._lastDados, valorInicial: this._lastValorInicial };
  },

  // Atualizar resultados não-gráfico (ranking, stats, conclusões)
  _updateNonChartResults() {
    if (!this._allResultados || !this._lastInflacao) return;
    const resultados = {};
    document.querySelectorAll('#comp2-historico .comp2-chip.active').forEach(chip => {
      const a = chip.dataset.asset;
      if (this._allResultados[a]) resultados[a] = this._allResultados[a];
    });
    if (Object.keys(resultados).length === 0) return;
    this.renderRanking(resultados, this._lastInflacao);
    this.renderStats(resultados, this._lastInflacao);
    this.renderConclusoes(resultados, this._lastInflacao);
  },

  // Sincronizar datasets do chart quando sliders mudam (sem rebuild)
  _syncChartDatasets(resultados, dados) {
    const chart = this.charts.main;
    if (!chart) return;

    // Atualizar datasets existentes e adicionar/remover conforme necessário
    const activeAssets = Object.keys(resultados);
    const existingAssets = chart.data.datasets.map(ds => ds._asset);

    // Remover datasets que não estão mais ativos
    for (let i = chart.data.datasets.length - 1; i >= 0; i--) {
      if (!activeAssets.includes(chart.data.datasets[i]._asset)) {
        chart.data.datasets.splice(i, 1);
      }
    }

    // Atualizar ou adicionar datasets
    activeAssets.forEach(asset => {
      const data = resultados[asset];
      if (!data) return;
      const values = data.evolucao.map(e => this.viewMode === 'real' ? e.real : e.nominal);
      const existing = chart.data.datasets.find(ds => ds._asset === asset);

      if (existing) {
        existing.data = values;
      } else {
        chart.data.datasets.push({
          label: Comparador.assetNames[asset] || asset,
          data: values,
          borderColor: Comparador.chartColors[asset] || '#888',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2.5,
          _asset: asset
        });
      }
    });

    chart.update('none');
  },

  renderChartEvolucao(resultados, dados, valorInicial) {
    const container = document.getElementById('comp2Chart');
    if (!container) return;

    // Limpar placeholder
    container.innerHTML = '';

    // Criar canvas para Chart.js
    const canvas = document.createElement('canvas');
    canvas.id = 'comp2ChartCanvas';
    container.appendChild(canvas);

    // Destruir chart anterior
    if (this.charts.main) {
      this.charts.main.destroy();
    }

    // Usar período para labels (dados mensais)
    const periodos = ['Início', ...dados.map(d => d.periodo || `${d.ano}`)];
    const datasets = [];

    Object.entries(resultados).forEach(([ativo, data]) => {
      const values = data.evolucao.map(e => this.viewMode === 'real' ? e.real : e.nominal);
      datasets.push({
        label: Comparador.assetNames[ativo] || ativo,
        data: values,
        borderColor: Comparador.chartColors[ativo] || '#888',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2.5,
        _asset: ativo
      });
    });

    this.charts.main = new Chart(canvas, {
      type: 'line',
      data: { labels: periodos, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#c9d1d9', usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': ' + this.formatCurrency(ctx.parsed.y)
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e' } },
          y: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: { color: '#8b949e', callback: (v) => 'R$ ' + (v/1000).toFixed(0) + 'k' }
          }
        }
      }
    });
  },

  renderRanking(resultados, inflacaoAcumulada) {
    const container = document.getElementById('comp2Ranking');
    if (!container) return;

    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    let html = '';
    ranking.forEach((item, index) => {
      const color = Comparador.chartColors[item.ativo] || '#888';
      const isPositive = item.retornoReal > 0;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

      const mediaAnual = item.retornoAnualizado || 0;
      const mediaMes = item.mediaMensal || 0;

      html += `
        <div class="comp2-ranking-item ${isPositive ? 'positive' : 'negative'}">
          <span class="ranking-pos">${medal || (index + 1) + 'º'}</span>
          <div class="ranking-info">
            <span class="ranking-dot" style="background:${color}"></span>
            <span class="ranking-name">${Comparador.assetNames[item.ativo] || item.ativo}</span>
          </div>
          <div style="text-align: right;">
            <div class="ranking-return ${isPositive ? 'positivo' : 'negativo'}">
              ${isPositive ? '+' : ''}${this.formatPercent(item.retornoReal)} real
            </div>
            <div style="font-size: 0.85rem; color: var(--text-primary);">
              ${this.formatCurrency(item.valorFinalNominal)}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">
              ${this.formatPercent(item.retornoNominal)} nominal
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: 4px;">
              <span title="CAGR - Retorno anualizado composto">📈 ${mediaAnual >= 0 ? '+' : ''}${this.formatPercent(mediaAnual)} a.a.</span>
              <span style="margin-left: 8px;" title="Média aritmética mensal">📅 ${mediaMes >= 0 ? '+' : ''}${this.formatPercent(mediaMes)} a.m.</span>
            </div>
          </div>
        </div>
      `;
    });

    // Info inflação
    html += `
      <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid var(--border-color); margin-top: 8px;">
        Inflação acumulada no período: <strong style="color: var(--text-primary);">${this.formatPercent(inflacaoAcumulada)}</strong>
      </div>
    `;

    container.innerHTML = html;
  },

  renderStats(resultados, inflacaoAcumulada) {
    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    if (ranking.length === 0) return;

    const melhor = ranking[0];
    const pior = ranking[ranking.length - 1];

    const statMelhor = document.getElementById('statMelhor');
    const statPior = document.getElementById('statPior');
    const statInflacao = document.getElementById('statInflacao');

    if (statMelhor) statMelhor.textContent = Comparador.assetNames[melhor.ativo] || melhor.ativo;
    if (statPior) statPior.textContent = Comparador.assetNames[pior.ativo] || pior.ativo;
    if (statInflacao) statInflacao.textContent = this.formatPercent(inflacaoAcumulada);
  },

  renderConclusoes(resultados, inflacaoAcumulada) {
    const container = document.getElementById('comp2Conclusoes');
    const lista = document.getElementById('comp2ConclusoesLista');
    if (!container || !lista) return;

    const conclusoes = [];
    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    // Conclusão 1: Vencedor
    const vencedor = ranking[0];
    conclusoes.push({
      tipo: 'success',
      icon: '✅',
      texto: `<strong>${Comparador.assetNames[vencedor.ativo] || vencedor.ativo}</strong> foi o grande vencedor com retorno real de <strong>${this.formatPercent(vencedor.retornoReal)}</strong>.`
    });

    // Conclusão 2: Perdedores
    const perdedores = ranking.filter(r => r.retornoReal < 0);
    if (perdedores.length > 0) {
      const nomes = perdedores.map(p => Comparador.assetNames[p.ativo] || p.ativo).join(', ');
      conclusoes.push({
        tipo: 'error',
        icon: '❌',
        texto: `${nomes} <strong>perderam para a inflação</strong>, ou seja, destruíram valor real.`
      });
    }

    // Conclusão 3: Correlação dólar/ibovespa
    if (resultados.ibovespa && resultados.dolar) {
      const dolarNominal = resultados.dolar.retornoNominal;
      if (dolarNominal > 30) {
        conclusoes.push({
          tipo: 'warning',
          icon: '⚠️',
          texto: `O dólar subiu <strong>${this.formatPercent(dolarNominal)}</strong>. Parte da alta do Ibovespa pode ser apenas <strong>correção da desvalorização do real</strong>, não geração de valor.`
        });
      }
    }

    // Conclusão 4: Renda variável vs fixa
    const rv = ranking.filter(r => ['ibovespa', 'fii_ifix', 'sp500_brl'].includes(r.ativo));
    const rf = ranking.filter(r => ['cdi', 'tesouro_ipca'].includes(r.ativo));
    if (rv.length > 0 && rf.length > 0) {
      const mediaRV = rv.reduce((acc, r) => acc + r.retornoReal, 0) / rv.length;
      const mediaRF = rf.reduce((acc, r) => acc + r.retornoReal, 0) / rf.length;
      if (mediaRF > mediaRV) {
        conclusoes.push({
          tipo: 'info',
          icon: '📊',
          texto: `Neste período, a <strong>renda fixa superou a renda variável</strong> em média. Nem sempre correr mais risco compensa.`
        });
      }
    }

    // Conclusão 5: Bitcoin se presente
    if (resultados.bitcoin_brl && resultados.bitcoin_brl.retornoReal > 100) {
      conclusoes.push({
        tipo: 'warning',
        icon: '₿',
        texto: `Bitcoin teve retorno extraordinário de <strong>${this.formatPercent(resultados.bitcoin_brl.retornoReal)}</strong>, mas lembre-se da <strong>volatilidade extrema</strong> e das quedas de 70-80% em bear markets.`
      });
    }

    // Renderizar
    let html = '';
    conclusoes.forEach(c => {
      html += `
        <div class="conclusao-item ${c.tipo}">
          <span class="conclusao-icon">${c.icon}</span>
          <p>${c.texto}</p>
        </div>
      `;
    });

    lista.innerHTML = html;
    container.style.display = 'block';
  },

  // ==========================================
  // ABA 2: DUELO (FRENTE A FRENTE)
  // ==========================================
  iniciarDuelo() {
    if (!Comparador.dadosMensais?.meses) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    const dueloSelecionado = document.querySelector('.comp2-duelo-btn.active')?.dataset.duelo || 'ibov-sp500';

    // Usar os seletores de período
    const periodoInicio = document.getElementById('comp2DueloPeriodoInicio')?.value || '2011-01';
    const periodoFim = document.getElementById('comp2DueloPeriodoFim')?.value || '2025-12';

    const valorStr = document.getElementById('comp2DueloValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

    // Ler valores de ajuste
    const dolarExtra = this.parsePercentage(document.getElementById('comp2DueloDolarExtra')?.value) || 0;
    const imoveisRenda = this.parsePercentage(document.getElementById('comp2DueloImoveisRenda')?.value) || 0;
    const inflacaoCustom = this.parsePercentage(document.getElementById('comp2DueloInflacaoCustom')?.value) || 0;

    // Armazenar ajustes para uso em outras funções
    this.ajustes.dolarExtra = dolarExtra;
    this.ajustes.imoveisRenda = imoveisRenda;
    this.ajustes.inflacaoCustom = inflacaoCustom;

    const config = this.dueloConfigs[dueloSelecionado];
    if (!config) return;

    // Filtrar dados mensais pelo período
    const dadosPeriodo = this.filtrarDadosMensais(periodoInicio, periodoFim);

    if (dadosPeriodo.length === 0) {
      alert('Não há dados disponíveis para o período selecionado.');
      return;
    }

    // Calcular evolução para ambos os ativos
    const resultado1 = this.calcularEvolucaoDuelo(config.ativo1.key, dadosPeriodo, valorInicial, inflacaoCustom, dolarExtra);
    const resultado2 = this.calcularEvolucaoDuelo(config.ativo2.key, dadosPeriodo, valorInicial, inflacaoCustom, dolarExtra);

    // Armazenar para toggle
    this.dueloResultados = { config, resultado1, resultado2, valorInicial, periodoInicio, periodoFim, dadosPeriodo, dueloSelecionado, inflacaoCustom };

    // Renderizar todos os componentes
    this.renderPlacarDuelo(config, resultado1, resultado2);
    this.renderChartDuelo();
    this.renderTabelaDuelo(config, resultado1, resultado2);
    this.renderMetricasDuelo(config, resultado1, resultado2);
    this.renderAnaliseDuelo(dueloSelecionado);
    this.renderConclusaoDuelo(config, resultado1, resultado2);
  },

  calcularEvolucaoDuelo(ativoKey, dados, valorInicial, inflacaoCustom = 0, dolarExtra = 0) {
    const evolucao = [{ periodo: 'Início', nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;
    const retornosMensais = [];
    let mesesPositivos = 0;
    let maxDrawdown = 0;
    let peakValue = valorInicial;
    // Se inflação customizada, converter taxa anual para mensal
    const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;

    dados.forEach((d, index) => {
      // Obter dado do mês anterior para cálculos que precisam de variação
      const dadoAnterior = index > 0 ? dados[index - 1] : null;

      // Usar função de retorno ajustado
      const retorno = this.getRetornoAjustado(ativoKey, d, dolarExtra, dadoAnterior);

      retornosMensais.push(retorno);
      if (retorno > 0) mesesPositivos++;

      valorNominal *= (1 + retorno / 100);
      // Usar inflação customizada (já convertida para mensal) se informada, senão usar a histórica
      const inflacaoMes = inflacaoCustom > 0 ? inflacaoMensalCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoMes / 100);

      if (valorNominal > peakValue) peakValue = valorNominal;
      const drawdown = (peakValue - valorNominal) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      evolucao.push({
        periodo: d.periodo || `${d.ano}`,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada,
        retornoPeriodo: retorno
      });
    });

    const retornoNominal = ((valorNominal / valorInicial) - 1) * 100;
    const valorReal = valorNominal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const mediaMensal = retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length;
    const volatilidade = this.calcularVolatilidade(retornosMensais);

    // Agregar retornos por ano para a tabela
    const retornosPorAno = {};
    dados.forEach((d, i) => {
      const ano = d.ano;
      if (!retornosPorAno[ano]) {
        retornosPorAno[ano] = { retornos: [], inflacoes: [] };
      }
      retornosPorAno[ano].retornos.push(retornosMensais[i]);
      retornosPorAno[ano].inflacoes.push(d.inflacao_ipca || 0);
    });

    // Calcular retorno anual composto
    const anosDisponiveis = Object.keys(retornosPorAno).map(Number).sort((a, b) => a - b);
    const retornosAnuais = anosDisponiveis.map(ano => {
      const retornosDoAno = retornosPorAno[ano].retornos;
      // Retorno composto do ano
      let retornoComposto = 1;
      retornosDoAno.forEach(r => {
        retornoComposto *= (1 + r / 100);
      });
      return (retornoComposto - 1) * 100;
    });

    const inflacaoAnual = anosDisponiveis.map(ano => {
      const inflacoesDoAno = retornosPorAno[ano].inflacoes;
      let inflacaoComposta = 1;
      inflacoesDoAno.forEach(i => {
        inflacaoComposta *= (1 + i / 100);
      });
      return (inflacaoComposta - 1) * 100;
    });

    const anosPositivos = retornosAnuais.filter(r => r > 0).length;
    const mediaAnual = retornosAnuais.length > 0
      ? retornosAnuais.reduce((a, b) => a + b, 0) / retornosAnuais.length
      : 0;

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorReal,
      retornoNominal,
      retornoReal,
      mediaMensal,
      mediaAnual,
      volatilidade,
      maxDrawdown,
      mesesPositivos,
      totalMeses: dados.length,
      retornosMensais,
      retornosAnuais,
      inflacaoAnual,
      anosDisponiveis,
      anosPositivos,
      totalAnos: anosDisponiveis.length
    };
  },

  renderPlacarDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('comp2DueloResult');
    const placar = document.getElementById('comp2DueloPlacar');
    if (!container || !placar) return;

    // Mostrar o container de resultados
    container.style.display = 'block';

    const vencedor1 = resultado1.retornoReal > resultado2.retornoReal;
    const diferencaPercent = Math.abs(resultado1.retornoReal - resultado2.retornoReal);

    placar.innerHTML = `
      <div class="duelo-player ${vencedor1 ? 'winner' : ''}">
        <span class="player-icon">${config.ativo1.icone}</span>
        <span class="player-name">${config.ativo1.nome}</span>
        <span class="player-return ${resultado1.retornoReal >= 0 ? 'positivo' : 'negativo'}">
          ${resultado1.retornoReal >= 0 ? '+' : ''}${this.formatPercent(resultado1.retornoReal)} real
        </span>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${this.formatCurrency(resultado1.valorFinalReal)}
        </div>
        ${vencedor1 ? '<span class="winner-badge">VENCEDOR</span>' : ''}
      </div>
      <div class="duelo-vs-big">
        VS
        <div style="font-size: 0.7rem; margin-top: 8px; color: var(--text-muted);">
          Diferença: ${this.formatPercent(diferencaPercent)}
        </div>
      </div>
      <div class="duelo-player ${!vencedor1 ? 'winner' : ''}">
        <span class="player-icon">${config.ativo2.icone}</span>
        <span class="player-name">${config.ativo2.nome}</span>
        <span class="player-return ${resultado2.retornoReal >= 0 ? 'positivo' : 'negativo'}">
          ${resultado2.retornoReal >= 0 ? '+' : ''}${this.formatPercent(resultado2.retornoReal)} real
        </span>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          ${this.formatCurrency(resultado2.valorFinalReal)}
        </div>
        ${!vencedor1 ? '<span class="winner-badge">VENCEDOR</span>' : ''}
      </div>
    `;
  },

  renderTabelaDuelo(config, resultado1, resultado2) {
    const tabela = document.getElementById('comp2DueloTabela');
    if (!tabela) return;

    const thead = tabela.querySelector('thead');
    const tbody = tabela.querySelector('tbody');

    thead.innerHTML = `
      <tr>
        <th>Ano</th>
        <th>${config.ativo1.nome}</th>
        <th>${config.ativo2.nome}</th>
        <th>Inflação</th>
        <th>Vencedor</th>
      </tr>
    `;

    let html = '';
    resultado1.anosDisponiveis.forEach((ano, i) => {
      const retorno1 = resultado1.retornosAnuais[i];
      const retorno2 = resultado2.retornosAnuais[i];
      const inflacao = resultado1.inflacaoAnual[i];
      const vencedorAno = retorno1 > retorno2 ? config.ativo1.nome :
                         retorno2 > retorno1 ? config.ativo2.nome : 'Empate';

      html += `
        <tr>
          <td>${ano}</td>
          <td class="${retorno1 >= 0 ? 'text-green' : 'text-red'}">
            ${this.formatPercent(retorno1)}
          </td>
          <td class="${retorno2 >= 0 ? 'text-green' : 'text-red'}">
            ${this.formatPercent(retorno2)}
          </td>
          <td>${this.formatPercent(inflacao)}</td>
          <td><strong>${vencedorAno}</strong></td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  renderMetricasDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('comp2DueloMetricas');
    if (!container) return;

    container.innerHTML = `
      <div class="comp2-stats-grid">
        <div class="comp2-stat-box">
          <div class="stat-label">Retorno Nominal</div>
          <div class="stat-value">${config.ativo1.nome}: <span class="${resultado1.retornoNominal >= 0 ? 'positivo' : 'negativo'}">${this.formatPercent(resultado1.retornoNominal)}</span></div>
          <div class="stat-value">${config.ativo2.nome}: <span class="${resultado2.retornoNominal >= 0 ? 'positivo' : 'negativo'}">${this.formatPercent(resultado2.retornoNominal)}</span></div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Retorno Real</div>
          <div class="stat-value">${config.ativo1.nome}: <span class="${resultado1.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatPercent(resultado1.retornoReal)}</span></div>
          <div class="stat-value">${config.ativo2.nome}: <span class="${resultado2.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatPercent(resultado2.retornoReal)}</span></div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Média Anual</div>
          <div class="stat-value">${config.ativo1.nome}: ${this.formatPercent(resultado1.mediaAnual)}</div>
          <div class="stat-value">${config.ativo2.nome}: ${this.formatPercent(resultado2.mediaAnual)}</div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Volatilidade</div>
          <div class="stat-value">${config.ativo1.nome}: ${this.formatPercent(resultado1.volatilidade)}</div>
          <div class="stat-value">${config.ativo2.nome}: ${this.formatPercent(resultado2.volatilidade)}</div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Max Drawdown</div>
          <div class="stat-value negativo">${config.ativo1.nome}: -${this.formatPercent(resultado1.maxDrawdown)}</div>
          <div class="stat-value negativo">${config.ativo2.nome}: -${this.formatPercent(resultado2.maxDrawdown)}</div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Anos Positivos</div>
          <div class="stat-value">${config.ativo1.nome}: ${resultado1.anosPositivos}/${resultado1.totalAnos}</div>
          <div class="stat-value">${config.ativo2.nome}: ${resultado2.anosPositivos}/${resultado2.totalAnos}</div>
        </div>
      </div>
    `;
  },

  renderAnaliseDuelo(dueloKey) {
    const container = document.getElementById('comp2DueloAnaliseConteudo');
    if (!container) return;

    const analise = this.dueloAnalises[dueloKey];
    if (!analise) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="analise-contexto">
        ${analise.contexto}
      </div>
      <div class="analise-ponto-chave">
        <span class="ponto-chave-icon">💡</span>
        <p><strong>Ponto-chave:</strong> ${analise.pontoChave}</p>
      </div>
      ${analise.tabelaComparativa || ''}
      <div class="analise-reflexao">
        <p>${analise.reflexao}</p>
      </div>
    `;
  },

  renderConclusaoDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('comp2DueloConclusaoLista');
    if (!container) return;

    const vencedor = resultado1.retornoReal > resultado2.retornoReal ? config.ativo1 : config.ativo2;
    const perdedor = resultado1.retornoReal > resultado2.retornoReal ? config.ativo2 : config.ativo1;
    const resVencedor = resultado1.retornoReal > resultado2.retornoReal ? resultado1 : resultado2;
    const resPerdedor = resultado1.retornoReal > resultado2.retornoReal ? resultado2 : resultado1;

    const diferenca = Math.abs(resultado1.retornoReal - resultado2.retornoReal);
    const diferencaValor = Math.abs(resultado1.valorFinalReal - resultado2.valorFinalReal);

    // Contagem de vitórias anuais
    let vitorias1 = 0, vitorias2 = 0, empates = 0;
    resultado1.retornosAnuais.forEach((r, i) => {
      if (r > resultado2.retornosAnuais[i]) vitorias1++;
      else if (r < resultado2.retornosAnuais[i]) vitorias2++;
      else empates++;
    });

    const vitoriasMelhor = resultado1.retornoReal > resultado2.retornoReal ? vitorias1 : vitorias2;
    const vitoriasPior = resultado1.retornoReal > resultado2.retornoReal ? vitorias2 : vitorias1;

    // Análise de risco-retorno (Sharpe simplificado)
    const sharpe1 = resultado1.volatilidade > 0 ? resultado1.retornoReal / resultado1.volatilidade : 0;
    const sharpe2 = resultado2.volatilidade > 0 ? resultado2.retornoReal / resultado2.volatilidade : 0;
    const melhorRiscoRetorno = sharpe1 > sharpe2 ? config.ativo1 : config.ativo2;
    const piorRiscoRetorno = sharpe1 > sharpe2 ? config.ativo2 : config.ativo1;

    // Calcular CAGR
    const numAnos = resultado1.totalAnos || 1;
    const cagr1 = (Math.pow(resultado1.valorFinalReal / this.dueloResultados.valorInicial, 1/numAnos) - 1) * 100;
    const cagr2 = (Math.pow(resultado2.valorFinalReal / this.dueloResultados.valorInicial, 1/numAnos) - 1) * 100;

    // Menor drawdown é melhor
    const menorDrawdown = resultado1.maxDrawdown < resultado2.maxDrawdown ? config.ativo1 : config.ativo2;

    container.innerHTML = `
      <div class="conclusao-item success">
        <span class="conclusao-icon">🏆</span>
        <p><strong>${vencedor.nome}</strong> venceu com retorno real de <strong>${this.formatPercent(resVencedor.retornoReal)}</strong> (CAGR: ${this.formatPercent(resVencedor === resultado1 ? cagr1 : cagr2)} a.a.), contra ${this.formatPercent(resPerdedor.retornoReal)} do ${perdedor.nome}.</p>
      </div>
      <div class="conclusao-item info">
        <span class="conclusao-icon">💰</span>
        <p>Diferença final: <strong>${this.formatCurrency(diferencaValor)}</strong> (${this.formatPercent(diferenca)} de vantagem).</p>
      </div>
      <div class="conclusao-item info">
        <span class="conclusao-icon">📅</span>
        <p><strong>${vencedor.nome}</strong> venceu em <strong>${vitoriasMelhor}</strong> de ${resultado1.totalAnos} anos. ${perdedor.nome} venceu em ${vitoriasPior} anos${empates > 0 ? ` (${empates} empates)` : ''}.</p>
      </div>
      <div class="conclusao-item ${sharpe1 !== sharpe2 ? 'warning' : 'info'}">
        <span class="conclusao-icon">⚖️</span>
        <p><strong>${melhorRiscoRetorno.nome}</strong> teve melhor relação risco/retorno. Volatilidade: ${this.formatPercent(melhorRiscoRetorno === config.ativo1 ? resultado1.volatilidade : resultado2.volatilidade)} vs ${this.formatPercent(piorRiscoRetorno === config.ativo1 ? resultado1.volatilidade : resultado2.volatilidade)}.</p>
      </div>
      <div class="conclusao-item ${resultado1.maxDrawdown !== resultado2.maxDrawdown ? 'info' : ''}">
        <span class="conclusao-icon">📉</span>
        <p><strong>${menorDrawdown.nome}</strong> teve menor queda máxima (drawdown): ${this.formatPercent(menorDrawdown === config.ativo1 ? resultado1.maxDrawdown : resultado2.maxDrawdown)} vs ${this.formatPercent(menorDrawdown === config.ativo1 ? resultado2.maxDrawdown : resultado1.maxDrawdown)}.</p>
      </div>
      <div class="conclusao-item disclaimer">
        <span class="conclusao-icon">⚠️</span>
        <p>Resultados passados não garantem resultados futuros. Esta análise é apenas para fins educacionais.</p>
      </div>
    `;
  },

  renderChartDuelo() {
    if (!this.dueloResultados) return;

    const chartContainer = document.getElementById('comp2DueloChart');
    if (!chartContainer) return;

    const { config, resultado1, resultado2, dadosPeriodo } = this.dueloResultados;

    // Criar canvas
    chartContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    if (this.charts.duelo) {
      this.charts.duelo.destroy();
    }

    // Usar labels dos períodos da evolução
    const periodos = resultado1.evolucao.map(e => e.periodo);
    const view = this.dueloViewReal ? 'real' : 'nominal';

    this.charts.duelo = new Chart(canvas, {
      type: 'line',
      data: {
        labels: periodos,
        datasets: [
          {
            label: config.ativo1.nome,
            data: resultado1.evolucao.map(e => e[view]),
            borderColor: Comparador.chartColors[config.ativo1.key] || '#3b82f6',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2.5
          },
          {
            label: config.ativo2.nome,
            data: resultado2.evolucao.map(e => e[view]),
            borderColor: Comparador.chartColors[config.ativo2.key] || '#ef4444',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#c9d1d9' } },
          tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + this.formatCurrency(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e', callback: (v) => 'R$ ' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });
  },

  // ==========================================
  // ABA 3: CARTEIRA DIVERSIFICADA
  // ==========================================
  simularCarteira() {
    if (!Comparador.dadosMensais?.meses) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    const periodoInicio = document.getElementById('comp2CarteiraPeriodoInicio')?.value || '2011-01';
    const periodoFim = document.getElementById('comp2CarteiraPeriodoFim')?.value || '2025-12';
    const valorStr = document.getElementById('comp2CarteiraValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

    // Ler valores de ajuste
    const dolarExtra = this.parsePercentage(document.getElementById('comp2CarteiraDolarExtra')?.value) || 0;
    const imoveisRenda = this.parsePercentage(document.getElementById('comp2CarteiraImoveisRenda')?.value) || 0;
    const inflacaoCustom = this.parsePercentage(document.getElementById('comp2CarteiraInflacaoCustom')?.value) || 0;

    // Armazenar ajustes para uso em outras funções
    this.ajustes.dolarExtra = dolarExtra;
    this.ajustes.imoveisRenda = imoveisRenda;
    this.ajustes.inflacaoCustom = inflacaoCustom;

    // Coletar alocações (apenas da aba Carteira)
    const alocacao = {};
    let totalPct = 0;
    document.querySelectorAll('#comp2Allocation input[type="range"]').forEach(slider => {
      const pct = parseInt(slider.value) || 0;
      if (pct > 0) {
        alocacao[slider.dataset.asset] = pct / 100;
        totalPct += pct;
      }
    });

    if (totalPct === 0) {
      alert('Configure a alocação da carteira (total deve ser 100%).');
      return;
    }

    if (Math.abs(totalPct - 100) > 1) {
      alert(`A alocação total deve ser 100% (atual: ${totalPct}%)`);
      return;
    }

    // Filtrar dados mensais pelo período selecionado
    const dadosFiltrados = this.filtrarDadosMensais(periodoInicio, periodoFim);

    // Calcular evolução da carteira e ativos individuais
    // Todos começam do mesmo valor inicial para comparação justa no gráfico
    const resultados = { carteira: this.calcularEvolucaoCarteira(alocacao, dadosFiltrados, valorInicial, dolarExtra, inflacaoCustom) };

    Object.keys(alocacao).forEach(ativo => {
      resultados[ativo] = this.calcularEvolucao(ativo, dadosFiltrados, valorInicial, dolarExtra, inflacaoCustom);
    });

    const inflacaoAcumulada = this.calcularInflacaoAcumulada(dadosFiltrados, inflacaoCustom);

    // Mostrar container de resultados
    const resultsContainer = document.getElementById('comp2CarteiraResults');
    if (resultsContainer) resultsContainer.style.display = 'block';

    this.renderCarteiraResults(resultados, dadosFiltrados, valorInicial, inflacaoAcumulada, alocacao);
  },

  calcularEvolucaoCarteira(alocacao, dados, valorInicial, dolarExtra = 0, inflacaoCustom = 0) {
    const evolucao = [{ periodo: 'Início', nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;
    // Se inflação customizada, converter taxa anual para mensal
    const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;

    dados.forEach((d, index) => {
      // Obter dado do mês anterior para cálculos que precisam de variação
      const dadoAnterior = index > 0 ? dados[index - 1] : null;

      let retornoCarteira = 0;
      Object.entries(alocacao).forEach(([ativo, peso]) => {
        // Usar função de retorno ajustado
        const retorno = this.getRetornoAjustado(ativo, d, dolarExtra, dadoAnterior);
        retornoCarteira += retorno * peso;
      });

      valorNominal *= (1 + retornoCarteira / 100);
      // Usar inflação customizada (já convertida para mensal) se informada, senão usar a histórica
      const inflacaoMes = inflacaoCustom > 0 ? inflacaoMensalCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoMes / 100);

      evolucao.push({
        periodo: d.periodo || `${d.ano}`,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada
      });
    });

    // Calcular retornos mensais para média
    const retornosMensais = [];
    for (let i = 1; i < evolucao.length; i++) {
      const retMensal = ((evolucao[i].nominal / evolucao[i-1].nominal) - 1) * 100;
      retornosMensais.push(retMensal);
    }

    // Média mensal simples
    const mediaMensal = retornosMensais.length > 0
      ? retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length
      : 0;

    // Retorno anualizado (CAGR)
    const numMeses = dados.length;
    const numAnos = numMeses / 12;
    const retornoAnualizado = numAnos > 0
      ? (Math.pow(valorNominal / valorInicial, 1 / numAnos) - 1) * 100
      : 0;

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorNominal / inflacaoAcumulada,
      retornoNominal: ((valorNominal / valorInicial) - 1) * 100,
      retornoReal: ((valorNominal / inflacaoAcumulada / valorInicial) - 1) * 100,
      mediaMensal,
      retornoAnualizado
    };
  },

  renderCarteiraResults(resultados, dados, valorInicial, inflacaoAcumulada, alocacao) {
    const chartContainer = document.getElementById('comp2CarteiraChart');
    if (!chartContainer) return;

    // Limpar e criar canvas
    chartContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    if (this.charts.carteira) {
      this.charts.carteira.destroy();
    }

    // Usar período para labels (dados mensais)
    const periodos = ['Início', ...dados.map(d => d.periodo || `${d.ano}`)];
    const datasets = [];

    // Carteira primeiro (destaque)
    datasets.push({
      label: 'Carteira Diversificada',
      data: resultados.carteira.evolucao.map(e => e.nominal),
      borderColor: '#f59e0b',
      backgroundColor: 'transparent',
      tension: 0.3,
      borderWidth: 3,
      pointRadius: 3
    });

    // Ativos individuais
    Object.keys(alocacao).forEach(ativo => {
      if (resultados[ativo]) {
        datasets.push({
          label: Comparador.assetNames[ativo] || ativo,
          data: resultados[ativo].evolucao.map(e => e.nominal),
          borderColor: Comparador.chartColors[ativo] || '#888',
          backgroundColor: 'transparent',
          tension: 0.3,
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 1
        });
      }
    });

    this.charts.carteira = new Chart(canvas, {
      type: 'line',
      data: { labels: periodos, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#c9d1d9', usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + this.formatCurrency(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e', callback: (v) => 'R$ ' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });

    // Adicionar resumo
    const carteira = resultados.carteira;
    const statsContainer = document.getElementById('comp2CarteiraStats');
    const resumoCard = document.getElementById('comp2CarteiraResumo');
    if (statsContainer && resumoCard) {
      const mediaAnual = carteira.retornoAnualizado || 0;
      const mediaMes = carteira.mediaMensal || 0;

      statsContainer.innerHTML = `
        <div class="comp2-stat-box">
          <div class="stat-label">Valor Final</div>
          <div class="stat-value">${this.formatCurrency(carteira.valorFinalNominal)}</div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Retorno Nominal</div>
          <div class="stat-value ${carteira.retornoNominal >= 0 ? 'positivo' : 'negativo'}">
            ${carteira.retornoNominal >= 0 ? '+' : ''}${this.formatPercent(carteira.retornoNominal)}
          </div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Retorno Real</div>
          <div class="stat-value ${carteira.retornoReal >= 0 ? 'positivo' : 'negativo'}">
            ${carteira.retornoReal >= 0 ? '+' : ''}${this.formatPercent(carteira.retornoReal)}
          </div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Média Anual (CAGR)</div>
          <div class="stat-value ${mediaAnual >= 0 ? 'positivo' : 'negativo'}">
            ${mediaAnual >= 0 ? '+' : ''}${this.formatPercent(mediaAnual)}
          </div>
        </div>
        <div class="comp2-stat-box">
          <div class="stat-label">Média Mensal</div>
          <div class="stat-value ${mediaMes >= 0 ? 'positivo' : 'negativo'}">
            ${mediaMes >= 0 ? '+' : ''}${this.formatPercent(mediaMes)}
          </div>
        </div>
      `;
      resumoCard.style.display = 'block';
    }

    // Adicionar conclusões
    this.renderConclusoesCarteira(resultados, alocacao, inflacaoAcumulada);

    // Adicionar análise de diversificação
    this.renderAnaliseDiversificacao(resultados, alocacao);
  },

  renderConclusoesCarteira(resultados, alocacao, inflacaoAcumulada) {
    const container = document.getElementById('comp2CarteiraConclusoesLista');
    const card = document.getElementById('comp2CarteiraConclusoes');
    if (!container || !card) return;

    const conclusoes = [];
    const carteira = resultados.carteira;

    // Criar ranking dos ativos individuais
    const ranking = Object.keys(alocacao)
      .filter(ativo => resultados[ativo])
      .map(ativo => ({
        ativo,
        nome: Comparador.assetNames[ativo] || ativo,
        retornoReal: resultados[ativo].retornoReal,
        retornoNominal: resultados[ativo].retornoNominal
      }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    // Conclusão 1: Carteira vs melhor ativo
    if (ranking.length > 0) {
      const melhor = ranking[0];
      if (carteira.retornoReal > melhor.retornoReal) {
        conclusoes.push({
          tipo: 'success',
          icon: '🎯',
          texto: `A <strong>carteira diversificada superou</strong> todos os ativos individuais, incluindo ${melhor.nome}.`
        });
      } else {
        const diff = melhor.retornoReal - carteira.retornoReal;
        conclusoes.push({
          tipo: 'info',
          icon: '📊',
          texto: `<strong>${melhor.nome}</strong> foi o melhor ativo com ${this.formatPercent(melhor.retornoReal)} real, superando a carteira em ${this.formatPercent(diff)}.`
        });
      }
    }

    // Conclusão 2: Carteira vs inflação
    if (carteira.retornoReal > 0) {
      conclusoes.push({
        tipo: 'success',
        icon: '✅',
        texto: `A carteira <strong>bateu a inflação</strong> com retorno real de ${this.formatPercent(carteira.retornoReal)}.`
      });
    } else {
      conclusoes.push({
        tipo: 'error',
        icon: '❌',
        texto: `A carteira <strong>perdeu para a inflação</strong>. Retorno real de ${this.formatPercent(carteira.retornoReal)}.`
      });
    }

    // Conclusão 3: Ativos que perderam para inflação
    const perdedores = ranking.filter(r => r.retornoReal < 0);
    if (perdedores.length > 0 && perdedores.length < ranking.length) {
      const nomes = perdedores.map(p => p.nome).join(', ');
      conclusoes.push({
        tipo: 'warning',
        icon: '⚠️',
        texto: `${nomes} <strong>perderam para a inflação</strong> isoladamente, mas a diversificação amenizou o impacto.`
      });
    }

    // Conclusão 4: Benefício da diversificação
    if (ranking.length >= 2) {
      const pior = ranking[ranking.length - 1];
      if (carteira.retornoReal > pior.retornoReal) {
        conclusoes.push({
          tipo: 'info',
          icon: '🛡️',
          texto: `A <strong>diversificação protegeu</strong> você do pior cenário (${pior.nome}: ${this.formatPercent(pior.retornoReal)}).`
        });
      }
    }

    // Renderizar
    let html = '';
    conclusoes.forEach(c => {
      html += `
        <div class="conclusao-item ${c.tipo}">
          <span class="conclusao-icon">${c.icon}</span>
          <p>${c.texto}</p>
        </div>
      `;
    });

    container.innerHTML = html;
    card.style.display = 'block';
  },

  renderAnaliseDiversificacao(resultados, alocacao) {
    const container = document.getElementById('comp2DiversificacaoContent');
    const card = document.getElementById('comp2CarteiraDiversificacao');
    if (!container || !card) return;

    // Calcular volatilidade (desvio padrão dos retornos mensais)
    const calcularVolatilidade = (evolucao) => {
      if (!evolucao || evolucao.length < 2) return 0;
      const retornosMensais = [];
      for (let i = 1; i < evolucao.length; i++) {
        const retorno = ((evolucao[i].nominal / evolucao[i - 1].nominal) - 1) * 100;
        retornosMensais.push(retorno);
      }
      if (retornosMensais.length === 0) return 0;
      const media = retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length;
      const variancia = retornosMensais.reduce((acc, r) => acc + Math.pow(r - media, 2), 0) / retornosMensais.length;
      return Math.sqrt(variancia);
    };

    // Calcular máxima queda (drawdown)
    const calcularMaxDrawdown = (evolucao) => {
      if (!evolucao || evolucao.length < 2) return 0;
      let maxDrawdown = 0;
      let picoNominal = evolucao[0].nominal;
      for (let i = 1; i < evolucao.length; i++) {
        if (evolucao[i].nominal > picoNominal) {
          picoNominal = evolucao[i].nominal;
        }
        const drawdown = ((picoNominal - evolucao[i].nominal) / picoNominal) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      return maxDrawdown;
    };

    // Coletar dados de todos os ativos
    const carteira = resultados.carteira;
    const dadosAtivos = Object.keys(alocacao)
      .filter(ativo => resultados[ativo])
      .map(ativo => ({
        ativo,
        nome: Comparador.assetNames[ativo] || ativo,
        peso: alocacao[ativo],
        retornoReal: resultados[ativo].retornoReal,
        retornoNominal: resultados[ativo].retornoNominal,
        volatilidade: calcularVolatilidade(resultados[ativo].evolucao),
        maxDrawdown: calcularMaxDrawdown(resultados[ativo].evolucao)
      }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    const volatilidadeCarteira = calcularVolatilidade(carteira.evolucao);
    const maxDrawdownCarteira = calcularMaxDrawdown(carteira.evolucao);
    const volatilidadeMedia = dadosAtivos.reduce((acc, a) => acc + a.volatilidade * (a.peso / 100), 0);

    // Encontrar melhor e pior ativo
    const melhorAtivo = dadosAtivos[0];
    const piorAtivo = dadosAtivos[dadosAtivos.length - 1];
    const posicaoCarteira = dadosAtivos.filter(a => a.retornoReal >= carteira.retornoReal).length;

    // HTML da tabela de ativos
    let html = `
      <div class="diversificacao-tabela">
        <h4>Desempenho Individual dos Ativos</h4>
        <table class="tabela-ativos">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Peso</th>
              <th>Retorno Real</th>
              <th>Volatilidade</th>
              <th>Máx. Queda</th>
            </tr>
          </thead>
          <tbody>
            <tr class="linha-carteira">
              <td><strong>📊 Carteira</strong></td>
              <td>100%</td>
              <td class="${carteira.retornoReal >= 0 ? 'positivo' : 'negativo'}">
                ${carteira.retornoReal >= 0 ? '+' : ''}${this.formatPercent(carteira.retornoReal)}
              </td>
              <td>${this.formatPercent(volatilidadeCarteira)}</td>
              <td class="negativo">-${this.formatPercent(maxDrawdownCarteira)}</td>
            </tr>
    `;

    dadosAtivos.forEach((ativo, idx) => {
      const isMelhor = idx === 0;
      const isPior = idx === dadosAtivos.length - 1;
      const classeDestaque = isMelhor ? 'melhor-ativo' : (isPior ? 'pior-ativo' : '');
      html += `
        <tr class="${classeDestaque}">
          <td>${isMelhor ? '🏆 ' : (isPior ? '⚠️ ' : '')}${ativo.nome}</td>
          <td>${ativo.peso}%</td>
          <td class="${ativo.retornoReal >= 0 ? 'positivo' : 'negativo'}">
            ${ativo.retornoReal >= 0 ? '+' : ''}${this.formatPercent(ativo.retornoReal)}
          </td>
          <td>${this.formatPercent(ativo.volatilidade)}</td>
          <td class="negativo">-${this.formatPercent(ativo.maxDrawdown)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    // Análise de benefícios da diversificação
    const reducaoVolatilidade = ((volatilidadeMedia - volatilidadeCarteira) / volatilidadeMedia) * 100;
    const diferencaMelhor = carteira.retornoReal - melhorAtivo.retornoReal;
    const diferencaPior = carteira.retornoReal - piorAtivo.retornoReal;

    html += `
      <div class="diversificacao-analise">
        <h4>🎯 Benefícios da Diversificação</h4>
        <div class="analise-metricas">
          <div class="metrica-box ${reducaoVolatilidade > 0 ? 'positiva' : 'neutra'}">
            <span class="metrica-valor">${reducaoVolatilidade > 0 ? '-' : ''}${Math.abs(reducaoVolatilidade).toFixed(1)}%</span>
            <span class="metrica-label">Redução de Volatilidade</span>
            <span class="metrica-detalhe">vs. média ponderada dos ativos</span>
          </div>
          <div class="metrica-box">
            <span class="metrica-valor">#${posicaoCarteira + 1}</span>
            <span class="metrica-label">Posição no Ranking</span>
            <span class="metrica-detalhe">de ${dadosAtivos.length + 1} opções</span>
          </div>
          <div class="metrica-box ${diferencaPior > 0 ? 'positiva' : 'negativa'}">
            <span class="metrica-valor">${diferencaPior >= 0 ? '+' : ''}${this.formatPercent(diferencaPior)}</span>
            <span class="metrica-label">vs. Pior Ativo</span>
            <span class="metrica-detalhe">${piorAtivo.nome}</span>
          </div>
        </div>
      </div>
    `;

    // Explicação educacional
    html += `
      <div class="diversificacao-explicacao">
        <h4>📚 Entendendo a Diversificação</h4>
        <div class="explicacao-content">
          <p><strong>Por que a carteira não foi a melhor opção?</strong></p>
          <p>
            Em retrospectiva, concentrar 100% em <strong>${melhorAtivo.nome}</strong> teria gerado
            <span class="positivo">${this.formatPercent(melhorAtivo.retornoReal)}</span> de retorno real,
            superando a carteira em <span class="destaque">${this.formatPercent(Math.abs(diferencaMelhor))}</span>.
          </p>

          <p><strong>Mas por que diversificar faz sentido?</strong></p>
          <ul>
            <li>
              <strong>Proteção contra o pior cenário:</strong> Se você tivesse investido apenas em
              <strong>${piorAtivo.nome}</strong>, teria obtido apenas
              <span class="${piorAtivo.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatPercent(piorAtivo.retornoReal)}</span>.
              A carteira ficou <strong>${this.formatPercent(diferencaPior)}</strong> à frente.
            </li>
            <li>
              <strong>Menor volatilidade:</strong> A carteira teve volatilidade mensal de
              <strong>${this.formatPercent(volatilidadeCarteira)}</strong>, ${reducaoVolatilidade > 0 ?
              `que é <strong>${reducaoVolatilidade.toFixed(1)}% menor</strong> que a média ponderada dos ativos` :
              `similar à média dos ativos`}.
              Isso significa menos "susto" nos meses de queda.
            </li>
            <li>
              <strong>Máxima queda controlada:</strong> O maior tombo da carteira foi de
              <strong>${this.formatPercent(maxDrawdownCarteira)}</strong>, enquanto alguns ativos
              individuais chegaram a cair muito mais.
            </li>
          </ul>

          <div class="explicacao-conclusao">
            <p>
              <strong>💡 Conclusão:</strong> Diversificar nunca será a melhor escolha <em>em retrospectiva</em>,
              pois sempre haverá um ativo que superou os demais. Porém, diversificar também nunca será a pior escolha.
              Você abre mão de potenciais ganhos extraordinários em troca de <strong>previsibilidade</strong>,
              <strong>menor volatilidade</strong> e <strong>proteção contra cenários adversos</strong> —
              essencial para quem busca construir patrimônio de forma consistente no longo prazo.
            </p>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    card.style.display = 'block';
  },

  // ==========================================
  // ABA 4: REBALANCEAMENTO
  // ==========================================
  rebalViewMode: 'nominal',
  rebalData: null,

  simularRebalanceamento() {
    if (!Comparador.dadosMensais?.meses) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    // Ler configurações
    const periodoInicio = document.getElementById('comp2RebalPeriodoInicio')?.value || '2011-01';
    const periodoFim = document.getElementById('comp2RebalPeriodoFim')?.value || '2025-12';
    const valorStr = document.getElementById('comp2RebalValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;
    const tolerancia = this.parsePercentage(document.getElementById('comp2Tolerancia')?.value) || 10;

    // Ler valores de ajuste
    const dolarExtra = this.parsePercentage(document.getElementById('comp2RebalDolarExtra')?.value) || 0;
    const imoveisRenda = this.parsePercentage(document.getElementById('comp2RebalImoveisRenda')?.value) || 0;
    const inflacaoCustom = this.parsePercentage(document.getElementById('comp2RebalInflacaoCustom')?.value) || 0;

    // Armazenar ajustes para uso em outras funções
    this.ajustes.dolarExtra = dolarExtra;
    this.ajustes.imoveisRenda = imoveisRenda;

    // Coletar alocações
    const alocacaoConfig = {};
    let totalPct = 0;
    document.querySelectorAll('#comp2RebalAllocation input[type="range"]').forEach(slider => {
      const pct = parseInt(slider.value) || 0;
      if (pct > 0) {
        alocacaoConfig[slider.dataset.asset] = {
          alocacao: pct,
          tolerancia: tolerancia
        };
        totalPct += pct;
      }
    });

    if (totalPct === 0) {
      alert('Configure a alocação da carteira (total deve ser 100%).');
      return;
    }

    if (Math.abs(totalPct - 100) > 1) {
      alert(`A alocação total deve ser 100% (atual: ${totalPct}%)`);
      return;
    }

    // Filtrar dados mensais pelo período
    const dadosFiltrados = this.filtrarDadosMensais(periodoInicio, periodoFim);

    if (dadosFiltrados.length === 0) {
      alert('Não há dados suficientes para o período selecionado.');
      return;
    }

    // Verificar se todos os ativos têm dados
    const ativosComDados = Object.keys(alocacaoConfig).filter(ativo => {
      return dadosFiltrados.some(d => d[ativo] !== null && d[ativo] !== undefined);
    });

    if (ativosComDados.length < Object.keys(alocacaoConfig).length) {
      const ativosSemDados = Object.keys(alocacaoConfig).filter(a => !ativosComDados.includes(a));
      alert(`Alguns ativos não têm dados para o período: ${ativosSemDados.map(a => Comparador.assetNames[a]).join(', ')}`);
      return;
    }

    // Simular COM rebalanceamento
    const resultadoComRebal = this.simularCarteiraComRebalanceamento(
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom, dolarExtra
    );

    // Simular SEM rebalanceamento (buy and hold)
    const resultadoSemRebal = this.simularCarteiraSemRebalanceamento(
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom, dolarExtra
    );

    // Simular cada ativo individual para ranking
    const resultadosIndividuais = this.simularAtivosIndividuais(dadosFiltrados, valorInicial, inflacaoCustom, dolarExtra);

    // Salvar para toggle do gráfico
    this.rebalData = { resultadoComRebal, resultadoSemRebal, resultadosIndividuais, alocacaoConfig };

    // Mostrar resultados
    document.getElementById('comp2RebalResults').style.display = 'block';

    // Renderizar componentes
    this.renderRebalComparison(resultadoComRebal, resultadoSemRebal);
    this.renderRebalChart();
    this.renderRebalMetricas(resultadoComRebal, resultadoSemRebal, alocacaoConfig);
    this.renderHistoricoMensal(resultadoComRebal);
    this.renderRebalConclusoes(resultadoComRebal, resultadoSemRebal, resultadosIndividuais, alocacaoConfig);

    // Bind toggle buttons
    document.getElementById('comp2RebalBtnNominal')?.addEventListener('click', () => {
      this.rebalViewMode = 'nominal';
      document.getElementById('comp2RebalBtnNominal').classList.add('active');
      document.getElementById('comp2RebalBtnReal').classList.remove('active');
      this.renderRebalChart();
    });
    document.getElementById('comp2RebalBtnReal')?.addEventListener('click', () => {
      this.rebalViewMode = 'real';
      document.getElementById('comp2RebalBtnReal').classList.add('active');
      document.getElementById('comp2RebalBtnNominal').classList.remove('active');
      this.renderRebalChart();
    });

    // Scroll para resultados
    document.getElementById('comp2RebalResults').scrollIntoView({ behavior: 'smooth' });
  },

  simularCarteiraComRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0, dolarExtra = 0) {
    const ativos = Object.keys(config);
    let inflacaoAcumulada = 1;

    // Inicializar carteira
    let carteira = {};
    let precoMedio = {};
    let custoTotal = {};
    let totalImpostosPagos = 0;

    ativos.forEach(ativo => {
      const valorAlocado = valorInicial * (config[ativo].alocacao / 100);
      carteira[ativo] = valorAlocado;
      precoMedio[ativo] = 1;
      custoTotal[ativo] = valorAlocado;
    });

    const evolucao = [{
      periodo: 'Início',
      valor: valorInicial,
      valorReal: valorInicial
    }];

    // Histórico detalhado para tabela
    const historico = [];

    let totalRebalanceamentos = 0;
    const retornosMensais = [];
    let precoMercado = {};
    ativos.forEach(ativo => { precoMercado[ativo] = 1; });

    // Processar cada mês
    dados.forEach((dadoMes, indexMes) => {
      // Obter dado do mês anterior para cálculos que precisam de variação
      const dadoMesAnterior = indexMes > 0 ? dados[indexMes - 1] : null;

      const periodoLabel = dadoMes.periodo || `${dadoMes.ano}`;
      let rebalanceou = false;
      let impostoPeriodo = 0;
      const movimentacoes = [];

      // Valor antes do retorno
      let valorAntes = Object.values(carteira).reduce((a, b) => a + b, 0);

      // Aplicar retorno mensal para cada ativo
      ativos.forEach(ativo => {
        // Usar função de retorno ajustado (já é mensal)
        const retornoMensal = this.getRetornoAjustado(ativo, dadoMes, dolarExtra, dadoMesAnterior);
        carteira[ativo] *= (1 + retornoMensal / 100);
        precoMercado[ativo] *= (1 + retornoMensal / 100);
      });

      let valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0);
      retornosMensais.push((valorTotal / valorAntes - 1) * 100);

      // Atualizar inflação (converter taxa anual para mensal com fórmula de juros compostos)
      const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;
      const inflacaoMensal = inflacaoCustom > 0 ? inflacaoMensalCustom : dadoMes.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoMensal / 100);

      // Verificar necessidade de rebalanceamento
      const alocacoesAtuais = {};
      ativos.forEach(ativo => {
        alocacoesAtuais[ativo] = (carteira[ativo] / valorTotal) * 100;
      });

      const foraTolerancia = ativos.filter(ativo => {
        const atual = alocacoesAtuais[ativo];
        const desejada = config[ativo].alocacao;
        const tolerancia = config[ativo].tolerancia;
        // Tolerância relativa: se alocação alvo é 5% e tolerância é 50%,
        // rebalanceia quando cair abaixo de 2.5% ou subir acima de 7.5%
        const desvioRelativo = Math.abs(atual - desejada) / desejada * 100;
        return desvioRelativo > tolerancia;
      });

      // Executar rebalanceamento se necessário
      if (foraTolerancia.length > 0) {
        rebalanceou = true;
        totalRebalanceamentos++;

        ativos.forEach(ativo => {
          const valorDesejado = valorTotal * (config[ativo].alocacao / 100);
          const valorAtual = carteira[ativo];
          const diferenca = valorDesejado - valorAtual;

          if (Math.abs(diferenca) > 1) {
            if (diferenca < 0) {
              // VENDA - calcular ganho de capital e imposto
              const lucroVenda = Math.abs(diferenca) - (Math.abs(diferenca) / precoMercado[ativo]) * precoMedio[ativo];
              const taxaIR = Comparador.taxasIR?.[ativo] || 0.15;
              let impostoVenda = 0;
              if (lucroVenda > 0) {
                impostoVenda = lucroVenda * taxaIR;
                impostoPeriodo += impostoVenda;
                totalImpostosPagos += impostoVenda;
              }
              const proporcaoVendida = Math.abs(diferenca) / valorAtual;
              custoTotal[ativo] *= (1 - proporcaoVendida);

              movimentacoes.push({
                ativo,
                tipo: 'venda',
                valor: Math.abs(diferenca),
                de: alocacoesAtuais[ativo].toFixed(1),
                para: config[ativo].alocacao.toFixed(1),
                lucro: lucroVenda,
                imposto: impostoVenda
              });

              carteira[ativo] = valorAtual - Math.abs(diferenca);
            } else {
              // COMPRA - atualizar preço médio
              const qtdComprada = diferenca / precoMercado[ativo];
              const qtdAtual = carteira[ativo] / precoMercado[ativo];
              custoTotal[ativo] += diferenca;
              precoMedio[ativo] = custoTotal[ativo] / (qtdAtual + qtdComprada);

              movimentacoes.push({
                ativo,
                tipo: 'compra',
                valor: diferenca,
                de: alocacoesAtuais[ativo].toFixed(1),
                para: config[ativo].alocacao.toFixed(1)
              });

              carteira[ativo] = valorAtual + diferenca;
            }
          }
        });

        // Recalcular valor total após impostos
        valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0) - impostoPeriodo;
        if (impostoPeriodo > 0) {
          const fatorReducao = valorTotal / (valorTotal + impostoPeriodo);
          ativos.forEach(ativo => { carteira[ativo] *= fatorReducao; });
        }
      }

      // Recalcular alocações finais do período
      const alocacoesFinais = {};
      ativos.forEach(ativo => {
        alocacoesFinais[ativo] = (carteira[ativo] / valorTotal) * 100;
      });

      evolucao.push({
        periodo: periodoLabel,
        valor: valorTotal,
        valorReal: valorTotal / inflacaoAcumulada,
        rebalanceou
      });

      // Adicionar ao histórico detalhado
      historico.push({
        periodo: periodoLabel,
        valor: valorTotal,
        valorReal: valorTotal / inflacaoAcumulada,
        alocacoes: { ...alocacoesFinais },
        rebalanceou,
        movimentacoes,
        impostosPagos: impostoPeriodo
      });
    });

    const valorFinal = evolucao[evolucao.length - 1].valor;
    const retornoNominal = ((valorFinal / valorInicial) - 1) * 100;
    const valorReal = valorFinal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const volatilidade = this.calcularVolatilidade(retornosMensais);

    // Média mensal simples
    const mediaMensal = retornosMensais.length > 0
      ? retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length
      : 0;

    // Retorno anualizado (CAGR)
    const numMeses = dados.length;
    const numAnos = numMeses / 12;
    const retornoAnualizado = numAnos > 0
      ? (Math.pow(valorFinal / valorInicial, 1 / numAnos) - 1) * 100
      : 0;

    // Calcular max drawdown
    let maxDrawdown = 0, peakValue = valorInicial;
    evolucao.forEach(e => {
      if (e.valor > peakValue) peakValue = e.valor;
      const drawdown = (peakValue - e.valor) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calcular valor líquido
    let valorLiquido = 0, impostoVendaTotal = 0;
    ativos.forEach(ativo => {
      const valorAtivo = carteira[ativo];
      const custo = custoTotal[ativo];
      const lucro = valorAtivo - custo;
      if (lucro > 0) impostoVendaTotal += lucro * (Comparador.taxasIR?.[ativo] || 0.15);
      valorLiquido += valorAtivo;
    });
    valorLiquido -= impostoVendaTotal;

    return {
      evolucao, historico, valorInicial, valorFinal, valorReal, valorLiquido, impostoVendaTotal,
      totalImpostosPagos, retornoNominal, retornoReal, volatilidade, maxDrawdown, mediaMensal, retornoAnualizado,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      totalRebalanceamentos, inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularCarteiraSemRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0, dolarExtra = 0) {
    const ativos = Object.keys(config);
    let inflacaoAcumulada = 1;
    let custoTotal = {};
    let carteira = {};

    ativos.forEach(ativo => {
      const valorAlocado = valorInicial * (config[ativo].alocacao / 100);
      carteira[ativo] = valorAlocado;
      custoTotal[ativo] = valorAlocado;
    });

    const evolucao = [{
      periodo: 'Início',
      valor: valorInicial,
      valorReal: valorInicial
    }];

    const retornosMensais = [];

    dados.forEach((dadoMes, indexMes) => {
      // Obter dado do mês anterior para cálculos que precisam de variação
      const dadoMesAnterior = indexMes > 0 ? dados[indexMes - 1] : null;

      let valorAntes = Object.values(carteira).reduce((a, b) => a + b, 0);

      ativos.forEach(ativo => {
        // Usar função de retorno ajustado (já é mensal)
        const retornoMensal = this.getRetornoAjustado(ativo, dadoMes, dolarExtra, dadoMesAnterior);
        carteira[ativo] *= (1 + retornoMensal / 100);
      });

      const valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0);
      retornosMensais.push((valorTotal / valorAntes - 1) * 100);

      // Converter taxa anual para mensal com fórmula de juros compostos
      const inflacaoMensalCustom = inflacaoCustom > 0 ? (Math.pow(1 + inflacaoCustom / 100, 1/12) - 1) * 100 : 0;
      const inflacaoMensal = inflacaoCustom > 0 ? inflacaoMensalCustom : dadoMes.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoMensal / 100);

      evolucao.push({
        periodo: dadoMes.periodo || `${dadoMes.ano}`,
        valor: valorTotal,
        valorReal: valorTotal / inflacaoAcumulada
      });
    });

    const valorFinal = evolucao[evolucao.length - 1].valor;
    const retornoNominal = ((valorFinal / valorInicial) - 1) * 100;
    const valorReal = valorFinal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const volatilidade = this.calcularVolatilidade(retornosMensais);

    // Média mensal simples
    const mediaMensal = retornosMensais.length > 0
      ? retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length
      : 0;

    // Retorno anualizado (CAGR)
    const numMeses = dados.length;
    const numAnos = numMeses / 12;
    const retornoAnualizado = numAnos > 0
      ? (Math.pow(valorFinal / valorInicial, 1 / numAnos) - 1) * 100
      : 0;

    let maxDrawdown = 0, peakValue = valorInicial;
    evolucao.forEach(e => {
      if (e.valor > peakValue) peakValue = e.valor;
      const drawdown = (peakValue - e.valor) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    let valorLiquido = 0, impostoVendaTotal = 0;
    ativos.forEach(ativo => {
      const valorAtivo = carteira[ativo];
      const custo = custoTotal[ativo];
      const lucro = valorAtivo - custo;
      if (lucro > 0) impostoVendaTotal += lucro * (Comparador.taxasIR?.[ativo] || 0.15);
      valorLiquido += valorAtivo;
    });
    valorLiquido -= impostoVendaTotal;

    return {
      evolucao, valorInicial, valorFinal, valorReal, valorLiquido, impostoVendaTotal,
      retornoNominal, retornoReal, volatilidade, maxDrawdown, mediaMensal, retornoAnualizado,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularAtivosIndividuais(dados, valorInicial, inflacaoCustom = 0, dolarExtra = 0) {
    const ativos = ['ibovespa', 'ibovtr', 'cdi', 'fii_ifix', 'idiv', 'dolar', 'ouro', 'tesouro_ipca', 'imab5', 'sp500_brl', 'bitcoin_brl', 'tlt_brl', 'imoveis_fipezap'];
    const resultados = {};

    ativos.forEach(ativo => {
      const temDados = dados.some(d => d[ativo] !== null && d[ativo] !== undefined);
      if (temDados) {
        const resultado = this.calcularEvolucao(ativo, dados, valorInicial, dolarExtra, inflacaoCustom);
        resultados[ativo] = resultado;
      }
    });

    return resultados;
  },

  renderRebalComparison(comRebal, semRebal) {
    const container = document.getElementById('comp2RebalComparison');
    if (!container) return;

    const diferencaValor = comRebal.valorFinal - semRebal.valorFinal;
    const diferencaPct = comRebal.retornoNominal - semRebal.retornoNominal;
    const venceuRebal = diferencaValor > 0;

    const comRebalAnual = comRebal.retornoAnualizado || 0;
    const comRebalMensal = comRebal.mediaMensal || 0;
    const semRebalAnual = semRebal.retornoAnualizado || 0;
    const semRebalMensal = semRebal.mediaMensal || 0;

    container.innerHTML = `
      <div class="comparison-box ${venceuRebal ? 'winner' : ''}">
        <span class="comparison-icon">⚖️</span>
        <span class="comparison-label">Com Rebalanceamento</span>
        <span class="comparison-value ${comRebal.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatCurrency(comRebal.valorFinal)}</span>
        <span class="comparison-pct">${comRebal.retornoNominal >= 0 ? '+' : ''}${this.formatPercent(comRebal.retornoNominal)} nominal</span>
        <span class="comparison-detail">${comRebal.retornoReal >= 0 ? '+' : ''}${this.formatPercent(comRebal.retornoReal)} real</span>
        <span class="comparison-avg">📈 ${comRebalAnual >= 0 ? '+' : ''}${this.formatPercent(comRebalAnual)} a.a. | 📅 ${comRebalMensal >= 0 ? '+' : ''}${this.formatPercent(comRebalMensal)} a.m.</span>
        ${venceuRebal ? '<span class="winner-tag">VENCEDOR</span>' : ''}
      </div>
      <div class="comparison-vs">
        <span>VS</span>
        <span class="diff-label">Diferença:</span>
        <span class="diff-value ${venceuRebal ? 'positivo' : 'negativo'}">${venceuRebal ? '+' : ''}${this.formatCurrency(diferencaValor)}</span>
      </div>
      <div class="comparison-box ${!venceuRebal ? 'winner' : ''}">
        <span class="comparison-icon">📦</span>
        <span class="comparison-label">Buy & Hold</span>
        <span class="comparison-value ${semRebal.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatCurrency(semRebal.valorFinal)}</span>
        <span class="comparison-pct">${semRebal.retornoNominal >= 0 ? '+' : ''}${this.formatPercent(semRebal.retornoNominal)} nominal</span>
        <span class="comparison-detail">${semRebal.retornoReal >= 0 ? '+' : ''}${this.formatPercent(semRebal.retornoReal)} real</span>
        <span class="comparison-avg">📈 ${semRebalAnual >= 0 ? '+' : ''}${this.formatPercent(semRebalAnual)} a.a. | 📅 ${semRebalMensal >= 0 ? '+' : ''}${this.formatPercent(semRebalMensal)} a.m.</span>
        ${!venceuRebal ? '<span class="winner-tag">VENCEDOR</span>' : ''}
      </div>
    `;
  },

  renderRebalChart() {
    if (!this.rebalData) return;

    const container = document.getElementById('comp2RebalChart');
    if (!container) return;

    const { resultadoComRebal, resultadoSemRebal } = this.rebalData;
    const viewKey = this.rebalViewMode === 'real' ? 'valorReal' : 'valor';

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    if (this.charts.rebal) {
      this.charts.rebal.destroy();
    }

    const labels = resultadoComRebal.evolucao.map(e => e.periodo);

    this.charts.rebal = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Com Rebalanceamento',
            data: resultadoComRebal.evolucao.map(e => e[viewKey]),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5
          },
          {
            label: 'Buy & Hold',
            data: resultadoSemRebal.evolucao.map(e => e[viewKey]),
            borderColor: '#6b7280',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#c9d1d9' } },
          tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + this.formatCurrency(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e', maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(139, 148, 158, 0.1)' }, ticks: { color: '#8b949e', callback: (v) => 'R$ ' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });
  },

  renderRebalMetricas(comRebal, semRebal, config) {
    const container = document.getElementById('comp2RebalStats');
    if (!container) return;

    const ativos = Object.keys(config);
    const nomeAtivos = ativos.map(a => Comparador.assetNames[a] || a).join(', ');

    container.innerHTML = `
      <div class="comp2-stat-box">
        <div class="stat-label">Valor Inicial</div>
        <div class="stat-value">${this.formatCurrency(comRebal.valorInicial)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Valor Final (c/ Rebal)</div>
        <div class="stat-value ${comRebal.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatCurrency(comRebal.valorFinal)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Valor Líquido</div>
        <div class="stat-value">${this.formatCurrency(comRebal.valorLiquido)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">IR Pago (Rebal)</div>
        <div class="stat-value negativo">${this.formatCurrency(comRebal.totalImpostosPagos)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Rebalanceamentos</div>
        <div class="stat-value">${comRebal.totalRebalanceamentos}×</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Volatilidade (c/ Rebal)</div>
        <div class="stat-value">${this.formatPercent(comRebal.volatilidade)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Volatilidade (B&H)</div>
        <div class="stat-value">${this.formatPercent(semRebal.volatilidade)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Máx. Drawdown (c/ Rebal)</div>
        <div class="stat-value negativo">-${this.formatPercent(comRebal.maxDrawdown)}</div>
      </div>
      <div class="comp2-stat-box">
        <div class="stat-label">Máx. Drawdown (B&H)</div>
        <div class="stat-value negativo">-${this.formatPercent(semRebal.maxDrawdown)}</div>
      </div>
      <div class="comp2-stat-box" style="grid-column: span 2;">
        <div class="stat-label">Ativos na Carteira</div>
        <div class="stat-value" style="font-size: 0.9rem;">${nomeAtivos}</div>
      </div>
    `;
  },

  renderRebalConclusoes(comRebal, semRebal, ativos, config) {
    const container = document.getElementById('comp2RebalConclusoesLista');
    if (!container) return;

    const conclusoes = [];

    // 1. Rebalanceamento valeu a pena?
    const diferencaRebal = comRebal.valorFinal - semRebal.valorFinal;
    if (diferencaRebal > 0) {
      conclusoes.push({
        tipo: 'success',
        icon: '✅',
        texto: `O rebalanceamento gerou <strong>${this.formatCurrency(diferencaRebal)}</strong> a mais que o buy-and-hold. Valeu a pena manter a disciplina.`
      });
    } else {
      conclusoes.push({
        tipo: 'warning',
        icon: '⚠️',
        texto: `O buy-and-hold teria gerado <strong>${this.formatCurrency(Math.abs(diferencaRebal))}</strong> a mais. Neste período, rebalancear não compensou financeiramente.`
      });
    }

    // 2. Comparar volatilidade
    if (comRebal.volatilidade < semRebal.volatilidade) {
      const reducaoVol = ((semRebal.volatilidade - comRebal.volatilidade) / semRebal.volatilidade * 100).toFixed(0);
      conclusoes.push({
        tipo: 'info',
        icon: '📊',
        texto: `O rebalanceamento reduziu a volatilidade em <strong>${reducaoVol}%</strong>, suavizando as oscilações da carteira.`
      });
    }

    // 3. Comparar com ativos individuais
    const ativosArray = Object.entries(ativos).map(([k, v]) => ({ nome: Comparador.assetNames[k], ...v }));
    ativosArray.sort((a, b) => b.retornoReal - a.retornoReal);
    if (ativosArray.length > 0) {
      const melhorAtivo = ativosArray[0];
      const piorAtivo = ativosArray[ativosArray.length - 1];
      const ativosVencidos = ativosArray.filter(a => a.retornoReal < comRebal.retornoReal).length;
      const percentualVencidos = (ativosVencidos / ativosArray.length * 100).toFixed(0);

      conclusoes.push({
        tipo: 'info',
        icon: '🏆',
        texto: `Sua carteira superou <strong>${percentualVencidos}%</strong> dos ativos individuais. O melhor foi ${melhorAtivo.nome} (+${this.formatPercent(melhorAtivo.retornoReal)}) e o pior foi ${piorAtivo.nome} (${this.formatPercent(piorAtivo.retornoReal)}).`
      });
    }

    // 4. Proteção nas quedas
    if (comRebal.maxDrawdown < semRebal.maxDrawdown) {
      conclusoes.push({
        tipo: 'success',
        icon: '🛡️',
        texto: `O rebalanceamento reduziu a perda máxima: <strong>${this.formatPercent(comRebal.maxDrawdown)}</strong> vs ${this.formatPercent(semRebal.maxDrawdown)} sem rebalancear.`
      });
    }

    // 5. Número de rebalanceamentos
    if (comRebal.totalRebalanceamentos > 0) {
      const custoIR = comRebal.totalImpostosPagos > 0
        ? ` gerando <strong>${this.formatCurrency(comRebal.totalImpostosPagos)}</strong> em IR`
        : '';
      conclusoes.push({
        tipo: 'info',
        icon: '⚖️',
        texto: `Foram necessários <strong>${comRebal.totalRebalanceamentos} rebalanceamentos</strong> para manter a carteira dentro das tolerâncias${custoIR}.`
      });
    }

    // Renderizar
    let html = '';
    conclusoes.forEach(c => {
      html += `
        <div class="conclusao-item ${c.tipo}">
          <span class="conclusao-icon">${c.icon}</span>
          <p>${c.texto}</p>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderHistoricoMensal(resultado) {
    const thead = document.querySelector('#comp2RebalHistorico thead');
    const tbody = document.querySelector('#comp2RebalHistorico tbody');
    if (!thead || !tbody) return;

    // Obter lista de ativos do primeiro registro com alocações
    const primeiroComAlocacoes = resultado.historico.find(h => h.alocacoes && Object.keys(h.alocacoes).length > 0);
    const ativos = primeiroComAlocacoes ? Object.keys(primeiroComAlocacoes.alocacoes) : [];

    // Criar cabeçalho com colunas para cada ativo
    let theadHtml = `
      <tr>
        <th>Período</th>
        <th>Patrimônio</th>
        <th>Variação</th>`;

    // Adicionar coluna para cada ativo selecionado
    ativos.forEach(ativo => {
      const cor = Comparador.chartColors[ativo] || '#888';
      const nome = Comparador.assetNames[ativo] || ativo;
      theadHtml += `<th style="white-space: nowrap;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${cor}; margin-right: 4px;"></span>
        ${nome}
      </th>`;
    });

    theadHtml += `<th>Movimentações</th></tr>`;
    thead.innerHTML = theadHtml;

    let html = '';
    resultado.historico.forEach((h, i) => {
      const variacaoPercent = i > 0
        ? ((h.valor / resultado.historico[i-1].valor) - 1) * 100
        : 0;

      let movimentacoesTexto = '-';
      if (h.movimentacoes && h.movimentacoes.length > 0) {
        movimentacoesTexto = h.movimentacoes.map(m => {
          const icon = m.tipo === 'compra' ? '🟢' : '🔴';
          const valorFormatado = this.formatCurrency(m.valor);

          let detalhe = `${icon} ${Comparador.assetNames[m.ativo]}: ${m.de}% → ${m.para}% (${valorFormatado})`;

          // Mostrar lucro e imposto para vendas
          if (m.tipo === 'venda' && m.lucro !== undefined) {
            if (m.lucro > 0) {
              detalhe += `<br><small style="color: var(--text-muted)">Lucro: ${this.formatCurrency(m.lucro)} | IR: ${this.formatCurrency(m.imposto)}</small>`;
            }
          }

          return detalhe;
        }).join('<br>');

        // Mostrar total de imposto do período se houver
        if (h.impostosPagos > 0) {
          movimentacoesTexto += `<br><strong style="color: var(--danger)">IR pago: ${this.formatCurrency(h.impostosPagos)}</strong>`;
        }
      }

      // Linha da tabela
      html += `
        <tr class="${h.rebalanceou ? 'row-rebalanceou' : ''}">
          <td>${h.periodo}</td>
          <td>${this.formatCurrency(h.valor)}</td>
          <td class="${variacaoPercent >= 0 ? 'text-green' : 'text-red'}">
            ${variacaoPercent >= 0 ? '+' : ''}${variacaoPercent.toFixed(2)}%
          </td>`;

      // Adicionar célula para cada ativo com sua alocação atual
      ativos.forEach(ativo => {
        const alocacao = h.alocacoes ? h.alocacoes[ativo] : null;
        if (alocacao !== null && alocacao !== undefined) {
          const cor = Comparador.chartColors[ativo] || '#888';
          // Criar mini barra de progresso visual
          const larguraBarra = Math.min(alocacao, 100);
          html += `<td style="white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="flex: 1; min-width: 40px; max-width: 60px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div style="width: ${larguraBarra}%; height: 100%; background: ${cor}; border-radius: 3px;"></div>
              </div>
              <span style="font-weight: 500; font-size: 0.85rem;">${alocacao.toFixed(1)}%</span>
            </div>
          </td>`;
        } else {
          html += `<td style="color: var(--text-muted);">-</td>`;
        }
      });

      html += `<td style="font-size: 0.8rem">${movimentacoesTexto}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
  },

  // ==========================================
  // ABA 5: PADRÕES HISTÓRICOS
  // ==========================================
  showPattern(pattern) {
    if (!Comparador.dadosCrises?.[pattern]) {
      this.showPatternFallback(pattern);
      return;
    }

    const crise = Comparador.dadosCrises[pattern];
    const headerEl = document.getElementById('patternHeader');
    const contentEl = document.getElementById('patternContent');

    if (headerEl) {
      headerEl.innerHTML = `
        <h2>${crise.nome}</h2>
        <span class="pattern-period">${crise.periodo}</span>
      `;
    }

    if (contentEl) {
      // Preparar conteúdo detalhado
      let html = `<p style="margin-bottom: 16px; color: var(--text-secondary); line-height: 1.6;">${crise.descricao}</p>`;

      // Contexto
      if (crise.contexto) {
        html += `<div class="pattern-detail">${crise.contexto}</div>`;
      }

      // Tabela de impacto nos ativos (usa 'impacto' ou 'ativos')
      const impactoData = crise.impacto || crise.ativos;
      if (impactoData && impactoData.length > 0) {
        html += `
          <h4 style="margin-top: 20px; margin-bottom: 12px; color: var(--text-primary);">📊 Impacto nos Ativos</h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
              <thead>
                <tr style="background: var(--bg-tertiary);">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">Ativo</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">Variação</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">Recuperação</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">Comportamento</th>
                </tr>
              </thead>
              <tbody>
        `;

        impactoData.forEach(item => {
          const queda = item.queda;
          const isNegative = typeof queda === 'number' ? queda < 0 : (queda && queda.toString().includes('-'));
          const quedaStr = typeof queda === 'number' ? (queda >= 0 ? '+' + queda + '%' : queda + '%') : (queda || '-');
          html += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-primary);">${item.ativo || item.nome}</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid var(--border-color); color: ${isNegative ? 'var(--bearish)' : 'var(--bullish)'}; font-weight: 600;">${quedaStr}</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${item.recuperacao || '-'}</td>
              <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">${item.comportamento || '-'}</td>
            </tr>
          `;
        });

        html += '</tbody></table></div>';
      }

      // Sinais de alerta
      if (crise.sinais && crise.sinais.length > 0) {
        html += `
          <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--text-primary);">⚠️ Sinais de Alerta</h4>
          <ul style="margin-left: 20px; color: var(--text-secondary);">
            ${crise.sinais.map(s => `<li style="margin-bottom: 8px;">${s}</li>`).join('')}
          </ul>
        `;
      }

      // Cards de lições (evitar, proteger, oportunidade são arrays diretos)
      const hasLicoes = (crise.evitar?.length > 0) || (crise.proteger?.length > 0) || (crise.oportunidade?.length > 0);
      if (hasLicoes) {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 24px;">`;

        if (crise.evitar && crise.evitar.length > 0) {
          html += `
            <div style="padding: 16px; background: rgba(248, 81, 73, 0.1); border-radius: 12px; border-left: 4px solid var(--bearish);">
              <h5 style="color: var(--bearish); margin-bottom: 12px; font-size: 0.95rem;">❌ O que evitar</h5>
              <ul style="margin-left: 16px; font-size: 0.85rem; color: var(--text-secondary);">
                ${crise.evitar.map(l => `<li style="margin-bottom: 6px;">${l}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (crise.proteger && crise.proteger.length > 0) {
          html += `
            <div style="padding: 16px; background: rgba(88, 166, 255, 0.1); border-radius: 12px; border-left: 4px solid var(--primary-light);">
              <h5 style="color: var(--primary-light); margin-bottom: 12px; font-size: 0.95rem;">🛡️ Como se proteger</h5>
              <ul style="margin-left: 16px; font-size: 0.85rem; color: var(--text-secondary);">
                ${crise.proteger.map(l => `<li style="margin-bottom: 6px;">${l}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (crise.oportunidade && crise.oportunidade.length > 0) {
          html += `
            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; border-left: 4px solid var(--bullish);">
              <h5 style="color: var(--bullish); margin-bottom: 12px; font-size: 0.95rem;">💰 Oportunidades</h5>
              <ul style="margin-left: 16px; font-size: 0.85rem; color: var(--text-secondary);">
                ${crise.oportunidade.map(l => `<li style="margin-bottom: 6px;">${l}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        html += '</div>';
      }

      // Conclusões
      if (crise.conclusoes && crise.conclusoes.length > 0) {
        html += `
          <h4 style="margin-top: 24px; margin-bottom: 12px; color: var(--text-primary);">📝 Conclusões</h4>
          <div style="background: var(--bg-tertiary); border-radius: 12px; padding: 16px;">
            <ul style="margin-left: 16px; color: var(--text-secondary);">
              ${crise.conclusoes.map(c => `<li style="margin-bottom: 8px;">${c}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      contentEl.innerHTML = html;
    }
  },

  showPatternFallback(pattern) {
    const fallbackData = {
      dotcom: { nome: 'Bolha Ponto Com', periodo: '2000-2002', desc: 'Estouro da bolha das empresas de internet. Nasdaq caiu 78% do topo.' },
      subprime: { nome: 'Crise Subprime', periodo: '2008', desc: 'Colapso do mercado imobiliário americano. S&P 500 caiu 57%.' },
      brasil2015: { nome: 'Crise Brasil', periodo: '2014-2016', desc: 'Recessão econômica, crise política e impeachment. Ibovespa caiu 40%.' },
      covid: { nome: 'COVID-19', periodo: '2020', desc: 'Pandemia global. Circuit breakers na bolsa. Recuperação rápida.' },
      bitcoin: { nome: 'Ciclos do Bitcoin', periodo: 'Ciclos de ~4 anos', desc: 'Padrões históricos de halving e correções de 70-85%.' },
      ia: { nome: 'Bolha de IA?', periodo: '202X?', desc: 'Cenário potencial. Mag 7 concentram $21.5 trilhões. Múltiplos esticados.' }
    };

    const data = fallbackData[pattern] || fallbackData.dotcom;
    const headerEl = document.getElementById('patternHeader');
    const contentEl = document.getElementById('patternContent');

    if (headerEl) {
      headerEl.innerHTML = `<h2>${data.nome}</h2><span class="pattern-period">${data.periodo}</span>`;
    }
    if (contentEl) {
      contentEl.innerHTML = `<p style="color: var(--text-secondary);">${data.desc}</p>`;
    }
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Comparador2.init();
});
