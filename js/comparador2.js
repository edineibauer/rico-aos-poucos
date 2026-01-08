/**
 * Comparador v2 - Enhanced UX JavaScript
 * Handles the new compact interface interactions
 */

const Comparador2 = {
  currentTab: 'historico',

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

        const view = btn.dataset.view;
        this.toggleView(view);
      });
    });
  },

  // Apply preset allocation
  applyPreset(preset) {
    const presets = {
      '5050': { ibovespa: 50, cdi: 50, dolar: 0, ouro: 0, fii_ifix: 0, sp500_brl: 0 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34, ouro: 0, fii_ifix: 0, sp500_brl: 0 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25, fii_ifix: 0, sp500_brl: 0 },
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
    const valorStr = document.getElementById('comp2Valor')?.value || '100000';
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 100000;

    // Use existing Comparador functionality
    if (typeof Comparador !== 'undefined' && Comparador.dadosHistoricos) {
      this.renderResults(assets, periodo, valor);
    } else {
      this.showPlaceholderResults(assets);
    }
  },

  // Render results
  renderResults(assets, periodo, valor) {
    const results = [];
    const anoFim = new Date().getFullYear();
    const anoInicio = anoFim - parseInt(periodo);

    assets.forEach(asset => {
      const dados = Comparador.dadosHistoricos?.[asset];
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
          name: Comparador.assetNames?.[asset] || asset,
          color: Comparador.assetColors?.[asset] || '#888',
          retorno,
          valorFinal: valor * (1 + retorno / 100)
        });
      }
    });

    // Sort by return
    results.sort((a, b) => b.retorno - a.retorno);

    // Render ranking
    this.renderRanking(results);
    this.renderStats(results);
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

  renderStats(results) {
    if (results.length === 0) return;

    const melhor = results[0];
    const pior = results[results.length - 1];

    const statMelhor = document.getElementById('statMelhor');
    const statPior = document.getElementById('statPior');
    const statInflacao = document.getElementById('statInflacao');

    if (statMelhor) statMelhor.textContent = melhor.name;
    if (statPior) statPior.textContent = pior.name;
    if (statInflacao) statInflacao.textContent = '~65%'; // Placeholder
  },

  showPlaceholderResults(assets) {
    // Show demo results when no data available
    const results = assets.map((asset, i) => ({
      asset,
      name: asset.replace('_', ' ').toUpperCase(),
      color: ['#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899', '#ef4444'][i % 6],
      retorno: Math.random() * 200 - 50,
      valorFinal: 100000 * (1 + (Math.random() * 2 - 0.5))
    }));

    results.sort((a, b) => b.retorno - a.retorno);
    this.renderRanking(results);
    this.renderStats(results);
  },

  // Run duelo comparison
  runDuelo(duelo) {
    const dueloData = {
      'ibov-sp500': { left: { name: 'Ibovespa', icon: '🇧🇷', return: 142 }, right: { name: 'S&P 500', icon: '🇺🇸', return: 287, winner: true } },
      'ouro-bitcoin': { left: { name: 'Ouro', icon: '🥇', return: 95 }, right: { name: 'Bitcoin', icon: '₿', return: 850, winner: true } },
      'ipca-tlt': { left: { name: 'IPCA+', icon: '📈', return: 78, winner: true }, right: { name: 'TLT', icon: '📉', return: -15 } },
      'ibov-cdi': { left: { name: 'Ibovespa', icon: '📊', return: 95 }, right: { name: 'CDI', icon: '💰', return: 120, winner: true } },
      'fii-imovel': { left: { name: 'FII', icon: '🏢', return: 85, winner: true }, right: { name: 'Imóvel', icon: '🏠', return: 45 } },
      'dolar-ouro': { left: { name: 'Dólar', icon: '💵', return: 78 }, right: { name: 'Ouro', icon: '🥇', return: 95, winner: true } }
    };

    const data = dueloData[duelo];
    if (!data) return;

    const resultEl = document.getElementById('comp2DueloResult');
    if (!resultEl) return;

    resultEl.innerHTML = `
      <div class="duelo-scoreboard">
        <div class="duelo-player left ${data.left.winner ? 'winner' : ''}">
          <span class="player-icon">${data.left.icon}</span>
          <span class="player-name">${data.left.name}</span>
          <span class="player-return ${data.left.return >= 0 ? 'positivo' : 'negativo'}">
            ${data.left.return >= 0 ? '+' : ''}${data.left.return}%
          </span>
          ${data.left.winner ? '<span class="winner-badge">VENCEDOR</span>' : ''}
        </div>
        <div class="duelo-vs-big">VS</div>
        <div class="duelo-player right ${data.right.winner ? 'winner' : ''}">
          <span class="player-icon">${data.right.icon}</span>
          <span class="player-name">${data.right.name}</span>
          <span class="player-return ${data.right.return >= 0 ? 'positivo' : 'negativo'}">
            ${data.right.return >= 0 ? '+' : ''}${data.right.return}%
          </span>
          ${data.right.winner ? '<span class="winner-badge">VENCEDOR</span>' : ''}
        </div>
      </div>
    `;
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
          ${crise.contexto}
        `;
      }
    }
  },

  // Run carteira simulation
  runCarteira() {
    console.log('Running carteira simulation...');
    // TODO: Implement using existing Comparador functionality
  },

  // Run rebalanceamento simulation
  runRebalanceamento() {
    console.log('Running rebalanceamento simulation...');
    // TODO: Implement using existing Comparador functionality
  },

  // Toggle nominal/real view
  toggleView(view) {
    console.log('Toggling view to:', view);
    // TODO: Implement view toggle
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Comparador2.init();

  // Show initial pattern
  setTimeout(() => {
    Comparador2.showPattern('dotcom');
    Comparador2.runDuelo('ibov-sp500');
  }, 500);
});
