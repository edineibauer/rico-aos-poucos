/**
 * Comparador Brutal de Investimentos
 * Rico aos Poucos
 */

const Comparador = {
  dados: null,
  currentTab: 'historico',
  chartViewDiversif: 'nominal',
  chartColors: {
    ibovespa: '#3b82f6',
    dolar: '#22c55e',
    ouro: '#eab308',
    fii_ifix: '#8b5cf6',
    tesouro_ipca: '#06b6d4',
    cdi: '#ec4899',
    sp500_brl: '#ef4444',
    imoveis_fipezap: '#14b8a6',
    bitcoin_brl: '#f7931a',
    tlt_brl: '#0ea5e9'
  },
  assetNames: {
    ibovespa: 'Ibovespa',
    dolar: 'Dólar',
    ouro: 'Ouro',
    fii_ifix: 'FIIs (IFIX)',
    tesouro_ipca: 'Tesouro IPCA+',
    cdi: 'Caixa/CDI',
    sp500_brl: 'S&P 500 (R$)',
    imoveis_fipezap: 'Imóveis',
    bitcoin_brl: 'Bitcoin',
    tlt_brl: 'TLT (Tesouro EUA)'
  },
  // Taxas de IR por tipo de ativo
  taxasIR: {
    ibovespa: 0.15, // 15% ganho de capital
    fii_ifix: 0.20, // 20% ganho de capital
    sp500_brl: 0.15,
    bitcoin_brl: 0.15,
    ouro: 0.15,
    dolar: 0.15,
    tesouro_ipca: 0.15, // IR regressivo simplificado
    cdi: 0.15,
    tlt_brl: 0.15,
    imoveis_fipezap: 0.15
  },

  async init() {
    await this.loadData();
    this.bindEvents();
    this.applyMasks();
  },

  async loadData() {
    try {
      const response = await fetch('../data/historico-investimentos.json');
      this.dados = await response.json();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  },

  bindEvents() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Botões de comparar
    document.getElementById('btnComparar')?.addEventListener('click', () => this.compararHistorico());
    document.getElementById('btnCompararFII')?.addEventListener('click', () => this.compararFIIImovel());
    document.getElementById('btnDecompor')?.addEventListener('click', () => this.decomporRetorno());
    document.getElementById('btnDiversif')?.addEventListener('click', () => this.simularDiversificacao());
    document.getElementById('btnDiversifNovo')?.addEventListener('click', () => this.simularDiversificacaoNovo());

    // Preset buttons for new Diversificação tab
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const preset = e.currentTarget.dataset.preset;
        this.aplicarPresetDiversif(preset);
      });
    });

    // Update total allocation when inputs change
    document.querySelectorAll('.aloc-percent-novo').forEach(input => {
      input.addEventListener('input', () => this.atualizarTotalAlocacaoNovo());
    });

    // Preset buttons for Rebalancing tab
    document.querySelectorAll('.preset-btn-rebal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-btn-rebal').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const preset = e.currentTarget.dataset.preset;
        this.aplicarPresetRebalanceamento(preset);
      });
    });

    // Duelo buttons (Frente a Frente)
    document.querySelectorAll('.duelo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.duelo-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Botão iniciar duelo
    document.getElementById('btnDuelo')?.addEventListener('click', () => this.iniciarDuelo());

    // Toggle nominal/real no duelo
    document.getElementById('btnNominalDuelo')?.addEventListener('click', () => {
      document.getElementById('btnNominalDuelo').classList.add('active');
      document.getElementById('btnRealDuelo').classList.remove('active');
      this.dueloViewReal = false;
      this.atualizarChartDuelo();
    });
    document.getElementById('btnRealDuelo')?.addEventListener('click', () => {
      document.getElementById('btnRealDuelo').classList.add('active');
      document.getElementById('btnNominalDuelo').classList.remove('active');
      this.dueloViewReal = true;
      this.atualizarChartDuelo();
    });

    // Chart toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.updateChartView(view);
      });
    });
  },

  applyMasks() {
    const currencyFields = ['valorInicial', 'imovelValor', 'imovelAluguel', 'imovelIptu',
                           'imovelManutencao', 'fiiValor', 'valorDiversif'];
    currencyFields.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskCurrency(input);
    });

    const percentFields = ['imovelVacancia', 'fiiDY', 'fiiValorizacao', 'fiiTaxa',
                          'inflacaoFII', 'valorizacaoImovel'];
    percentFields.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskPercentage(input);
    });
  },

  maskCurrency(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value === '') { e.target.value = ''; return; }
      let numValue = parseInt(value, 10);
      e.target.value = (numValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });

    if (input.value && input.value !== '0') {
      const numValue = parseFloat(input.value);
      if (!isNaN(numValue) && numValue > 0) {
        input.value = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  },

  maskPercentage(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value === '') { e.target.value = ''; return; }
      let numValue = parseInt(value, 10);
      if (numValue > 9999) numValue = 9999;
      e.target.value = (numValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });
  },

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
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },

  formatPercent(value, decimals = 2) {
    return value.toFixed(decimals) + '%';
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
  },

  // ==========================================
  // COMPARADOR HISTÓRICO
  // ==========================================
  compararHistorico() {
    const periodo = parseInt(document.getElementById('periodo').value);
    const valorInicial = this.parseCurrency(document.getElementById('valorInicial').value) || 100000;

    // Pegar ativos selecionados
    const checkboxes = document.querySelectorAll('.asset-checkbox input:checked');
    const ativosSelecionados = Array.from(checkboxes).map(cb => cb.value);

    if (ativosSelecionados.length === 0) {
      alert('Selecione pelo menos um ativo para comparar.');
      return;
    }

    // Filtrar dados pelo período
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - periodo;
    const dadosFiltrados = this.dados.anos.filter(d => d.ano > anoInicio && d.ano <= anoAtual);

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

    // Mostrar resultados
    document.getElementById('resultados').style.display = 'block';
    this.renderChartEvolucao(resultados, dadosFiltrados, valorInicial);
    this.renderRanking(resultados, inflacaoAcumulada);
    this.renderTabelaComparativo(resultados, valorInicial, inflacaoAcumulada);
    this.renderConclusoes(resultados, inflacaoAcumulada);

    // Scroll para resultados
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });
  },

  calcularInflacaoAcumulada(dados) {
    let acumulada = 1;
    dados.forEach(d => {
      acumulada *= (1 + d.inflacao_ipca / 100);
    });
    return (acumulada - 1) * 100;
  },

  calcularEvolucao(ativo, dados, valorInicial) {
    const evolucao = [{ ano: dados[0].ano - 1, nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;

    dados.forEach(d => {
      let retorno = d[ativo];

      // Tratamento especial para ibovespa (inclui dividendos)
      if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }

      // Se não há dados para este ativo neste ano, mantém o valor
      if (retorno === null || retorno === undefined) {
        retorno = 0;
      }

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

  renderChartEvolucao(resultados, dados, valorInicial) {
    const container = document.getElementById('chartEvolucao');
    const width = container.clientWidth;
    const height = 400;
    const padding = { top: 20, right: 120, bottom: 40, left: 80 };

    // Encontrar min/max para escala
    let maxVal = valorInicial;
    let minVal = valorInicial;
    Object.values(resultados).forEach(r => {
      r.evolucao.forEach(e => {
        maxVal = Math.max(maxVal, e.nominal, e.real);
        minVal = Math.min(minVal, e.nominal, e.real);
      });
    });

    const anos = [dados[0].ano - 1, ...dados.map(d => d.ano)];
    const xScale = (ano) => padding.left + ((ano - anos[0]) / (anos[anos.length - 1] - anos[0])) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - ((val - minVal * 0.9) / (maxVal * 1.1 - minVal * 0.9)) * (height - padding.top - padding.bottom);

    let svg = `<svg width="${width}" height="${height}" class="chart-svg">`;

    // Grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (i / gridLines) * (height - padding.top - padding.bottom);
      const val = maxVal * 1.1 - (i / gridLines) * (maxVal * 1.1 - minVal * 0.9);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#333" stroke-dasharray="3,3" opacity="0.3"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="11">${this.formatCurrency(val).replace('R$', '').trim()}</text>`;
    }

    // X axis labels
    anos.forEach((ano, i) => {
      if (i % 2 === 0 || anos.length <= 6) {
        const x = xScale(ano);
        svg += `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="11">${ano}</text>`;
      }
    });

    // Linhas para cada ativo (usando view atual - nominal por padrão)
    const view = document.querySelector('.toggle-btn.active')?.dataset.view || 'nominal';

    Object.entries(resultados).forEach(([ativo, data]) => {
      const color = this.chartColors[ativo] || '#888';
      let path = '';

      data.evolucao.forEach((e, i) => {
        const x = xScale(e.ano);
        const y = yScale(view === 'real' ? e.real : e.nominal);
        path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });

      svg += `<path d="${path}" stroke="${color}" stroke-width="2.5" fill="none" class="chart-line" data-asset="${ativo}"/>`;

      // Label no final
      const lastPoint = data.evolucao[data.evolucao.length - 1];
      const lastY = yScale(view === 'real' ? lastPoint.real : lastPoint.nominal);
      svg += `<circle cx="${xScale(lastPoint.ano)}" cy="${lastY}" r="4" fill="${color}"/>`;
      svg += `<text x="${xScale(lastPoint.ano) + 8}" y="${lastY + 4}" fill="${color}" font-size="12" font-weight="600">${this.assetNames[ativo]}</text>`;
    });

    svg += '</svg>';
    container.innerHTML = svg;

    // Salvar referência para toggle
    this._chartData = { resultados, dados, valorInicial, xScale, yScale, width, height, padding, anos };
  },

  updateChartView(view) {
    if (!this._chartData) return;
    const { resultados, dados, valorInicial } = this._chartData;
    this.renderChartEvolucao(resultados, dados, valorInicial);
  },

  renderRanking(resultados, inflacaoAcumulada) {
    const container = document.getElementById('rankingContainer');

    // Ordenar por retorno real
    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    let html = '';
    ranking.forEach((item, index) => {
      const color = this.chartColors[item.ativo];
      const isPositive = item.retornoReal > 0;
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

      html += `
        <div class="ranking-item ${isPositive ? 'positive' : 'negative'}">
          <div class="ranking-position">${medal || (index + 1)}</div>
          <div class="ranking-asset">
            <span class="asset-color" style="background: ${color}"></span>
            <span class="asset-name">${this.assetNames[item.ativo]}</span>
          </div>
          <div class="ranking-values">
            <div class="ranking-nominal">
              <small>Nominal</small>
              <span>${this.formatPercent(item.retornoNominal)}</span>
            </div>
            <div class="ranking-real">
              <small>Real</small>
              <span class="${isPositive ? 'text-green' : 'text-red'}">${this.formatPercent(item.retornoReal)}</span>
            </div>
          </div>
          <div class="ranking-badge ${isPositive ? 'badge-green' : 'badge-red'}">
            ${isPositive ? 'Ganhou da inflação' : 'Perdeu da inflação'}
          </div>
        </div>
      `;
    });

    // Info da inflação
    html += `
      <div class="inflacao-info">
        <span>Inflação acumulada no período: <strong>${this.formatPercent(inflacaoAcumulada)}</strong></span>
      </div>
    `;

    container.innerHTML = html;
  },

  renderTabelaComparativo(resultados, valorInicial, inflacaoAcumulada) {
    const tbody = document.querySelector('#tabelaComparativo tbody');

    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    let html = '';
    ranking.forEach(item => {
      const isPositive = item.retornoReal > 0;
      html += `
        <tr>
          <td>
            <span class="asset-color-small" style="background: ${this.chartColors[item.ativo]}"></span>
            ${this.assetNames[item.ativo]}
          </td>
          <td>${this.formatCurrency(item.valorFinalNominal)}</td>
          <td>${this.formatCurrency(item.valorFinalReal)}</td>
          <td>${this.formatPercent(item.retornoNominal)}</td>
          <td class="${isPositive ? 'text-green' : 'text-red'}">${this.formatPercent(item.retornoReal)}</td>
          <td>
            <span class="status-badge ${isPositive ? 'badge-green' : 'badge-red'}">
              ${isPositive ? 'Sim' : 'Não'}
            </span>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  renderConclusoes(resultados, inflacaoAcumulada) {
    const container = document.getElementById('conclusoesLista');
    const conclusoes = [];

    const ranking = Object.entries(resultados)
      .map(([ativo, data]) => ({ ativo, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    // Conclusão 1: Vencedor
    const vencedor = ranking[0];
    conclusoes.push({
      tipo: 'success',
      icon: '✅',
      texto: `<strong>${this.assetNames[vencedor.ativo]}</strong> foi o grande vencedor com retorno real de <strong>${this.formatPercent(vencedor.retornoReal)}</strong>.`
    });

    // Conclusão 2: Perdedores
    const perdedores = ranking.filter(r => r.retornoReal < 0);
    if (perdedores.length > 0) {
      const nomes = perdedores.map(p => this.assetNames[p.ativo]).join(', ');
      conclusoes.push({
        tipo: 'error',
        icon: '❌',
        texto: `${nomes} <strong>perderam para a inflação</strong>, ou seja, destruíram valor real.`
      });
    }

    // Conclusão 3: Correlação dólar/ibovespa
    if (resultados.ibovespa && resultados.dolar) {
      const ibovNominal = resultados.ibovespa.retornoNominal;
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

  // ==========================================
  // FII VS IMÓVEL
  // ==========================================
  compararFIIImovel() {
    const imovelValor = this.parseCurrency(document.getElementById('imovelValor').value) || 500000;
    const imovelAluguel = this.parseCurrency(document.getElementById('imovelAluguel').value) || 2500;
    const imovelVacancia = this.parsePercentage(document.getElementById('imovelVacancia').value) || 8;
    const imovelIptu = this.parseCurrency(document.getElementById('imovelIptu').value) || 5000;
    const imovelManutencao = this.parseCurrency(document.getElementById('imovelManutencao').value) || 7500;

    const fiiValor = this.parseCurrency(document.getElementById('fiiValor').value) || 500000;
    const fiiDY = this.parsePercentage(document.getElementById('fiiDY').value) || 9;
    const fiiValorizacao = this.parsePercentage(document.getElementById('fiiValorizacao').value) || 3;
    const fiiTaxa = this.parsePercentage(document.getElementById('fiiTaxa').value) || 0.8;

    const periodo = parseInt(document.getElementById('periodoFII').value);
    const inflacao = this.parsePercentage(document.getElementById('inflacaoFII').value) || 5;
    const valorizacaoImovel = this.parsePercentage(document.getElementById('valorizacaoImovel').value) || 5;

    // Cálculo do Imóvel
    const aluguelAnualBruto = imovelAluguel * 12;
    const vacanciaReais = aluguelAnualBruto * (imovelVacancia / 100);
    const aluguelLiquidoAnual = aluguelAnualBruto - vacanciaReais - imovelIptu - imovelManutencao;
    const irAluguel = aluguelLiquidoAnual * 0.275; // Tabela progressiva simplificada
    const aluguelLiquidoIR = aluguelLiquidoAnual - irAluguel;
    const yieldImovel = (aluguelLiquidoIR / imovelValor) * 100;

    let patrimonioImovel = imovelValor;
    let rendaImovelTotal = 0;
    const evolucaoImovel = [{ ano: 0, patrimonio: imovelValor, renda: 0 }];

    for (let ano = 1; ano <= periodo; ano++) {
      patrimonioImovel *= (1 + valorizacaoImovel / 100);
      const rendaAno = aluguelLiquidoIR * Math.pow(1 + inflacao / 100, ano - 1);
      rendaImovelTotal += rendaAno;
      evolucaoImovel.push({
        ano,
        patrimonio: patrimonioImovel,
        renda: rendaImovelTotal
      });
    }

    // Cálculo do FII
    const rendaFIIAnual = fiiValor * (fiiDY / 100);
    let patrimonioFII = fiiValor;
    let rendaFIITotal = 0;
    const evolucaoFII = [{ ano: 0, patrimonio: fiiValor, renda: 0 }];

    for (let ano = 1; ano <= periodo; ano++) {
      patrimonioFII *= (1 + fiiValorizacao / 100);
      const rendaAno = fiiValor * (fiiDY / 100) * Math.pow(1 + inflacao / 100, ano - 1);
      rendaFIITotal += rendaAno;
      evolucaoFII.push({
        ano,
        patrimonio: patrimonioFII,
        renda: rendaFIITotal
      });
    }

    // Valor real (descontando inflação)
    const inflacaoAcumulada = Math.pow(1 + inflacao / 100, periodo);
    const patrimonioImovelReal = patrimonioImovel / inflacaoAcumulada;
    const patrimonioFIIReal = patrimonioFII / inflacaoAcumulada;

    // Mostrar resultados
    document.getElementById('resultadosFII').style.display = 'block';
    this.renderChartFII(evolucaoImovel, evolucaoFII);
    this.renderCamadasFII(imovelValor, fiiValor, aluguelAnualBruto, vacanciaReais, imovelIptu, imovelManutencao, irAluguel, rendaFIIAnual);
    this.renderResultadoImovel(imovelValor, patrimonioImovel, patrimonioImovelReal, rendaImovelTotal, yieldImovel, periodo);
    this.renderResultadoFII(fiiValor, patrimonioFII, patrimonioFIIReal, rendaFIITotal, fiiDY, periodo);
    this.renderConclusoesFII(patrimonioImovel, patrimonioFII, patrimonioImovelReal, patrimonioFIIReal, rendaImovelTotal, rendaFIITotal, yieldImovel, fiiDY);

    document.getElementById('resultadosFII').scrollIntoView({ behavior: 'smooth' });
  },

  renderChartFII(evolucaoImovel, evolucaoFII) {
    const container = document.getElementById('chartFII');
    const width = container.clientWidth;
    const height = 350;
    const padding = { top: 20, right: 100, bottom: 40, left: 80 };

    const maxVal = Math.max(
      ...evolucaoImovel.map(e => e.patrimonio + e.renda),
      ...evolucaoFII.map(e => e.patrimonio + e.renda)
    );

    const anos = evolucaoImovel.map(e => e.ano);
    const xScale = (ano) => padding.left + (ano / (anos.length - 1)) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - (val / (maxVal * 1.1)) * (height - padding.top - padding.bottom);

    let svg = `<svg width="${width}" height="${height}" class="chart-svg">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * (height - padding.top - padding.bottom);
      const val = maxVal * 1.1 * (1 - i / 5);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#333" stroke-dasharray="3,3" opacity="0.3"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="10">${this.formatCurrency(val).replace('R$', '')}</text>`;
    }

    // Linha Imóvel
    let pathImovel = '';
    evolucaoImovel.forEach((e, i) => {
      const x = xScale(e.ano);
      const y = yScale(e.patrimonio + e.renda);
      pathImovel += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    svg += `<path d="${pathImovel}" stroke="#f97316" stroke-width="3" fill="none"/>`;

    // Linha FII
    let pathFII = '';
    evolucaoFII.forEach((e, i) => {
      const x = xScale(e.ano);
      const y = yScale(e.patrimonio + e.renda);
      pathFII += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    svg += `<path d="${pathFII}" stroke="#8b5cf6" stroke-width="3" fill="none"/>`;

    // Labels
    const lastImovel = evolucaoImovel[evolucaoImovel.length - 1];
    const lastFII = evolucaoFII[evolucaoFII.length - 1];
    svg += `<text x="${width - padding.right + 10}" y="${yScale(lastImovel.patrimonio + lastImovel.renda) + 4}" fill="#f97316" font-size="12" font-weight="600">Imóvel</text>`;
    svg += `<text x="${width - padding.right + 10}" y="${yScale(lastFII.patrimonio + lastFII.renda) + 4}" fill="#8b5cf6" font-size="12" font-weight="600">FII</text>`;

    // X axis
    anos.forEach((ano, i) => {
      if (i % 2 === 0 || anos.length <= 6) {
        svg += `<text x="${xScale(ano)}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="11">Ano ${ano}</text>`;
      }
    });

    svg += '</svg>';
    container.innerHTML = svg;
  },

  renderCamadasFII(imovelValor, fiiValor, aluguelBruto, vacancia, iptu, manutencao, ir, rendaFII) {
    const container = document.getElementById('camadasGrid');

    const rendaLiquidaImovel = aluguelBruto - vacancia - iptu - manutencao - ir;
    const yieldImovel = (rendaLiquidaImovel / imovelValor) * 100;
    const yieldFII = (rendaFII / fiiValor) * 100;

    html = `
      <div class="camada-comparativo">
        <div class="camada-header">
          <span>Componente</span>
          <span>Imóvel</span>
          <span>FII</span>
        </div>
        <div class="camada-row">
          <span>Renda bruta anual</span>
          <span>${this.formatCurrency(aluguelBruto)}</span>
          <span>${this.formatCurrency(rendaFII)}</span>
        </div>
        <div class="camada-row negative">
          <span>Vacância</span>
          <span class="text-red">-${this.formatCurrency(vacancia)}</span>
          <span class="text-green">R$ 0</span>
        </div>
        <div class="camada-row negative">
          <span>IPTU</span>
          <span class="text-red">-${this.formatCurrency(iptu)}</span>
          <span class="text-green">R$ 0</span>
        </div>
        <div class="camada-row negative">
          <span>Manutenção</span>
          <span class="text-red">-${this.formatCurrency(manutencao)}</span>
          <span class="text-green">R$ 0</span>
        </div>
        <div class="camada-row negative">
          <span>IR sobre renda</span>
          <span class="text-red">-${this.formatCurrency(ir)}</span>
          <span class="text-green">R$ 0 (isento)</span>
        </div>
        <div class="camada-row total">
          <span>Renda líquida anual</span>
          <span>${this.formatCurrency(rendaLiquidaImovel)}</span>
          <span>${this.formatCurrency(rendaFII)}</span>
        </div>
        <div class="camada-row yield">
          <span>Yield líquido</span>
          <span>${this.formatPercent(yieldImovel)}</span>
          <span>${this.formatPercent(yieldFII)}</span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  renderResultadoImovel(valorInicial, valorFinal, valorReal, rendaTotal, yield_, periodo) {
    const container = document.getElementById('resultadoImovel');
    container.innerHTML = `
      <div class="valor-item">
        <span class="valor-label">Valor inicial</span>
        <span class="valor-number">${this.formatCurrency(valorInicial)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Valor final (${periodo} anos)</span>
        <span class="valor-number">${this.formatCurrency(valorFinal)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Valor real (hoje)</span>
        <span class="valor-number">${this.formatCurrency(valorReal)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Renda total recebida</span>
        <span class="valor-number">${this.formatCurrency(rendaTotal)}</span>
      </div>
      <div class="valor-item destaque">
        <span class="valor-label">Patrimônio total</span>
        <span class="valor-number">${this.formatCurrency(valorFinal + rendaTotal)}</span>
      </div>
    `;
  },

  renderResultadoFII(valorInicial, valorFinal, valorReal, rendaTotal, dy, periodo) {
    const container = document.getElementById('resultadoFII');
    container.innerHTML = `
      <div class="valor-item">
        <span class="valor-label">Valor inicial</span>
        <span class="valor-number">${this.formatCurrency(valorInicial)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Valor final (${periodo} anos)</span>
        <span class="valor-number">${this.formatCurrency(valorFinal)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Valor real (hoje)</span>
        <span class="valor-number">${this.formatCurrency(valorReal)}</span>
      </div>
      <div class="valor-item">
        <span class="valor-label">Dividendos totais</span>
        <span class="valor-number">${this.formatCurrency(rendaTotal)}</span>
      </div>
      <div class="valor-item destaque">
        <span class="valor-label">Patrimônio total</span>
        <span class="valor-number">${this.formatCurrency(valorFinal + rendaTotal)}</span>
      </div>
    `;
  },

  renderConclusoesFII(patImovel, patFII, patImovelReal, patFIIReal, rendaImovel, rendaFII, yieldImovel, yieldFII) {
    const container = document.getElementById('conclusoesFII');
    const conclusoes = [];

    const totalImovel = patImovel + rendaImovel;
    const totalFII = patFII + rendaFII;
    const vencedor = totalFII > totalImovel ? 'FII' : 'Imóvel';
    const diferenca = Math.abs(totalFII - totalImovel);

    conclusoes.push({
      tipo: totalFII > totalImovel ? 'success' : 'info',
      icon: totalFII > totalImovel ? '📊' : '🏠',
      texto: `O <strong>${vencedor}</strong> gerou <strong>${this.formatCurrency(diferenca)}</strong> a mais em patrimônio total.`
    });

    if (yieldFII > yieldImovel) {
      conclusoes.push({
        tipo: 'success',
        icon: '💰',
        texto: `O FII tem <strong>yield líquido superior</strong> (${this.formatPercent(yieldFII)} vs ${this.formatPercent(yieldImovel)}) sem trabalho de gestão.`
      });
    }

    conclusoes.push({
      tipo: 'warning',
      icon: '⚠️',
      texto: `O imóvel exige <strong>gestão ativa</strong>: encontrar inquilinos, cobrar, manter, lidar com inadimplência. O FII é 100% passivo.`
    });

    conclusoes.push({
      tipo: 'info',
      icon: '🔄',
      texto: `<strong>Liquidez:</strong> FIIs podem ser vendidos em segundos na bolsa. Imóvel pode levar meses para vender sem desconto.`
    });

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

  // ==========================================
  // DECOMPOSIÇÃO DO RETORNO
  // ==========================================
  decomporRetorno() {
    const ativo = document.getElementById('ativoDecomp').value;
    const periodo = parseInt(document.getElementById('periodoDecomp').value);

    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - periodo;
    const dadosFiltrados = this.dados.anos.filter(d => d.ano > anoInicio && d.ano <= anoAtual);

    // Calcular retorno total e inflação
    let retornoAcumulado = 1;
    let inflacaoAcumulada = 1;

    dadosFiltrados.forEach(d => {
      let retorno = d[ativo];
      if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }
      if (retorno !== null && retorno !== undefined) {
        retornoAcumulado *= (1 + retorno / 100);
      }
      inflacaoAcumulada *= (1 + d.inflacao_ipca / 100);
    });

    const retornoNominal = (retornoAcumulado - 1) * 100;
    const inflacao = (inflacaoAcumulada - 1) * 100;
    const retornoReal = ((retornoAcumulado / inflacaoAcumulada) - 1) * 100;

    // Custos estimados
    const custos = this.dados.custos;
    let taxaCusto = 0;
    if (['ibovespa', 'fii_ifix', 'sp500_brl'].includes(ativo)) {
      taxaCusto = custos.acoes.ir_ganho_capital;
    } else if (['cdi', 'tesouro_ipca'].includes(ativo)) {
      taxaCusto = custos.renda_fixa.ir_acima_720d;
    }

    const custoIR = retornoNominal > 0 ? retornoNominal * (taxaCusto / 100) : 0;
    const retornoLiquido = retornoNominal - custoIR;
    const ganhoReal = retornoLiquido - inflacao;

    document.getElementById('resultadosDecomp').style.display = 'block';
    this.renderDecompChart(inflacao, ganhoReal, custoIR);
    this.renderDecompDetalhes(retornoNominal, inflacao, custoIR, retornoLiquido, ganhoReal);
    this.renderConclusoesDecomp(ativo, ganhoReal, inflacao, retornoNominal);

    document.getElementById('resultadosDecomp').scrollIntoView({ behavior: 'smooth' });
  },

  renderDecompChart(inflacao, ganhoReal, custos) {
    const container = document.getElementById('decompChart');
    const total = Math.abs(inflacao) + Math.abs(ganhoReal) + Math.abs(custos);

    const pctInflacao = (Math.abs(inflacao) / total) * 100;
    const pctGanho = (Math.abs(ganhoReal) / total) * 100;
    const pctCustos = (Math.abs(custos) / total) * 100;

    container.innerHTML = `
      <div class="decomp-bar-container">
        <div class="decomp-bar">
          ${ganhoReal > 0 ? `<div class="bar-segment verde" style="width: ${pctGanho}%">
            <span class="segment-label">Ganho Real<br>${this.formatPercent(ganhoReal)}</span>
          </div>` : ''}
          <div class="bar-segment cinza" style="width: ${pctInflacao}%">
            <span class="segment-label">Inflação<br>${this.formatPercent(inflacao)}</span>
          </div>
          ${custos > 0 ? `<div class="bar-segment vermelho" style="width: ${pctCustos}%">
            <span class="segment-label">IR<br>${this.formatPercent(custos)}</span>
          </div>` : ''}
          ${ganhoReal < 0 ? `<div class="bar-segment vermelho-escuro" style="width: ${pctGanho}%">
            <span class="segment-label">Perda Real<br>${this.formatPercent(ganhoReal)}</span>
          </div>` : ''}
        </div>
      </div>
    `;
  },

  renderDecompDetalhes(nominal, inflacao, custos, liquido, real) {
    const container = document.getElementById('decompDetalhes');
    container.innerHTML = `
      <div class="decomp-item">
        <span class="decomp-label">Retorno nominal bruto</span>
        <span class="decomp-value">${this.formatPercent(nominal)}</span>
      </div>
      <div class="decomp-item negativo">
        <span class="decomp-label">(-) Imposto de Renda estimado</span>
        <span class="decomp-value text-red">-${this.formatPercent(custos)}</span>
      </div>
      <div class="decomp-item">
        <span class="decomp-label">= Retorno líquido</span>
        <span class="decomp-value">${this.formatPercent(liquido)}</span>
      </div>
      <div class="decomp-item negativo">
        <span class="decomp-label">(-) Inflação acumulada</span>
        <span class="decomp-value text-red">-${this.formatPercent(inflacao)}</span>
      </div>
      <div class="decomp-item total ${real >= 0 ? 'positivo' : 'negativo'}">
        <span class="decomp-label">= GANHO REAL</span>
        <span class="decomp-value ${real >= 0 ? 'text-green' : 'text-red'}">${this.formatPercent(real)}</span>
      </div>
    `;
  },

  renderConclusoesDecomp(ativo, ganhoReal, inflacao, nominal) {
    const container = document.getElementById('conclusoesDecomp');
    const conclusoes = [];
    const nomeAtivo = this.assetNames[ativo];

    if (ganhoReal > 0) {
      const pctInflacao = (inflacao / nominal) * 100;
      conclusoes.push({
        tipo: 'success',
        icon: '✅',
        texto: `${nomeAtivo} <strong>gerou valor real</strong> de ${this.formatPercent(ganhoReal)} acima da inflação.`
      });

      if (pctInflacao > 50) {
        conclusoes.push({
          tipo: 'warning',
          icon: '⚠️',
          texto: `Porém, <strong>${this.formatPercent(pctInflacao)}</strong> do retorno nominal foi apenas correção inflacionária.`
        });
      }
    } else {
      conclusoes.push({
        tipo: 'error',
        icon: '❌',
        texto: `${nomeAtivo} <strong>destruiu valor real</strong>. Você perdeu ${this.formatPercent(Math.abs(ganhoReal))} de poder de compra.`
      });
    }

    if (nominal > 0 && ganhoReal < 0) {
      conclusoes.push({
        tipo: 'warning',
        icon: '💡',
        texto: `A alta de ${this.formatPercent(nominal)} foi <strong>ilusória</strong> - não cobriu nem a inflação do período.`
      });
    }

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

  // ==========================================
  // DIVERSIFICAÇÃO - NOVO MÓDULO COMPLETO
  // ==========================================

  initDiversificacao() {
    // Atualizar total de alocação quando inputs mudarem
    document.querySelectorAll('.aloc-percent').forEach(input => {
      input.addEventListener('input', () => this.atualizarTotalAlocacao());
    });
    this.atualizarTotalAlocacao();
  },

  atualizarTotalAlocacao() {
    let total = 0;
    document.querySelectorAll('.aloc-percent').forEach(input => {
      total += parseFloat(input.value) || 0;
    });

    const totalEl = document.getElementById('alocacaoTotal');
    totalEl.textContent = total + '%';
    totalEl.classList.remove('valid', 'invalid');
    if (total === 100) {
      totalEl.classList.add('valid');
    } else {
      totalEl.classList.add('invalid');
    }

    // Marcar itens ativos
    document.querySelectorAll('.alocacao-item').forEach(item => {
      const input = item.querySelector('.aloc-percent');
      const value = parseFloat(input.value) || 0;
      item.classList.toggle('active', value > 0);
    });
  },

  getAlocacaoConfig() {
    const config = {};
    // Tolerância global (válida para alta e baixa)
    const toleranciaGlobal = parseFloat(document.getElementById('toleranciaGlobal')?.value) || 10;

    document.querySelectorAll('.alocacao-item').forEach(item => {
      const ativo = item.dataset.ativo;
      const alocacao = parseFloat(item.querySelector('.aloc-percent').value) || 0;
      if (alocacao > 0) {
        config[ativo] = { alocacao, tolerancia: toleranciaGlobal };
      }
    });
    return config;
  },

  simularDiversificacao() {
    const anoInicio = parseInt(document.getElementById('anoInicioDiversif').value);
    const anoFim = parseInt(document.getElementById('anoFimDiversif').value);
    const valorInicial = this.parseCurrency(document.getElementById('valorDiversif').value) || 100000;
    const inflacaoCustom = parseFloat(document.getElementById('inflacaoCustom').value) || 0;
    const alocacaoConfig = this.getAlocacaoConfig();

    // Validar período
    if (anoFim <= anoInicio) {
      alert('O ano final deve ser maior que o ano inicial.');
      return;
    }

    // Validar alocação
    const totalAlocacao = Object.values(alocacaoConfig).reduce((sum, c) => sum + c.alocacao, 0);
    if (totalAlocacao !== 100) {
      alert('A alocação total deve ser exatamente 100%. Atual: ' + totalAlocacao + '%');
      return;
    }

    if (Object.keys(alocacaoConfig).length === 0) {
      alert('Selecione pelo menos um ativo com alocação maior que 0%.');
      return;
    }

    // Filtrar dados pelo intervalo personalizado
    const dadosFiltrados = this.dados.anos.filter(d => d.ano >= anoInicio && d.ano <= anoFim);

    if (dadosFiltrados.length === 0) {
      alert('Não há dados suficientes para o período selecionado.');
      return;
    }

    // Verificar se algum ativo selecionado não tem dados no período
    const ativosComDados = Object.keys(alocacaoConfig).filter(ativo => {
      return dadosFiltrados.some(d => d[ativo] !== null && d[ativo] !== undefined);
    });

    if (ativosComDados.length < Object.keys(alocacaoConfig).length) {
      const ativosSemDados = Object.keys(alocacaoConfig).filter(a => !ativosComDados.includes(a));
      alert(`Alguns ativos não têm dados para o período selecionado: ${ativosSemDados.map(a => this.assetNames[a]).join(', ')}. Por favor, ajuste a alocação ou o período.`);
      return;
    }

    // Simular COM rebalanceamento (inclui impostos e preço médio)
    const resultadoComRebal = this.simularCarteiraComRebalanceamento(
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom
    );

    // Simular SEM rebalanceamento (buy and hold)
    const resultadoSemRebal = this.simularCarteiraSemRebalanceamento(
      alocacaoConfig, dadosFiltrados, valorInicial, inflacaoCustom
    );

    // Simular cada ativo individual para ranking
    const resultadosIndividuais = this.simularAtivosIndividuais(dadosFiltrados, valorInicial, inflacaoCustom);

    // Calcular inflação acumulada
    const inflacaoAcumulada = inflacaoCustom > 0
      ? Math.pow(1 + inflacaoCustom / 100, dadosFiltrados.length) - 1
      : this.calcularInflacaoAcumulada(dadosFiltrados) / 100;

    // Salvar resultados para toggle de gráfico
    this._diversifData = { resultadoComRebal, resultadoSemRebal, inflacaoCustom };

    // Mostrar resultados
    document.getElementById('resultadosDiversif').style.display = 'block';

    this.renderComparativoPrincipal(resultadoComRebal, resultadoSemRebal);
    this.renderValorLiquido(resultadoComRebal, resultadoSemRebal);
    this.renderChartDiversifNovo(resultadoComRebal, resultadoSemRebal);
    this.renderHistoricoSemestral(resultadoComRebal);
    this.renderRankingDiversifNovo(resultadoComRebal, resultadosIndividuais, inflacaoAcumulada * 100);
    this.renderMetricasDiversifNovo(resultadoComRebal, resultadoSemRebal, alocacaoConfig);
    this.renderConclusoesDiversifNovo(resultadoComRebal, resultadoSemRebal, resultadosIndividuais, alocacaoConfig);

    // Bind toggle buttons
    document.getElementById('btnNominalDiversif')?.addEventListener('click', () => {
      this.chartViewDiversif = 'nominal';
      document.getElementById('btnNominalDiversif').classList.add('active');
      document.getElementById('btnRealDiversif').classList.remove('active');
      this.renderChartDiversifNovo(resultadoComRebal, resultadoSemRebal);
    });
    document.getElementById('btnRealDiversif')?.addEventListener('click', () => {
      this.chartViewDiversif = 'real';
      document.getElementById('btnRealDiversif').classList.add('active');
      document.getElementById('btnNominalDiversif').classList.remove('active');
      this.renderChartDiversifNovo(resultadoComRebal, resultadoSemRebal);
    });

    document.getElementById('resultadosDiversif').scrollIntoView({ behavior: 'smooth' });
  },

  simularCarteiraComRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0) {
    const ativos = Object.keys(config);
    const historico = [];
    let inflacaoAcumulada = 1;

    // Inicializar carteira com preço médio
    let carteira = {};
    let precoMedio = {}; // Controle de preço médio por ativo
    let custoTotal = {}; // Custo total investido por ativo
    let totalImpostosPagos = 0;

    ativos.forEach(ativo => {
      const valorAlocado = valorInicial * (config[ativo].alocacao / 100);
      carteira[ativo] = valorAlocado;
      precoMedio[ativo] = 1; // Preço inicial normalizado = 1
      custoTotal[ativo] = valorAlocado;
    });

    const evolucao = [{
      periodo: `${dados[0].ano - 1} S2`,
      ano: dados[0].ano - 1,
      semestre: 2,
      valor: valorInicial,
      valorReal: valorInicial,
      carteira: { ...carteira },
      rebalanceou: false,
      movimentacoes: [],
      impostosPagos: 0
    }];

    let totalRebalanceamentos = 0;
    const retornosSemestrais = [];

    // Preço de mercado relativo (começa em 1)
    let precoMercado = {};
    ativos.forEach(ativo => {
      precoMercado[ativo] = 1;
    });

    // Processar cada ano
    dados.forEach((dadoAno, anoIndex) => {
      // Dividir ano em 2 semestres
      for (let sem = 1; sem <= 2; sem++) {
        const periodoLabel = `${dadoAno.ano} S${sem}`;
        const movimentacoes = [];
        let rebalanceou = false;
        let impostoPeriodo = 0;

        // Aplicar retorno semestral (metade do anual) para cada ativo
        let valorAntes = 0;
        ativos.forEach(ativo => {
          valorAntes += carteira[ativo];
        });

        ativos.forEach(ativo => {
          let retornoAnual = dadoAno[ativo];
          if (ativo === 'ibovespa' && dadoAno.ibovespa_dividendos) {
            retornoAnual = dadoAno.ibovespa + dadoAno.ibovespa_dividendos;
          }
          if (retornoAnual === null || retornoAnual === undefined) {
            retornoAnual = 0;
          }
          // Retorno semestral aproximado
          const retornoSemestral = Math.pow(1 + retornoAnual / 100, 0.5) - 1;
          carteira[ativo] *= (1 + retornoSemestral);
          precoMercado[ativo] *= (1 + retornoSemestral);
        });

        // Calcular valor total após retornos
        let valorTotal = 0;
        ativos.forEach(ativo => {
          valorTotal += carteira[ativo];
        });

        // Calcular retorno do semestre
        const retornoSemestre = (valorTotal / valorAntes - 1) * 100;
        retornosSemestrais.push(retornoSemestre);

        // Atualizar inflação (semestral)
        const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : dadoAno.inflacao_ipca;
        const inflacaoSemestral = Math.pow(1 + inflacaoAnual / 100, 0.5) - 1;
        inflacaoAcumulada *= (1 + inflacaoSemestral);

        // Verificar necessidade de rebalanceamento
        const alocacoesAtuais = {};
        ativos.forEach(ativo => {
          alocacoesAtuais[ativo] = (carteira[ativo] / valorTotal) * 100;
        });

        // Identificar ativos fora da tolerância
        const foraTolerancia = [];
        ativos.forEach(ativo => {
          const atual = alocacoesAtuais[ativo];
          const desejada = config[ativo].alocacao;
          const tolerancia = config[ativo].tolerancia;
          const diferenca = atual - desejada;

          if (Math.abs(diferenca) > tolerancia) {
            foraTolerancia.push({
              ativo,
              atual,
              desejada,
              diferenca,
              valor: carteira[ativo]
            });
          }
        });

        // Executar rebalanceamento se necessário
        if (foraTolerancia.length > 0) {
          rebalanceou = true;
          totalRebalanceamentos++;

          // Rebalancear para as alocações desejadas
          ativos.forEach(ativo => {
            const valorDesejado = valorTotal * (config[ativo].alocacao / 100);
            const valorAtual = carteira[ativo];
            const diferenca = valorDesejado - valorAtual;

            if (Math.abs(diferenca) > 1) { // Ignorar diferenças menores que R$1
              if (diferenca < 0) {
                // VENDA - calcular ganho de capital e imposto
                const qtdVendida = Math.abs(diferenca) / precoMercado[ativo];
                const custoVenda = qtdVendida * precoMedio[ativo];
                const lucroVenda = Math.abs(diferenca) - custoVenda;
                const taxaIR = this.taxasIR[ativo] || 0.15;
                let impostoVenda = 0;

                if (lucroVenda > 0) {
                  impostoVenda = lucroVenda * taxaIR;
                  impostoPeriodo += impostoVenda;
                  totalImpostosPagos += impostoVenda;
                }

                // Atualizar custo total proporcionalmente
                const proporcaoVendida = Math.abs(diferenca) / valorAtual;
                custoTotal[ativo] *= (1 - proporcaoVendida);

                movimentacoes.push({
                  ativo,
                  tipo: 'venda',
                  valor: Math.abs(diferenca),
                  de: alocacoesAtuais[ativo].toFixed(1),
                  para: config[ativo].alocacao.toFixed(1),
                  precoMercado: precoMercado[ativo].toFixed(4),
                  precoMedio: precoMedio[ativo].toFixed(4),
                  lucro: lucroVenda,
                  imposto: impostoVenda
                });

                // Aplicar imposto (reduz o valor disponível para rebalanceamento)
                carteira[ativo] = valorAtual - Math.abs(diferenca);
              } else {
                // COMPRA - atualizar preço médio
                const qtdComprada = diferenca / precoMercado[ativo];
                const qtdAtual = carteira[ativo] / precoMercado[ativo];

                // Novo preço médio ponderado
                const custoAnterior = custoTotal[ativo];
                custoTotal[ativo] = custoAnterior + diferenca;
                precoMedio[ativo] = custoTotal[ativo] / (qtdAtual + qtdComprada);

                movimentacoes.push({
                  ativo,
                  tipo: 'compra',
                  valor: diferenca,
                  de: alocacoesAtuais[ativo].toFixed(1),
                  para: config[ativo].alocacao.toFixed(1),
                  precoMercado: precoMercado[ativo].toFixed(4),
                  precoMedio: precoMedio[ativo].toFixed(4)
                });

                carteira[ativo] = valorAtual + diferenca;
              }
            }
          });

          // Recalcular valor total após impostos
          valorTotal = Object.values(carteira).reduce((a, b) => a + b, 0) - impostoPeriodo;

          // Ajustar carteira proporcionalmente pelo imposto pago
          if (impostoPeriodo > 0) {
            const fatorReducao = valorTotal / (valorTotal + impostoPeriodo);
            ativos.forEach(ativo => {
              carteira[ativo] *= fatorReducao;
            });
          }
        }

        historico.push({
          periodo: periodoLabel,
          ano: dadoAno.ano,
          semestre: sem,
          valor: valorTotal,
          valorReal: valorTotal / inflacaoAcumulada,
          carteira: { ...carteira },
          alocacoes: { ...alocacoesAtuais },
          rebalanceou,
          movimentacoes,
          impostosPagos: impostoPeriodo,
          inflacao: inflacaoAnual / 2
        });

        evolucao.push({
          periodo: periodoLabel,
          ano: dadoAno.ano,
          semestre: sem,
          valor: valorTotal,
          valorReal: valorTotal / inflacaoAcumulada,
          carteira: { ...carteira },
          precoMercado: { ...precoMercado },
          precoMedio: { ...precoMedio },
          custoTotal: { ...custoTotal },
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
    let maxDrawdown = 0;
    let peakValue = valorInicial;
    evolucao.forEach(e => {
      if (e.valor > peakValue) peakValue = e.valor;
      const drawdown = (peakValue - e.valor) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calcular valor líquido se vender tudo hoje
    let valorLiquido = 0;
    let impostoVendaTotal = 0;
    const ultimoEstado = evolucao[evolucao.length - 1];

    ativos.forEach(ativo => {
      const valorAtivo = carteira[ativo];
      const custo = custoTotal[ativo];
      const lucro = valorAtivo - custo;
      const taxaIR = this.taxasIR[ativo] || 0.15;

      if (lucro > 0) {
        impostoVendaTotal += lucro * taxaIR;
      }
      valorLiquido += valorAtivo;
    });

    valorLiquido -= impostoVendaTotal;

    return {
      evolucao,
      historico,
      valorInicial,
      valorFinal,
      valorReal,
      valorLiquido,
      impostoVendaTotal,
      totalImpostosPagos,
      custoTotal: { ...custoTotal },
      precoMedio: { ...precoMedio },
      retornoNominal,
      retornoReal,
      volatilidade,
      maxDrawdown,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      totalRebalanceamentos,
      inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularCarteiraSemRebalanceamento(config, dados, valorInicial, inflacaoCustom = 0) {
    const ativos = Object.keys(config);
    let inflacaoAcumulada = 1;
    let custoTotal = {};

    // Inicializar carteira
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
          if (retornoAnual === null || retornoAnual === undefined) {
            retornoAnual = 0;
          }
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

    let maxDrawdown = 0;
    let peakValue = valorInicial;
    evolucao.forEach(e => {
      if (e.valor > peakValue) peakValue = e.valor;
      const drawdown = (peakValue - e.valor) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calcular valor líquido se vender tudo (buy and hold)
    let valorLiquido = 0;
    let impostoVendaTotal = 0;

    ativos.forEach(ativo => {
      const valorAtivo = carteira[ativo];
      const custo = custoTotal[ativo];
      const lucro = valorAtivo - custo;
      const taxaIR = this.taxasIR[ativo] || 0.15;

      if (lucro > 0) {
        impostoVendaTotal += lucro * taxaIR;
      }
      valorLiquido += valorAtivo;
    });

    valorLiquido -= impostoVendaTotal;

    return {
      evolucao,
      valorInicial,
      valorFinal,
      valorReal,
      valorLiquido,
      impostoVendaTotal,
      retornoNominal,
      retornoReal,
      volatilidade,
      maxDrawdown,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0,
      inflacaoAcumulada: (inflacaoAcumulada - 1) * 100
    };
  },

  simularAtivosIndividuais(dados, valorInicial, inflacaoCustom = 0) {
    const ativos = ['ibovespa', 'cdi', 'fii_ifix', 'dolar', 'ouro', 'tesouro_ipca', 'sp500_brl', 'bitcoin_brl', 'tlt_brl', 'imoveis_fipezap'];
    const resultados = {};

    ativos.forEach(ativo => {
      // Verificar se há dados para este ativo
      const temDados = dados.some(d => d[ativo] !== null && d[ativo] !== undefined);
      if (temDados) {
        const resultado = this.calcularEvolucaoCustom(ativo, dados, valorInicial, inflacaoCustom);
        resultados[ativo] = resultado;
      }
    });

    return resultados;
  },

  calcularEvolucaoCustom(ativo, dados, valorInicial, inflacaoCustom = 0) {
    const evolucao = [{ ano: dados[0].ano - 1, nominal: valorInicial, real: valorInicial }];
    let valorNominal = valorInicial;
    let inflacaoAcumulada = 1;

    dados.forEach(d => {
      let retorno = d[ativo];

      if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }

      if (retorno === null || retorno === undefined) {
        retorno = 0;
      }

      valorNominal *= (1 + retorno / 100);
      const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoAnual / 100);

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

  renderValorLiquido(comRebal, semRebal) {
    const container = document.getElementById('valorLiquidoContainer');
    if (!container) return;

    const diferencaLiquido = comRebal.valorLiquido - semRebal.valorLiquido;
    const valorRealLiquidoCom = comRebal.valorLiquido / (1 + comRebal.inflacaoAcumulada / 100);
    const valorRealLiquidoSem = semRebal.valorLiquido / (1 + semRebal.inflacaoAcumulada / 100);

    container.innerHTML = `
      <div class="valor-liquido-grid">
        <div class="valor-liquido-box">
          <h4>Com Rebalanceamento</h4>
          <div class="valor-item">
            <span class="label">Valor bruto:</span>
            <span class="value">${this.formatCurrency(comRebal.valorFinal)}</span>
          </div>
          <div class="valor-item">
            <span class="label">IR sobre lucro (se vender):</span>
            <span class="value text-red">-${this.formatCurrency(comRebal.impostoVendaTotal)}</span>
          </div>
          <div class="valor-item">
            <span class="label">IR pago nos rebalanceamentos:</span>
            <span class="value text-red">-${this.formatCurrency(comRebal.totalImpostosPagos)}</span>
          </div>
          <div class="valor-item destaque">
            <span class="label">💰 Valor líquido:</span>
            <span class="value">${this.formatCurrency(comRebal.valorLiquido)}</span>
          </div>
          <div class="valor-item">
            <span class="label">Valor real (poder de compra):</span>
            <span class="value ${valorRealLiquidoCom > comRebal.valorInicial ? 'text-green' : 'text-red'}">
              ${this.formatCurrency(valorRealLiquidoCom)}
            </span>
          </div>
        </div>

        <div class="valor-liquido-box">
          <h4>Sem Rebalanceamento (Buy & Hold)</h4>
          <div class="valor-item">
            <span class="label">Valor bruto:</span>
            <span class="value">${this.formatCurrency(semRebal.valorFinal)}</span>
          </div>
          <div class="valor-item">
            <span class="label">IR sobre lucro (se vender):</span>
            <span class="value text-red">-${this.formatCurrency(semRebal.impostoVendaTotal)}</span>
          </div>
          <div class="valor-item">
            <span class="label">IR pago nos rebalanceamentos:</span>
            <span class="value text-green">R$ 0,00</span>
          </div>
          <div class="valor-item destaque">
            <span class="label">💰 Valor líquido:</span>
            <span class="value">${this.formatCurrency(semRebal.valorLiquido)}</span>
          </div>
          <div class="valor-item">
            <span class="label">Valor real (poder de compra):</span>
            <span class="value ${valorRealLiquidoSem > semRebal.valorInicial ? 'text-green' : 'text-red'}">
              ${this.formatCurrency(valorRealLiquidoSem)}
            </span>
          </div>
        </div>
      </div>

      <div class="valor-liquido-conclusao ${diferencaLiquido > 0 ? 'positivo' : 'negativo'}">
        ${diferencaLiquido > 0
          ? `✅ Mesmo após impostos, rebalancear gerou <strong>${this.formatCurrency(diferencaLiquido)}</strong> a mais líquido.`
          : `⚠️ Considerando impostos, buy & hold gerou <strong>${this.formatCurrency(Math.abs(diferencaLiquido))}</strong> a mais líquido.`
        }
      </div>
    `;
  },

  renderComparativoPrincipal(comRebal, semRebal) {
    const container = document.getElementById('comparativoPrincipal');
    const diferenca = comRebal.valorFinal - semRebal.valorFinal;
    const diferencaPercent = ((comRebal.valorFinal / semRebal.valorFinal) - 1) * 100;
    const rebalValeuPena = diferenca > 0;

    container.innerHTML = `
      <div class="comparativo-box ${rebalValeuPena ? 'winner' : ''}">
        <span class="box-label">Com Rebalanceamento</span>
        <span class="box-value">${this.formatCurrency(comRebal.valorFinal)}</span>
        <span class="box-subvalue ${comRebal.retornoReal >= 0 ? 'text-green' : 'text-red'}">
          ${this.formatPercent(comRebal.retornoReal)} real
        </span>
      </div>
      <div class="comparativo-vs">VS</div>
      <div class="comparativo-box ${!rebalValeuPena ? 'winner' : ''}">
        <span class="box-label">Sem Rebalanceamento</span>
        <span class="box-value">${this.formatCurrency(semRebal.valorFinal)}</span>
        <span class="box-subvalue ${semRebal.retornoReal >= 0 ? 'text-green' : 'text-red'}">
          ${this.formatPercent(semRebal.retornoReal)} real
        </span>
      </div>
      <div class="comparativo-resultado">
        <span class="resultado-texto ${rebalValeuPena ? 'positivo' : 'negativo'}">
          ${rebalValeuPena
            ? `✅ Rebalancear gerou <strong>${this.formatCurrency(diferenca)}</strong> a mais (+${diferencaPercent.toFixed(1)}%)`
            : `❌ Rebalancear gerou <strong>${this.formatCurrency(Math.abs(diferenca))}</strong> a menos (${diferencaPercent.toFixed(1)}%)`
          }
        </span>
        <br>
        <small style="color: var(--text-muted)">
          ${comRebal.totalRebalanceamentos} rebalanceamentos realizados no período
        </small>
      </div>
    `;
  },

  renderChartDiversifNovo(comRebal, semRebal) {
    const container = document.getElementById('chartDiversif');
    const legendaContainer = document.getElementById('chartLegenda');
    const width = container.clientWidth;
    const height = 350;
    const padding = { top: 20, right: 100, bottom: 40, left: 80 };

    // Usar valor nominal ou real baseado no toggle
    const useReal = this.chartViewDiversif === 'real';
    const getVal = (e) => useReal ? (e.valorReal || e.valor) : e.valor;

    const maxVal = Math.max(
      ...comRebal.evolucao.map(e => getVal(e)),
      ...semRebal.evolucao.map(e => getVal(e))
    );
    const minVal = Math.min(
      ...comRebal.evolucao.map(e => getVal(e)),
      ...semRebal.evolucao.map(e => getVal(e))
    ) * 0.95;

    const pontos = comRebal.evolucao.length;
    const xScale = (i) => padding.left + (i / (pontos - 1)) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

    let svg = `<svg width="${width}" height="${height}" class="chart-svg">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * (height - padding.top - padding.bottom);
      const val = maxVal - (i / 5) * (maxVal - minVal);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#333" stroke-dasharray="3,3" opacity="0.3"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="10">${this.formatCurrency(val).replace('R$', '')}</text>`;
    }

    // Linha do valor inicial (para referência em valor real)
    if (useReal) {
      svg += `<line x1="${padding.left}" y1="${yScale(comRebal.valorInicial)}" x2="${width - padding.right}" y2="${yScale(comRebal.valorInicial)}" stroke="#666" stroke-dasharray="4,4" opacity="0.5"/>`;
      svg += `<text x="${padding.left + 5}" y="${yScale(comRebal.valorInicial) - 5}" fill="#666" font-size="9">Valor inicial</text>`;
    }

    // Linha SEM rebalanceamento (tracejada)
    let pathSem = '';
    semRebal.evolucao.forEach((e, i) => {
      const x = xScale(i);
      const y = yScale(getVal(e));
      pathSem += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    svg += `<path d="${pathSem}" stroke="#888" stroke-width="2" stroke-dasharray="8,4" fill="none"/>`;

    // Linha COM rebalanceamento
    let pathCom = '';
    comRebal.evolucao.forEach((e, i) => {
      const x = xScale(i);
      const y = yScale(getVal(e));
      pathCom += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;

      // Marcar pontos de rebalanceamento
      if (e.rebalanceou) {
        svg += `<circle cx="${x}" cy="${y}" r="5" fill="#f59e0b" stroke="#fff" stroke-width="1"/>`;
      }
    });
    svg += `<path d="${pathCom}" stroke="#2d8a6e" stroke-width="3" fill="none"/>`;

    // Labels finais
    const lastCom = comRebal.evolucao[comRebal.evolucao.length - 1];
    const lastSem = semRebal.evolucao[semRebal.evolucao.length - 1];
    svg += `<text x="${width - padding.right + 8}" y="${yScale(getVal(lastCom)) + 4}" fill="#2d8a6e" font-size="11" font-weight="600">C/ Rebal</text>`;
    svg += `<text x="${width - padding.right + 8}" y="${yScale(getVal(lastSem)) + 4}" fill="#888" font-size="11" font-weight="600">S/ Rebal</text>`;

    // X axis - mostrar anos
    const anosUnicos = [...new Set(comRebal.evolucao.map(e => e.ano))];
    anosUnicos.forEach((ano, i) => {
      const idx = comRebal.evolucao.findIndex(e => e.ano === ano && e.semestre === 1);
      if (idx >= 0 && i % 2 === 0) {
        svg += `<text x="${xScale(idx)}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="11">${ano}</text>`;
      }
    });

    svg += '</svg>';
    container.innerHTML = svg;

    // Legenda
    const modoLabel = useReal ? '(Valor Real - descontada inflação)' : '(Valor Nominal)';
    legendaContainer.innerHTML = `
      <div class="legenda-modo">${modoLabel}</div>
      <div class="legenda-item-chart">
        <div class="legenda-cor" style="background: #2d8a6e"></div>
        <span>Com rebalanceamento</span>
      </div>
      <div class="legenda-item-chart">
        <div class="legenda-cor dashed" style="color: #888"></div>
        <span>Sem rebalanceamento</span>
      </div>
      <div class="legenda-item-chart">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b;"></div>
        <span>Ponto de rebalanceamento</span>
      </div>
    `;
  },

  renderHistoricoSemestral(resultado) {
    const thead = document.querySelector('#tabelaHistorico thead');
    const tbody = document.querySelector('#tabelaHistorico tbody');

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
      const cor = this.chartColors[ativo] || '#888';
      const nome = this.assetNames[ativo] || ativo;
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

          let detalhe = `${icon} ${this.assetNames[m.ativo]}: ${m.de}% → ${m.para}% (${valorFormatado})`;

          // Mostrar preço e imposto para vendas
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
          const cor = this.chartColors[ativo] || '#888';
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

  renderRankingDiversifNovo(carteiraDiversificada, ativos, inflacaoAcumulada) {
    const container = document.getElementById('rankingDiversif');

    // Criar array com carteira e ativos individuais
    const todos = [
      {
        nome: 'Sua Carteira Diversificada',
        retornoReal: carteiraDiversificada.retornoReal,
        valorFinal: carteiraDiversificada.valorFinal,
        isDiversificada: true
      }
    ];

    Object.entries(ativos).forEach(([ativo, data]) => {
      todos.push({
        nome: this.assetNames[ativo],
        ativo,
        retornoReal: data.retornoReal,
        valorFinal: data.valorFinalNominal,
        isDiversificada: false
      });
    });

    // Ordenar por retorno real
    todos.sort((a, b) => b.retornoReal - a.retornoReal);

    // Encontrar posição da carteira diversificada
    const posicaoDiversificada = todos.findIndex(t => t.isDiversificada) + 1;
    const totalAtivos = todos.length;
    const percentilSuperado = ((totalAtivos - posicaoDiversificada) / (totalAtivos - 1)) * 100;

    let html = `
      <div class="ranking-resumo" style="padding: 16px; background: var(--bg-primary); border-radius: 10px; margin-bottom: 16px; text-align: center;">
        <p style="margin: 0; font-size: 1.1rem;">
          Sua carteira diversificada ficou em <strong>${posicaoDiversificada}º lugar</strong> de ${totalAtivos} opções
          <br>
          <span style="color: var(--text-muted)">
            Superou <strong>${percentilSuperado.toFixed(0)}%</strong> dos ativos individuais
          </span>
        </p>
      </div>
    `;

    todos.forEach((item, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      const isPositive = item.retornoReal > 0;
      const color = item.isDiversificada ? '#2d8a6e' : (this.chartColors[item.ativo] || '#888');

      html += `
        <div class="ranking-item ${isPositive ? 'positive' : 'negative'} ${item.isDiversificada ? 'destaque' : ''}">
          <div class="ranking-position">${medal || (index + 1)}</div>
          <div class="ranking-asset">
            <span class="asset-color" style="background: ${color}"></span>
            <span class="asset-name">
              ${item.nome}
              ${item.isDiversificada ? '<span class="diversificacao-tag">SUA CARTEIRA</span>' : ''}
            </span>
          </div>
          <div class="ranking-values">
            <div class="ranking-real">
              <small>Retorno Real</small>
              <span class="${isPositive ? 'text-green' : 'text-red'}">${this.formatPercent(item.retornoReal)}</span>
            </div>
            <div class="ranking-nominal">
              <small>Valor Final</small>
              <span>${this.formatCurrency(item.valorFinal)}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderMetricasDiversifNovo(comRebal, semRebal, config) {
    const container = document.getElementById('metricasGrid');

    container.innerHTML = `
      <div class="metricas-table">
        <div class="metricas-header">
          <span>Métrica</span>
          <span>Com Rebalanceamento</span>
          <span>Sem Rebalanceamento</span>
          <span>Diferença</span>
        </div>
        <div class="metricas-row">
          <span>Retorno Nominal</span>
          <span>${this.formatPercent(comRebal.retornoNominal)}</span>
          <span>${this.formatPercent(semRebal.retornoNominal)}</span>
          <span class="${comRebal.retornoNominal > semRebal.retornoNominal ? 'text-green' : 'text-red'}">
            ${(comRebal.retornoNominal - semRebal.retornoNominal) > 0 ? '+' : ''}${this.formatPercent(comRebal.retornoNominal - semRebal.retornoNominal)}
          </span>
        </div>
        <div class="metricas-row">
          <span>Retorno Real</span>
          <span class="${comRebal.retornoReal >= 0 ? 'text-green' : 'text-red'}">${this.formatPercent(comRebal.retornoReal)}</span>
          <span class="${semRebal.retornoReal >= 0 ? 'text-green' : 'text-red'}">${this.formatPercent(semRebal.retornoReal)}</span>
          <span class="${comRebal.retornoReal > semRebal.retornoReal ? 'text-green' : 'text-red'}">
            ${(comRebal.retornoReal - semRebal.retornoReal) > 0 ? '+' : ''}${this.formatPercent(comRebal.retornoReal - semRebal.retornoReal)}
          </span>
        </div>
        <div class="metricas-row">
          <span>Volatilidade</span>
          <span>${this.formatPercent(comRebal.volatilidade)}</span>
          <span>${this.formatPercent(semRebal.volatilidade)}</span>
          <span class="${comRebal.volatilidade < semRebal.volatilidade ? 'text-green' : 'text-red'}">
            ${(comRebal.volatilidade - semRebal.volatilidade) > 0 ? '+' : ''}${this.formatPercent(comRebal.volatilidade - semRebal.volatilidade)}
          </span>
        </div>
        <div class="metricas-row">
          <span>Max Drawdown</span>
          <span class="text-red">-${this.formatPercent(comRebal.maxDrawdown)}</span>
          <span class="text-red">-${this.formatPercent(semRebal.maxDrawdown)}</span>
          <span class="${comRebal.maxDrawdown < semRebal.maxDrawdown ? 'text-green' : 'text-red'}">
            ${(comRebal.maxDrawdown - semRebal.maxDrawdown) > 0 ? '' : ''}${this.formatPercent(comRebal.maxDrawdown - semRebal.maxDrawdown)}
          </span>
        </div>
        <div class="metricas-row">
          <span>Índice Sharpe</span>
          <span>${comRebal.sharpe.toFixed(2)}</span>
          <span>${semRebal.sharpe.toFixed(2)}</span>
          <span class="${comRebal.sharpe > semRebal.sharpe ? 'text-green' : 'text-red'}">
            ${(comRebal.sharpe - semRebal.sharpe) > 0 ? '+' : ''}${(comRebal.sharpe - semRebal.sharpe).toFixed(2)}
          </span>
        </div>
      </div>
    `;
  },

  renderConclusoesDiversifNovo(comRebal, semRebal, ativos, config) {
    const container = document.getElementById('conclusoesDiversif');
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
        texto: `O buy-and-hold teria gerado <strong>${this.formatCurrency(Math.abs(diferencaRebal))}</strong> a mais. Neste período, rebalancear não compensou.`
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
    const ativosArray = Object.entries(ativos).map(([k, v]) => ({ nome: this.assetNames[k], ...v }));
    ativosArray.sort((a, b) => b.retornoReal - a.retornoReal);
    const melhorAtivo = ativosArray[0];
    const piorAtivo = ativosArray[ativosArray.length - 1];
    const ativosVencidos = ativosArray.filter(a => a.retornoReal < comRebal.retornoReal).length;
    const percentualVencidos = (ativosVencidos / ativosArray.length * 100).toFixed(0);

    conclusoes.push({
      tipo: 'info',
      icon: '🏆',
      texto: `Sua carteira superou <strong>${percentualVencidos}%</strong> dos ativos individuais. O melhor foi ${melhorAtivo.nome} (+${melhorAtivo.retornoReal.toFixed(1)}%) e o pior foi ${piorAtivo.nome} (${piorAtivo.retornoReal.toFixed(1)}%).`
    });

    // 4. Proteção nas quedas
    if (comRebal.maxDrawdown < semRebal.maxDrawdown) {
      conclusoes.push({
        tipo: 'success',
        icon: '🛡️',
        texto: `O rebalanceamento reduziu a perda máxima: <strong>${comRebal.maxDrawdown.toFixed(1)}%</strong> vs ${semRebal.maxDrawdown.toFixed(1)}% sem rebalancear.`
      });
    }

    // 5. Ganho real
    if (comRebal.retornoReal > 0) {
      conclusoes.push({
        tipo: 'success',
        icon: '💰',
        texto: `Sua carteira gerou <strong>${this.formatPercent(comRebal.retornoReal)}</strong> de ganho real acima da inflação (${comRebal.inflacaoAcumulada.toFixed(1)}% no período).`
      });
    } else {
      conclusoes.push({
        tipo: 'error',
        icon: '📉',
        texto: `Sua carteira perdeu <strong>${this.formatPercent(Math.abs(comRebal.retornoReal))}</strong> em termos reais. A inflação de ${comRebal.inflacaoAcumulada.toFixed(1)}% corroeu os ganhos.`
      });
    }

    // 6. Número de rebalanceamentos
    if (comRebal.totalRebalanceamentos > 0) {
      conclusoes.push({
        tipo: 'info',
        icon: '⚖️',
        texto: `Foram necessários <strong>${comRebal.totalRebalanceamentos} rebalanceamentos</strong> para manter a carteira dentro das tolerâncias definidas.`
      });
    }

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

  // ==========================================
  // NOVA ABA DIVERSIFICAÇÃO VS FOCO ÚNICO
  // ==========================================

  // Aplicar preset nos inputs
  aplicarPresetDiversif(preset) {
    const presets = {
      '5050': { ibovespa: 50, cdi: 50, dolar: 0, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0 },
      'global': { ibovespa: 25, cdi: 25, dolar: 0, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 25, tlt_brl: 25 }
    };

    const alocacao = presets[preset] || presets['5050'];

    document.querySelectorAll('#alocacaoGridNovo .alocacao-item-simple').forEach(item => {
      const ativo = item.dataset.ativo;
      const input = item.querySelector('.aloc-percent-novo');
      if (input && alocacao[ativo] !== undefined) {
        input.value = alocacao[ativo];
      }
    });

    this.atualizarTotalAlocacaoNovo();
  },

  // Aplicar preset no rebalanceamento
  aplicarPresetRebalanceamento(preset) {
    const presets = {
      '5050': { ibovespa: 50, cdi: 50, dolar: 0, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0, imoveis_fipezap: 0, bitcoin_brl: 0 },
      '3ativos': { ibovespa: 33, cdi: 33, dolar: 34, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0, imoveis_fipezap: 0, bitcoin_brl: 0 },
      '4ativos': { ibovespa: 25, cdi: 25, dolar: 25, ouro: 25, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 0, tlt_brl: 0, imoveis_fipezap: 0, bitcoin_brl: 0 },
      'global': { ibovespa: 25, cdi: 25, dolar: 0, ouro: 0, fii_ifix: 0, tesouro_ipca: 0, sp500_brl: 25, tlt_brl: 25, imoveis_fipezap: 0, bitcoin_brl: 0 }
    };

    const alocacao = presets[preset] || presets['5050'];

    document.querySelectorAll('#alocacaoGrid .alocacao-item').forEach(item => {
      const ativo = item.dataset.ativo;
      const inputPercent = item.querySelector('.aloc-percent');
      if (inputPercent && alocacao[ativo] !== undefined) {
        inputPercent.value = alocacao[ativo];
      }
    });

    this.atualizarTotalAlocacao();
  },

  // Atualizar total de alocação
  atualizarTotalAlocacaoNovo() {
    let total = 0;
    document.querySelectorAll('.aloc-percent-novo').forEach(input => {
      total += parseFloat(input.value) || 0;
    });

    const display = document.getElementById('alocacaoTotalNovo');
    if (display) {
      display.textContent = total + '%';
      display.style.color = total === 100 ? '#22c55e' : (total > 100 ? '#ef4444' : '#eab308');
    }
  },

  // Ler alocação dos inputs
  lerAlocacaoNovo() {
    const alocacao = {};
    const ativos = [];

    document.querySelectorAll('#alocacaoGridNovo .alocacao-item-simple').forEach(item => {
      const ativo = item.dataset.ativo;
      const input = item.querySelector('.aloc-percent-novo');
      const valor = parseFloat(input.value) || 0;

      if (valor > 0) {
        alocacao[ativo] = valor;
        ativos.push(ativo);
      }
    });

    return { alocacao, ativos };
  },

  // Gerar nome da estratégia baseado na alocação
  gerarNomeEstrategia(alocacao) {
    const partes = [];
    Object.entries(alocacao).forEach(([ativo, peso]) => {
      const nomeAtivo = this.assetNames[ativo] || ativo;
      const nomeSimples = nomeAtivo.split(' ')[0].replace('(', '').replace(')', '');
      partes.push(`${peso}% ${nomeSimples}`);
    });
    return partes.join(' + ');
  },

  simularDiversificacaoNovo() {
    const anoInicio = parseInt(document.getElementById('anoInicioDiversifNovo').value);
    const anoFim = parseInt(document.getElementById('anoFimDiversifNovo').value);
    const valorInicialStr = document.getElementById('valorDiversifNovo').value;
    const valorInicial = parseFloat(valorInicialStr.toString().replace(/\./g, '').replace(',', '.')) || 100000;
    const inflacaoCustom = parseFloat(document.getElementById('inflacaoDiversifNovo').value) || 0;

    // Ler alocação dos inputs
    const { alocacao, ativos } = this.lerAlocacaoNovo();

    // Validar alocação
    const totalAlocacao = Object.values(alocacao).reduce((a, b) => a + b, 0);
    if (totalAlocacao === 0) {
      alert('Defina pelo menos uma alocação para comparar.');
      return;
    }

    if (ativos.length < 2) {
      alert('Selecione pelo menos 2 ativos para comparar diversificação.');
      return;
    }

    // Filtrar dados pelo período
    const dadosFiltrados = this.dados.anos.filter(d => d.ano >= anoInicio && d.ano <= anoFim);

    if (dadosFiltrados.length === 0) {
      alert('Não há dados suficientes para o período selecionado.');
      return;
    }

    // Calcular retorno de cada estratégia
    const resultados = [];

    // Estratégia diversificada (a principal)
    const nomeEstrategia = this.gerarNomeEstrategia(alocacao);
    const retornoDiversificada = this.calcularRetornoEstrategia({ nome: nomeEstrategia, alocacao }, dadosFiltrados, valorInicial, inflacaoCustom);
    resultados.push({
      nome: nomeEstrategia,
      alocacao,
      isDiversificada: true,
      ...retornoDiversificada
    });

    // Cada ativo individual
    ativos.forEach(ativo => {
      const alocacaoIndividual = { [ativo]: 100 };
      const retorno = this.calcularRetornoEstrategia({ nome: this.assetNames[ativo], alocacao: alocacaoIndividual }, dadosFiltrados, valorInicial, inflacaoCustom);
      resultados.push({
        nome: this.assetNames[ativo],
        alocacao: alocacaoIndividual,
        isDiversificada: false,
        ...retorno
      });
    });

    // Ordenar por retorno real (maior primeiro)
    resultados.sort((a, b) => b.retornoReal - a.retornoReal);

    // Encontrar posição da estratégia diversificada no ranking
    const posicaoDiversificada = resultados.findIndex(r => r.isDiversificada) + 1;
    const totalEstrategias = resultados.length;

    // Mostrar resultados
    document.getElementById('resultadosDiversifNovo').style.display = 'block';

    // Renderizar tabela
    this.renderTabelaDiversifNovo(resultados, valorInicial);

    // Renderizar gráfico
    this.renderChartDiversificacao(resultados, dadosFiltrados, valorInicial);

    // Renderizar conclusão
    this.renderConclusaoDiversifNovo(resultados, posicaoDiversificada, totalEstrategias, nomeEstrategia);

    // Scroll para resultados
    document.getElementById('resultadosDiversifNovo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  calcularRetornoEstrategia(estrategia, dados, valorInicial, inflacaoCustom = 0) {
    let valorAtual = valorInicial;
    const evolucao = [valorInicial];
    let inflacaoAcumulada = 1;

    dados.forEach(ano => {
      let retornoAno = 0;

      // Calcular retorno ponderado do ano
      Object.entries(estrategia.alocacao).forEach(([ativo, peso]) => {
        const retornoAtivo = ano[ativo] || 0;
        retornoAno += (retornoAtivo * peso / 100);
      });

      valorAtual = valorAtual * (1 + retornoAno / 100);
      evolucao.push(valorAtual);

      // Usar inflação customizada ou real
      const inflacaoAno = inflacaoCustom > 0 ? inflacaoCustom : (ano.inflacao_ipca || 0);
      inflacaoAcumulada *= (1 + inflacaoAno / 100);
    });

    const retornoNominal = ((valorAtual / valorInicial) - 1) * 100;
    const valorReal = valorAtual / inflacaoAcumulada;
    const retornoReal = ((valorReal / valorInicial) - 1) * 100;

    // Calcular volatilidade
    const retornosAnuais = [];
    for (let i = 1; i < evolucao.length; i++) {
      retornosAnuais.push((evolucao[i] / evolucao[i - 1] - 1) * 100);
    }
    const volatilidade = this.calcularVolatilidade(retornosAnuais);

    return {
      valorFinal: valorAtual,
      valorReal,
      retornoNominal,
      retornoReal,
      volatilidade,
      evolucao
    };
  },

  renderTabelaDiversifNovo(resultados, valorInicial) {
    const container = document.getElementById('tabelaDiversifNovo');

    let html = `
      <table class="tabela-diversif-novo">
        <thead>
          <tr>
            <th>#</th>
            <th>Estratégia</th>
            <th>Valor Final</th>
            <th>Retorno Nominal</th>
            <th>Retorno Real</th>
            <th>Volatilidade</th>
          </tr>
        </thead>
        <tbody>
    `;

    resultados.forEach((r, i) => {
      const isDestaque = r.isDiversificada;
      const retornoRealClass = r.retornoReal >= 0 ? 'valor-positivo' : 'valor-negativo';

      html += `
        <tr class="${isDestaque ? 'destaque-row' : ''}">
          <td>${i + 1}º</td>
          <td>
            ${r.nome}
            ${isDestaque ? '<span class="estrategia-tag">Diversificada</span>' : ''}
          </td>
          <td>${this.formatCurrency(r.valorFinal)}</td>
          <td>${this.formatPercent(r.retornoNominal)}</td>
          <td class="${retornoRealClass}">${this.formatPercent(r.retornoReal)}</td>
          <td>${this.formatPercent(r.volatilidade)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  renderChartDiversificacao(resultados, dados, valorInicial) {
    const canvas = document.getElementById('chartDiversifNovo');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destruir gráfico existente se houver
    if (this.chartDiversificacao) {
      this.chartDiversificacao.destroy();
    }

    const labels = [dados[0].ano - 1, ...dados.map(d => d.ano)];

    const datasets = resultados.map((r, i) => {
      const cores = ['#2d8a6e', '#3b82f6', '#ec4899', '#22c55e', '#eab308'];
      const cor = r.isDiversificada ? '#2d8a6e' : cores[(i % cores.length)];

      return {
        label: r.nome,
        data: r.evolucao,
        borderColor: cor,
        backgroundColor: r.isDiversificada ? 'rgba(45, 138, 110, 0.1)' : 'transparent',
        borderWidth: r.isDiversificada ? 3 : 2,
        tension: 0.4,
        fill: r.isDiversificada,
        pointRadius: 0
      };
    });

    this.chartDiversificacao = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8b949e',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#1c2128',
            titleColor: '#f0f6fc',
            bodyColor: '#8b949e',
            borderColor: '#30363d',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#30363d' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: '#30363d' },
            ticks: {
              color: '#8b949e',
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  },

  renderConclusaoDiversifNovo(resultados, posicao, total, nomeEstrategia) {
    const container = document.getElementById('conclusaoDiversifNovo');
    const estrategiaDiversificada = resultados.find(r => r.isDiversificada);
    const melhorIndividual = resultados.find(r => !r.isDiversificada);

    let badge, mensagem;

    if (posicao === 1) {
      badge = '<div class="resultado-badge positivo">✅ Diversificação venceu!</div>';
      mensagem = `
        <p>A estratégia diversificada <strong>${nomeEstrategia}</strong> teve o melhor retorno real do período, superando todos os ativos individuais.</p>
        <p>Isso demonstra que, neste período específico, a diversificação não só protegeu como também maximizou os ganhos.</p>
      `;
    } else if (posicao <= Math.ceil(total / 2)) {
      badge = '<div class="resultado-badge neutro">⚖️ Diversificação protegeu</div>';
      mensagem = `
        <p>A estratégia diversificada ficou em <strong>${posicao}º lugar</strong> entre ${total} opções.</p>
        <p>Embora não tenha sido a melhor escolha, a diversificação evitou o pior cenário. Se você tivesse concentrado em <strong>${melhorIndividual.nome}</strong>, teria ganho mais. Mas você não teria como saber isso no início.</p>
        <p>A diferença para o melhor ativo foi de ${this.formatPercent(melhorIndividual.retornoReal - estrategiaDiversificada.retornoReal)}.</p>
      `;
    } else {
      badge = '<div class="resultado-badge negativo">❌ Diversificação não foi ideal</div>';
      mensagem = `
        <p>A estratégia diversificada ficou em <strong>${posicao}º lugar</strong> entre ${total} opções.</p>
        <p>Neste período específico, concentrar em um único ativo teria sido melhor. Porém, isso só pode ser determinado olhando para o passado.</p>
        <p>Lembre-se: a diversificação protege contra o desconhecido. Escolher o melhor ativo é impossível de antemão.</p>
      `;
    }

    // Adicionar análise de volatilidade
    const volDiversificada = estrategiaDiversificada.volatilidade;
    const volMelhor = melhorIndividual.volatilidade;

    if (volDiversificada < volMelhor) {
      mensagem += `
        <p><strong>Sobre o risco:</strong> A carteira diversificada teve volatilidade de ${this.formatPercent(volDiversificada)}, enquanto ${melhorIndividual.nome} teve ${this.formatPercent(volMelhor)}. Menos volatilidade significa noites mais tranquilas.</p>
      `;
    }

    container.innerHTML = `
      <div class="conclusao-diversif">
        ${badge}
        ${mensagem}
      </div>
    `;
  },

  calcularVolatilidade(retornos) {
    if (!retornos || retornos.length === 0) return 0;
    const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const variancia = retornos.reduce((acc, r) => acc + Math.pow(r - media, 2), 0) / retornos.length;
    return Math.sqrt(variancia);
  },

  // ==========================================
  // FRENTE A FRENTE (Duelo de Ativos)
  // ==========================================

  dueloConfigs: {
    'ibov-sp500': {
      ativo1: { key: 'ibovespa', nome: 'Ibovespa', icone: '🇧🇷', cor: '#3b82f6' },
      ativo2: { key: 'sp500_brl', nome: 'S&P 500 (R$)', icone: '🇺🇸', cor: '#ef4444' },
      titulo: 'Ibovespa vs S&P 500',
      descricao: 'Bolsa brasileira contra a americana, ambas em reais'
    },
    'ouro-bitcoin': {
      ativo1: { key: 'ouro', nome: 'Ouro', icone: '🥇', cor: '#eab308' },
      ativo2: { key: 'bitcoin_brl', nome: 'Bitcoin', icone: '₿', cor: '#f7931a' },
      titulo: 'Ouro vs Bitcoin',
      descricao: 'Reserva de valor tradicional vs digital'
    },
    'ipca-tlt': {
      ativo1: { key: 'tesouro_ipca', nome: 'IPCA+', icone: '🇧🇷', cor: '#06b6d4' },
      ativo2: { key: 'tlt_brl', nome: 'TLT (R$)', icone: '🇺🇸', cor: '#0ea5e9' },
      titulo: 'IPCA+ vs TLT',
      descricao: 'Tesouro brasileiro vs Tesouro americano'
    },
    'ibov-cdi': {
      ativo1: { key: 'ibovespa', nome: 'Ibovespa', icone: '📈', cor: '#3b82f6' },
      ativo2: { key: 'cdi', nome: 'CDI', icone: '💰', cor: '#ec4899' },
      titulo: 'Ibovespa vs CDI',
      descricao: 'Renda variável contra renda fixa'
    },
    'dolar-ouro': {
      ativo1: { key: 'dolar', nome: 'Dólar', icone: '💵', cor: '#22c55e' },
      ativo2: { key: 'ouro', nome: 'Ouro', icone: '🥇', cor: '#eab308' },
      titulo: 'Dólar vs Ouro',
      descricao: 'Duas proteções cambiais clássicas'
    },
    'fii-imovel': {
      ativo1: { key: 'fii_ifix', nome: 'FIIs (IFIX)', icone: '📊', cor: '#8b5cf6' },
      ativo2: { key: 'imoveis_fipezap', nome: 'Imóveis', icone: '🏠', cor: '#14b8a6' },
      titulo: 'FII vs Imóvel Físico',
      descricao: 'Fundos imobiliários vs imóvel físico'
    }
  },

  dueloViewReal: false,
  chartDuelo: null,
  dueloResultados: null,

  iniciarDuelo() {
    const dueloSelecionado = document.querySelector('.duelo-btn.active')?.dataset.duelo || 'ibov-sp500';
    const anoInicio = parseInt(document.getElementById('anoInicioDuelo').value);
    const anoFim = parseInt(document.getElementById('anoFimDuelo').value);
    const valorInicial = this.parseCurrency(document.getElementById('valorDuelo').value) || 100000;
    const inflacaoCustom = parseFloat(document.getElementById('inflacaoDuelo').value) || 0;

    if (anoInicio >= anoFim) {
      alert('O ano inicial deve ser menor que o ano final.');
      return;
    }

    const config = this.dueloConfigs[dueloSelecionado];
    if (!config) return;

    // Filtrar dados pelo período
    const dadosPeriodo = this.dados.anos.filter(d => d.ano >= anoInicio && d.ano <= anoFim);

    if (dadosPeriodo.length === 0) {
      alert('Não há dados disponíveis para o período selecionado.');
      return;
    }

    // Calcular evolução para ambos os ativos
    const resultado1 = this.calcularEvolucaoDuelo(config.ativo1.key, dadosPeriodo, valorInicial, inflacaoCustom);
    const resultado2 = this.calcularEvolucaoDuelo(config.ativo2.key, dadosPeriodo, valorInicial, inflacaoCustom);

    // Armazenar resultados para o toggle nominal/real
    this.dueloResultados = {
      config,
      resultado1,
      resultado2,
      valorInicial,
      anoInicio,
      anoFim,
      inflacaoCustom,
      dadosPeriodo
    };

    // Mostrar resultados
    document.getElementById('resultadosDuelo').style.display = 'block';
    document.getElementById('dueloTitulo').textContent = config.titulo;

    // Renderizar componentes
    this.renderPlacarDuelo(config, resultado1, resultado2);
    this.renderChartDuelo();
    this.renderTabelaDuelo(config, resultado1, resultado2, dadosPeriodo);
    this.renderMetricasDuelo(config, resultado1, resultado2);
    this.renderConclusaoDuelo(config, resultado1, resultado2);

    // Scroll para resultados
    document.getElementById('resultadosDuelo').scrollIntoView({ behavior: 'smooth' });
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

      // Incluir dividendos para Ibovespa
      if (ativoKey === 'ibovespa' && d.ibovespa_dividendos) {
        retorno = d.ibovespa + d.ibovespa_dividendos;
      }

      if (retorno === null || retorno === undefined) {
        retorno = 0;
      }

      retornosAnuais.push(retorno);
      if (retorno > 0) anosPositivos++;

      valorNominal *= (1 + retorno / 100);
      const inflacaoAnual = inflacaoCustom > 0 ? inflacaoCustom : d.inflacao_ipca;
      inflacaoAcumulada *= (1 + inflacaoAnual / 100);

      // Calcular drawdown
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
    const volatilidade = this.calcularVolatilidade(retornosAnuais);

    return {
      evolucao,
      valorFinalNominal: valorNominal,
      valorFinalReal: valorReal,
      retornoNominal,
      retornoReal,
      mediaAnual,
      volatilidade,
      maxDrawdown,
      anosPositivos,
      totalAnos: dados.length,
      retornosAnuais
    };
  },

  renderPlacarDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('dueloPlacar');
    const vencedor1 = resultado1.retornoReal > resultado2.retornoReal;
    const diferenca = Math.abs(resultado1.valorFinalReal - resultado2.valorFinalReal);
    const diferencaPercent = Math.abs(resultado1.retornoReal - resultado2.retornoReal);

    container.innerHTML = `
      <div class="duelo-lado ${vencedor1 ? 'vencedor' : 'perdedor'}">
        <div class="lado-icone">${config.ativo1.icone}</div>
        <div class="lado-nome">${config.ativo1.nome}</div>
        <div class="lado-valor">${this.formatCurrency(resultado1.valorFinalReal)}</div>
        <div class="lado-retorno ${resultado1.retornoReal >= 0 ? 'positivo' : 'negativo'}">
          ${this.formatPercent(resultado1.retornoReal)} real
        </div>
        ${vencedor1 ? '<div class="lado-badge">Vencedor</div>' : ''}
      </div>

      <div class="duelo-centro">
        <div class="vs-text">VS</div>
        <div class="diferenca">
          Diferença: <strong>${this.formatCurrency(diferenca)}</strong><br>
          (${this.formatPercent(diferencaPercent)})
        </div>
      </div>

      <div class="duelo-lado ${!vencedor1 ? 'vencedor' : 'perdedor'}">
        <div class="lado-icone">${config.ativo2.icone}</div>
        <div class="lado-nome">${config.ativo2.nome}</div>
        <div class="lado-valor">${this.formatCurrency(resultado2.valorFinalReal)}</div>
        <div class="lado-retorno ${resultado2.retornoReal >= 0 ? 'positivo' : 'negativo'}">
          ${this.formatPercent(resultado2.retornoReal)} real
        </div>
        ${!vencedor1 ? '<div class="lado-badge">Vencedor</div>' : ''}
      </div>
    `;
  },

  renderChartDuelo() {
    if (!this.dueloResultados) return;

    const { config, resultado1, resultado2 } = this.dueloResultados;
    const ctx = document.getElementById('chartDuelo');
    const useReal = this.dueloViewReal;

    const labels = resultado1.evolucao.map(e => e.ano);
    const data1 = resultado1.evolucao.map(e => useReal ? e.real : e.nominal);
    const data2 = resultado2.evolucao.map(e => useReal ? e.real : e.nominal);

    if (this.chartDuelo) {
      this.chartDuelo.destroy();
    }

    this.chartDuelo = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: config.ativo1.nome,
            data: data1,
            borderColor: config.ativo1.cor,
            backgroundColor: config.ativo1.cor + '20',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: config.ativo2.nome,
            data: data2,
            borderColor: config.ativo2.cor,
            backgroundColor: config.ativo2.cor + '20',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8b949e',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#1c2128',
            titleColor: '#f0f6fc',
            bodyColor: '#8b949e',
            borderColor: '#30363d',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.y)}`
            }
          },
          title: {
            display: true,
            text: useReal ? 'Valor Real (descontada inflação)' : 'Valor Nominal',
            color: '#8b949e',
            font: { size: 14 }
          }
        },
        scales: {
          x: {
            grid: { color: '#30363d' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: '#30363d' },
            ticks: {
              color: '#8b949e',
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  },

  atualizarChartDuelo() {
    this.renderChartDuelo();
  },

  renderTabelaDuelo(config, resultado1, resultado2, dadosPeriodo) {
    const tabela = document.getElementById('tabelaDuelo');
    const thead = tabela.querySelector('thead');
    const tbody = tabela.querySelector('tbody');

    thead.innerHTML = `
      <tr>
        <th>Ano</th>
        <th>${config.ativo1.nome}</th>
        <th>${config.ativo2.nome}</th>
        <th>Inflação (IPCA)</th>
        <th>Vencedor do Ano</th>
      </tr>
    `;

    let html = '';
    dadosPeriodo.forEach((d, i) => {
      const retorno1 = resultado1.retornosAnuais[i];
      const retorno2 = resultado2.retornosAnuais[i];
      const vencedorAno = retorno1 > retorno2 ? config.ativo1.nome :
                         retorno2 > retorno1 ? config.ativo2.nome : 'Empate';

      html += `
        <tr>
          <td>${d.ano}</td>
          <td class="${retorno1 >= 0 ? 'valor-positivo' : 'valor-negativo'}">
            ${this.formatPercent(retorno1)}
          </td>
          <td class="${retorno2 >= 0 ? 'valor-positivo' : 'valor-negativo'}">
            ${this.formatPercent(retorno2)}
          </td>
          <td>${this.formatPercent(d.inflacao_ipca)}</td>
          <td class="${vencedorAno === config.ativo1.nome ? 'ano-vencedor' : vencedorAno === config.ativo2.nome ? 'ano-vencedor' : ''}">
            ${vencedorAno}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  renderMetricasDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('metricasDuelo');

    container.innerHTML = `
      <div class="metrica-card">
        <h4>Retorno Total</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor ${resultado1.retornoNominal >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado1.retornoNominal)}
            </div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor ${resultado2.retornoNominal >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado2.retornoNominal)}
            </div>
          </div>
        </div>
      </div>

      <div class="metrica-card">
        <h4>Retorno Real (após inflação)</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor ${resultado1.retornoReal >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado1.retornoReal)}
            </div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor ${resultado2.retornoReal >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado2.retornoReal)}
            </div>
          </div>
        </div>
      </div>

      <div class="metrica-card">
        <h4>Média Anual</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor ${resultado1.mediaAnual >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado1.mediaAnual)}
            </div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor ${resultado2.mediaAnual >= 0 ? 'positivo' : 'negativo'}">
              ${this.formatPercent(resultado2.mediaAnual)}
            </div>
          </div>
        </div>
      </div>

      <div class="metrica-card">
        <h4>Volatilidade (Risco)</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor">${this.formatPercent(resultado1.volatilidade)}</div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor">${this.formatPercent(resultado2.volatilidade)}</div>
          </div>
        </div>
      </div>

      <div class="metrica-card">
        <h4>Max Drawdown (Maior Queda)</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor negativo">-${this.formatPercent(resultado1.maxDrawdown)}</div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor negativo">-${this.formatPercent(resultado2.maxDrawdown)}</div>
          </div>
        </div>
      </div>

      <div class="metrica-card">
        <h4>Anos Positivos</h4>
        <div class="metrica-grid">
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo1.nome}</div>
            <div class="metrica-valor">${resultado1.anosPositivos}/${resultado1.totalAnos}</div>
          </div>
          <div class="metrica-item">
            <div class="metrica-nome">${config.ativo2.nome}</div>
            <div class="metrica-valor">${resultado2.anosPositivos}/${resultado2.totalAnos}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderConclusaoDuelo(config, resultado1, resultado2) {
    const container = document.getElementById('conclusaoDuelo');
    const vencedor = resultado1.retornoReal > resultado2.retornoReal ? config.ativo1 : config.ativo2;
    const perdedor = resultado1.retornoReal > resultado2.retornoReal ? config.ativo2 : config.ativo1;
    const resVencedor = resultado1.retornoReal > resultado2.retornoReal ? resultado1 : resultado2;
    const resPerdedor = resultado1.retornoReal > resultado2.retornoReal ? resultado2 : resultado1;

    const diferenca = Math.abs(resultado1.retornoReal - resultado2.retornoReal);
    const diferencaValor = Math.abs(resultado1.valorFinalReal - resultado2.valorFinalReal);

    // Contagem de vitórias anuais
    let vitorias1 = 0, vitorias2 = 0;
    resultado1.retornosAnuais.forEach((r, i) => {
      if (r > resultado2.retornosAnuais[i]) vitorias1++;
      else if (r < resultado2.retornosAnuais[i]) vitorias2++;
    });

    const vitoriasMelhor = resultado1.retornoReal > resultado2.retornoReal ? vitorias1 : vitorias2;
    const vitoriasPior = resultado1.retornoReal > resultado2.retornoReal ? vitorias2 : vitorias1;

    // Análise de risco-retorno
    const sharpe1 = resultado1.volatilidade > 0 ? resultado1.retornoReal / resultado1.volatilidade : 0;
    const sharpe2 = resultado2.volatilidade > 0 ? resultado2.retornoReal / resultado2.volatilidade : 0;
    const melhorRiscoRetorno = sharpe1 > sharpe2 ? config.ativo1.nome : config.ativo2.nome;

    let analiseExtra = '';

    // Análise específica por tipo de duelo
    if (config.ativo1.key === 'ibovespa' && config.ativo2.key === 'sp500_brl') {
      analiseExtra = `<p><strong>Contexto:</strong> A comparação inclui o efeito cambial, já que o S&P 500 está convertido para reais. Em períodos de desvalorização do real, o S&P 500 tende a se beneficiar duplamente: pela valorização das ações americanas e pela alta do dólar.</p>`;
    } else if (config.ativo1.key === 'ouro' && config.ativo2.key === 'bitcoin_brl') {
      analiseExtra = `<p><strong>Contexto:</strong> O ouro é um ativo milenar com volatilidade moderada, enquanto o Bitcoin é um ativo jovem com volatilidade extrema. A comparação histórica é limitada pela existência recente do Bitcoin em reais (desde 2011).</p>`;
    } else if (config.ativo1.key === 'tesouro_ipca' && config.ativo2.key === 'tlt_brl') {
      analiseExtra = `<p><strong>Contexto:</strong> O Tesouro IPCA+ protege contra a inflação brasileira, enquanto o TLT (ETF de títulos longos americanos) está exposto ao risco de juros dos EUA e à variação cambial.</p>`;
    } else if (config.ativo1.key === 'ibovespa' && config.ativo2.key === 'cdi') {
      analiseExtra = `<p><strong>Contexto:</strong> Este é o clássico debate brasileiro: vale a pena o risco da bolsa quando o CDI paga tão bem? Historicamente, o Brasil tem juros altos, o que torna essa comparação particularmente relevante.</p>`;
    } else if (config.ativo1.key === 'fii_ifix' && config.ativo2.key === 'imoveis_fipezap') {
      analiseExtra = `<p><strong>Contexto:</strong> Os FIIs oferecem liquidez e diversificação, mas podem ser mais voláteis. O imóvel físico tem custos adicionais (IPTU, manutenção, vacância) não totalmente capturados pelo índice FipeZap.</p>`;
    }

    container.innerHTML = `
      <div class="vencedor-badge">🏆 ${vencedor.nome} venceu o duelo!</div>

      <p>No período analisado, <strong>${vencedor.nome}</strong> gerou um retorno real de <strong>${this.formatPercent(resVencedor.retornoReal)}</strong>, superando <strong>${perdedor.nome}</strong> que rendeu <strong>${this.formatPercent(resPerdedor.retornoReal)}</strong>.</p>

      <p>A diferença final foi de <strong>${this.formatCurrency(diferencaValor)}</strong> em valor real, ou ${this.formatPercent(diferenca)} em retorno.</p>

      <p>Ano a ano, <strong>${vencedor.nome}</strong> venceu em ${vitoriasMelhor} dos ${resultado1.totalAnos} anos, enquanto <strong>${perdedor.nome}</strong> venceu em ${vitoriasPior} anos.</p>

      <p><strong>Sobre o risco:</strong> ${config.ativo1.nome} teve volatilidade de ${this.formatPercent(resultado1.volatilidade)} e drawdown máximo de ${this.formatPercent(resultado1.maxDrawdown)}. ${config.ativo2.nome} teve volatilidade de ${this.formatPercent(resultado2.volatilidade)} e drawdown máximo de ${this.formatPercent(resultado2.maxDrawdown)}. Considerando risco e retorno, <strong>${melhorRiscoRetorno}</strong> teve a melhor relação.</p>

      ${analiseExtra}

      <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.9rem;">
        <strong>Lembre-se:</strong> Resultados passados não garantem resultados futuros. Esta análise é apenas para fins educacionais e não constitui recomendação de investimento.
      </p>
    `;
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Comparador.init();
  // Inicializar módulo de diversificação após dados carregados
  setTimeout(() => {
    if (document.getElementById('alocacaoGrid')) {
      Comparador.initDiversificacao();
    }
  }, 500);
});
