/**
 * Simulador: Financiamento Imobiliário vs Investimento
 * Rico aos Poucos
 *
 * Modos:
 * - Convencional: financiamento bancário tradicional (SAC/Price, 30 anos)
 * - Leilão: arrematação com desconto, parcelas curtas (12x/30x), custas extras
 *
 * Compara dois cenários:
 * A) Investir todo o capital a uma taxa fixa
 * B) Comprar imóvel (convencional ou leilão) + alugar + investir o restante
 */

(function() {
  'use strict';

  const SIM = {
    chart: null,
    chartComp: null,
    modo: 'convencional', // 'convencional' ou 'leilao'

    init() {
      const container = document.getElementById('financiamento-container');
      if (!container) return;
      this.render(container);
      this.bindEvents();
    },

    formatCurrency(value) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },

    formatPercent(value) {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
    },

    parseCurrency(str) {
      if (!str) return 0;
      return parseFloat(str.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    },

    parsePercent(str) {
      if (!str) return 0;
      return parseFloat(str.replace(',', '.')) || 0;
    },

    applyMask(input) {
      input.addEventListener('input', function() {
        let val = this.value.replace(/\D/g, '');
        if (!val) { this.value = ''; return; }
        val = parseInt(val);
        this.value = val.toLocaleString('pt-BR');
      });
    },

    // PMT - Cálculo da parcela Price
    calcPMT(principal, taxaMensal, meses) {
      if (taxaMensal === 0) return principal / meses;
      return principal * (taxaMensal * Math.pow(1 + taxaMensal, meses)) / (Math.pow(1 + taxaMensal, meses) - 1);
    },

    // ============================================
    // SIMULAÇÃO MÊS A MÊS
    // ============================================
    simular(params) {
      const {
        modo,
        // Comum
        valorMercado, // valor de avaliação / mercado (para valorização e aluguel)
        percentualEntrada,
        valorizacaoImovelAnual,
        aluguelPercentualMensal,
        taxaVacancia,
        taxaInvestimentoMensal,
        inflacaoAnual,
        reajusteAluguelAnual,
        custoManutencaoAnual,
        itrAnual,
        ehTerreno,
        horizonte, // em anos - horizonte da simulação
        // Convencional
        taxaFinanciamentoAnual,
        prazoFinanciamentoAnos,
        sistemaAmortizacao,
        // Leilão
        valorArrematacao,
        comissaoLeiloeiro,
        itbiPercentual,
        custoEscritura,
        custoRegistro,
        custoImissao,
        mesesImissao,
        prazoParcelasLeilao, // 12 ou 30 parcelas
        correcaoLeilao, // 'nenhuma', 'igpm', 'ipca'
        taxaFixaLeilao // % a.a. adicional sobre saldo
      } = params;

      const taxaInvMensal = taxaInvestimentoMensal / 100;
      const valorizacaoMensal = Math.pow(1 + valorizacaoImovelAnual / 100, 1/12) - 1;
      const inflacaoMensal = Math.pow(1 + inflacaoAnual / 100, 1/12) - 1;

      let entrada, financiado, custoInicialTotal, capitalInvestimento, capitalRestante;
      let mesesFinanciamento, taxaFinMensal;

      if (modo === 'leilao') {
        // === LEILÃO ===
        entrada = valorArrematacao * (percentualEntrada / 100);
        financiado = valorArrematacao - entrada;

        const comissao = valorArrematacao * (comissaoLeiloeiro / 100);
        const itbi = valorArrematacao * (itbiPercentual / 100);
        const custasExtras = comissao + itbi + custoEscritura + custoRegistro + custoImissao;

        custoInicialTotal = entrada + custasExtras;
        capitalInvestimento = custoInicialTotal + financiado; // cenário A: investe tudo que gastaria
        capitalRestante = capitalInvestimento - custoInicialTotal; // = financiado (fica investido, sai aos poucos)

        mesesFinanciamento = prazoParcelasLeilao;

        // Correção das parcelas do leilão
        let taxaCorrecaoAnual = 0;
        if (correcaoLeilao === 'igpm') taxaCorrecaoAnual = 5.5; // estimativa IGPM
        else if (correcaoLeilao === 'ipca') taxaCorrecaoAnual = inflacaoAnual;

        const taxaCorrecaoMensal = Math.pow(1 + taxaCorrecaoAnual / 100, 1/12) - 1;
        const taxaFixaMensal = Math.pow(1 + (taxaFixaLeilao || 0) / 100, 1/12) - 1;
        taxaFinMensal = taxaCorrecaoMensal + taxaFixaMensal;

      } else {
        // === CONVENCIONAL ===
        entrada = valorMercado * (percentualEntrada / 100);
        financiado = valorMercado - entrada;
        custoInicialTotal = entrada;
        capitalInvestimento = valorMercado; // cenário A: investe o valor do imóvel
        capitalRestante = valorMercado - entrada;

        mesesFinanciamento = prazoFinanciamentoAnos * 12;
        taxaFinMensal = Math.pow(1 + taxaFinanciamentoAnual / 100, 1/12) - 1;
      }

      // Horizonte da simulação
      const totalMeses = (horizonte || (modo === 'leilao' ? 10 : prazoFinanciamentoAnos)) * 12;

      // Cenário A: Investimento puro
      const cenarioA = { patrimonio: [], patrimonioReal: [] };
      let saldoA = capitalInvestimento;

      // Cenário B: Compra + Investimento
      const cenarioB = {
        patrimonio: [], patrimonioReal: [],
        valorImovelHist: [], saldoInvestHist: [],
        saldoDevedorHist: [], parcelaHist: [],
        aluguelHist: [], custosHist: []
      };
      let saldoInvB = capitalRestante;
      let saldoDevedor = financiado;
      let valorImovelAtual = valorMercado;
      let aluguelAtual = ehTerreno ? 0 : valorMercado * (aluguelPercentualMensal / 100);
      let totalPagoFinanciamento = 0;
      let totalRecebidoAluguel = 0;
      let totalCustosImovel = 0;
      let financiamentoQuitado = false;
      let mesQuitacao = mesesFinanciamento;

      // Parcela Price (fixa no início, pode corrigir no leilão)
      const parcelaPrice = this.calcPMT(financiado, taxaFinMensal, mesesFinanciamento);

      for (let mes = 1; mes <= totalMeses; mes++) {
        // === CENÁRIO A: Investimento puro ===
        saldoA = saldoA * (1 + taxaInvMensal);
        cenarioA.patrimonio.push(saldoA);
        cenarioA.patrimonioReal.push(saldoA / Math.pow(1 + inflacaoMensal, mes));

        // === CENÁRIO B ===

        // Valorização do imóvel
        valorImovelAtual = valorImovelAtual * (1 + valorizacaoMensal);

        // Reajuste do aluguel (anual)
        if (!ehTerreno && mes > 1 && (mes - 1) % 12 === 0) {
          aluguelAtual = aluguelAtual * (1 + reajusteAluguelAnual / 100);
        }

        // No leilão: sem aluguel durante período de imissão
        const emImissao = modo === 'leilao' && mes <= mesesImissao;
        const aluguelRecebido = (ehTerreno || emImissao) ? 0 : aluguelAtual * (1 - taxaVacancia / 100);

        // Custos (manutenção + IPTU) - começam após imissão no leilão
        let custosMensais = 0;
        if (!emImissao) {
          const custoManutencaoMensal = (valorImovelAtual * (custoManutencaoAnual / 100)) / 12;
          const itrMensal = (valorImovelAtual * (itrAnual / 100)) / 12;
          custosMensais = custoManutencaoMensal + itrMensal;
        }

        let parcela = 0;

        if (!financiamentoQuitado && saldoDevedor > 0.5 && mes <= mesesFinanciamento) {
          if (modo === 'leilao') {
            // Leilão: parcelas simples (valor / nº parcelas) + correção no saldo
            if (taxaFinMensal > 0) {
              saldoDevedor = saldoDevedor * (1 + taxaFinMensal);
            }
            parcela = financiado / mesesFinanciamento;
            // Se correção faz saldo crescer, ajusta última parcela
            if (taxaFinMensal > 0) {
              parcela = this.calcPMT(financiado, taxaFinMensal, mesesFinanciamento);
              const juros = saldoDevedor * taxaFinMensal / (1 + taxaFinMensal);
              parcela = Math.min(parcela, saldoDevedor);
            }
            saldoDevedor -= parcela;
          } else if (sistemaAmortizacao === 'sac') {
            const amortizacao = financiado / mesesFinanciamento;
            const juros = saldoDevedor * taxaFinMensal;
            parcela = amortizacao + juros;
            saldoDevedor -= amortizacao;
          } else {
            const juros = saldoDevedor * taxaFinMensal;
            const amortizacao = parcelaPrice - juros;
            parcela = parcelaPrice;
            saldoDevedor -= amortizacao;
          }

          if (saldoDevedor < 0.5) {
            saldoDevedor = 0;
            financiamentoQuitado = true;
            mesQuitacao = mes;
          }
          totalPagoFinanciamento += parcela;
        }

        const fluxoLiquido = aluguelRecebido - parcela - custosMensais;
        totalRecebidoAluguel += aluguelRecebido;
        totalCustosImovel += custosMensais;

        saldoInvB = saldoInvB * (1 + taxaInvMensal) + fluxoLiquido;

        const patrimonioB = valorImovelAtual + saldoInvB - saldoDevedor;
        cenarioB.patrimonio.push(patrimonioB);
        cenarioB.patrimonioReal.push(patrimonioB / Math.pow(1 + inflacaoMensal, mes));
        cenarioB.valorImovelHist.push(valorImovelAtual);
        cenarioB.saldoInvestHist.push(saldoInvB);
        cenarioB.saldoDevedorHist.push(saldoDevedor);
        cenarioB.parcelaHist.push(parcela);
        cenarioB.aluguelHist.push(aluguelRecebido);
        cenarioB.custosHist.push(custosMensais);
      }

      const anos = totalMeses / 12;
      const retornoNominalA = ((saldoA / capitalInvestimento) - 1) * 100;
      const retornoNominalB = ((cenarioB.patrimonio[totalMeses - 1] / capitalInvestimento) - 1) * 100;
      const retornoRealA = ((cenarioA.patrimonioReal[totalMeses - 1] / capitalInvestimento) - 1) * 100;
      const retornoRealB = ((cenarioB.patrimonioReal[totalMeses - 1] / capitalInvestimento) - 1) * 100;
      const taxaAnualA = (Math.pow(saldoA / capitalInvestimento, 1 / anos) - 1) * 100;
      const taxaAnualB = (Math.pow(Math.max(cenarioB.patrimonio[totalMeses - 1], 1) / capitalInvestimento, 1 / anos) - 1) * 100;

      return {
        modo,
        totalMeses,
        capitalInvestimento,
        custoInicialTotal,
        cenarioA: {
          patrimonioFinal: saldoA,
          patrimonioRealFinal: cenarioA.patrimonioReal[totalMeses - 1],
          retornoNominal: retornoNominalA,
          retornoReal: retornoRealA,
          taxaAnual: taxaAnualA,
          historico: cenarioA.patrimonio,
          historicoReal: cenarioA.patrimonioReal
        },
        cenarioB: {
          patrimonioFinal: cenarioB.patrimonio[totalMeses - 1],
          patrimonioRealFinal: cenarioB.patrimonioReal[totalMeses - 1],
          retornoNominal: retornoNominalB,
          retornoReal: retornoRealB,
          taxaAnual: taxaAnualB,
          historico: cenarioB.patrimonio,
          historicoReal: cenarioB.patrimonioReal,
          valorImovelFinal: valorImovelAtual,
          saldoInvestFinal: saldoInvB,
          saldoDevedorFinal: saldoDevedor,
          totalPagoFinanciamento,
          totalRecebidoAluguel,
          totalCustosImovel,
          entrada,
          mesQuitacao,
          financiado,
          parcelaPrimeira: cenarioB.parcelaHist[0] || 0,
          parcelaUltima: cenarioB.parcelaHist[Math.min(mesesFinanciamento - 1, cenarioB.parcelaHist.length - 1)] || 0,
          valorImovelHist: cenarioB.valorImovelHist,
          saldoInvestHist: cenarioB.saldoInvestHist,
          saldoDevedorHist: cenarioB.saldoDevedorHist
        },
        // Leilão extras
        leilao: modo === 'leilao' ? {
          valorArrematacao,
          desconto: ((1 - valorArrematacao / valorMercado) * 100),
          comissao: valorArrematacao * (comissaoLeiloeiro / 100),
          itbi: valorArrematacao * (itbiPercentual / 100),
          escritura: custoEscritura,
          registro: custoRegistro,
          imissao: custoImissao,
          mesesImissao,
          custasTotal: custoInicialTotal - entrada
        } : null,
        vencedor: cenarioB.patrimonio[totalMeses - 1] > saldoA ? 'imovel' : 'investimento',
        diferenca: Math.abs(cenarioB.patrimonio[totalMeses - 1] - saldoA)
      };
    },

    // ============================================
    // RENDERIZAÇÃO DOS RESULTADOS
    // ============================================
    renderResultados(result, params) {
      const container = document.getElementById('sim-fin-resultados');
      if (!container) return;

      const { cenarioA, cenarioB, vencedor, diferenca, totalMeses, modo, leilao } = result;
      const anos = totalMeses / 12;

      const modoLabel = modo === 'leilao' ? 'Leilão' : 'Financiamento';
      const vencedorLabel = vencedor === 'imovel' ? `${modoLabel} + Aluguel` : 'Investimento Puro';
      const vencedorClass = vencedor === 'imovel' ? 'bullish' : 'neutral';

      let leilaoResumoHTML = '';
      if (leilao) {
        leilaoResumoHTML = `
          <div class="sim-fin-detalhe-card sim-fin-leilao-resumo">
            <h5>Resumo da Arrematação</h5>
            <div class="sim-fin-metric highlight">
              <span class="label">Desconto sobre avaliação</span>
              <span class="value positive">${this.formatPercent(leilao.desconto)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Valor de avaliação</span>
              <span class="value">${this.formatCurrency(params.valorMercado)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Valor arrematado</span>
              <span class="value">${this.formatCurrency(leilao.valorArrematacao)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Comissão leiloeiro</span>
              <span class="value negative">${this.formatCurrency(leilao.comissao)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">ITBI</span>
              <span class="value negative">${this.formatCurrency(leilao.itbi)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Escritura + Registro</span>
              <span class="value negative">${this.formatCurrency(leilao.escritura + leilao.registro)}</span>
            </div>
            ${leilao.imissao > 0 ? `<div class="sim-fin-metric">
              <span class="label">Custas de imissão</span>
              <span class="value negative">${this.formatCurrency(leilao.imissao)}</span>
            </div>` : ''}
            <div class="sim-fin-metric" style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 4px;">
              <span class="label"><strong>Total custas extras</strong></span>
              <span class="value negative"><strong>${this.formatCurrency(leilao.custasTotal)}</strong></span>
            </div>
            <div class="sim-fin-metric">
              <span class="label"><strong>Custo total de aquisição</strong></span>
              <span class="value"><strong>${this.formatCurrency(result.custoInicialTotal + cenarioB.financiado)}</strong></span>
            </div>
            ${leilao.mesesImissao > 0 ? `<div class="sim-fin-metric">
              <span class="label">Período sem o imóvel</span>
              <span class="value">${leilao.mesesImissao} mes${leilao.mesesImissao > 1 ? 'es' : ''}</span>
            </div>` : ''}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="sim-fin-resultado-header">
          <div class="sim-fin-vencedor ${vencedorClass}">
            <span class="sim-fin-vencedor-icon">${vencedor === 'imovel' ? (modo === 'leilao' ? '🔨' : '🏠') : '📈'}</span>
            <div>
              <span class="sim-fin-vencedor-label">Vencedor em ${anos} anos</span>
              <span class="sim-fin-vencedor-nome">${vencedorLabel}</span>
            </div>
            <span class="sim-fin-vencedor-diff">+${this.formatCurrency(diferenca)}</span>
          </div>
        </div>

        ${leilaoResumoHTML}

        <div class="sim-fin-comparativo">
          <div class="sim-fin-cenario ${vencedor === 'investimento' ? 'winner' : ''}">
            <div class="sim-fin-cenario-header">
              <span class="sim-fin-cenario-icon">📈</span>
              <h4>Cenário A: Investimento Puro</h4>
            </div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric">
                <span class="label">Capital inicial</span>
                <span class="value">${this.formatCurrency(result.capitalInvestimento)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Taxa (a.m.)</span>
                <span class="value">${this.formatPercent(params.taxaInvestimentoMensal)}</span>
              </div>
              <div class="sim-fin-metric highlight">
                <span class="label">Patrimônio final</span>
                <span class="value">${this.formatCurrency(cenarioA.patrimonioFinal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Retorno nominal</span>
                <span class="value">${this.formatPercent(cenarioA.retornoNominal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Retorno real</span>
                <span class="value">${this.formatPercent(cenarioA.retornoReal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Taxa equiv. anual</span>
                <span class="value">${this.formatPercent(cenarioA.taxaAnual)} a.a.</span>
              </div>
            </div>
          </div>

          <div class="sim-fin-vs">VS</div>

          <div class="sim-fin-cenario ${vencedor === 'imovel' ? 'winner' : ''}">
            <div class="sim-fin-cenario-header">
              <span class="sim-fin-cenario-icon">${modo === 'leilao' ? '🔨' : '🏠'}</span>
              <h4>Cenário B: ${modoLabel}</h4>
            </div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric">
                <span class="label">${modo === 'leilao' ? 'Investido (entrada + custas)' : 'Entrada (' + this.formatPercent(params.percentualEntrada) + ')'}</span>
                <span class="value">${this.formatCurrency(result.custoInicialTotal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">1ª parcela</span>
                <span class="value">${this.formatCurrency(cenarioB.parcelaPrimeira)}</span>
              </div>
              ${cenarioB.parcelaPrimeira !== cenarioB.parcelaUltima ? `<div class="sim-fin-metric">
                <span class="label">Última parcela</span>
                <span class="value">${this.formatCurrency(cenarioB.parcelaUltima)}</span>
              </div>` : ''}
              <div class="sim-fin-metric highlight">
                <span class="label">Patrimônio final</span>
                <span class="value">${this.formatCurrency(cenarioB.patrimonioFinal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Retorno nominal</span>
                <span class="value">${this.formatPercent(cenarioB.retornoNominal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Retorno real</span>
                <span class="value">${this.formatPercent(cenarioB.retornoReal)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Taxa equiv. anual</span>
                <span class="value">${this.formatPercent(cenarioB.taxaAnual)} a.a.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sim-fin-detalhes-grid">
          <div class="sim-fin-detalhe-card">
            <h5>Composição Final - Cenário B</h5>
            <div class="sim-fin-metric">
              <span class="label">Valor do imóvel</span>
              <span class="value">${this.formatCurrency(cenarioB.valorImovelFinal)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Saldo investido</span>
              <span class="value ${cenarioB.saldoInvestFinal < 0 ? 'negative' : ''}">${this.formatCurrency(cenarioB.saldoInvestFinal)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Saldo devedor</span>
              <span class="value">${this.formatCurrency(cenarioB.saldoDevedorFinal)}</span>
            </div>
          </div>
          <div class="sim-fin-detalhe-card">
            <h5>Fluxos Acumulados</h5>
            <div class="sim-fin-metric">
              <span class="label">Total pago em parcelas</span>
              <span class="value negative">${this.formatCurrency(cenarioB.totalPagoFinanciamento)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Total recebido em aluguel</span>
              <span class="value positive">${this.formatCurrency(cenarioB.totalRecebidoAluguel)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Total custos (manut. + impostos)</span>
              <span class="value negative">${this.formatCurrency(cenarioB.totalCustosImovel)}</span>
            </div>
          </div>
        </div>

        <div class="sim-fin-chart-container">
          <div class="sim-fin-chart-header">
            <h5>Evolução Patrimonial</h5>
            <div class="sim-fin-chart-toggle">
              <button class="active" data-view="nominal">Nominal</button>
              <button data-view="real">Real</button>
            </div>
          </div>
          <canvas id="sim-fin-chart" height="300"></canvas>
        </div>

        <div class="sim-fin-chart-container" style="margin-top: 20px;">
          <h5>Composição do Patrimônio (Cenário B)</h5>
          <canvas id="sim-fin-chart-composicao" height="250"></canvas>
        </div>

        <div class="sim-fin-conclusao">
          <h5>Análise</h5>
          <ul>
            ${this.gerarConclusoes(result, params)}
          </ul>
          <p class="sim-fin-disclaimer">Esta simulação é apenas educacional e não constitui recomendação de investimento. Valores reais podem variar conforme condições de mercado, taxas e impostos específicos.</p>
        </div>
      `;

      container.style.display = 'block';

      container.querySelectorAll('.sim-fin-chart-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.sim-fin-chart-toggle button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderChart(result, btn.dataset.view);
        });
      });

      this.renderChart(result, 'nominal');
      this.renderChartComposicao(result);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    gerarConclusoes(result, params) {
      const { cenarioA, cenarioB, vencedor, diferenca, totalMeses, modo, leilao } = result;
      const anos = totalMeses / 12;
      const conclusoes = [];

      if (vencedor === 'investimento') {
        conclusoes.push(`<li>Com taxa de <strong>${this.formatPercent(params.taxaInvestimentoMensal)} ao mês</strong>, investir o capital inteiro rende <strong>${this.formatCurrency(diferenca)}</strong> a mais em ${anos} anos.</li>`);
      } else {
        const label = modo === 'leilao' ? 'arrematação em leilão' : 'financiamento';
        conclusoes.push(`<li>A ${label} com aluguel gerou <strong>${this.formatCurrency(diferenca)}</strong> a mais que investir tudo, graças ao efeito da <strong>alavancagem</strong>.</li>`);
      }

      if (modo === 'leilao' && leilao) {
        conclusoes.push(`<li>O desconto de <strong>${this.formatPercent(leilao.desconto)}</strong> na arrematação gerou um yield de aluguel efetivo maior, pois o aluguel é baseado no valor de mercado (${this.formatCurrency(params.valorMercado)}) enquanto você pagou apenas ${this.formatCurrency(leilao.valorArrematacao)}.</li>`);

        if (leilao.mesesImissao > 0) {
          conclusoes.push(`<li>Os <strong>${leilao.mesesImissao} meses sem o imóvel</strong> (imissão na posse) representaram um custo de oportunidade considerado na simulação.</li>`);
        }

        conclusoes.push(`<li>As custas extras de arrematação (leiloeiro, ITBI, escritura, registro${leilao.imissao > 0 ? ', imissão' : ''}) totalizaram <strong>${this.formatCurrency(leilao.custasTotal)}</strong>.</li>`);
      }

      if (cenarioB.totalPagoFinanciamento > 0) {
        const custoJuros = cenarioB.totalPagoFinanciamento - cenarioB.financiado;
        if (custoJuros > 0) {
          conclusoes.push(`<li>O custo total dos juros/correção foi de <strong>${this.formatCurrency(custoJuros)}</strong>.</li>`);
        }
      }

      if (cenarioB.totalRecebidoAluguel > 0 && cenarioB.totalPagoFinanciamento > 0) {
        conclusoes.push(`<li>O aluguel cobriu <strong>${this.formatPercent(cenarioB.totalRecebidoAluguel / cenarioB.totalPagoFinanciamento * 100)}</strong> do total das parcelas.</li>`);
      }

      if (cenarioB.saldoInvestFinal < 0) {
        conclusoes.push(`<li class="warning">O saldo do investimento ficou <strong>negativo</strong> (${this.formatCurrency(cenarioB.saldoInvestFinal)}), indicando que seria necessário renda extra para cobrir as parcelas.</li>`);
      }

      const valorizacaoImovel = cenarioB.valorImovelFinal - params.valorMercado;
      conclusoes.push(`<li>O imóvel valorizou <strong>${this.formatCurrency(valorizacaoImovel)}</strong> (de ${this.formatCurrency(params.valorMercado)} para ${this.formatCurrency(cenarioB.valorImovelFinal)}).</li>`);

      // Ponto de equilíbrio
      const hA = cenarioA.historico;
      const hB = cenarioB.historico;
      let pe = -1;
      for (let i = 0; i < hA.length; i++) {
        if (vencedor === 'imovel' && hB[i] > hA[i]) { pe = i + 1; break; }
        if (vencedor === 'investimento' && hA[i] > hB[i]) { pe = i + 1; break; }
      }
      if (pe > 0) {
        const anosEq = Math.floor(pe / 12);
        const mesesEq = pe % 12;
        const tempoStr = anosEq > 0 ? `${anosEq} ano${anosEq > 1 ? 's' : ''}${mesesEq > 0 ? ` e ${mesesEq} mes${mesesEq > 1 ? 'es' : ''}` : ''}` : `${mesesEq} mes${mesesEq > 1 ? 'es' : ''}`;
        conclusoes.push(`<li>O cenário vencedor ultrapassou o outro após <strong>${tempoStr}</strong>.</li>`);
      }

      return conclusoes.join('');
    },

    // ============================================
    // CHARTS
    // ============================================
    renderChart(result, view) {
      const ctx = document.getElementById('sim-fin-chart');
      if (!ctx) return;
      if (this.chart) this.chart.destroy();

      const isReal = view === 'real';
      const dadosA = isReal ? result.cenarioA.historicoReal : result.cenarioA.historico;
      const dadosB = isReal ? result.cenarioB.historicoReal : result.cenarioB.historico;

      const labels = [], dataA = [], dataB = [];
      const step = Math.max(1, Math.floor(dadosA.length / 80));
      for (let i = 0; i < dadosA.length; i++) {
        if (i % step === 0 || i === dadosA.length - 1) {
          const ano = Math.floor(i / 12);
          const mes = (i % 12) + 1;
          labels.push(ano > 0 ? `${ano}a ${mes}m` : `${mes}m`);
          dataA.push(dadosA[i]);
          dataB.push(dadosB[i]);
        }
      }

      const modoLabel = result.modo === 'leilao' ? 'Leilão + Aluguel' : 'Financiamento + Aluguel';
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Investimento Puro', data: dataA, borderColor: '#3b82f6', fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 },
            { label: modoLabel, data: dataB, borderColor: '#22c55e', fill: false, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { labels: { color: '#8b949e', font: { size: 12 } } },
            tooltip: {
              backgroundColor: '#1c2128', titleColor: '#f0f6fc', bodyColor: '#f0f6fc', borderColor: '#30363d', borderWidth: 1,
              callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }) }
            }
          },
          scales: {
            x: { ticks: { color: '#6e7681', font: { size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(48, 54, 61, 0.3)' } },
            y: { ticks: { color: '#6e7681', font: { size: 10 }, callback: v => v >= 1e6 ? 'R$ ' + (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? 'R$ ' + (v/1e3).toFixed(0) + 'k' : 'R$ ' + v }, grid: { color: 'rgba(48, 54, 61, 0.3)' } }
          }
        }
      });
    },

    renderChartComposicao(result) {
      const ctx = document.getElementById('sim-fin-chart-composicao');
      if (!ctx) return;
      if (this.chartComp) this.chartComp.destroy();

      const labels = [], dataImovel = [], dataInvest = [], dataDivida = [];
      const hist = result.cenarioB;
      const step = Math.max(1, Math.floor(hist.valorImovelHist.length / 60));
      for (let i = 0; i < hist.valorImovelHist.length; i++) {
        if (i % step === 0 || i === hist.valorImovelHist.length - 1) {
          const ano = Math.floor(i / 12), mes = (i % 12) + 1;
          labels.push(ano > 0 ? `${ano}a ${mes}m` : `${mes}m`);
          dataImovel.push(hist.valorImovelHist[i]);
          dataInvest.push(Math.max(0, hist.saldoInvestHist[i]));
          dataDivida.push(-hist.saldoDevedorHist[i]);
        }
      }

      this.chartComp = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Valor do Imóvel', data: dataImovel, backgroundColor: 'rgba(34,197,94,0.7)', borderColor: '#22c55e', borderWidth: 1, stack: 'p' },
            { label: 'Saldo Investido', data: dataInvest, backgroundColor: 'rgba(59,130,246,0.7)', borderColor: '#3b82f6', borderWidth: 1, stack: 'p' },
            { label: 'Saldo Devedor', data: dataDivida, backgroundColor: 'rgba(248,81,73,0.7)', borderColor: '#f85149', borderWidth: 1, stack: 'n' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { labels: { color: '#8b949e', font: { size: 11 } } },
            tooltip: {
              backgroundColor: '#1c2128', titleColor: '#f0f6fc', bodyColor: '#f0f6fc', borderColor: '#30363d', borderWidth: 1,
              callbacks: { label: ctx => { const v = Math.abs(ctx.raw); return ctx.dataset.label + ': ' + (ctx.raw < 0 ? '-' : '') + v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }); } }
            }
          },
          scales: {
            x: { ticks: { color: '#6e7681', font: { size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(48,54,61,0.3)' }, stacked: true },
            y: { stacked: true, ticks: { color: '#6e7681', font: { size: 10 }, callback: v => { const a = Math.abs(v), p = v < 0 ? '-R$ ' : 'R$ '; return a >= 1e6 ? p + (a/1e6).toFixed(1) + 'M' : a >= 1e3 ? p + (a/1e3).toFixed(0) + 'k' : p + a; } }, grid: { color: 'rgba(48,54,61,0.3)' } }
          }
        }
      });
    },

    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
      document.getElementById('sim-fin-btn')?.addEventListener('click', () => this.executar());

      ['sim-fin-valor-imovel', 'sim-fin-valor-arrematacao'].forEach(id => {
        const el = document.getElementById(id);
        if (el) this.applyMask(el);
      });

      // Mode toggle
      document.querySelectorAll('.sim-fin-modo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim-fin-modo-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.modo = btn.dataset.modo;
          this.toggleSections();
        });
      });

      // Preset
      document.querySelectorAll('.sim-fin-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim-fin-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.aplicarPreset(btn.dataset.preset);
        });
      });

      // Terreno toggle
      document.getElementById('sim-fin-terreno')?.addEventListener('change', () => this.toggleAluguelSection());
    },

    toggleSections() {
      const convSections = document.querySelectorAll('.sim-fin-conv-only');
      const leilaoSections = document.querySelectorAll('.sim-fin-leilao-only');

      convSections.forEach(el => el.style.display = this.modo === 'convencional' ? '' : 'none');
      leilaoSections.forEach(el => el.style.display = this.modo === 'leilao' ? '' : 'none');

      // Update presets
      const presetsConv = document.querySelector('.sim-fin-presets-conv');
      const presetsLeilao = document.querySelector('.sim-fin-presets-leilao');
      if (presetsConv) presetsConv.style.display = this.modo === 'convencional' ? '' : 'none';
      if (presetsLeilao) presetsLeilao.style.display = this.modo === 'leilao' ? '' : 'none';
    },

    toggleAluguelSection() {
      const isTerreno = document.getElementById('sim-fin-terreno')?.checked;
      const section = document.querySelector('.sim-fin-aluguel-section');
      if (section) section.style.display = isTerreno ? 'none' : '';
    },

    aplicarPreset(preset) {
      const presets = {
        // Convencional
        conservador: { valorImovel: '500.000', percentualEntrada: '20', taxaFinanciamento: '9', prazo: '30', valorizacao: '5', aluguel: '0,4', vacancia: '10', taxaInvestimento: '0,8', sistema: 'sac', inflacao: '5', reajusteAluguel: '5', manutencao: '1', itr: '0,5', horizonte: '30' },
        moderado: { valorImovel: '500.000', percentualEntrada: '20', taxaFinanciamento: '9', prazo: '30', valorizacao: '6', aluguel: '0,5', vacancia: '8', taxaInvestimento: '1', sistema: 'sac', inflacao: '5', reajusteAluguel: '6', manutencao: '0,5', itr: '0,3', horizonte: '30' },
        otimista: { valorImovel: '500.000', percentualEntrada: '20', taxaFinanciamento: '8', prazo: '25', valorizacao: '8', aluguel: '0,6', vacancia: '5', taxaInvestimento: '1', sistema: 'sac', inflacao: '4,5', reajusteAluguel: '7', manutencao: '0,5', itr: '0,3', horizonte: '25' },
        // Leilão
        'leilao-conservador': { valorImovel: '500.000', valorArrematacao: '375.000', percentualEntrada: '25', comissao: '5', itbi: '3', escritura: '1.500', registro: '1.500', imissao: '3.000', mesesImissao: '6', parcelasLeilao: '30', correcao: 'ipca', taxaFixa: '0', valorizacao: '5', aluguel: '0,5', vacancia: '10', taxaInvestimento: '0,8', inflacao: '5', reajusteAluguel: '5', manutencao: '1', itr: '0,5', horizonte: '10' },
        'leilao-moderado': { valorImovel: '500.000', valorArrematacao: '350.000', percentualEntrada: '25', comissao: '5', itbi: '3', escritura: '1.500', registro: '1.500', imissao: '2.000', mesesImissao: '4', parcelasLeilao: '30', correcao: 'ipca', taxaFixa: '0', valorizacao: '6', aluguel: '0,5', vacancia: '8', taxaInvestimento: '1', inflacao: '5', reajusteAluguel: '6', manutencao: '0,5', itr: '0,3', horizonte: '10' },
        'leilao-otimista': { valorImovel: '500.000', valorArrematacao: '300.000', percentualEntrada: '20', comissao: '5', itbi: '3', escritura: '1.500', registro: '1.500', imissao: '1.000', mesesImissao: '3', parcelasLeilao: '12', correcao: 'nenhuma', taxaFixa: '0', valorizacao: '8', aluguel: '0,6', vacancia: '5', taxaInvestimento: '1', inflacao: '4,5', reajusteAluguel: '7', manutencao: '0,5', itr: '0,3', horizonte: '10' }
      };

      const p = presets[preset];
      if (!p) return;

      // Campos comuns
      const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
      set('sim-fin-valor-imovel', p.valorImovel);
      set('sim-fin-entrada', p.percentualEntrada);
      set('sim-fin-valorizacao', p.valorizacao);
      set('sim-fin-aluguel', p.aluguel);
      set('sim-fin-vacancia', p.vacancia);
      set('sim-fin-taxa-inv', p.taxaInvestimento);
      set('sim-fin-inflacao', p.inflacao);
      set('sim-fin-reajuste', p.reajusteAluguel);
      set('sim-fin-manutencao', p.manutencao);
      set('sim-fin-itr', p.itr);
      set('sim-fin-horizonte', p.horizonte);

      // Convencional
      set('sim-fin-taxa-fin', p.taxaFinanciamento);
      set('sim-fin-prazo', p.prazo);
      set('sim-fin-sistema', p.sistema);

      // Leilão
      set('sim-fin-valor-arrematacao', p.valorArrematacao);
      set('sim-fin-comissao', p.comissao);
      set('sim-fin-itbi', p.itbi);
      set('sim-fin-escritura', p.escritura);
      set('sim-fin-registro', p.registro);
      set('sim-fin-imissao', p.imissao);
      set('sim-fin-meses-imissao', p.mesesImissao);
      set('sim-fin-parcelas-leilao', p.parcelasLeilao);
      set('sim-fin-correcao', p.correcao);
      set('sim-fin-taxa-fixa', p.taxaFixa);
    },

    executar() {
      const g = (id) => document.getElementById(id);
      const isLeilao = this.modo === 'leilao';
      const ehTerreno = g('sim-fin-terreno')?.checked || false;

      const params = {
        modo: this.modo,
        valorMercado: this.parseCurrency(g('sim-fin-valor-imovel').value),
        percentualEntrada: this.parsePercent(g('sim-fin-entrada').value),
        valorizacaoImovelAnual: this.parsePercent(g('sim-fin-valorizacao').value),
        aluguelPercentualMensal: this.parsePercent(g('sim-fin-aluguel').value),
        taxaVacancia: this.parsePercent(g('sim-fin-vacancia').value),
        taxaInvestimentoMensal: this.parsePercent(g('sim-fin-taxa-inv').value),
        inflacaoAnual: this.parsePercent(g('sim-fin-inflacao').value),
        reajusteAluguelAnual: this.parsePercent(g('sim-fin-reajuste').value),
        custoManutencaoAnual: this.parsePercent(g('sim-fin-manutencao').value),
        itrAnual: this.parsePercent(g('sim-fin-itr').value),
        ehTerreno,
        horizonte: parseInt(g('sim-fin-horizonte')?.value) || (isLeilao ? 10 : 30)
      };

      if (isLeilao) {
        params.valorArrematacao = this.parseCurrency(g('sim-fin-valor-arrematacao')?.value);
        params.comissaoLeiloeiro = this.parsePercent(g('sim-fin-comissao')?.value);
        params.itbiPercentual = this.parsePercent(g('sim-fin-itbi')?.value);
        params.custoEscritura = this.parseCurrency(g('sim-fin-escritura')?.value);
        params.custoRegistro = this.parseCurrency(g('sim-fin-registro')?.value);
        params.custoImissao = this.parseCurrency(g('sim-fin-imissao')?.value);
        params.mesesImissao = parseInt(g('sim-fin-meses-imissao')?.value) || 0;
        params.prazoParcelasLeilao = parseInt(g('sim-fin-parcelas-leilao')?.value) || 30;
        params.correcaoLeilao = g('sim-fin-correcao')?.value || 'nenhuma';
        params.taxaFixaLeilao = this.parsePercent(g('sim-fin-taxa-fixa')?.value);

        if (!params.valorArrematacao || params.valorArrematacao <= 0) {
          alert('Informe o valor de arrematação.');
          return;
        }
      } else {
        params.taxaFinanciamentoAnual = this.parsePercent(g('sim-fin-taxa-fin').value);
        params.prazoFinanciamentoAnos = parseInt(g('sim-fin-prazo').value) || 30;
        params.sistemaAmortizacao = g('sim-fin-sistema').value || 'sac';
      }

      if (params.valorMercado <= 0) { alert('Informe o valor do imóvel.'); return; }
      if (params.percentualEntrada <= 0 || params.percentualEntrada >= 100) { alert('A entrada deve ser entre 1% e 99%.'); return; }

      const result = this.simular(params);
      this.renderResultados(result, params);
    },

    // ============================================
    // RENDER FORMULÁRIO
    // ============================================
    render(container) {
      container.innerHTML = `
        <div class="sim-fin-wrapper">
          <div class="sim-fin-intro">
            <h2>Financiamento Imobiliário vs Investimento</h2>
            <p>Compare: investir todo o capital <strong>ou</strong> comprar um imóvel (convencional ou leilão), alugar e investir o restante.</p>
          </div>

          <!-- Mode Toggle -->
          <div class="sim-fin-modo-toggle">
            <button class="sim-fin-modo-btn active" data-modo="convencional">
              <span class="sim-fin-modo-icon">🏦</span>
              <span>Convencional</span>
            </button>
            <button class="sim-fin-modo-btn" data-modo="leilao">
              <span class="sim-fin-modo-icon">🔨</span>
              <span>Leilão</span>
            </button>
          </div>

          <!-- Presets Convencional -->
          <div class="sim-fin-presets sim-fin-presets-conv">
            <span class="sim-fin-presets-label">Cenários:</span>
            <button class="sim-fin-preset" data-preset="conservador">Conservador</button>
            <button class="sim-fin-preset active" data-preset="moderado">Moderado</button>
            <button class="sim-fin-preset" data-preset="otimista">Otimista</button>
          </div>

          <!-- Presets Leilão -->
          <div class="sim-fin-presets sim-fin-presets-leilao" style="display:none;">
            <span class="sim-fin-presets-label">Cenários:</span>
            <button class="sim-fin-preset" data-preset="leilao-conservador">Conservador</button>
            <button class="sim-fin-preset" data-preset="leilao-moderado">Moderado</button>
            <button class="sim-fin-preset" data-preset="leilao-otimista">Otimista</button>
          </div>

          <div class="sim-fin-form">
            <!-- Imóvel -->
            <div class="sim-fin-section">
              <h3>Imóvel</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-valor-imovel">Valor de mercado / avaliação</label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-valor-imovel" value="500.000" inputmode="numeric">
                  </div>
                </div>
                <div class="sim-fin-field sim-fin-leilao-only" style="display:none;">
                  <label for="sim-fin-valor-arrematacao">Valor de arrematação <span class="sim-fin-tip" title="Valor efetivamente pago no leilão. Geralmente 20-40% abaixo da avaliação.">?</span></label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-valor-arrematacao" value="350.000" inputmode="numeric">
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-entrada">Entrada</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-entrada" value="20" inputmode="decimal">
                    <span>%</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-valorizacao">Valorização anual <span class="sim-fin-tip" title="Valorização sobre o valor de mercado. Historicamente IPCA a IPCA+3%.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-valorizacao" value="6" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-horizonte">Horizonte da simulação</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-horizonte" value="30" inputmode="numeric">
                    <span>anos</span>
                  </div>
                </div>
                <div class="sim-fin-field sim-fin-field-checkbox">
                  <label class="sim-fin-checkbox-label">
                    <input type="checkbox" id="sim-fin-terreno">
                    <span>É terreno (sem aluguel)</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Financiamento Convencional -->
            <div class="sim-fin-section sim-fin-conv-only">
              <h3>Financiamento</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-taxa-fin">Taxa de juros anual</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-taxa-fin" value="9" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-prazo">Prazo</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-prazo" value="30" inputmode="numeric">
                    <span>anos</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-sistema">Sistema</label>
                  <select id="sim-fin-sistema">
                    <option value="sac" selected>SAC</option>
                    <option value="price">Price (Parcela Fixa)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Custas do Leilão -->
            <div class="sim-fin-section sim-fin-leilao-only" style="display:none;">
              <h3>Parcelamento do Leilão</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-parcelas-leilao">Nº de parcelas</label>
                  <select id="sim-fin-parcelas-leilao">
                    <option value="1">À vista</option>
                    <option value="12">12x</option>
                    <option value="24">24x</option>
                    <option value="30" selected>30x</option>
                    <option value="48">48x</option>
                    <option value="60">60x</option>
                  </select>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-correcao">Correção das parcelas <span class="sim-fin-tip" title="Índice de correção aplicado ao saldo devedor das parcelas do leilão.">?</span></label>
                  <select id="sim-fin-correcao">
                    <option value="nenhuma">Nenhuma</option>
                    <option value="igpm">IGP-M (~5,5% a.a.)</option>
                    <option value="ipca" selected>IPCA (= inflação)</option>
                  </select>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-taxa-fixa">Taxa fixa adicional <span class="sim-fin-tip" title="Alguns leilões cobram correção + taxa fixa anual sobre o saldo. Ex: IPCA + 1% a.a.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-taxa-fixa" value="0" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sim-fin-section sim-fin-leilao-only" style="display:none;">
              <h3>Custas de Arrematação</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-comissao">Comissão leiloeiro <span class="sim-fin-tip" title="Percentual sobre o valor de arrematação. Geralmente 5%.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-comissao" value="5" inputmode="decimal">
                    <span>%</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-itbi">ITBI <span class="sim-fin-tip" title="Imposto de transmissão. Geralmente 2-3% sobre valor de arrematação.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-itbi" value="3" inputmode="decimal">
                    <span>%</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-escritura">Escritura (tabelionato)</label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-escritura" value="1.500" inputmode="numeric">
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-registro">Registro de imóveis</label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-registro" value="1.500" inputmode="numeric">
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-imissao">Custas de imissão na posse <span class="sim-fin-tip" title="Custos judiciais para obter a posse do imóvel (advogado, custas processuais). Pode ser R$0 se desocupado.">?</span></label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-imissao" value="2.000" inputmode="numeric">
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-meses-imissao">Prazo de imissão <span class="sim-fin-tip" title="Meses até você receber o imóvel e poder alugar. Sem aluguel neste período.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-meses-imissao" value="4" inputmode="numeric">
                    <span>meses</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aluguel -->
            <div class="sim-fin-section sim-fin-aluguel-section">
              <h3>Aluguel</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-aluguel">Aluguel mensal <span class="sim-fin-tip" title="% do valor de mercado por mês. Típico: 0,3% a 0,6%. No leilão, como você pagou menos, o yield efetivo é maior.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-aluguel" value="0,5" inputmode="decimal">
                    <span>% do valor</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-vacancia">Taxa de vacância</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-vacancia" value="8" inputmode="decimal">
                    <span>%</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-reajuste">Reajuste anual</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-reajuste" value="6" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Investimento -->
            <div class="sim-fin-section">
              <h3>Investimento Alternativo</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-taxa-inv">Rendimento mensal <span class="sim-fin-tip" title="Taxa do investimento alternativo. 1% a.m. = ~12,68% a.a.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-taxa-inv" value="1" inputmode="decimal">
                    <span>% a.m.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custos e Inflação -->
            <div class="sim-fin-section">
              <h3>Custos e Inflação</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-inflacao">Inflação anual</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-inflacao" value="5" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-manutencao">Manutenção anual</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-manutencao" value="0,5" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-itr">IPTU/ITR anual</label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-itr" value="0,3" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <button class="sim-fin-btn-simular" id="sim-fin-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Simular
            </button>
          </div>

          <div id="sim-fin-resultados" style="display: none;"></div>
        </div>
      `;

      this.aplicarPreset('moderado');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SIM.init());
  } else {
    SIM.init();
  }
})();
