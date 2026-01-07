/**
 * Comparador Brutal de Investimentos
 * Rico aos Poucos
 */

const Comparador = {
  dados: null,
  currentTab: 'historico',
  chartColors: {
    ibovespa: '#3b82f6',
    dolar: '#22c55e',
    ouro: '#eab308',
    fii_ifix: '#8b5cf6',
    tesouro_ipca: '#06b6d4',
    poupanca: '#f97316',
    cdi: '#ec4899',
    sp500_brl: '#ef4444',
    imoveis_fipezap: '#14b8a6'
  },
  assetNames: {
    ibovespa: 'Ibovespa',
    dolar: 'Dólar',
    ouro: 'Ouro',
    fii_ifix: 'FIIs (IFIX)',
    tesouro_ipca: 'Tesouro IPCA+',
    poupanca: 'Poupança',
    cdi: 'CDI',
    sp500_brl: 'S&P 500 (R$)',
    imoveis_fipezap: 'Imóveis'
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

    // Conclusão 4: Poupança
    if (resultados.poupanca && resultados.poupanca.retornoReal < 0) {
      conclusoes.push({
        tipo: 'error',
        icon: '💸',
        texto: `A <strong>poupança perdeu poder de compra</strong> no período. Quem deixou dinheiro lá ficou mais pobre em termos reais.`
      });
    }

    // Conclusão 5: Renda variável vs fixa
    const rv = ranking.filter(r => ['ibovespa', 'fii_ifix', 'sp500_brl'].includes(r.ativo));
    const rf = ranking.filter(r => ['cdi', 'tesouro_ipca', 'poupanca'].includes(r.ativo));
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
  // DIVERSIFICAÇÃO
  // ==========================================
  simularDiversificacao() {
    const periodo = parseInt(document.getElementById('periodoDiversif').value);
    const valorInicial = this.parseCurrency(document.getElementById('valorDiversif').value) || 100000;
    const rebalanceamento = document.getElementById('rebalanceamento').value;

    const checkboxes = document.querySelectorAll('.estrategia-checkbox input:checked');
    const estrategiasSelecionadas = Array.from(checkboxes).map(cb => cb.value);

    if (estrategiasSelecionadas.length === 0) {
      alert('Selecione pelo menos uma estratégia.');
      return;
    }

    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - periodo;
    const dadosFiltrados = this.dados.anos.filter(d => d.ano > anoInicio && d.ano <= anoAtual);

    const resultados = {};
    const estrategiasConfig = {
      '100_acoes': { nome: '100% Ações', alocacao: { ibovespa: 100 } },
      '100_rf': { nome: '100% Renda Fixa', alocacao: { cdi: 100 } },
      '60_40': { nome: '60/40', alocacao: { ibovespa: 60, cdi: 40 } },
      'diversificada': { nome: 'Diversificada', alocacao: { ibovespa: 30, cdi: 25, fii_ifix: 20, dolar: 15, ouro: 10 } }
    };

    estrategiasSelecionadas.forEach(est => {
      const config = estrategiasConfig[est];
      resultados[est] = this.simularEstrategia(config, dadosFiltrados, valorInicial, rebalanceamento);
    });

    document.getElementById('resultadosDiversif').style.display = 'block';
    this.renderChartDiversif(resultados, dadosFiltrados);
    this.renderMetricasDiversif(resultados, estrategiasConfig);
    this.renderRankingDiversif(resultados, estrategiasConfig);
    this.renderConclusoesDiversif(resultados, estrategiasConfig);

    document.getElementById('resultadosDiversif').scrollIntoView({ behavior: 'smooth' });
  },

  simularEstrategia(config, dados, valorInicial, rebalanceamento) {
    const evolucao = [{ ano: dados[0].ano - 1, valor: valorInicial }];
    let valor = valorInicial;
    let inflacaoAcumulada = 1;
    let maxDrawdown = 0;
    let peakValue = valorInicial;
    const retornosAnuais = [];

    dados.forEach((d, index) => {
      let retornoAno = 0;

      Object.entries(config.alocacao).forEach(([ativo, peso]) => {
        let retorno = d[ativo];
        if (ativo === 'ibovespa' && d.ibovespa_dividendos) {
          retorno = d.ibovespa + d.ibovespa_dividendos;
        }
        if (retorno !== null && retorno !== undefined) {
          retornoAno += (retorno * peso / 100);
        }
      });

      valor *= (1 + retornoAno / 100);
      retornosAnuais.push(retornoAno);
      inflacaoAcumulada *= (1 + d.inflacao_ipca / 100);

      // Calcular drawdown
      if (valor > peakValue) peakValue = valor;
      const drawdown = (peakValue - valor) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      evolucao.push({ ano: d.ano, valor });
    });

    const retornoNominal = ((valor / valorInicial) - 1) * 100;
    const retornoReal = ((valor / inflacaoAcumulada / valorInicial) - 1) * 100;
    const volatilidade = this.calcularVolatilidade(retornosAnuais);

    return {
      evolucao,
      valorFinal: valor,
      valorReal: valor / inflacaoAcumulada,
      retornoNominal,
      retornoReal,
      volatilidade,
      maxDrawdown,
      sharpe: volatilidade > 0 ? retornoReal / volatilidade : 0
    };
  },

  calcularVolatilidade(retornos) {
    const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const variancia = retornos.reduce((acc, r) => acc + Math.pow(r - media, 2), 0) / retornos.length;
    return Math.sqrt(variancia);
  },

  renderChartDiversif(resultados, dados) {
    const container = document.getElementById('chartDiversif');
    const width = container.clientWidth;
    const height = 400;
    const padding = { top: 20, right: 140, bottom: 40, left: 80 };

    let maxVal = 0;
    Object.values(resultados).forEach(r => {
      r.evolucao.forEach(e => {
        if (e.valor > maxVal) maxVal = e.valor;
      });
    });

    const cores = {
      '100_acoes': '#3b82f6',
      '100_rf': '#22c55e',
      '60_40': '#f97316',
      'diversificada': '#8b5cf6'
    };

    const nomes = {
      '100_acoes': '100% Ações',
      '100_rf': '100% RF',
      '60_40': '60/40',
      'diversificada': 'Diversificada'
    };

    const anos = resultados[Object.keys(resultados)[0]].evolucao.map(e => e.ano);
    const xScale = (i) => padding.left + (i / (anos.length - 1)) * (width - padding.left - padding.right);
    const yScale = (val) => height - padding.bottom - (val / (maxVal * 1.1)) * (height - padding.top - padding.bottom);

    let svg = `<svg width="${width}" height="${height}" class="chart-svg">`;

    // Grid
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * (height - padding.top - padding.bottom);
      const val = maxVal * 1.1 * (1 - i / 5);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#333" stroke-dasharray="3,3" opacity="0.3"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#888" font-size="10">${this.formatCurrency(val).replace('R$', '')}</text>`;
    }

    // Linhas
    Object.entries(resultados).forEach(([est, data]) => {
      const cor = cores[est];
      let path = '';

      data.evolucao.forEach((e, i) => {
        const x = xScale(i);
        const y = yScale(e.valor);
        path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });

      svg += `<path d="${path}" stroke="${cor}" stroke-width="2.5" fill="none"/>`;

      const lastY = yScale(data.evolucao[data.evolucao.length - 1].valor);
      svg += `<circle cx="${xScale(anos.length - 1)}" cy="${lastY}" r="4" fill="${cor}"/>`;
      svg += `<text x="${xScale(anos.length - 1) + 8}" y="${lastY + 4}" fill="${cor}" font-size="11" font-weight="600">${nomes[est]}</text>`;
    });

    // X axis
    anos.forEach((ano, i) => {
      if (i % 2 === 0 || anos.length <= 6) {
        svg += `<text x="${xScale(i)}" y="${height - 10}" text-anchor="middle" fill="#888" font-size="11">${ano}</text>`;
      }
    });

    svg += '</svg>';
    container.innerHTML = svg;
  },

  renderMetricasDiversif(resultados, configs) {
    const container = document.getElementById('metricasGrid');

    let html = '<div class="metricas-table">';
    html += `
      <div class="metricas-header">
        <span>Estratégia</span>
        <span>Retorno Real</span>
        <span>Volatilidade</span>
        <span>Max Drawdown</span>
        <span>Sharpe</span>
      </div>
    `;

    Object.entries(resultados).forEach(([est, data]) => {
      const nome = configs[est]?.nome || est;
      html += `
        <div class="metricas-row">
          <span class="estrategia-nome">${nome}</span>
          <span class="${data.retornoReal >= 0 ? 'text-green' : 'text-red'}">${this.formatPercent(data.retornoReal)}</span>
          <span>${this.formatPercent(data.volatilidade)}</span>
          <span class="text-red">-${this.formatPercent(data.maxDrawdown)}</span>
          <span>${data.sharpe.toFixed(2)}</span>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  renderRankingDiversif(resultados, configs) {
    const container = document.getElementById('rankingDiversif');

    const ranking = Object.entries(resultados)
      .map(([est, data]) => ({ est, nome: configs[est]?.nome || est, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    let html = '';
    ranking.forEach((item, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      html += `
        <div class="ranking-item ${item.retornoReal >= 0 ? 'positive' : 'negative'}">
          <div class="ranking-position">${medal || (index + 1)}</div>
          <div class="ranking-asset">
            <span class="asset-name">${item.nome}</span>
          </div>
          <div class="ranking-values">
            <div class="ranking-real">
              <small>Retorno Real</small>
              <span class="${item.retornoReal >= 0 ? 'text-green' : 'text-red'}">${this.formatPercent(item.retornoReal)}</span>
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

  renderConclusoesDiversif(resultados, configs) {
    const container = document.getElementById('conclusoesDiversif');
    const conclusoes = [];

    const ranking = Object.entries(resultados)
      .map(([est, data]) => ({ est, nome: configs[est]?.nome || est, ...data }))
      .sort((a, b) => b.retornoReal - a.retornoReal);

    // Vencedor
    const vencedor = ranking[0];
    conclusoes.push({
      tipo: 'success',
      icon: '🏆',
      texto: `<strong>${vencedor.nome}</strong> foi a estratégia vencedora com ${this.formatPercent(vencedor.retornoReal)} de retorno real.`
    });

    // Diversificação vs concentração
    const diversificada = resultados.diversificada;
    const acoes100 = resultados['100_acoes'];

    if (diversificada && acoes100) {
      if (diversificada.volatilidade < acoes100.volatilidade) {
        const reducaoVol = ((acoes100.volatilidade - diversificada.volatilidade) / acoes100.volatilidade * 100).toFixed(0);
        conclusoes.push({
          tipo: 'info',
          icon: '📊',
          texto: `A diversificação reduziu a <strong>volatilidade em ${reducaoVol}%</strong> comparado a 100% em ações.`
        });
      }

      if (diversificada.maxDrawdown < acoes100.maxDrawdown) {
        conclusoes.push({
          tipo: 'success',
          icon: '🛡️',
          texto: `Diversificar <strong>protegeu nas quedas</strong>: drawdown máximo de ${this.formatPercent(diversificada.maxDrawdown)} vs ${this.formatPercent(acoes100.maxDrawdown)}.`
        });
      }
    }

    // RF vs RV
    const rf100 = resultados['100_rf'];
    if (rf100 && acoes100) {
      if (rf100.retornoReal > acoes100.retornoReal) {
        conclusoes.push({
          tipo: 'warning',
          icon: '⚠️',
          texto: `Neste período, <strong>renda fixa superou ações</strong>. Nem sempre mais risco significa mais retorno.`
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
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Comparador.init();
});
