/**
 * FII Template Engine for Rico aos Poucos
 * Reads a JSON data file and renders a complete FII landing page.
 *
 * Usage:
 * 1. Include Chart.js and Tailwind CSS in your HTML <head>
 * 2. Add <div id="fii-loading">...</div> and <div id="fii-root"></div> in <body>
 * 3. Include this script and call: FIITemplate.init({ dataUrl: '../data/fiis/TICKER.json' })
 */

const FIITemplate = {
    data: null,
    config: null,

    // Logo SVG from page-header.js
    logoSVG: `<svg viewBox="0 0 1024 1024" width="36" height="36">
      <defs><clipPath id="rc"><rect width="1024" height="1024" rx="205"/></clipPath></defs>
      <g clip-path="url(#rc)">
        <rect width="1024" height="1024" fill="#fdfdfd"/>
        <path d="M329.73 475.84C318.03 487.75 291.26 514.98 270.23 536.35L232 575.21V218.91l129.25.35c127.97.35 129.38.37 142.25 2.56 44.75 7.62 77.89 21.45 104.52 43.63 19.83 16.51 36.07 40.45 41.44 61.07l1.53 5.87-9.75 10.06c-5.36 5.53-29.55 30.3-53.75 55.05-24.21 24.75-48.25 49.39-53.42 54.75-5.18 5.36-9.91 9.75-10.51 9.75s-5.76-4.68-11.47-10.41l-10.38-10.41 5.36-2.71c16.69-8.46 27.74-21.74 32.49-39.04 2.49-9.07 3.04-29.21 1.06-38.93-4.86-23.89-21.8-40.39-47.62-46.39-16.32-3.79-26.87-4.26-85.51-3.77-30.79.25-56.1.5-56.24.56-.14.05-.25 32.32-.25 71.69v71.6zm438.27 271.66c0 .28-32.06.48-71.25.45l-71.25-.05-22.31-31.2c-12.27-17.16-31.31-43.7-42.31-58.99l-20-27.78 2.6-3.09c4.52-5.37 76.91-78.84 77.68-78.84 1.08 0 39.66 51.87 88.5 119 11 15.12 28.63 39.31 39.17 53.75s19.17 26.79 19.17 27.06zM356 687.92V748h-59c-32.45 0-59-.34-58.99-.75.01-.9 115.72-118.6 117.06-119.08.57-.21.93 23.06.93 59.75z" fill="rgb(32,58,87)"/>
        <path d="M298.21 658.25C261.73 694.96 231.8 725 231.69 725s-.19-27.65-.19-61.45v-61.44l16-16.26c8.8-8.96 50.21-51.0 92.03-93.35 41.82-42.36 79.13-80.27 82.92-84.26 3.78-3.99 7.25-7.25 7.72-7.25s10.62 9.34 22.59 20.75c11.96 11.41 32.71 31.06 46.11 43.66 23.13 21.77 24.46 22.85 26.49 21.5 2.26-1.49 29.72-29.31 97.15-98.41 22.54-23.10 48.53-49.65 57.76-58.99l16.79-17 -4.34-4c-2.39-2.2-14.67-13.41-27.28-24.92s-23.07-21.23-23.23-21.61c-.30-.72.32-.88 36.29-9.40 12.65-2.99 32.22-7.70 43.5-10.45s28.15-6.85 37.5-9.11c9.35-2.26 23.30-5.64 31-7.51 32.51-7.91 64.33-15.50 64.96-15.50.15 0-.54 3.94-1.54 8.75-4.91 23.62-11.24 53.92-15.42 73.75-2.54 12.10-6.61 31.67-9.03 43.5s-5.78 23.83-7.48 31.81c-1.70 7.98-4.34 20.47-5.88 27.76s-3.06 13.52-3.38 13.84c-.61.61-9.56-6.89-25.23-21.16-4.95-4.51-12.15-10.97-16-14.36l-7-6.17-3.91 4.29c-4.90 5.38-32.10 33.35-61.08 62.80-26.70 27.13-158.79 162.16-166.52 170.22l-5.49 5.72-21.50-20.59c-55.42-53.08-73.11-69.87-73.91-70.14-.47-.17-1.47.34-2.22 1.13-4.59 4.81-75.04 75.93-131.66 132.91z" fill="rgb(214,164,45)"/>
      </g>
    </svg>`,

    // SVG icons used throughout the page
    icons: {
        backArrow: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
        star: `<svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`,
        building: `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
        money: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        users: `<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
        chart: `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
        warning: `<svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        shield: `<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
        checkCircle: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>`,
        checkCircleSmall: `<svg class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>`,
        plus: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>`,
        clock: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        arrowUp: `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"/></svg>`,
        infoCircle: `<svg class="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>`,
        clipboardCheck: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>`,
        xCircle: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>`,
        chevronRight: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`,
        checkCircleOutline: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        buildingLarge: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
        moneyLarge: `<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    },

    /**
     * Initialize the template engine
     * @param {Object} config - { dataUrl: string }
     */
    async init(config) {
        this.config = config;
        try {
            const resp = await fetch(config.dataUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            this.data = await resp.json();
            this.render();
            this.initCharts();
            this.initScrollListeners();
            // Hide loading skeleton, show content
            const loading = document.getElementById('fii-loading');
            if (loading) loading.style.display = 'none';
            const root = document.getElementById('fii-root');
            if (root) root.style.display = 'block';
        } catch (err) {
            console.error('Error loading FII data:', err);
        }
    },

    /**
     * Render the full page into #fii-root
     */
    render() {
        const d = this.data;
        const root = document.getElementById('fii-root');
        if (!root) return;

        let html = '';
        // Header + StickyNav removidos: o <header id="site-header"> externo
        // (preenchido por fii-layout.js) é o header oficial do site, com menu,
        // e já é sticky via CSS (.article-topbar-wrap). O stickyNav interno
        // duplicava e sobrepunha o header padrão quando scroll > 300px.
        html += this.renderHero();
        html += this.renderQuickStats();
        html += '<main class="max-w-7xl mx-auto px-4 pb-16">';
        html += this.renderRecomendacao();
        html += this.renderPontosAtencao();
        if (d.gestora) html += this.renderGestora();
        html += this.renderTaxas();
        if (d.aquisicoes) html += this.renderAquisicoes();
        html += this.renderPortfolio();
        if (d.ativos) html += this.renderAtivos();
        if (d.ativosDetalhados) html += this.renderAtivosDetalhados();
        html += this.renderTimeline();
        html += this.renderTese();
        html += this.renderDividendos();
        html += this.renderValuation();
        html += this.renderConclusao();
        html += '</main>';
        html += this.renderFooter();

        root.innerHTML = html;
    },

    // ──────────────────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────────────────
    renderHeader() {
        const d = this.data;
        return `
    <header class="app-header">
      <a href="../" class="header-back">
        ${this.icons.backArrow}
      </a>
      <div class="app-logo">
        ${this.logoSVG}
      </div>
      <div class="app-title-group">
        <h1 class="app-name">Rico aos Poucos</h1>
        <span class="app-subtitle">Análise ${d.meta.ticker}</span>
      </div>
    </header>`;
    },

    // ──────────────────────────────────────────────────
    // STICKY NAV
    // ──────────────────────────────────────────────────
    renderStickyNav() {
        const d = this.data;
        const veredictoColor = this.getVeredictoColor(d.recomendacao.veredicto);
        return `
    <nav class="nav-sticky fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] hidden" id="stickyNav">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="../" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mr-2">
                    ${this.icons.backArrow}
                </a>
                <span class="text-xl font-bold text-white">${d.meta.ticker}</span>
                <span class="px-2 py-0.5 bg-${veredictoColor}-500/20 text-${veredictoColor}-400 text-xs font-semibold rounded">${d.recomendacao.veredicto}</span>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-lg font-semibold text-white">R$ ${d.indicadores.cotacao}</span>
                <span class="text-[var(--bullish)] font-medium">DY ${d.indicadores.dividendYield}%</span>
            </div>
        </div>
    </nav>`;
    },

    // ──────────────────────────────────────────────────
    // HERO SECTION
    // ──────────────────────────────────────────────────
    renderHero() {
        const d = this.data;
        const m = d.meta;
        const ind = d.indicadores;
        const rec = d.recomendacao;
        const veredictoColor = this.getVeredictoColor(rec.veredicto);

        // Badges
        let badgesHtml = '';
        badgesHtml += `<span class="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-300">${m.segmento}</span>`;
        if (m.badges) {
            m.badges.forEach(badge => {
                badgesHtml += `<span class="px-3 py-1 rounded-full bg-white/10 border border-white/20">${badge}</span>`;
            });
        }

        // Nome extra (e.g., "(ex-GALG11)")
        const nomeExtraHtml = m.nomeExtra ? ` <span class="text-emerald-400">${m.nomeExtra}</span>` : '';

        // Extrai primeira tag significativa (ex: "37 Imóveis")
        const infoTag = m.badges && m.badges.length > 0 ? m.badges[0] : '';

        // Parser inteligente: ponto como milhar apenas se houver vírgula
        const parseNum = (v) => {
            if (v === null || v === undefined || v === '') return null;
            let s = String(v).trim();
            if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
            const n = parseFloat(s);
            return (isNaN(n) || n <= 0) ? null : n;
        };
        // Extrai número único (média se vier faixa)
        const parsePrecoJusto = (str) => {
            if (!str) return null;
            const tokens = String(str).match(/[\d][\d.,]*/g);
            if (!tokens) return null;
            const vals = tokens.map(parseNum).filter(v => v !== null);
            if (!vals.length) return null;
            return vals.reduce((a, b) => a + b, 0) / vals.length;
        };

        // Preço justo — calcula um valor único (média da faixa, se houver)
        let precoJustoNum = null;
        if (d.valuation && d.valuation.recomendacoes && d.valuation.recomendacoes.valor) {
            precoJustoNum = parsePrecoJusto(d.valuation.recomendacoes.valor);
        }
        const fmtBR = (n) => 'R$ ' + n.toFixed(2).replace('.', ',');
        const precoJustoFmt = precoJustoNum ? fmtBR(precoJustoNum) : '';

        const cotacaoNum = parseNum(ind.cotacao);
        let upsideHtml = '';
        if (precoJustoNum && cotacaoNum) {
            const up = ((precoJustoNum - cotacaoNum) / cotacaoNum) * 100;
            const sign = up >= 0 ? '+' : '';
            const cls = up >= 3 ? 'hm2-upside-green' : (up <= -3 ? 'hm2-upside-red' : 'hm2-upside-amber');
            upsideHtml = `<span class="${cls}">${sign}${up.toFixed(1)}%</span>`;
        }

        return `
    <!-- ═══ HERO DESKTOP (lg+) ═════════════════════════════════════════════ -->
    <header class="hero-desktop hero-gradient text-white py-12 pb-28 lg:py-16 lg:pb-32 relative z-10 hidden lg:block">
        <div class="max-w-7xl mx-auto px-4 relative z-10">
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 lg:gap-8">
                <div class="space-y-4 w-full lg:w-auto">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight">${m.ticker}</h1>
                        <span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-${veredictoColor}-500/20 text-${veredictoColor}-400 text-sm font-semibold border border-${veredictoColor}-500/30" title="Nota 0-10 baseada em gestão, portfólio, precificação e perspectivas. Não é recomendação de investimento.">
                            ${this.icons.star}
                            NOTA ${rec.nota}/10
                        </span>
                    </div>
                    <p class="text-xl lg:text-2xl text-blue-200 font-light leading-snug">${m.nome}${nomeExtraHtml}</p>
                    <div class="flex flex-wrap gap-2 text-sm">${badgesHtml}</div>
                </div>
                <div class="w-full lg:w-auto lg:text-right space-y-1">
                    <div class="text-sm text-blue-300 uppercase tracking-wider">Cota Atual</div>
                    <div class="text-5xl lg:text-6xl font-extrabold leading-none">R$ ${ind.cotacao}</div>
                    <div class="text-xs text-slate-400">em ${ind.cotacaoData}</div>
                    <div class="flex items-center gap-4 lg:justify-end mt-2">
                        <div class="lg:text-center">
                            <div class="text-2xl font-bold text-emerald-400 leading-none">${ind.dividendYield}%</div>
                            <div class="text-xs text-blue-300 mt-0.5">DY Anual</div>
                        </div>
                        <div class="w-px h-10 bg-white/20"></div>
                        <div class="lg:text-center">
                            <div class="text-2xl font-bold text-emerald-400 leading-none">${ind.pvp}</div>
                            <div class="text-xs text-blue-300 mt-0.5">P/VP</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- ═══ HERO MOBILE (< lg) — CONCEITO "COTAÇÃO FIRST" ══════════════════ -->
    <!-- Layout inspirado em apps de corretora/trading: cotação é o herói visual,
         veredicto é uma barra destacada, métricas são chips inline. -->
    <header class="hero-mobile hero-gradient text-white relative z-10 lg:hidden">
        <div class="hm2-inner">

            <!-- Cabeçalho mínimo: ticker + nota -->
            <div class="hm2-topline">
                <span class="hm2-ticker">${m.ticker}</span>
                <span class="hm2-nota-chip hm2-nota-${veredictoColor}">
                    <span class="hm2-nota-val">${rec.nota}</span>
                    <span class="hm2-nota-max">/10</span>
                </span>
            </div>

            <!-- Cotação — HERO VISUAL (com label e data claros) -->
            <div class="hm2-price-label">Cota Atual</div>
            <div class="hm2-price">
                <span class="hm2-currency">R$</span>
                <span class="hm2-amount">${ind.cotacao}</span>
            </div>
            <div class="hm2-price-caption">em ${ind.cotacaoData || '—'}</div>

            <!-- Comparação: preço justo (médio) com upside/downside -->
            ${precoJustoFmt ? `
            <div class="hm2-fairprice">
                <span class="hm2-fairprice-label">Preço justo estimado</span>
                <span class="hm2-fairprice-wrap">
                    <span class="hm2-fairprice-val">${precoJustoFmt}</span>
                    ${upsideHtml}
                </span>
            </div>` : ''}

            <!-- Explicação da nota -->
            <div class="hm2-nota-explain">
                <strong>Nota ${rec.nota}/10</strong> · avalia qualidade de gestão, portfólio,
                precificação e perspectivas. <em>Não é recomendação de investimento.</em>
            </div>

            <!-- Métricas em tiras horizontais -->
            <div class="hm2-metrics">
                <div class="hm2-metric-row">
                    <span class="hm2-metric-name">Dividend Yield</span>
                    <span class="hm2-metric-val hm2-val-green">${ind.dividendYield}%<span class="hm2-val-unit">a.a.</span></span>
                </div>
                <div class="hm2-metric-row">
                    <span class="hm2-metric-name">P/VP</span>
                    <span class="hm2-metric-val ${ind.pvp < 1 ? 'hm2-val-green' : 'hm2-val-amber'}">${ind.pvp}<span class="hm2-val-unit">${ind.pvpDesconto || ''}</span></span>
                </div>
                <div class="hm2-metric-row">
                    <span class="hm2-metric-name">Dividendo / cota</span>
                    <span class="hm2-metric-val">R$ ${ind.dividendoMensal}<span class="hm2-val-unit">/mês</span></span>
                </div>
                <div class="hm2-metric-row">
                    <span class="hm2-metric-name">Patrimônio líquido</span>
                    <span class="hm2-metric-val">${ind.patrimonioLiquido || '—'}</span>
                </div>
            </div>

            <!-- Rodapé de identidade -->
            <div class="hm2-identity">
                <div class="hm2-fund-name">${m.nome}${nomeExtraHtml}</div>
                <div class="hm2-fund-tags">${m.segmento}${infoTag ? ' · ' + infoTag : ''}</div>
            </div>

        </div>
    </header>`;
    },

    // ──────────────────────────────────────────────────
    // QUICK STATS CARDS
    // ──────────────────────────────────────────────────
    renderQuickStats() {
        const stats = this.data.quickStats;
        if (!stats || stats.length === 0) return '';

        const iconMap = {
            building: this.icons.building,
            money: this.icons.money,
            users: this.icons.users,
            chart: this.icons.chart
        };

        let cardsHtml = '';
        stats.forEach(stat => {
            const icon = iconMap[stat.icone] || '';
            // Override icon color via wrapping class
            const iconBg = `bg-${stat.corIcone}-500/20`;

            // Value color
            const valorClass = stat.corValor ? `text-${stat.corValor}-400` : 'text-white';

            // Value with optional suffix
            let valorHtml = '';
            if (stat.valorSufixo) {
                valorHtml = `<div class="text-xl sm:text-2xl font-bold ${valorClass} leading-tight">${stat.valor}<span class="text-sm sm:text-base text-slate-500">${stat.valorSufixo}</span></div>`;
            } else {
                valorHtml = `<div class="text-2xl sm:text-3xl font-bold ${valorClass} leading-tight">${stat.valor}</div>`;
            }

            // Detail line
            let detalheHtml = '';
            if (stat.detalheHtml) {
                detalheHtml = `<div class="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">${stat.detalheHtml}</div>`;
            } else if (stat.detalheIcone === 'arrowUp') {
                detalheHtml = `<div class="text-[11px] sm:text-xs text-emerald-400 mt-1 flex items-center gap-1 leading-snug">${this.icons.arrowUp} ${stat.detalhe}</div>`;
            } else if (stat.corIcone === 'emerald' && !stat.detalheHtml) {
                detalheHtml = `<div class="text-[11px] sm:text-xs text-emerald-400 mt-1 font-medium leading-snug">${stat.detalhe}</div>`;
            } else {
                detalheHtml = `<div class="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">${stat.detalhe}</div>`;
            }

            cardsHtml += `
            <div class="stat-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl">
                <div class="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0">
                        ${icon}
                    </div>
                    <span class="text-xs sm:text-sm text-slate-400 font-medium leading-tight">${stat.label}</span>
                </div>
                ${valorHtml}
                ${detalheHtml}
            </div>`;
        });

        return `
    <section class="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-18 lg:-mt-20 relative z-20 mb-8 sm:mb-10 lg:mb-12">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            ${cardsHtml}
        </div>
    </section>`;
    },

    // ──────────────────────────────────────────────────
    // RECOMENDACAO
    // ──────────────────────────────────────────────────
    renderRecomendacao() {
        const rec = this.data.recomendacao;
        const veredictoColor = this.getVeredictoColor(rec.veredicto);
        const glowClass = rec.veredicto === 'COMPRA' ? 'glow-green' : (rec.veredicto === 'MANTER' ? 'glow-amber' : '');
        const ticker = this.data.meta.ticker;

        return `
        <section class="mb-8 sm:mb-10 lg:mb-12 fade-in">
            <div class="dark-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 relative overflow-hidden ${glowClass}">
                <div class="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-${veredictoColor}-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 lg:gap-6">
                        <div class="space-y-3 sm:space-y-4 flex-1 order-2 lg:order-1">
                            <div>
                                <h2 class="text-xl sm:text-2xl font-bold text-white">Visão Geral</h2>
                                <p class="text-xs text-slate-500 mt-1 italic">
                                    Nota ${rec.nota}/10 — avaliação de gestão, portfólio, precificação e perspectivas.
                                    Não constitui recomendação de investimento.
                                </p>
                            </div>
                            <p class="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                                ${rec.resumo}
                            </p>
                        </div>
                        <div class="flex-shrink-0 order-1 lg:order-2 self-center lg:self-auto">
                            ${this.renderScoreRing(rec.nota, ticker)}
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // PONTOS DE ATENCAO
    // ──────────────────────────────────────────────────
    renderPontosAtencao() {
        const pontos = this.data.pontosAtencao;
        if (!pontos || pontos.length === 0) return '';

        let pontosHtml = '';
        pontos.forEach(ponto => {
            const sev = ponto.severidade;
            pontosHtml += `
                        <div class="bg-${sev}-900/20 rounded-2xl p-5 border border-${sev}-500/30">
                            <h3 class="text-${sev}-400 font-semibold mb-2">${ponto.titulo}</h3>
                            <p class="text-slate-400 text-sm">${ponto.descricao}</p>
                        </div>`;
        });

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 relative overflow-hidden glow-amber">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                            ${this.icons.warning}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">Pontos de Atenção</h2>
                            <p class="text-amber-400 text-sm font-semibold">Riscos a monitorar</p>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-${pontos.length} gap-4">
                        ${pontosHtml}
                    </div>
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // GESTORA
    // ──────────────────────────────────────────────────
    renderGestora() {
        const g = this.data.gestora;
        if (!g || !Array.isArray(g.stats) || g.stats.length === 0) return '';

        // Stats grid
        let statsHtml = '';
        g.stats.forEach(s => {
            const valorColor = s.cor ? `text-${s.cor}-400` : 'text-white';
            statsHtml += `
                        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                            <div class="text-lg font-bold ${valorColor}">${s.valor}</div>
                            <div class="text-xs text-slate-500">${s.label}</div>
                        </div>`;
        });

        // Link to gestora page
        const linkHtml = g.link
            ? `<div class="text-blue-400 text-sm font-medium flex items-center gap-1">
                        Ver análise completa da gestora
                        ${this.icons.chevronRight}
                    </div>`
            : '';

        const openTag = g.link
            ? `<a href="${g.link}" class="block dark-card rounded-3xl p-8 relative overflow-hidden hover:border-emerald-500/50 transition-colors">`
            : `<div class="dark-card rounded-3xl p-8 relative overflow-hidden">`;
        const closeTag = g.link ? `</a>` : `</div>`;

        return `
        <section class="mb-12 fade-in">
            ${openTag}
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                ${this.icons.shield}
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-white">Gestora do Fundo</h2>
                                <p class="text-slate-400 text-sm">${g.nome}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/30">${g.notaLabel}</span>
                            <div class="text-2xl font-bold text-emerald-400 mt-1">${g.nota}/10</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-${g.stats.length} gap-4 mb-4">
                        ${statsHtml}
                    </div>

                    <div class="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/20 mb-4">
                        <p class="text-slate-300 text-sm">
                            ${g.resumo}
                        </p>
                    </div>

                    ${linkHtml}
                </div>
            ${closeTag}
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // TAXAS
    // ──────────────────────────────────────────────────
    renderTaxas() {
        const t = this.data.taxas;
        if (!t || !Array.isArray(t.itens) || t.itens.length === 0) return '';

        const glowCor = t.glowCor || 'green';

        // Taxa items
        let taxasHtml = '';
        t.itens.forEach(item => {
            const corBorda = item.corBorda || 'emerald';
            // Text color for the value
            const valorColor = corBorda === 'slate' ? 'text-slate-300' : `text-${corBorda}-400`;
            taxasHtml += `
                        <div class="bg-slate-800/50 rounded-2xl p-5 border border-${corBorda}-500/30">
                            <div class="text-sm text-slate-400 mb-2">${item.label}</div>
                            <div class="text-3xl font-extrabold ${valorColor}">${item.valor}</div>
                            <div class="text-xs text-slate-500 mt-2">${item.detalhe}</div>
                        </div>`;
        });

        // Comparativo
        let comparativoHtml = '';
        if (t.comparativo) {
            let compItemsHtml = '';
            t.comparativo.forEach(comp => {
                const tickerColor = comp.destaque ? 'text-emerald-400' : 'text-slate-400';
                compItemsHtml += `
                            <div class="bg-slate-800/50 rounded-lg p-3 text-center">
                                <div class="text-lg font-bold ${tickerColor}">${comp.ticker}</div>
                                <div class="text-xl font-extrabold text-white">${comp.taxa}</div>
                                <div class="text-xs text-slate-500 mt-1">${comp.perf}</div>
                            </div>`;
            });

            comparativoHtml = `
                    <div class="bg-emerald-900/20 rounded-2xl p-5 border border-emerald-500/30">
                        <h3 class="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                            ${this.icons.checkCircle}
                            ${t.comparativoTitulo}
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-${t.comparativo.length} gap-3">
                            ${compItemsHtml}
                        </div>
                    </div>`;
        }

        // Detalhes (administrador, escriturador, etc.)
        let detalhesHtml = '';
        if (t.detalhes) {
            let detItemsHtml = '';
            t.detalhes.forEach(det => {
                detItemsHtml += `
                        <div class="bg-white/5 rounded-xl p-4">
                            <div class="text-sm text-slate-400 mb-1">${det.label}</div>
                            <div class="font-semibold text-white">${det.valor}</div>
                        </div>`;
            });
            detalhesHtml = `
                    <div class="grid md:grid-cols-${t.detalhes.length} gap-4 mt-6">
                        ${detItemsHtml}
                    </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 relative overflow-hidden glow-${glowCor}">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                            ${this.icons.moneyLarge}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">Taxas de Gestão</h2>
                            <p class="text-emerald-400 text-sm font-semibold">${t.subtitulo}</p>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-${t.itens.length} gap-6 mb-6">
                        ${taxasHtml}
                    </div>

                    ${comparativoHtml}
                    ${detalhesHtml}
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // AQUISICOES
    // ──────────────────────────────────────────────────
    renderAquisicoes() {
        const a = this.data.aquisicoes;
        if (!a) return '';

        // Acquisition items
        let itensHtml = '';
        a.itens.forEach(item => {
            // Stats
            let statsHtml = '';
            item.stats.forEach(s => {
                const valorColor = s.cor ? `text-${s.cor}-400` : 'text-white';
                statsHtml += `
                                <div class="bg-white/5 rounded-lg p-3">
                                    <div class="text-xs text-slate-500">${s.label}</div>
                                    <div class="font-bold ${valorColor}">${s.valor}</div>
                                </div>`;
            });

            // Locatarios
            let locatariosHtml = '';
            item.locatarios.forEach(loc => {
                locatariosHtml += `<span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">${loc}</span>`;
            });

            // Destaques
            let destaquesHtml = '';
            item.destaques.forEach(dest => {
                destaquesHtml += `
                                <div class="flex items-start gap-2">
                                    ${this.icons.checkCircleSmall}
                                    <span class="text-slate-300">${dest.texto}</span>
                                </div>`;
            });

            // Gradient mapping
            const gradMap = {
                'blue-purple': 'from-blue-500/10 to-purple-500/10',
                'indigo-purple': 'from-indigo-500/10 to-purple-500/10',
                'emerald-blue': 'from-emerald-500/10 to-blue-500/10'
            };
            const gradClass = gradMap[item.corGradiente] || 'from-blue-500/10 to-purple-500/10';
            const corBorda = item.corBorda || 'blue';

            itensHtml += `
                        <div class="bg-gradient-to-br ${gradClass} rounded-2xl p-6 border border-${corBorda}-500/20">
                            <div class="flex items-start justify-between mb-4">
                                <div>
                                    <h3 class="text-lg font-bold text-white mb-1">${item.titulo}</h3>
                                    <div class="text-sm text-${corBorda}-400">${item.subtitulo}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-emerald-400">${item.valor}</div>
                                    <div class="text-xs text-slate-400">${item.yield}</div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3 mb-4">
                                ${statsHtml}
                            </div>

                            <div class="mb-4">
                                <div class="text-xs text-slate-400 mb-2">Locatários:</div>
                                <div class="flex flex-wrap gap-2">
                                    ${locatariosHtml}
                                </div>
                            </div>

                            <div class="space-y-2 text-sm">
                                ${destaquesHtml}
                            </div>
                        </div>`;
        });

        // Impacto
        let impactoHtml = '';
        if (a.impacto) {
            let impactoItemsHtml = '';
            a.impacto.forEach(imp => {
                impactoItemsHtml += `
                            <li class="flex items-start gap-2">
                                <span class="text-purple-400 font-bold">&bull;</span>
                                <span>${imp}</span>
                            </li>`;
            });

            impactoHtml = `
                    <div class="mt-6 bg-purple-900/20 rounded-xl p-5 border border-purple-500/30">
                        <h4 class="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                            ${this.icons.clipboardCheck}
                            Impacto Estratégico
                        </h4>
                        <ul class="space-y-2 text-sm text-slate-300">
                            ${impactoItemsHtml}
                        </ul>
                    </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 relative overflow-hidden glow-purple">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            ${this.icons.plus}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">Últimas Aquisições</h2>
                            <p class="text-purple-400 text-sm font-semibold">${a.subtitulo}</p>
                        </div>
                    </div>

                    <p class="text-slate-300 mb-6">
                        ${a.resumo}
                    </p>

                    <div class="grid md:grid-cols-2 gap-6">
                        ${itensHtml}
                    </div>

                    ${impactoHtml}
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // PORTFOLIO
    // ──────────────────────────────────────────────────
    renderPortfolio() {
        const p = this.data.portfolio;
        if (!p || !Array.isArray(p.stats) || p.stats.length === 0) return '';

        // Stats
        let statsHtml = '';
        p.stats.forEach(s => {
            const valorColor = s.cor ? `text-${s.cor}-400` : 'text-white';
            statsHtml += `
                    <div class="bg-white/5 rounded-xl p-4 text-center">
                        <div class="text-3xl font-bold ${valorColor}">${s.valor}</div>
                        <div class="text-xs text-slate-500">${s.label}</div>
                    </div>`;
        });

        // Locatarios Nota (info box)
        let locatariosNotaHtml = '';
        if (p.locatariosNota) {
            locatariosNotaHtml = `
                <div class="mb-4 bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
                    <div class="flex items-start gap-2">
                        ${this.icons.infoCircle}
                        <div class="text-sm">
                            <p class="text-purple-400 font-semibold mb-1">${p.locatariosNota.titulo}</p>
                            <p class="text-slate-300">
                                ${p.locatariosNota.texto}
                            </p>
                        </div>
                    </div>
                </div>`;
        }

        // Locatarios table
        let locatariosTableHtml = '';
        if (p.locatarios && p.locatarios.length > 0) {
            let rowsHtml = '';
            p.locatarios.forEach((loc, i) => {
                const isLast = i === p.locatarios.length - 1;
                const borderClass = isLast ? '' : ' border-b border-white/5';
                rowsHtml += `
                            <tr class="asset-row${borderClass}">
                                <td class="p-3 font-medium text-white">${loc.nome}</td>
                                <td class="p-3 text-slate-400">${loc.setor}</td>
                                <td class="p-3 text-center font-bold text-white">${loc.receita}</td>
                                <td class="p-3 text-center"><span class="px-2 py-1 bg-${loc.ratingCor}-500/20 text-${loc.ratingCor}-400 rounded text-xs">${loc.rating}</span></td>
                                <td class="p-3 text-center"><span class="px-2 py-1 bg-${loc.riscoCor}-500/20 text-${loc.riscoCor}-400 rounded text-xs">${loc.risco}</span></td>
                            </tr>`;
            });

            locatariosTableHtml = `
                <h3 class="font-semibold text-white mb-4">Principais Locatários</h3>

                ${locatariosNotaHtml}

                <div class="overflow-x-auto mb-8">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-white/10">
                                <th class="text-left p-3 text-slate-400">Locatário</th>
                                <th class="text-left p-3 text-slate-400">Setor</th>
                                <th class="text-center p-3 text-slate-400">% Receita</th>
                                <th class="text-center p-3 text-slate-400">Rating</th>
                                <th class="text-center p-3 text-slate-400">Risco</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Portfólio de Ativos</h2>

                <div class="grid grid-cols-2 md:grid-cols-${p.stats.length} gap-4 mb-8">
                    ${statsHtml}
                </div>

                <div class="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h3 class="font-semibold text-white mb-4">Composição por Tipologia</h3>
                        <div class="chart-container">
                            <canvas id="tipologiaChart"></canvas>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-semibold text-white mb-4">Distribuição por Locatário</h3>
                        <div class="chart-container">
                            <canvas id="locatarioChart"></canvas>
                        </div>
                    </div>
                </div>

                ${locatariosTableHtml}
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // ATIVOS (Listagem Completa)
    // ──────────────────────────────────────────────────
    renderAtivos() {
        const a = this.data.ativos;
        if (!a) return '';

        // Legenda de Risco
        let legendaHtml = '<span class="text-xs text-slate-400">Nível de Risco:</span>';
        if (a.legendaRisco) {
            a.legendaRisco.forEach(item => {
                legendaHtml += `<span class="px-2 py-1 bg-${item.cor}-500/20 text-${item.cor}-400 rounded text-xs">${item.label}</span>`;
            });
        }

        // Table rows per group
        let gruposHtml = '';
        a.grupos.forEach(grupo => {
            // Group header row - determine bg color
            const corMap = {
                blue: 'bg-blue-900/10',
                orange: 'bg-orange-900/10',
                emerald: 'bg-emerald-900/10',
                purple: 'bg-purple-900/10',
                slate: 'bg-slate-700/30',
                amber: 'bg-amber-900/10'
            };
            const bgClass = corMap[grupo.cor] || 'bg-slate-700/30';
            const textColorClass = grupo.cor === 'slate' ? 'text-slate-300' : `text-${grupo.cor}-400`;

            gruposHtml += `<tr class="${bgClass}"><td colspan="7" class="py-2 px-2 font-bold ${textColorClass} text-xs uppercase tracking-wider">${grupo.nome}</td></tr>`;

            grupo.itens.forEach(item => {
                // Format ABL number with dots
                const ablFormatted = this.formatNumber(item.abl);

                // Determine if ABL should be bold (for large assets like BAT)
                const ablBoldClass = item.abl > 50000 ? ' font-bold' : '';

                // Determine if vencimento should be highlighted (orange for near-term)
                const vencIsOrange = item.riscoCor === 'orange' && item.risco.toLowerCase().includes('venc');
                const vencClass = vencIsOrange ? 'text-orange-400 font-bold' : 'text-slate-300';

                gruposHtml += `
                            <tr class="asset-row border-b border-slate-800/50">
                                <td class="py-2 px-2 font-medium text-white">${item.nome}</td>
                                <td class="py-2 px-2 text-slate-400">${item.cidade}</td>
                                <td class="text-center py-2 px-2"><span class="px-2 py-0.5 bg-${item.tipoCor}-500/20 text-${item.tipoCor}-400 text-xs rounded">${item.tipo}</span></td>
                                <td class="text-right py-2 px-2 text-white${ablBoldClass}">${ablFormatted}</td>
                                <td class="py-2 px-2 text-slate-300">${item.locatario}</td>
                                <td class="text-center py-2 px-2 ${vencClass}">${item.vencimento}</td>
                                <td class="text-center py-2 px-2"><span class="px-2 py-1 bg-${item.riscoCor}-500/20 text-${item.riscoCor}-400 rounded text-xs">${item.risco}</span></td>
                            </tr>`;
            });
        });

        // Resumo de Riscos
        let riscoResumoHtml = '';
        const p = this.data.portfolio;
        if (p && p.riscoResumo) {
            let riscoCardsHtml = '';
            p.riscoResumo.forEach(r => {
                riscoCardsHtml += `
                    <div class="bg-${r.cor}-900/20 rounded-xl p-4 border border-${r.cor}-500/30 text-center">
                        <div class="text-2xl font-bold text-${r.cor}-400">${r.valor}</div>
                        <div class="text-sm text-slate-400">${r.label}</div>
                    </div>`;
            });

            riscoResumoHtml = `
                <div class="mt-6 grid md:grid-cols-${p.riscoResumo.length} gap-4">
                    ${riscoCardsHtml}
                </div>`;
        }

        // Risco Nota
        let riscoNotaHtml = '';
        if (p && p.riscoNota) {
            riscoNotaHtml = `
                <div class="mt-4 bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                    <p class="text-slate-400 text-sm">
                        <strong class="text-blue-400">Nota:</strong> ${p.riscoNota}
                    </p>
                </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            ${this.icons.buildingLarge}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">Listagem Completa de Ativos</h2>
                            <p class="text-slate-400">${a.subtitulo}</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3 mb-6">
                    ${legendaHtml}
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-slate-700">
                                <th class="text-left py-3 px-2 text-slate-400 font-semibold">Ativo</th>
                                <th class="text-left py-3 px-2 text-slate-400 font-semibold">Cidade/UF</th>
                                <th class="text-center py-3 px-2 text-slate-400 font-semibold">Tipo</th>
                                <th class="text-right py-3 px-2 text-slate-400 font-semibold">ABL (m2)</th>
                                <th class="text-left py-3 px-2 text-slate-400 font-semibold">Locatário</th>
                                <th class="text-center py-3 px-2 text-slate-400 font-semibold">Vencimento</th>
                                <th class="text-center py-3 px-2 text-slate-400 font-semibold">Risco</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${gruposHtml}
                        </tbody>
                    </table>
                </div>

                ${riscoResumoHtml}
                ${riscoNotaHtml}
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // ATIVOS DETALHADOS (Carteira do Fundo)
    // ──────────────────────────────────────────────────
    renderAtivosDetalhados() {
        const ad = this.data.ativosDetalhados;
        if (!ad) return '';

        let cardsHtml = '';
        ad.itens.forEach(item => {
            // Risk badge color
            const riskColors = {
                'Muito Baixo': 'emerald', 'Baixo': 'emerald', 'Moderado': 'blue',
                'Elevado': 'amber', 'Alto': 'orange', 'Muito Alto': 'red', 'Crítico': 'red'
            };
            const qualityColors = {
                'Excelente': 'emerald', 'Boa': 'emerald', 'Razoável': 'blue',
                'Regular': 'amber', 'Fraca': 'orange', 'Ruim': 'red'
            };
            const riskColor = riskColors[item.risco] || 'slate';
            const qualColor = qualityColors[item.qualidade] || 'slate';

            // Contract info
            let contratoHtml = '';
            if (item.contrato) {
                contratoHtml = `
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                        ${item.contrato.tipo ? `<div><span class="text-slate-500">Tipo:</span> <span class="text-slate-300">${item.contrato.tipo}</span></div>` : ''}
                        ${item.contrato.termino ? `<div><span class="text-slate-500">Término:</span> <span class="text-${item.contrato.terminoCor || 'slate'}-400 font-semibold">${item.contrato.termino}</span></div>` : ''}
                        ${item.contrato.reajuste ? `<div><span class="text-slate-500">Reajuste:</span> <span class="text-slate-300">${item.contrato.reajuste}</span></div>` : ''}
                        ${item.contrato.multa ? `<div><span class="text-slate-500">Multa:</span> <span class="text-slate-300">${item.contrato.multa}</span></div>` : ''}
                    </div>`;
            }

            // Key points
            let pontosHtml = '';
            if (item.pontos && item.pontos.length > 0) {
                let pontosItems = '';
                item.pontos.forEach(p => {
                    pontosItems += `<li class="flex items-start gap-1.5"><span class="text-${p.cor || 'slate'}-400 mt-0.5">•</span><span>${p.texto}</span></li>`;
                });
                pontosHtml = `<ul class="mt-3 space-y-1 text-xs text-slate-400">${pontosItems}</ul>`;
            }

            cardsHtml += `
                <div class="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-${item.corBorda || 'slate'}-500/40 transition-colors">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-${item.corIcone || 'blue'}-500/20 flex items-center justify-center text-lg">${item.icone || '🏢'}</div>
                            <div>
                                <h4 class="text-white font-bold text-sm">${item.nome}</h4>
                                <span class="text-xs text-slate-500">${item.tipo}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-${item.participacaoCor || 'white'}-400">${item.participacao}</div>
                            <div class="text-[10px] text-slate-500">da receita</div>
                        </div>
                    </div>

                    <p class="text-xs text-slate-400 leading-relaxed">${item.descricao}</p>

                    <div class="mt-3 flex flex-wrap gap-2">
                        <span class="px-2 py-0.5 bg-${riskColor}-500/20 text-${riskColor}-400 rounded text-[10px] font-medium">Risco: ${item.risco}</span>
                        <span class="px-2 py-0.5 bg-${qualColor}-500/20 text-${qualColor}-400 rounded text-[10px] font-medium">Qualidade: ${item.qualidade}</span>
                        ${item.relevancia ? `<span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-medium">${item.relevancia}</span>` : ''}
                    </div>

                    ${contratoHtml}
                    ${pontosHtml}
                </div>`;
        });

        // Resumo
        let resumoHtml = '';
        if (ad.resumo) {
            resumoHtml = `
                <div class="mt-6 bg-blue-900/20 rounded-xl p-5 border border-blue-500/30">
                    <p class="text-slate-400 text-sm leading-relaxed">${ad.resumo}</p>
                </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        ${this.icons.buildingLarge}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">Carteira Detalhada</h2>
                        <p class="text-slate-400 text-sm">${ad.subtitulo}</p>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4 mt-6">
                    ${cardsHtml}
                </div>

                ${resumoHtml}
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // TIMELINE
    // ──────────────────────────────────────────────────
    renderTimeline() {
        const t = this.data.timeline;
        if (!t || !Array.isArray(t.periodos) || t.periodos.length === 0) return '';

        // Periodos
        let periodosHtml = '';
        t.periodos.forEach((per, i) => {
            const isLast = i === t.periodos.length - 1;
            const mbClass = isLast ? '' : ' mb-8';
            const borderClass = per.cor !== 'blue' && per.cor !== 'slate' ? ` border border-${per.cor}-500/30` : ' border border-slate-700/50';

            let pontosHtml = '';
            per.pontos.forEach(ponto => {
                pontosHtml += `<li>&bull; ${ponto}</li>`;
            });

            periodosHtml += `
                    <div class="${mbClass} relative">
                        <div class="timeline-dot bg-${per.cor}-500 absolute -left-12"></div>
                        <div class="bg-slate-800/50 rounded-xl p-5${borderClass}">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-${per.cor}-400 font-bold">${per.periodo}</span>
                                <span class="px-2 py-1 bg-${per.cor}-500/20 text-${per.cor}-400 text-xs rounded">${per.label}</span>
                            </div>
                            <p class="text-slate-300 text-sm mb-2">${per.descricao}</p>
                            <ul class="text-xs text-slate-400 mt-2 space-y-1">
                                ${pontosHtml}
                            </ul>
                        </div>
                    </div>`;
        });

        // Resumo Trajetoria
        let resumoHtml = '';
        if (t.resumoTrajetoria) {
            resumoHtml = `
                <div class="mt-8 bg-emerald-900/20 rounded-xl p-5 border border-emerald-500/30">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                        <div>
                            <p class="text-emerald-400 font-medium">${t.resumoTrajetoria.titulo}</p>
                            <p class="text-slate-400 text-sm mt-1">${t.resumoTrajetoria.texto}</p>
                        </div>
                    </div>
                </div>`;
        }

        // Crescimento stats
        let crescimentoHtml = '';
        if (t.crescimento) {
            let crescCardsHtml = '';
            t.crescimento.forEach(c => {
                crescCardsHtml += `
                    <div class="text-center">
                        <div class="text-xs text-slate-500 mb-1">${c.label}</div>
                        <div class="text-2xl font-bold text-emerald-400">${c.valor}</div>
                        <div class="text-xs text-slate-500">${c.detalhe}</div>
                    </div>`;
            });

            crescimentoHtml = `
                <div class="grid md:grid-cols-${t.crescimento.length} gap-4 mt-6">
                    ${crescCardsHtml}
                </div>`;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 overflow-hidden">
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        ${this.icons.clock}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">História do Fundo (${t.periodos[0].periodo.split('-')[0]}-${t.periodos[t.periodos.length - 1].periodo.split('-').pop()})</h2>
                        <p class="text-slate-400 text-sm">${t.subtitulo}</p>
                    </div>
                </div>

                <div class="relative pl-12">
                    <div class="timeline-line"></div>
                    ${periodosHtml}
                </div>

                ${resumoHtml}
                ${crescimentoHtml}
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // TESE DE INVESTIMENTO
    // ──────────────────────────────────────────────────
    renderTese() {
        const t = this.data.tese;
        if (!t || !Array.isArray(t.paraQuem) || !Array.isArray(t.naoParaQuem)) return '';

        // Para quem serve
        let paraQuemHtml = '';
        t.paraQuem.forEach(item => {
            paraQuemHtml += `
                                <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>${item}</span>
                                </li>`;
        });

        // Para quem nao serve
        let naoParaQuemHtml = '';
        t.naoParaQuem.forEach(item => {
            naoParaQuemHtml += `
                                <li class="flex items-start gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></span>
                                    <span>${item}</span>
                                </li>`;
        });

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl shadow-lg overflow-hidden">
                <div class="p-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            ${this.icons.checkCircleOutline}
                        </div>
                        <h2 class="text-2xl font-bold text-white">Tese de Investimento</h2>
                    </div>

                    <p class="text-lg text-slate-300 leading-relaxed mb-8">
                        ${t.resumo}
                    </p>

                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-emerald-900/20 rounded-2xl p-6 border border-emerald-500/30">
                            <h3 class="flex items-center gap-2 font-bold text-emerald-400 mb-4">
                                ${this.icons.checkCircle}
                                Para quem serve
                            </h3>
                            <ul class="space-y-3 text-slate-300">
                                ${paraQuemHtml}
                            </ul>
                        </div>

                        <div class="bg-amber-900/20 rounded-2xl p-6 border border-amber-500/30">
                            <h3 class="flex items-center gap-2 font-bold text-amber-400 mb-4">
                                ${this.icons.xCircle}
                                Para quem não serve
                            </h3>
                            <ul class="space-y-3 text-slate-300">
                                ${naoParaQuemHtml}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // DIVIDENDOS
    // ──────────────────────────────────────────────────
    renderDividendos() {
        const div = this.data.dividendos;
        if (!div || !Array.isArray(div.totaisAnuais) || !Array.isArray(div.stats)) return '';

        // Totais anuais
        let totaisHtml = '';
        div.totaisAnuais.forEach(t => {
            const valorColor = t.cor ? `text-${t.cor}-400` : 'text-white';
            if (t.destaque) {
                totaisHtml += `
                            <div class="flex justify-between items-center p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                <span class="text-slate-300">${t.ano}</span>
                                <span class="font-bold text-white">${t.valor}</span>
                            </div>`;
            } else {
                totaisHtml += `
                            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span class="text-slate-400">${t.ano}</span>
                                <span class="font-bold ${valorColor}">${t.valor}</span>
                            </div>`;
            }
        });

        // Guidance
        let guidanceHtml = '';
        if (div.guidance) {
            guidanceHtml = `
                        <div class="mt-4 p-3 bg-blue-500/10 rounded-lg text-center">
                            <div class="text-xs text-slate-400">Guidance ${div.guidance.periodo}</div>
                            <div class="text-lg font-bold text-white">${div.guidance.faixa}</div>
                            <div class="text-xs text-slate-400">${div.guidance.unidade}</div>
                        </div>`;
        }

        // Stats
        let statsHtml = '';
        div.stats.forEach(s => {
            const valorColor = s.cor ? `text-${s.cor}-400` : 'text-white';
            statsHtml += `
                    <div class="bg-white/5 rounded-xl p-4 text-center">
                        <div class="text-2xl font-bold ${valorColor}">${s.valor}</div>
                        <div class="text-xs text-slate-500">${s.label}</div>
                    </div>`;
        });

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Histórico de Dividendos</h2>

                <div class="grid md:grid-cols-3 gap-6 mb-8">
                    <div class="md:col-span-2">
                        <h3 class="font-semibold text-white mb-4">Dividendos Mensais (Ajustados pós-split)</h3>
                        <div class="chart-container">
                            <canvas id="dividendosChart"></canvas>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-semibold text-white mb-4">Totais Anuais</h3>
                        <div class="space-y-2">
                            ${totaisHtml}
                        </div>
                        ${guidanceHtml}
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-${div.stats.length} gap-4">
                    ${statsHtml}
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // VALUATION
    // ──────────────────────────────────────────────────
    renderValuation() {
        const v = this.data.valuation;
        if (!v || !v.pvp) return '';

        // PVP card
        let pvpDetalhesHtml = '';
        if (v.pvp.detalhes) {
            let detItems = '';
            v.pvp.detalhes.forEach(d => {
                const valColor = d.cor ? `text-${d.cor}-400` : 'text-white';
                detItems += `
                            <div class="p-2 bg-white/5 rounded">
                                <div class="text-xs text-slate-500">${d.label}</div>
                                <div class="font-bold ${valColor}">${d.valor}</div>
                            </div>`;
            });
            pvpDetalhesHtml = `
                        <div class="grid grid-cols-2 gap-2 mt-4">
                            ${detItems}
                        </div>`;
        }

        // Spread card
        const spreadColor = v.spread.cor || 'emerald';

        // Recomendacoes card (optional)
        let recCardHtml = '';
        if (v.recomendacoes) {
            const recColor = v.recomendacoes.cor || 'blue';
            recCardHtml = `
                    <div class="bg-white/5 rounded-xl p-6 text-center">
                        <div class="text-5xl font-bold text-${recColor}-400 mb-2">${v.recomendacoes.valor}</div>
                        <div class="text-slate-400 mb-4">${v.recomendacoes.label}</div>
                        <p class="text-sm text-slate-400">${v.recomendacoes.descricao}</p>
                        <div class="mt-4 p-3 bg-${recColor}-500/10 rounded-lg">
                            <div class="text-xs text-slate-400">${v.recomendacoes.detalhe}</div>
                        </div>
                    </div>`;
        }

        const gridCols = v.recomendacoes ? 'md:grid-cols-3' : 'md:grid-cols-2';

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Valuation e Comparativos</h2>

                <div class="grid ${gridCols} gap-6">
                    <div class="bg-white/5 rounded-xl p-6 text-center">
                        <div class="text-5xl font-bold text-white mb-2">${v.pvp.valor}</div>
                        <div class="text-slate-400 mb-4">P/VP</div>
                        <p class="text-sm text-slate-400">${v.pvp.descricao}</p>
                        ${pvpDetalhesHtml}
                    </div>
                    <div class="bg-white/5 rounded-xl p-6 text-center">
                        <div class="text-5xl font-bold text-${spreadColor}-400 mb-2">${v.spread.valor}</div>
                        <div class="text-slate-400 mb-4">${v.spread.label}</div>
                        <p class="text-sm text-slate-400">${v.spread.descricao}</p>
                        <div class="mt-4 p-3 bg-${spreadColor}-500/10 rounded-lg">
                            <div class="text-xs text-slate-400">${v.spread.detalhe}</div>
                        </div>
                    </div>
                    ${recCardHtml}
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // CONCLUSAO
    // ──────────────────────────────────────────────────
    renderConclusao() {
        const c = this.data.conclusao;
        if (!c || !Array.isArray(c.paragrafos) || !Array.isArray(c.pontosFortes) || !Array.isArray(c.pontosDeAtencao)) return '';

        // Paragrafos
        let paragrafosHtml = '';
        c.paragrafos.forEach(p => {
            paragrafosHtml += `
                <p class="text-slate-300 mb-4">
                    ${p}
                </p>`;
        });

        // Pontos Fortes
        let pontosFortes = '';
        c.pontosFortes.forEach(pf => {
            pontosFortes += `<li>- ${pf}</li>`;
        });

        // Pontos de Atencao
        let pontosAtencao = '';
        c.pontosDeAtencao.forEach(pa => {
            pontosAtencao += `<li>- ${pa}</li>`;
        });

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Perspectivas e Análise Final</h2>

                ${paragrafosHtml}

                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                        <h4 class="font-semibold text-emerald-400 mb-3">Pontos Fortes</h4>
                        <ul class="text-sm text-slate-300 space-y-1">
                            ${pontosFortes}
                        </ul>
                    </div>
                    <div class="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20">
                        <h4 class="font-semibold text-amber-400 mb-3">Pontos de Atenção</h4>
                        <ul class="text-sm text-slate-300 space-y-1">
                            ${pontosAtencao}
                        </ul>
                    </div>
                </div>

                <div class="bg-emerald-900/20 rounded-xl p-5 border border-emerald-500/30">
                    <h4 class="font-semibold text-emerald-400 mb-2">Conclusão</h4>
                    <p class="text-slate-300 text-sm">
                        ${c.conclusaoFinal}
                    </p>
                </div>
            </div>
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────────────────
    renderFooter() {
        const f = this.data.footer;
        if (!f) return '';

        return `
    <footer class="border-t border-white/10 py-8 px-4 text-center">
        <p class="text-slate-400 text-sm mb-2">Análise gerada em ${f.dataAnalise} com base em ${f.totalDocumentos} documentos oficiais do fundo</p>
        <p class="text-slate-500 text-xs">
            ${f.disclaimer}
        </p>
    </footer>`;
    },

    // ──────────────────────────────────────────────────
    // CHARTS
    // ──────────────────────────────────────────────────
    initCharts() {
        const d = this.data;

        // Tipologia Chart (Doughnut)
        if (d.portfolio && d.portfolio.tipologiaChart) {
            const tc = d.portfolio.tipologiaChart;
            const tipCanvas = document.getElementById('tipologiaChart');
            if (tipCanvas) {
                new Chart(tipCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: tc.labels,
                        datasets: [{
                            data: tc.data,
                            backgroundColor: tc.cores,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 15 } }
                        }
                    }
                });
            }
        }

        // Locatario Chart (Doughnut)
        if (d.portfolio && d.portfolio.locatarioChart) {
            const lc = d.portfolio.locatarioChart;
            const locCanvas = document.getElementById('locatarioChart');
            if (locCanvas) {
                new Chart(locCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: lc.labels,
                        datasets: [{
                            data: lc.data,
                            backgroundColor: lc.cores,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 10, font: { size: 10 } } }
                        }
                    }
                });
            }
        }

        // Dividendos Chart (Bar)
        if (d.dividendos) {
            const div = d.dividendos;
            const divCanvas = document.getElementById('dividendosChart');
            if (divCanvas) {
                new Chart(divCanvas, {
                    type: 'bar',
                    data: {
                        labels: div.chartLabels,
                        datasets: [{
                            label: 'Dividendo por Cota (R$)',
                            data: div.chartData,
                            backgroundColor: div.chartCor || '#10b981',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: div.chartYMin || 0.07,
                                max: div.chartYMax || 0.10,
                                ticks: { color: '#9ca3af' },
                                grid: { color: 'rgba(255,255,255,0.05)' }
                            },
                            x: {
                                ticks: { color: '#9ca3af' },
                                grid: { display: false }
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    },

    // ──────────────────────────────────────────────────
    // SCROLL LISTENERS
    // ──────────────────────────────────────────────────
    initScrollListeners() {
        const stickyNav = document.getElementById('stickyNav');
        if (stickyNav) {
            window.addEventListener('scroll', () => {
                stickyNav.classList.toggle('hidden', window.scrollY < 300);
            });
        }
    },

    // ──────────────────────────────────────────────────
    // UTILITIES
    // ──────────────────────────────────────────────────

    /**
     * Map veredicto to Tailwind color name
     * COMPRA → emerald, MANTER → amber, VENDA → red
     */
    getVeredictoColor(veredicto) {
        const map = { 'COMPRA': 'emerald', 'MANTER': 'amber', 'VENDA': 'red' };
        return map[veredicto] || 'emerald';
    },

    /**
     * Render the animated score ring SVG
     * stroke-dasharray = 282.7, offset = 282.7 * (1 - nota/10)
     */
    renderScoreRing(nota, ticker) {
        const offset = (282.7 * (1 - nota / 10)).toFixed(1);
        const gradientId = `scoreGradient${ticker}`;
        return `
                            <div class="relative w-32 h-32">
                                <svg class="w-32 h-32 score-ring" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="8"/>
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#${gradientId})" stroke-width="8"
                                            stroke-dasharray="282.7" stroke-dashoffset="${offset}" stroke-linecap="round"/>
                                    <defs>
                                        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style="stop-color:#10b981"/>
                                            <stop offset="100%" style="stop-color:#3b82f6"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center">
                                    <span class="text-4xl font-extrabold text-white">${nota}</span>
                                    <span class="text-sm text-slate-400">/10</span>
                                </div>
                            </div>`;
    },

    /**
     * Format a number with dots as thousands separator (Brazilian style)
     * e.g. 13837 → "13.837"
     */
    formatNumber(n) {
        if (n === undefined || n === null) return '';
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
};

// Export for use
window.FIITemplate = FIITemplate;
