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
    rentabilidadeMensal: 0.9, // % ao mês
    inflacaoAnual: 6.0 // % ao ano
  },

  // Traduções
  translations: {
    'pt-BR': {
      mode1Title: 'Alcançar uma meta',
      mode1Desc: 'Tenho um valor e um prazo — quanto aportar por mês?',
      mode2Title: 'Projetar meus aportes',
      mode2Desc: 'Aporto um valor todo mês — quanto terei no futuro?',
      mode3Title: 'Prazo para minha meta',
      mode3Desc: 'Tenho um valor e um aporte — quanto tempo leva?',
      mode4Title: 'Aposentadoria',
      mode4Desc: 'Quero me aposentar com R$X/mês — quanto aportar?',
      mode5Title: 'Venda parcelada',
      mode5Desc: 'Entrada + parcelas equivalem ao valor à vista?',
      mode5CashLabel: 'Valor desejado à vista',
      mode5DownLabel: 'Entrada oferecida',
      mode5InstLabel: 'Valor da parcela mensal',
      mode5RateLabel: 'Taxa de rendimento mensal (CDI)',
      mode5AdjLabel: 'Reajuste anual das parcelas (IGP-M)',
      ageLabel: 'Quantos anos você tem?',
      retirementAgeLabel: 'Com quantos anos quer se aposentar?',
      advancedOptions: 'Opções avançadas',
      alreadyInvestedLabel: 'Já tem algo investido?',
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
      fiMarginTimeShort: 'considerando margem de segurança (+30%)',
      fiNeverReach: 'Com os parâmetros atuais, a independência financeira não será atingida em 50 anos. Aumente o aporte ou reduza a renda desejada.',
      perMonth: '/mês'
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
      fiMarginTimeShort: 'with safety margin (+30%)',
      fiNeverReach: 'With current parameters, financial independence won\'t be reached in 50 years. Increase contribution or reduce desired income.',
      perMonth: '/month'
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
      fiMarginTimeShort: 'con margen de seguridad (+30%)',
      fiNeverReach: 'Con los parámetros actuales, la independencia financiera no se alcanzará en 50 años. Aumente el aporte o reduzca el ingreso deseado.',
      perMonth: '/mes'
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

  renderReturnField() {
    const d = this.defaults;

    return `
      <div class="calc-field">
        <label>${this.t('returnLabel')}</label>
        <div class="input-group">
          <input type="text" id="rentabilidade" value="${d.rentabilidadeMensal}" inputmode="decimal">
          <span class="input-suffix">%</span>
        </div>
      </div>
    `;
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
    const currencyFields = ['objetivo', 'valorInicial', 'aporte', 'rendaPassiva', 'valorVistaParc', 'entradaParc', 'parcelaValor'];
    currencyFields.forEach(id => {
      const input = document.getElementById(id);
      if (input) this.maskCurrency(input);
    });

    // Campos de porcentagem
    const percentFields = ['rentabilidade', 'inflacao', 'taxaCDI', 'reajusteParc'];
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
          <span class="mode-icon">🤝</span>
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

        ${this.renderReturnField()}

        <div class="calc-field">
          <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
          <div class="input-group">
            <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
            <span class="input-suffix">%</span>
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

        ${this.renderReturnField()}

        <div class="calc-field">
          <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
          <div class="input-group">
            <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
            <span class="input-suffix">%</span>
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

        ${this.renderReturnField()}

        <div class="calc-field">
          <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
          <div class="input-group">
            <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
            <span class="input-suffix">%</span>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else if (this.currentMode === 4) {
      // Modo 4: Aposentadoria simplificada
      return `
        <div class="calc-field">
          <label for="rendaPassiva">${this.t('passiveIncomeLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="rendaPassiva" value="5000" placeholder="${this.t('passiveIncomePlaceholder')}" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="idade">${this.t('ageLabel')}</label>
          <div class="input-group">
            <input type="text" id="idade" value="25" inputmode="numeric">
            <span class="input-suffix">anos</span>
          </div>
        </div>

        <div class="calc-field">
          <label for="idadeAposentar">${this.t('retirementAgeLabel')}</label>
          <div class="input-group">
            <input type="text" id="idadeAposentar" value="60" inputmode="numeric">
            <span class="input-suffix">anos</span>
          </div>
        </div>

        <details class="calc-advanced">
          <summary>${this.t('advancedOptions')}</summary>
          <div class="calc-field">
            <label for="valorInicial">${this.t('alreadyInvestedLabel')}</label>
            <div class="input-group">
              <span class="input-prefix">R$</span>
              <input type="text" id="valorInicial" value="${d.valorInicial}" placeholder="${this.t('initialPlaceholder')}" inputmode="numeric">
            </div>
          </div>

          ${this.renderReturnField()}

          <div class="calc-field">
            <label for="inflacao">${this.t('inflationLabel')} <a href="${inflationLink}" class="calc-info-link" target="_blank">${this.t('inflationLink')}</a></label>
            <div class="input-group">
              <input type="text" id="inflacao" value="${d.inflacaoAnual}" inputmode="decimal">
              <span class="input-suffix">%</span>
            </div>
          </div>
        </details>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else if (this.currentMode === 5) {
      // Modo 5: Venda parcelada
      return `
        <div class="calc-field">
          <label for="valorVistaParc">${this.t('mode5CashLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="valorVistaParc" value="90000" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="entradaParc">${this.t('mode5DownLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="entradaParc" value="30000" inputmode="numeric">
          </div>
        </div>

        <div class="calc-field">
          <label for="parcelaValor">${this.t('mode5InstLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="text" id="parcelaValor" value="1000" inputmode="numeric">
          </div>
        </div>

        <details class="calc-advanced">
          <summary>${this.t('advancedOptions')}</summary>
          <div class="calc-field">
            <label for="taxaCDI">${this.t('mode5RateLabel')}</label>
            <div class="input-group">
              <input type="text" id="taxaCDI" value="1,0" inputmode="decimal">
              <span class="input-suffix">% a.m.</span>
            </div>
          </div>
          <div class="calc-field">
            <label for="reajusteParc">${this.t('mode5AdjLabel')}</label>
            <div class="input-group">
              <input type="text" id="reajusteParc" value="4,5" inputmode="decimal">
              <span class="input-suffix">% a.a.</span>
            </div>
          </div>
        </details>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
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
    let activeBtn = null;
    document.querySelectorAll('.calc-mode-btn').forEach(btn => {
      const isActive = parseInt(btn.dataset.mode) === mode;
      btn.classList.toggle('active', isActive);
      if (isActive) activeBtn = btn;
    });

    // Centraliza o botão ativo no carrossel horizontal (mobile)
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Re-renderizar form
    const form = document.getElementById('calcForm');
    if (form) {
      form.innerHTML = this.renderForm();
      // Aplicar máscaras aos novos campos
      this.applyMasks();
    }

    // Esconder resultado anterior
    const result = document.getElementById('calcResult');
    if (result) {
      result.style.display = 'none';
    }
  },

  calculate() {
    // Get rentabilidade from fixed input field
    const rentabilidadeMensal = this.parsePercentage(document.getElementById('rentabilidade')?.value) / 100 || 0.009;

    const inflacaoAnual = this.parsePercentage(document.getElementById('inflacao')?.value) / 100 || 0.07;
    const valorInicial = this.parseCurrency(document.getElementById('valorInicial')?.value) || 0;

    // Inflação mensal: (1 + anual)^(1/12) - 1
    const inflacaoMensal = Math.pow(1 + inflacaoAnual, 1/12) - 1;

    if (this.currentMode === 1) {
      // Calcular aporte necessário para atingir objetivo
      const tempoAnos = parseInt(document.getElementById('tempoAnos')?.value) || 10;
      const objetivoHoje = this.parseCurrency(document.getElementById('objetivo')?.value) || 0;
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
      const aporteInicial = this.parseCurrency(document.getElementById('aporte')?.value) || 0;
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
      const objetivoHoje = this.parseCurrency(document.getElementById('objetivo')?.value) || 0;
      const aporteInicial = this.parseCurrency(document.getElementById('aporte')?.value) || 0;

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
      // Modo 4: Aposentadoria simplificada (calcula aporte necessário a partir da idade)
      const rendaPassivaHoje = this.parseCurrency(document.getElementById('rendaPassiva')?.value) || 0;
      const idade = parseInt(document.getElementById('idade')?.value) || 25;
      const idadeAposentar = parseInt(document.getElementById('idadeAposentar')?.value) || 60;
      const anosParaAposentar = Math.max(1, idadeAposentar - idade);
      const meses = anosParaAposentar * 12;

      // Capital necessário hoje para gerar a renda passiva desejada
      const capitalHoje = rendaPassivaHoje / rentabilidadeMensal;

      // Capital nominal necessário na data da aposentadoria (ajustado pela inflação)
      const capitalNominal = capitalHoje * Math.pow(1 + inflacaoAnual, anosParaAposentar);

      // Calcular aporte mensal necessário para atingir o capital nominal (usando busca binária existente)
      const aporteNecessario = this.calcularAporteNecessario(capitalNominal, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      // Simular com o aporte encontrado para obter projeção ano a ano
      const projecao = this.simularInvestimento(aporteNecessario, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      // Também calcular com margem de 30%
      const rendaComMargem = rendaPassivaHoje * 1.3;
      const capitalComMargem = (rendaComMargem / rentabilidadeMensal) * Math.pow(1 + inflacaoAnual, anosParaAposentar);
      const aporteComMargem = this.calcularAporteNecessario(capitalComMargem, meses, rentabilidadeMensal, inflacaoMensal, valorInicial);

      // Simular para resultado exato (compatibilidade com showResult existente)
      const resultadoExato = this.calcularIndependenciaFinanceira(
        rendaPassivaHoje, aporteNecessario, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial
      );
      const resultadoMargem = this.calcularIndependenciaFinanceira(
        rendaComMargem, aporteComMargem, rentabilidadeMensal, inflacaoMensal, inflacaoAnual, valorInicial
      );

      this.showResult({
        mode: 4,
        rendaPassivaHoje,
        rendaComMargem,
        aporteInicial: aporteNecessario,
        aporteComMargem,
        valorInicial,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal,
        capitalHoje,
        idade,
        idadeAposentar,
        anosParaAposentar,
        resultadoExato,
        resultadoMargem
      });
    } else if (this.currentMode === 5) {
      // Modo 5: Venda parcelada — calcular quantas parcelas equivalem ao valor à vista
      const valorVista = this.parseCurrency(document.getElementById('valorVistaParc')?.value) || 0;
      const entrada = this.parseCurrency(document.getElementById('entradaParc')?.value) || 0;
      const parcela = this.parseCurrency(document.getElementById('parcelaValor')?.value) || 0;
      const taxaMensal = this.parsePercentage(document.getElementById('taxaCDI')?.value) / 100 || 0.01;
      const reajusteAnual = this.parsePercentage(document.getElementById('reajusteParc')?.value) / 100 || 0.045;

      if (valorVista <= 0 || parcela <= 0) return;

      const diferenca = valorVista - entrada;
      if (diferenca <= 0) {
        this.showResult({ mode: 5, tipo: 'coberto', valorVista, entrada });
        return;
      }

      // 1) Calcular número de parcelas FIXAS pelo valor presente (desconto = CDI)
      let pvAcumulado = 0;
      let numParcelas = 0;
      const maxParcelas = 600;

      for (let i = 1; i <= maxParcelas; i++) {
        pvAcumulado += parcela / Math.pow(1 + taxaMensal, i);
        if (pvAcumulado >= diferenca) {
          numParcelas = i;
          break;
        }
      }

      // 2) Calcular total SEM reajuste (parcelas fixas)
      const totalSemReajuste = entrada + numParcelas * parcela;

      // 3) Calcular total COM reajuste anual (IGP-M sobre as mesmas N parcelas)
      let totalComReajuste = entrada;
      let parcelaAtual = parcela;
      for (let i = 1; i <= numParcelas; i++) {
        if (i > 1 && (i - 1) % 12 === 0) {
          parcelaAtual = parcela * Math.pow(1 + reajusteAnual, Math.floor((i - 1) / 12));
        }
        totalComReajuste += parcelaAtual;
      }
      const parcelaFinal = parcelaAtual;

      this.showResult({
        mode: 5,
        tipo: numParcelas === 0 ? 'insuficiente' : 'calculado',
        valorVista, entrada, parcela, numParcelas,
        totalSemReajuste, totalComReajuste, parcelaFinal,
        diferenca, taxaMensal, reajusteAnual
      });
    }
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
      // Resultado do modo 4: Aposentadoria (aporte necessário)
      const exato = data.resultadoExato;
      const margem = data.resultadoMargem;

      html = `<h3>Resultado da Aposentadoria</h3>`;

      html += `
          <div class="result-main">
            <div class="result-value">${this.formatCurrency(data.aporteInicial)}${this.t('perMonth')}</div>
            <div class="result-label">Aporte mensal necessário</div>
            <div class="result-margin-inline">${this.formatCurrency(data.aporteComMargem)}${this.t('perMonth')} com margem de segurança de 30%</div>
          </div>

          <div class="result-secondary">
            <div class="result-value-secondary">${this.formatCurrency(data.rendaPassivaHoje)}${this.t('perMonth')}</div>
            <div class="result-label">Renda passiva na aposentadoria</div>
            <div class="result-note">Em valores de hoje, já considerando a inflação</div>
          </div>

          <div class="result-details">
            <div class="result-detail">
              <span class="detail-label">Sua idade atual</span>
              <span class="detail-value">${data.idade} anos</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">Aposentadoria aos</span>
              <span class="detail-value">${data.idadeAposentar} anos</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">Tempo de aportes</span>
              <span class="detail-value">${data.anosParaAposentar} ${this.t('years')}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">${this.t('fiCapitalNeeded')}</span>
              <span class="detail-value">${this.formatCurrency(data.capitalHoje)}</span>
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

          ${exato.saldosPorAno ? this.renderFIProjection(exato.saldosPorAno, exato.aportesPorAno, data.inflacaoAnual) : ''}
        `;
    } else if (data.mode === 5) {
      // Resultado do modo 5: Venda parcelada
      if (data.tipo === 'coberto') {
        html = `<h3>Resultado</h3>
          <div class="result-main">
            <div class="result-value" style="color: var(--bullish)">Entrada cobre o valor</div>
            <div class="result-label">A entrada de ${this.formatCurrency(data.entrada)} já cobre ${this.formatCurrency(data.valorVista)}</div>
          </div>`;
      } else if (data.tipo === 'insuficiente') {
        html = `<h3>Resultado</h3>
          <div class="result-main result-warning">
            <div class="result-value">Proposta inviável</div>
            <div class="result-label">Mesmo em 50 anos, as parcelas não compensam o valor à vista</div>
            <div class="result-note">Aumente o valor da parcela ou da entrada.</div>
          </div>`;
      } else {
        const anos = Math.floor(data.numParcelas / 12);
        const meses = data.numParcelas % 12;
        const tempoStr = anos > 0
          ? `${anos} ano${anos > 1 ? 's' : ''}${meses > 0 ? ` e ${meses} ${meses > 1 ? 'meses' : 'mês'}` : ''}`
          : `${meses} ${meses > 1 ? 'meses' : 'mês'}`;

        html = `<h3>Resultado da Negociação</h3>
          <div class="result-main">
            <div class="result-value">${data.numParcelas} parcelas</div>
            <div class="result-label">${tempoStr} de parcelamento</div>
            <div class="result-note">Para que entrada + parcelas equivalham a ${this.formatCurrency(data.valorVista)} à vista (considerando rendimento de ${(data.taxaMensal * 100).toFixed(1)}% a.m.)</div>
          </div>

          <div class="result-details">
            <div class="result-detail">
              <span class="detail-label">Entrada</span>
              <span class="detail-value">${this.formatCurrency(data.entrada)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">Parcela mensal</span>
              <span class="detail-value">${this.formatCurrency(data.parcela)}/mês</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">Total sem reajuste</span>
              <span class="detail-value">${this.formatCurrency(data.totalSemReajuste)}</span>
            </div>
            <div class="result-detail">
              <span class="detail-label">Total com reajuste ${(data.reajusteAnual * 100).toFixed(1)}% a.a.</span>
              <span class="detail-value highlight">${this.formatCurrency(data.totalComReajuste)}</span>
            </div>
          </div>

          <div class="result-secondary">
            <div class="result-value-secondary" style="color: var(--bullish)">Proposta equivalente ao valor à vista</div>
            <div class="result-note">Com o reajuste anual de ${(data.reajusteAnual * 100).toFixed(1)}%, a parcela começa em ${this.formatCurrency(data.parcela)} e termina em ${this.formatCurrency(data.parcelaFinal)}. Você recebe ${this.formatCurrency(data.totalComReajuste - data.totalSemReajuste)} a mais do que sem reajuste, protegendo contra a inflação.</div>
          </div>
        `;
      }
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
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Calculadora.init();
});
