/**
 * Simulador: Financiamento Imobiliário vs Investimento — v2
 * Rico aos Poucos
 *
 * Modos: Convencional | Leilão
 * Slider-based inputs, card results, inline SVG chart
 * Real-time updates, no Chart.js dependency
 */

(function () {
  'use strict';

  /* ============================================================
     DEFAULTS & PRESETS
     ============================================================ */
  const DEFAULTS = {
    convencional: {
      valorMercado: 500000,
      entrada: 20,
      valorizacao: 6,
      yieldAluguel: 6,
      rendimentoInv: 12,
      horizonte: 30,
      ehTerreno: false,
      taxaFin: 9,
      prazoFin: 30,
      sistema: 'sac'
    },
    leilao: {
      valorMercado: 500000,
      valorArrematacao: 350000,
      entrada: 25,
      parcelas: 30,
      correcao: 'ipca',
      custas: 30000,
      mesesSemImovel: 4,
      yieldAluguel: 6,
      valorizacao: 7,
      rendimentoInv: 13.5,
      horizonte: 10,
      ehTerreno: false
    }
  };

  const PRESETS = {
    convencional: {
      conservador: { valorMercado: 500000, entrada: 20, valorizacao: 5, yieldAluguel: 5, rendimentoInv: 10, horizonte: 30, taxaFin: 10, prazoFin: 30, sistema: 'sac' },
      moderado:    { valorMercado: 500000, entrada: 20, valorizacao: 6, yieldAluguel: 6, rendimentoInv: 12, horizonte: 30, taxaFin: 9, prazoFin: 30, sistema: 'sac' },
      otimista:    { valorMercado: 500000, entrada: 20, valorizacao: 8, yieldAluguel: 7, rendimentoInv: 15, horizonte: 25, taxaFin: 8, prazoFin: 25, sistema: 'sac' }
    },
    leilao: {
      conservador: { valorMercado: 500000, valorArrematacao: 375000, entrada: 30, parcelas: 30, correcao: 'ipca', custas: 35000, mesesSemImovel: 6, yieldAluguel: 5, valorizacao: 5, rendimentoInv: 10, horizonte: 10 },
      moderado:    { valorMercado: 500000, valorArrematacao: 350000, entrada: 25, parcelas: 30, correcao: 'ipca', custas: 30000, mesesSemImovel: 4, yieldAluguel: 6, valorizacao: 7, rendimentoInv: 13.5, horizonte: 10 },
      otimista:    { valorMercado: 500000, valorArrematacao: 300000, entrada: 20, parcelas: 12, correcao: 'nenhuma', custas: 25000, mesesSemImovel: 3, yieldAluguel: 7, valorizacao: 9, rendimentoInv: 16, horizonte: 10 }
    }
  };

  const HORIZONTES = [5, 10, 15, 20, 25, 30];

  /* ============================================================
     UTILITY FORMATTERS
     ============================================================ */
  function fmt(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtK(v) {
    if (Math.abs(v) >= 1e6) return 'R$' + (v / 1e6).toFixed(1).replace('.', ',') + 'M';
    if (Math.abs(v) >= 1e3) return 'R$' + (v / 1e3).toFixed(0) + 'k';
    return fmt(v);
  }
  function fmtP(v, d) { return v.toLocaleString('pt-BR', { minimumFractionDigits: d || 1, maximumFractionDigits: d || 1 }) + '%'; }

  function calcPMT(principal, monthlyRate, nMonths) {
    if (monthlyRate === 0) return principal / nMonths;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, nMonths)) / (Math.pow(1 + monthlyRate, nMonths) - 1);
  }

  /* ============================================================
     MAIN MODULE
     ============================================================ */
  const SIM = {
    modo: 'convencional',
    params: {},
    debounceTimer: null,
    lastResult: null,

    init() {
      const container = document.getElementById('financiamento-container');
      if (!container) return;
      this.container = container;
      Object.assign(this.params, DEFAULTS.convencional);
      this.render();
      this.bindEvents();
      this.executar();
    },

    /* ============================================================
       RENDER HTML
       ============================================================ */
    render() {
      this.container.innerHTML = `
        <div class="sim-fin-wrapper">
          <div class="sim-fin-intro">
            <h2>Financiamento vs Investimento</h2>
            <p>Ajuste os controles e compare em tempo real: vale mais financiar um imóvel ou investir o dinheiro?</p>
          </div>

          <!-- Mode toggle -->
          <div class="sim-fin-modo-toggle">
            <button class="sim-fin-modo-btn active" data-modo="convencional"><span class="sim-fin-modo-icon">🏦</span><span>Convencional</span></button>
            <button class="sim-fin-modo-btn" data-modo="leilao"><span class="sim-fin-modo-icon">🔨</span><span>Leilão</span></button>
          </div>

          <!-- Presets -->
          <div class="sim-fin-presets sf-presets-conv">
            <span class="sim-fin-presets-label">Cenários:</span>
            <button class="sim-fin-preset" data-preset="conservador">Conservador</button>
            <button class="sim-fin-preset active" data-preset="moderado">Moderado</button>
            <button class="sim-fin-preset" data-preset="otimista">Otimista</button>
          </div>
          <div class="sim-fin-presets sf-presets-leilao" style="display:none">
            <span class="sim-fin-presets-label">Cenários:</span>
            <button class="sim-fin-preset" data-preset="conservador">Conservador</button>
            <button class="sim-fin-preset active" data-preset="moderado">Moderado</button>
            <button class="sim-fin-preset" data-preset="otimista">Otimista</button>
          </div>

          <!-- CONFIG SECTIONS -->
          <div class="sim-fin-config" id="sf-config">

            <!-- IMOVEL -->
            <div class="sim-fin-section" id="sf-sec-imovel">
              <div class="sim-fin-section-title"><span class="sim-fin-section-icon">🏠</span> Imóvel</div>
              <div class="sim-fin-fields">
                ${this._slider('valorMercado', 'Valor de mercado', 100000, 2000000, 25000, DEFAULTS[this.modo].valorMercado, v => fmt(v))}
                <div id="sf-field-arrematacao" style="display:none">
                  ${this._slider('valorArrematacao', 'Valor arrematação', 50000, 2000000, 25000, DEFAULTS.leilao.valorArrematacao, (v) => {
                    const desc = ((1 - v / (this.params.valorMercado || 500000)) * 100);
                    return fmt(v) + ' <span class="sf-computed">(' + (desc > 0 ? desc.toFixed(0) + '% desconto' : 'sem desconto') + ')</span>';
                  })}
                </div>
                ${this._slider('entrada', 'Entrada', 5, 100, 5, DEFAULTS[this.modo].entrada, v => {
                  const abs = (this.params.valorMercado || 500000) * v / 100;
                  return fmtP(v) + ' <span class="sf-computed">= ' + fmt(abs) + '</span>';
                })}
                ${this._slider('valorizacao', 'Valorização anual', 0, 15, 0.5, DEFAULTS[this.modo].valorizacao, v => fmtP(v) + ' a.a.')}
                <div id="sf-field-yield">
                  ${this._slider('yieldAluguel', 'Yield aluguel anual', 0, 12, 0.5, DEFAULTS[this.modo].yieldAluguel, v => {
                    const mensal = (this.params.valorMercado || 500000) * v / 100 / 12;
                    return fmtP(v) + ' a.a. <span class="sf-computed">= ' + fmt(mensal) + '/mês</span>';
                  })}
                </div>
                ${this._horizonte(DEFAULTS[this.modo].horizonte)}
                <div class="sim-fin-checkbox-wrap">
                  <label><input type="checkbox" id="sf-terreno"> É terreno (sem aluguel)</label>
                </div>
              </div>
            </div>

            <!-- FINANCIAMENTO (convencional only) -->
            <div class="sim-fin-section sf-conv-only" id="sf-sec-fin">
              <div class="sim-fin-section-title"><span class="sim-fin-section-icon">🏦</span> Financiamento</div>
              <div class="sim-fin-fields">
                ${this._slider('taxaFin', 'Taxa de juros', 6, 15, 0.5, DEFAULTS.convencional.taxaFin, v => fmtP(v) + ' a.a.')}
                ${this._slider('prazoFin', 'Prazo', 10, 35, 1, DEFAULTS.convencional.prazoFin, v => v + ' anos')}
                <div class="sim-fin-slider-field">
                  <div class="sim-fin-slider-header">
                    <span class="sim-fin-slider-label">Sistema de amortização</span>
                  </div>
                  <div class="sim-fin-toggle-btns" id="sf-sistema">
                    <button class="sim-fin-toggle-btn active" data-val="sac">SAC</button>
                    <button class="sim-fin-toggle-btn" data-val="price">Price</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- LEILAO (leilao only) -->
            <div class="sim-fin-section sf-section-leilao sf-leilao-only" id="sf-sec-leilao" style="display:none">
              <div class="sim-fin-section-title"><span class="sim-fin-section-icon">🔨</span> Parcelamento e Custas</div>
              <div class="sim-fin-fields">
                <div class="sim-fin-row-2">
                  <div class="sim-fin-slider-field">
                    <div class="sim-fin-slider-header">
                      <span class="sim-fin-slider-label">Parcelas</span>
                    </div>
                    <select class="sim-fin-select" id="sf-parcelas">
                      <option value="1">1x (à vista)</option>
                      <option value="12">12x</option>
                      <option value="24">24x</option>
                      <option value="30" selected>30x</option>
                      <option value="48">48x</option>
                      <option value="60">60x</option>
                    </select>
                  </div>
                  <div class="sim-fin-slider-field">
                    <div class="sim-fin-slider-header">
                      <span class="sim-fin-slider-label">Correção</span>
                    </div>
                    <select class="sim-fin-select" id="sf-correcao">
                      <option value="nenhuma">Nenhuma</option>
                      <option value="igpm">IGP-M (~5,5% a.a.)</option>
                      <option value="ipca" selected>IPCA (~5% a.a.)</option>
                    </select>
                  </div>
                </div>
                ${this._slider('custas', 'Custas totais', 0, 100000, 1000, DEFAULTS.leilao.custas, v => fmt(v) + ' <span class="sf-computed">(leiloeiro + ITBI + cart.)</span>')}
                ${this._slider('mesesSemImovel', 'Meses sem o imóvel', 0, 12, 1, DEFAULTS.leilao.mesesSemImovel, v => v + (v === 1 ? ' mês' : ' meses'))}
              </div>
            </div>

            <!-- INVESTIMENTO -->
            <div class="sim-fin-section sf-section-investimento" id="sf-sec-inv">
              <div class="sim-fin-section-title"><span class="sim-fin-section-icon">📈</span> Investimento Alternativo</div>
              <div class="sim-fin-fields">
                ${this._slider('rendimentoInv', 'Rendimento', 6, 25, 0.5, DEFAULTS[this.modo].rendimentoInv, v => {
                  const mensal = (Math.pow(1 + v / 100, 1/12) - 1) * 100;
                  return fmtP(v) + ' a.a. <span class="sf-computed">= ' + fmtP(mensal) + '/mês</span>';
                })}
              </div>
            </div>

          </div>

          <!-- RESULTS -->
          <div class="sim-fin-results" id="sf-results"></div>
        </div>
      `;
    },

    /* ---------- HTML helpers ---------- */
    _slider(id, label, min, max, step, val, fmtFn) {
      return `
        <div class="sim-fin-slider-field" data-sf-slider="${id}">
          <div class="sim-fin-slider-header">
            <span class="sim-fin-slider-label">${label}</span>
            <span class="sim-fin-slider-value" id="sf-val-${id}">${fmtFn(val)}</span>
          </div>
          <input type="range" class="sim-fin-range" id="sf-${id}" min="${min}" max="${max}" step="${step}" value="${val}">
        </div>`;
    },

    _horizonte(val) {
      const opts = HORIZONTES.map(h => `<option value="${h}"${h === val ? ' selected' : ''}>${h} anos</option>`).join('');
      return `
        <div class="sim-fin-slider-field">
          <div class="sim-fin-slider-header">
            <span class="sim-fin-slider-label">Horizonte</span>
          </div>
          <select class="sim-fin-select" id="sf-horizonte">${opts}</select>
        </div>`;
    },

    /* ============================================================
       EVENTS
       ============================================================ */
    bindEvents() {
      const cfg = document.getElementById('sf-config');
      if (cfg) {
        cfg.addEventListener('input', (e) => {
          if (e.target.classList.contains('sim-fin-range') || e.target.tagName === 'SELECT') {
            this._readParams();
            this._updateSliderDisplays();
            this._debouncedExecutar();
          }
        });
        cfg.addEventListener('change', (e) => {
          if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') {
            this._readParams();
            this._updateSliderDisplays();
            this.executar();
          }
        });
      }

      // Mode toggle
      this.container.querySelectorAll('.sim-fin-modo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.container.querySelectorAll('.sim-fin-modo-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.modo = btn.dataset.modo;
          this._applyDefaults();
          this._toggleSections();
          this._updateSliderDisplays();
          this.executar();
        });
      });

      // Presets
      this.container.querySelectorAll('.sim-fin-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          const wrap = btn.closest('.sim-fin-presets');
          wrap.querySelectorAll('.sim-fin-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._applyPreset(btn.dataset.preset);
        });
      });

      // SAC / Price toggle
      const sistemaWrap = document.getElementById('sf-sistema');
      if (sistemaWrap) {
        sistemaWrap.addEventListener('click', (e) => {
          const btn = e.target.closest('.sim-fin-toggle-btn');
          if (!btn) return;
          sistemaWrap.querySelectorAll('.sim-fin-toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.params.sistema = btn.dataset.val;
          this.executar();
        });
      }

      // Terreno checkbox
      const terreno = document.getElementById('sf-terreno');
      if (terreno) {
        terreno.addEventListener('change', () => {
          this.params.ehTerreno = terreno.checked;
          const yieldField = document.getElementById('sf-field-yield');
          if (yieldField) yieldField.style.display = terreno.checked ? 'none' : '';
          this.executar();
        });
      }
    },

    _debouncedExecutar() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.executar(), 80);
    },

    _readParams() {
      const g = (id) => {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value) : 0;
      };

      this.params.valorMercado = g('sf-valorMercado');
      this.params.entrada = g('sf-entrada');
      this.params.valorizacao = g('sf-valorizacao');
      this.params.yieldAluguel = g('sf-yieldAluguel');
      this.params.rendimentoInv = g('sf-rendimentoInv');
      this.params.horizonte = parseInt(document.getElementById('sf-horizonte')?.value) || 10;
      this.params.ehTerreno = document.getElementById('sf-terreno')?.checked || false;

      if (this.modo === 'convencional') {
        this.params.taxaFin = g('sf-taxaFin');
        this.params.prazoFin = g('sf-prazoFin');
        // sistema is read from toggle click
      } else {
        this.params.valorArrematacao = g('sf-valorArrematacao');
        this.params.parcelas = parseInt(document.getElementById('sf-parcelas')?.value) || 30;
        this.params.correcao = document.getElementById('sf-correcao')?.value || 'nenhuma';
        this.params.custas = g('sf-custas');
        this.params.mesesSemImovel = g('sf-mesesSemImovel');
      }

      // Clamp arrematação to valorMercado
      if (this.modo === 'leilao') {
        const arrSlider = document.getElementById('sf-valorArrematacao');
        if (arrSlider) {
          arrSlider.max = this.params.valorMercado;
          if (this.params.valorArrematacao > this.params.valorMercado) {
            this.params.valorArrematacao = this.params.valorMercado;
            arrSlider.value = this.params.valorArrematacao;
          }
        }
      }
    },

    _updateSliderDisplays() {
      const p = this.params;
      this._setVal('valorMercado', fmt(p.valorMercado));
      this._setVal('entrada', fmtP(p.entrada) + ' <span class="sf-computed">= ' + fmt(p.valorMercado * p.entrada / 100) + '</span>');
      this._setVal('valorizacao', fmtP(p.valorizacao) + ' a.a.');
      const alugMensal = p.valorMercado * p.yieldAluguel / 100 / 12;
      this._setVal('yieldAluguel', fmtP(p.yieldAluguel) + ' a.a. <span class="sf-computed">= ' + fmt(alugMensal) + '/mês</span>');
      const rendMensal = (Math.pow(1 + p.rendimentoInv / 100, 1/12) - 1) * 100;
      this._setVal('rendimentoInv', fmtP(p.rendimentoInv) + ' a.a. <span class="sf-computed">= ' + fmtP(rendMensal) + '/mês</span>');

      if (this.modo === 'convencional') {
        this._setVal('taxaFin', fmtP(p.taxaFin) + ' a.a.');
        this._setVal('prazoFin', p.prazoFin + ' anos');
      } else {
        const desc = ((1 - p.valorArrematacao / p.valorMercado) * 100);
        this._setVal('valorArrematacao', fmt(p.valorArrematacao) + ' <span class="sf-computed">(' + (desc > 0 ? desc.toFixed(0) + '% desconto' : 'sem desconto') + ')</span>');
        this._setVal('custas', fmt(p.custas) + ' <span class="sf-computed">(leiloeiro + ITBI + cart.)</span>');
        this._setVal('mesesSemImovel', p.mesesSemImovel + (p.mesesSemImovel === 1 ? ' mês' : ' meses'));
      }
    },

    _setVal(id, html) {
      const el = document.getElementById('sf-val-' + id);
      if (el) el.innerHTML = html;
    },

    _toggleSections() {
      const isL = this.modo === 'leilao';
      this.container.querySelectorAll('.sf-conv-only').forEach(el => el.style.display = isL ? 'none' : '');
      this.container.querySelectorAll('.sf-leilao-only').forEach(el => el.style.display = isL ? '' : 'none');
      const arrField = document.getElementById('sf-field-arrematacao');
      if (arrField) arrField.style.display = isL ? '' : 'none';
      const pcv = this.container.querySelector('.sf-presets-conv');
      const plj = this.container.querySelector('.sf-presets-leilao');
      if (pcv) pcv.style.display = isL ? 'none' : '';
      if (plj) plj.style.display = isL ? '' : 'none';
    },

    _applyDefaults() {
      const d = DEFAULTS[this.modo];
      Object.assign(this.params, d);
      this._syncSlidersToParams();
    },

    _applyPreset(name) {
      const preset = PRESETS[this.modo]?.[name];
      if (!preset) return;
      Object.assign(this.params, preset);
      this._syncSlidersToParams();
      this._updateSliderDisplays();
      this.executar();
    },

    _syncSlidersToParams() {
      const p = this.params;
      const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      s('sf-valorMercado', p.valorMercado);
      s('sf-entrada', p.entrada);
      s('sf-valorizacao', p.valorizacao);
      s('sf-yieldAluguel', p.yieldAluguel);
      s('sf-rendimentoInv', p.rendimentoInv);
      s('sf-horizonte', p.horizonte);

      const terrenoEl = document.getElementById('sf-terreno');
      if (terrenoEl) terrenoEl.checked = p.ehTerreno || false;
      const yieldField = document.getElementById('sf-field-yield');
      if (yieldField) yieldField.style.display = (p.ehTerreno) ? 'none' : '';

      if (this.modo === 'convencional') {
        s('sf-taxaFin', p.taxaFin);
        s('sf-prazoFin', p.prazoFin);
        const sistemaWrap = document.getElementById('sf-sistema');
        if (sistemaWrap) {
          sistemaWrap.querySelectorAll('.sim-fin-toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.val === (p.sistema || 'sac'));
          });
        }
      } else {
        s('sf-valorArrematacao', p.valorArrematacao);
        s('sf-parcelas', p.parcelas);
        s('sf-correcao', p.correcao);
        s('sf-custas', p.custas);
        s('sf-mesesSemImovel', p.mesesSemImovel);
        // Update arrematação max
        const arrSlider = document.getElementById('sf-valorArrematacao');
        if (arrSlider) arrSlider.max = p.valorMercado;
      }

      this._updateSliderDisplays();
    },

    /* ============================================================
       SIMULATION ENGINE
       ============================================================ */
    executar() {
      const p = this.params;
      if (!p.valorMercado || p.valorMercado <= 0) return;
      if (!p.entrada || p.entrada <= 0 || p.entrada >= 100) return;

      const r = this._simular(p);
      this.lastResult = r;
      this._renderResults(r, p);
    },

    _simular(p) {
      const valorMercado = p.valorMercado;
      const isL = this.modo === 'leilao';
      const totalMeses = (p.horizonte || 10) * 12;
      const txInvMensal = Math.pow(1 + p.rendimentoInv / 100, 1/12) - 1;
      const valMensal = Math.pow(1 + p.valorizacao / 100, 1/12) - 1;
      const yieldMensal = p.ehTerreno ? 0 : (p.yieldAluguel / 100 / 12);

      let entradaAbs, financiado, custasTotal, mesesFin, txFinMensal;

      if (isL) {
        const arr = p.valorArrematacao || valorMercado;
        entradaAbs = arr * (p.entrada / 100);
        financiado = arr - entradaAbs;
        custasTotal = p.custas || 0;
        mesesFin = p.parcelas || 1;

        let txCorr = 0;
        if (p.correcao === 'igpm') txCorr = 5.5;
        else if (p.correcao === 'ipca') txCorr = 5.0;
        txFinMensal = Math.pow(1 + txCorr / 100, 1/12) - 1;
      } else {
        entradaAbs = valorMercado * (p.entrada / 100);
        financiado = valorMercado - entradaAbs;
        custasTotal = 0;
        mesesFin = (p.prazoFin || 30) * 12;
        txFinMensal = Math.pow(1 + (p.taxaFin || 9) / 100, 1/12) - 1;
      }

      // Capital that the investor would have invested instead
      const capitalTotal = isL ? (entradaAbs + custasTotal + financiado) : valorMercado;

      // ---- Cenário A: Investimento puro ----
      let saldoInv = capitalTotal;
      const histInv = [];
      for (let m = 1; m <= totalMeses; m++) {
        saldoInv *= (1 + txInvMensal);
        histInv.push(saldoInv);
      }

      // ---- Cenário B: Imóvel ----
      let valorImovel = valorMercado;
      let saldoResto = capitalTotal - entradaAbs - custasTotal; // leftover invested
      let saldoDevedor = financiado;
      let aluguelBase = valorMercado * yieldMensal;
      let totalParcelas = 0;
      let totalAlugueis = 0;
      let finQuitado = false;
      const mesesImissao = isL ? (p.mesesSemImovel || 0) : 0;

      const pmtPrice = calcPMT(financiado, txFinMensal, mesesFin);
      const amortSAC = financiado / mesesFin;

      const histImovel = [];
      let primeiraParcela = 0;
      let ultimaParcela = 0;

      for (let m = 1; m <= totalMeses; m++) {
        // Valorização do imóvel
        valorImovel *= (1 + valMensal);

        // Reajuste anual do aluguel (pela valorização, ao completar cada ano)
        if (!p.ehTerreno && m > 1 && (m - 1) % 12 === 0) {
          aluguelBase = valorImovel * yieldMensal;
        }

        // Aluguel recebido (0 durante imissão)
        const emImissao = isL && m <= mesesImissao;
        const alugRec = (p.ehTerreno || emImissao) ? 0 : aluguelBase;

        // Parcela do financiamento
        let parcela = 0;
        if (!finQuitado && saldoDevedor > 0.5 && m <= mesesFin) {
          if (isL) {
            // Leilão: parcelas iguais com correção
            if (txFinMensal > 0) saldoDevedor *= (1 + txFinMensal);
            parcela = Math.min(financiado / (p.parcelas || 1), saldoDevedor);
            if (txFinMensal > 0) parcela = calcPMT(financiado, txFinMensal, p.parcelas || 1);
            parcela = Math.min(parcela, saldoDevedor);
            saldoDevedor -= parcela;
          } else if (p.sistema === 'sac') {
            parcela = amortSAC + saldoDevedor * txFinMensal;
            saldoDevedor -= amortSAC;
          } else {
            // Price
            parcela = pmtPrice;
            saldoDevedor -= (pmtPrice - saldoDevedor * txFinMensal);
          }
          if (saldoDevedor < 0.5) { saldoDevedor = 0; finQuitado = true; }
          totalParcelas += parcela;
          if (m === 1) primeiraParcela = parcela;
          ultimaParcela = parcela;
        }

        totalAlugueis += alugRec;

        // Saldo investido restante: rende + aluguel - parcela
        const fluxo = alugRec - parcela;
        saldoResto = saldoResto * (1 + txInvMensal) + fluxo;

        const patrimonioImovel = valorImovel + saldoResto - saldoDevedor;
        histImovel.push(patrimonioImovel);
      }

      const patrimonioFinalInv = histInv[totalMeses - 1];
      const patrimonioFinalImovel = histImovel[totalMeses - 1];
      const anos = totalMeses / 12;

      const roiInv = ((patrimonioFinalInv / capitalTotal) - 1) * 100;
      const roiImovel = ((Math.max(patrimonioFinalImovel, 1) / capitalTotal) - 1) * 100;
      const lucroInv = patrimonioFinalInv - capitalTotal;
      const lucroImovel = patrimonioFinalImovel - capitalTotal;

      const vencedor = patrimonioFinalImovel > patrimonioFinalInv ? 'imovel' : 'investimento';
      const diff = Math.abs(patrimonioFinalImovel - patrimonioFinalInv);

      // Equity instantâneo (leilão)
      let equityInstantaneo = 0;
      if (isL) {
        equityInstantaneo = valorMercado - (p.valorArrematacao || valorMercado) - custasTotal;
      }

      return {
        modo: this.modo,
        totalMeses, anos, capitalTotal, entradaAbs, financiado, custasTotal,
        vencedor, diff,
        inv: { final: patrimonioFinalInv, lucro: lucroInv, roi: roiInv, hist: histInv },
        imovel: {
          final: patrimonioFinalImovel, lucro: lucroImovel, roi: roiImovel, hist: histImovel,
          valorFinal: valorImovel, saldoInvestido: saldoResto, saldoDevedor,
          totalParcelas, totalAlugueis,
          primeiraParcela, ultimaParcela,
          equityInstantaneo
        }
      };
    },

    /* ============================================================
       RENDER RESULTS
       ============================================================ */
    _renderResults(r, p) {
      const el = document.getElementById('sf-results');
      if (!el) return;

      const isL = r.modo === 'leilao';
      const nomeModo = isL ? 'Leilão' : 'Financiamento';
      const nomeVenc = r.vencedor === 'imovel' ? nomeModo + ' + Aluguel' : 'Investimento Puro';
      const classVenc = r.vencedor === 'imovel' ? 'bullish' : 'neutral';
      const iconVenc = r.vencedor === 'imovel' ? (isL ? '🔨' : '🏠') : '📈';

      // Equity card
      let equityHTML = '';
      if (isL && r.imovel.equityInstantaneo > 0) {
        equityHTML = `
          <div class="sim-fin-equity">
            <span class="sim-fin-equity-icon">💰</span>
            <div class="sim-fin-equity-text">
              <strong>Equity instantâneo: ${fmt(r.imovel.equityInstantaneo)}</strong><br>
              Você compraria por ${fmt(p.valorArrematacao)} + ${fmt(r.custasTotal)} de custas um imóvel avaliado em ${fmt(p.valorMercado)}.
            </div>
          </div>`;
      }

      // SVG chart
      const chartHTML = this._buildSVGChart(r);

      // Result cards
      const valorizacaoImovel = r.imovel.valorFinal - p.valorMercado;
      const alugMedio = r.imovel.totalAlugueis / r.totalMeses;

      el.innerHTML = `
        <!-- Vencedor -->
        <div class="sim-fin-vencedor ${classVenc}">
          <span class="sim-fin-vencedor-icon">${iconVenc}</span>
          <div class="sim-fin-vencedor-text">
            <span class="sim-fin-vencedor-label">Vencedor em ${r.anos} anos</span>
            <span class="sim-fin-vencedor-nome">${nomeVenc}</span>
          </div>
          <span class="sim-fin-vencedor-diff">+${fmt(r.diff)}</span>
        </div>

        ${equityHTML}

        <!-- Chart -->
        ${chartHTML}

        <!-- Cards -->
        <div class="sim-fin-cards">
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">📈</span><span class="sim-fin-card-title">Patrimônio Investimento</span></div>
            <div class="sim-fin-card-value">${fmt(r.inv.final)}</div>
            <div class="sim-fin-card-sub">Lucro: <strong>${fmt(r.inv.lucro)}</strong> · ROI: <strong>${fmtP(r.inv.roi, 0)}</strong></div>
          </div>
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">${isL ? '🔨' : '🏠'}</span><span class="sim-fin-card-title">Patrimônio Imóvel</span></div>
            <div class="sim-fin-card-value">${fmt(r.imovel.final)}</div>
            <div class="sim-fin-card-sub">Lucro: <strong>${fmt(r.imovel.lucro)}</strong> · ROI: <strong>${fmtP(r.imovel.roi, 0)}</strong></div>
          </div>
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">💳</span><span class="sim-fin-card-title">Parcela mensal</span></div>
            <div class="sim-fin-card-value">${fmt(r.imovel.primeiraParcela)}</div>
            <div class="sim-fin-card-sub">${r.imovel.ultimaParcela !== r.imovel.primeiraParcela ? 'Última: <strong>' + fmt(r.imovel.ultimaParcela) + '</strong>' : 'Parcela fixa'}</div>
          </div>
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">🏡</span><span class="sim-fin-card-title">Valor final do imóvel</span></div>
            <div class="sim-fin-card-value">${fmt(r.imovel.valorFinal)}</div>
            <div class="sim-fin-card-sub">Valorização: <strong>+${fmt(valorizacaoImovel)}</strong></div>
          </div>
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">🔑</span><span class="sim-fin-card-title">Aluguéis recebidos</span></div>
            <div class="sim-fin-card-value">${fmt(r.imovel.totalAlugueis)}</div>
            <div class="sim-fin-card-sub">Média: <strong>${fmt(alugMedio)}/mês</strong></div>
          </div>
          <div class="sim-fin-card">
            <div class="sim-fin-card-header"><span class="sim-fin-card-icon">💰</span><span class="sim-fin-card-title">Saldo investido restante</span></div>
            <div class="sim-fin-card-value ${r.imovel.saldoInvestido < 0 ? 'negative' : ''}">${fmt(r.imovel.saldoInvestido)}</div>
            <div class="sim-fin-card-sub">${r.imovel.saldoDevedor > 0.5 ? 'Dívida restante: <strong>' + fmt(r.imovel.saldoDevedor) + '</strong>' : 'Financiamento quitado'}</div>
          </div>
        </div>

        <!-- Como funciona -->
        <div class="sim-fin-como">
          <h4>Como chegamos nesse valor</h4>
          <ul class="sim-fin-como-steps">
            ${this._buildExplanation(r, p)}
          </ul>
          <p class="sim-fin-disclaimer">Simulação educacional simplificada. Não constitui recomendação de investimento. Valores não consideram IR sobre rendimentos.</p>
        </div>
      `;
    },

    /* ============================================================
       SVG CHART
       ============================================================ */
    _buildSVGChart(r) {
      const W = 800, H = 240, PAD_L = 55, PAD_R = 15, PAD_T = 15, PAD_B = 30;
      const chartW = W - PAD_L - PAD_R;
      const chartH = H - PAD_T - PAD_B;

      const dInv = r.inv.hist;
      const dImov = r.imovel.hist;
      const n = dInv.length;
      if (n < 2) return '';

      // Sample points (max ~80)
      const step = Math.max(1, Math.floor(n / 80));
      const pts = [];
      for (let i = 0; i < n; i++) {
        if (i % step === 0 || i === n - 1) {
          pts.push({ m: i + 1, inv: dInv[i], imov: dImov[i] });
        }
      }

      const allVals = pts.flatMap(p => [p.inv, p.imov]);
      const minV = Math.min(...allVals) * 0.95;
      const maxV = Math.max(...allVals) * 1.05;
      const rangeV = maxV - minV || 1;

      const x = (idx) => PAD_L + (idx / (pts.length - 1)) * chartW;
      const y = (val) => PAD_T + chartH - ((val - minV) / rangeV) * chartH;

      // Build path strings
      let pathInv = '', pathImov = '';
      pts.forEach((p, i) => {
        const cmd = i === 0 ? 'M' : 'L';
        pathInv += `${cmd}${x(i).toFixed(1)},${y(p.inv).toFixed(1)} `;
        pathImov += `${cmd}${x(i).toFixed(1)},${y(p.imov).toFixed(1)} `;
      });

      // Y axis labels (5 ticks)
      let yLabels = '';
      let gridLines = '';
      for (let i = 0; i <= 4; i++) {
        const val = minV + (rangeV * i / 4);
        const yPos = y(val);
        yLabels += `<text x="${PAD_L - 8}" y="${yPos + 3}" text-anchor="end" fill="#6e7681" font-size="10">${fmtK(val)}</text>`;
        gridLines += `<line x1="${PAD_L}" y1="${yPos}" x2="${W - PAD_R}" y2="${yPos}" stroke="#30363d" stroke-width="0.5" stroke-dasharray="3,3"/>`;
      }

      // X axis labels
      let xLabels = '';
      const labelInterval = Math.max(1, Math.floor(pts.length / 6));
      pts.forEach((p, i) => {
        if (i % labelInterval === 0 || i === pts.length - 1) {
          const anos = Math.floor(p.m / 12);
          const label = anos > 0 ? anos + 'a' : p.m + 'm';
          xLabels += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle" fill="#6e7681" font-size="10">${label}</text>`;
        }
      });

      // Final value markers
      const lastPt = pts[pts.length - 1];
      const finalInvY = y(lastPt.inv);
      const finalImovY = y(lastPt.imov);
      const finalX = x(pts.length - 1);

      return `
        <div class="sim-fin-chart-box">
          <div class="sim-fin-chart-title">Evolução patrimonial</div>
          <div class="sim-fin-svg-wrap">
            <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <!-- Grid -->
              ${gridLines}
              <!-- Axes labels -->
              ${yLabels}
              ${xLabels}
              <!-- Lines -->
              <path d="${pathInv}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="${pathImov}" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- End dots -->
              <circle cx="${finalX}" cy="${finalInvY}" r="4" fill="#3b82f6"/>
              <circle cx="${finalX}" cy="${finalImovY}" r="4" fill="#22c55e"/>
              <!-- End labels -->
              <text x="${finalX - 8}" y="${finalInvY - 8}" text-anchor="end" fill="#3b82f6" font-size="10" font-weight="600">${fmtK(lastPt.inv)}</text>
              <text x="${finalX - 8}" y="${finalImovY - 8}" text-anchor="end" fill="#22c55e" font-size="10" font-weight="600">${fmtK(lastPt.imov)}</text>
            </svg>
          </div>
          <div class="sim-fin-chart-legend">
            <span class="sim-fin-legend-item"><span class="sim-fin-legend-dot" style="background:#3b82f6"></span> Investimento</span>
            <span class="sim-fin-legend-item"><span class="sim-fin-legend-dot" style="background:#22c55e"></span> ${r.modo === 'leilao' ? 'Leilão' : 'Financiamento'}</span>
          </div>
        </div>`;
    },

    /* ============================================================
       "COMO FUNCIONA" EXPLANATION
       ============================================================ */
    _buildExplanation(r, p) {
      const items = [];
      const isL = r.modo === 'leilao';
      const nomeModo = isL ? 'leilão' : 'financiamento';

      // 1. Capital
      items.push(`Você tem <strong>${fmt(r.capitalTotal)}</strong> para investir.`);

      // 2. Cenário investimento
      const rendMensal = (Math.pow(1 + p.rendimentoInv / 100, 1/12) - 1) * 100;
      items.push(`<strong>Cenário A (Investimento Puro):</strong> aplica tudo a <strong>${fmtP(p.rendimentoInv)} a.a.</strong> (${fmtP(rendMensal)}/mês). Em ${r.anos} anos vira <strong>${fmt(r.inv.final)}</strong>.`);

      // 3. Cenário imóvel - entrada
      if (isL) {
        items.push(`<strong>Cenário B (${nomeModo.charAt(0).toUpperCase() + nomeModo.slice(1)}):</strong> arremata por <strong>${fmt(p.valorArrematacao)}</strong> (${fmtP((1 - p.valorArrematacao / p.valorMercado) * 100)} de desconto) um imóvel de <strong>${fmt(p.valorMercado)}</strong>. Paga <strong>${fmt(r.entradaAbs)}</strong> de entrada + <strong>${fmt(r.custasTotal)}</strong> de custas.`);
      } else {
        items.push(`<strong>Cenário B (${nomeModo.charAt(0).toUpperCase() + nomeModo.slice(1)}):</strong> compra o imóvel de <strong>${fmt(p.valorMercado)}</strong> com entrada de <strong>${fmt(r.entradaAbs)}</strong> (${fmtP(p.entrada)}). Financia <strong>${fmt(r.financiado)}</strong> a ${fmtP(p.taxaFin)} a.a. em ${p.prazoFin} anos (${p.sistema?.toUpperCase()}).`);
      }

      // 4. Parcela
      if (r.imovel.primeiraParcela > 0) {
        if (r.imovel.primeiraParcela !== r.imovel.ultimaParcela) {
          items.push(`Parcela inicial: <strong>${fmt(r.imovel.primeiraParcela)}</strong>, última: <strong>${fmt(r.imovel.ultimaParcela)}</strong>. Total pago em parcelas: <strong>${fmt(r.imovel.totalParcelas)}</strong>.`);
        } else {
          items.push(`Parcela fixa de <strong>${fmt(r.imovel.primeiraParcela)}</strong>. Total pago: <strong>${fmt(r.imovel.totalParcelas)}</strong>.`);
        }
      }

      // 5. Aluguel
      if (!p.ehTerreno && r.imovel.totalAlugueis > 0) {
        items.push(`O imóvel gera aluguel a <strong>${fmtP(p.yieldAluguel)} a.a.</strong> do valor. Total recebido em ${r.anos} anos: <strong>${fmt(r.imovel.totalAlugueis)}</strong>. Os aluguéis cobrem parcelas e o excedente é reinvestido.`);
      }

      // 6. Valorização
      const valoriz = r.imovel.valorFinal - p.valorMercado;
      items.push(`O imóvel valoriza <strong>${fmtP(p.valorizacao)} a.a.</strong> e passa de ${fmt(p.valorMercado)} para <strong>${fmt(r.imovel.valorFinal)}</strong> (+${fmt(valoriz)}).`);

      // 7. Saldo investido restante
      if (r.imovel.saldoInvestido < 0) {
        items.push(`<span class="sf-step-warn-inline">Atenção:</span> o saldo investido ficou <strong>negativo</strong> (${fmt(r.imovel.saldoInvestido)}), indicando que as parcelas superaram aluguel + rendimentos. Seria necessário aportar renda extra.`);
      }

      // 8. Resultado
      if (r.vencedor === 'imovel') {
        items.push(`<strong>Resultado:</strong> patrimônio com imóvel (<strong>${fmt(r.imovel.final)}</strong>) supera investimento puro (<strong>${fmt(r.inv.final)}</strong>) em <strong>${fmt(r.diff)}</strong>. A alavancagem do ${nomeModo} e a renda de aluguel fizeram a diferença.`);
      } else {
        items.push(`<strong>Resultado:</strong> investimento puro (<strong>${fmt(r.inv.final)}</strong>) supera o imóvel (<strong>${fmt(r.imovel.final)}</strong>) em <strong>${fmt(r.diff)}</strong>. O rendimento de ${fmtP(p.rendimentoInv)} a.a. compensou mais que a alavancagem imobiliária.`);
      }

      return items.map((txt, i) => {
        const isWarn = txt.includes('sf-step-warn-inline') || txt.includes('negativo');
        return `<li${isWarn ? ' class="sf-step-warn"' : ''}>${txt}</li>`;
      }).join('');
    }
  };

  /* ============================================================
     INIT
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SIM.init());
  } else {
    SIM.init();
  }
})();
