/**
 * Simulador: Financiamento Imobiliário vs Investimento — v3
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
      valorizacao: 7,
      yieldAluguel: 4.5,
      rendimentoInv: 12,
      ehTerreno: false,
      taxaFin: 10,
      prazoFin: 30,
      sistema: 'sac'
    },
    leilao: {
      valorMercado: 500000,
      valorArrematacao: 350000,
      entrada: 25,
      parcelas: 30,
      correcao: 'ipca',
      comissao: 5,
      itbi: 3,
      escrituracao: 2000,
      custosAdicionais: 2000,
      descontoVenda: 10,
      mesesSemImovel: 4,
      yieldAluguel: 6,
      valorizacao: 7,
      rendimentoInv: 13.5,
      ehTerreno: false
    }
  };

  const PRESETS = {
    convencional: {
      conservador: { valorMercado: 500000, entrada: 20, valorizacao: 5, yieldAluguel: 5, rendimentoInv: 10, taxaFin: 10, prazoFin: 30, sistema: 'sac' },
      moderado:    { valorMercado: 500000, entrada: 20, valorizacao: 6, yieldAluguel: 6, rendimentoInv: 12, taxaFin: 9, prazoFin: 30, sistema: 'sac' },
      otimista:    { valorMercado: 500000, entrada: 20, valorizacao: 8, yieldAluguel: 7, rendimentoInv: 15, taxaFin: 8, prazoFin: 25, sistema: 'sac' }
    },
    leilao: {
      conservador: { valorMercado: 500000, valorArrematacao: 375000, entrada: 30, parcelas: 30, correcao: 'ipca', comissao: 5, itbi: 3, escrituracao: 3000, custosAdicionais: 5000, descontoVenda: 15, mesesSemImovel: 6, yieldAluguel: 5, valorizacao: 5, rendimentoInv: 10 },
      moderado:    { valorMercado: 500000, valorArrematacao: 350000, entrada: 25, parcelas: 30, correcao: 'ipca', comissao: 5, itbi: 3, escrituracao: 2000, custosAdicionais: 2000, descontoVenda: 10, mesesSemImovel: 4, yieldAluguel: 6, valorizacao: 7, rendimentoInv: 13.5 },
      otimista:    { valorMercado: 500000, valorArrematacao: 300000, entrada: 20, parcelas: 12, correcao: 'nenhuma', comissao: 5, itbi: 3, escrituracao: 1500, custosAdicionais: 1000, descontoVenda: 5, mesesSemImovel: 3, yieldAluguel: 7, valorizacao: 9, rendimentoInv: 16 }
    }
  };

  // Reajuste anual do aluguel: IGP-M médio histórico (últimos 20 anos, excl. outliers 2020/2021)
  const REAJUSTE_ALUGUEL = 4.5;

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
                  const base = this.modo === 'leilao' ? (this.params.valorArrematacao || 350000) : (this.params.valorMercado || 500000);
                  const abs = base * v / 100;
                  return fmtP(v) + ' <span class="sf-computed">= ' + fmt(abs) + '</span>';
                })}
                ${this._slider('valorizacao', 'Valorização anual', 0, 15, 0.5, DEFAULTS[this.modo].valorizacao, v => fmtP(v) + ' a.a.')}
                <div id="sf-field-yield">
                  ${this._slider('yieldAluguel', 'Yield aluguel anual', 0, 12, 0.5, DEFAULTS[this.modo].yieldAluguel, v => {
                    const mensal = (this.params.valorMercado || 500000) * v / 100 / 12;
                    return fmtP(v) + ' a.a. <span class="sf-computed">= ' + fmt(mensal) + '/mês</span>';
                  })}
                </div>
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
                      <option value="igpm">IGP-M (média 7,2% a.a.)</option>
                      <option value="ipca" selected>IPCA (média 5,2% a.a.)</option>
                    </select>
                  </div>
                  ${this._slider('taxaFixa', 'Taxa fixa adicional', 0, 5, 0.5, 0, v => {
                    const corr = document.getElementById('sf-correcao')?.value;
                    const base = corr === 'igpm' ? 'IGP-M' : corr === 'ipca' ? 'IPCA' : '';
                    if (v === 0 && !base) return 'Nenhuma';
                    if (v === 0) return base + ' apenas';
                    if (!base) return fmtP(v) + ' a.a. fixa';
                    return base + ' + ' + fmtP(v) + ' a.a.';
                  })}
                </div>
                ${this._slider('comissao', 'Comissão leiloeiro', 0, 10, 1, DEFAULTS.leilao.comissao, v => {
                  const arr = this.params.valorArrematacao || DEFAULTS.leilao.valorArrematacao;
                  const val = arr * v / 100;
                  return fmtP(v, 0) + ' <span class="sf-computed">= ' + fmt(val) + '</span>';
                })}
                ${this._slider('itbi', 'ITBI', 0, 5, 0.5, DEFAULTS.leilao.itbi, v => {
                  const arr = this.params.valorArrematacao || DEFAULTS.leilao.valorArrematacao;
                  const val = arr * v / 100;
                  return fmtP(v) + ' <span class="sf-computed">= ' + fmt(val) + '</span>';
                })}
                ${this._slider('escrituracao', 'Escrituração e cartório', 0, 10000, 500, DEFAULTS.leilao.escrituracao, v => fmt(v))}
                ${this._sliderWithSub('custosAdicionais', 'Custos adicionais', '(regularização, imissão, etc.)', 0, 20000, 1000, DEFAULTS.leilao.custosAdicionais, v => fmt(v))}
                ${this._slider('mesesSemImovel', 'Meses sem o imóvel', 0, 12, 1, DEFAULTS.leilao.mesesSemImovel, v => v + (v === 1 ? ' mês' : ' meses'))}
                ${this._slider('descontoVenda', 'Desconto para venda rápida', 0, 20, 1, DEFAULTS.leilao.descontoVenda, v => {
                  const vm = this.params.valorMercado || DEFAULTS.leilao.valorMercado;
                  const venderia = vm * (1 - v / 100);
                  return fmtP(v, 0) + ' <span class="sf-computed">— venderia por ' + fmt(venderia) + '</span>';
                })}
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

    _sliderWithSub(id, label, subtitle, min, max, step, val, fmtFn) {
      return `
        <div class="sim-fin-slider-field" data-sf-slider="${id}">
          <div class="sim-fin-slider-header">
            <span class="sim-fin-slider-label">${label} <span class="sf-computed">${subtitle}</span></span>
            <span class="sim-fin-slider-value" id="sf-val-${id}">${fmtFn(val)}</span>
          </div>
          <input type="range" class="sim-fin-range" id="sf-${id}" min="${min}" max="${max}" step="${step}" value="${val}">
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
      this.params.ehTerreno = document.getElementById('sf-terreno')?.checked || false;

      if (this.modo === 'convencional') {
        this.params.taxaFin = g('sf-taxaFin');
        this.params.prazoFin = g('sf-prazoFin');
        this.params.horizonte = this.params.prazoFin;
        // sistema is read from toggle click
      } else {
        this.params.valorArrematacao = g('sf-valorArrematacao');
        this.params.parcelas = parseInt(document.getElementById('sf-parcelas')?.value) || 30;
        this.params.correcao = document.getElementById('sf-correcao')?.value || 'nenhuma';
        this.params.taxaFixa = g('sf-taxaFixa');
        this.params.comissao = g('sf-comissao');
        this.params.itbi = g('sf-itbi');
        this.params.escrituracao = g('sf-escrituracao');
        this.params.custosAdicionais = g('sf-custosAdicionais');
        this.params.descontoVenda = g('sf-descontoVenda');
        this.params.mesesSemImovel = g('sf-mesesSemImovel');
        this.params.horizonte = Math.ceil((this.params.parcelas || 30) / 12) || 3;
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

    _computeCustasTotal(p) {
      const arr = p.valorArrematacao || p.valorMercado;
      return (arr * (p.comissao || 0) / 100) +
             (arr * (p.itbi || 0) / 100) +
             (p.escrituracao || 0) +
             (p.custosAdicionais || 0);
    },

    _updateSliderDisplays() {
      const p = this.params;
      this._setVal('valorMercado', fmt(p.valorMercado));

      // Entrada: base depends on mode
      const entradaBase = this.modo === 'leilao' ? (p.valorArrematacao || p.valorMercado) : p.valorMercado;
      this._setVal('entrada', fmtP(p.entrada) + ' <span class="sf-computed">= ' + fmt(entradaBase * p.entrada / 100) + '</span>');

      this._setVal('valorizacao', fmtP(p.valorizacao) + ' a.a.');
      const alugMensal = p.valorMercado * p.yieldAluguel / 100 / 12;
      this._setVal('yieldAluguel', fmtP(p.yieldAluguel) + ' a.a. <span class="sf-computed">= ' + fmt(alugMensal) + '/mês</span>');
      const rendMensal = (Math.pow(1 + p.rendimentoInv / 100, 1/12) - 1) * 100;
      this._setVal('rendimentoInv', fmtP(p.rendimentoInv) + ' a.a. <span class="sf-computed">= ' + fmtP(rendMensal) + '/mês</span>');

      if (this.modo === 'convencional') {
        this._setVal('taxaFin', fmtP(p.taxaFin) + ' a.a.');
        this._setVal('prazoFin', p.prazoFin + ' anos');
      } else {
        const arr = p.valorArrematacao || p.valorMercado;
        const desc = ((1 - p.valorArrematacao / p.valorMercado) * 100);
        this._setVal('valorArrematacao', fmt(p.valorArrematacao) + ' <span class="sf-computed">(' + (desc > 0 ? desc.toFixed(0) + '% desconto' : 'sem desconto') + ')</span>');

        // Custas breakdown displays
        this._setVal('comissao', fmtP(p.comissao, 0) + ' <span class="sf-computed">= ' + fmt(arr * p.comissao / 100) + '</span>');
        this._setVal('itbi', fmtP(p.itbi) + ' <span class="sf-computed">= ' + fmt(arr * p.itbi / 100) + '</span>');
        this._setVal('escrituracao', fmt(p.escrituracao));
        this._setVal('custosAdicionais', fmt(p.custosAdicionais));
        this._setVal('mesesSemImovel', p.mesesSemImovel + (p.mesesSemImovel === 1 ? ' mês' : ' meses'));

        // Desconto venda rápida
        const venderia = p.valorMercado * (1 - p.descontoVenda / 100);
        this._setVal('descontoVenda', fmtP(p.descontoVenda, 0) + ' <span class="sf-computed">— venderia por ' + fmt(venderia) + '</span>');
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
        s('sf-taxaFixa', p.taxaFixa || 0);
        s('sf-comissao', p.comissao);
        s('sf-itbi', p.itbi);
        s('sf-escrituracao', p.escrituracao);
        s('sf-custosAdicionais', p.custosAdicionais);
        s('sf-descontoVenda', p.descontoVenda);
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
      // Horizonte = prazo do financiamento/parcelas
      const totalMeses = isL ? (p.parcelas || 30) : ((p.prazoFin || 30) * 12);
      const txInvMensal = Math.pow(1 + p.rendimentoInv / 100, 1/12) - 1;
      const valMensal = Math.pow(1 + p.valorizacao / 100, 1/12) - 1;
      const yieldMensal = p.ehTerreno ? 0 : (p.yieldAluguel / 100 / 12);

      let entradaAbs, financiado, custasTotal, mesesFin, txFinMensal;

      if (isL) {
        const arr = p.valorArrematacao || valorMercado;
        entradaAbs = arr * (p.entrada / 100);
        financiado = arr - entradaAbs;
        custasTotal = this._computeCustasTotal(p);
        mesesFin = p.parcelas || 1;

        let txCorr = 0;
        if (p.correcao === 'igpm') txCorr = 7.2; // média últimos 10 anos
        else if (p.correcao === 'ipca') txCorr = 5.2; // média últimos 10 anos
        txCorr += (p.taxaFixa || 0); // soma taxa fixa adicional
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

      // ---- Cenário B: Financiar e Investir ----
      let valorImovel = valorMercado;
      let saldoResto = capitalTotal - entradaAbs - custasTotal;
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
      let mesCrossoverAluguel = 0;
      let primeiroAluguel = 0;
      let ultimoAluguel = 0;
      let rendInvMes1 = 0;

      // ---- Cenário C: Compra à Vista ----
      let saldoRestoC = 0;
      const histVista = [];

      // ---- Cenário D: Financiar e Amortizar ----
      let saldoRestoD = financiado;
      let saldoDevedorD = financiado;
      let finQuitadoD = false;
      let totalParcelasD = 0;
      let totalAmortExtraD = 0;
      let mesFimDividaD = 0;
      let primeiraParcelaD = 0;
      let ultimaParcelaD = 0;
      const histAmort = [];

      for (let m = 1; m <= totalMeses; m++) {
        // Valorização do imóvel
        valorImovel *= (1 + valMensal);

        // Reajuste anual do aluguel pelo IGP-M (média histórica)
        if (!p.ehTerreno && m > 1 && (m - 1) % 12 === 0) {
          aluguelBase *= (1 + REAJUSTE_ALUGUEL / 100);
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

        // Track metrics
        if (m === 1) {
          primeiroAluguel = alugRec;
          rendInvMes1 = saldoResto * txInvMensal;
        }
        ultimoAluguel = alugRec;
        if (!mesCrossoverAluguel && parcela > 0 && alugRec >= parcela) {
          mesCrossoverAluguel = m;
        }

        // Saldo investido restante: rende + aluguel - parcela
        const fluxo = alugRec - parcela;
        saldoResto = saldoResto * (1 + txInvMensal) + fluxo;

        const patrimonioImovel = valorImovel + saldoResto - saldoDevedor;
        histImovel.push(patrimonioImovel);

        // ---- A: Investimento puro ----
        saldoInv *= (1 + txInvMensal);
        histInv.push(saldoInv);

        // ---- C: Compra à Vista ----
        saldoRestoC = saldoRestoC * (1 + txInvMensal) + alugRec;
        histVista.push(valorImovel + saldoRestoC);

        // ---- D: Financiar e Amortizar ----
        let parcelaD = 0;
        if (!finQuitadoD && saldoDevedorD > 0.5 && m <= mesesFin) {
          if (isL) {
            if (txFinMensal > 0) saldoDevedorD *= (1 + txFinMensal);
            parcelaD = txFinMensal > 0 ? calcPMT(financiado, txFinMensal, p.parcelas || 1) : financiado / (p.parcelas || 1);
            parcelaD = Math.min(parcelaD, saldoDevedorD);
            saldoDevedorD -= parcelaD;
          } else if (p.sistema === 'sac') {
            const amortD = Math.min(amortSAC, saldoDevedorD);
            parcelaD = amortD + saldoDevedorD * txFinMensal;
            saldoDevedorD -= amortD;
          } else {
            const jurosD = saldoDevedorD * txFinMensal;
            parcelaD = Math.min(pmtPrice, saldoDevedorD + jurosD);
            saldoDevedorD -= (parcelaD - jurosD);
          }
          if (saldoDevedorD < 0.5) { saldoDevedorD = 0; finQuitadoD = true; if (!mesFimDividaD) mesFimDividaD = m; }
          totalParcelasD += parcelaD;
          if (!primeiraParcelaD) primeiraParcelaD = parcelaD;
          ultimaParcelaD = parcelaD;
        }

        const rendD = saldoRestoD * txInvMensal;
        const cashFlowD = rendD + alugRec - parcelaD;
        let amortExtraMes = 0;
        if (cashFlowD > 0 && saldoDevedorD > 0) {
          amortExtraMes = Math.min(cashFlowD, saldoDevedorD);
          saldoDevedorD -= amortExtraMes;
          if (saldoDevedorD < 0.5) { saldoDevedorD = 0; if (!finQuitadoD) { finQuitadoD = true; if (!mesFimDividaD) mesFimDividaD = m; } }
          totalAmortExtraD += amortExtraMes;
        }
        saldoRestoD = saldoRestoD + cashFlowD - amortExtraMes;

        histAmort.push(valorImovel + saldoRestoD - saldoDevedorD);
      }

      const patrimonioFinalInv = histInv[totalMeses - 1];
      const patrimonioFinalImovel = histImovel[totalMeses - 1];
      const patrimonioFinalVista = histVista[totalMeses - 1];
      const patrimonioFinalAmort = histAmort[totalMeses - 1];
      const anos = totalMeses / 12;

      const roiInv = ((patrimonioFinalInv / capitalTotal) - 1) * 100;
      const roiImovel = ((Math.max(patrimonioFinalImovel, 1) / capitalTotal) - 1) * 100;
      const lucroInv = patrimonioFinalInv - capitalTotal;
      const lucroImovel = patrimonioFinalImovel - capitalTotal;
      const roiVista = ((Math.max(patrimonioFinalVista, 1) / capitalTotal) - 1) * 100;
      const lucroVista = patrimonioFinalVista - capitalTotal;
      const roiAmort = ((Math.max(patrimonioFinalAmort, 1) / capitalTotal) - 1) * 100;
      const lucroAmort = patrimonioFinalAmort - capitalTotal;

      // Ranking dos 4 cenários
      const nomeModo = isL ? 'Leilão' : 'Financiar';
      const ranking = [
        { key: 'inv', nome: 'Investimento Puro', icon: '📈', cor: '#3b82f6', final: patrimonioFinalInv, lucro: lucroInv, roi: roiInv },
        { key: 'fin', nome: nomeModo + ' e Investir', icon: isL ? '🔨' : '🏦', cor: '#22c55e', final: patrimonioFinalImovel, lucro: lucroImovel, roi: roiImovel },
        { key: 'vista', nome: 'Compra à Vista', icon: '🏠', cor: '#f59e0b', final: patrimonioFinalVista, lucro: lucroVista, roi: roiVista },
        { key: 'amort', nome: nomeModo + ' e Amortizar', icon: '⚡', cor: '#a855f7', final: patrimonioFinalAmort, lucro: lucroAmort, roi: roiAmort }
      ].sort((a, b) => b.final - a.final);

      const vencedor = patrimonioFinalImovel > patrimonioFinalInv ? 'imovel' : 'investimento';
      const diff = Math.abs(patrimonioFinalImovel - patrimonioFinalInv);

      // Equity instantâneo (leilão)
      let equityInstantaneo = 0;
      if (isL) {
        equityInstantaneo = valorMercado - (p.valorArrematacao || valorMercado) - custasTotal;
      }

      // Leilão-specific: ficar ou vender analysis
      let analiseVender = null;
      if (isL) {
        const arr = p.valorArrematacao || valorMercado;
        const custoAquisicao = arr + custasTotal;

        // Lucro bruto na arrematação
        const lucroBruto = valorMercado - arr - custasTotal;

        // Lucro se vender rápido (com desconto)
        const precoVendaRapida = valorMercado * (1 - (p.descontoVenda || 0) / 100);
        const lucroVendaRapida = precoVendaRapida - arr - custasTotal;

        // Yield real vs yield mercado
        const alugMensal = valorMercado * yieldMensal;
        const yieldRealAnual = custoAquisicao > 0 ? (alugMensal / custoAquisicao) * 12 * 100 : 0;
        const yieldMercadoAnual = p.yieldAluguel || 0;

        // Break-even calculation:
        // If you sell at price X now, net after selling costs (~6%) = X * 0.94 - remaining debt
        // (for simplicity, we assume selling at start so remaining debt = financiado, and we have the invested rest)
        // Scenario SELL: sell at X, pay 6% selling costs, pay off debt, invest remainder for full period
        //   Net from sale = X * 0.94 - saldoDevedor_at_sale
        //   But if selling immediately: saldoDevedor = financiado, saldoResto from investment capital
        //   Total cash if sell = (X * 0.94 - financiado) + (capitalTotal - entradaAbs - custasTotal) = X*0.94 - financiado + financiado = X*0.94
        //   Wait, let's think differently:
        //   You already spent: entradaAbs + custasTotal (upfront). You owe: financiado (paid over time).
        //   If you sell immediately: you get X * 0.94, pay off financiado, keep the rest.
        //   Cash in hand = X * 0.94 - financiado + saldoResto_initial
        //   saldoResto_initial = capitalTotal - entradaAbs - custasTotal = financiado
        //   Cash in hand = X * 0.94 - financiado + financiado = X * 0.94
        //   Actually, saldoResto at time 0 = capitalTotal - entradaAbs - custasTotal
        //   capitalTotal = entradaAbs + custasTotal + financiado → saldoResto_0 = financiado
        //   So cash if sell at time 0 = X*0.94 - financiado + financiado = X * 0.94
        //   This invested for totalMeses = X * 0.94 * (1+txInvMensal)^totalMeses
        //
        // Scenario KEEP: patrimonio final = patrimonioFinalImovel (already computed)
        //
        // Break-even: X * 0.94 * (1+txInvMensal)^totalMeses = patrimonioFinalImovel
        //   X = patrimonioFinalImovel / (0.94 * (1+txInvMensal)^totalMeses)

        const taxaVenda = 0.06; // 6% corretagem + impostos
        const fatorInv = Math.pow(1 + txInvMensal, totalMeses);
        const precoEquilibrio = patrimonioFinalImovel / ((1 - taxaVenda) * fatorInv);

        analiseVender = {
          lucroBruto,
          precoVendaRapida,
          lucroVendaRapida,
          yieldRealAnual,
          yieldMercadoAnual,
          precoEquilibrio,
          custoAquisicao
        };
      }

      return {
        modo: this.modo,
        totalMeses, anos, capitalTotal, entradaAbs, financiado, custasTotal,
        ranking, vencedor, diff,
        inv: { final: patrimonioFinalInv, lucro: lucroInv, roi: roiInv, hist: histInv },
        imovel: {
          final: patrimonioFinalImovel, lucro: lucroImovel, roi: roiImovel, hist: histImovel,
          valorFinal: valorImovel, saldoInvestido: saldoResto, saldoDevedor,
          totalParcelas, totalAlugueis,
          primeiraParcela, ultimaParcela,
          mesCrossoverAluguel, primeiroAluguel, ultimoAluguel, rendInvMes1,
          equityInstantaneo
        },
        vista: {
          final: patrimonioFinalVista, lucro: lucroVista, roi: roiVista, hist: histVista,
          saldoInvestido: saldoRestoC, totalAlugueis
        },
        amort: {
          final: patrimonioFinalAmort, lucro: lucroAmort, roi: roiAmort, hist: histAmort,
          saldoInvestido: saldoRestoD, saldoDevedor: saldoDevedorD,
          totalParcelas: totalParcelasD, totalAmortExtra: totalAmortExtraD,
          mesFimDivida: mesFimDividaD,
          primeiraParcela: primeiraParcelaD, ultimaParcela: ultimaParcelaD
        },
        analiseVender
      };
    },

    /* ============================================================
       RENDER RESULTS
       ============================================================ */
    _renderResults(r, p) {
      const el = document.getElementById('sf-results');
      if (!el) return;

      const isL = r.modo === 'leilao';

      // Ranking HTML
      const rankingHTML = r.ranking.map((c, i) => {
        const diff = i === 0 ? '' : `<span class="sim-fin-rank-diff">−${fmt(r.ranking[0].final - c.final)}</span>`;
        const medal = i === 0 ? ' sim-fin-rank-winner' : '';
        return `<div class="sim-fin-rank-item${medal}" style="border-left: 3px solid ${c.cor}">
          <span class="sim-fin-rank-pos">${i + 1}º</span>
          <span class="sim-fin-rank-icon">${c.icon}</span>
          <span class="sim-fin-rank-nome">${c.nome}</span>
          <span class="sim-fin-rank-val">${fmt(c.final)}</span>
          ${diff}
        </div>`;
      }).join('');

      // Equity card (leilão)
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

      // Comparison table
      const nomeFin = isL ? 'Leilão + Investir' : 'Financiar e Investir';
      const nomeAmort = isL ? 'Leilão + Amortizar' : 'Financiar e Amortizar';
      const quitacaoB = r.imovel.saldoDevedor > 0.5 ? r.anos + ' anos' : r.anos + ' anos';
      const quitacaoD = r.amort.mesFimDivida > 0
        ? (r.amort.mesFimDivida >= 12 ? Math.floor(r.amort.mesFimDivida / 12) + 'a ' + (r.amort.mesFimDivida % 12) + 'm' : r.amort.mesFimDivida + 'm')
        : r.anos + ' anos';

      const tabelaHTML = `
        <div class="sim-fin-tabela-wrap">
          <table class="sim-fin-tabela">
            <thead>
              <tr>
                <th></th>
                <th><span style="color:#3b82f6">📈</span> Investimento</th>
                <th><span style="color:#22c55e">${isL ? '🔨' : '🏦'}</span> ${nomeFin}</th>
                <th><span style="color:#f59e0b">🏠</span> À Vista</th>
                <th><span style="color:#a855f7">⚡</span> ${nomeAmort}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Patrimônio final</td>
                <td>${fmt(r.inv.final)}</td>
                <td>${fmt(r.imovel.final)}</td>
                <td>${fmt(r.vista.final)}</td>
                <td>${fmt(r.amort.final)}</td>
              </tr>
              <tr>
                <td>Lucro</td>
                <td>${fmt(r.inv.lucro)}</td>
                <td>${fmt(r.imovel.lucro)}</td>
                <td>${fmt(r.vista.lucro)}</td>
                <td>${fmt(r.amort.lucro)}</td>
              </tr>
              <tr>
                <td>ROI</td>
                <td>${fmtP(r.inv.roi, 0)}</td>
                <td>${fmtP(r.imovel.roi, 0)}</td>
                <td>${fmtP(r.vista.roi, 0)}</td>
                <td>${fmtP(r.amort.roi, 0)}</td>
              </tr>
              <tr>
                <td>Parcelas pagas</td>
                <td>—</td>
                <td>${fmt(r.imovel.totalParcelas)}</td>
                <td>—</td>
                <td>${fmt(r.amort.totalParcelas)}</td>
              </tr>
              <tr>
                <td>Quitação</td>
                <td>—</td>
                <td>${quitacaoB}</td>
                <td>À vista</td>
                <td>${quitacaoD}</td>
              </tr>
              <tr>
                <td>Saldo investido</td>
                <td>${fmt(r.inv.final)}</td>
                <td>${fmt(r.imovel.saldoInvestido)}</td>
                <td>${fmt(r.vista.saldoInvestido)}</td>
                <td>${fmt(r.amort.saldoInvestido)}</td>
              </tr>
            </tbody>
          </table>
        </div>`;

      // Insights
      const insights = [];
      if (r.amort.mesFimDivida > 0) {
        const anosD = (r.amort.mesFimDivida / 12).toFixed(1).replace('.', ',');
        const econParcelas = r.imovel.totalParcelas - r.amort.totalParcelas;
        insights.push(`<div class="sim-fin-insight"><span class="sim-fin-insight-icon">⚡</span>Amortizar quita o financiamento em <strong>${anosD} anos</strong> (em vez de ${r.anos}) e economiza <strong>${fmt(econParcelas)}</strong> em parcelas.</div>`);
      }
      const diffVistaInv = r.inv.final - r.vista.final;
      if (diffVistaInv > 0) {
        insights.push(`<div class="sim-fin-insight"><span class="sim-fin-insight-icon">🏠</span>Compra à vista rende <strong>${fmt(r.vista.saldoInvestido)}</strong> em aluguéis reinvestidos, mas sem alavancagem perde <strong>${fmt(diffVistaInv)}</strong> para o investimento puro.</div>`);
      }

      // Ficar ou Vender (leilão)
      let analiseHTML = '';
      if (isL && r.analiseVender) {
        const a = r.analiseVender;
        analiseHTML = `
          <div class="sim-fin-analise-vender">
            <h4>Análise: Ficar ou Vender?</h4>
            <div class="sim-fin-cards">
              <div class="sim-fin-card">
                <div class="sim-fin-card-header"><span class="sim-fin-card-icon">💎</span><span class="sim-fin-card-title">Lucro bruto</span></div>
                <div class="sim-fin-card-value ${a.lucroBruto >= 0 ? 'positive' : 'negative'}">${fmt(a.lucroBruto)}</div>
              </div>
              <div class="sim-fin-card">
                <div class="sim-fin-card-header"><span class="sim-fin-card-icon">⚡</span><span class="sim-fin-card-title">Venda rápida</span></div>
                <div class="sim-fin-card-value ${a.lucroVendaRapida >= 0 ? 'positive' : 'negative'}">${fmt(a.lucroVendaRapida)}</div>
              </div>
              <div class="sim-fin-card">
                <div class="sim-fin-card-header"><span class="sim-fin-card-icon">📊</span><span class="sim-fin-card-title">Yield real</span></div>
                <div class="sim-fin-card-value">${fmtP(a.yieldRealAnual)} a.a.</div>
              </div>
              <div class="sim-fin-card sim-fin-card-highlight">
                <div class="sim-fin-card-header"><span class="sim-fin-card-icon">⚖️</span><span class="sim-fin-card-title">Equilíbrio</span></div>
                <div class="sim-fin-card-value">${fmt(a.precoEquilibrio)}</div>
              </div>
            </div>
          </div>`;
      }

      el.innerHTML = `
        <!-- Ranking -->
        <div class="sim-fin-ranking">
          <div class="sim-fin-ranking-title">Ranking em ${r.anos} anos</div>
          ${rankingHTML}
        </div>

        ${equityHTML}

        <!-- Chart -->
        ${chartHTML}

        <!-- Tabela comparativa -->
        ${tabelaHTML}

        <!-- Insights -->
        ${insights.length ? '<div class="sim-fin-insights">' + insights.join('') + '</div>' : ''}

        ${analiseHTML}

        <!-- Como funciona -->
        <div class="sim-fin-como">
          <h4>Como chegamos nesses valores</h4>
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
      const W = 800, H = 280, PAD_L = 55, PAD_R = 15, PAD_T = 15, PAD_B = 30;
      const chartW = W - PAD_L - PAD_R;
      const chartH = H - PAD_T - PAD_B;

      const isL = r.modo === 'leilao';
      const series = [
        { key: 'inv', data: r.inv.hist, cor: '#3b82f6', nome: 'Investimento' },
        { key: 'fin', data: r.imovel.hist, cor: '#22c55e', nome: isL ? 'Leilão + Investir' : 'Financiar + Investir' },
        { key: 'vista', data: r.vista.hist, cor: '#f59e0b', nome: 'Compra à Vista' },
        { key: 'amort', data: r.amort.hist, cor: '#a855f7', nome: isL ? 'Leilão + Amortizar' : 'Financiar + Amortizar' }
      ];

      const n = series[0].data.length;
      if (n < 2) return '';

      // Sample points (max ~80)
      const step = Math.max(1, Math.floor(n / 80));
      const pts = [];
      for (let i = 0; i < n; i++) {
        if (i % step === 0 || i === n - 1) {
          const pt = { m: i + 1 };
          series.forEach(s => pt[s.key] = s.data[i]);
          pts.push(pt);
        }
      }

      const allVals = pts.flatMap(p => series.map(s => p[s.key]));
      const minV = Math.min(...allVals) * 0.95;
      const maxV = Math.max(...allVals) * 1.05;
      const rangeV = maxV - minV || 1;

      const x = (idx) => PAD_L + (idx / (pts.length - 1)) * chartW;
      const y = (val) => PAD_T + chartH - ((val - minV) / rangeV) * chartH;

      // Build path strings for each series
      const paths = series.map(s => {
        let d = '';
        pts.forEach((p, i) => { d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[s.key]).toFixed(1)} `; });
        return `<path d="${d}" fill="none" stroke="${s.cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      });

      // Y axis labels (5 ticks)
      let yLabels = '', gridLines = '';
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
          xLabels += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle" fill="#6e7681" font-size="10">${anos > 0 ? anos + 'a' : p.m + 'm'}</text>`;
        }
      });

      // End markers - sort by final value to offset labels that overlap
      const lastPt = pts[pts.length - 1];
      const finalX = x(pts.length - 1);
      const endMarkers = series.map(s => ({ cor: s.cor, val: lastPt[s.key], yPos: y(lastPt[s.key]) }))
        .sort((a, b) => a.yPos - b.yPos);
      // Prevent label overlap: ensure min 14px gap
      for (let i = 1; i < endMarkers.length; i++) {
        if (endMarkers[i].yPos - endMarkers[i - 1].yPos < 14) {
          endMarkers[i].yPos = endMarkers[i - 1].yPos + 14;
        }
      }
      const markersHTML = endMarkers.map(em =>
        `<circle cx="${finalX}" cy="${y(em.val)}" r="3" fill="${em.cor}"/>
         <text x="${finalX - 8}" y="${em.yPos - 2}" text-anchor="end" fill="${em.cor}" font-size="9" font-weight="600">${fmtK(em.val)}</text>`
      ).join('');

      const legendHTML = series.map(s =>
        `<span class="sim-fin-legend-item"><span class="sim-fin-legend-dot" style="background:${s.cor}"></span> ${s.nome}</span>`
      ).join('');

      return `
        <div class="sim-fin-chart-box">
          <div class="sim-fin-chart-title">Evolução patrimonial</div>
          <div class="sim-fin-svg-wrap">
            <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              ${gridLines}
              ${yLabels}
              ${xLabels}
              ${paths.join('\n              ')}
              ${markersHTML}
            </svg>
          </div>
          <div class="sim-fin-chart-legend">
            ${legendHTML}
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
        const arr = p.valorArrematacao || p.valorMercado;
        const valComissao = arr * (p.comissao || 0) / 100;
        const valItbi = arr * (p.itbi || 0) / 100;
        const custasBreakdown = `comissão leiloeiro ${fmt(valComissao)} (${fmtP(p.comissao, 0)}) + ITBI ${fmt(valItbi)} (${fmtP(p.itbi)}) + escrituração ${fmt(p.escrituracao)} + custos adicionais ${fmt(p.custosAdicionais)}`;
        items.push(`<strong>Cenário B (${nomeModo.charAt(0).toUpperCase() + nomeModo.slice(1)}):</strong> arremata por <strong>${fmt(p.valorArrematacao)}</strong> (${fmtP((1 - p.valorArrematacao / p.valorMercado) * 100)} de desconto) um imóvel de <strong>${fmt(p.valorMercado)}</strong>. Paga <strong>${fmt(r.entradaAbs)}</strong> de entrada + <strong>${fmt(r.custasTotal)}</strong> de custas (${custasBreakdown}).`);
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

      // 5. Capital investido restante
      const capitalInvestido = r.capitalTotal - r.entradaAbs - (r.custasTotal || 0);
      if (capitalInvestido > 0) {
        items.push(`Os <strong>${fmt(capitalInvestido)}</strong> restantes ficam aplicados a <strong>${fmtP(p.rendimentoInv)} a.a.</strong> — o mesmo rendimento do Cenário A. Desse montante saem os pagamentos das parcelas, e os aluguéis recebidos são reinvestidos ali.`);
      }

      // 6. Aluguel (com reajuste IGP-M)
      if (!p.ehTerreno && r.imovel.totalAlugueis > 0) {
        const alugInicio = r.imovel.primeiroAluguel;
        const alugFim = r.imovel.ultimoAluguel;
        if (alugFim > alugInicio * 1.05) {
          items.push(`O imóvel gera aluguel a <strong>${fmtP(p.yieldAluguel)} a.a.</strong> do valor de mercado: <strong>${fmt(alugInicio)}/mês</strong> no início. O aluguel é reajustado anualmente pelo IGP-M (média histórica de <strong>${fmtP(REAJUSTE_ALUGUEL)} a.a.</strong>), chegando a <strong>${fmt(alugFim)}/mês</strong> no último ano. Total em ${r.anos} anos: <strong>${fmt(r.imovel.totalAlugueis)}</strong>.`);
        } else {
          items.push(`O imóvel gera aluguel a <strong>${fmtP(p.yieldAluguel)} a.a.</strong> do valor. Total recebido em ${r.anos} anos: <strong>${fmt(r.imovel.totalAlugueis)}</strong>.`);
        }
      }

      // 7. Fluxo mensal detalhado
      if (r.imovel.primeiraParcela > 0 && capitalInvestido > 0) {
        const receitaMes1 = r.imovel.primeiroAluguel + r.imovel.rendInvMes1;
        const fluxoMes1 = receitaMes1 - r.imovel.primeiraParcela;
        const partsReceita = [];
        if (r.imovel.primeiroAluguel > 0) partsReceita.push(`aluguel <strong>${fmt(r.imovel.primeiroAluguel)}</strong>`);
        partsReceita.push(`rendimento do capital <strong>${fmt(r.imovel.rendInvMes1)}</strong>`);
        const receitaStr = partsReceita.join(' + ');
        if (fluxoMes1 >= 0) {
          items.push(`No mês 1, ${receitaStr} = <strong>${fmt(receitaMes1)}</strong> contra a parcela de <strong>${fmt(r.imovel.primeiraParcela)}</strong> — sobram <strong>${fmt(fluxoMes1)}</strong> que são reinvestidos.`);
        } else {
          items.push(`No mês 1, ${receitaStr} = <strong>${fmt(receitaMes1)}</strong>, não cobrem a parcela de <strong>${fmt(r.imovel.primeiraParcela)}</strong>. Déficit de <strong>${fmt(Math.abs(fluxoMes1))}/mês</strong> reduz o capital investido.`);
        }
        if (r.imovel.mesCrossoverAluguel > 0) {
          const mc = r.imovel.mesCrossoverAluguel;
          const anosCross = Math.floor(mc / 12);
          const mesesCross = mc % 12;
          const tempoStr = anosCross > 0 ? anosCross + (anosCross > 1 ? ' anos' : ' ano') + (mesesCross > 0 ? ' e ' + mesesCross + (mesesCross > 1 ? ' meses' : ' mês') : '') : mesesCross + (mesesCross > 1 ? ' meses' : ' mês');
          items.push(`A partir do mês ${mc} (${tempoStr}), o aluguel sozinho já supera a parcela do ${nomeModo}.`);
        }
      }

      // 8. Valorização
      const valoriz = r.imovel.valorFinal - p.valorMercado;
      items.push(`O imóvel valoriza <strong>${fmtP(p.valorizacao)} a.a.</strong> e passa de ${fmt(p.valorMercado)} para <strong>${fmt(r.imovel.valorFinal)}</strong> (+${fmt(valoriz)}).`);

      // 9. Yield advantage (leilão only)
      if (isL && r.analiseVender) {
        const a = r.analiseVender;
        items.push(`Como você pagou menos, seu yield real é <strong>${fmtP(a.yieldRealAnual)} a.a.</strong> vs <strong>${fmtP(a.yieldMercadoAnual)} a.a.</strong> se tivesse pago valor de mercado.`);
      }

      // 10. Saldo final do capital investido
      if (capitalInvestido > 0) {
        if (r.imovel.saldoInvestido >= 0) {
          items.push(`Ao final de ${r.anos} anos, o capital investido de <strong>${fmt(capitalInvestido)}</strong> está em <strong>${fmt(r.imovel.saldoInvestido)}</strong>. O capital não apenas cobriu todas as parcelas como ainda cresceu.`);
        } else {
          items.push(`<span class="sf-step-warn-inline">Atenção:</span> ao final de ${r.anos} anos, o capital investido de <strong>${fmt(capitalInvestido)}</strong> ficou <strong>negativo</strong> em <strong>${fmt(r.imovel.saldoInvestido)}</strong>. As parcelas superaram aluguel + rendimentos — seria necessário aportar renda extra.`);
        }
      } else if (r.imovel.saldoInvestido < 0) {
        items.push(`<span class="sf-step-warn-inline">Atenção:</span> o saldo investido ficou <strong>negativo</strong> (${fmt(r.imovel.saldoInvestido)}), indicando que as parcelas superaram aluguel + rendimentos. Seria necessário aportar renda extra.`);
      }

      // 9. Break-even (leilão only)
      if (isL && r.analiseVender) {
        items.push(`O preço de equilíbrio para venda é <strong>${fmt(r.analiseVender.precoEquilibrio)}</strong>. Se conseguir vender acima desse valor, o resultado é melhor do que ficar com o imóvel pelo período completo.`);
      }

      // Cenário C: Compra à Vista
      items.push(`<strong>Cenário C (Compra à Vista):</strong> usa os <strong>${fmt(r.capitalTotal)}</strong> para comprar o imóvel sem financiar. Aluguéis são reinvestidos a ${fmtP(p.rendimentoInv)} a.a. Patrimônio final: imóvel ${fmt(r.imovel.valorFinal)} + investimentos ${fmt(r.vista.saldoInvestido)} = <strong>${fmt(r.vista.final)}</strong>.`);

      // Cenário D: Financiar e Amortizar
      if (r.amort.mesFimDivida > 0) {
        const anosD = (r.amort.mesFimDivida / 12).toFixed(1).replace('.', ',');
        items.push(`<strong>Cenário D (${nomeModo.charAt(0).toUpperCase() + nomeModo.slice(1)} + Amortizar):</strong> mesmo financiamento do Cenário B, mas toda a sobra mensal (aluguel + rendimentos − parcela) é usada para amortizar a dívida. A dívida é quitada em <strong>${anosD} anos</strong> (em vez de ${r.anos}). Total pago em parcelas: <strong>${fmt(r.amort.totalParcelas)}</strong> (economia de ${fmt(r.imovel.totalParcelas - r.amort.totalParcelas)}). Patrimônio final: <strong>${fmt(r.amort.final)}</strong>.`);
      } else {
        items.push(`<strong>Cenário D (${nomeModo.charAt(0).toUpperCase() + nomeModo.slice(1)} + Amortizar):</strong> mesmo financiamento do Cenário B, mas toda a sobra mensal é usada para amortizar a dívida. Total pago em parcelas: <strong>${fmt(r.amort.totalParcelas)}</strong>. Patrimônio final: <strong>${fmt(r.amort.final)}</strong>.`);
      }

      // Resultado: ranking final
      const rankStr = r.ranking.map((c, i) => `${i + 1}º ${c.nome} (<strong>${fmt(c.final)}</strong>)`).join(' · ');
      items.push(`<strong>Ranking final:</strong> ${rankStr}.`);

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
