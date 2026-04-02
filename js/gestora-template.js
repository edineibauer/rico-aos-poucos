/**
 * Gestora Template Engine for Rico aos Poucos
 * Reads a JSON data file and renders a complete gestora landing page.
 *
 * Usage:
 * 1. Include Tailwind CSS in your HTML <head>
 * 2. Add <div id="gestora-loading">...</div> and <div id="gestora-root"></div> in <body>
 * 3. Include this script and call: GestoraTemplate.init({ dataUrl: '../../data/gestores/SLUG.json' })
 */

const GestoraTemplate = {
    data: null,
    config: null,

    // Logo SVG from page-header.js
    logoSVG: `<svg viewBox="0 0 1024 1024" width="36" height="36">
      <defs><clipPath id="rc"><rect width="1024" height="1024" rx="205"/></clipPath></defs>
      <g clip-path="url(#rc)">
        <rect width="1024" height="1024" fill="#fdfdfd"/>
        <path d="M329.73 475.84C318.03 487.75 291.26 514.98 270.23 536.35L232 575.21V218.91l129.25.35c127.97.35 129.38.37 142.25 2.56 44.75 7.62 77.89 21.45 104.52 43.63 19.83 16.51 36.07 40.45 41.44 61.07l1.53 5.87-9.75 10.06c-5.36 5.53-29.55 30.3-53.75 55.05-24.21 24.75-48.25 49.39-53.42 54.75-5.18 5.36-9.91 9.75-10.51 9.75s-5.76-4.68-11.47-10.41l-10.38-10.41 5.36-2.71c16.69-8.46 27.74-21.74 32.49-39.04 2.49-9.07 3.04-29.21 1.06-38.93-4.86-23.89-21.8-40.39-47.62-46.39-16.32-3.79-26.87-4.26-85.51-3.77-30.79.25-56.1.5-56.24.56-.14.05-.25 32.32-.25 71.69v71.6zm438.27 271.66c0 .28-32.06.48-71.25.45l-71.25-.05-22.31-31.2c-12.27-17.16-31.31-43.7-42.31-58.99l-20-27.78 2.6-3.09c4.52-5.37 76.91-78.84 77.68-78.84 1.08 0 39.66 51.87 88.5 119 11 15.12 28.63 39.31 39.17 53.75s19.17 26.79 19.17 27.06zM356 687.92V748h-59c-32.45 0-59-.34-58.99-.75.01-.9 115.72-118.6 117.06-119.08.57-.21.93 23.06.93 59.75z" fill="rgb(32,58,87)"/>
        <path d="M298.21 658.25C261.73 694.96 231.8 725 231.69 725s-.19-27.65-.19-61.45v-61.44l16-16.26c8.8-8.96 50.21-51.0 92.03-93.35 41.82-42.36 79.13-80.27 82.92-84.26 3.78-3.99 7.25-7.25 7.72-7.25s10.62 9.34 22.59 20.75c11.96 11.41 32.71 31.06 46.11 43.66 23.13 21.77 24.46 22.85 26.49 21.5 2.26-1.49 29.72-29.31 97.15-98.41 22.54-23.1 48.53-49.65 57.76-58.99l16.79-17 -4.34-4c-2.39-2.2-14.67-13.41-27.28-24.92s-23.07-21.23-23.23-21.61c-.3-.72.32-.88 36.29-9.4 12.65-2.99 32.22-7.7 43.5-10.45s28.15-6.85 37.5-9.11c9.35-2.26 23.3-5.64 31-7.51 32.51-7.91 64.33-15.5 64.96-15.5.15 0-.54 3.94-1.54 8.75-4.91 23.62-11.24 53.92-15.42 73.75-2.54 12.1-6.61 31.67-9.03 43.5s-5.78 23.83-7.48 31.81c-1.7 7.98-4.34 20.47-5.88 27.76s-3.06 13.52-3.38 13.84c-.61.61-9.56-6.89-25.23-21.16-4.95-4.51-12.15-10.97-16-14.36l-7-6.17-3.91 4.29c-4.9 5.38-32.1 33.35-61.08 62.8-26.7 27.13-158.79 162.16-166.52 170.22l-5.49 5.72-21.5-20.59c-55.42-53.08-73.11-69.87-73.91-70.14-.47-.17-1.47.34-2.22 1.13-4.59 4.81-75.04 75.93-131.66 132.91z" fill="rgb(214,164,45)"/>
      </g>
    </svg>`,

    icons: {
        shield: '<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
        building: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
        chart: '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
        chevronRight: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>',
    },

    async init(config) {
        this.config = config;
        try {
            const resp = await fetch(config.dataUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            this.data = await resp.json();
            this.render();
        } catch (err) {
            console.error('GestoraTemplate: failed to load data', err);
            document.getElementById('gestora-loading').innerHTML =
                '<div style="text-align:center;padding:40px;color:#ef4444;">Erro ao carregar dados da gestora.</div>';
        }
    },

    render() {
        const d = this.data;
        const root = document.getElementById('gestora-root');
        const loading = document.getElementById('gestora-loading');

        let html = '';
        html += this.renderHeader();
        html += this.renderHero();
        html += this.renderQuickStats();
        html += '<main class="max-w-7xl mx-auto px-4 pb-16">';
        html += this.renderAvaliacao();
        html += this.renderFundos();
        html += this.renderConclusao();
        html += '</main>';
        html += this.renderFooter();

        root.innerHTML = html;
        root.style.display = 'block';
        if (loading) loading.style.display = 'none';
    },

    renderHeader() {
        return `
        <header class="app-header">
            <a href="../" class="header-back">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </a>
            <div class="app-logo">${this.logoSVG}</div>
            <div class="app-title-group">
                <h1 class="app-name">Rico aos Poucos</h1>
                <span class="app-subtitle">${this.data.nome}</span>
            </div>
        </header>`;
    },

    renderHero() {
        const d = this.data;
        const cor = this.badgeColor(d.avaliacao);
        const offset = Math.round(282.7 * (1 - d.nota / 10));

        return `
        <header class="hero-gradient text-white py-16 pb-32 relative z-10">
            <div class="max-w-7xl mx-auto px-4 relative z-10">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 flex-wrap">
                            <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight">${d.nome}</h1>
                            <span class="px-3 py-1.5 rounded-lg bg-${cor}-500/20 text-${cor}-400 text-sm font-semibold border border-${cor}-500/30">${d.notaLabel}</span>
                        </div>
                        <p class="text-xl text-blue-200 font-light">${d.totalFundos} ${d.totalFundos === 1 ? 'fundo' : 'fundos'} analisados</p>
                        <div class="flex flex-wrap gap-2">
                            ${d.segmentos.map(s => `<span class="px-2 py-1 bg-white/10 rounded text-xs text-blue-200">${s}</span>`).join('')}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="relative w-32 h-32">
                            <svg class="w-32 h-32 score-ring" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="8"/>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGradientGestora)" stroke-width="8"
                                        stroke-dasharray="282.7" stroke-dashoffset="${offset}" stroke-linecap="round"/>
                                <defs>
                                    <linearGradient id="scoreGradientGestora" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style="stop-color:#10b981"/>
                                        <stop offset="100%" style="stop-color:#3b82f6"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-4xl font-extrabold text-white">${d.nota}</span>
                                <span class="text-sm text-slate-400">/10</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>`;
    },

    renderQuickStats() {
        const d = this.data;
        const cor = this.badgeColor(d.avaliacao);

        // Calc avg DY and avg P/VP
        const dys = d.fundos.map(f => f.dividendYield).filter(v => v && v > 0);
        const avgDY = dys.length ? (dys.reduce((a, b) => a + b, 0) / dys.length).toFixed(1) : 'N/A';

        const pvps = d.fundos.map(f => f.pvp).filter(v => v && v > 0);
        const avgPVP = pvps.length ? (pvps.reduce((a, b) => a + b, 0) / pvps.length).toFixed(2) : 'N/A';

        return `
        <section class="max-w-7xl mx-auto px-4 -mt-20 relative z-20 mb-12">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="stat-card rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            ${this.icons.building}
                        </div>
                        <span class="text-sm text-slate-400 font-medium">Fundos Geridos</span>
                    </div>
                    <div class="text-3xl font-bold text-white">${d.totalFundos}</div>
                    <div class="text-xs text-slate-500 mt-1">${d.fundos.map(f => f.ticker).join(', ')}</div>
                </div>

                <div class="stat-card rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <span class="text-sm text-slate-400 font-medium">DY Médio</span>
                    </div>
                    <div class="text-3xl font-bold text-emerald-400">${avgDY}%</div>
                    <div class="text-xs text-slate-500 mt-1">Dividend Yield médio</div>
                </div>

                <div class="stat-card rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            ${this.icons.chart}
                        </div>
                        <span class="text-sm text-slate-400 font-medium">P/VP Médio</span>
                    </div>
                    <div class="text-3xl font-bold text-white">${avgPVP}</div>
                    <div class="text-xs text-slate-500 mt-1">Preço / Valor Patrimonial</div>
                </div>
            </div>
        </section>`;
    },

    renderAvaliacao() {
        const d = this.data;
        const cor = this.badgeColor(d.avaliacao);

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${cor}-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-${cor}-500/20 flex items-center justify-center">
                            ${this.icons.shield}
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-white">Avaliação da Gestora</h2>
                            <p class="text-${cor}-400 text-sm font-semibold">${d.notaLabel} - Nota ${d.nota}/10</p>
                        </div>
                    </div>
                    <p class="text-slate-300 text-lg leading-relaxed">
                        ${d.resumo}
                    </p>
                </div>
            </div>
        </section>`;
    },

    renderFundos() {
        const d = this.data;
        if (!d.fundos || d.fundos.length === 0) return '';

        let cardsHtml = d.fundos.map(f => {
            const cor = this.badgeColor(this.avaliacaoFromNota(f.nota));
            const sentimentoCor = f.sentimento === 'otimista' ? 'emerald'
                : f.sentimento === 'pessimista' ? 'red'
                : 'slate';
            const sentimentoLabel = f.sentimento === 'otimista' ? 'Otimista'
                : f.sentimento === 'pessimista' ? 'Pessimista'
                : f.sentimento === 'cauteloso' ? 'Cauteloso'
                : 'Neutro';

            return `
                <a href="../../fiis/${f.ticker.toLowerCase()}/" class="block bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-${cor}-500/50 transition-colors">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white mb-1">${f.ticker}</h3>
                            <p class="text-slate-400 text-sm">${f.nome}</p>
                            <p class="text-slate-500 text-xs mt-1">${f.segmento}</p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <span class="px-3 py-1 rounded-lg bg-${cor}-500/20 text-${cor}-400 text-sm font-semibold border border-${cor}-500/30">${f.notaLabel}</span>
                            <span class="text-xl font-bold text-${cor}-400">${f.nota}/10</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-lg font-bold text-emerald-400">${f.dividendYield ? f.dividendYield + '%' : 'N/A'}</div>
                            <div class="text-xs text-slate-500">DY</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-white">${f.pvp || 'N/A'}</div>
                            <div class="text-xs text-slate-500">P/VP</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-${sentimentoCor}-400">${sentimentoLabel}</div>
                            <div class="text-xs text-slate-500">Sentimento</div>
                        </div>
                    </div>

                    <div class="text-blue-400 text-sm font-medium flex items-center gap-1">
                        Ver análise completa
                        ${this.icons.chevronRight}
                    </div>
                </a>`;
        }).join('');

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Fundos Geridos (${d.totalFundos})</h2>
                <div class="grid md:grid-cols-2 gap-4">
                    ${cardsHtml}
                </div>
            </div>
        </section>`;
    },

    renderConclusao() {
        const d = this.data;
        const cor = this.badgeColor(d.avaliacao);

        const conclusaoTexts = {
            excelente: `A ${d.nome} demonstra <strong class="text-emerald-400">excelência na gestão</strong> de seus fundos imobiliários. Com nota média de ${d.nota}/10, é uma gestora que merece atenção dos investidores.`,
            bom: `A ${d.nome} apresenta uma <strong class="text-blue-400">boa gestão</strong> de seus fundos imobiliários. Com nota média de ${d.nota}/10, demonstra competência e consistência.`,
            regular: `A ${d.nome} possui uma gestão <strong class="text-amber-400">regular</strong> de seus fundos imobiliários. Com nota média de ${d.nota}/10, há pontos de melhoria a serem considerados.`,
            ruim: `A ${d.nome} apresenta uma gestão <strong class="text-red-400">abaixo da média</strong> em seus fundos imobiliários. Com nota média de ${d.nota}/10, é necessário cautela ao investir.`
        };

        return `
        <section class="mb-12 fade-in">
            <div class="dark-card rounded-3xl p-8">
                <h2 class="text-2xl font-bold text-white mb-6">Conclusão</h2>
                <div class="bg-${cor}-900/20 rounded-xl p-5 border border-${cor}-500/30">
                    <p class="text-slate-300">
                        ${conclusaoTexts[d.avaliacao] || conclusaoTexts.regular}
                    </p>
                </div>
            </div>
        </section>`;
    },

    renderFooter() {
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
        <footer class="border-t border-white/10 py-8 px-4 text-center">
            <p class="text-slate-400 text-sm mb-2">Dados agregados em ${today}</p>
            <p class="text-slate-500 text-xs">
                Este material tem caráter exclusivamente informativo e não constitui recomendação de investimento.
            </p>
        </footer>`;
    },

    // Helpers
    badgeColor(av) {
        const map = { excelente: 'emerald', bom: 'blue', regular: 'amber', ruim: 'red' };
        return map[av] || 'slate';
    },

    avaliacaoFromNota(nota) {
        if (nota >= 8) return 'excelente';
        if (nota >= 6) return 'bom';
        if (nota >= 4) return 'regular';
        return 'ruim';
    }
};
