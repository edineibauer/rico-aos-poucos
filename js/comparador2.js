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

  // Configurações de duelo (igual ao original)
  dueloConfigs: {
    'ibov-sp500': {
      titulo: 'Ibovespa vs S&P 500',
      ativo1: { key: 'ibovespa', nome: 'Ibovespa', icone: '🇧🇷' },
      ativo2: { key: 'sp500_brl', nome: 'S&P 500 (R$)', icone: '🇺🇸' }
    },
    'ouro-bitcoin': {
      titulo: 'Ouro vs Bitcoin',
      ativo1: { key: 'ouro', nome: 'Ouro', icone: '🥇' },
      ativo2: { key: 'bitcoin_brl', nome: 'Bitcoin', icone: '₿' }
    },
    'ipca-tlt': {
      titulo: 'IPCA+ vs TLT',
      ativo1: { key: 'tesouro_ipca', nome: 'Tesouro IPCA+', icone: '🇧🇷' },
      ativo2: { key: 'tlt_brl', nome: 'TLT (Tesouro EUA)', icone: '🇺🇸' }
    },
    'ibov-cdi': {
      titulo: 'Ibovespa vs CDI',
      ativo1: { key: 'ibovespa', nome: 'Ibovespa', icone: '📈' },
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
    this.waitForData();
  },

  waitForData() {
    const checkData = () => {
      if (typeof Comparador !== 'undefined' && Comparador.dados && Comparador.dados.anos) {
        console.log('Comparador2: Dados carregados, inicializando...');
        // Mostrar conteúdo inicial
        setTimeout(() => {
          this.showPattern('dotcom');
        }, 300);
      } else {
        setTimeout(checkData, 100);
      }
    };
    checkData();
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
      });
    });
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
        // Re-renderizar gráfico com novo modo
        if (this._chartData) {
          this.renderChartEvolucao(this._chartData.resultados, this._chartData.dadosFiltrados, this._chartData.valorInicial);
        }
      });
    });
  },

  applyPreset(preset, containerId = 'comp2Allocation', totalElId = 'allocTotal') {
    const presets = {
      '5050': { ibovespa: 50, cdi: 50 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25 },
      'global': { ibovespa: 25, cdi: 25, sp500_brl: 25, tlt_brl: 25 }
    };
    const allocation = presets[preset];
    if (!allocation) return;

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

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  },

  formatPercent(value, decimals = 2) {
    return value.toFixed(decimals) + '%';
  },

  calcularInflacaoAcumulada(dados) {
    let acumulada = 1;
    dados.forEach(d => { acumulada *= (1 + d.inflacao_ipca / 100); });
    return (acumulada - 1) * 100;
  },

  calcularEvolucao(ativo, dados, valorInicial) {
    const evolucao = [{ ano: dados[0].ano - 1, nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;

    dados.forEach(d => {
      let retorno = d[ativo];
      if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }
      if (retorno === null || retorno === undefined) retorno = 0;

      valorNominal *= (1 + retorno / 100);
      inflacaoAcumulada *= (1 + d.inflacao_ipca / 100);

      evolucao.push({
        ano: d.ano,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada
      });
    });

    const retornoNominal = ((valorNominal / valorInicial) - 1) * 100;
    const valorReal = valorNominal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorReal,
      retornoNominal,
      retornoReal,
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
  compararHistorico() {
    if (!Comparador.dados?.anos) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    const periodo = parseInt(document.getElementById('comp2Periodo')?.value || 10);
    const valorStr = document.getElementById('comp2Valor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

    // Pegar ativos selecionados dos chips
    const ativosSelecionados = [];
    document.querySelectorAll('.comp2-chip.active').forEach(chip => {
      ativosSelecionados.push(chip.dataset.asset);
    });

    if (ativosSelecionados.length === 0) {
      alert('Selecione pelo menos um ativo para comparar.');
      return;
    }

    // Filtrar dados pelo período
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - periodo;
    const dadosFiltrados = Comparador.dados.anos.filter(d => d.ano > anoInicio && d.ano <= anoAtual);

    if (dadosFiltrados.length === 0) {
      alert('Não há dados suficientes para o período selecionado.');
      return;
    }

    // Calcular evolução de cada ativo
    const resultados = {};
    const inflacaoAcumulada = this.calcularInflacaoAcumulada(dadosFiltrados);

    ativosSelecionados.forEach(ativo => {
      resultados[ativo] = this.calcularEvolucao(ativo, dadosFiltrados, valorInicial);
    });

    // Salvar para toggle nominal/real
    this._chartData = { resultados, dadosFiltrados, valorInicial };

    // Renderizar resultados
    this.renderChartEvolucao(resultados, dadosFiltrados, valorInicial);
    this.renderRanking(resultados, inflacaoAcumulada);
    this.renderStats(resultados, inflacaoAcumulada);
    this.renderConclusoes(resultados, inflacaoAcumulada);
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

    const anos = [dados[0].ano - 1, ...dados.map(d => d.ano)];
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
        borderWidth: 2.5
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
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${this.formatPercent(item.retornoNominal)} nominal
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
    if (!Comparador.dados?.anos) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    const dueloSelecionado = document.querySelector('.comp2-duelo-btn.active')?.dataset.duelo || 'ibov-sp500';

    // Usar os seletores de ano
    const anoInicio = parseInt(document.getElementById('comp2DueloAnoInicio')?.value) || 2015;
    const anoFim = parseInt(document.getElementById('comp2DueloAnoFim')?.value) || 2025;

    const valorStr = document.getElementById('comp2DueloValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

    const config = this.dueloConfigs[dueloSelecionado];
    if (!config) return;

    // Filtrar dados pelo período
    const dadosPeriodo = Comparador.dados.anos.filter(d => d.ano >= anoInicio && d.ano <= anoFim);

    if (dadosPeriodo.length === 0) {
      alert('Não há dados disponíveis para o período selecionado.');
      return;
    }

    // Calcular evolução para ambos os ativos
    const resultado1 = this.calcularEvolucaoDuelo(config.ativo1.key, dadosPeriodo, valorInicial);
    const resultado2 = this.calcularEvolucaoDuelo(config.ativo2.key, dadosPeriodo, valorInicial);

    // Armazenar para toggle
    this.dueloResultados = { config, resultado1, resultado2, valorInicial, anoInicio, anoFim, dadosPeriodo };

    // Renderizar
    this.renderPlacarDuelo(config, resultado1, resultado2);
    this.renderChartDuelo();
  },

  calcularEvolucaoDuelo(ativoKey, dados, valorInicial, inflacaoCustom = 0) {
    const evolucao = [{ ano: dados[0].ano - 1, nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;
    const retornosAnuais = [];
    let anosPositivos = 0;
    let maxDrawdown = 0;
    let peakValue = valorInicial;

    dados.forEach(d => {
      let retorno = d[ativoKey];
      if (ativoKey === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }
      if (retorno === null || retorno === undefined) retorno = 0;

      retornosAnuais.push(retorno);
      if (retorno > 0) anosPositivos++;

      valorNominal *= (1 + retorno / 100);
      const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoAnual / 100);

      if (valorNominal > peakValue) peakValue = valorNominal;
      const drawdown = (peakValue - valorNominal) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      evolucao.push({
        ano: d.ano,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada,
        retornoAno: retorno
      });
    });

    const retornoNominal = ((valorNominal / valorInicial) - 1) * 100;
    const valorReal = valorNominal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const mediaAnual = retornosAnuais.reduce((a, b) => a + b, 0) / retornosAnuais.length;

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorReal,
      retornoNominal,
      retornoReal,
      mediaAnual,
      maxDrawdown,
      anosPositivos,
      totalAnos: dados.length,
      retornosAnuais
    };
  },

  renderPlacarDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('comp2DueloResult');
    if (!container) return;

    // Mostrar o container de resultados
    container.style.display = 'block';

    const vencedor1 = resultado1.retornoReal > resultado2.retornoReal;
    const diferenca = Math.abs(resultado1.valorFinalReal - resultado2.valorFinalReal);
    const diferencaPercent = Math.abs(resultado1.retornoReal - resultado2.retornoReal);

    container.innerHTML = `
      <div class="duelo-scoreboard">
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
      </div>
      <div id="comp2DueloChart" style="height: 250px; margin-top: 16px;"></div>
      <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.85rem;">
          <div>
            <div style="color: var(--text-muted); margin-bottom: 4px;">Retorno Nominal</div>
            <div><strong>${config.ativo1.nome}:</strong> ${this.formatPercent(resultado1.retornoNominal)}</div>
            <div><strong>${config.ativo2.nome}:</strong> ${this.formatPercent(resultado2.retornoNominal)}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); margin-bottom: 4px;">Máx. Drawdown</div>
            <div><strong>${config.ativo1.nome}:</strong> -${this.formatPercent(resultado1.maxDrawdown)}</div>
            <div><strong>${config.ativo2.nome}:</strong> -${this.formatPercent(resultado2.maxDrawdown)}</div>
          </div>
        </div>
      </div>
    `;

    // Renderizar gráfico após o HTML estar no DOM
    setTimeout(() => this.renderChartDuelo(), 50);
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

    const anos = [dadosPeriodo[0].ano - 1, ...dadosPeriodo.map(d => d.ano)];
    const view = this.dueloViewReal ? 'real' : 'nominal';

    this.charts.duelo = new Chart(canvas, {
      type: 'line',
      data: {
        labels: anos,
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
    if (!Comparador.dados?.anos) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    const periodo = parseInt(document.getElementById('comp2CarteiraPeriodo')?.value || 10);
    const valorStr = document.getElementById('comp2CarteiraValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;

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

    // Filtrar dados
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - periodo;
    const dadosFiltrados = Comparador.dados.anos.filter(d => d.ano > anoInicio && d.ano <= anoAtual);

    // Calcular evolução da carteira e ativos individuais
    // Todos começam do mesmo valor inicial para comparação justa no gráfico
    const resultados = { carteira: this.calcularEvolucaoCarteira(alocacao, dadosFiltrados, valorInicial) };

    Object.keys(alocacao).forEach(ativo => {
      resultados[ativo] = this.calcularEvolucao(ativo, dadosFiltrados, valorInicial);
    });

    const inflacaoAcumulada = this.calcularInflacaoAcumulada(dadosFiltrados);

    this.renderCarteiraResults(resultados, dadosFiltrados, valorInicial, inflacaoAcumulada, alocacao);
  },

  calcularEvolucaoCarteira(alocacao, dados, valorInicial) {
    const evolucao = [{ ano: dados[0].ano - 1, nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;

    dados.forEach(d => {
      let retornoCarteira = 0;
      Object.entries(alocacao).forEach(([ativo, peso]) => {
        let retorno = d[ativo];
        if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
          retorno = d.ibovespa + d.ibovespa_dividendos;
        }
        if (retorno === null || retorno === undefined) retorno = 0;
        retornoCarteira += retorno * peso;
      });

      valorNominal *= (1 + retornoCarteira / 100);
      inflacaoAcumulada *= (1 + d.inflacao_ipca / 100);

      evolucao.push({
        ano: d.ano,
        nominal: valorNominal,
        real: valorNominal / inflacaoAcumulada
      });
    });

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorNominal / inflacaoAcumulada,
      retornoNominal: ((valorNominal / valorInicial) - 1) * 100,
      retornoReal: ((valorNominal / inflacaoAcumulada / valorInicial) - 1) * 100
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

    const anos = [dados[0].ano - 1, ...dados.map(d => d.ano)];
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
      data: { labels: anos, datasets },
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
      `;
      resumoCard.style.display = 'block';
    }

    // Adicionar conclusões
    this.renderConclusoesCarteira(resultados, alocacao, inflacaoAcumulada);
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

  // ==========================================
  // ABA 4: REBALANCEAMENTO
  // ==========================================
  rebalViewMode: 'nominal',
  rebalData: null,

  simularRebalanceamento() {
    if (!Comparador.dados?.anos) {
      alert('Dados ainda não carregados. Aguarde...');
      return;
    }

    // Ler configurações
    const anoInicio = parseInt(document.getElementById('comp2RebalAnoInicio')?.value) || 2015;
    const anoFim = parseInt(document.getElementById('comp2RebalAnoFim')?.value) || 2025;
    const valorStr = document.getElementById('comp2RebalValor')?.value || '100.000';
    const valorInicial = this.parseCurrency(valorStr) || 100000;
    const tolerancia = parseFloat(document.getElementById('comp2Tolerancia')?.value) || 10;
    const inflacaoCustom = parseFloat(document.getElementById('comp2RebalInflacao')?.value) || 0;

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

    // Filtrar dados pelo período
    const dadosFiltrados = Comparador.dados.anos.filter(d => d.ano >= anoInicio && d.ano <= anoFim);

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
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom
    );

    // Simular SEM rebalanceamento (buy and hold)
    const resultadoSemRebal = this.simularCarteiraSemRebalanceamento(
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom
    );

    // Simular cada ativo individual para ranking
    const resultadosIndividuais = this.simularAtivosIndividuais(dadosFiltrados, valorInicial, inflacaoCustom);

    // Salvar para toggle do gráfico
    this.rebalData = { resultadoComRebal, resultadoSemRebal, resultadosIndividuais, alocacaoConfig, inflacaoCustom };

    // Mostrar resultados
    document.getElementById('comp2RebalResults').style.display = 'block';

    // Renderizar componentes
    this.renderRebalComparison(resultadoComRebal, resultadoSemRebal);
    this.renderRebalChart();
    this.renderRebalMetricas(resultadoComRebal, resultadoSemRebal, alocacaoConfig);
    this.renderHistoricoSemestral(resultadoComRebal);
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

  simularCarteiraComRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0) {
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
      periodo: `${dados[0].ano - 1} S2`,
      ano: dados[0].ano - 1,
      semestre: 2,
      valor: valorInicial,
      valorReal: valorInicial
    }];

    // Histórico detalhado para tabela
    const historico = [];

    let totalRebalanceamentos = 0;
    const retornosSemestrais = [];
    let precoMercado = {};
    ativos.forEach(ativo => { precoMercado[ativo] = 1; });

    // Processar cada ano
    dados.forEach(dadoAno => {
      for (let sem = 1; sem <= 2; sem++) {
        const periodoLabel = `${dadoAno.ano} S${sem}`;
        let rebalanceou = false;
        let impostoPeriodo = 0;
        const movimentacoes = [];

        // Valor antes do retorno
        let valorAntes = Object.values(carteira).reduce((a, b) => a + b, 0);

        // Aplicar retorno semestral para cada ativo
        ativos.forEach(ativo => {
          let retornoAnual = dadoAno[ativo];
          if (ativo === 'ibovespa' && dadoAno.ibovespa_dividendos) {
            retornoAnual = dadoAno.ibovespa + dadoAno.ibovespa_dividendos;
          }
          if (retornoAnual === null || retornoAnual === undefined) retornoAnual = 0;

          const retornoSemestral = Math.pow(1 + retornoAnual / 100, 0.5) - 1;
          carteira[ativo] *= (1 + retornoSemestral);
          precoMercado[ativo] *= (1 + retornoSemestral);
        });

        let valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0);
        retornosSemestrais.push((valorTotal / valorAntes - 1) * 100);

        // Atualizar inflação
        const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : dadoAno.inflacao_ipca;
        const inflacaoSemestral = Math.pow(1 + inflacaoAnual / 100, 0.5) - 1;
        inflacaoAcumulada *= (1 + inflacaoSemestral);

        // Verificar necessidade de rebalanceamento
        const alocacoesAtuais = {};
        ativos.forEach(ativo => {
          alocacoesAtuais[ativo] = (carteira[ativo] / valorTotal) * 100;
        });

        const foraTolerancia = ativos.filter(ativo => {
          const atual = alocacoesAtuais[ativo];
          const desejada = config[ativo].alocacao;
          const tolerancia = config[ativo].tolerancia;
          return Math.abs(atual - desejada) > tolerancia;
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
          ano: dadoAno.ano,
          semestre: sem,
          valor: valorTotal,
          valorReal: valorTotal / inflacaoAcumulada,
          rebalanceou
        });

        // Adicionar ao histórico detalhado
        historico.push({
          periodo: periodoLabel,
          ano: dadoAno.ano,
          semestre: sem,
          valor: valorTotal,
          valorReal: valorTotal / inflacaoAcumulada,
          alocacoes: { ...alocacoesFinais },
          rebalanceou,
          movimentacoes,
          impostosPagos: impostoPeriodo
        });
      }
    });

    const valorFinal = evolucao[evolucao.length - 1].valor;
    const retornoNominal = ((valorFinal / valorInicial) - 1) * 100;
    const valorReal = valorFinal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const volatilidade = this.calcularVolatilidade(retornosSemestrais);

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
      totalImpostosPagos, retornoNominal, retornoReal, volatilidade, maxDrawdown,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      totalRebalanceamentos, inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularCarteiraSemRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0) {
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
      periodo: `${dados[0].ano - 1} S2`,
      valor: valorInicial,
      valorReal: valorInicial
    }];

    const retornosSemestrais = [];

    dados.forEach(dadoAno => {
      for (let sem = 1; sem <= 2; sem++) {
        let valorAntes = Object.values(carteira).reduce((a, b) => a + b, 0);

        ativos.forEach(ativo => {
          let retornoAnual = dadoAno[ativo];
          if (ativo === 'ibovespa' && dadoAno.ibovespa_dividendos) {
            retornoAnual = dadoAno.ibovespa + dadoAno.ibovespa_dividendos;
          }
          if (retornoAnual === null || retornoAnual === undefined) retornoAnual = 0;

          const retornoSemestral = Math.pow(1 + retornoAnual / 100, 0.5) - 1;
          carteira[ativo] *= (1 + retornoSemestral);
        });

        const valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0);
        retornosSemestrais.push((valorTotal / valorAntes - 1) * 100);

        const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : dadoAno.inflacao_ipca;
        const inflacaoSemestral = Math.pow(1 + inflacaoAnual / 100, 0.5) - 1;
        inflacaoAcumulada *= (1 + inflacaoSemestral);

        evolucao.push({
          periodo: `${dadoAno.ano} S${sem}`,
          ano: dadoAno.ano,
          semestre: sem,
          valor: valorTotal,
          valorReal: valorTotal / inflacaoAcumulada
        });
      }
    });

    const valorFinal = evolucao[evolucao.length - 1].valor;
    const retornoNominal = ((valorFinal / valorInicial) - 1) * 100;
    const valorReal = valorFinal / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;
    const volatilidade = this.calcularVolatilidade(retornosSemestrais);

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
      retornoNominal, retornoReal, volatilidade, maxDrawdown,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularAtivosIndividuais(dados, valorInicial, inflacaoCustom = 0) {
    const ativos = ['ibovespa', 'cdi', 'fii_ifix', 'dolar', 'ouro', 'tesouro_ipca', 'sp500_brl', 'bitcoin_brl', 'tlt_brl', 'imoveis_fipezap'];
    const resultados = {};

    ativos.forEach(ativo => {
      const temDados = dados.some(d => d[ativo] !== null && d[ativo] !== undefined);
      if (temDados) {
        const resultado = this.calcularEvolucao(ativo, dados, valorInicial);
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

    container.innerHTML = `
      <div class="comparison-box ${venceuRebal ? 'winner' : ''}">
        <span class="comparison-icon">⚖️</span>
        <span class="comparison-label">Com Rebalanceamento</span>
        <span class="comparison-value ${comRebal.retornoReal >= 0 ? 'positivo' : 'negativo'}">${this.formatCurrency(comRebal.valorFinal)}</span>
        <span class="comparison-pct">${comRebal.retornoNominal >= 0 ? '+' : ''}${this.formatPercent(comRebal.retornoNominal)} nominal</span>
        <span class="comparison-detail">${comRebal.retornoReal >= 0 ? '+' : ''}${this.formatPercent(comRebal.retornoReal)} real</span>
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
      <div class="comp2-stat-box">
        <div class="stat-label">Inflação Período</div>
        <div class="stat-value">${this.formatPercent(comRebal.inflacaoAcumulada)}</div>
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

    // 5. Ganho real
    if (comRebal.retornoReal > 0) {
      conclusoes.push({
        tipo: 'success',
        icon: '💰',
        texto: `Sua carteira gerou <strong>${this.formatPercent(comRebal.retornoReal)}</strong> de ganho real acima da inflação (${this.formatPercent(comRebal.inflacaoAcumulada)} no período).`
      });
    } else {
      conclusoes.push({
        tipo: 'error',
        icon: '📉',
        texto: `Sua carteira perdeu <strong>${this.formatPercent(Math.abs(comRebal.retornoReal))}</strong> em termos reais. A inflação de ${this.formatPercent(comRebal.inflacaoAcumulada)} corroeu os ganhos.`
      });
    }

    // 6. Número de rebalanceamentos
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

  renderHistoricoSemestral(resultado) {
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
