/**
 * Calculadora de Investimentos com Ajuste Inflacionário
 * Rico aos Poucos
 */

const Calculadora = {
  // Configurações padrão
  defaults: {
    objetivo: 300000,
    tempoAnos: 10,
    aporteMensal: 1000,
    valorInicial: 0, // Valor que já possui
    rentabilidadeMensal: 1.0, // % ao mês
    inflacaoAnual: 7.0 // % ao ano
  },

  // Traduções
  translations: {
    'pt-BR': {
      mode1Title: 'Quanto preciso investir por mês?',
      mode1Desc: 'Descubra o aporte mensal necessário',
      mode2Title: 'Quanto vou acumular?',
      mode2Desc: 'Descubra quanto terá no futuro',
      mode3Title: 'Quanto tempo irá levar?',
      mode3Desc: 'Descubra o prazo para atingir seu objetivo',
      mode4Title: 'Independência Financeira',
      mode4Desc: 'Quando poderei viver de renda?',
      goalLabel: 'Objetivo (valor em reais de hoje)',
      goalPlaceholder: 'Ex: 300000',
      timeLabel: 'Tempo de investimento',
      years: 'anos',
      months: 'meses',
      monthlyLabel: 'Aporte mensal inicial',
      monthlyPlaceholder: 'Ex: 1000',
      initialLabel: 'Valor inicial (já possui)',
      initialPlaceholder: 'Ex: 10000',
      returnLabel: 'Rentabilidade mensal',
      returnPlaceholder: 'Ex: 1.0',
      inflationLabel: 'Inflação anual estimada',
      inflationLink: 'O que é inflação?',
      calculate: 'Calcular',
      resultTitle: 'Resultado',
      monthlyNeeded: 'Aporte mensal inicial necessário',
      monthlyNeededNote: 'Reajustado mensalmente pela inflação',
      finalAmount: 'Montante final (nominal)',
      realValue: 'Valor equivalente hoje',
      realValueNote: 'Poder de compra em valores de hoje',
      totalInvested: 'Total investido',
      totalReturn: 'Rendimento total',
      timeNeeded: 'Tempo necessário',
      timeNeededNote: 'Para atingir seu objetivo com ajuste inflacionário',
      inflationNote: 'Aportes começam em {valor} e são reajustados pela inflação de {inflacao}% ao ano. No último mês, será aproximadamente {valorFinal}.',
      goalNote: 'Seu objetivo de {objetivo} em valores de hoje equivale a {objetivoAjustado} em {anos} anos.',
      projectionTitle: 'Projeção ano a ano',
      yearCol: 'Ano',
      balanceCol: 'Saldo',
      monthlyCol: 'Aporte/mês',
      realCol: 'Valor real',
      and: 'e',
      // Mode 4 - Financial Independence
      passiveIncomeLabel: 'Renda passiva mensal desejada (valores de hoje)',
      passiveIncomePlaceholder: 'Ex: 5000',
      fiResultTitle: 'Independência Financeira',
      fiTimeNeeded: 'Tempo para independência financeira',
      fiCapitalNeeded: 'Capital necessário',
      fiCapitalNeededNote: 'Para gerar a renda desejada com a rentabilidade informada',
      fiPassiveIncome: 'Renda passiva mensal',
      fiPassiveIncomeNote: 'Valor em reais de hoje',
      fiCapitalAdjusted: 'Capital ajustado (nominal)',
      fiCapitalAdjustedNote: 'Considerando inflação no período',
      fiMarginTitle: 'Simulação com margem de segurança (+30%)',
      fiMarginNote: 'Para imprevistos, reinvestimento e crescimento patrimonial',
      fiMarginIncome: 'Renda com margem',
      fiMarginCapital: 'Capital necessário',
      fiMarginTime: 'Tempo necessário',
      fiNeverReach: 'Com os parâmetros atuais, a independência financeira não será atingida em 50 anos. Aumente o aporte ou reduza a renda desejada.',
      perMonth: '/mês',
      // Mode 5 - Historical Portfolio
      mode5Title: 'Carteira Histórica',
      mode5Desc: 'Simule com retornos reais do passado',
      portfolioTitle: 'Monte sua Carteira',
      portfolioDesc: 'Defina a alocação de cada ativo (total deve ser 100%)',
      periodLabel: 'Período histórico',
      periodStart: 'Início',
      periodEnd: 'Fim',
      allocationTotal: 'Total',
      portfolioSimulate: 'Simular Carteira',
      portfolioResult: 'Resultado da Simulação Histórica',
      portfolioNote: 'Simulação baseada em dados reais de {periodo}',
      portfolioFinalNominal: 'Valor final (nominal)',
      portfolioFinalReal: 'Valor final (real)',
      portfolioTotalInvested: 'Total investido',
      portfolioTotalReturn: 'Retorno total',
      portfolioReturnReal: 'Retorno real',
      portfolioMonthlyAvg: 'Retorno médio mensal',
      portfolioVolatility: 'Volatilidade mensal',
      portfolioMaxDrawdown: 'Máxima queda',
      portfolioProjection: 'Evolução mês a mês',
      portfolioMonth: 'Mês',
      portfolioContribution: 'Aporte',
      portfolioBalance: 'Saldo',
      portfolioRealValue: 'Valor real',
      portfolioReturn: 'Retorno',
      portfolioLoadingData: 'Carregando dados históricos...',
      portfolioNoData: 'Não há dados disponíveis para o período selecionado.',
      portfolioInvalidAlloc: 'A alocação total deve ser 100%'
    },
    'en': {
      mode1Title: 'How much to invest monthly?',
      mode1Desc: 'Find the required monthly contribution',
      mode2Title: 'How much will I accumulate?',
      mode2Desc: 'Find out your future amount',
      mode3Title: 'How long will it take?',
      mode3Desc: 'Find the time to reach your goal',
      mode4Title: 'Financial Independence',
      mode4Desc: 'When can I live off investments?',
      goalLabel: 'Goal (value in today\'s dollars)',
      goalPlaceholder: 'Ex: 300000',
      timeLabel: 'Investment time',
      years: 'years',
      months: 'months',
      monthlyLabel: 'Initial monthly contribution',
      monthlyPlaceholder: 'Ex: 1000',
      initialLabel: 'Initial amount (already have)',
      initialPlaceholder: 'Ex: 10000',
      returnLabel: 'Monthly return',
      returnPlaceholder: 'Ex: 1.0',
      inflationLabel: 'Estimated annual inflation',
      inflationLink: 'What is inflation?',
      calculate: 'Calculate',
      resultTitle: 'Result',
      monthlyNeeded: 'Required initial monthly contribution',
      monthlyNeededNote: 'Adjusted monthly for inflation',
      finalAmount: 'Final amount (nominal)',
      realValue: 'Equivalent value today',
      realValueNote: 'Purchasing power in today\'s values',
      totalInvested: 'Total invested',
      totalReturn: 'Total return',
      timeNeeded: 'Time needed',
      timeNeededNote: 'To reach your goal with inflation adjustment',
      inflationNote: 'Contributions start at {valor} and are adjusted for inflation of {inflacao}% per year. In the last month, it will be approximately {valorFinal}.',
      goalNote: 'Your goal of {objetivo} in today\'s values equals {objetivoAjustado} in {anos} years.',
      projectionTitle: 'Year by year projection',
      yearCol: 'Year',
      balanceCol: 'Balance',
      monthlyCol: 'Monthly',
      realCol: 'Real value',
      and: 'and',
      // Mode 4 - Financial Independence
      passiveIncomeLabel: 'Desired monthly passive income (today\'s values)',
      passiveIncomePlaceholder: 'Ex: 5000',
      fiResultTitle: 'Financial Independence',
      fiTimeNeeded: 'Time to financial independence',
      fiCapitalNeeded: 'Required capital',
      fiCapitalNeededNote: 'To generate desired income with the informed return rate',
      fiPassiveIncome: 'Monthly passive income',
      fiPassiveIncomeNote: 'Value in today\'s dollars',
      fiCapitalAdjusted: 'Adjusted capital (nominal)',
      fiCapitalAdjustedNote: 'Considering inflation over the period',
      fiMarginTitle: 'Simulation with safety margin (+30%)',
      fiMarginNote: 'For emergencies, reinvestment and wealth growth',
      fiMarginIncome: 'Income with margin',
      fiMarginCapital: 'Required capital',
      fiMarginTime: 'Time needed',
      fiNeverReach: 'With current parameters, financial independence won\'t be reached in 50 years. Increase contribution or reduce desired income.',
      perMonth: '/month',
      // Mode 5 - Historical Portfolio
      mode5Title: 'Historical Portfolio',
      mode5Desc: 'Simulate with real past returns',
      portfolioTitle: 'Build Your Portfolio',
      portfolioDesc: 'Set allocation for each asset (total must be 100%)',
      periodLabel: 'Historical period',
      periodStart: 'Start',
      periodEnd: 'End',
      allocationTotal: 'Total',
      portfolioSimulate: 'Simulate Portfolio',
      portfolioResult: 'Historical Simulation Result',
      portfolioNote: 'Simulation based on real data from {periodo}',
      portfolioFinalNominal: 'Final value (nominal)',
      portfolioFinalReal: 'Final value (real)',
      portfolioTotalInvested: 'Total invested',
      portfolioTotalReturn: 'Total return',
      portfolioReturnReal: 'Real return',
      portfolioMonthlyAvg: 'Average monthly return',
      portfolioVolatility: 'Monthly volatility',
      portfolioMaxDrawdown: 'Maximum drawdown',
      portfolioProjection: 'Month by month evolution',
      portfolioMonth: 'Month',
      portfolioContribution: 'Contribution',
      portfolioBalance: 'Balance',
      portfolioRealValue: 'Real value',
      portfolioReturn: 'Return',
      portfolioLoadingData: 'Loading historical data...',
      portfolioNoData: 'No data available for the selected period.',
      portfolioInvalidAlloc: 'Total allocation must be 100%'
    },
    'es': {
      mode1Title: '¿Cuánto invertir mensualmente?',
      mode1Desc: 'Descubre el aporte mensual necesario',
      mode2Title: '¿Cuánto voy a acumular?',
      mode2Desc: 'Descubre cuánto tendrás en el futuro',
      mode3Title: '¿Cuánto tiempo llevará?',
      mode3Desc: 'Descubre el plazo para alcanzar tu objetivo',
      mode4Title: 'Independencia Financiera',
      mode4Desc: '¿Cuándo podré vivir de rentas?',
      goalLabel: 'Objetivo (valor en pesos de hoy)',
      goalPlaceholder: 'Ej: 300000',
      timeLabel: 'Tiempo de inversión',
      years: 'años',
      months: 'meses',
      monthlyLabel: 'Aporte mensual inicial',
      monthlyPlaceholder: 'Ej: 1000',
      initialLabel: 'Valor inicial (ya tienes)',
      initialPlaceholder: 'Ej: 10000',
      returnLabel: 'Rentabilidad mensual',
      returnPlaceholder: 'Ej: 1.0',
      inflationLabel: 'Inflación anual estimada',
      inflationLink: '¿Qué es la inflación?',
      calculate: 'Calcular',
      resultTitle: 'Resultado',
      monthlyNeeded: 'Aporte mensual inicial necesario',
      monthlyNeededNote: 'Ajustado mensualmente por la inflación',
      finalAmount: 'Monto final (nominal)',
      realValue: 'Valor equivalente hoy',
      realValueNote: 'Poder adquisitivo en valores de hoy',
      totalInvested: 'Total invertido',
      totalReturn: 'Rendimiento total',
      timeNeeded: 'Tiempo necesario',
      timeNeededNote: 'Para alcanzar tu objetivo con ajuste inflacionario',
      inflationNote: 'Aportes comienzan en {valor} y se ajustan por inflación de {inflacao}% anual. En el último mes, será aproximadamente {valorFinal}.',
      goalNote: 'Tu objetivo de {objetivo} en valores de hoy equivale a {objetivoAjustado} en {anos} años.',
      projectionTitle: 'Proyección año a año',
      yearCol: 'Año',
      balanceCol: 'Saldo',
      monthlyCol: 'Aporte/mes',
      realCol: 'Valor real',
      and: 'y',
      // Mode 4 - Financial Independence
      passiveIncomeLabel: 'Ingreso pasivo mensual deseado (valores de hoy)',
      passiveIncomePlaceholder: 'Ej: 5000',
      fiResultTitle: 'Independencia Financiera',
      fiTimeNeeded: 'Tiempo para independencia financiera',
      fiCapitalNeeded: 'Capital necesario',
      fiCapitalNeededNote: 'Para generar el ingreso deseado con la rentabilidad informada',
      fiPassiveIncome: 'Ingreso pasivo mensual',
      fiPassiveIncomeNote: 'Valor en pesos de hoy',
      fiCapitalAdjusted: 'Capital ajustado (nominal)',
      fiCapitalAdjustedNote: 'Considerando inflación en el período',
      fiMarginTitle: 'Simulación con margen de seguridad (+30%)',
      fiMarginNote: 'Para imprevistos, reinversión y crecimiento patrimonial',
      fiMarginIncome: 'Ingreso con margen',
      fiMarginCapital: 'Capital necesario',
      fiMarginTime: 'Tiempo necesario',
      fiNeverReach: 'Con los parámetros actuales, la independencia financiera no se alcanzará en 50 años. Aumente el aporte o reduzca el ingreso deseado.',
      perMonth: '/mes',
      // Mode 5 - Historical Portfolio
      mode5Title: 'Cartera Histórica',
      mode5Desc: 'Simula con retornos reales del pasado',
      portfolioTitle: 'Arma tu Cartera',
      portfolioDesc: 'Define la asignación de cada activo (total debe ser 100%)',
      periodLabel: 'Período histórico',
      periodStart: 'Inicio',
      periodEnd: 'Fin',
      allocationTotal: 'Total',
      portfolioSimulate: 'Simular Cartera',
      portfolioResult: 'Resultado de Simulación Histórica',
      portfolioNote: 'Simulación basada en datos reales de {periodo}',
      portfolioFinalNominal: 'Valor final (nominal)',
      portfolioFinalReal: 'Valor final (real)',
      portfolioTotalInvested: 'Total invertido',
      portfolioTotalReturn: 'Retorno total',
      portfolioReturnReal: 'Retorno real',
      portfolioMonthlyAvg: 'Retorno promedio mensual',
      portfolioVolatility: 'Volatilidad mensual',
      portfolioMaxDrawdown: 'Máxima caída',
      portfolioProjection: 'Evolución mes a mes',
      portfolioMonth: 'Mes',
      portfolioContribution: 'Aporte',
      portfolioBalance: 'Saldo',
      portfolioRealValue: 'Valor real',
      portfolioReturn: 'Retorno',
      portfolioLoadingData: 'Cargando datos históricos...',
      portfolioNoData: 'No hay datos disponibles para el período seleccionado.',
      portfolioInvalidAlloc: 'La asignación total debe ser 100%'
    }
  },

  currentLang: 'pt-BR',
  currentMode: 1, // 1 = aporte, 2 = montante, 3 = tempo

  init() {
    this.detectLanguage();
    this.renderCalculator();
    this.bindEvents();
  },

  detectLanguage() {
    const path = window.location.pathname;
    if (path.includes('/en/')) {
      this.currentLang = 'en';
    } else if (path.includes('/es/')) {
      this.currentLang = 'es';
    } else {
      this.currentLang = 'pt-BR';
    }
  },

  t(key) {
    return this.translations[this.currentLang][key] || key;
  },

  formatCurrency(value) {
    const lang = this.currentLang;
    const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
    const currency = lang === 'en' ? 'USD' : lang === 'es' ? 'USD' : 'BRL';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },

  formatNumber(value) {
    const lang = this.currentLang;
    const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },

  formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  },

  // Máscara para campos monetários (formato brasileiro: 1.234,56)
  maskCurrency(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value;

      // Remove tudo que não é dígito
      value = value.replace(/\D/g, '');

      // Se vazio, deixa vazio
      if (value === '') {
        e.target.value = '';
        return;
      }

      // Converte para número (centavos)
      let numValue = parseInt(value, 10);

      // Formata com 2 casas decimais
      let formatted = (numValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      e.target.value = formatted;
    });

    // Formatar valor inicial se existir
    if (input.value && input.value !== '0') {
      const numValue = parseFloat(input.value);
      if (!isNaN(numValue) && numValue > 0) {
        input.value = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } else {
        input.value = '';
      }
    } else {
      input.value = '';
    }
  },

  // Máscara para campos de porcentagem (formato: 7,00)
  maskPercentage(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value;

      // Remove tudo que não é dígito
      value = value.replace(/\D/g, '');

      // Se vazio, deixa vazio
      if (value === '') {
        e.target.value = '';
        return;
      }

      // Converte para número (centésimos)
      let numValue = parseInt(value, 10);

      // Limita a 9999 (99,99%)
      if (numValue > 9999) numValue = 9999;

      // Formata com 2 casas decimais
      let formatted = (numValue / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      e.target.value = formatted;
    });

    // Formatar valor inicial
    if (input.value) {
      const numValue = parseFloat(input.value);
      if (!isNaN(numValue)) {
        input.value = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
  },

  // Parser para valores monetários mascarados
  parseCurrency(value) {
    if (!value || value === '') return 0;
    // Remove pontos (separador de milhar) e troca vírgula por ponto
    const cleaned = value.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  },

  // Parser para valores de porcentagem mascarados
  parsePercentage(value) {
    if (!value || value === '') return 0;
    // Troca vírgula por ponto
    const cleaned = value.toString().replace(',', '.');
    return parseFloat(cleaned) || 0;
  },

  // Aplicar máscaras aos campos do formulário
  applyMasks() {
    // Campos monetários
    const currencyFields = ['objetivo', 'valorInicial', 'aporte', 'rendaPassiva'];
    currencyFields.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskCurrency(input);
    });

    // Campos de porcentagem
    const percentFields = ['rentabilidade', 'inflacao'];
    percentFields.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskPercentage(input);
    });

    // Campo de anos (apenas números inteiros)
    const tempoInput = document.getElementById('tempoAnos');
    if (tempoInput) {
      tempoInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
      });
    }
  },

  renderCalculator() {
    const container = document.getElementById('calculadora-container');
    if (!container) return;

    container.innerHTML = `
      <div class="calc-modes">
        <button class="calc-mode-btn active" data-mode="1">
          <span class="mode-icon">🎯</span>
          <span class="mode-text">
            <strong>${this.t('mode1Title')}</strong>
            <small>${this.t('mode1Desc')}</small>
          </span>
        </button>
        <button class="calc-mode-btn" data-mode="2">
          <span class="mode-icon">📈</span>
          <span class="mode-text">
            <strong>${this.t('mode2Title')}</strong>
            <small>${this.t('mode2Desc')}</small>
          </span>
        </button>
        <button class="calc-mode-btn" data-mode="3">
          <span class="mode-icon">⏱️</span>
          <span class="mode-text">
            <strong>${this.t('mode3Title')}</strong>
            <small>${this.t('mode3Desc')}</small>
          </span>
        </button>
        <button class="calc-mode-btn" data-mode="4">
          <span class="mode-icon">🏖️</span>
          <span class="mode-text">
            <strong>${this.t('mode4Title')}</strong>
            <small>${this.t('mode4Desc')}</small>
          </span>
        </button>
        <button class="calc-mode-btn" data-mode="5">
          <span class="mode-icon">📊</span>
          <span class="mode-text">
            <strong>${this.t('mode5Title')}</strong>
            <small>${this.t('mode5Desc')}</small>
          </span>
        </button>
      </div>

      <div class="calc-form" id="calcForm">
        ${this.renderForm()}
      </div>

      <div class="calc-result" id="calcResult" style="display: none;">
      </div>
    `;

    // Aplicar máscaras aos campos
    this.applyMasks();
  },

  getInflationArticleLink() {
    const lang = this.currentLang;
    if (lang === 'en') {
      return '../artigos/inflacao-o-imposto-invisivel-2026.html';
    } else if (lang === 'es') {
      return '../artigos/inflacao-o-imposto-invisivel-2026.html';
    }
    return '../artigos/inflacao-o-imposto-invisivel-2026.html';
  },

  renderForm() {
    const d = this.defaults;
    const inflationLink = this.getInflationArticleLink();

    if (this.currentMode === 1) {
      // Modo: Calcular aporte necessário
      return `
        <div class="calc-field">
          <label for="objetivo">${this.t('goalLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="objetivo" value="${d.objetivo}" placeholder="${this.t('goalPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="valorInicial">${this.t('initialLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="tempo">${this.t('timeLabel')}</label>
          <div class="input-group">
            <input type="text" id="tempoAnos" value="${d.tempoAnos}" inputmode="numeric">
            <span class="input-suffix">${this.t('years')}</span>
          </div>
        </div>

        <div class="calc-fields-row">
          <div class="calc-field">
            <label for="rentabilidade">${this.t('returnLabel')}</label>
            <div class="input-group">
              <input type="text" id="rentabilidade" value="${d.rentabilidadeMensal}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>

          <div class="calc-field">
            <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
            <div class="input-group">
              <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else if (this.currentMode === 2) {
      // Modo: Calcular montante final
      return `
        <div class="calc-field">
          <label for="valorInicial">${this.t('initialLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="aporte">${this.t('monthlyLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="aporte" value="${d.aporteMensal}" placeholder="${this.t('monthlyPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="tempo">${this.t('timeLabel')}</label>
          <div class="input-group">
            <input type="text" id="tempoAnos" value="${d.tempoAnos}" inputmode="numeric">
            <span class="input-suffix">${this.t('years')}</span>
          </div>
        </div>

        <div class="calc-fields-row">
          <div class="calc-field">
            <label for="rentabilidade">${this.t('returnLabel')}</label>
            <div class="input-group">
              <input type="text" id="rentabilidade" value="${d.rentabilidadeMensal}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>

          <div class="calc-field">
            <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
            <div class="input-group">
              <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else if (this.currentMode === 3) {
      // Modo 3: Calcular tempo necessário
      return `
        <div class="calc-field">
          <label for="objetivo">${this.t('goalLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="objetivo" value="${d.objetivo}" placeholder="${this.t('goalPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="valorInicial">${this.t('initialLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="aporte">${this.t('monthlyLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="aporte" value="${d.aporteMensal}" placeholder="${this.t('monthlyPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-fields-row">
          <div class="calc-field">
            <label for="rentabilidade">${this.t('returnLabel')}</label>
            <div class="input-group">
              <input type="text" id="rentabilidade" value="${d.rentabilidadeMensal}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>

          <div class="calc-field">
            <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
            <div class="input-group">
              <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else if (this.currentMode === 4) {
      // Modo 4: Independência Financeira
      return `
        <div class="calc-field">
          <label for="rendaPassiva">${this.t('passiveIncomeLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="rendaPassiva" value="5000" placeholder="${this.t('passiveIncomePlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="valorInicial">${this.t('initialLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="aporte">${this.t('monthlyLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="aporte" value="${d.aporteMensal}" placeholder="${this.t('monthlyPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-fields-row">
          <div class="calc-field">
            <label for="rentabilidade">${this.t('returnLabel')}</label>
            <div class="input-group">
              <input type="text" id="rentabilidade" value="${d.rentabilidadeMensal}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>

          <div class="calc-field">
            <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
            <div class="input-group">
              <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else {
      // Modo 5: Carteira Histórica
      return `
        <div class="calc-portfolio-intro">
          <h3>${this.t('portfolioTitle')}</h3>
          <p>${this.t('portfolioDesc')}</p>
        </div>

        <div class="calc-field">
          <label for="valorInicial">${this.t('initialLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="aporte">${this.t('monthlyLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="aporte" value="${d.aporteMensal}" placeholder="${this.t('monthlyPlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-fields-row">
          <div class="calc-field">
            <label>${this.t('periodStart')}</label>
            <input type="month" id="periodoInicio" value="2015-01" min="2005-01" max="2025-12">
          </div>
          <div class="calc-field">
            <label>${this.t('periodEnd')}</label>
            <input type="month" id="periodoFim" value="2024-12" min="2005-01" max="2025-12">
          </div>
        </div>

        <div class="calc-allocation" id="calcAllocation">
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#3b82f6"></span>
              <span class="alloc-name">Ibovespa</span>
              <span class="alloc-pct">10%</span>
            </div>
            <input type="range" min="0" max="100" value="10" data-asset="ibovespa">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#ec4899"></span>
              <span class="alloc-name">Caixa/CDI</span>
              <span class="alloc-pct">20%</span>
            </div>
            <input type="range" min="0" max="100" value="20" data-asset="cdi">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#22c55e"></span>
              <span class="alloc-name">Dólar</span>
              <span class="alloc-pct">15%</span>
            </div>
            <input type="range" min="0" max="100" value="15" data-asset="dolar">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#eab308"></span>
              <span class="alloc-name">Ouro</span>
              <span class="alloc-pct">10%</span>
            </div>
            <input type="range" min="0" max="100" value="10" data-asset="ouro">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#8b5cf6"></span>
              <span class="alloc-name">FIIs</span>
              <span class="alloc-pct">15%</span>
            </div>
            <input type="range" min="0" max="100" value="15" data-asset="fii_ifix">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#ef4444"></span>
              <span class="alloc-name">S&P 500</span>
              <span class="alloc-pct">10%</span>
            </div>
            <input type="range" min="0" max="100" value="10" data-asset="sp500_brl">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#14b8a6"></span>
              <span class="alloc-name">Imóveis</span>
              <span class="alloc-pct">10%</span>
            </div>
            <input type="range" min="0" max="100" value="10" data-asset="imoveis_fipezap">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#0ea5e9"></span>
              <span class="alloc-name">TLT</span>
              <span class="alloc-pct">5%</span>
            </div>
            <input type="range" min="0" max="100" value="5" data-asset="tlt_brl">
          </div>
          <div class="alloc-item">
            <div class="alloc-header">
              <span class="alloc-dot" style="background:#f7931a"></span>
              <span class="alloc-name">Bitcoin</span>
              <span class="alloc-pct">5%</span>
            </div>
            <input type="range" min="0" max="100" value="5" data-asset="bitcoin_brl">
          </div>
          <div class="alloc-total">
            <span>${this.t('allocationTotal')}:</span>
            <span id="allocTotal">100%</span>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('portfolioSimulate')}</button>
      `;
    }
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      // Botões de modo
      if (e.target.closest('.calc-mode-btn')) {
        const btn = e.target.closest('.calc-mode-btn');
        const mode = parseInt(btn.dataset.mode);
        this.setMode(mode);
      }

      // Botão calcular
      if (e.target.id === 'btnCalcular') {
        this.calculate();
      }
    });

    // Calcular ao pressionar Enter
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.closest('.calc-form')) {
        this.calculate();
      }
    });
  },

  setMode(mode) {
    this.currentMode = mode;

    // Atualizar botões ativos
    document.querySelectorAll('.calc-mode-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mode) === mode);
    });

    // Re-renderizar form
    const form = document.getElementById('calcForm');
    if (form) {
      form.innerHTML = this.renderForm();
      // Aplicar máscaras aos novos campos
      this.applyMasks();

      // Bind de sliders para modo 5
      if (mode === 5) {
        this.bindAllocationSliders();
      }
    }

    // Esconder resultado anterior
    const result = document.getElementById('calcResult');
    if (result) {
      result.style.display = 'none';
    }
  },

  bindAllocationSliders() {
    document.querySelectorAll('#calcAllocation input[type="range"]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const pctSpan = e.target.parentElement.querySelector('.alloc-pct');
        if (pctSpan) {
          pctSpan.textContent = value + '%';
        }
        this.updateAllocationTotal();
      });
    });
  },

  updateAllocationTotal() {
    let total = 0;
    document.querySelectorAll('#calcAllocation input[type="range"]').forEach(slider => {
      total += parseInt(slider.value) || 0;
    });
    const totalSpan = document.getElementById('allocTotal');
    if (totalSpan) {
      totalSpan.textContent = total + '%';
      totalSpan.style.color = total === 100 ? 'var(--bullish, #22c55e)' : 'var(--bearish, #ef4444)';
    }
  },

  calculate() {
    const rentabilidadeMensal = this.parsePercentage(document.getElementById('rentabilidade')?.value) / 100 || 0.01;
    const inflacaoAnual = this.parsePercentage(document.getElementById('inflacao')?.value) / 100 || 0.07;
    const valorInicial = this.parseCurrency(document.getElementById('valorInicial')?.value) || 0;

    // Inflação mensal: (1 + anual)^(1/12) - 1
    const inflacaoMensal = Math.pow(1 + inflacaoAnual, 1/12) - 1;

    if (this.currentMode === 1) {
      // Calcular aporte necessário para atingir objetivo
      const tempoAnos = parseInt(document.getElementById('tempoAnos')?.value) || 10;
      const objetivoHoje = this.parseCurrency(document.getElementById('objetivo')?.value) || 300000;
      const meses = tempoAnos * 12;

      // Objetivo ajustado pela inflação (valor nominal futuro)
      const objetivoAjustado = objetivoHoje * Math.pow(1 + inflacaoAnual, tempoAnos);

      // Calcular aporte inicial necessário
      const aporteInicial = this.calcularAporteNecessario(objetivoAjustado, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      this.showResult({
        mode: 1,
        aporteInicial,
        valorInicial,
        objetivoHoje,
        objetivoAjustado,
        tempoAnos,
        meses,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal
      });

    } else if (this.currentMode === 2) {
      // Calcular montante final dado um aporte
      const tempoAnos = parseInt(document.getElementById('tempoAnos')?.value) || 10;
      const aporteInicial = this.parseCurrency(document.getElementById('aporte')?.value) || 1000;
      const meses = tempoAnos * 12;

      const resultado = this.simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      // Valor real (poder de compra hoje)
      const valorReal = resultado.montanteFinal / Math.pow(1 + inflacaoAnual, tempoAnos);

      this.showResult({
        mode: 2,
        aporteInicial,
        valorInicial,
        montanteFinal: resultado.montanteFinal,
        valorReal,
        totalInvestido: resultado.totalInvestido,
        totalRendimento: resultado.montanteFinal - resultado.totalInvestido,
        tempoAnos,
        meses,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal,
        aportesPorAno: resultado.aportesPorAno,
        saldosPorAno: resultado.saldosPorAno
      });

    } else if (this.currentMode === 3) {
      // Modo 3: Calcular tempo necessário
      const objetivoHoje = this.parseCurrency(document.getElementById('objetivo')?.value) || 300000;
      const aporteInicial = this.parseCurrency(document.getElementById('aporte')?.value) || 1000;

      const resultado = this.calcularTempoNecessario(objetivoHoje, aporteInicial, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial);

      this.showResult({
        mode: 3,
        ...resultado,
        objetivoHoje,
        aporteInicial,
        valorInicial,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal
      });
    } else if (this.currentMode === 4) {
      // Modo 4: Independência Financeira
      const rendaPassivaHoje = this.parseCurrency(document.getElementById('rendaPassiva')?.value) || 5000;
      const aporteInicial = this.parseCurrency(document.getElementById('aporte')?.value) || 1000;

      // Calcular para renda exata
      const resultadoExato = this.calcularIndependenciaFinanceira(
        rendaPassivaHoje, aporteInicial, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial
      );

      // Calcular com margem de 30%
      const rendaComMargem = rendaPassivaHoje * 1.3;
      const resultadoMargem = this.calcularIndependenciaFinanceira(
        rendaComMargem, aporteInicial, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial
      );

      this.showResult({
        mode: 4,
        rendaPassivaHoje,
        rendaComMargem,
        aporteInicial,
        valorInicial,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal,
        resultadoExato,
        resultadoMargem
      });
    } else if (this.currentMode === 5) {
      // Modo 5: Carteira Histórica
      this.calculatePortfolio();
    }
  },

  async calculatePortfolio() {
    // Verificar alocação total
    let totalAlloc = 0;
    const alocacao = {};
    document.querySelectorAll('#calcAllocation input[type="range"]').forEach(slider => {
      const pct = parseInt(slider.value) || 0;
      if (pct > 0) {
        alocacao[slider.dataset.asset] = pct / 100;
        totalAlloc += pct;
      }
    });

    if (Math.abs(totalAlloc - 100) > 1) {
      alert(this.t('portfolioInvalidAlloc'));
      return;
    }

    // Ler valores
    const valorInicial = this.parseCurrency(document.getElementById('valorInicial')?.value) || 0;
    const aporteMensal = this.parseCurrency(document.getElementById('aporte')?.value) || 1000;
    const periodoInicio = document.getElementById('periodoInicio')?.value || '2015-01';
    const periodoFim = document.getElementById('periodoFim')?.value || '2024-12';

    // Carregar dados históricos se ainda não carregados
    if (!this.dadosMensais) {
      const resultEl = document.getElementById('calcResult');
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `<div class="calc-loading"><p>${this.t('portfolioLoadingData')}</p></div>`;
      }

      try {
        const response = await fetch('../data/historico-mensal.json');
        this.dadosMensais = await response.json();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert(this.t('portfolioNoData'));
        return;
      }
    }

    // Filtrar dados pelo período
    const dadosFiltrados = this.filtrarDadosMensais(periodoInicio, periodoFim);

    if (dadosFiltrados.length === 0) {
      alert(this.t('portfolioNoData'));
      return;
    }

    // Simular carteira com aportes mensais
    const resultado = this.simularCarteiraComAportes(alocacao, dadosFiltrados, valorInicial, aporteMensal);

    this.showResult({
      mode: 5,
      valorInicial,
      aporteMensal,
      periodoInicio,
      periodoFim,
      alocacao,
      resultado,
      dadosFiltrados
    });
  },

  filtrarDadosMensais(periodoInicio, periodoFim) {
    if (!this.dadosMensais?.meses) return [];

    const [anoInicio, mesInicio] = periodoInicio.split('-').map(Number);
    const [anoFim, mesFim] = periodoFim.split('-').map(Number);

    return this.dadosMensais.meses.filter(d => {
      const dataInicio = anoInicio * 12 + mesInicio;
      const dataFim = anoFim * 12 + mesFim;
      const dataMes = d.ano * 12 + d.mes;
      return dataMes >= dataInicio && dataMes <= dataFim;
    });
  },

  simularCarteiraComAportes(alocacao, dados, valorInicial, aporteMensal) {
    const evolucao = [{
      periodo: 'Início',
      nominal: valorInicial,
      real: valorInicial,
      aporte: 0,
      retorno: 0
    }];

    let saldo = valorInicial;
    let totalInvestido = valorInicial;
    let inflacaoAcumulada = 1;
    const retornosMensais = [];
    let maxDrawdown = 0;
    let peakValue = valorInicial;

    dados.forEach((d, index) => {
      // Calcular retorno da carteira neste mês
      let retornoCarteira = 0;
      Object.entries(alocacao).forEach(([ativo, peso]) => {
        const retornoAtivo = this.getRetornoAtivo(ativo, d);
        retornoCarteira += retornoAtivo * peso;
      });

      retornosMensais.push(retornoCarteira);

      // Aplicar retorno no saldo existente
      saldo = saldo * (1 + retornoCarteira / 100);

      // Adicionar aporte mensal
      saldo += aporteMensal;
      totalInvestido += aporteMensal;

      // Calcular inflação acumulada
      const inflacaoMensal = d.inflacao_ipca || 0;
      inflacaoAcumulada *= (1 + inflacaoMensal / 100);

      // Calcular drawdown
      if (saldo > peakValue) peakValue = saldo;
      const drawdown = (peakValue - saldo) / peakValue * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      evolucao.push({
        periodo: d.periodo || `${d.mes}/${d.ano}`,
        nominal: saldo,
        real: saldo / inflacaoAcumulada,
        aporte: aporteMensal,
        retorno: retornoCarteira
      });
    });

    // Calcular estatísticas
    const retornoNominal = ((saldo / totalInvestido) - 1) * 100;
    const valorReal = saldo / inflacaoAcumulada;
    const retornoReal = ((valorReal / totalInvestido) - 1) * 100;
    const mediaMensal = retornosMensais.reduce((a, b) => a + b, 0) / retornosMensais.length;
    const volatilidade = this.calcularVolatilidade(retornosMensais);

    return {
      evolucao,
      valorFinalNominal: saldo,
      valorFinalReal: valorReal,
      totalInvestido,
      retornoNominal,
      retornoReal,
      mediaMensal,
      volatilidade,
      maxDrawdown,
      meses: dados.length
    };
  },

  getRetornoAtivo(ativo, dadoMes) {
    // Mapear nome do ativo para campo no JSON
    const mapeamento = {
      'ibovespa': 'ibovespa',
      'cdi': 'cdi',
      'dolar': 'dolar',
      'ouro': 'ouro',
      'fii_ifix': 'fii_ifix',
      'sp500_brl': 'sp500_brl',
      'imoveis_fipezap': 'imoveis_fipezap',
      'tlt_brl': 'tlt_brl',
      'bitcoin_brl': 'bitcoin_brl'
    };

    const campo = mapeamento[ativo] || ativo;
    return dadoMes[campo] || 0;
  },

  calcularVolatilidade(retornos) {
    if (!retornos || retornos.length < 2) return 0;
    const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
    const variancia = retornos.reduce((acc, r) => acc + Math.pow(r - media, 2), 0) / retornos.length;
    return Math.sqrt(variancia);
  },

  calcularAporteNecessario(objetivoFinal, meses, rentabilidadeMensal, inflacaoMensal, valorInicial = 0) {
    // Busca binária para encontrar o aporte inicial
    let min = 0;
    let max = objetivoFinal;
    let aporteInicial = 0;

    for (let i = 0; i < 100; i++) {
      aporteInicial = (min + max) / 2;
      const resultado = this.simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      if (Math.abs(resultado.montanteFinal - objetivoFinal) < 1) {
        break;
      }

      if (resultado.montanteFinal < objetivoFinal) {
        min = aporteInicial;
      } else {
        max = aporteInicial;
      }
    }

    return aporteInicial;
  },

  calcularTempoNecessario(objetivoHoje, aporteInicial, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial = 0) {
    // Simula mês a mês até atingir o objetivo (considerando inflação no objetivo)
    let saldo = valorInicial;
    let totalInvestido = valorInicial;
    let aporteAtual = aporteInicial;
    let mes = 0;
    const maxMeses = 600; // 50 anos limite
    const aportesPorAno = [];
    const saldosPorAno = [];

    while (mes < maxMeses) {
      mes++;

      // Aplicar rendimento no saldo existente
      saldo = saldo * (1 + rentabilidadeMensal);

      // Adicionar aporte do mês
      saldo += aporteAtual;
      totalInvestido += aporteAtual;

      // Calcular objetivo ajustado para este mês
      const anosDecorridos = mes / 12;
      const objetivoAjustado = objetivoHoje * Math.pow(1 + inflacaoAnual, anosDecorridos);

      // Guardar valores ao final de cada ano
      if (mes % 12 === 0) {
        const ano = mes / 12;
        aportesPorAno.push({ ano, aporte: aporteAtual });
        saldosPorAno.push({ ano, saldo });
      }

      // Verificar se atingiu o objetivo
      if (saldo >= objetivoAjustado) {
        const anos = Math.floor(mes / 12);
        const mesesRestantes = mes % 12;

        return {
          meses: mes,
          anos,
          mesesRestantes,
          montanteFinal: saldo,
          objetivoAjustado,
          totalInvestido,
          aporteFinal: aporteAtual,
          aportesPorAno,
          saldosPorAno
        };
      }

      // Reajustar aporte pela inflação para o próximo mês
      aporteAtual = aporteAtual * (1 + inflacaoMensal);
    }

    // Não atingiu em 50 anos
    return {
      meses: maxMeses,
      anos: 50,
      mesesRestantes: 0,
      montanteFinal: saldo,
      objetivoAjustado: objetivoHoje * Math.pow(1 + inflacaoAnual, 50),
      totalInvestido,
      aporteFinal: aporteAtual,
      aportesPorAno,
      saldosPorAno,
      naoAtingiu: true
    };
  },

  simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal, valorInicial = 0) {
    let saldo = valorInicial;
    let totalInvestido = valorInicial;
    let aporteAtual = aporteInicial;
    const aportesPorAno = [];
    const saldosPorAno = [];

    for (let mes = 1; mes <= meses; mes++) {
      // Aplicar rendimento no saldo existente
      saldo = saldo * (1 + rentabilidadeMensal);

      // Adicionar aporte do mês
      saldo += aporteAtual;
      totalInvestido += aporteAtual;

      // Guardar valores ao final de cada ano
      if (mes % 12 === 0) {
        const ano = mes / 12;
        aportesPorAno.push({ ano, aporte: aporteAtual });
        saldosPorAno.push({ ano, saldo });
      }

      // Reajustar aporte pela inflação para o próximo mês
      aporteAtual = aporteAtual * (1 + inflacaoMensal);
    }

    return {
      montanteFinal: saldo,
      totalInvestido,
      aporteFinal: aporteAtual / (1 + inflacaoMensal), // Último aporte efetivo
      aportesPorAno,
      saldosPorAno
    };
  },

  // Calcular independência financeira com ajuste inflacionário iterativo
  calcularIndependenciaFinanceira(rendaPassivaHoje, aporteInicial, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial = 0) {
    // Capital necessário hoje para gerar a renda passiva desejada
    const capitalHoje = rendaPassivaHoje / rentabilidadeMensal;

    // Simula mês a mês até que o patrimônio possa gerar a renda ajustada pela inflação
    let saldo = valorInicial;
    let totalInvestido = valorInicial;
    let aporteAtual = aporteInicial;
    let mes = 0;
    const maxMeses = 600; // 50 anos limite
    const aportesPorAno = [];
    const saldosPorAno = [];

    while (mes < maxMeses) {
      mes++;

      // Aplicar rendimento no saldo existente
      saldo = saldo * (1 + rentabilidadeMensal);

      // Adicionar aporte do mês
      saldo += aporteAtual;
      totalInvestido += aporteAtual;

      // Calcular capital necessário ajustado para este mês
      // A renda desejada cresce com a inflação, então o capital necessário também
      const anosDecorridos = mes / 12;
      const rendaAjustada = rendaPassivaHoje * Math.pow(1 + inflacaoAnual, anosDecorridos);
      const capitalNecessario = rendaAjustada / rentabilidadeMensal;

      // Guardar valores ao final de cada ano
      if (mes % 12 === 0) {
        const ano = mes / 12;
        aportesPorAno.push({ ano, aporte: aporteAtual });
        saldosPorAno.push({ ano, saldo, capitalNecessario, rendaAjustada });
      }

      // Verificar se atingiu o capital necessário
      if (saldo >= capitalNecessario) {
        const anos = Math.floor(mes / 12);
        const mesesRestantes = mes % 12;

        // Renda que o patrimônio pode gerar mensalmente
        const rendaGerada = saldo * rentabilidadeMensal;
        const rendaGeradaReal = rendaGerada / Math.pow(1 + inflacaoAnual, anosDecorridos);

        return {
          meses: mes,
          anos,
          mesesRestantes,
          capitalFinal: saldo,
          capitalNecessario,
          capitalHoje,
          rendaPassivaHoje,
          rendaAjustada,
          rendaGerada,
          rendaGeradaReal,
          totalInvestido,
          aporteFinal: aporteAtual,
          aportesPorAno,
          saldosPorAno,
          naoAtingiu: false
        };
      }

      // Reajustar aporte pela inflação para o próximo mês
      aporteAtual = aporteAtual * (1 + inflacaoMensal);
    }

    // Não atingiu em 50 anos
    const rendaAjustada50 = rendaPassivaHoje * Math.pow(1 + inflacaoAnual, 50);
    const capitalNecessario50 = rendaAjustada50 / rentabilidadeMensal;

    return {
      meses: maxMeses,
      anos: 50,
      mesesRestantes: 0,
      capitalFinal: saldo,
      capitalNecessario: capitalNecessario50,
      capitalHoje,
      rendaPassivaHoje,
      rendaAjustada: rendaAjustada50,
      rendaGerada: saldo * rentabilidadeMensal,
      rendaGeradaReal: (saldo * rentabilidadeMensal) / Math.pow(1 + inflacaoAnual, 50),
      totalInvestido,
      aporteFinal: aporteAtual,
      aportesPorAno,
      saldosPorAno,
      naoAtingiu: true
    };
  },

  showResult(data) {
    const resultDiv = document.getElementById('calcResult');
    if (!resultDiv) return;

    let html = `<h3>${this.t('resultTitle')}</h3>`;

    if (data.mode === 1) {
      // Resultado do modo 1: Calcular aporte necessário
      const simulacao = this.simularInvestimento(data.aporteInicial, data.meses, data.rentabilidadeMensal, data.inflacaoMensal);

      html += `
        <div class="result-main">
          <div class="result-value">${this.formatCurrency(data.aporteInicial)}</div>
          <div class="result-label">${this.t('monthlyNeeded')}</div>
          <div class="result-note">${this.t('monthlyNeededNote')}</div>
        </div>

        <div class="result-info">
          <p>${this.t('inflationNote')
            .replace('{valor}', this.formatCurrency(data.aporteInicial))
            .replace('{inflacao}', (data.inflacaoAnual * 100).toFixed(1))
            .replace('{valorFinal}', this.formatCurrency(simulacao.aporteFinal))
          }</p>
          <p>${this.t('goalNote')
            .replace('{objetivo}', this.formatCurrency(data.objetivoHoje))
            .replace('{objetivoAjustado}', this.formatCurrency(data.objetivoAjustado))
            .replace('{anos}', data.tempoAnos)
          }</p>
        </div>

        <div class="result-details">
          <div class="result-detail">
            <span class="detail-label">${this.t('finalAmount')}</span>
            <span class="detail-value">${this.formatCurrency(simulacao.montanteFinal)}</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">${this.t('totalInvested')}</span>
            <span class="detail-value">${this.formatCurrency(simulacao.totalInvestido)}</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">${this.t('totalReturn')}</span>
            <span class="detail-value highlight">${this.formatCurrency(simulacao.montanteFinal - simulacao.totalInvestido)}</span>
          </div>
        </div>

        ${this.renderProjection(simulacao.saldosPorAno, simulacao.aportesPorAno, data.inflacaoAnual)}
      `;
    } else if (data.mode === 2) {
      // Resultado do modo 2: Calcular montante final
      html += `
        <div class="result-main">
          <div class="result-value">${this.formatCurrency(data.montanteFinal)}</div>
          <div class="result-label">${this.t('finalAmount')}</div>
        </div>

        <div class="result-secondary">
          <div class="result-value-secondary">${this.formatCurrency(data.valorReal)}</div>
          <div class="result-label">${this.t('realValue')}</div>
          <div class="result-note">${this.t('realValueNote')}</div>
        </div>

        <div class="result-info">
          <p>${this.t('inflationNote')
            .replace('{valor}', this.formatCurrency(data.aporteInicial))
            .replace('{inflacao}', (data.inflacaoAnual * 100).toFixed(1))
            .replace('{valorFinal}', this.formatCurrency(data.aportesPorAno[data.aportesPorAno.length - 1]?.aporte || data.aporteInicial))
          }</p>
        </div>

        <div class="result-details">
          <div class="result-detail">
            <span class="detail-label">${this.t('totalInvested')}</span>
            <span class="detail-value">${this.formatCurrency(data.totalInvestido)}</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">${this.t('totalReturn')}</span>
            <span class="detail-value highlight">${this.formatCurrency(data.totalRendimento)}</span>
          </div>
        </div>

        ${this.renderProjection(data.saldosPorAno, data.aportesPorAno, data.inflacaoAnual)}
      `;
    } else if (data.mode === 3) {
      // Resultado do modo 3: Calcular tempo necessário
      const tempoFormatado = data.mesesRestantes > 0
        ? `${data.anos} ${this.t('years')} ${this.t('and')} ${data.mesesRestantes} ${this.t('months')}`
        : `${data.anos} ${this.t('years')}`;

      if (data.naoAtingiu) {
        html += `
          <div class="result-main result-warning">
            <div class="result-value">+50 ${this.t('years')}</div>
            <div class="result-label">${this.t('timeNeeded')}</div>
            <div class="result-note">Com os parâmetros informados, o objetivo não será atingido em 50 anos. Considere aumentar o aporte ou a rentabilidade.</div>
          </div>
        `;
      } else {
        html += `
          <div class="result-main">
            <div class="result-value">${tempoFormatado}</div>
            <div class="result-label">${this.t('timeNeeded')}</div>
            <div class="result-note">${this.t('timeNeededNote')}</div>
          </div>

          <div class="result-info">
            <p>${this.t('inflationNote')
              .replace('{valor}', this.formatCurrency(data.aporteInicial))
              .replace('{inflacao}', (data.inflacaoAnual * 100).toFixed(1))
              .replace('{valorFinal}', this.formatCurrency(data.aporteFinal))
            }</p>
            <p>${this.t('goalNote')
              .replace('{objetivo}', this.formatCurrency(data.objetivoHoje))
              .replace('{objetivoAjustado}', this.formatCurrency(data.objetivoAjustado))
              .replace('{anos}', data.anos)
            }</p>
          </div>

          <div class="result-details">
            <div class="result-detail">
              <span class="detail-label">${this.t('finalAmount')}</span>
              <span class="detail-value">${this.formatCurrency(data.montanteFinal)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('totalInvested')}</span>
              <span class="detail-value">${this.formatCurrency(data.totalInvestido)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('totalReturn')}</span>
              <span class="detail-value highlight">${this.formatCurrency(data.montanteFinal - data.totalInvestido)}</span>
            </div>
          </div>

          ${this.renderProjection(data.saldosPorAno, data.aportesPorAno, data.inflacaoAnual)}
        `;
      }
    } else if (data.mode === 4) {
      // Resultado do modo 4: Independência Financeira
      const exato = data.resultadoExato;
      const margem = data.resultadoMargem;

      const tempoExatoFormatado = exato.mesesRestantes > 0
        ? `${exato.anos} ${this.t('years')} ${this.t('and')} ${exato.mesesRestantes} ${this.t('months')}`
        : `${exato.anos} ${this.t('years')}`;

      const tempoMargemFormatado = margem.mesesRestantes > 0
        ? `${margem.anos} ${this.t('years')} ${this.t('and')} ${margem.mesesRestantes} ${this.t('months')}`
        : `${margem.anos} ${this.t('years')}`;

      if (exato.naoAtingiu) {
        html += `
          <div class="result-main result-warning">
            <div class="result-value">+50 ${this.t('years')}</div>
            <div class="result-label">${this.t('fiTimeNeeded')}</div>
            <div class="result-note">${this.t('fiNeverReach')}</div>
          </div>
        `;
      } else {
        html = `<h3>${this.t('fiResultTitle')}</h3>`;

        html += `
          <div class="result-main">
            <div class="result-value">${tempoExatoFormatado}</div>
            <div class="result-label">${this.t('fiTimeNeeded')}</div>
          </div>

          <div class="result-secondary">
            <div class="result-value-secondary">${this.formatCurrency(data.rendaPassivaHoje)}${this.t('perMonth')}</div>
            <div class="result-label">${this.t('fiPassiveIncome')}</div>
            <div class="result-note">${this.t('fiPassiveIncomeNote')}</div>
          </div>

          <div class="result-details">
            <div class="result-detail">
              <span class="detail-label">${this.t('fiCapitalNeeded')}</span>
              <span class="detail-value">${this.formatCurrency(exato.capitalHoje)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('fiCapitalAdjusted')}</span>
              <span class="detail-value">${this.formatCurrency(exato.capitalNecessario)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('totalInvested')}</span>
              <span class="detail-value">${this.formatCurrency(exato.totalInvestido)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('totalReturn')}</span>
              <span class="detail-value highlight">${this.formatCurrency(exato.capitalFinal - exato.totalInvestido)}</span>
            </div>
          </div>

          <div class="result-margin-section">
            <h4>${this.t('fiMarginTitle')}</h4>
            <p class="result-note">${this.t('fiMarginNote')}</p>

            <div class="result-margin-grid">
              <div class="margin-item">
                <span class="margin-label">${this.t('fiMarginIncome')}</span>
                <span class="margin-value">${this.formatCurrency(data.rendaComMargem)}${this.t('perMonth')}</span>
              </div>
              <div class="margin-item">
                <span class="margin-label">${this.t('fiMarginCapital')}</span>
                <span class="margin-value">${this.formatCurrency(margem.capitalNecessario)}</span>
              </div>
              <div class="margin-item">
                <span class="margin-label">${this.t('fiMarginTime')}</span>
                <span class="margin-value">${margem.naoAtingiu ? '+50 ' + this.t('years') : tempoMargemFormatado}</span>
              </div>
            </div>
          </div>

          ${this.renderFIProjection(exato.saldosPorAno, exato.aportesPorAno, data.inflacaoAnual)}
        `;
      }
    } else if (data.mode === 5) {
      // Resultado do modo 5: Carteira Histórica
      const r = data.resultado;
      const periodoTexto = `${data.periodoInicio} a ${data.periodoFim}`;

      html = `<h3>${this.t('portfolioResult')}</h3>`;

      html += `
        <div class="result-info">
          <p>${this.t('portfolioNote').replace('{periodo}', periodoTexto)}</p>
        </div>

        <div class="result-main">
          <div class="result-value">${this.formatCurrency(r.valorFinalNominal)}</div>
          <div class="result-label">${this.t('portfolioFinalNominal')}</div>
        </div>

        <div class="result-secondary">
          <div class="result-value-secondary">${this.formatCurrency(r.valorFinalReal)}</div>
          <div class="result-label">${this.t('portfolioFinalReal')}</div>
        </div>

        <div class="result-details">
          <div class="result-detail">
            <span class="detail-label">${this.t('portfolioTotalInvested')}</span>
            <span class="detail-value">${this.formatCurrency(r.totalInvestido)}</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">${this.t('portfolioTotalReturn')}</span>
            <span class="detail-value highlight">${this.formatPercent(r.retornoNominal)}</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">${this.t('portfolioReturnReal')}</span>
            <span class="detail-value ${r.retornoReal >= 0 ? 'positive' : 'negative'}">${this.formatPercent(r.retornoReal)}</span>
          </div>
        </div>

        <div class="result-metrics">
          <div class="metric-item">
            <span class="metric-label">${this.t('portfolioMonthlyAvg')}</span>
            <span class="metric-value">${r.mediaMensal.toFixed(2)}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">${this.t('portfolioVolatility')}</span>
            <span class="metric-value">${r.volatilidade.toFixed(2)}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">${this.t('portfolioMaxDrawdown')}</span>
            <span class="metric-value negative">-${r.maxDrawdown.toFixed(2)}%</span>
          </div>
        </div>

        ${this.renderPortfolioProjection(r.evolucao)}
      `;
    }

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';

    // Scroll suave até o resultado
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  renderProjection(saldosPorAno, aportesPorAno, inflacaoAnual) {
    if (!saldosPorAno.length) return '';

    let html = `
      <div class="result-projection">
        <h4>${this.t('projectionTitle')}</h4>
        <div class="projection-table">
          <div class="projection-header">
            <span>${this.t('yearCol')}</span>
            <span>${this.t('balanceCol')}</span>
            <span>${this.t('monthlyCol')}</span>
            <span>${this.t('realCol')}</span>
          </div>
    `;

    for (let i = 0; i < saldosPorAno.length; i++) {
      const ano = saldosPorAno[i].ano;
      const saldo = saldosPorAno[i].saldo;
      const aporte = aportesPorAno[i].aporte;
      const valorReal = saldo / Math.pow(1 + inflacaoAnual, ano);

      html += `
        <div class="projection-row">
          <span class="year-col">${ano}</span>
          <span class="balance-col">${this.formatCurrency(saldo)}</span>
          <span class="monthly-col">${this.formatCurrency(aporte)}</span>
          <span class="real-col">${this.formatCurrency(valorReal)}</span>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  },

  // Projeção específica para independência financeira
  renderFIProjection(saldosPorAno, aportesPorAno, inflacaoAnual) {
    if (!saldosPorAno.length) return '';

    const fiProjectionTitle = {
      'pt-BR': 'Projeção para independência',
      'en': 'Independence projection',
      'es': 'Proyección de independencia'
    }[this.currentLang] || 'Projeção para independência';

    const fiCapitalCol = {
      'pt-BR': 'Capital necessário',
      'en': 'Required capital',
      'es': 'Capital necesario'
    }[this.currentLang] || 'Capital necessário';

    const fiIncomeCol = {
      'pt-BR': 'Renda alvo',
      'en': 'Target income',
      'es': 'Ingreso objetivo'
    }[this.currentLang] || 'Renda alvo';

    let html = `
      <div class="result-projection">
        <h4>${fiProjectionTitle}</h4>
        <div class="projection-table fi-projection">
          <div class="projection-header">
            <span>${this.t('yearCol')}</span>
            <span>${this.t('balanceCol')}</span>
            <span>${fiCapitalCol}</span>
            <span>${fiIncomeCol}</span>
          </div>
    `;

    for (let i = 0; i < saldosPorAno.length; i++) {
      const ano = saldosPorAno[i].ano;
      const saldo = saldosPorAno[i].saldo;
      const capitalNecessario = saldosPorAno[i].capitalNecessario;
      const rendaAjustada = saldosPorAno[i].rendaAjustada;
      const atingiu = saldo >= capitalNecessario;

      html += `
        <div class="projection-row ${atingiu ? 'fi-achieved' : ''}">
          <span class="year-col">${ano}</span>
          <span class="balance-col">${this.formatCurrency(saldo)}</span>
          <span class="capital-col">${this.formatCurrency(capitalNecessario)}</span>
          <span class="income-col">${this.formatCurrency(rendaAjustada)}</span>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  },

  // Projeção para carteira histórica
  renderPortfolioProjection(evolucao) {
    if (!evolucao || evolucao.length < 2) return '';

    let html = `
      <div class="result-projection">
        <h4>${this.t('portfolioProjection')}</h4>
        <div class="projection-table portfolio-projection">
          <div class="projection-header">
            <span>${this.t('portfolioMonth')}</span>
            <span>${this.t('portfolioBalance')}</span>
            <span>${this.t('portfolioRealValue')}</span>
            <span>${this.t('portfolioReturn')}</span>
          </div>
    `;

    // Mostrar apenas alguns pontos para não sobrecarregar (a cada 6 meses ou menos se período curto)
    const step = evolucao.length > 24 ? 6 : (evolucao.length > 12 ? 3 : 1);

    for (let i = 0; i < evolucao.length; i += step) {
      const e = evolucao[i];
      const retornoClass = e.retorno >= 0 ? 'positive' : 'negative';

      html += `
        <div class="projection-row">
          <span class="month-col">${e.periodo}</span>
          <span class="balance-col">${this.formatCurrency(e.nominal)}</span>
          <span class="real-col">${this.formatCurrency(e.real)}</span>
          <span class="return-col ${retornoClass}">${e.retorno !== 0 ? this.formatPercent(e.retorno) : '-'}</span>
        </div>
      `;
    }

    // Sempre mostrar o último se não foi incluído
    if ((evolucao.length - 1) % step !== 0) {
      const e = evolucao[evolucao.length - 1];
      const retornoClass = e.retorno >= 0 ? 'positive' : 'negative';

      html += `
        <div class="projection-row final-row">
          <span class="month-col">${e.periodo}</span>
          <span class="balance-col">${this.formatCurrency(e.nominal)}</span>
          <span class="real-col">${this.formatCurrency(e.real)}</span>
          <span class="return-col ${retornoClass}">${e.retorno !== 0 ? this.formatPercent(e.retorno) : '-'}</span>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Calculadora.init();
});
