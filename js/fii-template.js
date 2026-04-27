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
        html += this.renderTabNav();
        html += '<main class="max-w-7xl mx-auto px-4 pb-16">';

        // Visao Geral
        html += '<div class="fii-tab-pane" data-tab-pane="visao-geral">';
        html += this.renderVisaoGeralPriceTimeline();
        html += this.renderRecomendacao();
        html += this.renderPontosAtencao();
        html += '</div>';

        // Encaixe na carteira (v1)
        if (d.encaixe) {
            html += '<div class="fii-tab-pane" data-tab-pane="encaixe" hidden>';
            html += this.renderEncaixe();
            html += '</div>';
        }

        // Dividendos
        html += '<div class="fii-tab-pane" data-tab-pane="dividendos" hidden>';
        html += this.renderDividendos();
        html += '</div>';

        // Portfolio
        html += '<div class="fii-tab-pane" data-tab-pane="portfolio" hidden>';
        if (d.aquisicoes) html += this.renderAquisicoes();
        html += this.renderPortfolio();
        if (d.ativos) html += this.renderAtivos();
        if (d.ativosDetalhados) html += this.renderAtivosDetalhados();
        html += '</div>';

        // Valuation
        html += '<div class="fii-tab-pane" data-tab-pane="valuation" hidden>';
        html += this.renderValuation();
        html += '</div>';

        // Gestora & Taxas
        html += '<div class="fii-tab-pane" data-tab-pane="gestora" hidden>';
        if (d.gestora) html += this.renderGestora();
        html += this.renderTaxas();
        html += '</div>';

        // Historia (timeline) + Tese
        html += '<div class="fii-tab-pane" data-tab-pane="historia" hidden>';
        html += this.renderTimeline();
        html += this.renderTese();
        html += '</div>';

        // Conclusao
        html += '<div class="fii-tab-pane" data-tab-pane="conclusao" hidden>';
        html += this.renderConclusao();
        html += '</div>';

        html += '</main>';
        html += this.renderFooter();

        root.innerHTML = html;
        this.initTabs();
    },

    // ──────────────────────────────────────────────────
    // TAB NAV — menu de navegacao por conteudo (mobile-first)
    // ──────────────────────────────────────────────────
    renderTabNav() {
        const d = this.data;
        const tabs = [
            { id: 'visao-geral', label: 'Visão Geral',         icon: 'home'   },
            { id: 'encaixe',     label: 'Risco', icon: 'target' },
            { id: 'dividendos',  label: 'Dividendos',          icon: 'money'  },
            { id: 'portfolio',   label: 'Portfólio',           icon: 'build'  },
            { id: 'valuation',   label: 'Valuation',           icon: 'chart'  },
            { id: 'gestora',     label: 'Gestora',             icon: 'users'  },
            { id: 'historia',    label: 'História',            icon: 'clock'  },
            { id: 'conclusao',   label: 'Conclusão',           icon: 'flag'   }
        ];
        // Filtra tabs sem conteudo
        const has = (id) => {
            if (id === 'encaixe')    return !!d.encaixe;
            if (id === 'dividendos') return !!d.dividendos;
            if (id === 'portfolio')  return !!(d.portfolio || d.aquisicoes || d.ativos || d.ativosDetalhados);
            if (id === 'valuation')  return !!(d.valuation && d.valuation.pvp);
            if (id === 'gestora')    return !!(d.gestora || d.taxas);
            if (id === 'historia')   return !!(d.timeline || d.tese);
            if (id === 'conclusao')  return !!(d.conclusao);
            return true;
        };
        const glyphs = {
            home:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>',
            target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
            money:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
            build:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>',
            chart:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M7 14l4-4 4 4 6-6"/></svg>',
            users:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
            clock:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
            flag:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>'
        };
        const items = tabs.filter(t => has(t.id)).map((t, i) => `
            <button type="button" class="fii-tab-btn ${i === 0 ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${i === 0}">
                <span class="fii-tab-icon" aria-hidden="true">${glyphs[t.icon] || ''}</span>
                <span class="fii-tab-label">${t.label}</span>
            </button>`).join('');
        return `
        <nav class="fii-tabs" role="tablist" aria-label="Seções da análise">
            <div class="fii-tabs-inner">${items}</div>
        </nav>`;
    },

    initTabs() {
        const nav = document.querySelector('.fii-tabs');
        if (!nav) return;
        const btns  = nav.querySelectorAll('.fii-tab-btn');
        const panes = document.querySelectorAll('.fii-tab-pane');
        const self  = this;

        const activate = (id) => {
            btns.forEach(b => {
                const on = b.dataset.tab === id;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            panes.forEach(p => {
                const on = p.dataset.tabPane === id;
                if (on) {
                    p.hidden = false;
                    p.classList.add('fade-in');
                } else {
                    p.hidden = true;
                    p.classList.remove('fade-in');
                }
            });
            // Scroll para topo da aba em mobile
            const hero = document.querySelector('.hero-wrap, .hero, main');
            if (window.matchMedia('(max-width: 768px)').matches) {
                const navOffset = nav.offsetTop;
                window.scrollTo({ top: Math.max(navOffset - 8, 0), behavior: 'smooth' });
            }
            // Re-inicializa charts da aba ativa (Chart.js so renderiza quando canvas eh visivel)
            if (id === 'dividendos') {
                setTimeout(() => self.initCharts(), 60);
            }
            if (id === 'visao-geral') {
                setTimeout(() => {
                    if (self._charts && self._charts.vgPriceChart) {
                        try { self._charts.vgPriceChart.resize(); } catch(e){}
                    } else {
                        self._initVisaoGeralPriceChart();
                    }
                }, 60);
            }
            // Atualiza URL
            if (history.replaceState) {
                const url = new URL(window.location.href);
                url.hash = id;
                history.replaceState(null, '', url.toString());
            }
        };

        btns.forEach(b => {
            b.addEventListener('click', () => activate(b.dataset.tab));
        });

        // Ativa pelo hash inicial (ex: /fiis/blmg11/#dividendos)
        const hash = (window.location.hash || '').replace('#', '');
        if (hash && nav.querySelector(`[data-tab="${hash}"]`)) {
            activate(hash);
        }

        // Scroll horizontal no mobile: centraliza a tab ativa
        const inner = nav.querySelector('.fii-tabs-inner');
        if (inner) {
            const active = inner.querySelector('.is-active');
            if (active) {
                const offset = active.offsetLeft - (inner.clientWidth / 2) + (active.clientWidth / 2);
                inner.scrollTo({ left: Math.max(offset, 0), behavior: 'smooth' });
            }
        }
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
    <header class="hero-desktop hero-gradient text-white py-8 lg:py-10 relative z-10 hidden lg:block">
        <div class="max-w-7xl mx-auto px-4 relative z-10">
            <div class="flex flex-row justify-between items-center gap-6">
                <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-5xl lg:text-6xl font-extrabold tracking-tight">${m.ticker}</h1>
                    <span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-${veredictoColor}-500/20 text-${veredictoColor}-400 text-sm font-semibold border border-${veredictoColor}-500/30" title="Nota 0-10 baseada em gestão, portfólio, precificação e perspectivas. Não é recomendação de investimento.">
                        ${this.icons.star}
                        NOTA ${rec.nota}/10
                    </span>
                </div>
                <div class="text-right">
                    <div class="text-xs text-blue-300 uppercase tracking-wider mb-1">Cota Atual</div>
                    <div class="flex items-baseline justify-end gap-2 leading-none">
                        <span class="text-2xl text-blue-200 font-semibold">R$</span>
                        <span class="text-5xl lg:text-6xl font-extrabold">${ind.cotacao}</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">em ${ind.cotacaoData}</div>
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

            <!-- Cotação — HERO VISUAL -->
            <div class="hm2-price-label">Cota Atual</div>
            <div class="hm2-price">
                <span class="hm2-currency">R$</span>
                <span class="hm2-amount">${ind.cotacao}</span>
            </div>
            <div class="hm2-price-caption">em ${ind.cotacaoData || '—'}</div>

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
    // VISAO GERAL — gráfico de preço + timeline de TODOS os eventos
    // ──────────────────────────────────────────────────
    renderVisaoGeralPriceTimeline() {
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();
        if (!ticker) return '';
        const periodos = [
            { id: '1m',  label: '1m',  meses: 1 },
            { id: '3m',  label: '3m',  meses: 3 },
            { id: '6m',  label: '6m',  meses: 6, ativo: true },
            { id: '1a',  label: '1 ano',  meses: 12 },
            { id: '2a',  label: '2 anos', meses: 24 },
            { id: '5a',  label: '5 anos', meses: 60 },
            { id: 'all', label: 'Tudo',   meses: null }
        ];
        const btns = periodos.map(p => `
            <button type="button" class="vg-period-btn ${p.ativo ? 'is-active' : ''}" data-period="${p.id}" data-meses="${p.meses == null ? 'all' : p.meses}">${p.label}</button>
        `).join('');
        return `
        <section class="dark-card rounded-3xl p-4 md:p-6 mb-6 vg-price-card">
            <div class="vg-price-head">
                <div>
                    <div class="vg-price-tag">PREÇO DA COTA + EVENTOS RELEVANTES</div>
                    <div class="vg-price-titulo">Linha do tempo do fundo — clique nos pontos para detalhes</div>
                </div>
                <div class="vg-period-selector">${btns}</div>
            </div>
            <div class="vg-price-wrap">
                <div class="vg-price-canvas-host">
                    <canvas id="vg-price-canvas-${ticker}"></canvas>
                    <div class="vg-markers-layer" id="vg-markers-${ticker}"></div>
                    <div class="vg-range-overlay" id="vg-range-overlay-${ticker}" hidden></div>
                    <div class="vg-range-anchor vg-range-anchor-a" id="vg-range-anchor-a-${ticker}" hidden></div>
                    <div class="vg-range-anchor vg-range-anchor-b" id="vg-range-anchor-b-${ticker}" hidden></div>
                    <div class="vg-range-label" id="vg-range-label-${ticker}" hidden></div>
                </div>
                <div class="vg-range-hint">
                    <span class="vg-hint-desktop">💡 Clique e arraste no gráfico para comparar dois pontos</span>
                    <span class="vg-hint-mobile">💡 Toque em dois pontos do gráfico para comparar — toque novamente para limpar</span>
                </div>
                <div class="vg-tooltip" id="vg-tooltip-${ticker}" hidden></div>
            </div>
            <div class="vg-legend">
                <span class="vg-legend-item"><span class="vg-legend-dot" style="background:#10b981"></span>Aquisição/Receita</span>
                <span class="vg-legend-item"><span class="vg-legend-dot" style="background:#3b82f6"></span>Estrutural</span>
                <span class="vg-legend-item"><span class="vg-legend-dot" style="background:#8b5cf6"></span>Mudança/Mandato</span>
                <span class="vg-legend-item"><span class="vg-legend-dot" style="background:#f59e0b"></span>Fato Relevante</span>
                <span class="vg-legend-item"><span class="vg-legend-dot" style="background:#ef4444"></span>Risco / Evento Futuro</span>
                <span class="vg-legend-item"><span class="vg-legend-dot vg-legend-future"></span>Evento futuro (linha tracejada)</span>
            </div>
        </section>

        <!-- Drawer lateral de detalhes do evento -->
        <div class="vg-drawer-backdrop" id="vg-drawer-bd-${ticker}" hidden></div>
        <aside class="vg-drawer" id="vg-drawer-${ticker}" hidden aria-hidden="true">
            <button type="button" class="vg-drawer-close" id="vg-drawer-close-${ticker}" aria-label="Fechar">×</button>
            <div class="vg-drawer-content" id="vg-drawer-content-${ticker}"></div>
        </aside>`;
    },

    /**
     * Coleta TODOS os eventos com data do JSON do fundo, unifica num array com:
     *  { data, dataExata, tipo, severidade, cor, icone, titulo, descricao, valor, fonte, origem }
     */
    _collectAllTimelineEvents() {
        const d = this.data;
        const eventos = [];

        const tipoStyle = {
            // VERDE — evento bom para o cotista
            aquisicao:                  { cor: '#10b981', icone: '+', label: 'Aquisição' },
            fechamento:                 { cor: '#10b981', icone: '✓', label: 'Fechamento' },
            cashback_inicio:            { cor: '#10b981', icone: '$', label: 'Cashback Início' },
            extraordinaria_historica:   { cor: '#10b981', icone: '★', label: 'Extraordinária' },
            aumento_sustentavel:        { cor: '#10b981', icone: '↑', label: 'Aumento DPS' },
            reavaliacao_positiva:       { cor: '#10b981', icone: '⇧', label: 'Reavaliação +' },
            reducao_taxa:               { cor: '#10b981', icone: '−', label: 'Redução Taxa' },

            // AZUL — estrutural / informativo
            estruturacao:               { cor: '#3b82f6', icone: '⊡', label: 'Estruturação' },
            emissao:                    { cor: '#3b82f6', icone: '⊕', label: 'Emissão' },
            amortizacao:                { cor: '#3b82f6', icone: '⊖', label: 'Amortização' },
            amortizacao_extraordinaria: { cor: '#3b82f6', icone: '⊖', label: 'Amortização Extra' },
            amortizacao_programada:     { cor: '#3b82f6', icone: '⊖', label: 'Amortização Programada' },

            // ROXO — mudança de mandato/gestor
            mudanca_mandato:            { cor: '#8b5cf6', icone: '↻', label: 'Mudança de Mandato' },
            mudanca_gestor:             { cor: '#8b5cf6', icone: '↻', label: 'Mudança de Gestor' },

            // ÂMBAR — fato relevante
            fato_relevante:             { cor: '#f59e0b', icone: '!', label: 'Fato Relevante' },
            obra_entrega:               { cor: '#f59e0b', icone: '⊟', label: 'Entrega de Obra' },
            contrato_revisional:        { cor: '#f59e0b', icone: 'R', label: 'Revisional' },
            venda_em_analise:           { cor: '#f59e0b', icone: '?', label: 'Venda em Análise' },

            // VERMELHO — risco / evento ruim / futuro com pressão
            cashback_fim:               { cor: '#ef4444', icone: '$', label: 'Fim de Cashback' },
            vacancia:                   { cor: '#ef4444', icone: '↓', label: 'Vacância' },
            evento_credito:             { cor: '#ef4444', icone: '⚠', label: 'Evento de Crédito' },
            reavaliacao_negativa:       { cor: '#ef4444', icone: '⇩', label: 'Reavaliação −' },
            venda_relevante:            { cor: '#ef4444', icone: '−', label: 'Venda Relevante' },
            evento_futuro:              { cor: '#ef4444', icone: '◷', label: 'Evento Futuro' },
            risco_corte_dividendo:      { cor: '#ef4444', icone: '↓', label: 'Risco de Corte' },

            outro:                      { cor: '#64748b', icone: '•', label: 'Outro' }
        };

        const corPorSeveridade = (sev) => ({
            positivo: '#10b981', negativo: '#ef4444', neutro: '#64748b',
            alta: '#ef4444', media: '#f59e0b', baixa: '#10b981'
        }[sev] || null);

        const today = new Date();

        const norm = (raw, origem) => {
            if (!raw || !raw.data) return null;
            const dataStr = String(raw.data);
            // aceita YYYY-MM ou YYYY-MM-DD
            const m = dataStr.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
            if (!m) return null;
            const dataExata = raw.dataExata || (m[3] ? dataStr : `${m[1]}-${m[2]}-15`);
            const tipoKey = raw.tipo || 'outro';
            const style = tipoStyle[tipoKey] || tipoStyle.outro;
            const corOverride = corPorSeveridade(raw.severidade);
            const dt = new Date(dataExata + 'T12:00:00');
            return {
                data: dataStr,
                dataExata,
                dt,
                futuro: dt > today,
                tipo: tipoKey,
                tipoLabel: style.label,
                severidade: raw.severidade || null,
                cor: corOverride || style.cor,
                icone: style.icone,
                titulo: raw.titulo || raw.evento || style.label,
                descricao: raw.descricao || raw.observacao || '',
                valor: raw.valor != null ? raw.valor : (raw.impactoValor != null ? raw.impactoValor : null),
                impactoDividendo: raw.impactoDividendo || null,
                fonte: raw.fonte || '',
                docId: raw.docId || null,
                origem
            };
        };

        // 1. portfolio.transacoes[]
        ((d.portfolio && d.portfolio.transacoes) || []).forEach(t => {
            const e = norm(t, 'Portfólio'); if (e) eventos.push(e);
        });
        // 2. dividendos.eventosPassados[] e .eventosFuturos[]
        ((d.dividendos && d.dividendos.eventosPassados) || []).forEach(t => {
            const e = norm(t, 'Dividendos'); if (e) eventos.push(e);
        });
        ((d.dividendos && d.dividendos.eventosFuturos) || []).forEach(t => {
            const e = norm(t, 'Dividendos (futuro)'); if (e) eventos.push(e);
        });
        // 3. valuation.eventosValuation[]
        ((d.valuation && d.valuation.eventosValuation) || []).forEach(t => {
            const e = norm(t, 'Valuation'); if (e) eventos.push(e);
        });
        // 4. timeline.periodos[] — pega dataInicio se houver
        ((d.timeline && d.timeline.periodos) || []).forEach(p => {
            if (!p.dataInicio && !p.data) return;
            const raw = { data: p.dataInicio || p.data, tipo: 'outro', titulo: p.titulo || p.nome, descricao: p.descricao };
            const e = norm(raw, 'História'); if (e) eventos.push(e);
        });

        // Dedup: mesmo MÊS (YYYY-MM) + mesmo tipo = mesmo evento, mesmo que título
        // venha escrito de forma diferente entre origens (Dividendos / Valuation /
        // Portfolio.transacoes) e mesmo que uma fonte traga dia exato (2026-04-14)
        // e outra só traga o mês (2026-04 → default dia 15). Funde campos preferindo
        // o mais informativo. Fallback de similaridade textual cobre casos onde
        // o tipo difere (ex: "fato_relevante" vs "emissao") mas o evento é o mesmo.
        const merged = new Map();
        const score = (e) => (e.descricao ? e.descricao.length : 0)
            + (e.titulo ? e.titulo.length : 0) * 0.3
            + (e.docId ? 50 : 0);

        // Normaliza título para comparação fuzzy
        const tokenize = (s) => {
            if (!s) return new Set();
            return new Set(
                String(s).toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/[^a-z0-9]+/g, ' ')
                    .split(' ')
                    .filter(w => w.length >= 4)  // descarta palavras curtas (de, da, em, etc.)
            );
        };
        const jaccard = (a, b) => {
            if (!a.size || !b.size) return 0;
            let inter = 0;
            for (const x of a) if (b.has(x)) inter++;
            return inter / (a.size + b.size - inter);
        };

        // Eventos genéricos (`outro`) ou sem tipo claro são candidatos a fuzzy match contra outros tipos
        const FUZZY_TIPOS = new Set(['outro', 'fato_relevante']);

        const fundir = (winner, loser) => {
            const origensSet = new Set();
            if (winner.origem) origensSet.add(winner.origem);
            if (loser.origem)  origensSet.add(loser.origem);
            winner.origem = Array.from(origensSet).join(' + ');
            winner.docId = winner.docId || loser.docId;
            winner.fonte = winner.fonte || loser.fonte;
            winner.impactoDividendo = winner.impactoDividendo || loser.impactoDividendo;
            winner.valor = winner.valor != null ? winner.valor : loser.valor;
            if (loser.descricao && winner.descricao
                && loser.descricao !== winner.descricao
                && !winner.descricao.includes(loser.descricao.slice(0, 60))) {
                winner.descricao = winner.descricao + '<br><span class="vg-evt-extra">' + loser.descricao + '</span>';
            }
            return winner;
        };

        // Passo 1: dedup estrita por mês+tipo
        for (const ev of eventos) {
            const mes = (ev.dataExata || '').slice(0, 7);  // "YYYY-MM"
            const key = mes + '|' + ev.tipo;
            const prev = merged.get(key);
            if (!prev) { merged.set(key, ev); continue; }
            const winner = score(ev) > score(prev) ? ev : prev;
            const loser  = winner === ev ? prev : ev;
            merged.set(key, fundir(winner, loser));
        }

        // Passo 2: fuzzy match — dois eventos no mesmo mês com tipos DIFERENTES
        // mas títulos muito parecidos (≥40% palavras significativas em comum)
        // são fundidos. Resolve: portfolio.transacoes diz "emissao" e
        // valuation.eventosValuation diz "fato_relevante" para o mesmo encerramento.
        const lista = Array.from(merged.entries());
        const removidos = new Set();
        for (let i = 0; i < lista.length; i++) {
            if (removidos.has(lista[i][0])) continue;
            const [keyA, evA] = lista[i];
            const mesA = keyA.split('|')[0];
            const tokA = tokenize(evA.titulo + ' ' + (evA.descricao || ''));
            for (let j = i + 1; j < lista.length; j++) {
                if (removidos.has(lista[j][0])) continue;
                const [keyB, evB] = lista[j];
                const mesB = keyB.split('|')[0];
                if (mesA !== mesB) continue;  // só funde no mesmo mês
                if (evA.tipo === evB.tipo) continue;  // já tratado no passo 1
                // Pelo menos um dos dois precisa ser "genérico" OU ambos precisam ter alta similaridade
                const tokB = tokenize(evB.titulo + ' ' + (evB.descricao || ''));
                const sim = jaccard(tokA, tokB);
                const algumGenerico = FUZZY_TIPOS.has(evA.tipo) || FUZZY_TIPOS.has(evB.tipo);
                const limiar = algumGenerico ? 0.30 : 0.50;
                if (sim >= limiar) {
                    const winner = score(evA) >= score(evB) ? evA : evB;
                    const loser  = winner === evA ? evB : evA;
                    fundir(winner, loser);
                    // Mantém a entrada do winner; remove a do loser
                    const loserKey = winner === evA ? keyB : keyA;
                    removidos.add(loserKey);
                    if (winner === evB) {
                        // Se B venceu, atualiza referência local
                        merged.set(keyA, evA);  // (no-op — já está)
                    }
                }
            }
        }
        for (const k of removidos) merged.delete(k);

        const dedup = Array.from(merged.values());
        dedup.sort((a, b) => a.dt - b.dt);
        return dedup;
    },

    async _initVisaoGeralPriceChart() {
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();
        if (!ticker || typeof Chart === 'undefined') return;
        const canvas = document.getElementById('vg-price-canvas-' + ticker);
        if (!canvas) return;
        if (this._charts && this._charts.vgPriceChart) return; // já inicializado

        // Carrega CSV de preços — tenta os mesmos caminhos que a aba Valuation usa
        const v = this.data.valuation || {};
        const csvFromJson = v.historicoPrecos && v.historicoPrecos.csvPath;
        const candidates = [];
        if (csvFromJson) {
            candidates.push(`../../${csvFromJson}`);  // padrão Valuation (HTML em fiis/{ticker}/)
            candidates.push(`/${csvFromJson}`);
            candidates.push(csvFromJson);
        }
        candidates.push(`../../data/fiis/${ticker}/historico_precos.csv`);
        candidates.push(`/data/fiis/${ticker}/historico_precos.csv`);

        let prices = [];
        let lastErr = null;
        for (const url of candidates) {
            try {
                const r = await fetch(url, { cache: 'no-cache' });
                if (!r.ok) { lastErr = `HTTP ${r.status} em ${url}`; continue; }
                const txt = await r.text();
                const lines = txt.trim().split('\n');
                if (lines.length < 2) { lastErr = `CSV vazio em ${url}`; continue; }
                const header = lines[0].split(',');
                const idxData  = header.indexOf('data');
                const idxClose = header.indexOf('fechamento');
                if (idxData < 0 || idxClose < 0) { lastErr = `CSV sem colunas data/fechamento em ${url}`; continue; }
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',');
                    const d = cols[idxData];
                    const c = parseFloat(cols[idxClose]);
                    if (d && c > 0) prices.push({ d, c, dt: new Date(d + 'T12:00:00') });
                }
                if (prices.length > 0) break;
            } catch (e) {
                lastErr = e && e.message;
            }
        }
        if (prices.length === 0) {
            console.warn('VG price chart: CSV não carregou', { ticker, candidates, lastErr });
            const host = canvas.parentElement;
            if (host) host.innerHTML = '<div class="vg-empty">Histórico de preços indisponível para este fundo.</div>';
            return;
        }

        const allEvents = this._collectAllTimelineEvents();
        const self = this;
        this._charts = this._charts || {};

        // Estado de período
        let currentMeses = 6;
        const today = new Date();

        const filterByPeriod = (meses) => {
            if (meses === 'all' || meses == null) {
                return { prices: prices.slice(), events: allEvents.slice() };
            }
            const cutoff = new Date(today);
            cutoff.setMonth(cutoff.getMonth() - parseInt(meses, 10));
            // Para o gráfico, mostra preços do passado dentro do período + futuro até último evento futuro
            const futureLimit = new Date(today);
            futureLimit.setMonth(futureLimit.getMonth() + parseInt(meses, 10));
            const pricesIn = prices.filter(p => p.dt >= cutoff);
            const eventsIn = allEvents.filter(e => e.dt >= cutoff && e.dt <= futureLimit);
            return { prices: pricesIn, events: eventsIn };
        };

        const buildChart = (meses) => {
            const { prices: ps, events: es } = filterByPeriod(meses);
            if (this._charts.vgPriceChart) { try { this._charts.vgPriceChart.destroy(); } catch(e){} }
            const labels = ps.map(p => p.d);
            const data   = ps.map(p => p.c);

            // y-axis com zoom adaptativo
            const minP = Math.min(...data); const maxP = Math.max(...data);
            const yPadding = (maxP - minP) * 0.10;
            const yMin = Math.max(0, minP - yPadding);
            const yMax = maxP + yPadding;

            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Preço (R$)',
                        data,
                        borderColor: '#22d3ee',
                        backgroundColor: 'rgba(34,211,238,0.10)',
                        borderWidth: 2.2,
                        fill: true,
                        tension: 0.25,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHitRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,23,42,0.95)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                title: (items) => items[0].label,
                                label: (item) => 'R$ ' + Number(item.raw).toFixed(2).replace('.', ',')
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                            grid: { color: 'rgba(255,255,255,0.04)' }
                        },
                        y: {
                            min: yMin, max: yMax,
                            ticks: { color: '#64748b', callback: (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',') },
                            grid: { color: 'rgba(255,255,255,0.04)' }
                        }
                    }
                }
            });
            this._charts.vgPriceChart = chart;
            // Renderiza markers depois de o gráfico estar pronto
            requestAnimationFrame(() => self._renderVgMarkers(es, ps));
        };

        buildChart(currentMeses);

        // Wire-up dos botões de período
        const card = canvas.closest('.vg-price-card');
        card.querySelectorAll('.vg-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                card.querySelectorAll('.vg-period-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                const m = btn.dataset.meses;
                currentMeses = m === 'all' ? 'all' : parseInt(m, 10);
                buildChart(currentMeses);
            });
        });

        // ========== DRAG-TO-COMPARE ==========
        // Captura âncora no mousedown, atualiza overlay no mousemove, fixa no mouseup.
        // Mostra label com Δ dias / Δ R$ / Δ % entre os dois pontos.
        const overlay  = document.getElementById('vg-range-overlay-' + ticker);
        const anchorA  = document.getElementById('vg-range-anchor-a-' + ticker);
        const anchorB  = document.getElementById('vg-range-anchor-b-' + ticker);
        const lbl      = document.getElementById('vg-range-label-' + ticker);
        let dragging = false;
        let pointA = null;  // { xPx, dataIdx, label, preco }
        let pointB = null;
        let activeRange = false;

        const getCanvasPos = (clientX) => {
            const rect = canvas.getBoundingClientRect();
            return clientX - rect.left;
        };
        const findIdxAtPx = (xPx) => {
            const ch = this._charts.vgPriceChart;
            if (!ch) return null;
            const cArea = ch.chartArea;
            const labels = ch.data.labels || [];
            if (!labels.length || xPx < cArea.left || xPx > cArea.right) return null;
            // busca a label cujo getPixelForValue está mais próximo
            // varredura linear funciona bem (max ~250 pontos)
            let bestIdx = 0, bestDist = Infinity;
            for (let i = 0; i < labels.length; i++) {
                const px = ch.scales.x.getPixelForValue(labels[i]);
                const d = Math.abs(px - xPx);
                if (d < bestDist) { bestDist = d; bestIdx = i; }
            }
            return bestIdx;
        };
        const pointFromX = (xPx) => {
            const ch = this._charts.vgPriceChart;
            if (!ch) return null;
            const idx = findIdxAtPx(xPx);
            if (idx == null) return null;
            const labels = ch.data.labels || [];
            const data   = ch.data.datasets[0].data || [];
            const label  = labels[idx];
            const preco  = data[idx];
            const px     = ch.scales.x.getPixelForValue(label);
            return { xPx: px, dataIdx: idx, label, preco };
        };
        const fmtPriceDiff = (a, b) => {
            const delta = b.preco - a.preco;
            const pct = a.preco !== 0 ? (delta / a.preco) * 100 : 0;
            const sign = delta >= 0 ? '+' : '';
            return { delta, pct, sign };
        };
        const fmtDateLabel = (s) => {
            const m = String(s).match(/^(\d{4})-(\d{2})-?(\d{2})?/);
            if (!m) return s;
            return m[3] ? `${m[3]}/${m[2]}/${m[1]}` : `${m[2]}/${m[1]}`;
        };
        const daysBetween = (la, lb) => {
            const da = new Date(la + (la.length === 7 ? '-15' : '') + 'T00:00:00');
            const db = new Date(lb + (lb.length === 7 ? '-15' : '') + 'T00:00:00');
            return Math.abs(Math.round((db - da) / 86400000));
        };
        const updateOverlay = (a, b) => {
            const ch = this._charts.vgPriceChart;
            if (!ch || !a || !b) return;
            const cArea = ch.chartArea;
            const xLeft  = Math.min(a.xPx, b.xPx);
            const xRight = Math.max(a.xPx, b.xPx);
            const w      = Math.max(2, xRight - xLeft);
            const { delta, pct, sign } = fmtPriceDiff(a, b);
            const cor = delta > 0 ? 'emerald' : (delta < 0 ? 'red' : 'slate');

            // Overlay (faixa colorida)
            overlay.hidden = false;
            overlay.className = 'vg-range-overlay vg-range-' + cor;
            overlay.style.left   = xLeft + 'px';
            overlay.style.top    = cArea.top + 'px';
            overlay.style.width  = w + 'px';
            overlay.style.height = (cArea.bottom - cArea.top) + 'px';

            // Âncoras (linha vertical em A e B)
            anchorA.hidden = false;
            anchorA.className = 'vg-range-anchor vg-range-anchor-a vg-range-' + cor;
            anchorA.style.left = a.xPx + 'px';
            anchorA.style.top  = cArea.top + 'px';
            anchorA.style.height = (cArea.bottom - cArea.top) + 'px';

            anchorB.hidden = false;
            anchorB.className = 'vg-range-anchor vg-range-anchor-b vg-range-' + cor;
            anchorB.style.left = b.xPx + 'px';
            anchorB.style.top  = cArea.top + 'px';
            anchorB.style.height = (cArea.bottom - cArea.top) + 'px';

            // Label flutuante centralizado
            const dias = daysBetween(a.label, b.label);
            const fmtR = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
            lbl.hidden = false;
            lbl.className = 'vg-range-label vg-range-' + cor;
            lbl.innerHTML = `
                <div class="vg-range-label-row">
                    <span class="vg-range-dates">${fmtDateLabel(a.label)} → ${fmtDateLabel(b.label)}</span>
                    <span class="vg-range-days">${dias} ${dias === 1 ? 'dia' : 'dias'}</span>
                </div>
                <div class="vg-range-label-row vg-range-label-main">
                    <span>${fmtR(a.preco)} → ${fmtR(b.preco)}</span>
                    <span class="vg-range-delta">${sign}${fmtR(delta)} (${sign}${pct.toFixed(2).replace('.', ',')}%)</span>
                </div>`;
            const labelW = 320;
            let labelLeft = (xLeft + xRight) / 2 - labelW / 2;
            labelLeft = Math.max(cArea.left, Math.min(cArea.right - labelW, labelLeft));
            lbl.style.left = labelLeft + 'px';
            lbl.style.top  = (cArea.top + 12) + 'px';
            lbl.style.width = labelW + 'px';
        };
        const clearOverlay = () => {
            overlay.hidden = true; anchorA.hidden = true; anchorB.hidden = true; lbl.hidden = true;
            pointA = null; pointB = null; activeRange = false;
        };

        // ===== DESKTOP: clique-e-arraste contínuo, some ao soltar =====
        canvas.addEventListener('mousedown', (ev) => {
            if (ev.button !== 0) return;
            const xPx = getCanvasPos(ev.clientX);
            const p = pointFromX(xPx);
            if (!p) return;
            ev.preventDefault();
            pointA = p; pointB = p;
            dragging = true;
            updateOverlay(pointA, pointB);
        });
        canvas.addEventListener('mousemove', (ev) => {
            if (!dragging) return;
            const xPx = getCanvasPos(ev.clientX);
            const p = pointFromX(xPx);
            if (!p) return;
            pointB = p;
            updateOverlay(pointA, pointB);
        });
        const finishDrag = () => {
            if (!dragging) return;
            dragging = false;
            // Desktop: ao soltar, sempre limpa (comportamento "live preview")
            clearOverlay();
        };
        window.addEventListener('mouseup', finishDrag);
        canvas.addEventListener('mouseleave', () => { if (dragging) finishDrag(); });

        // ===== MOBILE: tap-A, tap-B (overlay persiste), tap-3 limpa =====
        // Detecta touch device de forma simples
        let touchPhase = 0; // 0 = aguardando A, 1 = aguardando B, 2 = mostrando comparação
        canvas.addEventListener('touchstart', (ev) => {
            if (!ev.touches || !ev.touches[0]) return;
            const xPx = getCanvasPos(ev.touches[0].clientX);
            const p = pointFromX(xPx);
            if (!p) return;
            ev.preventDefault();
            // Se já há comparação ativa, qualquer tap dentro do canvas reinicia
            if (touchPhase === 2) {
                clearOverlay();
                touchPhase = 0;
            }
            if (touchPhase === 0) {
                // 1º toque → ancora A; mostra preview com B = A (apenas a linha)
                pointA = p; pointB = p;
                updateOverlay(pointA, pointB);
                activeRange = true;
                touchPhase = 1;
            } else if (touchPhase === 1) {
                // 2º toque → fixa B
                if (p.dataIdx === pointA.dataIdx) {
                    // mesmo ponto: limpa
                    clearOverlay();
                    touchPhase = 0;
                } else {
                    pointB = p;
                    updateOverlay(pointA, pointB);
                    touchPhase = 2;
                }
            }
        }, { passive: false });
        canvas.addEventListener('touchmove', (ev) => { /* mobile não usa drag */ }, { passive: true });
        canvas.addEventListener('touchend', (ev) => { /* nada — só toques discretos */ });

        // Click/tap fora do canvas (e fora de marker/drawer) limpa a seleção persistente do mobile
        document.addEventListener('click', (ev) => {
            if (touchPhase === 0 && !activeRange) return;
            if (canvas.contains(ev.target)) return;
            if (ev.target.closest('.vg-marker') || ev.target.closest('.vg-drawer')) return;
            clearOverlay();
            touchPhase = 0;
        });

        // Ao trocar período, limpa overlay (desktop e mobile)
        card.querySelectorAll('.vg-period-btn').forEach(btn => {
            btn.addEventListener('click', () => { clearOverlay(); touchPhase = 0; });
        });

        // Wire-up do drawer
        const drawer = document.getElementById('vg-drawer-' + ticker);
        const backdrop = document.getElementById('vg-drawer-bd-' + ticker);
        const closeBtn = document.getElementById('vg-drawer-close-' + ticker);
        const close = () => {
            drawer.hidden = true; drawer.setAttribute('aria-hidden', 'true');
            backdrop.hidden = true;
        };
        closeBtn && closeBtn.addEventListener('click', close);
        backdrop && backdrop.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });

        // Refresh markers em resize
        window.addEventListener('resize', () => {
            if (this._charts.vgPriceChart) {
                const { events: es, prices: ps } = filterByPeriod(currentMeses);
                requestAnimationFrame(() => self._renderVgMarkers(es, ps));
            }
        });
    },

    _renderVgMarkers(events, prices) {
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();
        const layer = document.getElementById('vg-markers-' + ticker);
        const canvas = document.getElementById('vg-price-canvas-' + ticker);
        if (!layer || !canvas || !this._charts || !this._charts.vgPriceChart) return;
        layer.innerHTML = '';
        const chart = this._charts.vgPriceChart;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        if (!xScale || !yScale) return;
        const cArea = chart.chartArea;

        // Constrói lookup label→pixel usando o eixo categórico do Chart.js
        // (a posição real é controlada pelo índice da label, não pelo tempo absoluto)
        const labels = chart.data.labels || [];
        if (!labels.length) return;
        const minTime = prices.length ? prices[0].dt.getTime() : Date.now();
        const maxTime = prices.length ? prices[prices.length-1].dt.getTime() : Date.now();
        // Pixel da primeira/última label (para clamping de eventos fora do range)
        const xFirst = xScale.getPixelForValue(labels[0]);
        const xLast  = xScale.getPixelForValue(labels[labels.length - 1]);
        const xWidthChart = xLast - xFirst;

        // Para cada evento, encontra a label mais próxima (busca binária no array de prices.dt) e usa
        // chart.scales.x.getPixelForValue(label) — assim os markers ficam alinhados ao eixo X real
        const findClosestIdx = (t) => {
            // assume prices ordenados por dt; binary search
            let lo = 0, hi = prices.length - 1;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                if (prices[mid].dt.getTime() < t) lo = mid + 1; else hi = mid;
            }
            // verifica vizinho à esquerda — pega o mais próximo dos dois
            if (lo > 0 && (t - prices[lo - 1].dt.getTime()) < (prices[lo].dt.getTime() - t)) {
                return lo - 1;
            }
            return lo;
        };

        const clusters = {};
        events.forEach(ev => {
            const t = ev.dt.getTime();
            let x;
            if (t < minTime) {
                // Antes do range visível — coloca na borda esquerda com pequeno offset
                x = Math.max(cArea.left - 8, xFirst - 12);
            } else if (t > maxTime) {
                // Após o range visível (eventos futuros) — extrapola à direita do chartArea
                // proporcional ao "quanto" no futuro está em relação ao range total
                const totalRange = (maxTime - minTime) || 1;
                const extra = Math.min(0.30, (t - maxTime) / totalRange * 0.5);
                x = xLast + xWidthChart * extra;
                // não ultrapassa muito o canvas
                x = Math.min(x, cArea.right + xWidthChart * 0.30);
            } else {
                // Dentro do range — usa o pixel exato da label correspondente
                const idx = findClosestIdx(t);
                x = xScale.getPixelForValue(labels[idx]);
            }
            const key = Math.round(x / 16); // agrupa pixels muito próximos
            if (!clusters[key]) clusters[key] = { x, events: [] };
            clusters[key].events.push(ev);
        });

        Object.values(clusters).forEach((cl, idx) => {
            const isCluster = cl.events.length > 1;
            const ev0 = cl.events[0];
            const cor = isCluster ? '#94a3b8' : ev0.cor;
            const icone = isCluster ? String(cl.events.length) : ev0.icone;
            const futuro = cl.events.every(e => e.futuro);
            // Y: alterna alturas para reduzir overlap visual.
            // Cada nível precisa caber rótulo (10px) + dot (22px) + folga.
            const yLevel = idx % 3; // 3 níveis
            const topPx = cArea.top + 4 + yLevel * 36;

            // Rótulo curto acima do marker: tipoLabel quando único, "N eventos" quando cluster
            const labelTxt = isCluster
                ? `${cl.events.length} eventos`
                : (ev0.tipoLabel || '');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'vg-marker' + (futuro ? ' vg-marker-future' : '') + (isCluster ? ' vg-marker-cluster' : '');
            btn.style.left = cl.x + 'px';
            btn.style.top  = topPx + 'px';
            btn.style.setProperty('--mk-cor', cor);
            btn.innerHTML = `
                <span class="vg-marker-tip" title="${labelTxt}">${labelTxt}</span>
                <span class="vg-marker-dot">${icone}</span>
                <span class="vg-marker-line"></span>`;
            btn.dataset.events = JSON.stringify(cl.events.map(e => ({
                titulo: e.titulo, descricao: e.descricao, data: e.data, tipo: e.tipo, tipoLabel: e.tipoLabel,
                cor: e.cor, icone: e.icone, valor: e.valor, impactoDividendo: e.impactoDividendo,
                fonte: e.fonte, docId: e.docId, origem: e.origem, futuro: e.futuro, severidade: e.severidade
            })));
            btn.title = isCluster ? `${cl.events.length} eventos` : ev0.titulo;
            btn.addEventListener('click', (e) => this._openVgDrawer(JSON.parse(btn.dataset.events)));
            layer.appendChild(btn);

            // Linha vertical até o eixo X (começa abaixo do dot, que vem após o tip)
            // tip ~13px + dot 22px + margem = ~38px abaixo do top do botão
            const line = document.createElement('div');
            line.className = 'vg-marker-vline' + (futuro ? ' vg-marker-vline-future' : '');
            line.style.left = cl.x + 'px';
            line.style.top  = (topPx + 38) + 'px';
            line.style.height = Math.max(0, cArea.bottom - topPx - 38) + 'px';
            line.style.setProperty('--mk-cor', cor);
            layer.appendChild(line);
        });
    },

    _openVgDrawer(events) {
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();
        const drawer = document.getElementById('vg-drawer-' + ticker);
        const backdrop = document.getElementById('vg-drawer-bd-' + ticker);
        const content = document.getElementById('vg-drawer-content-' + ticker);
        if (!drawer || !content) return;
        const fmtDate = (s) => {
            if (!s) return '';
            const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
            if (!m) return s;
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const ano = m[1], mes = meses[parseInt(m[2])-1] || m[2];
            return m[3] ? `${m[3]} de ${mes} de ${ano}` : `${mes} de ${ano}`;
        };
        const fmtMoney = (v) => {
            if (v == null) return '';
            const abs = Math.abs(v);
            if (abs < 100) return 'R$ ' + Number(v).toFixed(2).replace('.', ',') + ' /cota';
            return this.formatMoney(v);
        };
        const cards = events.map(e => {
            const valorHtml = e.valor != null ? `<div class="vg-drawer-meta-row"><span>Valor</span><strong>${fmtMoney(e.valor)}</strong></div>` : '';
            const impHtml   = e.impactoDividendo ? `<div class="vg-drawer-meta-row"><span>Impacto no DPS</span><strong>${e.impactoDividendo}</strong></div>` : '';
            const sevHtml   = e.severidade ? `<span class="vg-drawer-sev sev-${e.severidade}">${e.severidade}</span>` : '';
            const fonteHtml = e.fonte ? `<div class="vg-drawer-fonte">Fonte: ${e.fonte}</div>` : '';
            return `
            <div class="vg-drawer-event" style="border-left-color:${e.cor}">
                <div class="vg-drawer-event-head">
                    <span class="vg-drawer-icone" style="color:${e.cor}">${e.icone}</span>
                    <span class="vg-drawer-tipo" style="color:${e.cor}">${e.tipoLabel}</span>
                    ${e.futuro ? '<span class="vg-drawer-future">Futuro</span>' : ''}
                    ${sevHtml}
                </div>
                <div class="vg-drawer-event-titulo">${e.titulo}</div>
                <div class="vg-drawer-event-data">${fmtDate(e.data)} <span class="vg-drawer-origem">· ${e.origem}</span></div>
                ${e.descricao ? `<div class="vg-drawer-event-desc">${e.descricao}</div>` : ''}
                <div class="vg-drawer-meta">
                    ${valorHtml}
                    ${impHtml}
                </div>
                ${fonteHtml}
            </div>`;
        }).join('');
        content.innerHTML = `
            <div class="vg-drawer-tag">${events.length === 1 ? 'EVENTO' : `${events.length} EVENTOS NESSA DATA`}</div>
            ${cards}`;
        drawer.hidden = false;
        drawer.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.hidden = false;
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

                    <div class="pa-grid">
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

        // Detalhes (administrador, escriturador, etc.) — aceita array OU string HTML legado
        let detalhesHtml = '';
        if (Array.isArray(t.detalhes) && t.detalhes.length > 0) {
            let detItemsHtml = '';
            t.detalhes.forEach(det => {
                detItemsHtml += `
                        <div class="bg-white/5 rounded-xl p-4">
                            <div class="text-sm text-slate-400 mb-1">${det.label}</div>
                            <div class="font-semibold text-white">${det.valor}</div>
                        </div>`;
            });
            const cols = Math.min(t.detalhes.length, 4);
            detalhesHtml = `
                    <div class="grid md:grid-cols-2 lg:grid-cols-${cols} gap-4 mt-6">
                        ${detItemsHtml}
                    </div>`;
        } else if (typeof t.detalhes === 'string' && t.detalhes.trim()) {
            // Schema legado: string HTML livre
            detalhesHtml = `
                    <div class="bg-white/5 rounded-xl p-4 mt-6 text-sm text-slate-300 leading-relaxed">
                        ${t.detalhes}
                    </div>`;
        }
        // Observação livre (campo opcional novo — preservada quando schema antigo era string)
        if (typeof t.observacao === 'string' && t.observacao.trim()) {
            detalhesHtml += `
                    <div class="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 mt-4 text-sm text-slate-300 leading-relaxed">
                        ${t.observacao}
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
    // ENCAIXE NA CARTEIRA v1
    // ──────────────────────────────────────────────────
    renderEncaixe() {
        const e = this.data.encaixe;
        if (!e) return '';

        const fmtPct = (v, d=1) => v == null ? '—' : (v * 100).toFixed(d) + '%';
        const fmtNum = (v, d=1) => v == null ? '—' : Number(v).toFixed(d);
        const fmtMoney = (v) => v == null ? '—' : this.formatMoney(v);
        const esc = (s) => (s == null ? '' : String(s));

        const idCor = e.identidade && e.identidade.cor ? e.identidade.cor : 'amber';
        const idHtml = e.identidade ? `
            <div class="encaixe-identidade encaixe-cor-${idCor}">
                <div class="encaixe-identidade-tag">IDENTIDADE</div>
                <div class="encaixe-identidade-rotulo">${esc(e.identidade.rotulo)}</div>
                <div class="encaixe-identidade-sub">${esc(e.identidade.subrotulo)}</div>
            </div>` : '';

        let perfilHtml = '';
        if (e.perfilRisco) {
            const pr = e.perfilRisco;
            const nivelMap = {
                baixo:      { cor: 'emerald', label: 'BAIXO RISCO' },
                medio:      { cor: 'amber',   label: 'RISCO MÉDIO' },
                alto:       { cor: 'red',     label: 'RISCO ALTO' },
                muito_alto: { cor: 'red',     label: 'RISCO MUITO ALTO' }
            };
            const nivelInfo = nivelMap[pr.nivel] || { cor: 'amber', label: (pr.nivel || '—').toUpperCase() };
            const scoreNum = pr.score != null ? Number(pr.score).toFixed(1) : '—';
            const compHtml = (pr.componentes || []).map(c => {
                const score = Number(c.score || 0);
                const pct = Math.max(0, Math.min(100, (score / 5) * 100));
                const corBar = score < 2 ? 'emerald' : (score < 3 ? 'amber' : 'red');
                return `
                <div class="encaixe-comp">
                    <div class="encaixe-comp-head">
                        <div class="encaixe-comp-nome">${esc(c.nome)}</div>
                        <div class="encaixe-comp-score">${score.toFixed(1)} <span class="encaixe-comp-peso">peso ${(c.peso*100).toFixed(0)}%</span></div>
                    </div>
                    <div class="encaixe-comp-bar"><div class="encaixe-comp-bar-fill encaixe-bar-${corBar}" style="width:${pct}%"></div></div>
                    <div class="encaixe-comp-metrica">${esc(c.metrica)}</div>
                    <div class="encaixe-comp-leitura">${esc(c.leitura)}</div>
                </div>`;
            }).join('');
            // Resumo dos 2 componentes de maior peso, para o leitor saber de cara
            // os fatores que mais empurram o risco
            const compsOrdenados = (pr.componentes || []).slice()
                .sort((a, b) => (b.score * (b.peso || 0)) - (a.score * (a.peso || 0)));
            const top2 = compsOrdenados.slice(0, 2).map(c => {
                const s = Number(c.score || 0);
                const cor = s < 2 ? 'emerald' : (s < 3 ? 'amber' : 'red');
                return `
                <div class="risco-resumo-driver risco-resumo-${cor}">
                    <div class="risco-resumo-driver-nome">${esc(c.nome)}</div>
                    <div class="risco-resumo-driver-score">${s.toFixed(1)}<span class="risco-resumo-driver-de">/5</span></div>
                    <div class="risco-resumo-driver-leitura">${esc(c.leitura)}</div>
                </div>`;
            }).join('');

            // Frase-síntese: prioriza pr.resumo, depois pr.leitura, depois pr.descricao;
            // se nada existir, gera uma frase curta a partir do nível.
            const resumoTexto = esc(pr.resumo || pr.leitura || pr.descricao
                || `Risco ${nivelInfo.label.toLowerCase()} para o investidor de FIIs.`);

            perfilHtml = `
            <section class="risco-resumo risco-resumo-${nivelInfo.cor}">
                <div class="risco-resumo-tag">RESUMO DE RISCO</div>
                <div class="risco-resumo-grid">
                    <div class="risco-resumo-score-wrap">
                        <div class="risco-resumo-score">${scoreNum}</div>
                        <div class="risco-resumo-score-de">de 5,0</div>
                        <div class="risco-resumo-nivel">${nivelInfo.label}</div>
                    </div>
                    <div class="risco-resumo-texto">
                        <p>${resumoTexto}</p>
                    </div>
                </div>
                ${top2 ? `
                <div class="risco-resumo-drivers">
                    <div class="risco-resumo-drivers-tag">O QUE MAIS PESA NO RISCO</div>
                    <div class="risco-resumo-drivers-grid">${top2}</div>
                </div>` : ''}
            </section>

            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-head">
                    <div>
                        <div class="encaixe-section-tag">DETALHAMENTO POR DIMENSÃO</div>
                        <div class="encaixe-section-titulo">Score por componente — base do cálculo</div>
                    </div>
                </div>
                <p class="text-sm text-slate-400 mb-4">Score 1 (menor risco) a 5 (maior risco), ponderado por 6 dimensões. Cada componente é calculado a partir de dados duros do fundo.</p>
                <div class="encaixe-comp-grid">${compHtml}</div>
            </div>`;
        }

        let estratHtml = '';
        if (Array.isArray(e.estrategias) && e.estrategias.length) {
            const items = e.estrategias.map(s => {
                let cor, icone, label;
                if (s.encaixa === true) { cor = 'emerald'; icone = '✓'; label = 'Encaixa'; }
                else if (s.encaixa === false) { cor = 'red'; icone = '✕'; label = 'Não encaixa'; }
                else { cor = 'amber'; icone = '◐'; label = 'Parcial'; }
                return `
                <div class="encaixe-estrat encaixe-cor-${cor}">
                    <div class="encaixe-estrat-head">
                        <div class="encaixe-estrat-icone">${icone}</div>
                        <div class="encaixe-estrat-nome">${esc(s.nome)}</div>
                        <div class="encaixe-estrat-label">${label}</div>
                    </div>
                    <div class="encaixe-estrat-racional">${esc(s.racional)}</div>
                </div>`;
            }).join('');
            estratHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">ESTRATÉGIAS</div>
                <div class="encaixe-section-titulo">Em que estratégia esse fundo se encaixa?</div>
                <p class="text-sm text-slate-400 mb-4">Avaliação de todas as estratégias canônicas — você precisa ver explicitamente o que NÃO serve para esse fundo.</p>
                <div class="encaixe-estrat-grid">${items}</div>
            </div>`;
        }

        let riscosHtml = '';
        if (Array.isArray(e.riscosOcultos) && e.riscosOcultos.length) {
            const sevMap = { alta: 'red', media: 'amber', baixa: 'blue' };
            const items = e.riscosOcultos.map(r => {
                const cor = sevMap[r.severidade] || 'amber';
                const mit = r.mitigacao
                    ? `<div class="encaixe-risco-mit"><span class="encaixe-risco-mit-tag">Mitigação:</span> ${esc(r.mitigacao)}</div>`
                    : '';
                return `
                <div class="encaixe-risco encaixe-cor-${cor}">
                    <div class="encaixe-risco-head">
                        <div class="encaixe-risco-sev">⚠ ${esc((r.severidade || '').toUpperCase())}</div>
                        <div class="encaixe-risco-titulo">${esc(r.titulo)}</div>
                    </div>
                    <div class="encaixe-risco-desc">${esc(r.descricao)}</div>
                    ${mit}
                </div>`;
            }).join('');
            riscosHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">RISCOS OCULTOS</div>
                <div class="encaixe-section-titulo">O que o rótulo não diz</div>
                <p class="text-sm text-slate-400 mb-4">Riscos interpretativos — distintos dos numéricos listados em "Pontos de Atenção".</p>
                <div class="encaixe-risco-grid">${items}</div>
            </div>`;
        }

        let liqHtml = '';
        if (e.liquidez) {
            const l = e.liquidez;
            const dps = l.diasParaSair || {};
            const tiers = [
                { lbl: 'R$ 10 mil',     v: dps['10mil'] },
                { lbl: 'R$ 100 mil',    v: dps['100mil'] },
                { lbl: 'R$ 500 mil',    v: dps['500mil'] },
                { lbl: 'R$ 1 milhão',   v: dps['1milhao'] },
                { lbl: 'R$ 10 milhões', v: dps['10milhoes'] }
            ].map(t => {
                const dias = t.v != null ? (t.v < 1 ? '< 1 dia' : `${Number(t.v).toFixed(1)} dias`) : '—';
                const cor = t.v == null ? 'slate' : (t.v < 1 ? 'emerald' : (t.v < 5 ? 'amber' : 'red'));
                return `
                <div class="encaixe-liq-tier encaixe-cor-${cor}">
                    <div class="encaixe-liq-tier-lbl">${t.lbl}</div>
                    <div class="encaixe-liq-tier-val">${dias}</div>
                </div>`;
            }).join('');
            liqHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">LIQUIDEZ DE SAÍDA</div>
                <div class="encaixe-section-titulo">Quanto tempo para sair sem mover preço</div>
                <div class="encaixe-liq-stats">
                    <div class="encaixe-liq-stat">
                        <div class="encaixe-liq-stat-val">${fmtMoney(l.volumeMedio21d)}</div>
                        <div class="encaixe-liq-stat-lbl">Volume médio 21d</div>
                    </div>
                    <div class="encaixe-liq-stat">
                        <div class="encaixe-liq-stat-val">${fmtMoney(l.volumeMedio252d)}</div>
                        <div class="encaixe-liq-stat-lbl">Volume médio 252d</div>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mb-3">Premissa: posição absorve no máximo 20% do volume diário (X / volume × 0.20).</p>
                <div class="encaixe-liq-tiers">${tiers}</div>
                <div class="encaixe-liq-leitura">${esc(l.leitura)}</div>
            </div>`;
        }

        let volHtml = '';
        if (e.volatilidade) {
            const vp = e.volatilidade.preco || {};
            const vd = e.volatilidade.dividendo || {};
            volHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">VOLATILIDADE HISTÓRICA</div>
                <div class="encaixe-section-titulo">O fundo balança quanto?</div>
                <div class="encaixe-vol-grid">
                    <div class="encaixe-vol-block">
                        <div class="encaixe-vol-block-tag">Preço da cota</div>
                        <div class="encaixe-vol-row"><span>σ 12 meses (anualizado)</span><strong>${fmtPct(vp.sigma12m)}</strong></div>
                        <div class="encaixe-vol-row"><span>σ 24 meses (anualizado)</span><strong>${fmtPct(vp.sigma24m)}</strong></div>
                        <div class="encaixe-vol-row"><span>Drawdown máximo 24m</span><strong class="text-red-400">${fmtPct(vp.drawdownMax24m)}</strong></div>
                        <div class="encaixe-vol-row"><span>Pior mês</span><strong>${esc(vp.drawdownMaxData) || '—'}</strong></div>
                        <div class="encaixe-vol-row"><span>Tempo de recuperação</span><strong>${vp.tempoRecuperacao != null ? vp.tempoRecuperacao + ' meses' : 'ainda não recuperou'}</strong></div>
                    </div>
                    <div class="encaixe-vol-block">
                        <div class="encaixe-vol-block-tag">Dividendo</div>
                        <div class="encaixe-vol-row"><span>CV 12 meses</span><strong>${fmtPct(vd.cv12m)}</strong></div>
                        <div class="encaixe-vol-row"><span>CV 24 meses</span><strong>${fmtPct(vd.cv24m)}</strong></div>
                        <div class="encaixe-vol-row"><span>DPS mín 24m</span><strong>R$ ${fmtNum(vd.minDps24m, 2).replace('.',',')}</strong></div>
                        <div class="encaixe-vol-row"><span>DPS máx 24m</span><strong>R$ ${fmtNum(vd.maxDps24m, 2).replace('.',',')}</strong></div>
                        <div class="encaixe-vol-row"><span>Amplitude relativa</span><strong>${fmtPct(vd.amplitudeRelativa, 0)}</strong></div>
                    </div>
                </div>
            </div>`;
        }

        let sobreHtml = '';
        if (e.sobreposicaoPares) {
            const sp = e.sobreposicaoPares;
            const pares = (sp.pares || []).map(p => {
                const pct = (p.sobreposicaoEstimada || 0) * 100;
                const cor = pct >= 30 ? 'red' : (pct >= 15 ? 'amber' : 'emerald');
                const tiposRaw = p.tipoSobreposicao;
                const tiposArr = Array.isArray(tiposRaw) ? tiposRaw : (typeof tiposRaw === 'string' && tiposRaw ? [tiposRaw] : []);
                const tipos = tiposArr.map(t => `<span class="encaixe-sobre-tag">${esc(String(t).replace(/_/g,' '))}</span>`).join('');
                return `
                <div class="encaixe-sobre-par encaixe-cor-${cor}">
                    <div class="encaixe-sobre-par-head">
                        <div class="encaixe-sobre-par-ticker">${esc(p.ticker)}</div>
                        <div class="encaixe-sobre-par-pct">${pct.toFixed(0)}%</div>
                    </div>
                    <div class="encaixe-sobre-par-tipos">${tipos}</div>
                    <div class="encaixe-sobre-par-leitura">${esc(p.leitura)}</div>
                </div>`;
            }).join('');
            sobreHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">SOBREPOSIÇÃO COM PARES</div>
                <div class="encaixe-section-titulo">Esse fundo é diversificação real?</div>
                <p class="text-sm text-slate-400 mb-4">Subsegmento: <strong class="text-white">${esc((sp.subsegmento || '').replace(/_/g,' '))}</strong>. Quanto maior a sobreposição, menos diversificação real você ganha ao adicionar esse fundo.</p>
                <div class="encaixe-sobre-grid">${pares}</div>
                <div class="encaixe-sobre-conclusao">${esc(sp.diversificacaoReal)}</div>
            </div>`;
        }

        let cenHtml = '';
        if (Array.isArray(e.cenarios) && e.cenarios.length) {
            const fav = e.cenarios.filter(c => c.tipo === 'favoravel');
            const desf = e.cenarios.filter(c => c.tipo === 'desfavoravel');
            const probMap = { alta: '●●●', media: '●●○', baixa: '●○○' };
            const renderCol = (arr, cor, titulo) => {
                const items = arr.map(c => `
                    <div class="encaixe-cen-item encaixe-cor-${cor}">
                        <div class="encaixe-cen-titulo">${esc(c.titulo)}</div>
                        <div class="encaixe-cen-desc">${esc(c.descricao)}</div>
                        ${c.probabilidadeRelativa ? `<div class="encaixe-cen-prob">Probabilidade: <strong>${probMap[c.probabilidadeRelativa] || ''}</strong> ${esc(c.probabilidadeRelativa)}</div>` : ''}
                    </div>`).join('');
                return `<div class="encaixe-cen-col">
                    <div class="encaixe-cen-col-titulo encaixe-cor-${cor}">${titulo}</div>
                    ${items}
                </div>`;
            };
            cenHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">CENÁRIOS</div>
                <div class="encaixe-section-titulo">Quando o fundo brilha vs sofre</div>
                <div class="encaixe-cen-grid">
                    ${renderCol(fav, 'emerald', '✓ Favoráveis')}
                    ${renderCol(desf, 'red', '✕ Desfavoráveis')}
                </div>
            </div>`;
        }

        let pqHtml = '';
        if (e.paraQuem || e.paraQuemNao) {
            const pq = e.paraQuem || {};
            const pqn = e.paraQuemNao || {};
            const tags = (pq.objetivo || []).map(o => `<span class="encaixe-pq-tag">${esc(o.replace(/_/g,' '))}</span>`).join('');
            const exemplos = (pq.perfisExemplo || []).map(p => `<li>${esc(p)}</li>`).join('');
            const exclusao = (pqn.perfilExclusao || []).map(p => `<li>${esc(p)}</li>`).join('');
            pqHtml = `
            <div class="encaixe-pq-grid">
                <div class="dark-card rounded-3xl p-6 encaixe-cor-emerald">
                    <div class="encaixe-section-tag">PARA QUEM É</div>
                    <div class="encaixe-pq-tags">${tags}</div>
                    <div class="encaixe-pq-meta">
                        <div><span>Horizonte:</span> <strong>${esc((pq.horizonte || '').replace(/_/g,' '))}</strong></div>
                        <div><span>Perfil:</span> <strong>${esc(pq.perfil)}</strong></div>
                    </div>
                    <div class="encaixe-pq-tipica">${esc(pq.carteiraTipica)}</div>
                    <div class="encaixe-pq-listalbl">Perfis-exemplo:</div>
                    <ul class="encaixe-pq-lista">${exemplos}</ul>
                </div>
                <div class="dark-card rounded-3xl p-6 encaixe-cor-red">
                    <div class="encaixe-section-tag">PARA QUEM NÃO É</div>
                    <ul class="encaixe-pq-lista encaixe-pq-lista-no">${exclusao}</ul>
                </div>
            </div>`;
        }

        return `
        <section class="mb-12">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Encaixe na Carteira</h2>
                <p class="text-slate-400 text-sm">Onde esse fundo se encaixa na sua estratégia, qual o risco real e se ele é diversificação verdadeira</p>
            </div>
            ${idHtml}
            ${perfilHtml}
            ${estratHtml}
            ${riscosHtml}
            ${liqHtml}
            ${volHtml}
            ${sobreHtml}
            ${cenHtml}
            ${pqHtml}
        </section>`;
    },

    // ──────────────────────────────────────────────────
    // PORTFOLIO
    // ──────────────────────────────────────────────────
    renderPortfolio() {
        const p = this.data.portfolio;
        if (!p) return '';
        if (p.schema === 'v2') return this._renderPortfolioV2(p);
        if (!Array.isArray(p.stats) || p.stats.length === 0) return '';

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
    // PORTFOLIO v2 — schema discriminado por tipo de ativo
    // ──────────────────────────────────────────────────
    _renderPortfolioV2(p) {
        const esc = (s) => (s == null ? '' : String(s));
        const fmtMoney = (v) => v == null ? '—' : this.formatMoney(v);
        const fmtPct = (v, d=1) => v == null ? '—' : (v * 100).toFixed(d) + '%';
        const fmtPct100 = (v, d=1) => v == null ? '—' : Number(v).toFixed(d) + '%';
        const fmtNum = (v, d=1) => v == null ? '—' : Number(v).toFixed(d);
        const fmtDate = (s) => {
            if (!s) return '—';
            const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
            if (!m) return s;
            const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
            const ano = m[1], mes = meses[parseInt(m[2])-1] || m[2];
            return m[3] ? `${m[3]}/${mes}/${ano}` : `${mes}/${ano}`;
        };

        // ===== TIPO DO FUNDO =====
        const tipoMap = {
            tijolo: { label: 'Fundo de Tijolo', cor: 'emerald', desc: 'Imóveis físicos como ativo principal' },
            papel:  { label: 'Fundo de Papel',  cor: 'blue',    desc: 'CRIs como ativo principal' },
            cra:    { label: 'Fundo de CRA',    cor: 'amber',   desc: 'Recebíveis do agronegócio' },
            fof:    { label: 'Fundo de Fundos', cor: 'purple',  desc: 'Cotas de outros FIIs' },
            hibrido:{ label: 'Híbrido',         cor: 'amber',   desc: 'Mistura de FIIs, imóveis e/ou recebíveis' },
            desenvolvimento: { label: 'Desenvolvimento', cor: 'amber', desc: 'Ativos em fase de obra/incorporação' }
        };
        const tipoInfo = tipoMap[p.tipoFundo] || { label: p.tipoFundo || 'Não classificado', cor: 'slate', desc: '' };

        // ===== STATS AGREGADAS =====
        const s = p.stats || {};
        const statCards = [];
        if (s.totalAtivos != null) statCards.push({ val: s.totalAtivos, lbl: 'Ativos no portfólio', cor: 'white' });
        if (s.abl != null && s.abl > 0) statCards.push({ val: s.abl.toLocaleString('pt-BR') + ' m²', lbl: 'ABL própria', cor: 'white' });
        if (s.ocupacaoFinanceira != null) statCards.push({ val: fmtPct100(s.ocupacaoFinanceira, 1), lbl: 'Ocupação financeira', cor: s.ocupacaoFinanceira >= 95 ? 'emerald' : (s.ocupacaoFinanceira >= 85 ? 'amber' : 'red') });
        if (s.wault != null) statCards.push({ val: fmtNum(s.wault, 1) + ' anos', lbl: 'WAULT', cor: s.wault >= 5 ? 'emerald' : (s.wault >= 3 ? 'amber' : 'red') });
        if (s.duration != null) statCards.push({ val: fmtNum(s.duration, 1) + ' anos', lbl: 'Duration média', cor: 'white' });
        if (s.yieldCarregamento != null) statCards.push({ val: fmtPct100(s.yieldCarregamento, 1), lbl: 'Yield de carregamento', cor: 'emerald' });
        if (s.inadimplenciaPct != null) statCards.push({ val: fmtPct100(s.inadimplenciaPct, 1), lbl: 'Inadimplência', cor: s.inadimplenciaPct === 0 ? 'emerald' : 'red' });
        if (s.alavancagemPct != null) statCards.push({ val: fmtPct100(s.alavancagemPct, 0), lbl: 'Alavancagem', cor: s.alavancagemPct === 0 ? 'emerald' : (s.alavancagemPct < 30 ? 'amber' : 'red') });
        const statsHtml = statCards.map(c => `
            <div class="port-v2-stat">
                <div class="port-v2-stat-val text-${c.cor === 'white' ? 'white' : c.cor + '-400'}">${c.val}</div>
                <div class="port-v2-stat-lbl">${c.lbl}</div>
            </div>`).join('');

        // ===== ALOCAÇÃO PL — gráfico de barras horizontal =====
        const aloc = (s.alocacaoPL || []).slice().sort((a,b) => b.pct - a.pct);
        const alocHtml = aloc.map(a => `
            <div class="port-v2-aloc-row">
                <div class="port-v2-aloc-cabec">
                    <div class="port-v2-aloc-dot" style="background:${a.cor || '#64748b'}"></div>
                    <div class="port-v2-aloc-cat">${esc(a.categoria)}</div>
                    <div class="port-v2-aloc-pct">${fmtPct(a.pct, 1)}</div>
                </div>
                <div class="port-v2-aloc-bar"><div class="port-v2-aloc-bar-fill" style="width:${(a.pct*100).toFixed(1)}%; background:${a.cor || '#64748b'}"></div></div>
            </div>`).join('');

        // ===== ATIVOS — render por tipo =====
        const ativos = p.ativos || [];
        const renderImovel = (a) => {
            const loc = (a.locatarios && a.locatarios[0]) || null;
            const c = loc && loc.contrato || null;
            const renov = c && c.renovacao || null;
            const renovCorMap = { alta: 'emerald', media: 'amber', baixa: 'red', indefinida: 'slate' };
            const renovCor = renov ? (renovCorMap[renov.probabilidade] || 'slate') : null;
            // Timeline visual do contrato
            let timelineContrato = '';
            if (c && c.inicio && c.vencimento) {
                const ini = new Date(c.inicio + 'T00:00:00');
                const venc = new Date(c.vencimento + 'T00:00:00');
                const hoje = new Date();
                const total = venc - ini;
                const passado = Math.max(0, Math.min(total, hoje - ini));
                const pctPassado = total > 0 ? (passado / total * 100) : 0;
                const restMs = venc - hoje;
                const restAnos = restMs > 0 ? (restMs / (365.25 * 24 * 3600 * 1000)) : 0;
                const corRest = restAnos >= 5 ? 'emerald' : (restAnos >= 2 ? 'amber' : 'red');
                timelineContrato = `
                <div class="port-v2-contrato-tl">
                    <div class="port-v2-contrato-tl-bar">
                        <div class="port-v2-contrato-tl-fill encaixe-bar-${corRest}" style="width:${pctPassado.toFixed(1)}%"></div>
                        <div class="port-v2-contrato-tl-now" style="left:${pctPassado.toFixed(1)}%" title="Hoje"></div>
                    </div>
                    <div class="port-v2-contrato-tl-lbl">
                        <span>${fmtDate(c.inicio)}</span>
                        <span class="text-${corRest}-400 font-bold">${restAnos > 0 ? `${fmtNum(restAnos, 1)} anos restantes` : 'Vencido'}</span>
                        <span>${fmtDate(c.vencimento)}</span>
                    </div>
                </div>`;
            }
            const tipoContratoMap = { tipico: 'Típico', atipico: 'Atípico', built_to_suit: 'Built-to-Suit' };
            const padraoTxt = a.padrao ? `<span class="port-v2-imovel-padrao">Padrão ${a.padrao}</span>` : '';
            const valorM2 = c && c.valorM2 ? `<div class="port-v2-imovel-meta"><span>R$ ${fmtNum(c.valorM2, 2).replace('.',',')}/m²</span></div>` : '';
            const cap = a.capRateAtual ? `<div class="port-v2-imovel-meta"><span>Cap rate: <strong>${fmtPct100(a.capRateAtual*100, 1)}</strong></span></div>` : '';
            return `
            <div class="port-v2-ativo port-v2-ativo-imovel">
                <div class="port-v2-ativo-head">
                    <div class="port-v2-ativo-tipo-badge port-v2-tipo-imovel">🏢 IMÓVEL</div>
                    <div class="port-v2-ativo-titulo">${esc(a.nome)}</div>
                    ${padraoTxt}
                </div>
                <div class="port-v2-ativo-end">${esc(a.endereco)}</div>
                <div class="port-v2-imovel-grid">
                    <div class="port-v2-imovel-stat">
                        <div class="port-v2-imovel-stat-val">${a.abl ? a.abl.toLocaleString('pt-BR') + ' m²' : '—'}</div>
                        <div class="port-v2-imovel-stat-lbl">ABL</div>
                    </div>
                    <div class="port-v2-imovel-stat">
                        <div class="port-v2-imovel-stat-val">${fmtPct100((a.ocupacao || 0)*100, 0)}</div>
                        <div class="port-v2-imovel-stat-lbl">Ocupação</div>
                    </div>
                    <div class="port-v2-imovel-stat">
                        <div class="port-v2-imovel-stat-val">${fmtPct((a.percPL != null ? a.percPL : null), 1)}</div>
                        <div class="port-v2-imovel-stat-lbl">% do PL</div>
                    </div>
                    <div class="port-v2-imovel-stat">
                        <div class="port-v2-imovel-stat-val">${fmtMoney(a.valorContabil)}</div>
                        <div class="port-v2-imovel-stat-lbl">Valor contábil</div>
                    </div>
                </div>
                ${loc ? `
                <div class="port-v2-loc-card">
                    <div class="port-v2-loc-head">
                        <div class="port-v2-loc-tag">LOCATÁRIO</div>
                        <div class="port-v2-loc-nome">${esc(loc.nome)}</div>
                        <div class="port-v2-loc-setor">${esc(loc.setor)}</div>
                    </div>
                    ${c ? `
                    <div class="port-v2-contrato-grid">
                        <div class="port-v2-contrato-item"><span>Tipo</span><strong>${tipoContratoMap[c.tipo] || c.tipo || '—'}</strong></div>
                        <div class="port-v2-contrato-item"><span>Aluguel mensal</span><strong>${fmtMoney(c.valorMensal)}</strong></div>
                        <div class="port-v2-contrato-item"><span>R$/m²</span><strong>${c.valorM2 != null ? 'R$ ' + fmtNum(c.valorM2, 2).replace('.',',') : '—'}</strong></div>
                        <div class="port-v2-contrato-item"><span>Indexador</span><strong>${esc(c.indexador) || '—'}</strong></div>
                        <div class="port-v2-contrato-item"><span>Início</span><strong>${fmtDate(c.inicio)}</strong></div>
                        <div class="port-v2-contrato-item"><span>Vencimento</span><strong>${fmtDate(c.vencimento)}</strong></div>
                    </div>
                    ${timelineContrato}
                    ${c.multa ? `<div class="port-v2-contrato-multa"><span class="text-slate-400 text-xs">Multa rescisória:</span> ${esc(c.multa)}</div>` : ''}
                    ${renov ? `
                    <div class="port-v2-renov encaixe-cor-${renovCor}">
                        <div class="port-v2-renov-head">
                            <span class="port-v2-renov-tag">EXPECTATIVA DE RENOVAÇÃO</span>
                            <span class="port-v2-renov-prob">${(renov.probabilidade || '').toUpperCase()}</span>
                        </div>
                        <div class="port-v2-renov-rac">${esc(renov.racional)}</div>
                        ${renov.fonte ? `<div class="port-v2-renov-fonte">Fonte: ${esc(renov.fonte)}</div>` : ''}
                    </div>` : ''}
                    ` : ''}
                </div>` : ''}
                ${valorM2 || cap ? `<div class="port-v2-imovel-foot">${cap}${valorM2}</div>` : ''}
                ${a.fonte ? `<div class="port-v2-ativo-fonte">Fonte: ${esc(a.fonte)}</div>` : ''}
            </div>`;
        };

        const renderFii = (a) => {
            const segMap = {
                logistica_industrial: 'Logística industrial',
                escritorios_aaa: 'Escritórios AAA',
                desenvolvimento_residencial: 'Desenvolvimento residencial',
                shoppings: 'Shoppings'
            };
            const segLabel = segMap[a.segmentoFinal] || (a.segmentoFinal || '').replace(/_/g,' ');
            return `
            <div class="port-v2-ativo port-v2-ativo-fii">
                <div class="port-v2-ativo-head">
                    <div class="port-v2-ativo-tipo-badge port-v2-tipo-fii">📊 FII (cotas)</div>
                    <div class="port-v2-ativo-titulo">${esc(a.ticker)} — ${esc(a.nome)}</div>
                </div>
                <div class="port-v2-fii-seg">Segmento subjacente: <strong class="text-white">${esc(segLabel)}</strong></div>
                <div class="port-v2-imovel-grid">
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtPct(a.percPL, 1)}</div><div class="port-v2-imovel-stat-lbl">% do PL</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtMoney(a.valorPresente)}</div><div class="port-v2-imovel-stat-lbl">Valor presente</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${a.qtdCotas != null ? a.qtdCotas.toLocaleString('pt-BR') : '—'}</div><div class="port-v2-imovel-stat-lbl">Cotas detidas</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${a.precoMedio != null ? 'R$ ' + fmtNum(a.precoMedio, 2).replace('.',',') : '—'}</div><div class="port-v2-imovel-stat-lbl">Preço médio</div></div>
                </div>
                ${a.fonte ? `<div class="port-v2-ativo-fonte">Fonte: ${esc(a.fonte)}</div>` : ''}
            </div>`;
        };

        const renderCri = (a) => {
            const statusMap = {
                em_dia: { label: 'Em dia', cor: 'emerald' },
                atraso_30d: { label: 'Atraso 30d', cor: 'amber' },
                atraso_60d: { label: 'Atraso 60d', cor: 'amber' },
                atraso_90d: { label: 'Atraso 90d+', cor: 'red' },
                default: { label: 'Default', cor: 'red' },
                renegociado: { label: 'Renegociado', cor: 'amber' }
            };
            const stInfo = statusMap[a.status] || { label: a.status || '—', cor: 'slate' };
            const perfilMap = { high_grade: 'High Grade', mid_grade: 'Mid Grade', high_yield: 'High Yield' };
            const garantias = (a.garantias || []).map(g => `<span class="port-v2-cri-garantia">${esc(g.replace(/_/g,' '))}</span>`).join('');
            return `
            <div class="port-v2-ativo port-v2-ativo-cri">
                <div class="port-v2-ativo-head">
                    <div class="port-v2-ativo-tipo-badge port-v2-tipo-cri">📜 CRI</div>
                    <div class="port-v2-ativo-titulo">${esc(a.devedor)}</div>
                    <div class="port-v2-cri-status encaixe-cor-${stInfo.cor}">${stInfo.label}</div>
                </div>
                ${a.lastro ? `<div class="port-v2-ativo-end">Lastro: ${esc(a.lastro)}</div>` : ''}
                <div class="port-v2-imovel-grid">
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtPct(a.percPL, 1)}</div><div class="port-v2-imovel-stat-lbl">% do PL</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${esc(a.indexador)}${a.spread ? ' + ' + fmtPct100(a.spread*100, 2) : ''}</div><div class="port-v2-imovel-stat-lbl">Indexador</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${a.duration != null ? fmtNum(a.duration, 1) + ' anos' : '—'}</div><div class="port-v2-imovel-stat-lbl">Duration</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtDate(a.vencimento)}</div><div class="port-v2-imovel-stat-lbl">Vencimento</div></div>
                </div>
                ${(a.rating || perfilMap[a.perfilRisco]) ? `
                <div class="port-v2-cri-rating">
                    ${a.rating ? `<span><strong>${esc(a.rating)}</strong> ${a.agenciaRating ? '(' + esc(a.agenciaRating) + ')' : ''}</span>` : ''}
                    ${perfilMap[a.perfilRisco] ? `<span class="port-v2-cri-perfil">${perfilMap[a.perfilRisco]}</span>` : ''}
                </div>` : ''}
                ${garantias ? `<div class="port-v2-cri-garantias">${garantias}</div>` : ''}
                ${a.fonte ? `<div class="port-v2-ativo-fonte">Fonte: ${esc(a.fonte)}</div>` : ''}
            </div>`;
        };

        const renderOutro = (a) => `
            <div class="port-v2-ativo port-v2-ativo-outro">
                <div class="port-v2-ativo-head">
                    <div class="port-v2-ativo-tipo-badge port-v2-tipo-outro">⊙ ${esc((a.categoria || 'OUTRO').toUpperCase())}</div>
                    <div class="port-v2-ativo-titulo">${esc(a.nome)}</div>
                </div>
                ${a.descricao ? `<div class="port-v2-outro-desc">${esc(a.descricao)}</div>` : ''}
                <div class="port-v2-imovel-grid">
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtPct(a.percPL, 1)}</div><div class="port-v2-imovel-stat-lbl">% do PL</div></div>
                    <div class="port-v2-imovel-stat"><div class="port-v2-imovel-stat-val">${fmtMoney(a.valorPresente)}</div><div class="port-v2-imovel-stat-lbl">Valor presente</div></div>
                </div>
                ${a.fonte ? `<div class="port-v2-ativo-fonte">Fonte: ${esc(a.fonte)}</div>` : ''}
            </div>`;

        const dispatch = { imovel: renderImovel, fii: renderFii, cri: renderCri, cra: renderCri, outro: renderOutro };
        const ativosOrdenados = ativos.slice().sort((a,b) => (b.percPL || 0) - (a.percPL || 0));
        const ativosHtml = ativosOrdenados.map(a => (dispatch[a.tipo] || renderOutro)(a)).join('');

        // ===== CONCENTRAÇÃO =====
        const conc = p.concentracao || {};
        const hhiCorMap = { baixa: 'emerald', moderada: 'amber', alta: 'red' };
        const hhiCor = hhiCorMap[conc.interpretacaoHhi] || 'amber';
        let hhiHtml = '';
        if (conc.hhi != null) {
            hhiHtml = `
            <div class="port-v2-hhi encaixe-cor-${hhiCor}">
                <div class="port-v2-hhi-val">${fmtNum(conc.hhi, 3)}</div>
                <div class="port-v2-hhi-lbl">HHI — ${esc(conc.interpretacaoHhi || '').toUpperCase()} concentração</div>
                <div class="port-v2-hhi-hint">${conc.hhi < 0.15 ? 'Diversificado (HHI < 0,15)' : (conc.hhi < 0.25 ? 'Moderadamente concentrado (0,15–0,25)' : 'Altamente concentrado (HHI > 0,25)')}</div>
            </div>`;
        }
        let topNHtml = '';
        if (conc.topN) {
            const t = conc.topN;
            const items = [
                { lbl: 'Top 1', v: t.top1Pct }, { lbl: 'Top 3', v: t.top3Pct },
                { lbl: 'Top 5', v: t.top5Pct }, { lbl: 'Top 10', v: t.top10Pct }
            ].filter(x => x.v != null);
            topNHtml = `
            <div class="port-v2-topn">
                ${items.map(i => `<div class="port-v2-topn-item"><div class="port-v2-topn-val">${fmtPct(i.v, 0)}</div><div class="port-v2-topn-lbl">${i.lbl}</div></div>`).join('')}
            </div>`;
        }
        const renderConcGroup = (titulo, arr, key='nome', valKey='pct') => {
            if (!Array.isArray(arr) || arr.length === 0) return '';
            const max = Math.max(...arr.map(x => x[valKey] || 0));
            const rows = arr.map(x => {
                const pct = x[valKey] || 0;
                const w = max > 0 ? (pct / max * 100) : 0;
                return `
                <div class="port-v2-conc-row">
                    <div class="port-v2-conc-row-head">
                        <span>${esc(x[key] || x.indexador || x.regiao || x.setor)}</span>
                        <strong>${fmtPct(pct, 1)}</strong>
                    </div>
                    <div class="port-v2-conc-bar"><div class="port-v2-conc-bar-fill" style="width:${w.toFixed(1)}%"></div></div>
                </div>`;
            }).join('');
            return `
            <div class="port-v2-conc-block">
                <div class="port-v2-conc-block-tag">${titulo}</div>
                ${rows}
            </div>`;
        };
        const concGroupsHtml = [
            renderConcGroup('POR REGIÃO', conc.geografica, 'regiao'),
            renderConcGroup('POR LOCATÁRIO', conc.porLocatario, 'nome'),
            renderConcGroup('POR DEVEDOR', conc.porDevedor, 'nome'),
            renderConcGroup('POR SETOR DO DEVEDOR', conc.porSetorDevedor, 'setor'),
            renderConcGroup('POR INDEXADOR', conc.porIndexador, 'indexador')
        ].filter(Boolean).join('');

        return `
        <section class="mb-12">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Portfólio Detalhado</h2>
                <p class="text-slate-400 text-sm">Cada ativo, cada inquilino, cada contrato — todos os dados estruturados</p>
            </div>

            <!-- 0. FOF — VP estimado em tempo real (apenas para tipoFundo=fof) -->
            ${p.tipoFundo === 'fof' ? this._renderFofVpEstimado(p) : ''}

            <!-- 1. Tipo do fundo + stats agregadas -->
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="port-v2-tipo encaixe-cor-${tipoInfo.cor}">
                    <div class="port-v2-tipo-tag">CLASSIFICAÇÃO</div>
                    <div class="port-v2-tipo-titulo">${tipoInfo.label}</div>
                    <div class="port-v2-tipo-desc">${tipoInfo.desc}</div>
                </div>
                <div class="port-v2-stats-grid">${statsHtml}</div>
            </div>

            <!-- 1b. Análise interpretativa do portfólio (opcional) -->
            ${this._renderPortfolioAnalise(p.analise || p.analiseGeral)}

            <!-- 2. Alocação do PL -->
            ${aloc.length ? `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">COMPOSIÇÃO DO PATRIMÔNIO</div>
                <div class="encaixe-section-titulo">Como o patrimônio está dividido</div>
                <div class="port-v2-aloc-list">${alocHtml}</div>
            </div>` : ''}

            <!-- 3. Lista de ativos -->
            ${ativos.length ? `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">ATIVOS DO PORTFÓLIO</div>
                <div class="encaixe-section-titulo">${ativos.length} ${ativos.length === 1 ? 'ativo' : 'ativos'} — ordenados por % do PL</div>
                <div class="port-v2-ativos-grid">${ativosHtml}</div>
            </div>` : ''}

            <!-- 4. Concentração -->
            ${(hhiHtml || topNHtml || concGroupsHtml) ? `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="encaixe-section-tag">CONCENTRAÇÃO</div>
                <div class="encaixe-section-titulo">Métricas de risco estrutural do portfólio</div>
                <div class="port-v2-conc-top">
                    ${hhiHtml}
                    ${topNHtml}
                </div>
                <div class="port-v2-conc-groups">${concGroupsHtml}</div>
            </div>` : ''}

            <!-- 5. Transações materiais -->
            ${(Array.isArray(p.transacoes) && p.transacoes.length) ? this._renderPortfolioTransacoes(p.transacoes) : ''}
        </section>`;
    },

    // ==========================================================
    // FOF — VP ESTIMADO EM TEMPO REAL
    // ==========================================================
    // FoFs publicam VP/cota apenas mensalmente (Informe Mensal Estruturado).
    // Como temos cotação diária dos FIIs detidos + nº de cotas, podemos
    // calcular: Σ(cotas_detidas × preço_atual_do_par) / cotas_emitidas_do_FoF
    // antes do gestor publicar o VP oficial.
    _renderPortfolioAnalise(an) {
        if (!an || typeof an !== 'object') return '';
        const esc = (s) => (s == null ? '' : String(s));
        const corMap = { emerald: 'emerald', amber: 'amber', red: 'red', blue: 'blue', slate: 'slate' };
        const cor = corMap[an.cor] || 'amber';

        const veredicto = an.veredicto || an.descricao || an.resumo || '';
        const rotulo    = an.rotulo || an.titulo || 'Análise do Portfólio';
        const perfil    = an.perfilInvestidor || an.paraQuem || '';
        const fortes    = Array.isArray(an.pontosFortes)  ? an.pontosFortes  : [];
        const fracos    = Array.isArray(an.pontosFracos)  ? an.pontosFracos  : (Array.isArray(an.pontosAtencao) ? an.pontosAtencao : []);
        const tags      = Array.isArray(an.tags) ? an.tags : [];

        const fortesHtml = fortes.length ? `
            <div class="port-analise-bloco">
                <div class="port-analise-bloco-tag port-analise-tag-emerald">✓ Pontos fortes</div>
                <ul class="port-analise-lista">${fortes.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
            </div>` : '';
        const fracosHtml = fracos.length ? `
            <div class="port-analise-bloco">
                <div class="port-analise-bloco-tag port-analise-tag-red">⚠ Pontos de atenção</div>
                <ul class="port-analise-lista">${fracos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
            </div>` : '';
        const tagsHtml = tags.length ? `
            <div class="port-analise-tags">
                ${tags.map(t => `<span class="port-analise-tag">${esc(t)}</span>`).join('')}
            </div>` : '';
        const perfilHtml = perfil ? `
            <div class="port-analise-perfil">
                <span class="port-analise-perfil-tag">PARA QUEM SERVE</span>
                <span class="port-analise-perfil-txt">${esc(perfil)}</span>
            </div>` : '';

        return `
        <div class="dark-card rounded-3xl p-6 mb-6 port-analise encaixe-cor-${cor}">
            <div class="port-analise-head">
                <div class="port-analise-tag-top">ANÁLISE DO PORTFÓLIO</div>
                <div class="port-analise-rotulo">${esc(rotulo)}</div>
            </div>
            ${tagsHtml}
            ${veredicto ? `<div class="port-analise-veredicto">${veredicto}</div>` : ''}
            ${(fortes.length || fracos.length) ? `<div class="port-analise-grid">${fortesHtml}${fracosHtml}</div>` : ''}
            ${perfilHtml}
        </div>`;
    },

    _renderFofVpEstimado(p) {
        const fiis = (p.ativos || []).filter(a => a.tipo === 'fii' && a.ticker);
        if (fiis.length === 0) return '';

        // Bloco só faz sentido se temos qtdCotas para a maioria dos ativos.
        // Sem qtdCotas, "VP em tempo real" não tem como ser calculado — esconder.
        const comCotas = fiis.filter(a => a.qtdCotas != null && a.qtdCotas > 0);
        if (comCotas.length < Math.max(3, fiis.length * 0.5)) {
            // < 50% dos ativos têm qtdCotas → bloco fica enganoso, omite
            return '';
        }

        const ind = this.data.indicadores || {};
        const vpOficial = parseFloat(String(ind.vpCota || '').replace(/[^\d.,]/g,'').replace(',','.')) || null;
        const vpData = ind.vpCotaData || ind.cotacaoData || null;
        const cotacaoAtual = parseFloat(String(ind.cotacao || '').replace(/[^\d.,]/g,'').replace(',','.')) || null;
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();

        // Linhas da tabela — placeholder, populadas pelo JS após carregar CSVs
        const linhas = fiis.map((a, i) => `
            <tr class="fof-vp-row" data-ticker="${(a.ticker || '').toUpperCase()}" data-cotas="${a.qtdCotas || 0}" data-pl-pct="${a.percPL || 0}" data-preco-medio="${a.precoMedio || 0}" data-valor-livro="${a.valorPresente || 0}">
                <td class="fof-vp-ticker">
                    <a href="../${(a.ticker || '').toLowerCase()}/" class="fof-vp-link">${(a.ticker || '').toUpperCase()}</a>
                    ${a.nome ? `<span class="fof-vp-nome">${a.nome}</span>` : ''}
                </td>
                <td class="fof-vp-cotas">${a.qtdCotas != null ? a.qtdCotas.toLocaleString('pt-BR') : '—'}</td>
                <td class="fof-vp-preco-livro">${a.precoMedio != null ? 'R$ ' + a.precoMedio.toFixed(2).replace('.',',') : '—'}</td>
                <td class="fof-vp-preco-atual"><span class="fof-vp-loading">...</span></td>
                <td class="fof-vp-valor-atual"><span class="fof-vp-loading">...</span></td>
                <td class="fof-vp-delta"><span class="fof-vp-loading">—</span></td>
            </tr>
        `).join('');

        return `
            <section class="fof-vp-hero" id="fof-vp-${ticker}">
                <div class="fof-vp-tag">VP EM TEMPO REAL · CARTEIRA DE FIIs</div>
                <div class="fof-vp-headline">
                    Calculamos o valor patrimonial atualizado por dentro — antes do gestor publicar.
                </div>
                <p class="fof-vp-explica">
                    FoFs divulgam VP oficial apenas 1 vez por mês. Como a carteira são cotas de outros FIIs com preços diários,
                    podemos somar a posição em tempo real (cotas detidas × preço atual) e estimar o VP/cota verdadeiro de hoje.
                    A diferença entre o VP estimado e o VP oficial mostra quanto o mercado já antecipou — ou ainda não.
                </p>

                <div class="fof-vp-grid">
                    <div class="fof-vp-card fof-vp-estimado">
                        <div class="fof-vp-card-tag">VP ESTIMADO HOJE</div>
                        <div class="fof-vp-card-val" data-fof-vp-estimado>—</div>
                        <div class="fof-vp-card-sub">por cota · soma da carteira a preços de mercado</div>
                    </div>
                    <div class="fof-vp-card fof-vp-oficial">
                        <div class="fof-vp-card-tag">VP OFICIAL</div>
                        <div class="fof-vp-card-val">${vpOficial != null ? 'R$ ' + vpOficial.toFixed(2).replace('.',',') : '—'}</div>
                        <div class="fof-vp-card-sub">${vpData ? 'em ' + vpData : 'último Informe Mensal Estruturado'}</div>
                    </div>
                    <div class="fof-vp-card fof-vp-delta-card" data-fof-vp-delta-card>
                        <div class="fof-vp-card-tag">DELTA</div>
                        <div class="fof-vp-card-val" data-fof-vp-delta>—</div>
                        <div class="fof-vp-card-sub" data-fof-vp-delta-sub>diferença vs VP oficial</div>
                    </div>
                    <div class="fof-vp-card fof-vp-pvp-real">
                        <div class="fof-vp-card-tag">P/VP EM TEMPO REAL</div>
                        <div class="fof-vp-card-val" data-fof-vp-pvp>—</div>
                        <div class="fof-vp-card-sub">cota R$ ${cotacaoAtual != null ? cotacaoAtual.toFixed(2).replace('.',',') : '—'} ÷ VP estimado</div>
                    </div>
                </div>

                <div class="fof-vp-table-wrap">
                    <div class="fof-vp-table-tag">CARTEIRA DETALHADA · ${fiis.length} ${fiis.length === 1 ? 'fundo' : 'fundos'}</div>
                    <div class="fof-vp-table-scroll">
                        <table class="fof-vp-table">
                            <thead>
                                <tr>
                                    <th>FII</th>
                                    <th>Cotas detidas</th>
                                    <th>Preço médio (livro)</th>
                                    <th>Preço atual</th>
                                    <th>Valor de mercado</th>
                                    <th>Δ</th>
                                </tr>
                            </thead>
                            <tbody data-fof-vp-tbody>${linhas}</tbody>
                            <tfoot>
                                <tr class="fof-vp-tfoot">
                                    <td>Total</td>
                                    <td colspan="3"></td>
                                    <td data-fof-vp-total>—</td>
                                    <td data-fof-vp-total-delta>—</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div class="fof-vp-footnote">
                    Estimativa client-side com último fechamento disponível em <code>data/fiis/{ticker}/historico_precos.csv</code>.
                    Não inclui caixa, posições em CRI ou outros ativos do FoF — só a parcela em cotas de FIIs.
                    A diferença real pode ser maior ou menor conforme a parcela não-FII do PL.
                </div>
            </section>
        `;
    },

    async _initFofVpLive() {
        const p = this.data.portfolio || {};
        if (p.tipoFundo !== 'fof') return;
        const ticker = (this.data.meta && this.data.meta.ticker || '').toLowerCase();
        const root = document.getElementById('fof-vp-' + ticker);
        if (!root) return;

        const ind = this.data.indicadores || {};
        const vpOficial = parseFloat(String(ind.vpCota || '').replace(/[^\d.,]/g,'').replace(',','.')) || null;
        const cotacaoAtual = parseFloat(String(ind.cotacao || '').replace(/[^\d.,]/g,'').replace(',','.')) || null;
        // Cotas emitidas do FoF — preferir explícito; senão tentar derivar de PL/VP
        const plRaw = parseFloat(String(ind.patrimonioLiquido || '').replace(/[^\d.,]/g,'').replace(',','.')) || null;
        let cotasEmitidas = parseFloat(ind.cotasEmitidas || ind.numCotas || 0) || null;
        if (!cotasEmitidas && plRaw && vpOficial) cotasEmitidas = plRaw / vpOficial;

        // Busca último fechamento de cada par via CSV. Em paralelo, com fallback.
        const rows = Array.from(root.querySelectorAll('.fof-vp-row'));
        const fmtMoney = (v) => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtMoneyShort = (v) => {
            if (v == null) return '—';
            if (Math.abs(v) >= 1e6) return 'R$ ' + (v/1e6).toFixed(2).replace('.', ',') + ' Mi';
            if (Math.abs(v) >= 1e3) return 'R$ ' + (v/1e3).toFixed(0) + ' mil';
            return 'R$ ' + v.toFixed(2).replace('.', ',');
        };

        const fetchUltimoFechamento = async (tk) => {
            const tkl = tk.toLowerCase();
            const candidates = [
                `../../data/fiis/${tkl}/historico_precos.csv`,
                `/data/fiis/${tkl}/historico_precos.csv`,
            ];
            for (const url of candidates) {
                try {
                    const r = await fetch(url, { cache: 'no-cache' });
                    if (!r.ok) continue;
                    const txt = await r.text();
                    const lines = txt.trim().split('\n');
                    if (lines.length < 2) continue;
                    const header = lines[0].split(',');
                    const idxClose = header.indexOf('fechamento');
                    const idxData = header.indexOf('data');
                    if (idxClose < 0) continue;
                    // último fechamento válido
                    for (let i = lines.length - 1; i >= 1; i--) {
                        const cols = lines[i].split(',');
                        const c = parseFloat(cols[idxClose]);
                        if (c > 0) return { preco: c, data: cols[idxData] };
                    }
                } catch (e) { /* try next */ }
            }
            return null;
        };

        let valorMercadoTotal = 0;
        let valorLivroTotal = 0;
        const tasks = rows.map(async (tr) => {
            const tk = tr.dataset.ticker;
            const cotas = parseFloat(tr.dataset.cotas) || 0;
            const valorLivro = parseFloat(tr.dataset.valorLivro) || 0;
            const precoMedio = parseFloat(tr.dataset.precoMedio) || 0;
            valorLivroTotal += valorLivro;
            const cellPreco = tr.querySelector('.fof-vp-preco-atual');
            const cellValor = tr.querySelector('.fof-vp-valor-atual');
            const cellDelta = tr.querySelector('.fof-vp-delta');

            const r = await fetchUltimoFechamento(tk);
            if (!r) {
                cellPreco.innerHTML = '<span class="fof-vp-na">n/d</span>';
                cellValor.innerHTML = valorLivro ? fmtMoneyShort(valorLivro) + '<span class="fof-vp-na-tag">livro</span>' : '<span class="fof-vp-na">—</span>';
                cellDelta.innerHTML = '<span class="fof-vp-na">—</span>';
                if (valorLivro) valorMercadoTotal += valorLivro; // fallback
                return;
            }
            const valorMercado = cotas * r.preco;
            valorMercadoTotal += valorMercado;
            cellPreco.innerHTML = `<strong>R$ ${r.preco.toFixed(2).replace('.', ',')}</strong><span class="fof-vp-data-tag">${r.data}</span>`;
            cellValor.textContent = fmtMoneyShort(valorMercado);
            if (precoMedio > 0) {
                const dPct = ((r.preco - precoMedio) / precoMedio) * 100;
                const cor = dPct >= 0.5 ? 'pos' : (dPct <= -0.5 ? 'neg' : 'neutro');
                cellDelta.innerHTML = `<span class="fof-vp-d fof-vp-d-${cor}">${dPct >= 0 ? '+' : ''}${dPct.toFixed(1)}%</span>`;
            } else {
                cellDelta.innerHTML = '<span class="fof-vp-na">—</span>';
            }
        });
        await Promise.all(tasks);

        // Total
        const totalCell = root.querySelector('[data-fof-vp-total]');
        if (totalCell) totalCell.textContent = fmtMoneyShort(valorMercadoTotal);
        const totalDeltaCell = root.querySelector('[data-fof-vp-total-delta]');
        if (totalDeltaCell && valorLivroTotal > 0) {
            const dPct = ((valorMercadoTotal - valorLivroTotal) / valorLivroTotal) * 100;
            const cor = dPct >= 0.5 ? 'pos' : (dPct <= -0.5 ? 'neg' : 'neutro');
            totalDeltaCell.innerHTML = `<span class="fof-vp-d fof-vp-d-${cor}">${dPct >= 0 ? '+' : ''}${dPct.toFixed(1)}%</span>`;
        }

        // VP estimado por cota
        if (cotasEmitidas && valorMercadoTotal > 0) {
            const vpEstimado = valorMercadoTotal / cotasEmitidas;
            // Considera ainda parcela não-FII (caixa, etc.) que segue no PL — somamos VP livro residual
            // VP_total_estimado ≈ valorMercadoFIIs + (PL_oficial - valorLivroFIIs) então /cotasEmitidas
            let vpAjustado = vpEstimado;
            if (plRaw && valorLivroTotal > 0 && Math.abs(plRaw - valorLivroTotal) > 0) {
                vpAjustado = (valorMercadoTotal + (plRaw - valorLivroTotal)) / cotasEmitidas;
            }
            const elVp = root.querySelector('[data-fof-vp-estimado]');
            if (elVp) elVp.textContent = 'R$ ' + vpAjustado.toFixed(2).replace('.', ',');

            // Delta vs VP oficial
            if (vpOficial) {
                const dRs = vpAjustado - vpOficial;
                const dPct = (dRs / vpOficial) * 100;
                const elDelta = root.querySelector('[data-fof-vp-delta]');
                const elDeltaSub = root.querySelector('[data-fof-vp-delta-sub]');
                const card = root.querySelector('[data-fof-vp-delta-card]');
                if (elDelta) elDelta.textContent = (dRs >= 0 ? '+' : '') + 'R$ ' + dRs.toFixed(2).replace('.', ',');
                if (elDeltaSub) elDeltaSub.textContent = (dPct >= 0 ? '+' : '') + dPct.toFixed(2) + '% vs VP oficial';
                if (card) {
                    card.classList.remove('fof-vp-pos', 'fof-vp-neg', 'fof-vp-neu');
                    card.classList.add(dPct > 0.5 ? 'fof-vp-pos' : (dPct < -0.5 ? 'fof-vp-neg' : 'fof-vp-neu'));
                }
            }

            // P/VP em tempo real
            if (cotacaoAtual) {
                const pvp = cotacaoAtual / vpAjustado;
                const elPvp = root.querySelector('[data-fof-vp-pvp]');
                if (elPvp) elPvp.textContent = pvp.toFixed(3).replace('.', ',');
            }
        }
    },

    _renderPortfolioTransacoes(transacoes) {
        const esc = (s) => (s == null ? '' : String(s));
        const fmtMoney = (v) => v == null ? '' : this.formatMoney(v);
        const fmtDate = (s) => {
            if (!s) return '—';
            const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
            if (!m) return s;
            const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
            const ano = m[1], mes = meses[parseInt(m[2])-1] || m[2];
            return m[3] ? `${m[3]} ${mes} ${ano}` : `${mes} ${ano}`;
        };
        const today = new Date();
        const tipoMap = {
            aquisicao:      { cor: 'emerald', icone: '+', label: 'Aquisição' },
            estruturacao:   { cor: 'blue',    icone: '⊡', label: 'Estruturação' },
            fato_relevante: { cor: 'amber',   icone: '!', label: 'Fato Relevante' },
            fechamento:     { cor: 'emerald', icone: '✓', label: 'Fechamento' },
            mudanca_mandato:{ cor: 'blue',    icone: '↻', label: 'Mudança de Mandato' },
            evento_futuro:  { cor: 'red',     icone: '◷', label: 'Evento Futuro' },
            venda:          { cor: 'amber',   icone: '−', label: 'Venda' }
        };
        const sorted = transacoes.slice().sort((a,b) => String(a.data).localeCompare(String(b.data)));
        const items = sorted.map(t => {
            const info = tipoMap[t.tipo] || { cor: 'slate', icone: '•', label: (t.tipo||'').replace(/_/g,' ') };
            const data = new Date(String(t.data) + 'T00:00:00');
            const futuro = data > today;
            const corLinha = futuro ? 'red' : info.cor;
            return `
            <div class="port-v2-tl-item ${futuro ? 'port-v2-tl-futuro' : ''}">
                <div class="port-v2-tl-marker encaixe-cor-${corLinha}"><span>${info.icone}</span></div>
                <div class="port-v2-tl-content">
                    <div class="port-v2-tl-head">
                        <div class="port-v2-tl-tipo encaixe-cor-${info.cor}">${info.label}</div>
                        <div class="port-v2-tl-data">${fmtDate(t.data)}${futuro ? ' (futuro)' : ''}</div>
                    </div>
                    <div class="port-v2-tl-titulo">${esc(t.titulo)}</div>
                    <div class="port-v2-tl-desc">${esc(t.descricao)}</div>
                    ${t.valor ? `<div class="port-v2-tl-valor">Valor: <strong>${fmtMoney(t.valor)}</strong></div>` : ''}
                    ${t.fonte ? `<div class="port-v2-tl-fonte">${esc(t.fonte)}</div>` : ''}
                </div>
            </div>`;
        }).join('');
        return `
        <div class="dark-card rounded-3xl p-6 mb-6">
            <div class="encaixe-section-tag">HISTÓRICO MATERIAL</div>
            <div class="encaixe-section-titulo">Transações relevantes — passado e futuro</div>
            <p class="text-sm text-slate-400 mb-4">Aquisições, vendas, fatos relevantes e eventos futuros documentados que mudaram (ou vão mudar) a estrutura do fundo.</p>
            <div class="port-v2-tl-list">${items}</div>
        </div>`;
    },

    // ──────────────────────────────────────────────────
    // TIMELINE
    // ──────────────────────────────────────────────────
    renderTimeline() {
        const t = this.data.timeline;
        if (!t || !Array.isArray(t.periodos) || t.periodos.length === 0) return '';

        // Mapa de cor por tipo (esquema canônico alternativo: { tipo: "marco" })
        const tipoCorMap = {
            marco: 'blue', ipo: 'blue', emissao: 'blue',
            crise: 'red',  evento_credito: 'red',
            crescimento: 'emerald', positivo: 'emerald',
            transformacao: 'amber', amber: 'amber'
        };

        // Periodos
        let periodosHtml = '';
        t.periodos.forEach((per, i) => {
            const isLast = i === t.periodos.length - 1;
            const mbClass = isLast ? '' : ' mb-8';
            const titulo = per.titulo || per.epoca || per.nome || '';
            const cor = per.cor || tipoCorMap[per.tipo] || 'slate';
            const borderClass = (cor !== 'blue' && cor !== 'slate') ? ` border border-${cor}-500/30` : ' border border-slate-700/50';

            // Aceita pontos[] (canônico), bullets[] ou descricao (string única)
            let pontos = [];
            if (Array.isArray(per.pontos)) pontos = per.pontos;
            else if (Array.isArray(per.bullets)) pontos = per.bullets;
            else if (typeof per.descricao === 'string' && per.descricao.trim()) pontos = [per.descricao];

            let pontosHtml = '';
            pontos.forEach(ponto => {
                pontosHtml += `<li>&bull; ${ponto}</li>`;
            });

            periodosHtml += `
                    <div class="${mbClass} relative">
                        <div class="timeline-dot bg-${per.cor}-500 absolute -left-12"></div>
                        <div class="bg-slate-800/50 rounded-xl p-5${borderClass}">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-${cor}-400 font-bold">${per.periodo || per.data || ''}</span>
                                <span class="px-2 py-1 bg-${cor}-500/20 text-${cor}-400 text-xs rounded">${per.label || titulo || (per.tipo || '').toUpperCase()}</span>
                            </div>
                            <p class="text-slate-300 text-sm mb-2">${(pontos.length > 0 && per.descricao && pontos[0] === per.descricao) ? '' : (per.descricao || '')}</p>
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
                        <h2 class="text-2xl font-bold text-white">História do Fundo${(() => {
                            const ext = (per) => {
                                const s = per && (per.periodo || per.data || per.ano);
                                if (!s) return null;
                                const m = String(s).match(/(\d{4})/g);
                                return m ? m[0] : null;
                            };
                            const last = (per) => {
                                const s = per && (per.periodo || per.data || per.ano);
                                if (!s) return null;
                                const m = String(s).match(/(\d{4})/g);
                                return m ? m[m.length-1] : null;
                            };
                            const ini = ext(t.periodos[0]);
                            const fim = last(t.periodos[t.periodos.length-1]);
                            return (ini && fim) ? ` (${ini}-${fim})` : '';
                        })()}</h2>
                        <p class="text-slate-400 text-sm">${t.subtitulo || ''}</p>
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
        if (!div) return '';

        const hasHistorico = Array.isArray(div.historico) && div.historico.length > 0;
        const hasCaixa = hasHistorico && div.historico.some(h => h.caixaAcumulado !== undefined || h.caixaMes !== undefined);

        // ──────────────────────────────────────────────
        // 3 CARDS NO TOPO: ultimo / proximo / pontos
        // ──────────────────────────────────────────────
        const histSorted = hasHistorico
            ? div.historico.slice().sort((a, b) => String(a.data).localeCompare(String(b.data)))
            : [];
        const ultimo = histSorted.length ? histSorted[histSorted.length - 1] : null;

        // Card 1 — Último dividendo pago
        let cardUltimoHtml = '';
        if (ultimo && ultimo.dividendo !== undefined) {
            const valor = Number(ultimo.dividendo);
            const dataPg = ultimo.dataPagamento || '';
            const dataPgFmt = dataPg ? this._formatDateBR(dataPg) : '';
            const competencia = this._formatMesAbbr(ultimo.data);
            cardUltimoHtml = `
            <div class="divid-v2-topcard divid-v2-topcard-paid">
                <div class="divid-v2-topcard-tag">ÚLTIMO DIVIDENDO</div>
                <div class="divid-v2-topcard-value">R$ ${valor.toFixed(2).replace('.',',')}</div>
                <div class="divid-v2-topcard-sub">Competência ${competencia}${dataPgFmt ? ' · pago em ' + dataPgFmt : ''}</div>
            </div>`;
        }

        // Card 2 — Próximo dividendo esperado
        let cardProxHtml = '';
        const projGuid = (div.guidance && div.guidance.faixaMin !== undefined && div.guidance.faixaMax !== undefined)
            ? { min: Number(div.guidance.faixaMin), max: Number(div.guidance.faixaMax) }
            : null;
        // Próximo dividendo: por padrão repete o último DPS conhecido (cenário mais provável
        // sem evento ativo no mês seguinte). Só usa a média da faixa quando não houver
        // último DPS disponível. Se houver evento futuro casando com o mês próximo, ajusta.
        let proxValor = null;
        let proxJustificativa = '';
        const proxData = this._nextMonthKey(ultimo ? ultimo.data : null);
        if (ultimo && ultimo.dividendo !== undefined) {
            proxValor = Number(ultimo.dividendo);
            proxJustificativa = `repete o último DPS conhecido (${this._formatMesAbbr(ultimo.data)})`;
            // Se houver evento futuro ativo no proxData, aplica delta esperado
            const eventos = Array.isArray(div.eventosFuturos) ? div.eventosFuturos : [];
            const evNoMes = eventos.find(e => e.data === proxData);
            if (evNoMes && evNoMes.impactoValor !== undefined && evNoMes.impactoValor !== null) {
                const delta = Number(evNoMes.impactoValor);
                proxValor = Math.round((proxValor + delta) * 100) / 100;
                const sinal = delta >= 0 ? '+' : '−';
                proxJustificativa = `${proxJustificativa} ${sinal} R$ ${Math.abs(delta).toFixed(2).replace('.',',')} (${evNoMes.titulo})`;
            }
            // Limita à faixa do guidance, se houver
            if (projGuid) {
                if (proxValor < projGuid.min) proxValor = projGuid.min;
                if (proxValor > projGuid.max) proxValor = projGuid.max;
            }
        } else if (projGuid) {
            proxValor = (projGuid.min + projGuid.max) / 2;
            proxJustificativa = 'média da faixa do guidance (sem histórico recente)';
        }
        if (proxValor !== null) {
            const proxData = this._nextMonthKey(ultimo ? ultimo.data : null);
            const proxComp = this._formatMesAbbr(proxData);
            // Cronograma: se o gestor divulgou (cronogramaAnuncio.fonte=gestor), usa as datas dele
            const cron = (div.guidance && div.guidance.cronogramaAnuncio) || null;
            let dataDecl, dataPag, fonteCron, fonteCronExtra = '';
            if (cron && cron.fonte === 'gestor') {
                dataDecl = cron.dataAnuncioEstimada ? this._formatDateBR(cron.dataAnuncioEstimada) : this._estimarDataAnuncio(proxData);
                dataPag  = cron.dataPagamentoEstimada ? this._formatDateBR(cron.dataPagamentoEstimada) : this._estimarDataPagamento(proxData);
                fonteCron = 'cronograma divulgado pela gestão';
                if (cron.regraTexto) fonteCronExtra = ` · ${cron.regraTexto}`;
            } else if (cron && (cron.dataAnuncioEstimada || cron.dataPagamentoEstimada)) {
                dataDecl = cron.dataAnuncioEstimada ? this._formatDateBR(cron.dataAnuncioEstimada) : this._estimarDataAnuncio(proxData);
                dataPag  = cron.dataPagamentoEstimada ? this._formatDateBR(cron.dataPagamentoEstimada) : this._estimarDataPagamento(proxData);
                fonteCron = 'estimativa pelo padrão histórico do fundo';
            } else {
                dataDecl = this._estimarDataAnuncio(proxData);
                dataPag  = this._estimarDataPagamento(proxData);
                fonteCron = 'estimativa pelo padrão FundosNet (5º dia útil para anúncio, ~12º para pagamento)';
            }
            // Fonte do VALOR (separada da fonte do CRONOGRAMA)
            const fonteValor = (div.guidance && div.guidance.fonte === 'gestor')
                ? 'valor: guidance do gestor'
                : 'valor: estimativa com base nas premissas';
            const faixaTxt = projGuid
                ? `R$ ${projGuid.min.toFixed(2).replace('.',',')} a R$ ${projGuid.max.toFixed(2).replace('.',',')}`
                : null;
            // Countdown: dias entre hoje e a data esperada de anúncio (= data-base no BLMG11 e na maioria dos FIIs)
            const countdownAnuncio = this._diasAte(cron && cron.dataAnuncioEstimada);
            const countdownPag     = this._diasAte(cron && cron.dataPagamentoEstimada);
            // Se nao tinha cron formal mas calculamos com _estimarDataAnuncio, derivar a data ISO daquele mes
            const fallbackAnuncio = this._estimarDataAnuncioISO(proxData);
            const fallbackPag     = this._estimarDataPagamentoISO(proxData);
            const cntAnuncio = countdownAnuncio !== null ? countdownAnuncio : this._diasAte(fallbackAnuncio);
            const cntPag     = countdownPag !== null ? countdownPag : this._diasAte(fallbackPag);
            const fmtCount = (n) => {
                if (n === null) return '';
                if (n === 0) return ' <span class="divid-v2-topcard-count">hoje</span>';
                if (n > 0)  return ` <span class="divid-v2-topcard-count">em ${n} ${n === 1 ? 'dia' : 'dias'}</span>`;
                return ` <span class="divid-v2-topcard-count past">há ${-n} ${n === -1 ? 'dia' : 'dias'}</span>`;
            };

            cardProxHtml = `
            <div class="divid-v2-topcard divid-v2-topcard-next">
                <div class="divid-v2-topcard-tag">PRÓXIMO DIVIDENDO <span class="divid-v2-topcard-tag-soft">expectativa</span></div>
                <div class="divid-v2-topcard-value">R$ ${proxValor.toFixed(2).replace('.',',')}</div>
                <div class="divid-v2-topcard-sub">Competência ${proxComp}${faixaTxt ? ' · faixa ' + faixaTxt : ''}</div>
                <div class="divid-v2-topcard-meta">
                    <div><span>Para receber, ter cota até:</span> <strong>${dataDecl}</strong>${fmtCount(cntAnuncio)}</div>
                    <div><span>Pagamento esperado:</span> <strong>${dataPag}</strong>${fmtCount(cntPag)}</div>
                </div>
                <div class="divid-v2-topcard-foot">${proxJustificativa ? proxJustificativa + ' · ' : ''}${fonteCron}${fonteCronExtra}</div>
            </div>`;
        }

        // Card 3 — Pontos de atenção (alertas)
        let cardAlertasHtml = '';
        if (Array.isArray(div.alertas) && div.alertas.length > 0) {
            const items = div.alertas.map(a => `
                <li class="divid-v2-topcard-alert-item sev-${a.severidade || 'blue'}">
                    <span class="divid-v2-topcard-alert-dot"></span>
                    <span>${a.mensagem}</span>
                </li>`).join('');
            cardAlertasHtml = `
            <div class="divid-v2-topcard divid-v2-topcard-alerts">
                <div class="divid-v2-topcard-tag">PONTOS DE ATENÇÃO</div>
                <ul class="divid-v2-topcard-alert-list">${items}</ul>
            </div>`;
        }

        const topRowHtml = (cardUltimoHtml || cardProxHtml || cardAlertasHtml)
            ? `<div class="divid-v2-toprow">${cardUltimoHtml}${cardProxHtml}${cardAlertasHtml}</div>`
            : '';

        // ──────────────────────────────────────────────
        // SÍNTESE COMPILADA — leitura geral pos/neg + veredicto
        // ──────────────────────────────────────────────
        let sinteseHtml = '';
        if (div.sintese) {
            const s = div.sintese;
            const cor = s.cor || 'amber';
            const peso = (p) => {
                const map = { alto: 'Peso alto', medio: 'Peso médio', baixo: 'Peso baixo' };
                return map[p] || '';
            };
            const lista = (items, kind) => {
                if (!Array.isArray(items) || !items.length) {
                    return `<div class="divid-v2-sintese-empty">Nenhum identificado.</div>`;
                }
                return items.map(i => `
                    <li class="divid-v2-sintese-item peso-${i.peso || 'medio'}">
                        <span class="divid-v2-sintese-bullet"></span>
                        <span class="divid-v2-sintese-text">${i.texto}</span>
                        ${i.peso ? `<span class="divid-v2-sintese-peso">${peso(i.peso)}</span>` : ''}
                    </li>`).join('');
            };
            sinteseHtml = `
            <div class="dark-card divid-v2-sintese rounded-3xl mb-6 cor-${cor}">
                <div class="divid-v2-sintese-head">
                    <span class="divid-v2-sintese-tag">SÍNTESE</span>
                    <span class="divid-v2-sintese-tendencia">${s.tendenciaLabel || s.tendencia || ''}</span>
                </div>
                ${s.direcao ? `<p class="divid-v2-sintese-direcao">${s.direcao}</p>` : ''}
                <div class="divid-v2-sintese-grid">
                    <div class="divid-v2-sintese-col positivo">
                        <h4>A favor do dividendo</h4>
                        <ul>${lista(s.pontosPositivos, 'positivo')}</ul>
                    </div>
                    <div class="divid-v2-sintese-col negativo">
                        <h4>Contra o dividendo</h4>
                        <ul>${lista(s.pontosNegativos, 'negativo')}</ul>
                    </div>
                </div>
                ${s.veredicto ? `<div class="divid-v2-sintese-veredicto">${s.veredicto}</div>` : ''}
            </div>`;
        }

        // --- SUSTENTABILIDADE DO DIVIDENDO ---
        let sustHtml = '';
        if (div.sustentabilidade) {
            const s = div.sustentabilidade;
            const statusLabelMap = {
                fazendo_caixa: 'fazendo caixa',
                queimando_caixa: 'queimando caixa',
                estavel: 'estável',
                misto: 'misto'
            };
            const caixaSubLbl = statusLabelMap[s.status] || (s.status || '—');
            const statusIcon = {
                fazendo_caixa: '↑', queimando_caixa: '↓', estavel: '=', misto: '↕'
            }[s.status] || '•';
            // Header principal: status do DIVIDENDO (não só do caixa)
            const dividendoStatusMap = {
                sustentavel_longo:        { label: 'Sustentável a longo prazo',   icone: '✓', cor: 'emerald' },
                sustentavel_ate_horizonte:{ label: s.dividendoLabel || 'Sustentável com horizonte', icone: '◔', cor: 'amber' },
                sustentavel_curto:        { label: 'Sustentabilidade curta',      icone: '◑', cor: 'amber' },
                pressao_imediata:         { label: 'Pressão imediata',            icone: '⚠', cor: 'red' },
                insustentavel:            { label: 'Insustentável no curto prazo',icone: '✕', cor: 'red' }
            };
            const dvStatus = s.dividendoStatus || null;
            const dvInfo = dvStatus ? dividendoStatusMap[dvStatus] : null;
            const dvLabel = (s.dividendoLabel || (dvInfo ? dvInfo.label : null)) || statusLabelMap[s.status] || '—';
            const dvCor   = (s.dividendoCor || (dvInfo ? dvInfo.cor : null)) || 'amber';
            const dvIcone = dvInfo ? dvInfo.icone : statusIcon;
            const payoutTxt = s.payoutMedio12m != null
                ? (s.payoutMedio12m * 100).toFixed(0) + '%'
                : '—';
            // Caixa LIQUIDO (preferencia) ou caixaAcumulado (legado)
            const caixaLiq = s.caixaLiquido != null ? s.caixaLiquido : s.caixaAcumulado;
            const caixaTxt = caixaLiq != null ? this.formatMoney(caixaLiq) : '—';
            const caixaLbl = s.caixaLiquido != null ? 'Caixa líquido' : 'Caixa acumulado';
            const caixaTip = s.caixaLiquidoComposicao || s.resultadoAcumuladoNota || '';
            const cobTxt = s.coberturaMeses != null ? s.coberturaMeses.toFixed(1) + ' meses' : '—';
            const queimaTxt = (s.queimaMediaMensal != null && s.queimaMediaMensal !== 0)
                ? this.formatMoney(s.queimaMediaMensal) + '/mês'
                : null;
            // Bloco extra: resultado retido (so quando explicitamente fornecido com fonte verificavel)
            const retidoBlock = '';
            const queimaStat = queimaTxt
                ? `<div class="divid-v2-sust-stat" title="Queima média mensal de caixa líquido para complementar a distribuição"><div class="divid-v2-sust-stat-val">${queimaTxt}</div><div class="divid-v2-sust-stat-lbl">Queima/mês</div></div>`
                : '';
            const horizonteTxt = s.horizonte
                ? `<div class="divid-v2-sust-horizonte">Horizonte: <strong>${s.horizonte}</strong></div>`
                : '';
            sustHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="divid-v2-sust-card cor-${dvCor}">
                    <div class="divid-v2-sust-badge cor-${dvCor}">${dvIcone}</div>
                    <div class="divid-v2-sust-text">
                        <div class="divid-v2-sust-tag">SUSTENTABILIDADE DO DIVIDENDO</div>
                        <div class="divid-v2-sust-titulo">${dvLabel}</div>
                        ${horizonteTxt}
                        <div class="divid-v2-sust-caixa-sub">Caixa: <strong class="cor-${dvCor}">${caixaSubLbl}</strong></div>
                        <div class="divid-v2-sust-leitura">${s.leitura || ''}</div>
                        ${retidoBlock}
                    </div>
                </div>
                <div class="divid-v2-sust-stats">
                    <div class="divid-v2-sust-stat"><div class="divid-v2-sust-stat-val">${payoutTxt}</div><div class="divid-v2-sust-stat-lbl">Payout 12m</div></div>
                    <div class="divid-v2-sust-stat" title="${caixaTip.replace(/"/g,'&quot;')}"><div class="divid-v2-sust-stat-val">${caixaTxt}</div><div class="divid-v2-sust-stat-lbl">${caixaLbl}</div></div>
                    ${queimaStat}
                    <div class="divid-v2-sust-stat"><div class="divid-v2-sust-stat-val">${cobTxt}</div><div class="divid-v2-sust-stat-lbl">Cobertura</div></div>
                </div>
            </div>`;
        }

        // --- GRÁFICO DE DIVIDENDOS (longo prazo) + range/group picker ---
        let graficosHtml = '';
        if (hasHistorico) {
            const ranges = [
                { id: '12m',  label: '12m' },
                { id: '24m',  label: '24m' },
                { id: '60m',  label: '5 anos' },
                { id: 'ipo',  label: 'Desde IPO' }
            ];
            const n = div.historico.length;
            const visibleRanges = ranges.filter(r => {
                if (r.id === '12m') return n >= 1;
                if (r.id === '24m') return n >= 13;
                if (r.id === '60m') return n >= 25;
                return true;
            });
            const defaultRange = n >= 25 ? 'ipo' : (n >= 13 ? '24m' : '12m');
            const rangePicker = visibleRanges.map(r => `
                <button type="button" class="divid-v2-range-btn ${r.id === defaultRange ? 'is-active' : ''}" data-range="${r.id}">${r.label}</button>
            `).join('');

            const groupPicker = `
                <div class="divid-v2-group-picker" role="tablist" aria-label="Agrupamento">
                    <button type="button" class="divid-v2-group-btn is-active" data-group="mes">Por mês</button>
                    <button type="button" class="divid-v2-group-btn" data-group="ano">Por ano</button>
                </div>`;

            // Dois gráficos empilhados: dividendo (barras) em cima, caixa (linha) embaixo.
            // Caixa só aparece se houver série em historico[].
            const caixaBlock = hasCaixa
                ? `<div class="divid-v2-caixa-block">
                       <div class="divid-v2-caixa-head">
                           <h3 class="divid-v2-caixa-title" data-chart-title="caixa">Caixa líquido (R$) — item 9 do Informe Mensal</h3>
                           <div class="divid-v2-caixa-legend">
                               <span><i class="dot-sw" style="background:rgba(167,139,250,0.65);border:1px solid #a78bfa"></i>com dado oficial</span>
                               <span><i class="dot-sw" style="background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.45)"></i>repetido do mês anterior</span>
                           </div>
                       </div>
                       <div class="chart-container" style="height:160px"><canvas id="caixaChart"></canvas></div>
                   </div>`
                : '';
            const chartsBlock = `
                <div class="divid-v2-dividendo-block">
                    <h3 class="divid-v2-caixa-title" data-chart-title="dividendos">Dividendo (R$/cota)</h3>
                    <div class="chart-container" style="height:240px"><canvas id="dividendosChart"></canvas></div>
                </div>
                ${caixaBlock}`;

            graficosHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="divid-v2-charts-head">
                    <h2 class="text-xl font-bold text-white">Histórico</h2>
                    <div class="divid-v2-charts-controls">
                        ${groupPicker}
                        <div class="divid-v2-range-picker" role="tablist">${rangePicker}</div>
                    </div>
                </div>
                ${chartsBlock}
            </div>`;
        } else if (Array.isArray(div.chartData) && div.chartData.length) {
            // Fallback v1
            graficosHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <h2 class="text-xl font-bold text-white mb-3">Dividendos Mensais</h2>
                <div class="chart-container" style="height:260px"><canvas id="dividendosChart"></canvas></div>
            </div>`;
        }

        // (removido) Card "Totais Anuais" — agora coberto pelo filtro "Por ano" no gráfico de Histórico
        let totaisHtml = '';

        // --- TIMELINE de eventos (passado + futuro) com escala temporal ---
        const passados = Array.isArray(div.eventosPassados) ? div.eventosPassados : [];
        const futuros  = Array.isArray(div.eventosFuturos)  ? div.eventosFuturos  : [];
        let timelineHtml = '';
        if (passados.length || futuros.length) {
            const PX_PER_MONTH = 22;        // espacamento proporcional: 1 mes = 22px
            const PADDING_MONTHS = 2;       // folga antes/depois
            const monthsBetween = (a, b) => {
                const [ya, ma] = a.split('-').map(Number);
                const [yb, mb] = b.split('-').map(Number);
                return (yb - ya) * 12 + (mb - ma);
            };
            const todayKey = (() => {
                const d = new Date();
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            })();
            const allDates = [
                ...passados.map(e => e.data).filter(Boolean),
                ...futuros.map(e => e.data).filter(Boolean),
                todayKey
            ].sort();
            const startKey = allDates[0];
            const endKey   = allDates[allDates.length - 1];
            // Adiciona padding
            const [sy, sm] = startKey.split('-').map(Number);
            const startDate = { y: sy, m: sm - PADDING_MONTHS };
            while (startDate.m <= 0) { startDate.m += 12; startDate.y--; }
            const startKeyPad = startDate.y + '-' + String(startDate.m).padStart(2, '0');
            const totalMonths = monthsBetween(startKeyPad, endKey) + PADDING_MONTHS * 2;
            const totalWidth  = Math.max(totalMonths * PX_PER_MONTH, 600);
            const offsetOf = (key) => monthsBetween(startKeyPad, key) * PX_PER_MONTH;

            // Marcadores de ano
            const startY = startDate.y;
            const endY   = parseInt(endKey.split('-')[0], 10);
            let yearsHtml = '';
            for (let y = startY; y <= endY; y++) {
                const x = offsetOf(y + '-01');
                yearsHtml += `<div class="divid-v2-tl-year" style="left:${x}px"><span>${y}</span></div>`;
            }

            // Marcador HOJE (com dot clicável centralizado nele)
            const todayX = offsetOf(todayKey);
            const todayMarker = `
                <div class="divid-v2-tl-today" style="left:${todayX}px" aria-label="hoje"><span>HOJE</span></div>
                <button type="button"
                    class="divid-v2-tl-dot kind-hoje"
                    style="left:${todayX}px"
                    data-kind="hoje" data-idx="0"
                    title="Hoje"
                    aria-label="Selecionar hoje"></button>`;

            // Pontos — severidade colore (verde/vermelho/azul) e certeza modula saturacao (futuros)
            const dotHtml = (e, i, kind) => {
                const x = offsetOf(e.data);
                const sev = e.severidade || 'neutro';
                const cer = e.certeza || 'projetado';
                const cls = kind === 'passado'
                    ? `kind-passado sev-${sev}`
                    : `kind-futuro sev-${sev} cer-${cer}`;
                const titulo = (e.titulo || '').replace(/"/g, '&quot;');
                return `<button type="button"
                    class="divid-v2-tl-dot ${cls}"
                    style="left:${x}px"
                    data-kind="${kind}" data-idx="${i}"
                    title="${e.data || ''} — ${titulo}"
                    aria-label="${e.data || ''} ${titulo}"></button>`;
            };
            const dotsPast = passados.map((e, i) => dotHtml(e, i, 'passado')).join('');
            const dotsFut  = futuros.map((e, i) => dotHtml(e, i, 'futuro')).join('');

            timelineHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <h2 class="text-xl font-bold text-white mb-2">Eventos que impactam dividendo</h2>
                <div class="divid-v2-tl-legend">
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw bg-emerald-500"></i>positivo</span>
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw bg-red-500"></i>negativo</span>
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw bg-blue-500"></i>neutro</span>
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw" style="background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.5)"></i>confirmado</span>
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw" style="background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4)"></i>projetado</span>
                    <span class="divid-v2-tl-legend-item"><i class="dot-sw" style="border:1px dashed rgba(255,255,255,0.5);background:transparent"></i>possível</span>
                </div>
                <p class="divid-v2-tl-hint">Arraste para o lado para navegar.</p>
                <div class="divid-v2-tl-scroll">
                    <div class="divid-v2-tl-canvas" style="width:${totalWidth}px">
                        <div class="divid-v2-tl-line" style="width:${totalWidth}px"></div>
                        ${yearsHtml}
                        ${todayMarker}
                        ${dotsPast}
                        ${dotsFut}
                    </div>
                </div>
                <div class="divid-v2-timeline-details" id="divid-v2-timeline-details">
                    <div class="divid-v2-timeline-details-empty">Toque em um ponto da linha do tempo para ver os detalhes do evento.</div>
                </div>
            </div>`;
            // Constrói "evento" sintético do HOJE com resumo do estado atual
            const histSorted = Array.isArray(div.historico)
                ? div.historico.slice().sort((a,b) => String(a.data).localeCompare(String(b.data)))
                : [];
            const ultimoH = histSorted.length ? histSorted[histSorted.length - 1] : null;
            const hojeEvento = {
                data: todayKey,
                titulo: 'Hoje',
                descricao: ultimoH
                    ? `<p>Último dividendo conhecido: <strong>R$ ${Number(ultimoH.dividendo).toFixed(2).replace('.',',')}</strong> (competência ${this._formatMesAbbr(ultimoH.data)}). Eventos passados estão à esquerda, projeções futuras à direita.</p>`
                    : '<p>Eventos passados aparecem à esquerda do marcador HOJE; projeções futuras à direita.</p>',
                severidade: 'neutro',
                certeza: null,
                impactoDividendo: null,
                fonte: null
            };
            this._dividendosTimelineData = { passados, futuros, hoje: hojeEvento, scrollToToday: todayX };
        }

        // --- GUIDANCE ---
        let guidanceHtml = '';
        if (div.guidance) {
            const g = div.guidance;
            const fonteLbl = g.fonte === 'gestor' ? 'Informado pelo gestor' : 'Estimativa própria';
            const faixa = (g.faixaMin !== undefined && g.faixaMax !== undefined)
                ? `R$ ${Number(g.faixaMin).toFixed(2).replace('.',',')} a R$ ${Number(g.faixaMax).toFixed(2).replace('.',',')}`
                : (g.faixa || '');
            const unid = g.unidade || 'R$/cota/mês';
            const docTxt = g.fonte === 'gestor' && g.documento ? ` · <span class="text-slate-400">${g.documento}</span>` : '';
            let premHtml = '';
            if (g.fonte === 'estimativa' && Array.isArray(g.premissas) && g.premissas.length) {
                premHtml = `<div class="divid-v2-guidance-premissas"><strong>Premissas:</strong><ul>${g.premissas.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
            }
            const nota = g.nota ? `<div class="divid-v2-guidance-premissas">${g.nota}</div>` : '';
            // Constroi projecao dos proximos 12 meses (do guidance se existir, senao deriva)
            const projecao = this._buildGuidanceProjection(g, div);
            const cobreMeses = (g.fonte === 'gestor' && g.cobreMeses) ? Number(g.cobreMeses) : 0;
            const legendaGestor = cobreMeses > 0
                ? `<span><i class="dash-sw" style="background:#22d3ee"></i>coberto pelo gestor (${cobreMeses}m)</span>`
                : '';
            const chartHtml = projecao && projecao.length
                ? `<div class="divid-v2-guidance-chart-wrap">
                       <div class="divid-v2-guidance-chart-head">
                           <span class="divid-v2-guidance-chart-title">Próximos 12 meses (R$/cota)</span>
                           <span class="divid-v2-guidance-chart-legend">
                               <span><i class="dash-sw" style="background:#10b981"></i>banda máxima</span>
                               <span><i class="dash-sw dotted" style="background:rgba(255,255,255,0.5)"></i>média</span>
                               <span><i class="dash-sw" style="background:#ef4444"></i>banda mínima</span>
                               <span><i class="dot-sw" style="background:#a78bfa"></i>estimativa do mês</span>
                               ${legendaGestor}
                           </span>
                       </div>
                       <div class="chart-container" style="height:220px"><canvas id="guidanceChart"></canvas></div>
                   </div>`
                : '';
            this._guidanceProjection = projecao;
            guidanceHtml = `
            <div class="divid-v2-guidance mb-6">
                <h2 class="divid-v2-guidance-titulo">Guidance de dividendos</h2>
                <div class="divid-v2-guidance-head">
                    <span class="divid-v2-guidance-fonte ${g.fonte || ''}">${fonteLbl}</span>
                    <div>
                        <div class="divid-v2-guidance-faixa">${faixa}</div>
                        <div class="divid-v2-guidance-period">${g.periodo || ''} ${unid}${docTxt}</div>
                    </div>
                </div>
                ${chartHtml}
                ${premHtml}
                ${nota}
            </div>`;
        }

        // --- PROJEÇÃO DY ---
        let projHtml = '';
        if (div.projecaoDy) {
            const p = div.projecaoDy;
            const base = (p.cenarios || []).find(c => /base/i.test(c.rotulo)) || null;
            const otim = (p.cenarios || []).find(c => /otim/i.test(c.rotulo)) || null;
            const pess = (p.cenarios || []).find(c => /pess/i.test(c.rotulo)) || null;
            const card = (c, cls) => c ? `
                <div class="divid-v2-cenario ${cls}">
                    <div class="divid-v2-cenario-label">${c.rotulo}</div>
                    <div class="divid-v2-cenario-dy">${typeof c.dy12m === 'number' ? c.dy12m.toFixed(1) + '%' : c.dy12m}</div>
                    <div class="divid-v2-cenario-div">${c.dividendoMes !== undefined ? `R$ ${Number(c.dividendoMes).toFixed(2).replace('.',',')}/mês` : ''}</div>
                    <div class="divid-v2-cenario-desc">${c.descricao || ''}</div>
                </div>` : '';
            const rt = p.retornoTotal12m !== undefined ? `<div class="text-xs text-slate-400 mt-3">Retorno total estimado 12m (DY + potencial valorização): <strong class="text-white">${Number(p.retornoTotal12m).toFixed(1)}%</strong></div>` : '';
            const prem = Array.isArray(p.premissas) && p.premissas.length ? `<ul class="text-xs text-slate-400 mt-2 list-disc pl-5">${p.premissas.map(x => `<li>${x}</li>`).join('')}</ul>` : '';
            projHtml = `
            <div class="dark-card rounded-3xl p-6 mb-6">
                <div class="flex items-center justify-between flex-wrap gap-3 mb-2">
                    <h2 class="text-xl font-bold text-white">Projeção de DY (12 meses)</h2>
                    <span class="text-xs text-slate-400">Preço de referência: R$ ${Number(p.precoReferencia).toFixed(2).replace('.',',')}</span>
                </div>
                <div class="divid-v2-projecao-grid">
                    ${card(base, 'is-base')}
                    ${card(otim, 'is-otimista')}
                    ${card(pess, 'is-pessimista')}
                </div>
                ${rt}
                ${prem}
            </div>`;
        }

        // --- STATS (v1-compat, no rodape) ---
        let statsHtml = '';
        if (Array.isArray(div.stats) && div.stats.length) {
            const items = div.stats.map(s => {
                const valorColor = s.cor ? `text-${s.cor}-400` : 'text-white';
                return `<div class="bg-white/5 rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold ${valorColor}">${s.valor}</div>
                    <div class="text-xs text-slate-500">${s.label}</div>
                </div>`;
            }).join('');
            statsHtml = `<div class="grid grid-cols-2 md:grid-cols-${div.stats.length} gap-4 mb-6">${items}</div>`;
        }

        // Ordem: cards topo → histórico (gráficos) → sustentabilidade → SÍNTESE → timeline → guidance → projeção
        return `
        <section class="mb-8 fade-in">
            ${topRowHtml}
            ${graficosHtml}
            ${sustHtml}
            ${sinteseHtml}
            ${totaisHtml}
            ${timelineHtml}
            ${guidanceHtml}
            ${projHtml}
            ${statsHtml}
        </section>`;
    },

    _formatDateBR(dataStr) {
        if (!dataStr) return '';
        const m = String(dataStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return String(dataStr);
        return `${m[3]}/${m[2]}/${m[1]}`;
    },

    _nextMonthKey(yyyymm) {
        let y, m;
        if (yyyymm) {
            const p = yyyymm.split('-').map(Number);
            y = p[0]; m = p[1] + 1;
        } else {
            const d = new Date();
            y = d.getFullYear(); m = d.getMonth() + 2;
        }
        if (m > 12) { m = 1; y++; }
        return y + '-' + String(m).padStart(2, '0');
    },

    _estimarDataAnuncioISO(yyyymm) {
        const [y, m] = yyyymm.split('-').map(Number);
        const next = new Date(y, m, 5);
        return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2,'0') + '-' + String(next.getDate()).padStart(2,'0');
    },
    _estimarDataPagamentoISO(yyyymm) {
        const [y, m] = yyyymm.split('-').map(Number);
        const next = new Date(y, m, 12);
        return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2,'0') + '-' + String(next.getDate()).padStart(2,'0');
    },
    _estimarDataAnuncio(yyyymm) { return this._formatDateBR(this._estimarDataAnuncioISO(yyyymm)); },
    _estimarDataPagamento(yyyymm) { return this._formatDateBR(this._estimarDataPagamentoISO(yyyymm)); },

    _diasAte(isoDate) {
        if (!isoDate) return null;
        const m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        const alvo = new Date(parseInt(m[1],10), parseInt(m[2],10) - 1, parseInt(m[3],10));
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        alvo.setHours(0, 0, 0, 0);
        return Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
    },

    formatMoney(n) {
        if (n === undefined || n === null) return '—';
        const abs = Math.abs(n);
        if (abs >= 1e9) return 'R$ ' + (n/1e9).toFixed(2).replace('.',',') + ' bi';
        if (abs >= 1e6) return 'R$ ' + (n/1e6).toFixed(2).replace('.',',') + ' mi';
        if (abs >= 1e3) return 'R$ ' + (n/1e3).toFixed(0) + ' mil';
        return 'R$ ' + n.toFixed(2).replace('.',',');
    },

    // ──────────────────────────────────────────────────
    // VALUATION
    // ──────────────────────────────────────────────────
    renderValuation() {
        const v = this.data.valuation;
        if (!v || !v.pvp) return '';
        if (v.schema === 'v2') return this._renderValuationV2(v);
        return this._renderValuationV1(v);
    },

    _renderValuationV1(v) {
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
    // VALUATION v2 — gráficos históricos + preço justo + expectativas
    // ──────────────────────────────────────────────────
    _normalizeValuationV2(v) {
        // Tolerância a variações estruturais do LLM. Mapeia forma alternativa para a esperada.
        if (!v) return v;

        // pvp: aceita {atual, vpCota, cotacao, interpretacao} OU {valor, descricao, detalhes[]}
        if (v.pvp) {
            if (v.pvp.valor === undefined && v.pvp.atual !== undefined) {
                const fmt = (x) => typeof x === 'number' ? x.toFixed(2).replace('.', ',') : x;
                v.pvp.valor = fmt(v.pvp.atual);
                v.pvp.descricao = v.pvp.descricao || v.pvp.interpretacao || '';
                if (!v.pvp.detalhes) {
                    const det = [];
                    if (v.pvp.vpCota != null) det.push({ label: 'VP/Cota', valor: 'R$ ' + fmt(v.pvp.vpCota) });
                    if (v.pvp.cotacao != null) det.push({ label: 'Preço', valor: 'R$ ' + fmt(v.pvp.cotacao), cor: 'emerald' });
                    v.pvp.detalhes = det;
                }
            }
        }

        // spread: aceita {dyFii, selic, spread, interpretacao} OU {valor, label, cor, descricao, detalhe}
        if (v.spread) {
            if (v.spread.valor === undefined && v.spread.dyFii !== undefined) {
                const fmt = (x) => typeof x === 'number' ? x.toFixed(2).replace('.', ',') : x;
                v.spread.valor = fmt(v.spread.dyFii) + '%';
                v.spread.label = `DY 12m vs Selic ${fmt(v.spread.selic)}%`;
                v.spread.descricao = v.spread.descricao || v.spread.interpretacao || '';
                v.spread.cor = v.spread.cor || (v.spread.spread > 0 ? 'emerald' : 'amber');
            }
        }

        // paresComparaveis: aceita `candidatos` no lugar de `tickers`
        if (v.paresComparaveis) {
            const pc = v.paresComparaveis;
            if (!pc.tickers && pc.candidatos) pc.tickers = pc.candidatos;
            // posicaoFundo: aceita {pvp, dy} ao invés de {pvpRanking, dyRanking}
            if (pc.posicaoFundo) {
                const pos = pc.posicaoFundo;
                const est = pc.estatisticas || {};
                if (!pos.pvpRanking && pos.pvp !== undefined && est.pvpMediano) {
                    const dif = ((pos.pvp - est.pvpMediano) / est.pvpMediano * 100).toFixed(1);
                    pos.pvpRanking = `${pos.pvp} (mediana pares ${est.pvpMediano}, dif ${dif >= 0 ? '+' : ''}${dif}%)`;
                }
                if (!pos.dyRanking && pos.dy !== undefined && est.dyMediano) {
                    const dif = ((pos.dy - est.dyMediano) / est.dyMediano * 100).toFixed(1);
                    pos.dyRanking = `${pos.dy}% (mediana pares ${est.dyMediano}%, dif ${dif >= 0 ? '+' : ''}${dif}%)`;
                }
            }
        }

        // precoJustoMercado: faixa pode vir como {min, max} em vez de array
        if (v.precoJustoMercado) {
            const pj = v.precoJustoMercado;
            if (pj.faixa && !Array.isArray(pj.faixa)) {
                pj.faixa = [pj.faixa.min, pj.faixa.max];
            }
            // componentes: aceita `valor` como `preco`
            if (Array.isArray(pj.componentes)) {
                pj.componentes.forEach(c => {
                    if (c.preco === undefined && c.valor !== undefined) c.preco = c.valor;
                });
                // se algum componente tem id A4 ou nome com "qualidade", extrair como fatorQualidade
                if (!pj.fatorQualidade) {
                    const idxA4 = pj.componentes.findIndex(c =>
                        c.id === 'A4' || (c.nome || '').toLowerCase().includes('qualidade'));
                    if (idxA4 >= 0) {
                        const a4 = pj.componentes[idxA4];
                        pj.fatorQualidade = {
                            valor: a4.preco != null ? a4.preco : a4.valor,
                            score: a4.score != null ? a4.score : null,
                            componentes: a4.componentes || [],
                            racional: a4.racional || a4.calculo || '',
                        };
                        pj.componentes = pj.componentes.filter((_, i) => i !== idxA4);
                    }
                }
            }
            // comparacaoComCotacao: derivar de upside ou cotação
            if (!pj.comparacaoComCotacao) {
                const ult = v.historicoPrecos?.ultimoFechamento ?? v.pvp?.cotacao;
                if (ult && pj.valor != null) {
                    const dif = (pj.valor - ult) / ult * 100;
                    pj.comparacaoComCotacao = {
                        cotacaoAtual: ult,
                        diferencaPct: dif,
                        leitura: dif > 5 ? 'subvalorizado vs preço justo'
                               : dif < -5 ? 'sobrevalorizado vs preço justo'
                               : 'próximo do preço justo'
                    };
                }
            }
            // explicacao pode estar em `racional`
            if (!pj.explicacao && pj.racional) pj.explicacao = pj.racional;
        }

        // expectativa: faixa pode vir como dict
        if (v.expectativa) {
            ['curto', 'medio', 'longo'].forEach(h => {
                const e = v.expectativa[h];
                if (e && e.faixa && !Array.isArray(e.faixa)) {
                    e.faixa = [e.faixa.min, e.faixa.max];
                }
            });
        }

        return v;
    },

    _renderValuationV2(v) {
        v = this._normalizeValuationV2(v);
        // Bloco 1 — gráficos históricos (preço, P/VP, VP/cota)
        const chartsHtml = `
            <div class="grid lg:grid-cols-3 gap-4 mb-8">
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-semibold text-slate-300">Preço da cota (não ajustado)</h3>
                        <span class="text-xs text-slate-500" id="val-preco-meta">—</span>
                    </div>
                    <div class="relative" style="height: 220px;">
                        <canvas id="val-chart-preco"></canvas>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Marcadores: emissões, reavaliações, eventos relevantes — clique para detalhes.</div>
                </div>
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-semibold text-slate-300">P/VP histórico</h3>
                        <span class="text-xs text-slate-500" id="val-pvp-meta">—</span>
                    </div>
                    <div class="relative" style="height: 220px;">
                        <canvas id="val-chart-pvp"></canvas>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Linha branca tracejada = média histórica do fundo. Linha amber = mediana do segmento.</div>
                </div>
                <div class="bg-white/5 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-semibold text-slate-300">Valor patrimonial (R$/cota)</h3>
                        <span class="text-xs text-slate-500" id="val-vp-meta">—</span>
                    </div>
                    <div class="relative" style="height: 220px;">
                        <canvas id="val-chart-vp"></canvas>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Marcadores azuis = emissão · verdes = reavaliação positiva · vermelhos = reavaliação negativa / venda c/ prejuízo.</div>
                </div>
            </div>
            <div id="val-event-detail" class="hidden bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8 text-sm text-slate-200"></div>
        `;

        // Bloco 2 — P/VP + Spread + Pares (mantém estrutura atual mas adiciona pares)
        const spreadColor = (v.spread && v.spread.cor) || 'emerald';
        let pvpDetalhesHtml = '';
        if (v.pvp.detalhes) {
            let det = '';
            v.pvp.detalhes.forEach(d => {
                const c = d.cor ? `text-${d.cor}-400` : 'text-white';
                det += `<div class="p-2 bg-white/5 rounded"><div class="text-xs text-slate-500">${d.label}</div><div class="font-bold ${c}">${d.valor}</div></div>`;
            });
            pvpDetalhesHtml = `<div class="grid grid-cols-2 gap-2 mt-4">${det}</div>`;
        }

        let paresHtml = '';
        if (v.paresComparaveis) {
            const pc = v.paresComparaveis;
            const est = pc.estatisticas || {};
            const pos = pc.posicaoFundo || {};
            const status = pc.statusClassificacao || 'validado';
            const statusBadge = status === 'proposto'
                ? '<span class="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded ml-2">classificação proposta</span>'
                : '';
            const tickersList = (pc.tickers || []).map(t => `<span class="text-xs bg-white/10 px-2 py-0.5 rounded">${t}</span>`).join(' ');
            paresHtml = `
                <div class="bg-white/5 rounded-xl p-6">
                    <div class="flex items-center mb-3">
                        <h3 class="text-base font-semibold text-white">Posição vs pares</h3>
                        ${statusBadge}
                    </div>
                    <div class="text-xs text-slate-400 mb-2">${pc.subsegmento || '—'} · ${pc.criterioAgrupamento || ''}</div>
                    <div class="flex flex-wrap gap-1 mb-3">${tickersList}</div>
                    <div class="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div class="p-2 bg-white/5 rounded"><div class="text-xs text-slate-500">P/VP mediano pares</div><div class="font-bold">${est.pvpMediano ?? '—'}</div><div class="text-[10px] text-slate-500">min ${est.pvpMin ?? '—'} · max ${est.pvpMax ?? '—'}</div></div>
                        <div class="p-2 bg-white/5 rounded"><div class="text-xs text-slate-500">DY mediano pares</div><div class="font-bold">${est.dyMediano ?? '—'}%</div><div class="text-[10px] text-slate-500">min ${est.dyMin ?? '—'}% · max ${est.dyMax ?? '—'}%</div></div>
                    </div>
                    <div class="grid grid-cols-1 gap-2 text-sm">
                        <div class="p-2 bg-white/5 rounded"><div class="text-xs text-slate-500">P/VP do fundo</div><div class="font-medium text-slate-300">${pos.pvpRanking || '—'}</div></div>
                        <div class="p-2 bg-white/5 rounded"><div class="text-xs text-slate-500">DY do fundo</div><div class="font-medium text-slate-300">${pos.dyRanking || '—'}</div></div>
                    </div>
                    ${pos.leitura ? `<div class="mt-3 text-sm text-slate-300">${pos.leitura}</div>` : ''}
                </div>
            `;
        }

        const blocoPvpSpread = `
            <div class="grid lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-white/5 rounded-xl p-6 text-center">
                    <div class="text-5xl font-bold text-white mb-2">${v.pvp.valor}</div>
                    <div class="text-slate-400 mb-4">P/VP atual</div>
                    <p class="text-sm text-slate-400">${v.pvp.descricao || ''}</p>
                    ${pvpDetalhesHtml}
                </div>
                <div class="bg-white/5 rounded-xl p-6 text-center">
                    <div class="text-5xl font-bold text-${spreadColor}-400 mb-2">${v.spread?.valor || '—'}</div>
                    <div class="text-slate-400 mb-4">${v.spread?.label || 'Spread'}</div>
                    <p class="text-sm text-slate-400">${v.spread?.descricao || ''}</p>
                    ${v.spread?.detalhe ? `<div class="mt-4 p-3 bg-${spreadColor}-500/10 rounded-lg"><div class="text-xs text-slate-400">${v.spread.detalhe}</div></div>` : ''}
                </div>
                ${paresHtml}
            </div>
        `;

        // Bloco 3 — Preço justo de mercado
        let precoJustoHtml = '';
        if (v.precoJustoMercado) {
            const pj = v.precoJustoMercado;
            const cmp = pj.comparacaoComCotacao || {};
            const dif = cmp.diferencaPct;
            const corDif = dif === undefined || dif === null ? 'slate' : (dif > 5 ? 'emerald' : (dif < -5 ? 'red' : 'amber'));
            const sinalDif = dif === undefined || dif === null ? '' : (dif >= 0 ? '+' : '');
            const componentes = (pj.componentes || []).map(c => `
                <div class="bg-white/5 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-semibold text-slate-300">${c.nome}</span>
                        <span class="text-[10px] text-slate-500">peso ${(c.peso * 100).toFixed(0)}%</span>
                    </div>
                    <div class="text-xl font-bold text-white">R$ ${typeof c.preco === 'number' ? c.preco.toFixed(2) : c.preco}</div>
                    <div class="text-[11px] text-slate-500 mt-1">${c.calculo || ''}</div>
                    ${c.racional ? `<div class="text-[11px] text-slate-400 mt-1">${c.racional}</div>` : ''}
                </div>
            `).join('');

            const fq = pj.fatorQualidade || null;
            const fqHtml = fq ? `
                <details class="mt-4 bg-white/5 rounded-lg p-3">
                    <summary class="cursor-pointer text-sm font-semibold text-slate-300">Fator qualidade: ${fq.valor} (score ${fq.score})</summary>
                    <div class="mt-3 grid sm:grid-cols-2 gap-2">
                        ${(fq.componentes || []).map(fc => `
                            <div class="p-2 bg-white/5 rounded text-xs">
                                <div class="flex justify-between"><span class="text-slate-400">${fc.nome}</span><span class="text-slate-500">peso ${(fc.peso * 100).toFixed(0)}%</span></div>
                                <div class="font-bold text-slate-200">score ${fc.score}</div>
                                <div class="text-slate-400 mt-1">${fc.racional || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </details>
            ` : '';

            precoJustoHtml = `
                <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
                    <div class="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                        <h3 class="text-lg font-bold text-white">Preço justo de mercado</h3>
                        <span class="text-xs text-slate-400">${v.dataAnalise || ''}</span>
                    </div>
                    <div class="grid md:grid-cols-3 gap-4 mb-5">
                        <div class="text-center md:col-span-1">
                            <div class="text-5xl font-bold text-white">R$ ${typeof pj.valor === 'number' ? pj.valor.toFixed(2) : pj.valor}</div>
                            <div class="text-xs text-slate-400 mt-1">Faixa: R$ ${pj.faixa?.[0]?.toFixed(2) ?? '—'} – R$ ${pj.faixa?.[1]?.toFixed(2) ?? '—'}</div>
                        </div>
                        <div class="md:col-span-2 grid grid-cols-2 gap-2 text-sm">
                            <div class="p-3 bg-white/5 rounded-lg">
                                <div class="text-xs text-slate-500">Cotação atual</div>
                                <div class="text-xl font-bold text-slate-200">R$ ${typeof cmp.cotacaoAtual === 'number' ? cmp.cotacaoAtual.toFixed(2) : (cmp.cotacaoAtual ?? '—')}</div>
                            </div>
                            <div class="p-3 bg-white/5 rounded-lg">
                                <div class="text-xs text-slate-500">Diferença</div>
                                <div class="text-xl font-bold text-${corDif}-400">${dif === null || dif === undefined ? '—' : sinalDif + dif.toFixed(1) + '%'}</div>
                                <div class="text-[10px] text-slate-500 mt-1">${cmp.leitura || ''}</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        ${componentes}
                    </div>
                    ${fqHtml}
                    ${pj.explicacao ? `<div class="mt-4 text-sm text-slate-300">${pj.explicacao}</div>` : ''}
                </div>
            `;
        }

        // Bloco 4 — Expectativas C/M/L
        let expectativaHtml = '';
        if (v.expectativa) {
            const dirCor = (d) => ({
                queda_forte: 'red', queda: 'red', lateral_baixa: 'amber', lateral: 'slate',
                lateral_alta: 'emerald', alta: 'emerald', alta_forte: 'emerald', indefinido: 'slate',
            })[d] || 'slate';
            const dirIcon = (d) => ({
                queda_forte: '↓↓', queda: '↓', lateral_baixa: '↘', lateral: '→',
                lateral_alta: '↗', alta: '↑', alta_forte: '↑↑', indefinido: '?',
            })[d] || '·';

            const card = (h, label) => {
                if (!h) return '';
                const cor = dirCor(h.direcao);
                const icon = dirIcon(h.direcao);
                const cats = (h.catalisadores || []).map(c => `
                    <li class="text-xs text-slate-300 mb-1.5">
                        <span class="text-slate-500">${c.data || ''}</span>
                        <span class="text-${cor}-300 mx-1">${c.evento || ''}</span>
                        ${c.impactoEsperado ? `<span class="text-slate-400">— ${c.impactoEsperado}</span>` : ''}
                        ${c.fonte ? `<span class="text-[10px] text-slate-500 block">fonte: ${c.fonte}</span>` : ''}
                    </li>
                `).join('');
                return `
                    <div class="bg-white/5 rounded-xl p-5 border-l-4 border-${cor}-500/60">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs uppercase tracking-wider text-slate-400">${label}</span>
                            <span class="text-2xl font-bold text-${cor}-400">${icon}</span>
                        </div>
                        <div class="text-xs text-slate-500 mb-3">${h.horizonte || ''}</div>
                        <div class="text-3xl font-bold text-white mb-1">${typeof h.precoEsperado === 'number' ? `R$ ${h.precoEsperado.toFixed(2)}` : '—'}</div>
                        <div class="text-xs text-slate-500 mb-4">faixa ${h.faixa ? `R$ ${h.faixa[0]?.toFixed?.(2)} – R$ ${h.faixa[1]?.toFixed?.(2)}` : '—'}</div>
                        ${cats ? `<div class="mb-3"><div class="text-xs font-semibold text-slate-400 mb-2">Catalisadores</div><ul>${cats}</ul></div>` : ''}
                        ${h.racional ? `<div class="text-sm text-slate-300">${h.racional}</div>` : ''}
                    </div>
                `;
            };

            expectativaHtml = `
                <div class="mb-2">
                    <h3 class="text-lg font-bold text-white mb-1">Expectativa de preço</h3>
                    <div class="text-xs text-slate-500 mb-4">Projeções com catalisadores documentados — não vibe macro genérica.</div>
                    <div class="grid md:grid-cols-3 gap-4">
                        ${card(v.expectativa.curto, 'Curto prazo')}
                        ${card(v.expectativa.medio, 'Médio prazo')}
                        ${card(v.expectativa.longo, 'Longo prazo')}
                    </div>
                </div>
            `;
        }

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Valuation e Comparativos</h2>
                ${chartsHtml}
                ${blocoPvpSpread}
                ${precoJustoHtml}
                ${expectativaHtml}
            </div>
        </section>`;
    },

    // Renderização dos 3 charts da aba Valuation v2 (chamado de initCharts)
    async _renderValuationCharts() {
        const v = this.data.valuation;
        if (!v || v.schema !== 'v2') return;

        const ticker = (this.data.meta?.ticker || '').toLowerCase();
        const baseCsv = (csvPath) => {
            // O HTML está em fiis/{ticker}/, então sobe duas pastas para chegar ao root
            return `../../${csvPath}`;
        };

        const fetchCsv = async (path) => {
            try {
                const r = await fetch(path);
                if (!r.ok) return null;
                const txt = await r.text();
                const [head, ...lines] = txt.trim().split('\n');
                const cols = head.split(',');
                return lines.map(l => {
                    const vals = l.split(',');
                    const obj = {};
                    cols.forEach((c, i) => { obj[c] = vals[i]; });
                    return obj;
                });
            } catch (e) { console.warn('[val] csv falhou', path, e); return null; }
        };

        // ── Preço histórico ──
        const precoMeta = v.historicoPrecos?.meta || v.historicoPrecos || null;
        let precoRows = null;
        if (v.historicoPrecos?.csvPath) {
            precoRows = await fetchCsv(baseCsv(v.historicoPrecos.csvPath));
        }
        if (precoRows && precoRows.length) {
            const labels = precoRows.map(r => r.data);
            const vals = precoRows.map(r => parseFloat(r.fechamento));
            const eventos = (v.eventosValuation || []).filter(e => e.data);
            const eventoData = labels.map((d, i) => {
                const ev = eventos.find(e => e.data && d.startsWith(e.data.substring(0, 7)));
                return ev ? vals[i] : null;
            });
            const corEv = (tipo) => ({
                emissao: '#3b82f6', reavaliacao_positiva: '#10b981',
                reavaliacao_negativa: '#ef4444', venda_relevante: '#f59e0b',
                aquisicao_relevante: '#8b5cf6', mudanca_gestor: '#ec4899',
                evento_credito: '#dc2626', amortizacao_extraordinaria: '#06b6d4',
            })[tipo] || '#94a3b8';
            const eventoCores = labels.map(d => {
                const ev = eventos.find(e => e.data && d.startsWith(e.data.substring(0, 7)));
                return ev ? corEv(ev.tipo) : 'transparent';
            });
            const canvas = document.getElementById('val-chart-preco');
            if (canvas && window.Chart) {
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Fechamento', data: vals, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.2 },
                            { label: 'Eventos', data: eventoData, borderColor: 'transparent', backgroundColor: eventoCores, pointRadius: 7, pointHoverRadius: 10, pointBorderWidth: 2, pointBorderColor: '#fff', showLine: false }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    afterLabel: (ctx) => {
                                        if (ctx.datasetIndex !== 1) return '';
                                        const ev = eventos.find(e => e.data && labels[ctx.dataIndex].startsWith(e.data.substring(0, 7)));
                                        return ev ? `${ev.tipo}: ${ev.titulo}` : '';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                            y: { ticks: { color: '#94a3b8', callback: v => 'R$ ' + v.toFixed(0) }, grid: { color: 'rgba(255,255,255,0.06)' } }
                        },
                        onClick: (evt, items) => {
                            if (!items.length) return;
                            const idx = items[0].index;
                            const ev = eventos.find(e => e.data && labels[idx].startsWith(e.data.substring(0, 7)));
                            this._mostrarDetalheEvento(ev);
                        }
                    }
                });
            }
            const meta = document.getElementById('val-preco-meta');
            if (meta && precoMeta) meta.textContent = `${precoMeta.dataInicio || labels[0]} → ${precoMeta.dataFim || labels.at(-1)} · ${precoRows.length} pts`;
        }

        // ── VP histórico ──
        let vpRows = null;
        if (v.historicoVp?.csvPath) {
            vpRows = await fetchCsv(baseCsv(v.historicoVp.csvPath));
        }
        if (vpRows && vpRows.length) {
            const labels = vpRows.map(r => r.data);
            const vals = vpRows.map(r => parseFloat(r.vp_cota));
            const eventos = (v.eventosValuation || []).filter(e => e.data);
            const corEv = (tipo) => ({
                emissao: '#3b82f6', reavaliacao_positiva: '#10b981',
                reavaliacao_negativa: '#ef4444', venda_relevante: '#f59e0b',
            })[tipo] || '#94a3b8';
            const evtVp = labels.map((d, i) => {
                const ev = eventos.find(e => e.data && d.startsWith(e.data.substring(0, 7)));
                return ev ? vals[i] : null;
            });
            const evtCores = labels.map(d => {
                const ev = eventos.find(e => e.data && d.startsWith(e.data.substring(0, 7)));
                return ev ? corEv(ev.tipo) : 'transparent';
            });
            const canvas = document.getElementById('val-chart-vp');
            if (canvas && window.Chart) {
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            { label: 'VP/cota', data: vals, borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)', fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.2 },
                            { label: 'Eventos', data: evtVp, borderColor: 'transparent', backgroundColor: evtCores, pointRadius: 7, pointHoverRadius: 10, pointBorderWidth: 2, pointBorderColor: '#fff', showLine: false }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    afterLabel: (ctx) => {
                                        if (ctx.datasetIndex !== 1) return '';
                                        const ev = eventos.find(e => e.data && labels[ctx.dataIndex].startsWith(e.data.substring(0, 7)));
                                        return ev ? `${ev.tipo}: ${ev.titulo}` : '';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                            y: { ticks: { color: '#94a3b8', callback: v => 'R$ ' + v.toFixed(0) }, grid: { color: 'rgba(255,255,255,0.06)' } }
                        },
                        onClick: (evt, items) => {
                            if (!items.length) return;
                            const idx = items[0].index;
                            const ev = eventos.find(e => e.data && labels[idx].startsWith(e.data.substring(0, 7)));
                            this._mostrarDetalheEvento(ev);
                        }
                    }
                });
            }
            const meta = document.getElementById('val-vp-meta');
            if (meta) meta.textContent = `${labels[0]} → ${labels.at(-1)} · ${vpRows.length} pts`;
        }

        // ── P/VP histórico (derivado) ──
        if (precoRows && vpRows && precoRows.length && vpRows.length) {
            const vpByMes = {};
            vpRows.forEach(r => { vpByMes[r.data] = parseFloat(r.vp_cota); });
            const vpDatas = Object.keys(vpByMes).sort();
            const vpDoMes = (data) => {
                const mes = data.substring(0, 7);
                if (vpByMes[mes]) return vpByMes[mes];
                let candidato = null;
                for (const d of vpDatas) { if (d <= mes) candidato = vpByMes[d]; else break; }
                return candidato;
            };
            const labels = precoRows.map(r => r.data);
            const pvpVals = precoRows.map(r => {
                const vp = vpDoMes(r.data);
                if (!vp) return null;
                return parseFloat(r.fechamento) / vp;
            });
            const validos = pvpVals.filter(x => x !== null);
            const pvpMedio = validos.length ? validos.reduce((s, x) => s + x, 0) / validos.length : null;
            const pares = v.paresComparaveis?.estatisticas?.pvpMediano || null;

            const canvas = document.getElementById('val-chart-pvp');
            if (canvas && window.Chart) {
                const datasets = [
                    { label: 'P/VP', data: pvpVals, borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.2 }
                ];
                if (pvpMedio) datasets.push({ label: `Média histórica ${pvpMedio.toFixed(2)}`, data: labels.map(_ => pvpMedio), borderColor: 'rgba(255,255,255,0.4)', borderDash: [4, 4], pointRadius: 0, borderWidth: 1 });
                if (pares) datasets.push({ label: `Pares ${pares.toFixed(2)}`, data: labels.map(_ => pares), borderColor: 'rgba(245,158,11,0.6)', borderDash: [2, 4], pointRadius: 0, borderWidth: 1 });
                new Chart(canvas, {
                    type: 'line',
                    data: { labels, datasets },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 10 } } },
                        scales: {
                            x: { ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                            y: { ticks: { color: '#94a3b8', callback: v => v.toFixed(2) }, grid: { color: 'rgba(255,255,255,0.06)' } }
                        }
                    }
                });
            }
            const metaEl = document.getElementById('val-pvp-meta');
            if (metaEl && pvpMedio) metaEl.textContent = `média ${pvpMedio.toFixed(2)}`;
        }
    },

    _mostrarDetalheEvento(ev) {
        const box = document.getElementById('val-event-detail');
        if (!box) return;
        if (!ev) { box.classList.add('hidden'); return; }
        box.classList.remove('hidden');
        const fonte = ev.fonte ? `<div class="text-xs text-slate-500 mt-2">${ev.fonte}</div>` : '';
        const impVp = ev.impactoVp != null ? `<span class="ml-2 text-xs text-amber-300">ΔVP ${ev.impactoVp >= 0 ? '+' : ''}${ev.impactoVp}</span>` : '';
        box.innerHTML = `
            <div class="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <div>
                    <span class="text-xs text-slate-400">${ev.data}</span>
                    <span class="text-xs uppercase tracking-wider text-blue-300 ml-2">${ev.tipo || ''}</span>
                    ${impVp}
                </div>
            </div>
            <div class="text-base font-semibold text-white mb-1">${ev.titulo || ''}</div>
            ${ev.descricao ? `<div class="text-sm text-slate-300">${ev.descricao}</div>` : ''}
            ${fonte}
        `;
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

        // Dividendos Chart — suporta v2 (historico longo) + v1 (chartData curto)
        if (d.dividendos) {
            this._renderDividendosCharts();
            this._renderGuidanceChart();
            this._wireDividendosControls();
        }

        // Valuation v2 — gráficos históricos (preço, P/VP, VP) com markers de eventos
        if (d.valuation && d.valuation.schema === 'v2') {
            this._renderValuationCharts();
        }

        // Visão Geral — gráfico de preço com timeline de TODOS os eventos
        this._initVisaoGeralPriceChart();

        // Portfólio FoF — VP em tempo real (busca preços dos pares e calcula client-side)
        if (d.portfolio && d.portfolio.tipoFundo === 'fof') {
            this._initFofVpLive();
        }
    },

    _renderDividendosCharts(rangeId, groupId) {
        const div = this.data.dividendos;
        if (!div) return;
        const hasHist = Array.isArray(div.historico) && div.historico.length > 0;

        // Determina range/group ativos
        let group = groupId;
        if (!group) {
            const activeGroup = document.querySelector('.divid-v2-group-btn.is-active');
            group = activeGroup ? activeGroup.dataset.group : 'mes';
        }
        let range = rangeId;
        if (!range) {
            const activeBtn = document.querySelector('.divid-v2-range-btn.is-active');
            range = activeBtn ? activeBtn.dataset.range : (hasHist && div.historico.length >= 25 ? 'ipo' : '12m');
        }
        // Por ano: 12m e 24m não fazem sentido — força para ipo se range invalido
        if (group === 'ano' && (range === '12m' || range === '24m')) {
            range = (hasHist && div.historico.length >= 25) ? 'ipo' : '60m';
        }

        // Atualiza legenda do dividendo conforme agrupamento (caixa rotulo nao muda)
        const titDiv = document.querySelector('[data-chart-title="dividendos"]');
        if (titDiv) titDiv.textContent = group === 'ano' ? 'Dividendo anual (R$/cota)' : 'Dividendo (R$/cota)';

        // Seleciona subset do historico
        let labels, divData, caixaData;
        if (hasHist) {
            let items = div.historico.slice();
            items.sort((a, b) => String(a.data).localeCompare(String(b.data)));
            if (range === '12m') items = items.slice(-12);
            else if (range === '24m') items = items.slice(-24);
            else if (range === '60m') items = items.slice(-60);

            if (group === 'ano') {
                // Agrupa por ano: dividendo = soma; caixaAcumulado = ultimo do ano
                const porAno = new Map();
                items.forEach(h => {
                    const ano = String(h.data || '').slice(0, 4);
                    if (!ano) return;
                    if (!porAno.has(ano)) porAno.set(ano, { soma: 0, count: 0, ultimoCaixa: null });
                    const r = porAno.get(ano);
                    if (h.dividendo !== undefined && h.dividendo !== null) {
                        r.soma += Number(h.dividendo);
                        r.count++;
                    }
                    if (h.caixaAcumulado !== undefined && h.caixaAcumulado !== null) {
                        r.ultimoCaixa = Number(h.caixaAcumulado);
                    }
                });
                const anos = Array.from(porAno.keys()).sort();
                labels = anos;
                divData = anos.map(a => porAno.get(a).count > 0 ? Math.round(porAno.get(a).soma * 100) / 100 : null);
                caixaData = anos.map(a => porAno.get(a).ultimoCaixa);
            } else {
                labels = items.map(h => this._formatMesAbbr(h.data));
                divData = items.map(h => (h.dividendo !== undefined ? Number(h.dividendo) : null));
                caixaData = items.map(h => (h.caixaAcumulado !== undefined ? Number(h.caixaAcumulado) : null));
            }
        } else {
            labels = div.chartLabels || [];
            divData = div.chartData || [];
            caixaData = null;
        }

        // Destroi charts anteriores
        ['dividendosChart','caixaChart'].forEach(id => {
            if (this._charts && this._charts[id]) { try { this._charts[id].destroy(); } catch(e){} }
        });
        this._charts = this._charts || {};

        // ── Gráfico 1: Dividendo (barras) ─────────────────────────
        const divCanvas = document.getElementById('dividendosChart');
        if (divCanvas) {
            const maxD = Math.max(...divData.filter(v => v !== null && !isNaN(v)), 0);
            const minD = Math.min(...divData.filter(v => v !== null && !isNaN(v)), maxD);
            const yMax = Math.max(maxD * 1.25, 0.01);
            const yMin = Math.max(0, minD * 0.5);
            this._charts.dividendosChart = new Chart(divCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Dividendo (R$/cota)',
                        data: divData,
                        backgroundColor: 'rgba(16,185,129,0.65)',
                        borderColor: '#10b981',
                        borderRadius: 3,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { beginAtZero: true, min: yMin, max: yMax,
                             ticks: { color: '#9ca3af', callback: v => 'R$ ' + Number(v).toFixed(2).replace('.',',') },
                             grid:  { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#9ca3af', maxTicksLimit: 12, autoSkip: true }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => 'R$ ' + Number(ctx.parsed.y).toFixed(2).replace('.',',') } }
                    }
                }
            });
        }

        // ── Gráfico 2: Caixa líquido (barras, com forward-fill p/ meses sem dado) ──
        const caixaCanvas = document.getElementById('caixaChart');
        const hasCaixaPlot = caixaData && caixaData.some(v => v !== null && !isNaN(v));
        if (caixaCanvas && hasCaixaPlot) {
            // Forward-fill: meses sem dado herdam o último valor conhecido (e ficam marcados como "estimado")
            const caixaPlot = [];
            const isReal   = []; // true = dado oficial; false = repetido (fantasma)
            let ultimoConhecido = null;
            caixaData.forEach(v => {
                if (v !== null && v !== undefined && !isNaN(v)) {
                    ultimoConhecido = v;
                    caixaPlot.push(v);
                    isReal.push(true);
                } else if (ultimoConhecido !== null) {
                    caixaPlot.push(ultimoConhecido);
                    isReal.push(false);
                } else {
                    caixaPlot.push(0);
                    isReal.push(false);
                }
            });

            const fillReal     = 'rgba(167,139,250,0.65)';
            const borderReal   = '#a78bfa';
            const fillGhost    = 'rgba(167,139,250,0.12)';
            const borderGhost  = 'rgba(167,139,250,0.45)';

            this._charts.caixaChart = new Chart(caixaCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Caixa líquido (R$)',
                        data: caixaPlot,
                        backgroundColor: isReal.map(r => r ? fillReal : fillGhost),
                        borderColor:     isReal.map(r => r ? borderReal : borderGhost),
                        borderWidth:     isReal.map(r => r ? 1 : 1.5),
                        borderRadius: 3,
                        // metadata custom para o tooltip saber o tipo
                        _isReal: isReal
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { beginAtZero: true,
                             ticks: { color: 'rgba(167,139,250,0.7)', callback: (v) => this.formatMoney(v) },
                             grid:  { color: 'rgba(255,255,255,0.04)' } },
                        x: { ticks: { color: '#94a3b8', maxTicksLimit: 12, autoSkip: true }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const idx = ctx.dataIndex;
                                    const real = ctx.dataset._isReal && ctx.dataset._isReal[idx];
                                    const v = Number(ctx.parsed.y);
                                    return real
                                        ? 'Caixa: ' + this.formatMoney(v)
                                        : 'Sem informação';
                                }
                            }
                        }
                    }
                }
            });
        }
    },

    _buildGuidanceProjection(guidance, dividendos) {
        if (!guidance) return null;
        const N = 12; // sempre 12 meses

        // 1) Se o JSON traz projecao explicita, usa (suporta valor unico ou {min,max})
        if (Array.isArray(guidance.projecaoMensal) && guidance.projecaoMensal.length) {
            return guidance.projecaoMensal.slice(0, N).map(p => {
                const min = p.valorMin !== undefined ? Number(p.valorMin) : Number(p.valor);
                const max = p.valorMax !== undefined ? Number(p.valorMax) : Number(p.valor);
                return {
                    data: p.data,
                    valorMin: min,
                    valorMax: max,
                    certeza: p.certeza || 'projetado',
                    comentario: p.comentario || '',
                    impacto: p.impacto || 'neutro',
                    cobertaPorGestor: !!p.cobertaPorGestor
                };
            });
        }

        const hist = Array.isArray(dividendos.historico) ? dividendos.historico.slice() : [];
        hist.sort((a,b) => String(a.data).localeCompare(String(b.data)));
        const ultimo = hist.length ? hist[hist.length - 1] : null;
        const ultimoVal = ultimo && ultimo.dividendo !== undefined ? Number(ultimo.dividendo) : null;

        // BANDAS: parte da faixa do guidance. Se nao houver, deriva do ultimoDPS com simetria do status.
        const fMin = guidance.faixaMin !== undefined ? Number(guidance.faixaMin) : null;
        const fMax = guidance.faixaMax !== undefined ? Number(guidance.faixaMax) : null;
        let baseMin, baseMax;
        if (fMin !== null && fMax !== null) {
            baseMin = fMin; baseMax = fMax;
        } else if (ultimoVal !== null) {
            baseMin = ultimoVal * 0.97;
            baseMax = ultimoVal * 1.03;
        } else {
            return null;
        }

        // Eventos futuros: { data: { delta, duracaoMeses, impacto, certeza, titulo } }
        const eventos = Array.isArray(dividendos.eventosFuturos) ? dividendos.eventosFuturos : [];
        const evList = eventos.map(e => {
            if (!e || !e.data) return null;
            let impacto = e.severidade;
            if (!impacto) {
                const tipoNeg = /cashback_fim|amortizacao|vacancia|evento_credito|venda_em_analise/i.test(e.tipo || '');
                const tipoPos = /cashback_inicio|aumento_sustentavel|extraordinaria_historica|obra_entrega|contrato_revisional/i.test(e.tipo || '');
                impacto = tipoNeg ? 'negativo' : (tipoPos ? 'positivo' : 'neutro');
            }
            // delta numerico explicito (impactoValor) ou estimativa por severidade
            let delta = 0;
            if (e.impactoValor !== undefined && e.impactoValor !== null) {
                delta = Number(e.impactoValor);
            } else if (impacto === 'positivo' && fMax !== null) {
                delta = (fMax - ultimoVal) * 0.5; // metade do espaco para o teto
            } else if (impacto === 'negativo' && fMin !== null) {
                delta = (fMin - ultimoVal) * 0.5; // metade para o piso
            }
            return {
                data: e.data,
                delta: delta,
                duracaoMeses: e.duracaoMeses !== undefined ? e.duracaoMeses : null,
                impacto: impacto,
                certeza: e.certeza || 'projetado',
                titulo: e.titulo || ''
            };
        }).filter(Boolean);

        // Padrao sazonal: ajuste relativo por mes (1-12). Aplicado apenas levemente (50% do valor).
        const sazonal = (dividendos.padraoSazonal && dividendos.padraoSazonal.tem)
            ? dividendos.padraoSazonal.ajusteRelativoPorMes
            : null;

        // Cobertura do guidance do gestor
        const cobreMeses = guidance.fonte === 'gestor' && guidance.cobreMeses
            ? Number(guidance.cobreMeses)
            : 0;

        // Constroi linha do tempo dos proximos N meses
        const { y: sy, m: sm } = (() => {
            if (ultimo) {
                const [y, m] = ultimo.data.split('-').map(Number);
                const t = new Date(y, m, 1);
                return { y: t.getFullYear(), m: t.getMonth() + 1 };
            }
            const d = new Date();
            return { y: d.getFullYear(), m: d.getMonth() + 2 };
        })();

        // 3 séries por mês: min (linha inferior), max (linha superior), estimado (barra do meio)
        // - Eventos confirmados deslocam min, max E estimado
        // - Eventos projetados/possíveis alargam só o lado correspondente da banda;
        //   estimado fica no patamar do último DPS (cenário-base, não otimista)
        const out = [];
        let curMin = baseMin, curMax = baseMax;
        let curEstimado = ultimoVal !== null ? ultimoVal : (baseMin + baseMax) / 2;
        const efeitosMin = [], efeitosMax = [], efeitosEst = [];

        for (let i = 0; i < N; i++) {
            const t = new Date(sy, sm - 1 + i, 1);
            const key = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');

            const novosNoMes = evList.filter(e => e.data === key);
            novosNoMes.forEach(e => {
                const d = e.delta;
                if (!d) return;
                if (e.certeza === 'confirmado') {
                    curMin += d; curMax += d; curEstimado += d;
                    if (e.duracaoMeses && e.duracaoMeses > 0) {
                        efeitosMin.push({ delta: d, expiraEm: i + e.duracaoMeses });
                        efeitosMax.push({ delta: d, expiraEm: i + e.duracaoMeses });
                        efeitosEst.push({ delta: d, expiraEm: i + e.duracaoMeses });
                    }
                } else {
                    // Projetado/possível: alarga só a banda do lado correspondente
                    if (d > 0) {
                        curMax += d;
                        if (e.duracaoMeses && e.duracaoMeses > 0) efeitosMax.push({ delta: d, expiraEm: i + e.duracaoMeses });
                    } else {
                        curMin += d;
                        if (e.duracaoMeses && e.duracaoMeses > 0) efeitosMin.push({ delta: d, expiraEm: i + e.duracaoMeses });
                    }
                }
            });

            // Efeitos temporários expirando neste mês
            for (let k = efeitosMin.length - 1; k >= 0; k--) {
                if (efeitosMin[k].expiraEm === i) { curMin -= efeitosMin[k].delta; efeitosMin.splice(k, 1); }
            }
            for (let k = efeitosMax.length - 1; k >= 0; k--) {
                if (efeitosMax[k].expiraEm === i) { curMax -= efeitosMax[k].delta; efeitosMax.splice(k, 1); }
            }
            for (let k = efeitosEst.length - 1; k >= 0; k--) {
                if (efeitosEst[k].expiraEm === i) { curEstimado -= efeitosEst[k].delta; efeitosEst.splice(k, 1); }
            }

            // Sazonalidade (se ligada)
            const mesIdx = String(t.getMonth() + 1);
            let mn = curMin, mx = curMax, est = curEstimado;
            if (sazonal && sazonal[mesIdx] !== undefined) {
                const factor = 1 + Number(sazonal[mesIdx]) * 0.5;
                if (factor >= 1) mx = mx * factor; else mn = mn * factor;
                est = est * (1 + Number(sazonal[mesIdx]) * 0.25); // metade do ajuste no estimado
            }

            // Garante coerência: min ≤ estimado ≤ max
            if (mn > mx) { const tmp = mn; mn = mx; mx = tmp; }
            if (est < mn) est = mn;
            if (est > mx) est = mx;

            const evMes = novosNoMes[0] || null;
            out.push({
                data: key,
                valorMin: Math.round(mn * 100) / 100,
                valorMax: Math.round(mx * 100) / 100,
                valorEstimado: Math.round(est * 100) / 100,
                valorMedio: Math.round((mn + mx) / 2 * 100) / 100,
                certeza: evMes ? evMes.certeza : 'projetado',
                comentario: evMes ? evMes.titulo : '',
                impacto: evMes ? evMes.impacto : 'neutro',
                cobertaPorGestor: cobreMeses > 0 && i < cobreMeses
            });
        }
        return out;
    },

    _renderGuidanceChart() {
        const proj = this._guidanceProjection;
        if (!proj || !proj.length) return;
        const canvas = document.getElementById('guidanceChart');
        if (!canvas) return;
        if (this._charts && this._charts.guidanceChart) { try { this._charts.guidanceChart.destroy(); } catch(e){} }
        this._charts = this._charts || {};
        const labels = proj.map(p => this._formatMesAbbr(p.data));
        const dataMin = proj.map(p => Number(p.valorMin));
        const dataMax = proj.map(p => Number(p.valorMax));
        const dataMedio = proj.map(p => Number(p.valorMedio !== undefined ? p.valorMedio : (p.valorMin + p.valorMax) / 2));
        const dataEstimado = proj.map(p => Number(p.valorEstimado !== undefined ? p.valorEstimado : p.valorMedio));

        // Cor das barras por impacto do mês
        const palette = {
            positivo: { fill: 'rgba(16,185,129,0.65)', border: '#10b981' },
            negativo: { fill: 'rgba(239,68,68,0.65)',  border: '#ef4444' },
            neutro:   { fill: 'rgba(167,139,250,0.55)',border: '#a78bfa' }
        };
        const baseFill = 'rgba(167,139,250,0.45)';
        const cores = proj.map(p => p.comentario ? (palette[p.impacto] || palette.neutro).fill : baseFill);
        const borders = proj.map(p => {
            if (p.cobertaPorGestor) return '#22d3ee';
            return p.comentario ? (palette[p.impacto] || palette.neutro).border : 'rgba(167,139,250,0.5)';
        });

        // Y-axis adaptativo
        const yLow  = Math.min(...dataMin);
        const yHigh = Math.max(...dataMax);
        const margem = Math.max((yHigh - yLow) * 0.5, yHigh * 0.05, 0.005);
        const yMin = Math.max(0, yLow - margem);
        const yMaxDyn = yHigh + margem;

        const fmtR = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

        this._charts.guidanceChart = new Chart(canvas, {
            data: {
                labels: labels,
                datasets: [
                    // Linha superior: máximo
                    {
                        type: 'line',
                        label: 'Máximo da banda',
                        data: dataMax,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.06)',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#10b981',
                        fill: '+2',  // preenche até a linha mín (2 datasets adiante)
                        tension: 0.2,
                        order: 1
                    },
                    // Linha do meio: média (pontilhada)
                    {
                        type: 'line',
                        label: 'Média da banda',
                        data: dataMedio,
                        borderColor: 'rgba(255,255,255,0.5)',
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        pointHoverRadius: 3,
                        pointBackgroundColor: 'rgba(255,255,255,0.7)',
                        fill: false,
                        tension: 0.2,
                        order: 2
                    },
                    // Linha inferior: mínimo
                    {
                        type: 'line',
                        label: 'Mínimo da banda',
                        data: dataMin,
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#ef4444',
                        fill: false,
                        tension: 0.2,
                        order: 1
                    },
                    // Barras: estimativa central do mês (dentro da banda)
                    {
                        type: 'bar',
                        label: 'Estimativa do mês',
                        data: dataEstimado,
                        backgroundColor: cores,
                        borderColor: borders,
                        borderWidth: 1.5,
                        borderRadius: 4,
                        order: 3,
                        barPercentage: 0.55,
                        categoryPercentage: 0.85
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        min: yMin, max: yMaxDyn,
                        ticks: { color: '#9ca3af', callback: v => fmtR(v) },
                        grid:  { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const p = proj[ctx.dataIndex];
                                if (!p) return '';
                                if (ctx.dataset.label === 'Estimativa do mês') return 'Estimativa: ' + fmtR(p.valorEstimado);
                                if (ctx.dataset.label === 'Máximo da banda')   return 'Máximo: '    + fmtR(p.valorMax);
                                if (ctx.dataset.label === 'Mínimo da banda')   return 'Mínimo: '    + fmtR(p.valorMin);
                                if (ctx.dataset.label === 'Média da banda')    return 'Média: '     + fmtR(p.valorMedio);
                                return ctx.dataset.label + ': ' + fmtR(ctx.parsed.y);
                            },
                            afterBody: (items) => {
                                if (!items.length) return '';
                                const p = proj[items[0].dataIndex];
                                const lines = [];
                                if (p.cobertaPorGestor) lines.push('Coberto pelo guidance do gestor');
                                if (p.comentario) lines.push(p.comentario);
                                return lines;
                            }
                        }
                    }
                }
            }
        });
    },

    _formatMesAbbr(dataStr) {
        if (!dataStr) return '';
        const m = String(dataStr).match(/^(\d{4})-(\d{2})/);
        if (!m) return String(dataStr);
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        return meses[parseInt(m[2], 10) - 1] + '/' + m[1].slice(2);
    },

    _formatMesExtenso(dataStr) {
        if (!dataStr) return '';
        const m = String(dataStr).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
        if (!m) return String(dataStr);
        const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const mesNome = meses[parseInt(m[2], 10) - 1];
        if (m[3]) return `${m[3]} de ${mesNome} de ${m[1]}`;
        return `${mesNome} de ${m[1]}`;
    },

    _wireDividendosControls() {
        const updateRangeAvailability = () => {
            const activeGroup = document.querySelector('.divid-v2-group-btn.is-active');
            const group = activeGroup ? activeGroup.dataset.group : 'mes';
            document.querySelectorAll('.divid-v2-range-btn').forEach(b => {
                const range = b.dataset.range;
                const disabled = group === 'ano' && (range === '12m' || range === '24m');
                b.disabled = disabled;
                b.classList.toggle('is-disabled', disabled);
                if (disabled) b.classList.remove('is-active');
            });
            // Garante que ha um range ativo valido
            const ativo = document.querySelector('.divid-v2-range-btn.is-active:not(.is-disabled)');
            if (!ativo) {
                const fallback = document.querySelector('.divid-v2-range-btn[data-range="ipo"]:not(.is-disabled)')
                              || document.querySelector('.divid-v2-range-btn[data-range="60m"]:not(.is-disabled)')
                              || document.querySelector('.divid-v2-range-btn:not(.is-disabled)');
                if (fallback) fallback.classList.add('is-active');
            }
        };

        // Group picker (mes/ano)
        document.querySelectorAll('.divid-v2-group-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.divid-v2-group-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                updateRangeAvailability();
                const activeRange = document.querySelector('.divid-v2-range-btn.is-active');
                this._renderDividendosCharts(activeRange ? activeRange.dataset.range : null, btn.dataset.group);
            });
        });

        // Range picker
        document.querySelectorAll('.divid-v2-range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled || btn.classList.contains('is-disabled')) return;
                document.querySelectorAll('.divid-v2-range-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                const activeGroup = document.querySelector('.divid-v2-group-btn.is-active');
                this._renderDividendosCharts(btn.dataset.range, activeGroup ? activeGroup.dataset.group : 'mes');
            });
        });

        // Estado inicial
        updateRangeAvailability();
        // Timeline: scroll inicial centrado no marcador HOJE
        const tl = this._dividendosTimelineData;
        const details = document.getElementById('divid-v2-timeline-details');
        const scroller = document.querySelector('.divid-v2-tl-scroll');
        if (tl && scroller && tl.scrollToToday !== undefined) {
            const target = Math.max(0, tl.scrollToToday - (scroller.clientWidth / 2));
            scroller.scrollLeft = target;
        }

        // Helper: centraliza um dot no scroller com animação
        const centralizarDot = (dot, animado) => {
            if (!dot || !scroller) return;
            const dotLeft = parseFloat(dot.style.left || '0');
            const target = Math.max(0, dotLeft - (scroller.clientWidth / 2));
            scroller.scrollTo({ left: target, behavior: animado ? 'smooth' : 'auto' });
        };

        // Drag-to-scroll com mouse (cursor grab/grabbing) — somente quando arrasta no canvas vazio,
        // sem interferir no clique dos pontos.
        if (scroller && !scroller._dragWired) {
            scroller._dragWired = true;
            let isDown = false, startX = 0, startScroll = 0, moved = 0;
            const onDown = (ev) => {
                // Só ativa drag se clicou no fundo, NÃO em um botão
                if (ev.target.closest('.divid-v2-tl-dot')) return;
                if (ev.button !== undefined && ev.button !== 0) return;
                isDown = true; moved = 0;
                startX = ev.clientX;
                startScroll = scroller.scrollLeft;
            };
            const onMove = (ev) => {
                if (!isDown) return;
                const delta = ev.clientX - startX;
                if (Math.abs(delta) > 3) {
                    if (!moved) scroller.classList.add('is-dragging');
                    moved = Math.abs(delta);
                    scroller.scrollLeft = startScroll - delta;
                    ev.preventDefault();
                }
            };
            const onUp = () => {
                if (!isDown) return;
                isDown = false;
                scroller.classList.remove('is-dragging');
                // Reseta moved depois de um tick (após click event ter rodado)
                setTimeout(() => { moved = 0; }, 50);
            };
            scroller.addEventListener('mousedown', onDown);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        }

        if (!tl || !details) return;
        const dotsAll = document.querySelectorAll('.divid-v2-tl-dot');
        dotsAll.forEach(dot => {
            dot.addEventListener('click', () => {
                const kind = dot.dataset.kind;
                const idx = parseInt(dot.dataset.idx, 10);
                let e;
                if (kind === 'hoje')   e = tl.hoje;
                else if (kind === 'passado') e = tl.passados[idx];
                else                          e = tl.futuros[idx];
                if (!e) return;
                // Centraliza com animação suave
                centralizarDot(dot, true);
                const sevBadge = e.severidade
                    ? `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-${e.severidade === 'positivo' ? 'emerald' : e.severidade === 'negativo' ? 'red' : 'blue'}-500/20 text-${e.severidade === 'positivo' ? 'emerald' : e.severidade === 'negativo' ? 'red' : 'blue'}-400">${e.severidade}</span>`
                    : '';
                const certBadge = e.certeza
                    ? `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300">${e.certeza}</span>`
                    : '';
                const impacto = e.impactoDividendo || e.impactoEstimado || '';
                const fonte = e.fonte ? `<div class="text-xs text-slate-500 mt-2">Fonte: ${e.fonte}</div>` : '';
                const premissa = e.premissa ? `<div class="text-xs text-slate-400 mt-1"><strong>Premissa:</strong> ${e.premissa}</div>` : '';
                document.querySelectorAll('.divid-v2-tl-dot').forEach(d => d.classList.toggle('is-active', d === dot));
                const dataFmt = this._formatMesExtenso(e.data || '') || (e.data || '');
                details.innerHTML = `
                    <div class="divid-v2-evdetail-data">${dataFmt}</div>
                    <div class="divid-v2-evdetail-titulo">${e.titulo || ''}</div>
                    <div class="divid-v2-evdetail-tags">
                        ${sevBadge}${certBadge}
                    </div>
                    <div class="text-sm text-slate-300 mt-2">${e.descricao || ''}</div>
                    ${impacto ? `<div class="mt-2 text-sm"><strong class="text-amber-400">Impacto:</strong> ${impacto}</div>` : ''}
                    ${premissa}
                    ${fonte}
                `;
            });
        });

        // Ao carregar: simula click no HOJE → seleciona, mostra detalhes e centraliza (sem animação)
        const todayDot = document.querySelector('.divid-v2-tl-dot.kind-hoje');
        if (todayDot) {
            // Simula click mas sem animação (overrides a centralização animada)
            const orig = scroller && scroller.scrollTo ? scroller.scrollTo.bind(scroller) : null;
            // O click vai animar; substituímos para o load inicial ser instantâneo
            todayDot.click();
            // Garante que o scroll ficou centrado mesmo (caso o smooth não tenha rodado)
            if (scroller) {
                const dotLeft = parseFloat(todayDot.style.left || '0');
                scroller.scrollLeft = Math.max(0, dotLeft - (scroller.clientWidth / 2));
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
