/**
 * Simulador: Financiamento Imobiliário vs Investimento
 * Rico aos Poucos
 *
 * Compara dois cenários:
 * A) Investir todo o capital a uma taxa fixa
 * B) Financiar imóvel (entrada + parcelas) + investir o restante + receber aluguel
 */

(function() {
  'use strict';

  const SIM = {
    chart: null,

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

    // PMT - Cálculo da parcela (SAC ou Price)
    calcPMT(principal, taxaMensal, meses) {
      if (taxaMensal === 0) return principal / meses;
      return principal * (taxaMensal * Math.pow(1 + taxaMensal, meses)) / (Math.pow(1 + taxaMensal, meses) - 1);
    },

    // Simulação mês a mês
    simular(params) {
      const {
        valorImovel,
        percentualEntrada,
        taxaFinanciamentoAnual,
        prazoFinanciamentoAnos,
        valorizacaoImovelAnual,
        aluguelPercentualMensal,
        taxaVacancia,
        taxaInvestimentoMensal,
        sistemaAmortizacao,
        inflacaoAnual,
        reajusteAluguelAnual,
        custoManutencaoAnual,
        itrAnual
      } = params;

      const entrada = valorImovel * (percentualEntrada / 100);
      const financiado = valorImovel - entrada;
      const capitalInvestimento = valorImovel; // cenário A: investe tudo
      const capitalRestante = valorImovel - entrada; // cenário B: sobra após entrada
      const mesesFinanciamento = prazoFinanciamentoAnos * 12;
      const taxaFinMensal = Math.pow(1 + taxaFinanciamentoAnual / 100, 1/12) - 1;
      const taxaInvMensal = taxaInvestimentoMensal / 100;
      const valorizacaoMensal = Math.pow(1 + valorizacaoImovelAnual / 100, 1/12) - 1;
      const inflacaoMensal = Math.pow(1 + inflacaoAnual / 100, 1/12) - 1;
      const reajusteAluguelMensal = Math.pow(1 + reajusteAluguelAnual / 100, 1/12) - 1;

      // Total de meses da simulação (prazo do financiamento)
      const totalMeses = mesesFinanciamento;

      // Cenário A: Investimento puro
      const cenarioA = { patrimonio: [], patrimonioReal: [] };
      let saldoA = capitalInvestimento;

      // Cenário B: Financiamento + Investimento
      const cenarioB = {
        patrimonio: [], patrimonioReal: [],
        valorImovelHist: [], saldoInvestHist: [],
        saldoDevedorHist: [], parcelaHist: [],
        aluguelHist: [], custosHist: []
      };
      let saldoInvB = capitalRestante;
      let saldoDevedor = financiado;
      let valorImovelAtual = valorImovel;
      let aluguelAtual = valorImovel * (aluguelPercentualMensal / 100);
      let totalPagoFinanciamento = 0;
      let totalRecebidoAluguel = 0;
      let totalCustosImovel = 0;
      let financiamentoQuitado = false;
      let mesQuitacao = mesesFinanciamento;

      // Parcela Price (fixa)
      const parcelaPrice = this.calcPMT(financiado, taxaFinMensal, mesesFinanciamento);

      for (let mes = 1; mes <= totalMeses; mes++) {
        // === CENÁRIO A: Investimento puro ===
        saldoA = saldoA * (1 + taxaInvMensal);

        // Patrimônio nominal
        cenarioA.patrimonio.push(saldoA);
        // Patrimônio real (descontando inflação)
        cenarioA.patrimonioReal.push(saldoA / Math.pow(1 + inflacaoMensal, mes));

        // === CENÁRIO B: Financiamento + Investimento ===

        // Valorização do imóvel
        valorImovelAtual = valorImovelAtual * (1 + valorizacaoMensal);

        // Reajuste do aluguel (anual, a cada 12 meses)
        if (mes > 1 && (mes - 1) % 12 === 0) {
          aluguelAtual = aluguelAtual * (1 + reajusteAluguelAnual / 100);
        }

        // Aluguel efetivo (considerando vacância)
        const vacanciaEfetiva = taxaVacancia / 100;
        const aluguelRecebido = aluguelAtual * (1 - vacanciaEfetiva);

        // Custos de manutenção e ITR (mensal)
        const custoManutencaoMensal = (valorImovelAtual * (custoManutencaoAnual / 100)) / 12;
        const itrMensal = (valorImovelAtual * (itrAnual / 100)) / 12;
        const custosMensais = custoManutencaoMensal + itrMensal;

        let parcela = 0;
        let amortizacao = 0;
        let juros = 0;

        if (!financiamentoQuitado && saldoDevedor > 0) {
          if (sistemaAmortizacao === 'sac') {
            // SAC: amortização fixa + juros decrescentes
            amortizacao = financiado / mesesFinanciamento;
            juros = saldoDevedor * taxaFinMensal;
            parcela = amortizacao + juros;
          } else {
            // Price: parcela fixa
            juros = saldoDevedor * taxaFinMensal;
            amortizacao = parcelaPrice - juros;
            parcela = parcelaPrice;
          }

          saldoDevedor -= amortizacao;
          if (saldoDevedor < 1) {
            saldoDevedor = 0;
            financiamentoQuitado = true;
            mesQuitacao = mes;
          }
          totalPagoFinanciamento += parcela;
        }

        // Fluxo líquido mensal do imóvel
        const fluxoLiquido = aluguelRecebido - parcela - custosMensais;
        totalRecebidoAluguel += aluguelRecebido;
        totalCustosImovel += custosMensais;

        // Investimento do restante rende + recebe/paga o fluxo do imóvel
        saldoInvB = saldoInvB * (1 + taxaInvMensal) + fluxoLiquido;

        // Se o saldo ficou negativo, o cara está devendo (precisa colocar dinheiro do bolso)
        // Neste simulador, deixamos ficar negativo pra mostrar o custo real

        // Patrimônio total cenário B = valor do imóvel + saldo investimento - saldo devedor
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

      // Retornos
      const retornoNominalA = ((saldoA / capitalInvestimento) - 1) * 100;
      const retornoNominalB = ((cenarioB.patrimonio[totalMeses - 1] / capitalInvestimento) - 1) * 100;
      const retornoRealA = ((cenarioA.patrimonioReal[totalMeses - 1] / capitalInvestimento) - 1) * 100;
      const retornoRealB = ((cenarioB.patrimonioReal[totalMeses - 1] / capitalInvestimento) - 1) * 100;

      // Taxa equivalente anual
      const taxaAnualA = (Math.pow(saldoA / capitalInvestimento, 1 / prazoFinanciamentoAnos) - 1) * 100;
      const taxaAnualB = (Math.pow(cenarioB.patrimonio[totalMeses - 1] / capitalInvestimento, 1 / prazoFinanciamentoAnos) - 1) * 100;

      return {
        totalMeses,
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
          parcelaPrimeira: sistemaAmortizacao === 'sac'
            ? (financiado / mesesFinanciamento) + (financiado * taxaFinMensal)
            : parcelaPrice,
          parcelaUltima: sistemaAmortizacao === 'sac'
            ? (financiado / mesesFinanciamento) + ((financiado / mesesFinanciamento) * taxaFinMensal)
            : parcelaPrice,
          valorImovelHist: cenarioB.valorImovelHist,
          saldoInvestHist: cenarioB.saldoInvestHist,
          saldoDevedorHist: cenarioB.saldoDevedorHist
        },
        vencedor: cenarioB.patrimonio[totalMeses - 1] > saldoA ? 'imovel' : 'investimento',
        diferenca: Math.abs(cenarioB.patrimonio[totalMeses - 1] - saldoA)
      };
    },

    renderResultados(result, params) {
      const container = document.getElementById('sim-fin-resultados');
      if (!container) return;

      const { cenarioA, cenarioB, vencedor, diferenca, totalMeses } = result;
      const anos = totalMeses / 12;

      const vencedorLabel = vencedor === 'imovel' ? 'Financiamento + Aluguel' : 'Investimento Puro';
      const vencedorClass = vencedor === 'imovel' ? 'bullish' : 'neutral';

      container.innerHTML = `
        <div class="sim-fin-resultado-header">
          <div class="sim-fin-vencedor ${vencedorClass}">
            <span class="sim-fin-vencedor-icon">${vencedor === 'imovel' ? '🏠' : '📈'}</span>
            <div>
              <span class="sim-fin-vencedor-label">Vencedor em ${anos} anos</span>
              <span class="sim-fin-vencedor-nome">${vencedorLabel}</span>
            </div>
            <span class="sim-fin-vencedor-diff">+${this.formatCurrency(diferenca)}</span>
          </div>
        </div>

        <div class="sim-fin-comparativo">
          <div class="sim-fin-cenario ${vencedor === 'investimento' ? 'winner' : ''}">
            <div class="sim-fin-cenario-header">
              <span class="sim-fin-cenario-icon">📈</span>
              <h4>Cenário A: Investimento Puro</h4>
            </div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric">
                <span class="label">Capital inicial</span>
                <span class="value">${this.formatCurrency(params.valorImovel)}</span>
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
              <span class="sim-fin-cenario-icon">🏠</span>
              <h4>Cenário B: Financiamento</h4>
            </div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric">
                <span class="label">Entrada (${this.formatPercent(params.percentualEntrada)})</span>
                <span class="value">${this.formatCurrency(cenarioB.entrada)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">1ª parcela</span>
                <span class="value">${this.formatCurrency(cenarioB.parcelaPrimeira)}</span>
              </div>
              <div class="sim-fin-metric">
                <span class="label">Última parcela</span>
                <span class="value">${this.formatCurrency(cenarioB.parcelaUltima)}</span>
              </div>
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
              <span class="label">Total pago no financiamento</span>
              <span class="value negative">${this.formatCurrency(cenarioB.totalPagoFinanciamento)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Total recebido em aluguel</span>
              <span class="value positive">${this.formatCurrency(cenarioB.totalRecebidoAluguel)}</span>
            </div>
            <div class="sim-fin-metric">
              <span class="label">Total custos (manutenção + impostos)</span>
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

      // Chart toggle
      container.querySelectorAll('.sim-fin-chart-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.sim-fin-chart-toggle button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderChart(result, btn.dataset.view);
        });
      });

      // Render charts
      this.renderChart(result, 'nominal');
      this.renderChartComposicao(result);

      // Scroll to results
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    gerarConclusoes(result, params) {
      const { cenarioA, cenarioB, vencedor, diferenca, totalMeses } = result;
      const anos = totalMeses / 12;
      const conclusoes = [];

      if (vencedor === 'investimento') {
        conclusoes.push(`<li>Com taxa de investimento de <strong>${this.formatPercent(params.taxaInvestimentoMensal)} ao mês</strong>, investir o capital inteiro rende <strong>${this.formatCurrency(diferenca)}</strong> a mais em ${anos} anos.</li>`);
      } else {
        conclusoes.push(`<li>O financiamento com aluguel gerou <strong>${this.formatCurrency(diferenca)}</strong> a mais que investir tudo, graças ao efeito da <strong>alavancagem</strong> (você controlou um ativo de ${this.formatCurrency(params.valorImovel)} com apenas ${this.formatCurrency(cenarioB.entrada)} de entrada).</li>`);
      }

      const custoTotalFinanciamento = cenarioB.totalPagoFinanciamento - (params.valorImovel - cenarioB.entrada);
      conclusoes.push(`<li>O custo total dos juros do financiamento foi de <strong>${this.formatCurrency(custoTotalFinanciamento)}</strong> (${this.formatPercent(custoTotalFinanciamento / (params.valorImovel - cenarioB.entrada) * 100)} do valor financiado).</li>`);

      conclusoes.push(`<li>O aluguel cobriu <strong>${this.formatPercent(cenarioB.totalRecebidoAluguel / cenarioB.totalPagoFinanciamento * 100)}</strong> do total das parcelas do financiamento.</li>`);

      if (cenarioB.saldoInvestFinal < 0) {
        conclusoes.push(`<li class="warning">O saldo do investimento ficou <strong>negativo</strong> (${this.formatCurrency(cenarioB.saldoInvestFinal)}), indicando que o aluguel e o investimento não foram suficientes para cobrir as parcelas. Seria necessário renda extra.</li>`);
      }

      const valorizacaoImovel = cenarioB.valorImovelFinal - params.valorImovel;
      conclusoes.push(`<li>O imóvel valorizou <strong>${this.formatCurrency(valorizacaoImovel)}</strong> (de ${this.formatCurrency(params.valorImovel)} para ${this.formatCurrency(cenarioB.valorImovelFinal)}).</li>`);

      // Ponto de equilíbrio
      const historicoA = result.cenarioA.historico;
      const historicoB = result.cenarioB.historico;
      let pontoEquilibrio = -1;
      for (let i = 0; i < historicoA.length; i++) {
        if (vencedor === 'imovel' && historicoB[i] > historicoA[i] && pontoEquilibrio === -1) {
          pontoEquilibrio = i + 1;
          break;
        }
        if (vencedor === 'investimento' && historicoA[i] > historicoB[i] && pontoEquilibrio === -1) {
          pontoEquilibrio = i + 1;
          break;
        }
      }
      if (pontoEquilibrio > 0) {
        const anosEq = Math.floor(pontoEquilibrio / 12);
        const mesesEq = pontoEquilibrio % 12;
        const tempoStr = anosEq > 0 ? `${anosEq} ano${anosEq > 1 ? 's' : ''}${mesesEq > 0 ? ` e ${mesesEq} mes${mesesEq > 1 ? 'es' : ''}` : ''}` : `${mesesEq} mes${mesesEq > 1 ? 'es' : ''}`;
        conclusoes.push(`<li>O cenário vencedor ultrapassou o outro após <strong>${tempoStr}</strong>.</li>`);
      }

      return conclusoes.join('');
    },

    renderChart(result, view) {
      const ctx = document.getElementById('sim-fin-chart');
      if (!ctx) return;

      if (this.chart) {
        this.chart.destroy();
      }

      const isReal = view === 'real';
      const dadosA = isReal ? result.cenarioA.historicoReal : result.cenarioA.historico;
      const dadosB = isReal ? result.cenarioB.historicoReal : result.cenarioB.historico;

      const labels = [];
      const dataA = [];
      const dataB = [];

      // Mostrar pontos a cada 3 meses para não poluir
      for (let i = 0; i < dadosA.length; i++) {
        if (i % 3 === 0 || i === dadosA.length - 1) {
          const ano = Math.floor(i / 12);
          const mes = (i % 12) + 1;
          labels.push(ano > 0 ? `${ano}a ${mes}m` : `${mes}m`);
          dataA.push(dadosA[i]);
          dataB.push(dadosB[i]);
        }
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Investimento Puro',
              data: dataA,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2.5
            },
            {
              label: 'Financiamento + Aluguel',
              data: dataB,
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              labels: { color: '#8b949e', font: { size: 12 } }
            },
            tooltip: {
              backgroundColor: '#1c2128',
              titleColor: '#f0f6fc',
              bodyColor: '#f0f6fc',
              borderColor: '#30363d',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' +
                    context.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6e7681', font: { size: 10 }, maxTicksLimit: 12 },
              grid: { color: 'rgba(48, 54, 61, 0.3)' }
            },
            y: {
              ticks: {
                color: '#6e7681',
                font: { size: 10 },
                callback: function(value) {
                  if (value >= 1000000) return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                  return 'R$ ' + value;
                }
              },
              grid: { color: 'rgba(48, 54, 61, 0.3)' }
            }
          }
        }
      });
    },

    renderChartComposicao(result) {
      const ctx = document.getElementById('sim-fin-chart-composicao');
      if (!ctx) return;

      if (this.chartComp) {
        this.chartComp.destroy();
      }

      const labels = [];
      const dataImovel = [];
      const dataInvest = [];
      const dataDivida = [];

      const hist = result.cenarioB;
      for (let i = 0; i < hist.valorImovelHist.length; i++) {
        if (i % 3 === 0 || i === hist.valorImovelHist.length - 1) {
          const ano = Math.floor(i / 12);
          const mes = (i % 12) + 1;
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
            {
              label: 'Valor do Imóvel',
              data: dataImovel,
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: '#22c55e',
              borderWidth: 1,
              stack: 'positivo'
            },
            {
              label: 'Saldo Investido',
              data: dataInvest,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              stack: 'positivo'
            },
            {
              label: 'Saldo Devedor',
              data: dataDivida,
              backgroundColor: 'rgba(248, 81, 73, 0.7)',
              borderColor: '#f85149',
              borderWidth: 1,
              stack: 'negativo'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { labels: { color: '#8b949e', font: { size: 11 } } },
            tooltip: {
              backgroundColor: '#1c2128',
              titleColor: '#f0f6fc',
              bodyColor: '#f0f6fc',
              borderColor: '#30363d',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const val = Math.abs(context.raw);
                  const prefix = context.raw < 0 ? '-' : '';
                  return context.dataset.label + ': ' + prefix +
                    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6e7681', font: { size: 10 }, maxTicksLimit: 12 },
              grid: { color: 'rgba(48, 54, 61, 0.3)' },
              stacked: true
            },
            y: {
              stacked: true,
              ticks: {
                color: '#6e7681',
                font: { size: 10 },
                callback: function(value) {
                  const v = Math.abs(value);
                  const prefix = value < 0 ? '-R$ ' : 'R$ ';
                  if (v >= 1000000) return prefix + (v / 1000000).toFixed(1) + 'M';
                  if (v >= 1000) return prefix + (v / 1000).toFixed(0) + 'k';
                  return prefix + v;
                }
              },
              grid: { color: 'rgba(48, 54, 61, 0.3)' }
            }
          }
        }
      });
    },

    bindEvents() {
      const btnSimular = document.getElementById('sim-fin-btn');
      if (btnSimular) {
        btnSimular.addEventListener('click', () => this.executar());
      }

      // Máscaras de moeda
      ['sim-fin-valor-imovel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) this.applyMask(el);
      });

      // Preset rápido
      document.querySelectorAll('.sim-fin-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim-fin-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const preset = btn.dataset.preset;
          this.aplicarPreset(preset);
        });
      });
    },

    aplicarPreset(preset) {
      const presets = {
        conservador: {
          valorImovel: '500.000',
          percentualEntrada: '20',
          taxaFinanciamento: '9',
          prazo: '30',
          valorizacao: '5',
          aluguel: '0,4',
          vacancia: '10',
          taxaInvestimento: '0,8',
          sistema: 'sac',
          inflacao: '5',
          reajusteAluguel: '5',
          manutencao: '1',
          itr: '0,5'
        },
        moderado: {
          valorImovel: '500.000',
          percentualEntrada: '20',
          taxaFinanciamento: '9',
          prazo: '30',
          valorizacao: '6',
          aluguel: '0,5',
          vacancia: '8',
          taxaInvestimento: '1',
          sistema: 'sac',
          inflacao: '5',
          reajusteAluguel: '6',
          manutencao: '0,5',
          itr: '0,3'
        },
        otimista: {
          valorImovel: '500.000',
          percentualEntrada: '20',
          taxaFinanciamento: '8',
          prazo: '25',
          valorizacao: '8',
          aluguel: '0,6',
          vacancia: '5',
          taxaInvestimento: '1',
          sistema: 'sac',
          inflacao: '4,5',
          reajusteAluguel: '7',
          manutencao: '0,5',
          itr: '0,3'
        }
      };

      const p = presets[preset];
      if (!p) return;

      document.getElementById('sim-fin-valor-imovel').value = p.valorImovel;
      document.getElementById('sim-fin-entrada').value = p.percentualEntrada;
      document.getElementById('sim-fin-taxa-fin').value = p.taxaFinanciamento;
      document.getElementById('sim-fin-prazo').value = p.prazo;
      document.getElementById('sim-fin-valorizacao').value = p.valorizacao;
      document.getElementById('sim-fin-aluguel').value = p.aluguel;
      document.getElementById('sim-fin-vacancia').value = p.vacancia;
      document.getElementById('sim-fin-taxa-inv').value = p.taxaInvestimento;
      document.getElementById('sim-fin-sistema').value = p.sistema;
      document.getElementById('sim-fin-inflacao').value = p.inflacao;
      document.getElementById('sim-fin-reajuste').value = p.reajusteAluguel;
      document.getElementById('sim-fin-manutencao').value = p.manutencao;
      document.getElementById('sim-fin-itr').value = p.itr;
    },

    executar() {
      const params = {
        valorImovel: this.parseCurrency(document.getElementById('sim-fin-valor-imovel').value),
        percentualEntrada: this.parsePercent(document.getElementById('sim-fin-entrada').value),
        taxaFinanciamentoAnual: this.parsePercent(document.getElementById('sim-fin-taxa-fin').value),
        prazoFinanciamentoAnos: parseInt(document.getElementById('sim-fin-prazo').value) || 30,
        valorizacaoImovelAnual: this.parsePercent(document.getElementById('sim-fin-valorizacao').value),
        aluguelPercentualMensal: this.parsePercent(document.getElementById('sim-fin-aluguel').value),
        taxaVacancia: this.parsePercent(document.getElementById('sim-fin-vacancia').value),
        taxaInvestimentoMensal: this.parsePercent(document.getElementById('sim-fin-taxa-inv').value),
        sistemaAmortizacao: document.getElementById('sim-fin-sistema').value || 'sac',
        inflacaoAnual: this.parsePercent(document.getElementById('sim-fin-inflacao').value),
        reajusteAluguelAnual: this.parsePercent(document.getElementById('sim-fin-reajuste').value),
        custoManutencaoAnual: this.parsePercent(document.getElementById('sim-fin-manutencao').value),
        itrAnual: this.parsePercent(document.getElementById('sim-fin-itr').value)
      };

      if (params.valorImovel <= 0) {
        alert('Informe o valor do imóvel.');
        return;
      }
      if (params.percentualEntrada <= 0 || params.percentualEntrada >= 100) {
        alert('A entrada deve ser entre 1% e 99%.');
        return;
      }

      const result = this.simular(params);
      this.renderResultados(result, params);
    },

    render(container) {
      container.innerHTML = `
        <div class="sim-fin-wrapper">
          <div class="sim-fin-intro">
            <h2>Financiamento Imobiliário vs Investimento</h2>
            <p>Compare: investir todo o capital <strong>ou</strong> financiar um imóvel, alugar e investir o restante. Descubra qual cenário gera mais patrimônio.</p>
          </div>

          <div class="sim-fin-presets">
            <span class="sim-fin-presets-label">Cenários prontos:</span>
            <button class="sim-fin-preset" data-preset="conservador">Conservador</button>
            <button class="sim-fin-preset active" data-preset="moderado">Moderado</button>
            <button class="sim-fin-preset" data-preset="otimista">Otimista</button>
          </div>

          <div class="sim-fin-form">
            <div class="sim-fin-section">
              <h3>Imóvel</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-valor-imovel">Valor do imóvel</label>
                  <div class="sim-fin-input-group">
                    <span>R$</span>
                    <input type="text" id="sim-fin-valor-imovel" value="500.000" inputmode="numeric">
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
                  <label for="sim-fin-valorizacao">Valorização anual <span class="sim-fin-tip" title="Valorização média anual do imóvel. Historicamente, imóveis valorizam entre IPCA e IPCA+3% ao ano.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-valorizacao" value="6" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sim-fin-section">
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

            <div class="sim-fin-section">
              <h3>Aluguel</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-aluguel">Aluguel mensal <span class="sim-fin-tip" title="Percentual do valor do imóvel cobrado por mês. Típico: 0,3% a 0,6%. Ex: 0,5% de R$500k = R$2.500/mês">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-aluguel" value="0,5" inputmode="decimal">
                    <span>% do valor</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-vacancia">Taxa de vacância <span class="sim-fin-tip" title="Percentual do tempo que o imóvel fica sem inquilino. Típico: 8% a 15%.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-vacancia" value="8" inputmode="decimal">
                    <span>%</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-reajuste">Reajuste anual <span class="sim-fin-tip" title="Reajuste anual do aluguel, geralmente acompanha o IPCA ou IGP-M.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-reajuste" value="6" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sim-fin-section">
              <h3>Investimento Alternativo</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-taxa-inv">Rendimento mensal <span class="sim-fin-tip" title="Taxa do investimento alternativo. Ex: 1% ao mês = ~12,68% ao ano. CDB bom rende ~0,8-1% ao mês.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-taxa-inv" value="1" inputmode="decimal">
                    <span>% a.m.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sim-fin-section">
              <h3>Custos e Inflação</h3>
              <div class="sim-fin-fields">
                <div class="sim-fin-field">
                  <label for="sim-fin-inflacao">Inflação anual <span class="sim-fin-tip" title="Estimativa de inflação anual para cálculo do retorno real.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-inflacao" value="5" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-manutencao">Manutenção anual <span class="sim-fin-tip" title="Custo de manutenção do imóvel como % do valor. Inclui reparos, condomínio (se aplicável), etc. Típico: 0,5% a 1,5%.">?</span></label>
                  <div class="sim-fin-input-group">
                    <input type="text" id="sim-fin-manutencao" value="0,5" inputmode="decimal">
                    <span>% a.a.</span>
                  </div>
                </div>
                <div class="sim-fin-field">
                  <label for="sim-fin-itr">IPTU/ITR anual <span class="sim-fin-tip" title="Imposto sobre a propriedade como % do valor do imóvel.">?</span></label>
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

      // Aplicar preset moderado por padrão
      this.aplicarPreset('moderado');
    }
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SIM.init());
  } else {
    SIM.init();
  }
})();
