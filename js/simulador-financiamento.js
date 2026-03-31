/**
 * Simulador: Financiamento Imobiliário vs Investimento
 * Rico aos Poucos
 *
 * Modos: Convencional | Leilão
 * Layout: configs à esquerda, resultado à direita (desktop)
 * Resultado atualiza em tempo real conforme inputs mudam
 */

(function() {
  'use strict';

  const SIM = {
    chart: null,
    chartComp: null,
    modo: 'convencional',
    debounceTimer: null,

    init() {
      const container = document.getElementById('financiamento-container');
      if (!container) return;
      this.render(container);
      this.bindEvents();
      this.executar();
    },

    fmt(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }); },
    fmtP(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'; },
    parseC(s) { if (!s) return 0; return parseFloat(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0; },
    parseP(s) { if (!s) return 0; return parseFloat(s.replace(',', '.')) || 0; },

    applyMask(el) {
      el.addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '');
        if (!v) { this.value = ''; return; }
        this.value = parseInt(v).toLocaleString('pt-BR');
      });
    },

    calcPMT(p, r, n) {
      if (r === 0) return p / n;
      return p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    },

    simular(params) {
      const { modo, valorMercado, percentualEntrada, valorizacaoImovelAnual, aluguelPercentualMensal, taxaVacancia, taxaInvestimentoMensal, inflacaoAnual, reajusteAluguelAnual, custoManutencaoAnual, itrAnual, ehTerreno, horizonte, taxaFinanciamentoAnual, prazoFinanciamentoAnos, sistemaAmortizacao, valorArrematacao, comissaoLeiloeiro, itbiPercentual, custoEscritura, custoRegistro, custoImissao, mesesImissao, prazoParcelasLeilao, correcaoLeilao, taxaFixaLeilao } = params;

      const txInv = taxaInvestimentoMensal / 100;
      const valMensal = Math.pow(1 + valorizacaoImovelAnual / 100, 1/12) - 1;
      const infMensal = Math.pow(1 + inflacaoAnual / 100, 1/12) - 1;

      let entrada, financiado, custoInicial, capInv, capResto, mesesFin, txFin;

      if (modo === 'leilao') {
        entrada = valorArrematacao * (percentualEntrada / 100);
        financiado = valorArrematacao - entrada;
        const custas = valorArrematacao * (comissaoLeiloeiro / 100) + valorArrematacao * (itbiPercentual / 100) + custoEscritura + custoRegistro + custoImissao;
        custoInicial = entrada + custas;
        capInv = custoInicial + financiado;
        capResto = capInv - custoInicial;
        mesesFin = prazoParcelasLeilao;
        let txCorr = 0;
        if (correcaoLeilao === 'igpm') txCorr = 5.5;
        else if (correcaoLeilao === 'ipca') txCorr = inflacaoAnual;
        txFin = Math.pow(1 + txCorr / 100, 1/12) - 1 + (Math.pow(1 + (taxaFixaLeilao || 0) / 100, 1/12) - 1);
      } else {
        entrada = valorMercado * (percentualEntrada / 100);
        financiado = valorMercado - entrada;
        custoInicial = entrada;
        capInv = valorMercado;
        capResto = valorMercado - entrada;
        mesesFin = prazoFinanciamentoAnos * 12;
        txFin = Math.pow(1 + taxaFinanciamentoAnual / 100, 1/12) - 1;
      }

      const totalMeses = horizonte * 12;
      const cA = { h: [], hr: [] };
      let sA = capInv;

      const cB = { h: [], hr: [], vi: [], si: [], sd: [], pa: [], al: [] };
      let sB = capResto, sd = financiado, vi = valorMercado;
      let alug = ehTerreno ? 0 : valorMercado * (aluguelPercentualMensal / 100);
      let totPago = 0, totAlug = 0, totCusto = 0, finQuit = false;
      const pmt = this.calcPMT(financiado, txFin, mesesFin);

      for (let m = 1; m <= totalMeses; m++) {
        sA *= (1 + txInv);
        cA.h.push(sA);
        cA.hr.push(sA / Math.pow(1 + infMensal, m));

        vi *= (1 + valMensal);
        if (!ehTerreno && m > 1 && (m - 1) % 12 === 0) alug *= (1 + reajusteAluguelAnual / 100);

        const emIm = modo === 'leilao' && m <= mesesImissao;
        const alRec = (ehTerreno || emIm) ? 0 : alug * (1 - taxaVacancia / 100);
        const custos = emIm ? 0 : (vi * (custoManutencaoAnual / 100) + vi * (itrAnual / 100)) / 12;

        let parc = 0;
        if (!finQuit && sd > 0.5 && m <= mesesFin) {
          if (modo === 'leilao') {
            if (txFin > 0) sd *= (1 + txFin);
            parc = pmt > 0 ? Math.min(pmt, sd) : financiado / mesesFin;
            sd -= parc;
          } else if (sistemaAmortizacao === 'sac') {
            const am = financiado / mesesFin;
            parc = am + sd * txFin;
            sd -= am;
          } else {
            parc = pmt;
            sd -= (pmt - sd * txFin);
          }
          if (sd < 0.5) { sd = 0; finQuit = true; }
          totPago += parc;
        }

        const fluxo = alRec - parc - custos;
        totAlug += alRec;
        totCusto += custos;
        sB = sB * (1 + txInv) + fluxo;

        const patB = vi + sB - sd;
        cB.h.push(patB); cB.hr.push(patB / Math.pow(1 + infMensal, m));
        cB.vi.push(vi); cB.si.push(sB); cB.sd.push(sd);
        cB.pa.push(parc); cB.al.push(alRec);
      }

      const anos = totalMeses / 12;
      const patBF = cB.h[totalMeses - 1];
      const txAnA = (Math.pow(sA / capInv, 1 / anos) - 1) * 100;
      const txAnB = (Math.pow(Math.max(patBF, 1) / capInv, 1 / anos) - 1) * 100;

      return {
        modo, totalMeses, capInv, custoInicial, financiado,
        cA: { final: sA, finalR: cA.hr[totalMeses-1], retN: ((sA/capInv)-1)*100, retR: ((cA.hr[totalMeses-1]/capInv)-1)*100, txAn: txAnA, h: cA.h, hr: cA.hr },
        cB: { final: patBF, finalR: cB.hr[totalMeses-1], retN: ((patBF/capInv)-1)*100, retR: ((cB.hr[totalMeses-1]/capInv)-1)*100, txAn: txAnB, h: cB.h, hr: cB.hr, vi, si: sB, sd, totPago, totAlug, totCusto, entrada, financiado, p1: cB.pa[0]||0, pN: cB.pa[Math.min(mesesFin-1,cB.pa.length-1)]||0, viH: cB.vi, siH: cB.si, sdH: cB.sd },
        leilao: modo === 'leilao' ? { valorArrematacao, desc: ((1-valorArrematacao/valorMercado)*100), com: valorArrematacao*(comissaoLeiloeiro/100), itbi: valorArrematacao*(itbiPercentual/100), esc: custoEscritura, reg: custoRegistro, im: custoImissao, mIm: mesesImissao, custasT: custoInicial - entrada } : null,
        venc: patBF > sA ? 'imovel' : 'investimento',
        diff: Math.abs(patBF - sA)
      };
    },

    renderResultados(r, p) {
      const el = document.getElementById('sim-fin-results-inner');
      if (!el) return;

      const { cA, cB, venc, diff, totalMeses, modo, leilao } = r;
      const anos = totalMeses / 12;
      const ml = modo === 'leilao' ? 'Leilão' : 'Financiamento';
      const vl = venc === 'imovel' ? `${ml} + Aluguel` : 'Investimento Puro';
      const vc = venc === 'imovel' ? 'bullish' : 'neutral';

      let leilaoHTML = '';
      if (leilao) {
        leilaoHTML = `<div class="sim-fin-detalhe-card sim-fin-leilao-resumo">
          <h5>Arrematação</h5>
          <div class="sim-fin-metric highlight"><span class="label">Desconto</span><span class="value positive">${this.fmtP(leilao.desc)}</span></div>
          <div class="sim-fin-metric"><span class="label">Avaliação</span><span class="value">${this.fmt(p.valorMercado)}</span></div>
          <div class="sim-fin-metric"><span class="label">Arrematado</span><span class="value">${this.fmt(leilao.valorArrematacao)}</span></div>
          <div class="sim-fin-metric"><span class="label">Comissão</span><span class="value negative">${this.fmt(leilao.com)}</span></div>
          <div class="sim-fin-metric"><span class="label">ITBI</span><span class="value negative">${this.fmt(leilao.itbi)}</span></div>
          <div class="sim-fin-metric"><span class="label">Escritura + Registro</span><span class="value negative">${this.fmt(leilao.esc + leilao.reg)}</span></div>
          ${leilao.im > 0 ? `<div class="sim-fin-metric"><span class="label">Imissão</span><span class="value negative">${this.fmt(leilao.im)}</span></div>` : ''}
          <div class="sim-fin-metric" style="border-top:1px solid var(--border-color);padding-top:6px;margin-top:2px"><span class="label"><strong>Total custas</strong></span><span class="value negative"><strong>${this.fmt(leilao.custasT)}</strong></span></div>
          ${leilao.mIm > 0 ? `<div class="sim-fin-metric"><span class="label">Sem o imóvel</span><span class="value">${leilao.mIm} mes${leilao.mIm>1?'es':''}</span></div>` : ''}
        </div>`;
      }

      el.innerHTML = `
        <div class="sim-fin-vencedor ${vc}">
          <span class="sim-fin-vencedor-icon">${venc==='imovel'?(modo==='leilao'?'🔨':'🏠'):'📈'}</span>
          <div><span class="sim-fin-vencedor-label">Vencedor em ${anos} anos</span><span class="sim-fin-vencedor-nome">${vl}</span></div>
          <span class="sim-fin-vencedor-diff">+${this.fmt(diff)}</span>
        </div>
        ${leilaoHTML}
        <div class="sim-fin-comparativo">
          <div class="sim-fin-cenario ${venc==='investimento'?'winner':''}">
            <div class="sim-fin-cenario-header"><span class="sim-fin-cenario-icon">📈</span><h4>Investimento Puro</h4></div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric"><span class="label">Capital</span><span class="value">${this.fmt(r.capInv)}</span></div>
              <div class="sim-fin-metric"><span class="label">Taxa</span><span class="value">${this.fmtP(p.taxaInvestimentoMensal)} a.m.</span></div>
              <div class="sim-fin-metric highlight"><span class="label">Patrimônio</span><span class="value">${this.fmt(cA.final)}</span></div>
              <div class="sim-fin-metric"><span class="label">Retorno real</span><span class="value">${this.fmtP(cA.retR)}</span></div>
              <div class="sim-fin-metric"><span class="label">Equiv. anual</span><span class="value">${this.fmtP(cA.txAn)} a.a.</span></div>
            </div>
          </div>
          <div class="sim-fin-vs">VS</div>
          <div class="sim-fin-cenario ${venc==='imovel'?'winner':''}">
            <div class="sim-fin-cenario-header"><span class="sim-fin-cenario-icon">${modo==='leilao'?'🔨':'🏠'}</span><h4>${ml}</h4></div>
            <div class="sim-fin-cenario-body">
              <div class="sim-fin-metric"><span class="label">${modo==='leilao'?'Entrada + custas':'Entrada'}</span><span class="value">${this.fmt(r.custoInicial)}</span></div>
              <div class="sim-fin-metric"><span class="label">1ª parcela</span><span class="value">${this.fmt(cB.p1)}</span></div>
              <div class="sim-fin-metric highlight"><span class="label">Patrimônio</span><span class="value">${this.fmt(cB.final)}</span></div>
              <div class="sim-fin-metric"><span class="label">Retorno real</span><span class="value">${this.fmtP(cB.retR)}</span></div>
              <div class="sim-fin-metric"><span class="label">Equiv. anual</span><span class="value">${this.fmtP(cB.txAn)} a.a.</span></div>
            </div>
          </div>
        </div>
        <div class="sim-fin-detalhes-grid">
          <div class="sim-fin-detalhe-card"><h5>Composição Final</h5>
            <div class="sim-fin-metric"><span class="label">Valor imóvel</span><span class="value">${this.fmt(cB.vi)}</span></div>
            <div class="sim-fin-metric"><span class="label">Saldo investido</span><span class="value ${cB.si<0?'negative':''}">${this.fmt(cB.si)}</span></div>
            <div class="sim-fin-metric"><span class="label">Saldo devedor</span><span class="value">${this.fmt(cB.sd)}</span></div>
          </div>
          <div class="sim-fin-detalhe-card"><h5>Fluxos</h5>
            <div class="sim-fin-metric"><span class="label">Total parcelas</span><span class="value negative">${this.fmt(cB.totPago)}</span></div>
            <div class="sim-fin-metric"><span class="label">Total aluguel</span><span class="value positive">${this.fmt(cB.totAlug)}</span></div>
            <div class="sim-fin-metric"><span class="label">Total custos</span><span class="value negative">${this.fmt(cB.totCusto)}</span></div>
          </div>
        </div>
        <div class="sim-fin-chart-container">
          <div class="sim-fin-chart-header"><h5>Evolução Patrimonial</h5>
            <div class="sim-fin-chart-toggle"><button class="active" data-view="nominal">Nominal</button><button data-view="real">Real</button></div>
          </div>
          <div class="sim-fin-chart-wrap"><canvas id="sim-fin-chart"></canvas></div>
        </div>
        <div class="sim-fin-chart-container">
          <h5>Composição (${ml})</h5>
          <div class="sim-fin-chart-wrap"><canvas id="sim-fin-chart-comp"></canvas></div>
        </div>
        <div class="sim-fin-conclusao"><h5>Análise</h5><ul>${this.conclusoes(r, p)}</ul>
          <p class="sim-fin-disclaimer">Simulação educacional. Não constitui recomendação de investimento.</p>
        </div>
      `;

      el.querySelectorAll('.sim-fin-chart-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.sim-fin-chart-toggle button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.drawChart(r, btn.dataset.view);
        });
      });

      this.drawChart(r, 'nominal');
      this.drawComp(r);
    },

    conclusoes(r, p) {
      const { cA, cB, venc, diff, totalMeses, modo, leilao } = r;
      const anos = totalMeses / 12;
      const c = [];
      if (venc === 'investimento') c.push(`<li>Investir a ${this.fmtP(p.taxaInvestimentoMensal)}/mês rende <strong>${this.fmt(diff)}</strong> a mais em ${anos} anos.</li>`);
      else c.push(`<li>${modo==='leilao'?'A arrematação':'O financiamento'} gerou <strong>${this.fmt(diff)}</strong> a mais via <strong>alavancagem</strong>.</li>`);
      if (leilao) {
        c.push(`<li>Desconto de <strong>${this.fmtP(leilao.desc)}</strong> gera yield efetivo maior.</li>`);
        if (leilao.mIm > 0) c.push(`<li>${leilao.mIm} meses sem o imóvel considerados como custo de oportunidade.</li>`);
      }
      if (cB.totAlug > 0 && cB.totPago > 0) c.push(`<li>Aluguel cobriu <strong>${this.fmtP(cB.totAlug/cB.totPago*100)}</strong> das parcelas.</li>`);
      if (cB.si < 0) c.push(`<li class="warning">Saldo ficou negativo (${this.fmt(cB.si)}). Necessária renda extra.</li>`);
      const val = cB.vi - p.valorMercado;
      c.push(`<li>Imóvel valorizou <strong>${this.fmt(val)}</strong> (${this.fmt(p.valorMercado)} → ${this.fmt(cB.vi)}).</li>`);
      return c.join('');
    },

    drawChart(r, view) {
      const ctx = document.getElementById('sim-fin-chart');
      if (!ctx) return;
      if (this.chart) this.chart.destroy();
      const real = view === 'real';
      const dA = real ? r.cA.hr : r.cA.h, dB = real ? r.cB.hr : r.cB.h;
      const labels = [], a = [], b = [];
      const step = Math.max(1, Math.floor(dA.length / 60));
      for (let i = 0; i < dA.length; i++) {
        if (i % step === 0 || i === dA.length - 1) {
          labels.push(Math.floor(i/12) > 0 ? `${Math.floor(i/12)}a` : `${(i%12)+1}m`);
          a.push(dA[i]); b.push(dB[i]);
        }
      }
      const ml = r.modo === 'leilao' ? 'Leilão' : 'Financiamento';
      this.chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
          { label: 'Investimento', data: a, borderColor: '#3b82f6', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2 },
          { label: ml, data: b, borderColor: '#22c55e', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2 }
        ]},
        options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
          plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } }, tooltip: { backgroundColor: '#1c2128', titleColor: '#f0f6fc', bodyColor: '#f0f6fc', borderColor: '#30363d', borderWidth: 1, callbacks: { label: c => c.dataset.label + ': ' + c.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }) } } },
          scales: { x: { ticks: { color: '#6e7681', font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: 'rgba(48,54,61,0.3)' } }, y: { ticks: { color: '#6e7681', font: { size: 9 }, callback: v => v >= 1e6 ? 'R$'+(v/1e6).toFixed(1)+'M' : v >= 1e3 ? 'R$'+(v/1e3).toFixed(0)+'k' : 'R$'+v }, grid: { color: 'rgba(48,54,61,0.3)' } } }
        }
      });
    },

    drawComp(r) {
      const ctx = document.getElementById('sim-fin-chart-comp');
      if (!ctx) return;
      if (this.chartComp) this.chartComp.destroy();
      const labels = [], di = [], ds = [], dd = [];
      const step = Math.max(1, Math.floor(r.cB.viH.length / 40));
      for (let i = 0; i < r.cB.viH.length; i++) {
        if (i % step === 0 || i === r.cB.viH.length - 1) {
          labels.push(Math.floor(i/12) > 0 ? `${Math.floor(i/12)}a` : `${(i%12)+1}m`);
          di.push(r.cB.viH[i]); ds.push(Math.max(0, r.cB.siH[i])); dd.push(-r.cB.sdH[i]);
        }
      }
      this.chartComp = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Imóvel', data: di, backgroundColor: 'rgba(34,197,94,0.7)', stack: 'p' },
          { label: 'Investido', data: ds, backgroundColor: 'rgba(59,130,246,0.7)', stack: 'p' },
          { label: 'Dívida', data: dd, backgroundColor: 'rgba(248,81,73,0.7)', stack: 'n' }
        ]},
        options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
          plugins: { legend: { labels: { color: '#8b949e', font: { size: 10 } } }, tooltip: { backgroundColor: '#1c2128', titleColor: '#f0f6fc', bodyColor: '#f0f6fc', borderColor: '#30363d', borderWidth: 1, callbacks: { label: c => c.dataset.label+': '+(c.raw<0?'-':'')+Math.abs(c.raw).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}) } } },
          scales: { x: { stacked: true, ticks: { color: '#6e7681', font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: 'rgba(48,54,61,0.3)' } }, y: { stacked: true, ticks: { color: '#6e7681', font: { size: 9 }, callback: v => { const a=Math.abs(v),p=v<0?'-R$':'R$'; return a>=1e6?p+(a/1e6).toFixed(1)+'M':a>=1e3?p+(a/1e3).toFixed(0)+'k':p+a; } }, grid: { color: 'rgba(48,54,61,0.3)' } } }
        }
      });
    },

    bindEvents() {
      const form = document.querySelector('.sim-fin-config');
      if (form) {
        form.addEventListener('input', () => this.debouncedExecutar());
        form.addEventListener('change', () => this.debouncedExecutar());
      }
      ['sim-fin-valor-imovel', 'sim-fin-valor-arrematacao', 'sim-fin-escritura', 'sim-fin-registro', 'sim-fin-imissao'].forEach(id => {
        const el = document.getElementById(id);
        if (el) this.applyMask(el);
      });
      document.querySelectorAll('.sim-fin-modo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim-fin-modo-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.modo = btn.dataset.modo;
          this.toggleSections();
          this.executar();
        });
      });
      document.querySelectorAll('.sim-fin-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim-fin-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.aplicarPreset(btn.dataset.preset);
          this.executar();
        });
      });
      document.getElementById('sim-fin-terreno')?.addEventListener('change', () => {
        this.toggleAluguelSection();
        this.executar();
      });
    },

    debouncedExecutar() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.executar(), 300);
    },

    toggleSections() {
      document.querySelectorAll('.sim-fin-conv-only').forEach(el => el.style.display = this.modo === 'convencional' ? '' : 'none');
      document.querySelectorAll('.sim-fin-leilao-only').forEach(el => el.style.display = this.modo === 'leilao' ? '' : 'none');
      const pc = document.querySelector('.sim-fin-presets-conv');
      const pl = document.querySelector('.sim-fin-presets-leilao');
      if (pc) pc.style.display = this.modo === 'convencional' ? '' : 'none';
      if (pl) pl.style.display = this.modo === 'leilao' ? '' : 'none';
    },

    toggleAluguelSection() {
      const s = document.querySelector('.sim-fin-aluguel-section');
      if (s) s.style.display = document.getElementById('sim-fin-terreno')?.checked ? 'none' : '';
    },

    aplicarPreset(preset) {
      const P = {
        conservador: { vi:'500.000',en:'20',tf:'9',pz:'30',vl:'5',al:'0,4',vc:'10',ti:'0,8',si:'sac',inf:'5',ra:'5',mn:'1',it:'0,5',hz:'30' },
        moderado: { vi:'500.000',en:'20',tf:'9',pz:'30',vl:'6',al:'0,5',vc:'8',ti:'1',si:'sac',inf:'5',ra:'6',mn:'0,5',it:'0,3',hz:'30' },
        otimista: { vi:'500.000',en:'20',tf:'8',pz:'25',vl:'8',al:'0,6',vc:'5',ti:'1',si:'sac',inf:'4,5',ra:'7',mn:'0,5',it:'0,3',hz:'25' },
        'leilao-conservador': { vi:'500.000',va:'375.000',en:'25',cm:'5',ib:'3',es:'1.500',rg:'1.500',im:'3.000',mi:'6',pl:'30',cr:'ipca',tx:'0',vl:'5',al:'0,5',vc:'10',ti:'0,8',inf:'5',ra:'5',mn:'1',it:'0,5',hz:'10' },
        'leilao-moderado': { vi:'500.000',va:'350.000',en:'25',cm:'5',ib:'3',es:'1.500',rg:'1.500',im:'2.000',mi:'4',pl:'30',cr:'ipca',tx:'0',vl:'6',al:'0,5',vc:'8',ti:'1',inf:'5',ra:'6',mn:'0,5',it:'0,3',hz:'10' },
        'leilao-otimista': { vi:'500.000',va:'300.000',en:'20',cm:'5',ib:'3',es:'1.500',rg:'1.500',im:'1.000',mi:'3',pl:'12',cr:'nenhuma',tx:'0',vl:'8',al:'0,6',vc:'5',ti:'1',inf:'4,5',ra:'7',mn:'0,5',it:'0,3',hz:'10' }
      };
      const p = P[preset]; if (!p) return;
      const s = (id, v) => { const e = document.getElementById(id); if (e && v !== undefined) e.value = v; };
      s('sim-fin-valor-imovel',p.vi); s('sim-fin-entrada',p.en); s('sim-fin-valorizacao',p.vl);
      s('sim-fin-aluguel',p.al); s('sim-fin-vacancia',p.vc); s('sim-fin-taxa-inv',p.ti);
      s('sim-fin-inflacao',p.inf); s('sim-fin-reajuste',p.ra); s('sim-fin-manutencao',p.mn);
      s('sim-fin-itr',p.it); s('sim-fin-horizonte',p.hz);
      s('sim-fin-taxa-fin',p.tf); s('sim-fin-prazo',p.pz); s('sim-fin-sistema',p.si);
      s('sim-fin-valor-arrematacao',p.va); s('sim-fin-comissao',p.cm); s('sim-fin-itbi',p.ib);
      s('sim-fin-escritura',p.es); s('sim-fin-registro',p.rg); s('sim-fin-imissao',p.im);
      s('sim-fin-meses-imissao',p.mi); s('sim-fin-parcelas-leilao',p.pl); s('sim-fin-correcao',p.cr);
      s('sim-fin-taxa-fixa',p.tx);
    },

    executar() {
      const g = id => document.getElementById(id);
      const isL = this.modo === 'leilao';
      const params = {
        modo: this.modo, valorMercado: this.parseC(g('sim-fin-valor-imovel')?.value),
        percentualEntrada: this.parseP(g('sim-fin-entrada')?.value),
        valorizacaoImovelAnual: this.parseP(g('sim-fin-valorizacao')?.value),
        aluguelPercentualMensal: this.parseP(g('sim-fin-aluguel')?.value),
        taxaVacancia: this.parseP(g('sim-fin-vacancia')?.value),
        taxaInvestimentoMensal: this.parseP(g('sim-fin-taxa-inv')?.value),
        inflacaoAnual: this.parseP(g('sim-fin-inflacao')?.value),
        reajusteAluguelAnual: this.parseP(g('sim-fin-reajuste')?.value),
        custoManutencaoAnual: this.parseP(g('sim-fin-manutencao')?.value),
        itrAnual: this.parseP(g('sim-fin-itr')?.value),
        ehTerreno: g('sim-fin-terreno')?.checked || false,
        horizonte: parseInt(g('sim-fin-horizonte')?.value) || (isL ? 10 : 30)
      };
      if (isL) {
        params.valorArrematacao = this.parseC(g('sim-fin-valor-arrematacao')?.value);
        params.comissaoLeiloeiro = this.parseP(g('sim-fin-comissao')?.value);
        params.itbiPercentual = this.parseP(g('sim-fin-itbi')?.value);
        params.custoEscritura = this.parseC(g('sim-fin-escritura')?.value);
        params.custoRegistro = this.parseC(g('sim-fin-registro')?.value);
        params.custoImissao = this.parseC(g('sim-fin-imissao')?.value);
        params.mesesImissao = parseInt(g('sim-fin-meses-imissao')?.value) || 0;
        params.prazoParcelasLeilao = parseInt(g('sim-fin-parcelas-leilao')?.value) || 30;
        params.correcaoLeilao = g('sim-fin-correcao')?.value || 'nenhuma';
        params.taxaFixaLeilao = this.parseP(g('sim-fin-taxa-fixa')?.value);
        if (!params.valorArrematacao || params.valorArrematacao <= 0) return;
      } else {
        params.taxaFinanciamentoAnual = this.parseP(g('sim-fin-taxa-fin')?.value);
        params.prazoFinanciamentoAnos = parseInt(g('sim-fin-prazo')?.value) || 30;
        params.sistemaAmortizacao = g('sim-fin-sistema')?.value || 'sac';
      }
      if (params.valorMercado <= 0 || params.percentualEntrada <= 0 || params.percentualEntrada >= 100) return;
      this.renderResultados(this.simular(params), params);
    },

    render(container) {
      container.innerHTML = `
        <div class="sim-fin-wrapper">
          <div class="sim-fin-intro"><h2>Financiamento Imobiliário vs Investimento</h2><p>Ajuste os parâmetros e veja o resultado em tempo real.</p></div>
          <div class="sim-fin-layout">
            <div class="sim-fin-config">
              <div class="sim-fin-modo-toggle">
                <button class="sim-fin-modo-btn active" data-modo="convencional"><span class="sim-fin-modo-icon">🏦</span><span>Convencional</span></button>
                <button class="sim-fin-modo-btn" data-modo="leilao"><span class="sim-fin-modo-icon">🔨</span><span>Leilão</span></button>
              </div>
              <div class="sim-fin-presets sim-fin-presets-conv"><span class="sim-fin-presets-label">Cenários:</span><button class="sim-fin-preset" data-preset="conservador">Conservador</button><button class="sim-fin-preset active" data-preset="moderado">Moderado</button><button class="sim-fin-preset" data-preset="otimista">Otimista</button></div>
              <div class="sim-fin-presets sim-fin-presets-leilao" style="display:none"><span class="sim-fin-presets-label">Cenários:</span><button class="sim-fin-preset" data-preset="leilao-conservador">Conservador</button><button class="sim-fin-preset" data-preset="leilao-moderado">Moderado</button><button class="sim-fin-preset" data-preset="leilao-otimista">Otimista</button></div>
              <div class="sim-fin-form">
                <div class="sim-fin-section"><h3>Imóvel</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Valor de mercado</label><div class="sim-fin-input-group"><span>R$</span><input type="text" id="sim-fin-valor-imovel" value="500.000" inputmode="numeric"></div></div>
                  <div class="sim-fin-field sim-fin-leilao-only" style="display:none"><label>Arrematação <span class="sim-fin-tip" title="Valor pago no leilão">?</span></label><div class="sim-fin-input-group"><span>R$</span><input type="text" id="sim-fin-valor-arrematacao" value="350.000" inputmode="numeric"></div></div>
                  <div class="sim-fin-field"><label>Entrada</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-entrada" value="20" inputmode="decimal"><span>%</span></div></div>
                  <div class="sim-fin-field"><label>Valorização anual</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-valorizacao" value="6" inputmode="decimal"><span>% a.a.</span></div></div>
                  <div class="sim-fin-field"><label>Horizonte</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-horizonte" value="30" inputmode="numeric"><span>anos</span></div></div>
                  <div class="sim-fin-field sim-fin-field-checkbox"><label class="sim-fin-checkbox-label"><input type="checkbox" id="sim-fin-terreno"><span>Terreno (sem aluguel)</span></label></div>
                </div></div>
                <div class="sim-fin-section sim-fin-conv-only"><h3>Financiamento</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Juros anuais</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-taxa-fin" value="9" inputmode="decimal"><span>% a.a.</span></div></div>
                  <div class="sim-fin-field"><label>Prazo</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-prazo" value="30" inputmode="numeric"><span>anos</span></div></div>
                  <div class="sim-fin-field full-width"><label>Sistema</label><select id="sim-fin-sistema"><option value="sac" selected>SAC</option><option value="price">Price</option></select></div>
                </div></div>
                <div class="sim-fin-section sim-fin-leilao-only" style="display:none"><h3>Parcelamento</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Parcelas</label><select id="sim-fin-parcelas-leilao"><option value="1">À vista</option><option value="12">12x</option><option value="24">24x</option><option value="30" selected>30x</option><option value="48">48x</option><option value="60">60x</option></select></div>
                  <div class="sim-fin-field"><label>Correção</label><select id="sim-fin-correcao"><option value="nenhuma">Nenhuma</option><option value="igpm">IGP-M</option><option value="ipca" selected>IPCA</option></select></div>
                  <div class="sim-fin-field"><label>Taxa fixa +</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-taxa-fixa" value="0" inputmode="decimal"><span>% a.a.</span></div></div>
                </div></div>
                <div class="sim-fin-section sim-fin-leilao-only" style="display:none"><h3>Custas</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Comissão</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-comissao" value="5" inputmode="decimal"><span>%</span></div></div>
                  <div class="sim-fin-field"><label>ITBI</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-itbi" value="3" inputmode="decimal"><span>%</span></div></div>
                  <div class="sim-fin-field"><label>Escritura</label><div class="sim-fin-input-group"><span>R$</span><input type="text" id="sim-fin-escritura" value="1.500" inputmode="numeric"></div></div>
                  <div class="sim-fin-field"><label>Registro</label><div class="sim-fin-input-group"><span>R$</span><input type="text" id="sim-fin-registro" value="1.500" inputmode="numeric"></div></div>
                  <div class="sim-fin-field"><label>Imissão</label><div class="sim-fin-input-group"><span>R$</span><input type="text" id="sim-fin-imissao" value="2.000" inputmode="numeric"></div></div>
                  <div class="sim-fin-field"><label>Prazo imissão</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-meses-imissao" value="4" inputmode="numeric"><span>meses</span></div></div>
                </div></div>
                <div class="sim-fin-section sim-fin-aluguel-section"><h3>Aluguel</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Aluguel mensal <span class="sim-fin-tip" title="% do valor de mercado/mês">?</span></label><div class="sim-fin-input-group"><input type="text" id="sim-fin-aluguel" value="0,5" inputmode="decimal"><span>% valor</span></div></div>
                  <div class="sim-fin-field"><label>Vacância</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-vacancia" value="8" inputmode="decimal"><span>%</span></div></div>
                  <div class="sim-fin-field"><label>Reajuste</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-reajuste" value="6" inputmode="decimal"><span>% a.a.</span></div></div>
                </div></div>
                <div class="sim-fin-section"><h3>Investimento</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field full-width"><label>Rendimento mensal <span class="sim-fin-tip" title="1% a.m. ≈ 12,68% a.a.">?</span></label><div class="sim-fin-input-group"><input type="text" id="sim-fin-taxa-inv" value="1" inputmode="decimal"><span>% a.m.</span></div></div>
                </div></div>
                <div class="sim-fin-section"><h3>Custos e Inflação</h3><div class="sim-fin-fields">
                  <div class="sim-fin-field"><label>Inflação</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-inflacao" value="5" inputmode="decimal"><span>% a.a.</span></div></div>
                  <div class="sim-fin-field"><label>Manutenção</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-manutencao" value="0,5" inputmode="decimal"><span>% a.a.</span></div></div>
                  <div class="sim-fin-field"><label>IPTU/ITR</label><div class="sim-fin-input-group"><input type="text" id="sim-fin-itr" value="0,3" inputmode="decimal"><span>% a.a.</span></div></div>
                </div></div>
              </div>
            </div>
            <div class="sim-fin-results"><div id="sim-fin-results-inner" class="sim-fin-results-inner"></div></div>
          </div>
        </div>
      `;
      this.aplicarPreset('moderado');
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SIM.init());
  else SIM.init();
})();
