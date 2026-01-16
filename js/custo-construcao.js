/**
 * Calculadora de Custo de Construção v2.0
 * Lógica principal e UI - Versão melhorada
 */

(function() {
  'use strict';

  const state = {
    config: {
      estado: 'SP',
      tipoEstrutura: 'terrea',
      tipoConstrucao: 'alvenaria',
      estadoConservacao: 'nova',
      padrao: 'medio',
      areaTotal: 100,
      numQuartos: 2,
      numSuites: 1,
      numBanheiros: 2,
      temSala: true,
      temCozinha: true,
      temAreaServico: true,
      temVaranda: false
    },
    materiais: {
      janelas: 'aluminio_simples',
      portas: 'madeira_semi_oca',
      pisos: 'ceramica_classe_b',
      telhado: 'ceramica_simples',
      forro: 'pvc_simples'
    },
    maoDeObra: {},
    extras: {},
    custosAdicionais: {},
    calculoAtual: null
  };

  let data = null;
  let lang = 'pt';

  function init() {
    if (typeof CustoConstrucaoData === 'undefined') {
      console.error('CustoConstrucaoData não carregado');
      return;
    }
    data = CustoConstrucaoData;

    // Inicializar estado da mão de obra
    Object.keys(data.maoDeObra).forEach(k => {
      state.maoDeObra[k] = true;
    });

    // Inicializar custos adicionais
    Object.keys(data.custosAdicionais).forEach(k => {
      const key = k.replace(/_([a-z])/g, (m, l) => l.toUpperCase());
      state.custosAdicionais[key] = true;
    });

    const savedLang = localStorage.getItem('rico-lang');
    if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
      lang = savedLang;
    } else if (window.location.pathname.includes('/en/')) {
      lang = 'en';
    } else if (window.location.pathname.includes('/es/')) {
      lang = 'es';
    }

    buildUI();
    attachEventListeners();
    calculate();
  }

  function buildUI() {
    const container = document.getElementById('custo-construcao-container');
    if (!container) return;

    const t = data.i18n[lang] || data.i18n.pt;

    container.innerHTML = `
      <div class="cc-calculator">
        <!-- Configuração Básica -->
        <section class="cc-section cc-section-config">
          <h2 class="cc-section-title">${t.configuracaoBasica}</h2>

          <div class="cc-grid cc-grid-2">
            <div class="cc-field">
              <label>${t.regiao}</label>
              <select id="cc-estado">
                ${Object.entries(data.regioes).map(([uf, info]) =>
                  `<option value="${uf}" ${uf === state.config.estado ? 'selected' : ''}>${uf} - ${info.nome}</option>`
                ).join('')}
              </select>
            </div>

            <div class="cc-field">
              <label>Situação do Imóvel</label>
              <select id="cc-estado-conservacao">
                ${Object.entries(data.estadoConservacao).map(([key, info]) =>
                  `<option value="${key}" ${key === state.config.estadoConservacao ? 'selected' : ''}>${info.nome}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div class="cc-conservacao-info" id="cc-conservacao-info"></div>

          <div class="cc-grid cc-grid-3" style="margin-top: 16px;">
            <div class="cc-field">
              <label>${t.tipoEstrutura || 'Tipo de Casa'}</label>
              <select id="cc-tipo-estrutura">
                ${Object.entries(data.tiposEstrutura).map(([key, info]) =>
                  `<option value="${key}" ${key === state.config.tipoEstrutura ? 'selected' : ''}>${info.nome}</option>`
                ).join('')}
              </select>
            </div>

            <div class="cc-field">
              <label>${t.tipoConstrucao}</label>
              <select id="cc-tipo-construcao">
                ${Object.entries(data.tiposConstrucao).map(([key, info]) =>
                  `<option value="${key}" ${key === state.config.tipoConstrucao ? 'selected' : ''}>${info.nome}</option>`
                ).join('')}
              </select>
            </div>

            <div class="cc-field">
              <label>${t.padraoAcabamento}</label>
              <select id="cc-padrao">
                ${Object.entries(data.padroes).map(([key, info]) =>
                  `<option value="${key}" ${key === state.config.padrao ? 'selected' : ''}>${info.nome}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div class="cc-grid cc-grid-1" style="margin-top: 16px;">
            <div class="cc-field">
              <label>${t.areaTotal}</label>
              <div class="cc-input-group">
                <input type="number" id="cc-area" value="${state.config.areaTotal}" min="30" max="2000" step="5">
                <span>m²</span>
              </div>
            </div>
          </div>

          <div class="cc-tipo-info" id="cc-tipo-info"></div>
        </section>

        <!-- Cômodos -->
        <section class="cc-section cc-section-comodos">
          <h2 class="cc-section-title">
            <span>Configuração dos Cômodos</span>
            <button class="cc-btn-toggle" data-target="comodos-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="comodos-content">
            <p class="cc-hint">O número de cômodos influencia diretamente no custo (mais banheiros = mais instalações hidráulicas e revestimentos).</p>
            <div class="cc-grid cc-grid-4">
              <div class="cc-field">
                <label>Quartos (sem suíte)</label>
                <input type="number" id="cc-quartos" value="${state.config.numQuartos}" min="0" max="10">
              </div>
              <div class="cc-field">
                <label>Suítes (quarto + banheiro)</label>
                <input type="number" id="cc-suites" value="${state.config.numSuites}" min="0" max="10">
              </div>
              <div class="cc-field">
                <label>Banheiros extras</label>
                <input type="number" id="cc-banheiros" value="${state.config.numBanheiros}" min="0" max="10">
              </div>
              <div class="cc-field cc-field-checkbox">
                <label>
                  <input type="checkbox" id="cc-area-servico" ${state.config.temAreaServico ? 'checked' : ''}>
                  Área de Serviço
                </label>
              </div>
            </div>
            <div class="cc-comodos-resumo" id="cc-comodos-resumo"></div>
          </div>
        </section>

        <!-- Materiais -->
        <section class="cc-section cc-section-materiais">
          <h2 class="cc-section-title">
            <span>${t.materiais}</span>
            <button class="cc-btn-toggle" data-target="materiais-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="materiais-content">
            <p class="cc-hint">Escolha os materiais conforme seu orçamento. Os valores já incluem mão de obra de instalação.</p>
            <div class="cc-grid cc-grid-3">
              ${buildMaterialSelect('janelas', 'Janelas')}
              ${buildMaterialSelect('portas', 'Portas Internas')}
              ${buildMaterialSelect('pisos', 'Pisos')}
              ${buildMaterialSelect('telhados', 'Telhado', 'telhado')}
              ${buildMaterialSelect('forros', 'Forro', 'forro')}
            </div>
          </div>
        </section>

        <!-- Mão de Obra -->
        <section class="cc-section cc-section-mao-obra">
          <h2 class="cc-section-title">
            <span>${t.maoDeObra}</span>
            <button class="cc-btn-toggle" data-target="mao-obra-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="mao-obra-content">
            <p class="cc-hint">Desmarque os profissionais cujo custo você não terá (ex: você mesmo faz, ou alguém faz de graça). Cada profissional tem um percentual do custo de mão de obra.</p>
            <div class="cc-grid cc-grid-3">
              ${buildMaoDeObraCheckboxes()}
            </div>
          </div>
        </section>

        <!-- Extras -->
        <section class="cc-section cc-section-extras">
          <h2 class="cc-section-title">
            <span>${t.extras}</span>
            <button class="cc-btn-toggle" data-target="extras-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="extras-content">
            <div class="cc-extras-grid">
              ${buildExtrasSection()}
            </div>
          </div>
        </section>

        <!-- Custos Adicionais -->
        <section class="cc-section cc-section-custos-adicionais">
          <h2 class="cc-section-title">
            <span>Custos Adicionais (Projetos e Taxas)</span>
            <button class="cc-btn-toggle" data-target="custos-adicionais-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="custos-adicionais-content">
            <p class="cc-hint">Desmarque os custos que você já pagou ou não terá.</p>
            <div class="cc-grid cc-grid-3">
              ${buildCustosAdicionaisCheckboxes()}
            </div>
          </div>
        </section>

        <!-- Resultado -->
        <section class="cc-section cc-section-resultado">
          <h2 class="cc-section-title">${t.resultado}</h2>
          <div class="cc-resultado-card" id="cc-resultado">
            <div class="cc-resultado-loading">Calculando...</div>
          </div>
        </section>

        <!-- Disclaimer -->
        <div class="cc-disclaimer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <p>${t.avisoValores}</p>
        </div>
      </div>
    `;

    updateTipoInfo();
    updateComodosResumo();
    updateConservacaoInfo();
  }

  function buildMaterialSelect(categoria, label, stateKey = null) {
    const key = stateKey || categoria;
    const options = data.materiais[categoria];
    if (!options) return '';

    return `
      <div class="cc-field">
        <label>${label}</label>
        <select id="cc-material-${key}" data-categoria="${key}">
          ${Object.entries(options).map(([k, info]) => {
            if (!info || typeof info !== 'object') return '';
            const preco = info.valorM2 !== undefined
              ? `R$ ${formatNumber(info.valorM2)}/m²`
              : info.valorUnidade !== undefined
                ? `R$ ${formatNumber(info.valorUnidade)}/un`
                : '';
            return `<option value="${k}" ${k === state.materiais[key] ? 'selected' : ''}>${info.nome || k} - ${preco}</option>`;
          }).filter(Boolean).join('')}
        </select>
      </div>
    `;
  }

  function buildMaoDeObraCheckboxes() {
    return Object.entries(data.maoDeObra).map(([key, info]) => `
      <div class="cc-field cc-field-checkbox">
        <label>
          <input type="checkbox" data-profissional="${key}" ${state.maoDeObra[key] ? 'checked' : ''}>
          ${info.nome} <span class="cc-percent">(${info.percentualObra}%)</span>
        </label>
      </div>
    `).join('');
  }

  function buildExtrasSection() {
    return `
      <!-- Piscina -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-piscina">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Piscina</span>
        </div>
        <div class="cc-extra-options" id="cc-piscina-options" style="display:none;">
          <select id="cc-piscina-tipo">
            ${Object.entries(data.extras.piscina).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Churrasqueira -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-churrasqueira">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Churrasqueira / Espaço Gourmet</span>
        </div>
        <div class="cc-extra-options" id="cc-churrasqueira-options" style="display:none;">
          <select id="cc-churrasqueira-tipo">
            ${Object.entries(data.extras.churrasqueira).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Garagem/Pergolado -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-garagem">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Garagem / Pergolado</span>
        </div>
        <div class="cc-extra-options" id="cc-garagem-options" style="display:none;">
          <select id="cc-garagem-tipo">
            ${Object.entries(data.extras.garagem).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorM2)}/m²</option>`
            ).join('')}
          </select>
          <div class="cc-input-group cc-input-inline">
            <input type="number" id="cc-garagem-m2" value="20" min="10" max="100">
            <span>m²</span>
          </div>
        </div>
      </div>

      <!-- Piso Externo / Pátio -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-piso-externo">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Piso Externo / Pátio</span>
        </div>
        <div class="cc-extra-options" id="cc-piso-externo-options" style="display:none;">
          <select id="cc-piso-externo-tipo">
            ${Object.entries(data.extras.pisoExterno).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorM2)}/m²</option>`
            ).join('')}
          </select>
          <div class="cc-input-group cc-input-inline">
            <input type="number" id="cc-piso-externo-m2" value="50" min="0" max="500">
            <span>m²</span>
          </div>
        </div>
      </div>

      <!-- Muro -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-muro">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Muro</span>
        </div>
        <div class="cc-extra-options" id="cc-muro-options" style="display:none;">
          <select id="cc-muro-tipo">
            ${Object.entries(data.extras.muro).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorMetroLinear)}/m</option>`
            ).join('')}
          </select>
          <div class="cc-input-group cc-input-inline">
            <input type="number" id="cc-muro-metros" value="40" min="0" max="500">
            <span>metros</span>
          </div>
        </div>
      </div>

      <!-- Portão -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-portao">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Portão</span>
        </div>
        <div class="cc-extra-options" id="cc-portao-options" style="display:none;">
          <select id="cc-portao-tipo">
            ${Object.entries(data.extras.portao).map(([key, info]) => {
              const preco = info.valorUnidade
                ? `R$ ${formatNumber(info.valorUnidade)}`
                : `R$ ${formatNumber(info.valorM2)}/m²`;
              return `<option value="${key}">${info.nome} - ${preco}</option>`;
            }).join('')}
          </select>
          <div class="cc-input-group cc-input-inline" id="cc-portao-m2-group">
            <input type="number" id="cc-portao-m2" value="9" min="1" max="50" step="0.5">
            <span>m²</span>
          </div>
        </div>
      </div>

      <!-- Edícula -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-edicula">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Edícula</span>
        </div>
        <div class="cc-extra-options" id="cc-edicula-options" style="display:none;">
          <select id="cc-edicula-tipo">
            ${Object.entries(data.extras.edicula).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorM2)}/m²</option>`
            ).join('')}
          </select>
          <div class="cc-input-group cc-input-inline">
            <input type="number" id="cc-edicula-m2" value="20" min="10" max="100">
            <span>m²</span>
          </div>
        </div>
      </div>

      <!-- Energia Solar -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-solar">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Energia Solar</span>
        </div>
        <div class="cc-extra-options" id="cc-solar-options" style="display:none;">
          <select id="cc-solar-tipo">
            ${Object.entries(data.extras.energia).filter(([k]) => k.startsWith('solar')).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Aquecedor Solar -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-aquecedor">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Aquecedor Solar</span>
        </div>
        <div class="cc-extra-options" id="cc-aquecedor-options" style="display:none;">
          <select id="cc-aquecedor-tipo">
            ${Object.entries(data.extras.energia).filter(([k]) => k.startsWith('aquecedor')).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Automação -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-automacao">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Automação Residencial</span>
        </div>
        <div class="cc-extra-options" id="cc-automacao-options" style="display:none;">
          <select id="cc-automacao-tipo">
            ${Object.entries(data.extras.automacao).map(([key, info]) =>
              `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- Segurança -->
      <div class="cc-extra-item">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-seguranca">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">Sistema de Segurança</span>
        </div>
        <div class="cc-extra-options" id="cc-seguranca-options" style="display:none;">
          <div class="cc-checkboxes">
            ${Object.entries(data.extras.seguranca).map(([key, info]) => {
              const preco = info.valor
                ? `R$ ${formatNumber(info.valor)}`
                : `R$ ${formatNumber(info.valorMetro)}/m`;
              return `
                <label class="cc-checkbox-item">
                  <input type="checkbox" data-seguranca="${key}">
                  <span>${info.nome} - ${preco}</span>
                </label>
              `;
            }).join('')}
          </div>
          <div class="cc-input-group cc-input-inline" id="cc-cerca-metros-group" style="display:none;">
            <label>Metros de cerca:</label>
            <input type="number" id="cc-cerca-metros" value="40" min="0" max="500">
            <span>m</span>
          </div>
        </div>
      </div>
    `;
  }

  function buildCustosAdicionaisCheckboxes() {
    const custos = [
      { key: 'projetoArquitetonico', label: 'Projeto Arquitetônico', dataKey: 'projeto_arquitetonico' },
      { key: 'projetoEstrutural', label: 'Projeto Estrutural', dataKey: 'projeto_estrutural' },
      { key: 'projetoEletrico', label: 'Projeto Elétrico', dataKey: 'projeto_eletrico' },
      { key: 'projetoHidraulico', label: 'Projeto Hidráulico', dataKey: 'projeto_hidraulico' },
      { key: 'aprovacaoPrefeitura', label: 'Aprovação Prefeitura', dataKey: 'aprovacao_prefeitura' },
      { key: 'artRrt', label: 'ART/RRT', dataKey: 'art_rrt' },
      { key: 'ligacaoAgua', label: 'Ligação de Água', dataKey: 'ligacao_agua' },
      { key: 'ligacaoEsgoto', label: 'Ligação de Esgoto', dataKey: 'ligacao_esgoto' },
      { key: 'ligacaoEnergia', label: 'Ligação de Energia', dataKey: 'ligacao_energia' },
      { key: 'habiteSe', label: 'Habite-se', dataKey: 'habite_se' }
    ];

    return custos.map(c => {
      const custoData = data.custosAdicionais[c.dataKey];
      let valorStr = '';
      if (custoData) {
        if (custoData.valorFixo) {
          valorStr = `R$ ${formatNumber(custoData.valorFixo)}`;
        } else if (custoData.percentual) {
          valorStr = `${custoData.percentual}%`;
        }
      }
      return `
        <div class="cc-field cc-field-checkbox">
          <label>
            <input type="checkbox" data-custo="${c.key}" ${state.custosAdicionais[c.key] ? 'checked' : ''}>
            ${c.label} <span class="cc-custo-valor">${valorStr}</span>
          </label>
        </div>
      `;
    }).join('');
  }

  function updateTipoInfo() {
    const tipoInfo = document.getElementById('cc-tipo-info');
    if (!tipoInfo) return;

    const estrutura = data.tiposEstrutura[state.config.tipoEstrutura];
    const metodo = data.tiposConstrucao[state.config.tipoConstrucao];
    if (!estrutura || !metodo) return;

    tipoInfo.innerHTML = `
      <div class="cc-tipo-card">
        <div class="cc-tipo-row">
          <div class="cc-tipo-col">
            <strong>${estrutura.nome}:</strong> ${estrutura.descricao}
            <span class="cc-tipo-badge ${estrutura.fator > 1 ? 'cc-red' : estrutura.fator < 1 ? 'cc-green' : ''}">${estrutura.fator > 1 ? '+' : ''}${((estrutura.fator - 1) * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="cc-tipo-row">
          <div class="cc-tipo-col">
            <strong>${metodo.nome}:</strong> ${metodo.descricao}
            <span class="cc-tipo-badge ${metodo.fator > 1 ? 'cc-red' : metodo.fator < 1 ? 'cc-green' : ''}">${metodo.fator > 1 ? '+' : ''}${((metodo.fator - 1) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  function updateComodosResumo() {
    const resumo = document.getElementById('cc-comodos-resumo');
    if (!resumo) return;

    const quartos = state.config.numQuartos;
    const suites = state.config.numSuites;
    const banheiros = state.config.numBanheiros;
    const totalBanheiros = suites + banheiros;

    // Calcular custo adicional estimado por cômodo
    const custoComodos = data.custoPorComodo;
    const custoQuartos = quartos * custoComodos.quarto.custoBase;
    const custoSuites = suites * custoComodos.suite.custoBase;
    const custoBanheiros = banheiros * custoComodos.banheiro.custoBase;
    const totalComodosExtra = custoQuartos + custoSuites + custoBanheiros;

    resumo.innerHTML = `
      <div class="cc-comodos-info">
        <span><strong>Total de banheiros:</strong> ${totalBanheiros} (${suites} nas suítes + ${banheiros} extras)</span>
        <span class="cc-comodos-custo">Custo adicional (hidráulica, louças, etc): <strong>R$ ${formatNumber(totalComodosExtra)}</strong></span>
      </div>
    `;
  }

  function updateConservacaoInfo() {
    const infoEl = document.getElementById('cc-conservacao-info');
    if (!infoEl) return;

    const conservacao = data.estadoConservacao[state.config.estadoConservacao];
    if (!conservacao) return;

    if (state.config.estadoConservacao === 'nova') {
      infoEl.innerHTML = '';
      return;
    }

    infoEl.innerHTML = `
      <div class="cc-conservacao-card">
        <div class="cc-conservacao-row">
          <strong>${conservacao.nome}:</strong> ${conservacao.descricao}
          <span class="cc-tipo-badge ${conservacao.desconto > 30 ? 'cc-red' : 'cc-yellow'}">${conservacao.desconto}% depreciação</span>
        </div>
        <div class="cc-conservacao-detail">
          <em>Condição:</em> ${conservacao.itensInclusos}
        </div>
      </div>
    `;
  }

  function attachEventListeners() {
    // Toggle sections
    document.querySelectorAll('.cc-btn-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const target = document.getElementById(this.dataset.target);
        if (target) {
          target.classList.toggle('collapsed');
          this.classList.toggle('rotated');
        }
      });
    });

    // Config changes
    const configHandlers = {
      'cc-estado': v => state.config.estado = v,
      'cc-estado-conservacao': v => { state.config.estadoConservacao = v; updateConservacaoInfo(); },
      'cc-tipo-estrutura': v => { state.config.tipoEstrutura = v; updateTipoInfo(); },
      'cc-tipo-construcao': v => { state.config.tipoConstrucao = v; updateTipoInfo(); },
      'cc-padrao': v => state.config.padrao = v,
      'cc-area': v => state.config.areaTotal = parseFloat(v) || 100,
      'cc-quartos': v => { state.config.numQuartos = parseInt(v) || 0; updateComodosResumo(); },
      'cc-suites': v => { state.config.numSuites = parseInt(v) || 0; updateComodosResumo(); },
      'cc-banheiros': v => { state.config.numBanheiros = parseInt(v) || 0; updateComodosResumo(); }
    };

    Object.entries(configHandlers).forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener(el.type === 'number' ? 'input' : 'change', function() {
          handler(this.value);
          calculate();
        });
      }
    });

    document.getElementById('cc-area-servico')?.addEventListener('change', function() {
      state.config.temAreaServico = this.checked;
      calculate();
    });

    // Material changes
    document.querySelectorAll('[id^="cc-material-"]').forEach(select => {
      select.addEventListener('change', function() {
        state.materiais[this.dataset.categoria] = this.value;
        calculate();
      });
    });

    // Mão de obra
    document.querySelectorAll('[data-profissional]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        state.maoDeObra[this.dataset.profissional] = this.checked;
        calculate();
      });
    });

    // Custos adicionais
    document.querySelectorAll('[data-custo]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        state.custosAdicionais[this.dataset.custo] = this.checked;
        calculate();
      });
    });

    // Extras toggles
    const extras = ['piscina', 'churrasqueira', 'garagem', 'piso-externo', 'muro', 'portao', 'edicula', 'solar', 'aquecedor', 'automacao', 'seguranca'];
    extras.forEach(name => {
      const checkbox = document.getElementById(`cc-extra-${name}`);
      const options = document.getElementById(`cc-${name}-options`);
      if (checkbox) {
        checkbox.addEventListener('change', function() {
          if (options) options.style.display = this.checked ? 'block' : 'none';
          calculate();
        });
      }
    });

    // Extra option changes
    const extraSelects = ['piscina-tipo', 'churrasqueira-tipo', 'garagem-tipo', 'piso-externo-tipo', 'muro-tipo', 'portao-tipo', 'edicula-tipo', 'solar-tipo', 'aquecedor-tipo', 'automacao-tipo'];
    extraSelects.forEach(id => {
      document.getElementById(`cc-${id}`)?.addEventListener('change', calculate);
    });

    const extraInputs = ['garagem-m2', 'piso-externo-m2', 'muro-metros', 'portao-m2', 'edicula-m2', 'cerca-metros'];
    extraInputs.forEach(id => {
      document.getElementById(`cc-${id}`)?.addEventListener('input', calculate);
    });

    // Portão tipo change
    document.getElementById('cc-portao-tipo')?.addEventListener('change', function() {
      const tipo = data.extras.portao[this.value];
      const m2Group = document.getElementById('cc-portao-m2-group');
      if (m2Group) {
        m2Group.style.display = tipo.valorUnidade ? 'none' : 'flex';
      }
    });

    // Segurança checkboxes
    document.querySelectorAll('[data-seguranca]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const cercaGroup = document.getElementById('cc-cerca-metros-group');
        const hasCerca = document.querySelector('[data-seguranca="cerca_eletrica"]:checked') ||
                        document.querySelector('[data-seguranca="concertina"]:checked');
        if (cercaGroup) {
          cercaGroup.style.display = hasCerca ? 'flex' : 'none';
        }
        calculate();
      });
    });
  }

  function calculate() {
    const resultado = document.getElementById('cc-resultado');
    if (!resultado) return;

    const regiao = data.regioes[state.config.estado];
    const estrutura = data.tiposEstrutura[state.config.tipoEstrutura];
    const metodo = data.tiposConstrucao[state.config.tipoConstrucao];
    const conservacao = data.estadoConservacao[state.config.estadoConservacao];
    const padrao = data.padroes[state.config.padrao];
    const area = state.config.areaTotal;

    // Fator de conservação (reduz o custo para reformas)
    const fatorConservacao = conservacao ? conservacao.fator : 1.0;
    const isReforma = state.config.estadoConservacao !== 'nova';

    // Custo base
    const custoBaseM2 = data.custoBaseM2.materiais + data.custoBaseM2.maoDeObra;
    let custoM2Ajustado = custoBaseM2 * regiao.fator * estrutura.fator * metodo.fator * padrao.fator;

    const proporcaoMateriais = data.custoBaseM2.materiais / custoBaseM2;
    const proporcaoMaoObra = data.custoBaseM2.maoDeObra / custoBaseM2;

    let custoMateriais = custoM2Ajustado * proporcaoMateriais * area * fatorConservacao;
    let custoMaoObra = custoM2Ajustado * proporcaoMaoObra * area * fatorConservacao;

    // Ajustar mão de obra com base nos profissionais desmarcados
    let percentualMaoObraAtivo = 0;
    Object.entries(state.maoDeObra).forEach(([key, ativo]) => {
      if (ativo && data.maoDeObra[key]) {
        percentualMaoObraAtivo += data.maoDeObra[key].percentualObra;
      }
    });
    const fatorMaoObra = percentualMaoObraAtivo / 100;
    custoMaoObra = custoMaoObra * fatorMaoObra;

    // Custo adicional por cômodos (também ajustado pelo fator de conservação)
    const custoComodos = data.custoPorComodo;
    let custoComodosExtra = 0;
    custoComodosExtra += state.config.numQuartos * custoComodos.quarto.custoBase * padrao.fator * fatorConservacao;
    custoComodosExtra += state.config.numSuites * custoComodos.suite.custoBase * padrao.fator * fatorConservacao;
    custoComodosExtra += state.config.numBanheiros * custoComodos.banheiro.custoBase * padrao.fator * fatorConservacao;
    if (state.config.temAreaServico) {
      custoComodosExtra += custoComodos.areaServico.custoBase * padrao.fator * fatorConservacao;
    }

    // Custo base da construção
    let custoBase = custoMateriais + custoMaoObra + custoComodosExtra;

    // EXTRAS
    let custoExtras = 0;
    const detalhesExtras = [];

    // Piscina
    if (document.getElementById('cc-extra-piscina')?.checked) {
      const tipo = document.getElementById('cc-piscina-tipo')?.value;
      if (tipo && data.extras.piscina[tipo]) {
        const valor = data.extras.piscina[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.piscina[tipo].nome, valor });
      }
    }

    // Churrasqueira
    if (document.getElementById('cc-extra-churrasqueira')?.checked) {
      const tipo = document.getElementById('cc-churrasqueira-tipo')?.value;
      if (tipo && data.extras.churrasqueira[tipo]) {
        const valor = data.extras.churrasqueira[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.churrasqueira[tipo].nome, valor });
      }
    }

    // Garagem/Pergolado
    if (document.getElementById('cc-extra-garagem')?.checked) {
      const tipo = document.getElementById('cc-garagem-tipo')?.value;
      const m2 = parseFloat(document.getElementById('cc-garagem-m2')?.value) || 20;
      if (tipo && data.extras.garagem[tipo]) {
        const valor = data.extras.garagem[tipo].valorM2 * m2;
        custoExtras += valor;
        detalhesExtras.push({ nome: `${data.extras.garagem[tipo].nome} (${m2}m²)`, valor });
      }
    }

    // Piso Externo
    if (document.getElementById('cc-extra-piso-externo')?.checked) {
      const tipo = document.getElementById('cc-piso-externo-tipo')?.value;
      const m2 = parseFloat(document.getElementById('cc-piso-externo-m2')?.value) || 50;
      if (tipo && data.extras.pisoExterno[tipo] && m2 > 0) {
        const valor = data.extras.pisoExterno[tipo].valorM2 * m2;
        custoExtras += valor;
        detalhesExtras.push({ nome: `${data.extras.pisoExterno[tipo].nome} (${m2}m²)`, valor });
      }
    }

    // Muro
    if (document.getElementById('cc-extra-muro')?.checked) {
      const tipo = document.getElementById('cc-muro-tipo')?.value;
      const metros = parseFloat(document.getElementById('cc-muro-metros')?.value) || 0;
      if (tipo && data.extras.muro[tipo] && metros > 0) {
        const valor = data.extras.muro[tipo].valorMetroLinear * metros;
        custoExtras += valor;
        detalhesExtras.push({ nome: `${data.extras.muro[tipo].nome} (${metros}m)`, valor });
      }
    }

    // Portão
    if (document.getElementById('cc-extra-portao')?.checked) {
      const tipo = document.getElementById('cc-portao-tipo')?.value;
      if (tipo && data.extras.portao[tipo]) {
        const portaoData = data.extras.portao[tipo];
        let valor;
        if (portaoData.valorUnidade) {
          valor = portaoData.valorUnidade;
        } else {
          const m2 = parseFloat(document.getElementById('cc-portao-m2')?.value) || 9;
          valor = portaoData.valorM2 * m2;
        }
        custoExtras += valor;
        detalhesExtras.push({ nome: portaoData.nome, valor });
      }
    }

    // Edícula
    if (document.getElementById('cc-extra-edicula')?.checked) {
      const tipo = document.getElementById('cc-edicula-tipo')?.value;
      const m2 = parseFloat(document.getElementById('cc-edicula-m2')?.value) || 20;
      if (tipo && data.extras.edicula[tipo]) {
        const valor = data.extras.edicula[tipo].valorM2 * m2;
        custoExtras += valor;
        detalhesExtras.push({ nome: `${data.extras.edicula[tipo].nome} (${m2}m²)`, valor });
      }
    }

    // Energia Solar
    if (document.getElementById('cc-extra-solar')?.checked) {
      const tipo = document.getElementById('cc-solar-tipo')?.value;
      if (tipo && data.extras.energia[tipo]) {
        const valor = data.extras.energia[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.energia[tipo].nome, valor });
      }
    }

    // Aquecedor Solar
    if (document.getElementById('cc-extra-aquecedor')?.checked) {
      const tipo = document.getElementById('cc-aquecedor-tipo')?.value;
      if (tipo && data.extras.energia[tipo]) {
        const valor = data.extras.energia[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.energia[tipo].nome, valor });
      }
    }

    // Automação
    if (document.getElementById('cc-extra-automacao')?.checked) {
      const tipo = document.getElementById('cc-automacao-tipo')?.value;
      if (tipo && data.extras.automacao[tipo]) {
        const valor = data.extras.automacao[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.automacao[tipo].nome, valor });
      }
    }

    // Segurança
    if (document.getElementById('cc-extra-seguranca')?.checked) {
      const metrosCerca = parseFloat(document.getElementById('cc-cerca-metros')?.value) || 40;
      document.querySelectorAll('[data-seguranca]:checked').forEach(checkbox => {
        const tipo = checkbox.dataset.seguranca;
        if (data.extras.seguranca[tipo]) {
          const segData = data.extras.seguranca[tipo];
          let valor;
          if (segData.valorMetro) {
            valor = segData.valorMetro * metrosCerca;
          } else {
            valor = segData.valor;
          }
          custoExtras += valor;
          detalhesExtras.push({ nome: segData.nome, valor });
        }
      });
    }

    // CUSTOS ADICIONAIS
    let custoAdicionais = 0;
    const detalhesAdicionais = [];

    const mapeamentoCustos = {
      projetoArquitetonico: 'projeto_arquitetonico',
      projetoEstrutural: 'projeto_estrutural',
      projetoEletrico: 'projeto_eletrico',
      projetoHidraulico: 'projeto_hidraulico',
      aprovacaoPrefeitura: 'aprovacao_prefeitura',
      artRrt: 'art_rrt',
      ligacaoAgua: 'ligacao_agua',
      ligacaoEsgoto: 'ligacao_esgoto',
      ligacaoEnergia: 'ligacao_energia',
      habiteSe: 'habite_se'
    };

    Object.entries(state.custosAdicionais).forEach(([key, ativo]) => {
      if (ativo) {
        const dataKey = mapeamentoCustos[key];
        const custoData = data.custosAdicionais[dataKey];
        if (custoData) {
          let valor;
          if (custoData.valorFixo) {
            valor = custoData.valorFixo;
          } else if (custoData.percentual) {
            valor = Math.max(custoData.valorMinimo || 0, custoBase * (custoData.percentual / 100));
          }
          if (valor) {
            custoAdicionais += valor;
            detalhesAdicionais.push({ nome: custoData.nome, valor });
          }
        }
      }
    });

    // TOTAL
    const custoTotal = custoBase + custoExtras + custoAdicionais;
    const custoM2Final = custoTotal / area;

    // Salvar para exportação
    state.calculoAtual = {
      custoTotal,
      custoM2Final,
      custoBase,
      custoMateriais,
      custoMaoObra,
      custoComodosExtra,
      custoExtras,
      custoAdicionais,
      detalhesExtras,
      detalhesAdicionais,
      config: { ...state.config },
      regiao,
      estrutura,
      metodo,
      padrao,
      conservacao,
      isReforma
    };

    // Render
    const tipoObra = isReforma ? conservacao.nome : 'Construção Nova';

    resultado.innerHTML = `
      <div class="cc-resultado-main">
        <div class="cc-resultado-total">
          <span class="cc-resultado-label">${isReforma ? 'Valor Estimado do Imóvel' : 'Custo de Construção Nova'}</span>
          <span class="cc-resultado-valor">R$ ${formatNumber(custoTotal)}</span>
          <span class="cc-resultado-m2">R$ ${formatNumber(custoM2Final)}/m²</span>
        </div>

        ${isReforma ? `
          <div class="cc-resultado-reforma-info">
            <strong>${conservacao.nome}</strong> - ${conservacao.descricao}
            <br><small>Depreciação de ${conservacao.desconto}% sobre valor de construção nova</small>
          </div>
        ` : ''}

        <div class="cc-resultado-breakdown">
          <!-- Composição do custo - seção agrupada -->
          <div class="cc-breakdown-group">
            <div class="cc-breakdown-group-title">Composição do Custo (${area}m²)</div>

            <div class="cc-breakdown-row">
              <span>Estrutura e Materiais Base (${area}m²)</span>
              <span>R$ ${formatNumber(custoMateriais)}</span>
            </div>
            <div class="cc-breakdown-row">
              <span>Mão de Obra (${(percentualMaoObraAtivo).toFixed(0)}% ativa)</span>
              <span>R$ ${formatNumber(custoMaoObra)}</span>
            </div>
            <div class="cc-breakdown-row">
              <span>Adicionais Cômodos (${state.config.numQuartos} qts + ${state.config.numSuites} suítes + ${state.config.numBanheiros} wc)</span>
              <span>R$ ${formatNumber(custoComodosExtra)}</span>
            </div>
            <div class="cc-breakdown-hint">
              <small>* Hidráulica, louças, revestimentos específicos de cada cômodo</small>
            </div>

            <div class="cc-breakdown-subtotal">
              <span>Subtotal Construção</span>
              <span>R$ ${formatNumber(custoBase)}</span>
            </div>
          </div>

          ${custoExtras > 0 ? `
            <div class="cc-breakdown-group">
              <div class="cc-breakdown-group-title">Itens Extras</div>
              ${detalhesExtras.map(e => `
                <div class="cc-breakdown-row">
                  <span>${e.nome}</span>
                  <span>R$ ${formatNumber(e.valor)}</span>
                </div>
              `).join('')}
              <div class="cc-breakdown-subtotal">
                <span>Subtotal Extras</span>
                <span>R$ ${formatNumber(custoExtras)}</span>
              </div>
            </div>
          ` : ''}

          ${custoAdicionais > 0 ? `
            <div class="cc-breakdown-group">
              <div class="cc-breakdown-group-title">Projetos e Taxas</div>
              ${detalhesAdicionais.map(e => `
                <div class="cc-breakdown-row">
                  <span>${e.nome}</span>
                  <span>R$ ${formatNumber(e.valor)}</span>
                </div>
              `).join('')}
              <div class="cc-breakdown-subtotal">
                <span>Subtotal Projetos</span>
                <span>R$ ${formatNumber(custoAdicionais)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="cc-resultado-info">
        <div class="cc-info-grid">
          <div class="cc-info-item">
            <span class="cc-info-label">Região</span>
            <span class="cc-info-value">${state.config.estado} - ${regiao.nome}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Situação</span>
            <span class="cc-info-value">${tipoObra}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Tipo</span>
            <span class="cc-info-value">${estrutura.nome}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Método</span>
            <span class="cc-info-value">${metodo.nome}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Padrão</span>
            <span class="cc-info-value">${padrao.nome}</span>
          </div>
        </div>
      </div>

      <div class="cc-resultado-actions">
        <button class="cc-btn cc-btn-primary" onclick="CustoConstrucao.exportarExcel()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar Excel
        </button>
        <button class="cc-btn cc-btn-secondary" onclick="CustoConstrucao.exportarTexto()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Exportar Texto
        </button>
      </div>
    `;
  }

  function exportarExcel() {
    if (!state.calculoAtual) {
      calculate();
    }
    const c = state.calculoAtual;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Criar conteúdo CSV (que pode ser aberto no Excel)
    let csv = '\uFEFF'; // BOM para UTF-8
    csv += 'ORÇAMENTO DE CONSTRUÇÃO\n';
    csv += `Data:;${dataAtual}\n`;
    csv += `Site:;ricoaospoucos.com.br\n\n`;

    csv += 'CONFIGURAÇÃO\n';
    csv += `Região;${c.config.estado} - ${c.regiao.nome}\n`;
    csv += `Situação;${c.isReforma ? c.conservacao.nome : 'Construção Nova'}\n`;
    csv += `Tipo de Casa;${c.estrutura.nome}\n`;
    csv += `Método Construtivo;${c.metodo.nome}\n`;
    csv += `Padrão de Acabamento;${c.padrao.nome}\n`;
    csv += `Área Total;${c.config.areaTotal} m²\n`;
    csv += `Quartos;${c.config.numQuartos}\n`;
    csv += `Suítes;${c.config.numSuites}\n`;
    csv += `Banheiros extras;${c.config.numBanheiros}\n`;
    if (c.isReforma) {
      csv += `Depreciação;${c.conservacao.desconto}%\n`;
    }
    csv += '\n';

    csv += 'DETALHAMENTO DE CUSTOS\n';
    csv += 'Item;Valor (R$)\n';
    csv += `Estrutura e Materiais Base;${formatNumber(c.custoMateriais)}\n`;
    csv += `Mão de Obra;${formatNumber(c.custoMaoObra)}\n`;
    csv += `Adicionais Cômodos (hidráulica, louças);${formatNumber(c.custoComodosExtra)}\n`;
    csv += `SUBTOTAL CONSTRUÇÃO;${formatNumber(c.custoBase)}\n\n`;

    if (c.detalhesExtras.length > 0) {
      csv += 'ITENS EXTRAS\n';
      c.detalhesExtras.forEach(e => {
        csv += `${e.nome};${formatNumber(e.valor)}\n`;
      });
      csv += `SUBTOTAL EXTRAS;${formatNumber(c.custoExtras)}\n\n`;
    }

    if (c.detalhesAdicionais.length > 0) {
      csv += 'PROJETOS E TAXAS\n';
      c.detalhesAdicionais.forEach(e => {
        csv += `${e.nome};${formatNumber(e.valor)}\n`;
      });
      csv += `SUBTOTAL PROJETOS;${formatNumber(c.custoAdicionais)}\n\n`;
    }

    csv += 'RESUMO\n';
    csv += `CUSTO TOTAL;${formatNumber(c.custoTotal)}\n`;
    csv += `CUSTO POR M²;${formatNumber(c.custoM2Final)}\n\n`;

    csv += 'OBSERVAÇÃO\n';
    csv += 'Valores de referência sujeitos a variação conforme localidade e negociação.\n';

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento-construcao-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportarTexto() {
    if (!state.calculoAtual) {
      calculate();
    }
    const c = state.calculoAtual;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const tipoObra = c.isReforma ? c.conservacao.nome : 'Construção Nova';

    let texto = `
═══════════════════════════════════════════════════════════
           ORÇAMENTO DE ${c.isReforma ? 'REFORMA' : 'CONSTRUÇÃO'}
═══════════════════════════════════════════════════════════
Gerado em: ${dataAtual}
Site: ricoaospoucos.com.br

CONFIGURAÇÃO
───────────────────────────────────────────────────────────
Região: ${c.config.estado} - ${c.regiao.nome}
Situação: ${tipoObra}${c.isReforma ? ` (depreciação de ${c.conservacao.desconto}%)` : ''}
Tipo de Casa: ${c.estrutura.nome}
Método: ${c.metodo.nome}
Padrão: ${c.padrao.nome}
Área Total: ${c.config.areaTotal} m²
Quartos: ${c.config.numQuartos} | Suítes: ${c.config.numSuites} | Banheiros: ${c.config.numBanheiros}

DETALHAMENTO
───────────────────────────────────────────────────────────
Estrutura e Mat. Base:     R$ ${formatNumber(c.custoMateriais).padStart(12)}
Mão de Obra:               R$ ${formatNumber(c.custoMaoObra).padStart(12)}
Adicionais Cômodos*:       R$ ${formatNumber(c.custoComodosExtra).padStart(12)}
                           ─────────────────
SUBTOTAL CONSTRUÇÃO:       R$ ${formatNumber(c.custoBase).padStart(12)}
* Hidráulica, louças e revestimentos específicos de cada cômodo
`;

    if (c.detalhesExtras.length > 0) {
      texto += `
ITENS EXTRAS
───────────────────────────────────────────────────────────`;
      c.detalhesExtras.forEach(e => {
        texto += `\n${e.nome.padEnd(30)} R$ ${formatNumber(e.valor).padStart(12)}`;
      });
      texto += `\n                           ─────────────────
SUBTOTAL EXTRAS:           R$ ${formatNumber(c.custoExtras).padStart(12)}`;
    }

    if (c.detalhesAdicionais.length > 0) {
      texto += `

PROJETOS E TAXAS
───────────────────────────────────────────────────────────`;
      c.detalhesAdicionais.forEach(e => {
        texto += `\n${e.nome.padEnd(30)} R$ ${formatNumber(e.valor).padStart(12)}`;
      });
      texto += `\n                           ─────────────────
SUBTOTAL PROJETOS:         R$ ${formatNumber(c.custoAdicionais).padStart(12)}`;
    }

    texto += `

═══════════════════════════════════════════════════════════
CUSTO TOTAL:               R$ ${formatNumber(c.custoTotal).padStart(12)}
CUSTO POR M²:              R$ ${formatNumber(c.custoM2Final).padStart(12)}
═══════════════════════════════════════════════════════════

Valores de referência sujeitos a variação conforme localidade,
período e negociação com fornecedores.
    `;

    const blob = new Blob([texto.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento-construcao-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  window.CustoConstrucao = {
    init,
    calculate,
    exportarExcel,
    exportarTexto
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
