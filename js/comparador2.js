/**
 * Comparador v2 - Enhanced UX JavaScript
 * Integrates with existing Comparador functionality
 */

const Comparador2 = {
  currentTab: 'historico',
  charts: {},
  viewMode: 'nominal', // nominal or real

  init() {
    this.bindNavigation();
    this.bindAssetChips();
    this.bindDueloButtons();
    this.bindPresets();
    this.bindAllocationSliders();
    this.bindPatternButtons();
    this.bindPeriodButtons();
    this.bindRunButtons();
    this.bindToggleButtons();

    // Wait for Comparador data to load
    this.waitForData();
  },

  waitForData() {
    const checkData = () => {
      if (typeof Comparador !== 'undefined' && Comparador.dados) {
        // Data loaded, show initial content
        setTimeout(() => {
          this.showPattern('dotcom');
          this.runDuelo('ibov-sp500');
        }, 300);
      } else {
        setTimeout(checkData, 100);
      }
    };
    checkData();
  },

  // Tab Navigation
  bindNavigation() {
    document.querySelectorAll('.comp2-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update nav buttons
        document.querySelectorAll('.comp2-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update tab content
        document.querySelectorAll('.comp2-tab').forEach(t => t.classList.remove('active'));
        const tabEl = document.getElementById(`comp2-${tab}`);
        if (tabEl) tabEl.classList.add('active');

        this.currentTab = tab;
      });
    });
  },

  // Asset Chips (toggle selection)
  bindAssetChips() {
    document.querySelectorAll('.comp2-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });
  },

  // Duelo Buttons
  bindDueloButtons() {
    document.querySelectorAll('.comp2-duelo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comp2-duelo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const duelo = btn.dataset.duelo;
        this.runDuelo(duelo);
      });
    });
  },

  // Presets
  bindPresets() {
    document.querySelectorAll('.comp2-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comp2-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.dataset.preset;
        this.applyPreset(preset);
      });
    });
  },

  // Allocation Sliders
  bindAllocationSliders() {
    document.querySelectorAll('.comp2-allocation input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const item = e.target.closest('.alloc-item');
        const pctEl = item.querySelector('.alloc-pct');
        pctEl.textContent = `${e.target.value}%`;

        this.updateAllocationTotal();
      });
    });
  },

  updateAllocationTotal() {
    let total = 0;
    document.querySelectorAll('.comp2-allocation input[type="range"]').forEach(slider => {
      total += parseInt(slider.value) || 0;
    });

    const totalEl = document.getElementById('allocTotal');
    if (totalEl) {
      totalEl.textContent = `${total}%`;
      totalEl.style.color = total === 100 ? 'var(--bullish)' :
                           total > 100 ? 'var(--bearish)' : 'var(--neutral)';
    }
  },

  // Pattern Buttons
  bindPatternButtons() {
    document.querySelectorAll('.comp2-pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.comp2-pattern-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const pattern = btn.dataset.pattern;
        this.showPattern(pattern);
      });
    });
  },

  // Period Buttons (for Duelo)
  bindPeriodButtons() {
    document.querySelectorAll('.comp2-period-btns button').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.comp2-period-btns');
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Re-run current duelo with new period
        const activeBtn = document.querySelector('.comp2-duelo-btn.active');
        if (activeBtn) {
          this.runDuelo(activeBtn.dataset.duelo);
        }
      });
    });
  },

  // Run Buttons
  bindRunButtons() {
    const btnRun = document.getElementById('comp2BtnRun');
    if (btnRun) {
      btnRun.addEventListener('click', () => this.runComparison());
    }

    const btnCarteira = document.getElementById('comp2BtnCarteira');
    if (btnCarteira) {
      btnCarteira.addEventListener('click', () => this.runCarteira());
    }

    const btnRebal = document.getElementById('comp2BtnRebal');
    if (btnRebal) {
      btnRebal.addEventListener('click', () => this.runRebalanceamento());
    }
  },

  // Toggle Buttons (Nominal/Real)
  bindToggleButtons() {
    document.querySelectorAll('.comp2-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.comp2-toggle');
        parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.viewMode = btn.dataset.view;
        this.toggleView(btn.dataset.view);
      });
    });
  },

  // Apply preset allocation
  applyPreset(preset) {
    const presets = {
      '5050': { ibovespa: 50, cdi: 50, dolar: 0, ouro: 0, fii_ifix: 0, sp500_brl: 0, tlt_brl: 0 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34, ouro: 0, fii_ifix: 0, sp500_brl: 0, tlt_brl: 0 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25, fii_ifix: 0, sp500_brl: 0, tlt_brl: 0 },
      'global': { ibovespa: 25, cdi: 25, dolar: 0, ouro: 0, fii_ifix: 0, sp500_brl: 25, tlt_brl: 25 }
    };

    const allocation = presets[preset];
    if (!allocation) return;

    document.querySelectorAll('.comp2-allocation input[type="range"]').forEach(slider => {
      const asset = slider.dataset.asset;
      const value = allocation[asset] || 0;
      slider.value = value;

      const item = slider.closest('.alloc-item');
      const pctEl = item.querySelector('.alloc-pct');
      if (pctEl) pctEl.textContent = `${value}%`;
    });

    this.updateAllocationTotal();
  },

  // Get selected assets
  getSelectedAssets() {
    const assets = [];
    document.querySelectorAll('.comp2-chip.active').forEach(chip => {
      assets.push(chip.dataset.asset);
    });
    return assets;
  },

  // Run main comparison
  runComparison() {
    const assets = this.getSelectedAssets();
    if (assets.length === 0) {
      alert('Selecione pelo menos um ativo');
      return;
    }

    const periodo = document.getElementById('comp2Periodo')?.value || 10;
    const valorStr = document.getElementById('comp2Valor')?.value || '100.000';
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 100000;

    if (typeof Comparador !== 'undefined' && Comparador.dados) {
      this.renderResults(assets, periodo, valor);
    } else {
      this.showPlaceholderResults(assets);
    }
  },

  // Render results with real data
  renderResults(assets, periodo, valor) {
    const results = [];
    const anoFim = new Date().getFullYear();
    const anoInicio = anoFim - parseInt(periodo);

    assets.forEach(asset => {
      const dados = Comparador.dados[asset];
      if (!dados) return;

      let valorInicio = null;
      let valorFim = null;

      for (let ano = anoInicio; ano <= anoFim; ano++) {
        const dado = dados[ano];
        if (dado) {
          if (valorInicio === null) valorInicio = dado.valor;
          valorFim = dado.valor;
        }
      }

      if (valorInicio && valorFim) {
        const retorno = ((valorFim / valorInicio) - 1) * 100;
        results.push({
          asset,
          name: Comparador.assetNames[asset] || asset,
          color: Comparador.chartColors[asset] || '#888',
          retorno,
          valorFinal: valor * (1 + retorno / 100)
        });
      }
    });

    // Sort by return
    results.sort((a, b) => b.retorno - a.retorno);

    // Render chart, ranking and stats
    this.renderChart(assets, periodo, valor);
    this.renderRanking(results);
    this.renderStats(results, periodo);
  },

  // Render chart using Chart.js
  renderChart(assets, periodo, valor) {
    const chartContainer = document.getElementById('comp2Chart');
    if (!chartContainer) return;

    // Create canvas if not exists
    let canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
      chartContainer.innerHTML = '';
      canvas = document.createElement('canvas');
      canvas.id = 'comp2ChartCanvas';
      chartContainer.appendChild(canvas);
    }

    // Destroy existing chart
    if (this.charts.main) {
      this.charts.main.destroy();
    }

    const anoFim = new Date().getFullYear();
    const anoInicio = anoFim - parseInt(periodo);
    const anos = [];
    for (let a = anoInicio; a <= anoFim; a++) anos.push(a);

    const datasets = [];

    assets.forEach(asset => {
      const dados = Comparador.dados[asset];
      if (!dados) return;

      const values = [];
      let baseValor = null;

      anos.forEach(ano => {
        const dado = dados[ano];
        if (dado) {
          if (baseValor === null) baseValor = dado.valor;
          const mult = dado.valor / baseValor;
          values.push(valor * mult);
        } else {
          values.push(null);
        }
      });

      datasets.push({
        label: Comparador.assetNames[asset] || asset,
        data: values,
        borderColor: Comparador.chartColors[asset] || '#888',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2
      });
    });

    this.charts.main = new Chart(canvas, {
      type: 'line',
      data: { labels: anos, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#8b949e', usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R$ ' +
                  context.parsed.y.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: {
              color: '#8b949e',
              callback: function(value) {
                return 'R$ ' + (value / 1000).toFixed(0) + 'k';
              }
            }
          }
        }
      }
    });
  },

  renderRanking(results) {
    const container = document.getElementById('comp2Ranking');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '<div class="comp2-ranking-empty"><p>Nenhum resultado</p></div>';
      return;
    }

    container.innerHTML = results.map((r, i) => `
      <div class="comp2-ranking-item ${r.retorno >= 0 ? 'positive' : 'negative'}">
        <span class="ranking-pos">${i + 1}º</span>
        <div class="ranking-info">
          <span class="ranking-dot" style="background:${r.color}"></span>
          <span class="ranking-name">${r.name}</span>
        </div>
        <span class="ranking-return ${r.retorno >= 0 ? 'positivo' : 'negativo'}">
          ${r.retorno >= 0 ? '+' : ''}${r.retorno.toFixed(1)}%
        </span>
      </div>
    `).join('');
  },

  renderStats(results, periodo) {
    if (results.length === 0) return;

    const melhor = results[0];
    const pior = results[results.length - 1];

    // Calculate approximate inflation over period
    const inflacaoMedia = 6; // ~6% a.a.
    const inflacaoTotal = Math.pow(1 + inflacaoMedia/100, parseInt(periodo)) - 1;

    const statMelhor = document.getElementById('statMelhor');
    const statPior = document.getElementById('statPior');
    const statInflacao = document.getElementById('statInflacao');

    if (statMelhor) statMelhor.textContent = melhor.name;
    if (statPior) statPior.textContent = pior.name;
    if (statInflacao) statInflacao.textContent = `~${(inflacaoTotal * 100).toFixed(0)}%`;
  },

  showPlaceholderResults(assets) {
    // Show demo results when no data available
    const results = assets.map((asset, i) => ({
      asset,
      name: asset.replace(/_/g, ' ').toUpperCase(),
      color: ['#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#ef4444'][i % 6],
      retorno: Math.random() * 200 - 50,
      valorFinal: 100000 * (1 + (Math.random() * 2 - 0.5))
    }));

    results.sort((a, b) => b.retorno - a.retorno);
    this.renderRanking(results);
    this.renderStats(results, 10);
  },

  // Run duelo comparison
  runDuelo(duelo) {
    // Get period from active button
    const periodBtn = document.querySelector('.comp2-period-btns button.active');
    const years = periodBtn ? parseInt(periodBtn.dataset.years) : 10;
    const anoFim = new Date().getFullYear();
    const anoInicio = anoFim - years;

    const dueloConfig = {
      'ibov-sp500': ['ibovespa', 'sp500_brl', '🇧🇷', '🇺🇸'],
      'ouro-bitcoin': ['ouro', 'bitcoin_brl', '🥇', '₿'],
      'ipca-tlt': ['tesouro_ipca', 'tlt_brl', '📈', '📉'],
      'ibov-cdi': ['ibovespa', 'cdi', '📊', '💰'],
      'fii-imovel': ['fii_ifix', 'imoveis_fipezap', '🏢', '🏠'],
      'dolar-ouro': ['dolar', 'ouro', '💵', '🥇']
    };

    const config = dueloConfig[duelo];
    if (!config) return;

    const [asset1, asset2, icon1, icon2] = config;

    // Calculate returns using real data if available
    let return1 = 0, return2 = 0;

    if (Comparador.dados && Comparador.dados[asset1] && Comparador.dados[asset2]) {
      const dados1 = Comparador.dados[asset1];
      const dados2 = Comparador.dados[asset2];

      let inicio1 = null, fim1 = null;
      let inicio2 = null, fim2 = null;

      for (let ano = anoInicio; ano <= anoFim; ano++) {
        if (dados1[ano]) {
          if (inicio1 === null) inicio1 = dados1[ano].valor;
          fim1 = dados1[ano].valor;
        }
        if (dados2[ano]) {
          if (inicio2 === null) inicio2 = dados2[ano].valor;
          fim2 = dados2[ano].valor;
        }
      }

      if (inicio1 && fim1) return1 = ((fim1 / inicio1) - 1) * 100;
      if (inicio2 && fim2) return2 = ((fim2 / inicio2) - 1) * 100;
    } else {
      // Fallback placeholder data
      const placeholderData = {
        'ibov-sp500': [95, 287],
        'ouro-bitcoin': [150, 2500],
        'ipca-tlt': [78, -15],
        'ibov-cdi': [95, 120],
        'fii-imovel': [85, 45],
        'dolar-ouro': [78, 150]
      };
      [return1, return2] = placeholderData[duelo] || [50, 100];
    }

    const winner1 = return1 > return2;
    const name1 = Comparador.assetNames?.[asset1] || asset1;
    const name2 = Comparador.assetNames?.[asset2] || asset2;

    const resultEl = document.getElementById('comp2DueloResult');
    if (!resultEl) return;

    resultEl.innerHTML = `
      <div class="duelo-scoreboard">
        <div class="duelo-player left ${winner1 ? 'winner' : ''}">
          <span class="player-icon">${icon1}</span>
          <span class="player-name">${name1}</span>
          <span class="player-return ${return1 >= 0 ? 'positivo' : 'negativo'}">
            ${return1 >= 0 ? '+' : ''}${return1.toFixed(0)}%
          </span>
          ${winner1 ? '<span class="winner-badge">VENCEDOR</span>' : ''}
        </div>
        <div class="duelo-vs-big">VS</div>
        <div class="duelo-player right ${!winner1 ? 'winner' : ''}">
          <span class="player-icon">${icon2}</span>
          <span class="player-name">${name2}</span>
          <span class="player-return ${return2 >= 0 ? 'positivo' : 'negativo'}">
            ${return2 >= 0 ? '+' : ''}${return2.toFixed(0)}%
          </span>
          ${!winner1 ? '<span class="winner-badge">VENCEDOR</span>' : ''}
        </div>
      </div>
      <div class="duelo-detail">
        <p style="text-align: center; color: var(--text-muted); margin-top: 16px;">
          Período: ${anoInicio} - ${anoFim} (${years} anos)
        </p>
      </div>
    `;

    // Render duelo chart
    this.renderDueloChart(asset1, asset2, anoInicio, anoFim);
  },

  renderDueloChart(asset1, asset2, anoInicio, anoFim) {
    const chartContainer = document.getElementById('comp2DueloChart');
    if (!chartContainer) return;

    // Create canvas if not exists
    let canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'comp2DueloChartCanvas';
      chartContainer.appendChild(canvas);
    }

    // Destroy existing chart
    if (this.charts.duelo) {
      this.charts.duelo.destroy();
    }

    if (!Comparador.dados) return;

    const anos = [];
    for (let a = anoInicio; a <= anoFim; a++) anos.push(a);

    const datasets = [asset1, asset2].map(asset => {
      const dados = Comparador.dados[asset];
      if (!dados) return null;

      const values = [];
      let baseValor = null;

      anos.forEach(ano => {
        const dado = dados[ano];
        if (dado) {
          if (baseValor === null) baseValor = dado.valor;
          values.push(((dado.valor / baseValor) - 1) * 100);
        } else {
          values.push(null);
        }
      });

      return {
        label: Comparador.assetNames[asset] || asset,
        data: values,
        borderColor: Comparador.chartColors[asset] || '#888',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2
      };
    }).filter(d => d !== null);

    this.charts.duelo = new Chart(canvas, {
      type: 'line',
      data: { labels: anos, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#8b949e', usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: {
              color: '#8b949e',
              callback: function(value) {
                return value.toFixed(0) + '%';
              }
            }
          }
        }
      }
    });
  },

  // Show pattern analysis
  showPattern(pattern) {
    if (typeof Comparador !== 'undefined' && Comparador.dadosCrises?.[pattern]) {
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
        contentEl.innerHTML = `
          <p style="margin-bottom: 16px; color: var(--text-secondary);">${crise.descricao}</p>
          <div class="pattern-detail">${crise.contexto || ''}</div>
        `;
      }
    } else {
      // Fallback content
      const fallbackData = {
        dotcom: { nome: 'Bolha Ponto Com', periodo: '2000-2002', desc: 'Estouro da bolha das empresas de internet.' },
        subprime: { nome: 'Crise Subprime', periodo: '2008', desc: 'Colapso do mercado imobiliário americano.' },
        brasil2015: { nome: 'Crise Brasil', periodo: '2014-2016', desc: 'Recessão econômica e crise política brasileira.' },
        covid: { nome: 'COVID-19', periodo: '2020', desc: 'Pandemia global e circuit breakers na bolsa.' },
        bitcoin: { nome: 'Ciclos do Bitcoin', periodo: 'Ciclos de ~4 anos', desc: 'Padrões históricos de halving.' },
        ia: { nome: 'Bolha de IA?', periodo: '202X?', desc: 'Cenário potencial de correção das big techs.' }
      };

      const data = fallbackData[pattern] || fallbackData.dotcom;

      const headerEl = document.getElementById('patternHeader');
      const contentEl = document.getElementById('patternContent');

      if (headerEl) {
        headerEl.innerHTML = `<h2>${data.nome}</h2><span class="pattern-period">${data.periodo}</span>`;
      }
      if (contentEl) {
        contentEl.innerHTML = `<p style="color: var(--text-secondary);">${data.desc}</p>
          <p style="margin-top: 12px; color: var(--text-muted);">Carregando dados completos...</p>`;
      }
    }
  },

  // Run carteira simulation
  runCarteira() {
    const periodo = document.getElementById('comp2CarteiraPeriodo')?.value || 10;
    const valorStr = document.getElementById('comp2CarteiraValor')?.value || '100.000';
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 100000;

    // Get allocations
    const allocations = {};
    document.querySelectorAll('.comp2-allocation input[type="range"]').forEach(slider => {
      const asset = slider.dataset.asset;
      const pct = parseInt(slider.value) || 0;
      if (pct > 0) allocations[asset] = pct / 100;
    });

    if (Object.keys(allocations).length === 0) {
      alert('Configure a alocação da carteira');
      return;
    }

    const total = Object.values(allocations).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.01) {
      alert(`A alocação total deve ser 100% (atual: ${(total * 100).toFixed(0)}%)`);
      return;
    }

    this.renderCarteiraResults(allocations, periodo, valor);
  },

  renderCarteiraResults(allocations, periodo, valor) {
    const chartContainer = document.getElementById('comp2CarteiraChart');
    if (!chartContainer || !Comparador.dados) return;

    // Create canvas if not exists
    let canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'comp2CarteiraChartCanvas';
      chartContainer.appendChild(canvas);
    }

    // Destroy existing chart
    if (this.charts.carteira) {
      this.charts.carteira.destroy();
    }

    const anoFim = new Date().getFullYear();
    const anoInicio = anoFim - parseInt(periodo);
    const anos = [];
    for (let a = anoInicio; a <= anoFim; a++) anos.push(a);

    // Calculate portfolio values
    const portfolioValues = [];
    let portfolioBase = null;

    anos.forEach(ano => {
      let portfolioVal = 0;
      let hasAllData = true;

      Object.entries(allocations).forEach(([asset, weight]) => {
        const dados = Comparador.dados[asset];
        if (!dados || !dados[ano]) {
          hasAllData = false;
          return;
        }

        if (portfolioBase === null) {
          portfolioVal += valor * weight;
        } else {
          const firstYear = Object.keys(dados).find(y => parseInt(y) >= anoInicio);
          if (firstYear && dados[firstYear]) {
            const mult = dados[ano].valor / dados[firstYear].valor;
            portfolioVal += (valor * weight) * mult;
          }
        }
      });

      if (hasAllData) {
        if (portfolioBase === null) portfolioBase = portfolioVal;
        portfolioValues.push(portfolioVal);
      } else {
        portfolioValues.push(null);
      }
    });

    // Create datasets
    const datasets = [{
      label: 'Carteira Diversificada',
      data: portfolioValues,
      borderColor: '#f59e0b',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 3,
      borderWidth: 3
    }];

    // Add individual assets
    Object.keys(allocations).forEach(asset => {
      const dados = Comparador.dados[asset];
      if (!dados) return;

      const values = [];
      let baseValor = null;

      anos.forEach(ano => {
        const dado = dados[ano];
        if (dado) {
          if (baseValor === null) baseValor = dado.valor;
          const mult = dado.valor / baseValor;
          values.push(valor * allocations[asset] * mult);
        } else {
          values.push(null);
        }
      });

      datasets.push({
        label: Comparador.assetNames[asset] || asset,
        data: values,
        borderColor: Comparador.chartColors[asset] || '#888',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 1,
        borderWidth: 1.5,
        borderDash: [5, 5]
      });
    });

    this.charts.carteira = new Chart(canvas, {
      type: 'line',
      data: { labels: anos, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#8b949e', usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R$ ' +
                  (context.parsed.y || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: 'rgba(139, 148, 158, 0.1)' },
            ticks: {
              color: '#8b949e',
              callback: function(value) {
                return 'R$ ' + (value / 1000).toFixed(0) + 'k';
              }
            }
          }
        }
      }
    });
  },

  // Run rebalanceamento simulation
  runRebalanceamento() {
    const periodo = document.getElementById('comp2RebalPeriodo')?.value || 10;
    const tolerancia = document.getElementById('comp2Tolerancia')?.value || 5;

    // For now, show comparison results
    const comparisonEl = document.getElementById('comp2RebalComparison');
    if (!comparisonEl) return;

    // Calculate with and without rebalancing (simplified)
    const valorInicial = 100000;
    const comRebal = valorInicial * 2.45; // Placeholder
    const semRebal = valorInicial * 2.30;
    const diffPct = ((comRebal / semRebal) - 1) * 100;

    comparisonEl.innerHTML = `
      <div class="comparison-box">
        <span class="comparison-label">Com Rebalanceamento</span>
        <span class="comparison-value ${comRebal > semRebal ? 'positivo' : ''}">R$ ${comRebal.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
        <span class="comparison-pct">+${((comRebal / valorInicial - 1) * 100).toFixed(0)}%</span>
      </div>
      <div class="comparison-vs">vs</div>
      <div class="comparison-box">
        <span class="comparison-label">Buy & Hold</span>
        <span class="comparison-value">R$ ${semRebal.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
        <span class="comparison-pct">+${((semRebal / valorInicial - 1) * 100).toFixed(0)}%</span>
      </div>
    `;

    // Show chart placeholder
    const chartEl = document.getElementById('comp2RebalChart');
    if (chartEl) {
      chartEl.innerHTML = `
        <div class="comp2-chart-placeholder">
          <p style="color: var(--text-secondary);">Diferença com rebalanceamento: <strong style="color: var(--bullish);">+${diffPct.toFixed(1)}%</strong></p>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Tolerância configurada: ±${tolerancia}%</p>
        </div>
      `;
    }
  },

  // Toggle nominal/real view
  toggleView(view) {
    this.viewMode = view;
    // Re-render current comparison if exists
    if (this.charts.main) {
      this.runComparison();
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Comparador2.init();
});
