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
    rentabilidadeMensal: 1.0, // % ao mês
    inflacaoAnual: 7.0 // % ao ano
  },

  // Traduções
  translations: {
    'pt-BR': {
      mode1Title: 'Quanto preciso investir por mês?',
      mode1Desc: 'Descubra o aporte mensal necessário para atingir seu objetivo',
      mode2Title: 'Quanto vou acumular?',
      mode2Desc: 'Descubra quanto terá no futuro com seus aportes mensais',
      goalLabel: 'Objetivo (valor em reais de hoje)',
      goalPlaceholder: 'Ex: 300000',
      timeLabel: 'Tempo de investimento',
      years: 'anos',
      months: 'meses',
      monthlyLabel: 'Aporte mensal inicial',
      monthlyPlaceholder: 'Ex: 1000',
      returnLabel: 'Rentabilidade mensal',
      returnPlaceholder: 'Ex: 1.0',
      inflationLabel: 'Inflação anual estimada',
      calculate: 'Calcular',
      resultTitle: 'Resultado',
      monthlyNeeded: 'Aporte mensal inicial necessário',
      monthlyNeededNote: 'Esse valor será reajustado mensalmente pela inflação',
      finalAmount: 'Montante final (nominal)',
      realValue: 'Valor equivalente hoje',
      realValueNote: 'Poder de compra em valores de hoje',
      totalInvested: 'Total investido',
      totalReturn: 'Rendimento total',
      inflationNote: 'Os aportes começam em {valor} e são reajustados pela inflação de {inflacao}% ao ano. No último mês, seu aporte será de aproximadamente {valorFinal}.',
      goalNote: 'Seu objetivo de {objetivo} em valores de hoje equivale a {objetivoAjustado} em {anos} anos, considerando a inflação.',
      projectionTitle: 'Projeção ano a ano',
      yearCol: 'Ano',
      balanceCol: 'Saldo',
      monthlyCol: 'Aporte/mês',
      realCol: 'Valor real'
    },
    'en': {
      mode1Title: 'How much do I need to invest per month?',
      mode1Desc: 'Discover the monthly contribution needed to reach your goal',
      mode2Title: 'How much will I accumulate?',
      mode2Desc: 'Discover how much you will have in the future with your monthly contributions',
      goalLabel: 'Goal (value in today\'s dollars)',
      goalPlaceholder: 'Ex: 300000',
      timeLabel: 'Investment time',
      years: 'years',
      months: 'months',
      monthlyLabel: 'Initial monthly contribution',
      monthlyPlaceholder: 'Ex: 1000',
      returnLabel: 'Monthly return',
      returnPlaceholder: 'Ex: 1.0',
      inflationLabel: 'Estimated annual inflation',
      calculate: 'Calculate',
      resultTitle: 'Result',
      monthlyNeeded: 'Required initial monthly contribution',
      monthlyNeededNote: 'This value will be adjusted monthly for inflation',
      finalAmount: 'Final amount (nominal)',
      realValue: 'Equivalent value today',
      realValueNote: 'Purchasing power in today\'s values',
      totalInvested: 'Total invested',
      totalReturn: 'Total return',
      inflationNote: 'Contributions start at {valor} and are adjusted for inflation of {inflacao}% per year. In the last month, your contribution will be approximately {valorFinal}.',
      goalNote: 'Your goal of {objetivo} in today\'s values equals {objetivoAjustado} in {anos} years, considering inflation.',
      projectionTitle: 'Year by year projection',
      yearCol: 'Year',
      balanceCol: 'Balance',
      monthlyCol: 'Monthly',
      realCol: 'Real value'
    },
    'es': {
      mode1Title: '¿Cuánto necesito invertir por mes?',
      mode1Desc: 'Descubre el aporte mensual necesario para alcanzar tu objetivo',
      mode2Title: '¿Cuánto voy a acumular?',
      mode2Desc: 'Descubre cuánto tendrás en el futuro con tus aportes mensuales',
      goalLabel: 'Objetivo (valor en pesos de hoy)',
      goalPlaceholder: 'Ej: 300000',
      timeLabel: 'Tiempo de inversión',
      years: 'años',
      months: 'meses',
      monthlyLabel: 'Aporte mensual inicial',
      monthlyPlaceholder: 'Ej: 1000',
      returnLabel: 'Rentabilidad mensual',
      returnPlaceholder: 'Ej: 1.0',
      inflationLabel: 'Inflación anual estimada',
      calculate: 'Calcular',
      resultTitle: 'Resultado',
      monthlyNeeded: 'Aporte mensual inicial necesario',
      monthlyNeededNote: 'Este valor será reajustado mensualmente por la inflación',
      finalAmount: 'Monto final (nominal)',
      realValue: 'Valor equivalente hoy',
      realValueNote: 'Poder adquisitivo en valores de hoy',
      totalInvested: 'Total invertido',
      totalReturn: 'Rendimiento total',
      inflationNote: 'Los aportes comienzan en {valor} y se ajustan por la inflación de {inflacao}% anual. En el último mes, tu aporte será aproximadamente {valorFinal}.',
      goalNote: 'Tu objetivo de {objetivo} en valores de hoy equivale a {objetivoAjustado} en {anos} años, considerando la inflación.',
      projectionTitle: 'Proyección año a año',
      yearCol: 'Año',
      balanceCol: 'Saldo',
      monthlyCol: 'Aporte/mes',
      realCol: 'Valor real'
    }
  },

  currentLang: 'pt-BR',
  currentMode: 1, // 1 = calcular aporte, 2 = calcular montante

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
      </div>

      <div class="calc-form" id="calcForm">
        ${this.renderForm()}
      </div>

      <div class="calc-result" id="calcResult" style="display: none;">
      </div>
    `;
  },

  renderForm() {
    const d = this.defaults;

    if (this.currentMode === 1) {
      // Modo: Calcular aporte necessário
      return `
        <div class="calc-field">
          <label for="objetivo">${this.t('goalLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="number" id="objetivo" value="${d.objetivo}" placeholder="${this.t('goalPlaceholder')}">
          </div>
        </div>

        <div class="calc-field">
          <label for="tempo">${this.t('timeLabel')}</label>
          <div class="input-row">
            <div class="input-group">
              <input type="number" id="tempoAnos" value="${d.tempoAnos}" min="1" max="50">
              <span class="input-suffix">${this.t('years')}</span>
            </div>
          </div>
        </div>

        <div class="calc-field">
          <label for="rentabilidade">${this.t('returnLabel')}</label>
          <div class="input-group">
            <input type="number" id="rentabilidade" value="${d.rentabilidadeMensal}" step="0.1" min="0" max="10">
            <span class="input-suffix">% / ${this.t('months').slice(0, 3)}</span>
          </div>
        </div>

        <div class="calc-field">
          <label for="inflacao">${this.t('inflationLabel')}</label>
          <div class="input-group">
            <input type="number" id="inflacao" value="${d.inflacaoAnual}" step="0.1" min="0" max="30">
            <span class="input-suffix">% / ${this.t('years').slice(0, 3)}</span>
          </div>
        </div>

        <button class="calc-btn" id="btnCalcular">${this.t('calculate')}</button>
      `;
    } else {
      // Modo: Calcular montante final
      return `
        <div class="calc-field">
          <label for="aporte">${this.t('monthlyLabel')}</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input type="number" id="aporte" value="${d.aporteMensal}" placeholder="${this.t('monthlyPlaceholder')}">
          </div>
        </div>

        <div class="calc-field">
          <label for="tempo">${this.t('timeLabel')}</label>
          <div class="input-row">
            <div class="input-group">
              <input type="number" id="tempoAnos" value="${d.tempoAnos}" min="1" max="50">
              <span class="input-suffix">${this.t('years')}</span>
            </div>
          </div>
        </div>

        <div class="calc-field">
          <label for="rentabilidade">${this.t('returnLabel')}</label>
          <div class="input-group">
            <input type="number" id="rentabilidade" value="${d.rentabilidadeMensal}" step="0.1" min="0" max="10">
            <span class="input-suffix">% / ${this.t('months').slice(0, 3)}</span>
          </div>
        </div>

        <div class="calc-field">
          <label for="inflacao">${this.t('inflationLabel')}</label>
          <div class="input-group">
            <input type="number" id="inflacao" value="${d.inflacaoAnual}" step="0.1" min="0" max="30">
            <span class="input-suffix">% / ${this.t('years').slice(0, 3)}</span>
          </div>
        </div>

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
    document.querySelectorAll('.calc-mode-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mode) === mode);
    });

    // Re-renderizar form
    const form = document.getElementById('calcForm');
    if (form) {
      form.innerHTML = this.renderForm();
    }

    // Esconder resultado anterior
    const result = document.getElementById('calcResult');
    if (result) {
      result.style.display = 'none';
    }
  },

  calculate() {
    const tempoAnos = parseFloat(document.getElementById('tempoAnos')?.value) || 10;
    const rentabilidadeMensal = parseFloat(document.getElementById('rentabilidade')?.value) / 100 || 0.01;
    const inflacaoAnual = parseFloat(document.getElementById('inflacao')?.value) / 100 || 0.07;

    // Inflação mensal: (1 + anual)^(1/12) - 1
    const inflacaoMensal = Math.pow(1 + inflacaoAnual, 1/12) - 1;
    const meses = tempoAnos * 12;

    if (this.currentMode === 1) {
      // Calcular aporte necessário para atingir objetivo
      const objetivoHoje = parseFloat(document.getElementById('objetivo')?.value) || 300000;

      // Objetivo ajustado pela inflação (valor nominal futuro)
      const objetivoAjustado = objetivoHoje * Math.pow(1 + inflacaoAnual, tempoAnos);

      // Calcular aporte inicial necessário usando busca binária
      const aporteInicial = this.calcularAporteNecessario(objetivoAjustado, meses, rentabilidadeMensal, inflacaoMensal);

      this.showResult({
        mode: 1,
        aporteInicial,
        objetivoHoje,
        objetivoAjustado,
        tempoAnos,
        meses,
        rentabilidadeMensal,
        inflacaoAnual,
        inflacaoMensal
      });

    } else {
      // Calcular montante final dado um aporte
      const aporteInicial = parseFloat(document.getElementById('aporte')?.value) || 1000;

      const resultado = this.simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal);

      // Valor real (poder de compra hoje)
      const valorReal = resultado.montanteFinal / Math.pow(1 + inflacaoAnual, tempoAnos);

      this.showResult({
        mode: 2,
        aporteInicial,
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
    }
  },

  calcularAporteNecessario(objetivoFinal, meses, rentabilidadeMensal, inflacaoMensal) {
    // Busca binária para encontrar o aporte inicial
    let min = 0;
    let max = objetivoFinal;
    let aporteInicial = 0;

    for (let i = 0; i < 100; i++) {
      aporteInicial = (min + max) / 2;
      const resultado = this.simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal);

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

  simularInvestimento(aporteInicial, meses, rentabilidadeMensal, inflacaoMensal) {
    let saldo = 0;
    let totalInvestido = 0;
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
    } else {
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
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  Calculadora.init();
});
