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
      areaTerreno: 0,
      numQuartos: 3,
      numSuites: 0,
      numBanheiros: 1,
      numEscritorios: 0,
      temSala: true,
      temCozinha: true,
      temAreaServico: true,
      temDespensa: false,
      temVaranda: false,
      // Garagem
      garagemVagas: 0,
      garagemTipo: 'aberta',
      garagemChurrasqueira: false,
      garagemBanheiro: false,
      garagemDeposito: false,
      garagemLavabo: false,
      // Área Gourmet
      temAreaGourmet: false,
      areaGourmetM2: 20,
      gourmetChurrasqueira: true,
      gourmetLareira: false,
      gourmetFogaoLenha: false,
      gourmetFornoPizza: false,
      gourmetBancada: true,
      gourmetBanheiro: false
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
    edicula: {
      quartos: 0,
      suites: 0,
      banheiros: 0,
      garagem: 0,
      sala: false,
      cozinha: false,
      areaServico: false,
      escritorio: false,
      churrasqueira: false,
      lareira: false,
      varanda: false,
      piscina: false
    },
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
        <!-- Cabeçalho com Resumo do Imóvel -->
        <header class="cc-header-resumo" id="cc-header-resumo">
          <div class="cc-header-info">
            <div class="cc-header-titulo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span id="cc-header-tipo">Casa Térrea</span>
            </div>
            <div class="cc-header-detalhes">
              <span id="cc-header-area">100m²</span>
              <span class="cc-header-sep">•</span>
              <span id="cc-header-quartos">3 quartos</span>
              <span class="cc-header-sep">•</span>
              <span id="cc-header-regiao">SP</span>
            </div>
          </div>
          <div class="cc-header-valor">
            <span class="cc-header-valor-label">Valor Estimado</span>
            <span class="cc-header-valor-numero" id="cc-valor-topo">R$ 0</span>
            <span class="cc-header-valor-m2" id="cc-valor-m2">R$ 0/m²</span>
          </div>
        </header>

        <!-- Descrição Inteligente -->
        <section class="cc-section cc-section-descricao">
          <div class="cc-section-header" data-target="descricao-content">
            <h2 class="cc-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Descrição Rápida
            </h2>
            <button class="cc-btn-toggle" data-target="descricao-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          <div class="cc-section-content" id="descricao-content">
            <textarea
              id="cc-descricao-texto"
              class="cc-textarea"
              placeholder="Ex: Apartamento de 85m² em São Paulo, 2 quartos sendo 1 suíte, 2 banheiros, bom estado, padrão médio..."
              rows="3"
            ></textarea>

            <div class="cc-descricao-actions">
              <button class="cc-btn cc-btn-aplicar" id="cc-btn-aplicar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Aplicar
              </button>
              <button class="cc-btn cc-btn-limpar" id="cc-btn-limpar">
                Limpar
              </button>
            </div>

            <div class="cc-descricao-feedback" id="cc-descricao-feedback" style="display: none;"></div>
          </div>
        </section>

        <!-- Configuração Básica -->
        <section class="cc-section cc-section-config">
          <div class="cc-section-header" data-target="config-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">1</span>
              ${t.configuracaoBasica}
            </h2>
            <button class="cc-btn-toggle" data-target="config-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="cc-section-content" id="config-content">
            <!-- Grupo: Localização e Estado -->
            <div class="cc-field-group">
              <div class="cc-field-group-title">
                <span class="emoji">📍</span> Localização e Estado
              </div>
              <div class="cc-grid cc-grid-3">
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
                <div class="cc-field">
                  <label>Ajuste de Localização</label>
                  <select id="cc-ajuste-localizacao">
                    <option value="0">Padrão (0%)</option>
                    <option value="10">Residencial (+10%)</option>
                    <option value="25">Centro (+25%)</option>
                    <option value="50">Valorizada (+50%)</option>
                    <option value="80">Próximo praia (+80%)</option>
                    <option value="120">Beira-mar (+120%)</option>
                    <option value="150">Frente mar (+150%)</option>
                    <option value="-10">Periférica (-10%)</option>
                    <option value="-20">Rural (-20%)</option>
                    <option value="custom">Personalizado...</option>
                  </select>
                </div>
              </div>
              <div class="cc-conservacao-info" id="cc-conservacao-info"></div>
              <div id="cc-ajuste-custom" style="display: none; margin-top: 10px;">
                <div class="cc-input-group">
                  <input type="number" id="cc-ajuste-custom-valor" value="0" min="-50" max="200" step="5">
                  <span class="cc-unit">%</span>
                </div>
              </div>
              <div class="cc-localizacao-info" id="cc-localizacao-info"></div>
            </div>

            <!-- Grupo: Tipo do Imóvel -->
            <div class="cc-field-group">
              <div class="cc-field-group-title">
                <span class="emoji">🏠</span> Tipo do Imóvel
              </div>
              <div class="cc-grid cc-grid-3">
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
              <div class="cc-tipo-info" id="cc-tipo-info"></div>
            </div>

            <!-- Grupo: Metragem -->
            <div class="cc-field-group">
              <div class="cc-field-group-title">
                <span class="emoji">📐</span> Metragem
              </div>
              <div class="cc-grid cc-grid-2">
                <div class="cc-field">
                  <label>${t.areaTotal}</label>
                  <div class="cc-input-group">
                    <input type="number" id="cc-area" value="${state.config.areaTotal}" min="30" max="2000" step="5">
                    <span class="cc-unit">m²</span>
                  </div>
                </div>
                <div class="cc-field" id="cc-terreno-section">
                  <label>Área do Terreno</label>
                  <div class="cc-input-group">
                    <input type="number" id="cc-area-terreno" value="${state.config.areaTerreno || ''}" min="0" max="100000" step="10" placeholder="Opcional">
                    <span class="cc-unit">m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Cômodos -->
        <section class="cc-section cc-section-comodos">
          <div class="cc-section-header" data-target="comodos-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">2</span>
              Cômodos e Ambientes
            </h2>
            <button class="cc-btn-toggle" data-target="comodos-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="cc-section-content" id="comodos-content">
            <!-- Grupo: Quartos e Banheiros -->
            <div class="cc-field-group">
              <div class="cc-field-group-title">
                <span class="emoji">🛏️</span> Quartos e Banheiros
              </div>
              <div class="cc-grid cc-grid-4">
                <div class="cc-field">
                  <label>Quartos</label>
                  <input type="number" id="cc-quartos" value="${state.config.numQuartos}" min="0" max="10">
                </div>
                <div class="cc-field">
                  <label>Suítes</label>
                  <input type="number" id="cc-suites" value="${state.config.numSuites}" min="0" max="10">
                </div>
                <div class="cc-field">
                  <label>Banheiros Extras</label>
                  <input type="number" id="cc-banheiros" value="${state.config.numBanheiros}" min="0" max="10">
                </div>
                <div class="cc-field">
                  <label>Escritório</label>
                  <input type="number" id="cc-escritorios" value="${state.config.numEscritorios || 0}" min="0" max="5">
                </div>
              </div>
            </div>

            <!-- Grupo: Ambientes Adicionais -->
            <div class="cc-field-group">
              <div class="cc-field-group-title">
                <span class="emoji">🏡</span> Ambientes Adicionais
              </div>
              <div class="cc-grid cc-grid-auto">
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-area-servico" ${state.config.temAreaServico ? 'checked' : ''}>
                  <span>Área de Serviço</span>
                </label>
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-despensa" ${state.config.temDespensa ? 'checked' : ''}>
                  <span>Despensa</span>
                </label>
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-varanda" ${state.config.temVaranda ? 'checked' : ''}>
                  <span>Varanda/Sacada</span>
                </label>
              </div>
            </div>

            <!-- Subsection: Garagem -->
            <div class="cc-subsection">
              <div class="cc-subsection-header">
                <span class="cc-subsection-title"><span class="emoji">🚗</span> Garagem</span>
              </div>
              <div class="cc-grid cc-grid-2">
                <div class="cc-field">
                  <label>Vagas</label>
                  <input type="number" id="cc-vagas-garagem" value="${state.config.garagemVagas || 0}" min="0" max="10">
                </div>
                <div class="cc-field">
                  <label>Tipo</label>
                  <select id="cc-tipo-vaga">
                    <option value="aberta" ${state.config.garagemTipo === 'aberta' ? 'selected' : ''}>Aberta (descoberta)</option>
                    <option value="coberta" ${state.config.garagemTipo === 'coberta' ? 'selected' : ''}>Coberta</option>
                    <option value="fechada" ${state.config.garagemTipo === 'fechada' ? 'selected' : ''}>Fechada (box)</option>
                  </select>
                </div>
              </div>
              <div class="cc-grid cc-grid-auto" style="margin-top: 12px;">
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-garagem-churrasqueira" ${state.config.garagemChurrasqueira ? 'checked' : ''}>
                  <span>Churrasqueira</span>
                </label>
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-garagem-banheiro" ${state.config.garagemBanheiro ? 'checked' : ''}>
                  <span>Banheiro</span>
                </label>
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-garagem-deposito" ${state.config.garagemDeposito ? 'checked' : ''}>
                  <span>Depósito</span>
                </label>
                <label class="cc-checkbox">
                  <input type="checkbox" id="cc-garagem-lavabo" ${state.config.garagemLavabo ? 'checked' : ''}>
                  <span>Lavabo</span>
                </label>
              </div>
            </div>

            <!-- Subsection: Área Gourmet -->
            <div class="cc-subsection">
              <div class="cc-subsection-header">
                <label class="cc-switch">
                  <input type="checkbox" id="cc-tem-area-gourmet" ${state.config.temAreaGourmet ? 'checked' : ''}>
                  <span class="cc-switch-slider"></span>
                </label>
                <span class="cc-subsection-title"><span class="emoji">🍖</span> Área Gourmet / Lazer</span>
              </div>
              <div id="cc-area-gourmet-options" style="display: ${state.config.temAreaGourmet ? 'block' : 'none'};">
                <div class="cc-field" style="margin-bottom: 12px;">
                  <label>Área Aproximada</label>
                  <div class="cc-input-group">
                    <input type="number" id="cc-area-gourmet-m2" value="${state.config.areaGourmetM2 || 20}" min="10" max="100">
                    <span class="cc-unit">m²</span>
                  </div>
                </div>
                <div class="cc-grid cc-grid-auto">
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-churrasqueira" ${state.config.gourmetChurrasqueira !== false ? 'checked' : ''}>
                    <span>Churrasqueira</span>
                  </label>
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-lareira" ${state.config.gourmetLareira ? 'checked' : ''}>
                    <span>Lareira</span>
                  </label>
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-fogao-lenha" ${state.config.gourmetFogaoLenha ? 'checked' : ''}>
                    <span>Fogão a Lenha</span>
                  </label>
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-forno-pizza" ${state.config.gourmetFornoPizza ? 'checked' : ''}>
                    <span>Forno de Pizza</span>
                  </label>
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-bancada" ${state.config.gourmetBancada !== false ? 'checked' : ''}>
                    <span>Bancada/Pia</span>
                  </label>
                  <label class="cc-checkbox">
                    <input type="checkbox" id="cc-gourmet-banheiro" ${state.config.gourmetBanheiro ? 'checked' : ''}>
                    <span>Banheiro</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="cc-comodos-resumo" id="cc-comodos-resumo"></div>
          </div>
        </section>

        <!-- Materiais -->
        <section class="cc-section cc-section-materiais">
          <div class="cc-section-header" data-target="materiais-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">3</span>
              ${t.materiais}
            </h2>
            <button class="cc-btn-toggle" data-target="materiais-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="cc-section-content" id="materiais-content">
            <div class="cc-grid cc-grid-3">
              ${buildMaterialSelect('janelas', 'Janelas')}
              ${buildMaterialSelect('portas', 'Portas Internas')}
              ${buildMaterialSelect('pisos', 'Pisos')}
              ${buildMaterialSelect('telhados', 'Telhado', 'telhado')}
              ${buildMaterialSelect('forros', 'Forro', 'forro')}
            </div>
          </div>
        </section>

        <!-- Extras -->
        <section class="cc-section cc-section-extras">
          <div class="cc-section-header" data-target="extras-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">4</span>
              ${t.extras}
            </h2>
            <button class="cc-btn-toggle" data-target="extras-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="cc-section-content" id="extras-content">
            <div class="cc-extras-grid">
              ${buildExtrasSection()}
            </div>
          </div>
        </section>

        <!-- Mão de Obra -->
        <section class="cc-section cc-section-mao-obra">
          <div class="cc-section-header" data-target="mao-obra-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">5</span>
              ${t.maoDeObra}
            </h2>
            <div class="cc-header-actions">
              <label class="cc-select-all" title="Marcar/Desmarcar todos">
                <input type="checkbox" id="cc-mao-obra-select-all" checked>
                <span>Todos</span>
              </label>
              <button class="cc-btn-toggle rotated" data-target="mao-obra-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div class="cc-section-content collapsed" id="mao-obra-content">
            <div class="cc-grid cc-grid-auto">
              ${buildMaoDeObraCheckboxes()}
            </div>
          </div>
        </section>

        <!-- Custos Adicionais -->
        <section class="cc-section cc-section-custos-adicionais">
          <div class="cc-section-header" data-target="custos-adicionais-content">
            <h2 class="cc-section-title">
              <span class="cc-step-badge">6</span>
              Projetos e Taxas
            </h2>
            <div class="cc-header-actions">
              <label class="cc-select-all" title="Marcar/Desmarcar todos">
                <input type="checkbox" id="cc-custos-select-all" checked>
                <span>Todos</span>
              </label>
              <button class="cc-btn-toggle rotated" data-target="custos-adicionais-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div class="cc-section-content collapsed" id="custos-adicionais-content">
            <div class="cc-grid cc-grid-auto">
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
      <label class="cc-checkbox">
        <input type="checkbox" data-profissional="${key}" ${state.maoDeObra[key] ? 'checked' : ''}>
        <span>${info.nome} <span class="cc-percent">(${info.percentualObra}%)</span></span>
      </label>
    `).join('');
  }

  function buildExtrasSection() {
    return `
      <!-- Piscina -->
      <div class="cc-extra-card">
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

      <!-- Piso Externo / Pátio -->
      <div class="cc-extra-card">
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
      <div class="cc-extra-card">
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
      <div class="cc-extra-card">
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

      <!-- Edícula - Configuração Completa -->
      <div class="cc-extra-card cc-extra-edicula-expanded">
        <div class="cc-extra-header">
          <label class="cc-switch">
            <input type="checkbox" id="cc-extra-edicula">
            <span class="cc-switch-slider"></span>
          </label>
          <span class="cc-extra-name">🏠 Edícula / Casa de Hóspedes</span>
        </div>
        <div class="cc-extra-options" id="cc-edicula-options" style="display:none;">
          <p class="cc-hint" style="margin-bottom: 12px;">Configure os cômodos e características da edícula:</p>

          <!-- Padrão de acabamento da edícula -->
          <div class="cc-grid cc-grid-2" style="margin-bottom: 12px;">
            <div class="cc-field">
              <label>Padrão de Acabamento</label>
              <select id="cc-edicula-tipo">
                ${Object.entries(data.extras.edicula).map(([key, info]) =>
                  `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorM2)}/m²</option>`
                ).join('')}
              </select>
            </div>
            <div class="cc-field">
              <label>Área Total (calculada ou manual)</label>
              <div class="cc-input-group">
                <input type="number" id="cc-edicula-m2" value="20" min="10" max="200">
                <span>m²</span>
              </div>
            </div>
          </div>

          <!-- Cômodos da edícula -->
          <div class="cc-grid cc-grid-4" style="margin-bottom: 8px;">
            <div class="cc-field">
              <label>Quartos</label>
              <input type="number" id="cc-edicula-quartos" value="0" min="0" max="5">
            </div>
            <div class="cc-field">
              <label>Suítes</label>
              <input type="number" id="cc-edicula-suites" value="0" min="0" max="3">
            </div>
            <div class="cc-field">
              <label>Banheiros extras</label>
              <input type="number" id="cc-edicula-banheiros" value="0" min="0" max="3">
            </div>
            <div class="cc-field">
              <label>Vagas garagem</label>
              <input type="number" id="cc-edicula-garagem" value="0" min="0" max="3">
            </div>
          </div>

          <!-- Características da edícula -->
          <div class="cc-grid cc-grid-4" style="margin-bottom: 8px;">
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-sala">
                Sala
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-cozinha">
                Cozinha
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-area-servico">
                Área de Serviço
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-escritorio">
                Escritório
              </label>
            </div>
          </div>

          <!-- Extras da edícula -->
          <div class="cc-grid cc-grid-4">
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-churrasqueira">
                Churrasqueira
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-lareira">
                Lareira
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-varanda">
                Varanda
              </label>
            </div>
            <div class="cc-field cc-field-checkbox">
              <label>
                <input type="checkbox" id="cc-edicula-piscina">
                Piscina
              </label>
            </div>
          </div>

          <div class="cc-edicula-resumo" id="cc-edicula-resumo" style="margin-top: 12px; padding: 8px; background: var(--cc-bg); border-radius: 4px; font-size: 13px;"></div>
        </div>
      </div>

      <!-- Energia Solar -->
      <div class="cc-extra-card">
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
      <div class="cc-extra-card">
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
      <div class="cc-extra-card">
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
      <div class="cc-extra-card">
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
        <label class="cc-checkbox">
          <input type="checkbox" data-custo="${c.key}" ${state.custosAdicionais[c.key] ? 'checked' : ''}>
          <span>${c.label} <span class="cc-percent">${valorStr}</span></span>
        </label>
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

    // Atualizar visibilidade de seções baseado no tipo de estrutura
    updateFormForTipo();
  }

  // Atualiza visibilidade de campos e seções baseado no tipo de imóvel
  function updateFormForTipo() {
    const isApartamento = state.config.tipoEstrutura === 'apartamento';

    // Extras que NÃO se aplicam a apartamentos
    const extrasNaoAplicaveis = [
      'cc-extra-piscina',
      'cc-extra-muro',
      'cc-extra-portao',
      'cc-extra-edicula',
      'cc-extra-garagem',
      'cc-extra-piso-externo',
      'cc-extra-solar',
      'cc-extra-aquecedor'
    ];

    // Seções/campos que NÃO se aplicam a apartamentos
    const camposNaoAplicaveis = [
      'cc-terreno-section',
      'cc-forro-section'
    ];

    // Mostrar/ocultar extras não aplicáveis
    extrasNaoAplicaveis.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const itemEl = el.closest('.cc-extra-card');
        if (itemEl) {
          itemEl.style.display = isApartamento ? 'none' : '';
          // Desmarcar se estiver oculto
          if (isApartamento && el.checked) {
            el.checked = false;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });

    // Mostrar/ocultar seções de materiais não aplicáveis a apartamentos
    // Apartamentos não têm telhado próprio nem forro externo
    const materiaisNaoAplicaveis = ['cc-material-forros', 'cc-material-telhados'];
    materiaisNaoAplicaveis.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        const container = select.closest('.cc-field');
        if (container) {
          container.style.display = isApartamento ? 'none' : '';
        }
      }
    });

    // Mostrar aviso específico para apartamentos
    let avisoApto = document.getElementById('cc-aviso-apartamento');
    if (isApartamento) {
      if (!avisoApto) {
        const extrasSection = document.querySelector('.cc-section-extras');
        if (extrasSection) {
          avisoApto = document.createElement('div');
          avisoApto.id = 'cc-aviso-apartamento';
          avisoApto.className = 'cc-aviso-tipo';
          avisoApto.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Apartamento selecionado: itens como terreno, muro, portão e edícula não se aplicam e foram ocultados.</span>
          `;
          extrasSection.insertBefore(avisoApto, extrasSection.querySelector('.cc-section-content'));
        }
      }
      if (avisoApto) avisoApto.style.display = 'flex';
    } else {
      if (avisoApto) avisoApto.style.display = 'none';
    }

    // Recalcular quando muda o tipo (só se a função já estiver definida)
    if (typeof calcularCusto === 'function') {
      calcularCusto();
    }
  }

  // Atualiza o campo de ajuste de localização baseado na cidade detectada pelo parser
  function updateLocalizacaoAjuste() {
    const container = document.getElementById('cc-localizacao-ajuste');
    const infoEl = document.getElementById('cc-localizacao-info');
    const selectEl = document.getElementById('cc-ajuste-localizacao');

    if (!container) return;

    // Usar cidade detectada pelo parser
    const cidadeInfo = state.config.cidadeInfo;
    const cidade = cidadeInfo && cidadeInfo.cidade;

    // Mostrar o campo se temos cidade detectada
    if (cidade) {
      container.style.display = 'block';

      // Atualizar informação da localização
      if (infoEl) {
        let infoText = `Cidade detectada: <strong>${cidade}</strong>`;
        if (cidadeInfo.nobre) {
          infoText += ' (bairro nobre)';
        } else if (cidadeInfo.litoral) {
          infoText += ' (litoral)';
        } else if (cidadeInfo.turistico) {
          infoText += ' (turístico)';
        }
        infoEl.innerHTML = infoText;
      }

      // Sugerir ajuste baseado nas características da cidade
      if (selectEl && state.config.ajusteLocalizacao === undefined) {
        let ajusteSugerido = 0;
        if (cidadeInfo.nobre) {
          ajusteSugerido = 120;
        } else if (cidadeInfo.litoral && cidadeInfo.turistico) {
          ajusteSugerido = 80;
        } else if (cidadeInfo.turistico) {
          ajusteSugerido = 40;
        } else if (cidadeInfo.tipo === 'capital') {
          ajusteSugerido = 25;
        }

        // Encontrar a opção mais próxima
        const opcoes = Array.from(selectEl.options);
        const opcaoMaisProxima = opcoes.find(o => parseInt(o.value) === ajusteSugerido);
        if (opcaoMaisProxima) {
          selectEl.value = ajusteSugerido.toString();
          state.config.ajusteLocalizacao = ajusteSugerido;
        }
      }
    } else {
      container.style.display = 'none';
      state.config.ajusteLocalizacao = undefined;
    }
  }

  function updateComodosResumo() {
    const resumo = document.getElementById('cc-comodos-resumo');
    if (!resumo) return;

    const quartos = state.config.numQuartos;
    const suites = state.config.numSuites;
    const banheiros = state.config.numBanheiros;
    const escritorios = state.config.numEscritorios || 0;
    const garagem = state.config.garagemVagas || 0;
    const totalBanheiros = suites + banheiros;

    // Calcular custo adicional estimado por cômodo
    const custoComodos = data.custoPorComodo;
    const custoQuartos = quartos * custoComodos.quarto.custoBase;
    const custoSuites = suites * custoComodos.suite.custoBase;
    const custoBanheiros = banheiros * custoComodos.banheiro.custoBase;
    let totalComodosExtra = custoQuartos + custoSuites + custoBanheiros;

    // Adicionar custos dos novos cômodos
    if (escritorios > 0) totalComodosExtra += escritorios * 5000;
    if (state.config.temDespensa) totalComodosExtra += 3000;
    if (state.config.temVaranda) totalComodosExtra += 8000;

    // Listar cômodos configurados
    const comodosLista = [];
    if (quartos > 0) comodosLista.push(`${quartos} quarto${quartos > 1 ? 's' : ''}`);
    if (suites > 0) comodosLista.push(`${suites} suíte${suites > 1 ? 's' : ''}`);
    if (banheiros > 0) comodosLista.push(`${banheiros} banheiro${banheiros > 1 ? 's' : ''}`);
    if (escritorios > 0) comodosLista.push(`${escritorios} escritório${escritorios > 1 ? 's' : ''}`);
    if (garagem > 0) comodosLista.push(`${garagem} vaga${garagem > 1 ? 's' : ''}`);

    resumo.innerHTML = `
      <div class="cc-comodos-info">
        <span><strong>Cômodos:</strong> ${comodosLista.join(', ') || 'Nenhum configurado'}</span>
        <span><strong>Total de banheiros:</strong> ${totalBanheiros} (${suites} nas suítes + ${banheiros} extras)</span>
        <span class="cc-comodos-custo">Custo adicional (hidráulica, louças, etc): <strong>R$ ${formatNumber(totalComodosExtra)}</strong></span>
      </div>
    `;
  }

  function updateEdiculaArea() {
    // Calcula a área estimada da edícula com base nos cômodos e características
    const ed = state.edicula || {};
    let areaEstimada = 0;

    // Área por tipo de cômodo
    const areaPorComodo = {
      quartos: 12,       // ~12m² por quarto
      suites: 20,        // ~20m² por suíte (quarto + banheiro)
      banheiros: 5,      // ~5m² por banheiro extra
      garagem: 15,       // ~15m² por vaga
      sala: 15,          // ~15m² sala
      cozinha: 10,       // ~10m² cozinha
      areaServico: 6,    // ~6m² área de serviço
      escritorio: 10,    // ~10m² escritório
      churrasqueira: 8,  // ~8m² área churrasqueira
      lareira: 3,        // ~3m² adicional para lareira
      varanda: 10,       // ~10m² varanda
      piscina: 0         // não adiciona à área coberta
    };

    // Cômodos com quantidade
    areaEstimada += (ed.quartos || 0) * areaPorComodo.quartos;
    areaEstimada += (ed.suites || 0) * areaPorComodo.suites;
    areaEstimada += (ed.banheiros || 0) * areaPorComodo.banheiros;
    areaEstimada += (ed.garagem || 0) * areaPorComodo.garagem;

    // Cômodos boolean
    if (ed.sala) areaEstimada += areaPorComodo.sala;
    if (ed.cozinha) areaEstimada += areaPorComodo.cozinha;
    if (ed.areaServico) areaEstimada += areaPorComodo.areaServico;
    if (ed.escritorio) areaEstimada += areaPorComodo.escritorio;
    if (ed.churrasqueira) areaEstimada += areaPorComodo.churrasqueira;
    if (ed.lareira) areaEstimada += areaPorComodo.lareira;
    if (ed.varanda) areaEstimada += areaPorComodo.varanda;

    // Se não há nada selecionado, usar mínimo padrão
    if (areaEstimada < 10) areaEstimada = 20;

    // Atualizar o campo de área
    const areaInput = document.getElementById('cc-edicula-m2');
    if (areaInput) {
      areaInput.value = Math.round(areaEstimada);
    }

    // Atualizar resumo da edícula
    const resumo = document.getElementById('cc-edicula-resumo');
    if (resumo) {
      const items = [];
      if (ed.quartos > 0) items.push(`${ed.quartos} quarto${ed.quartos > 1 ? 's' : ''}`);
      if (ed.suites > 0) items.push(`${ed.suites} suíte${ed.suites > 1 ? 's' : ''}`);
      if (ed.banheiros > 0) items.push(`${ed.banheiros} banheiro${ed.banheiros > 1 ? 's' : ''}`);
      if (ed.garagem > 0) items.push(`${ed.garagem} vaga${ed.garagem > 1 ? 's' : ''}`);
      if (ed.sala) items.push('sala');
      if (ed.cozinha) items.push('cozinha');
      if (ed.areaServico) items.push('área serviço');
      if (ed.escritorio) items.push('escritório');
      if (ed.churrasqueira) items.push('churrasqueira');
      if (ed.lareira) items.push('lareira');
      if (ed.varanda) items.push('varanda');
      if (ed.piscina) items.push('piscina');

      if (items.length > 0) {
        resumo.innerHTML = `<strong>Edícula:</strong> ${items.join(', ')} (${Math.round(areaEstimada)}m² estimados)`;
      } else {
        resumo.innerHTML = `<strong>Edícula:</strong> ${Math.round(areaEstimada)}m² (básica)`;
      }
    }
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

  // Parser de texto para extrair características do imóvel
  function parseDescricao(texto) {
    const textoLower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const resultado = {
      encontrados: [],
      config: {}
    };

    // Função auxiliar para verificar se um termo está negado
    function isNegado(termo) {
      const negacoes = [
        new RegExp(`nao\\s+tem\\s+${termo}`, 'i'),
        new RegExp(`sem\\s+${termo}`, 'i'),
        new RegExp(`nao\\s+possui\\s+${termo}`, 'i'),
        new RegExp(`nao\\s+ha\\s+${termo}`, 'i'),
        new RegExp(`nao\\s+inclui\\s+${termo}`, 'i')
      ];
      return negacoes.some(regex => regex.test(textoLower));
    }

    // Área em m² - detecção inteligente, ignorando áreas de cômodos específicos
    // Lista de termos que indicam cômodos/espaços específicos (não é a área total da casa)
    const comodoTermos = [
      'salao', 'sala', 'cozinha', 'quarto', 'banheiro', 'churrasqueira',
      'varanda', 'sacada', 'escritorio', 'closet', 'lavabo', 'despensa',
      'edicula', 'garagem', 'suite', 'piscina', 'area gourmet', 'espaco gourmet',
      'campeiro', 'deposito', 'lavanderia', 'terraço', 'deck', 'quintal',
      'jardim', 'corredor', 'hall', 'dispensa', 'sotao', 'porao'
    ];

    // Função para verificar se um número de área está associado a um cômodo
    function isAreaDeComodo(textoOriginal, posicaoNumero) {
      // Pegar contexto antes do número (últimos 60 caracteres)
      const contextoBefore = textoOriginal.slice(Math.max(0, posicaoNumero - 60), posicaoNumero)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Verificar se algum termo de cômodo aparece no contexto próximo
      for (const comodo of comodoTermos) {
        // Procurar o termo seguido de qualquer coisa até o final (próximo ao número)
        if (contextoBefore.includes(comodo)) {
          // Verificar se o termo está nas últimas 30 caracteres (bem próximo do número)
          const ultimos30 = contextoBefore.slice(-30);
          if (ultimos30.includes(comodo)) {
            return true;
          }
        }
      }

      // Verificar padrões específicos que indicam cômodo
      const padroesComodo = [
        /\(\s*\d+\s*m[²2]?\s*\)/i,  // Área entre parênteses geralmente é de cômodo
        /com\s+\d+\s*m[²2]/i,       // "com Xm²" geralmente descreve cômodo
      ];

      const contextoComNumero = textoOriginal.slice(Math.max(0, posicaoNumero - 20), posicaoNumero + 10)
        .toLowerCase();

      for (const padrao of padroesComodo) {
        if (padrao.test(contextoComNumero)) {
          return true;
        }
      }

      return false;
    }

    // Padrão 1: Área explícita total/construída/privativa (maior prioridade)
    // Aceita decimais com vírgula (BR) ou ponto: 48,37m² ou 48.37m²
    const areaTotalPatterns = [
      /area\s*(?:total|construida|privativa|util)\s*(?:de\s*)?:?\s*(\d+(?:[,\.]\d+)?)\s*m[²2]?/i,
      /(\d+(?:[,\.]\d+)?)\s*m[²2]?\s*(?:de\s*)?area\s*(?:total|construida|privativa|util)/i,
      /(?:casa|imovel|apartamento|apto|sobrado|residencia)\s+(?:de\s+|com\s+)?(\d+(?:[,\.]\d+)?)\s*m[²2]/i,
      /(\d+(?:[,\.]\d+)?)\s*m[²2]\s*(?:de\s*)?(?:casa|imovel|apartamento|apto|sobrado|residencia)/i
    ];

    let areaEncontrada = false;
    for (const pattern of areaTotalPatterns) {
      const match = textoLower.match(pattern);
      if (match) {
        // Converter vírgula para ponto e parsear como float, depois arredondar
        const areaStr = match[1].replace(',', '.');
        const area = Math.round(parseFloat(areaStr));
        if (area >= 20 && area <= 5000) {
          resultado.config.areaTotal = area;
          resultado.encontrados.push(`Área: ${area}m²`);
          areaEncontrada = true;
          break;
        }
      }
    }

    // Padrão 2: Se não encontrou área explícita, buscar m² que NÃO esteja associado a cômodo
    if (!areaEncontrada) {
      const areaRegex = /(\d+(?:[,\.]\d+)?)\s*m[²2]/gi;
      let match;
      const areasEncontradas = [];

      while ((match = areaRegex.exec(textoLower)) !== null) {
        const areaStr = match[1].replace(',', '.');
        const area = Math.round(parseFloat(areaStr));
        if (area >= 20 && area <= 5000) {
          // Verificar se NÃO está associado a um cômodo específico
          if (!isAreaDeComodo(textoLower, match.index)) {
            areasEncontradas.push(area);
          }
        }
      }

      // Usar a maior área encontrada que não seja de cômodo
      if (areasEncontradas.length > 0) {
        const maiorArea = Math.max(...areasEncontradas);
        resultado.config.areaTotal = maiorArea;
        resultado.encontrados.push(`Área: ${maiorArea}m²`);
      }
    }

    // Tamanho do terreno/lote
    let terrenoEncontrado = false;

    // Padrão 1: Dimensões como "15x30", "10 x 20", "12m x 25m"
    const dimensoesRegex = /terreno\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?)?\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i;
    const matchDimensoes = texto.match(dimensoesRegex);
    if (matchDimensoes) {
      const largura = parseFloat(matchDimensoes[1].replace(',', '.'));
      const comprimento = parseFloat(matchDimensoes[2].replace(',', '.'));
      const areaTerreno = Math.round(largura * comprimento);
      if (areaTerreno >= 50 && areaTerreno <= 100000) {
        resultado.config.areaTerreno = areaTerreno;
        resultado.encontrados.push(`Terreno: ${areaTerreno}m² (${largura}x${comprimento})`);
        terrenoEncontrado = true;
      }
    }

    // Padrão 2: Dimensões sem "terreno" na frente: "15x30" seguido de contexto de terreno
    if (!terrenoEncontrado) {
      const dimensoesSimplesRegex = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
      let matchSimples;
      while ((matchSimples = dimensoesSimplesRegex.exec(texto)) !== null) {
        // Verificar contexto (últimos 30 ou próximos 30 caracteres devem ter "terreno", "lote", "sítio", etc)
        const contextoBefore = texto.slice(Math.max(0, matchSimples.index - 30), matchSimples.index).toLowerCase();
        const contextoAfter = texto.slice(matchSimples.index, matchSimples.index + matchSimples[0].length + 30).toLowerCase();
        const contexto = contextoBefore + contextoAfter;

        if (/terreno|lote|sitio|chacara|area\s+total/i.test(contexto)) {
          const largura = parseFloat(matchSimples[1].replace(',', '.'));
          const comprimento = parseFloat(matchSimples[2].replace(',', '.'));
          const areaTerreno = Math.round(largura * comprimento);
          if (areaTerreno >= 50 && areaTerreno <= 100000) {
            resultado.config.areaTerreno = areaTerreno;
            resultado.encontrados.push(`Terreno: ${areaTerreno}m² (${largura}x${comprimento})`);
            terrenoEncontrado = true;
            break;
          }
        }
      }
    }

    // Padrão 3: Área direta do terreno em m²
    if (!terrenoEncontrado) {
      const areaTerrenoPatterns = [
        /terreno\s*(?:de\s*)?(\d+)\s*m[²2]/i,
        /lote\s*(?:de\s*)?(\d+)\s*m[²2]/i,
        /(\d+)\s*m[²2]\s*(?:de\s*)?terreno/i,
        /(\d+)\s*m[²2]\s*(?:de\s*)?lote/i
      ];

      for (const pattern of areaTerrenoPatterns) {
        const match = texto.match(pattern);
        if (match) {
          const areaTerreno = parseInt(match[1]);
          if (areaTerreno >= 50 && areaTerreno <= 100000) {
            resultado.config.areaTerreno = areaTerreno;
            resultado.encontrados.push(`Terreno: ${areaTerreno}m²`);
            terrenoEncontrado = true;
            break;
          }
        }
      }
    }

    // Padrão 4: Quantidade de terrenos/lotes (ex: "2 terrenos" = 2 x 360m²)
    // Tamanho padrão de um lote urbano: 12x30 = 360m²
    if (!terrenoEncontrado) {
      const qtdTerrenosPatterns = [
        /(\d+)\s*terrenos?(?!\s*m[²2])/i,
        /(\d+)\s*lotes?(?!\s*m[²2])/i
      ];

      for (const pattern of qtdTerrenosPatterns) {
        const match = texto.match(pattern);
        if (match) {
          const qtdTerrenos = parseInt(match[1]);
          if (qtdTerrenos >= 1 && qtdTerrenos <= 20) {
            const areaPorTerreno = 360; // 12x30m padrão
            const areaTerreno = qtdTerrenos * areaPorTerreno;
            resultado.config.areaTerreno = areaTerreno;
            resultado.encontrados.push(`Terreno: ${areaTerreno}m² (${qtdTerrenos} lote${qtdTerrenos > 1 ? 's' : ''} x ${areaPorTerreno}m²)`);
            terrenoEncontrado = true;
            break;
          }
        }
      }
    }

    // Quartos
    const quartosPatterns = [
      /(\d+)\s*quartos?/i,
      /(\d+)\s*dormitorios?/i,
      /(\d+)\s*dorms?/i
    ];
    for (const pattern of quartosPatterns) {
      const match = texto.match(pattern);
      if (match) {
        resultado.config.numQuartos = parseInt(match[1]);
        resultado.encontrados.push(`Quartos: ${match[1]}`);
        break;
      }
    }

    // Suítes
    const suitesPatterns = [
      /(\d+)\s*suites?/i,
      /sendo\s*(\d+)\s*suites?/i
    ];
    for (const pattern of suitesPatterns) {
      const match = texto.match(pattern);
      if (match) {
        resultado.config.numSuites = parseInt(match[1]);
        resultado.encontrados.push(`Suítes: ${match[1]}`);
        if (resultado.config.numQuartos && resultado.config.numSuites) {
          const quartosNormais = resultado.config.numQuartos - resultado.config.numSuites;
          if (quartosNormais >= 0) {
            resultado.config.numQuartos = quartosNormais;
            resultado.encontrados = resultado.encontrados.filter(e => !e.startsWith('Quartos:'));
            resultado.encontrados.push(`Quartos (sem suíte): ${quartosNormais}`);
          }
        }
        break;
      }
    }

    // Banheiros
    const banheirosPatterns = [
      /(\d+)\s*banheiros?/i,
      /(\d+)\s*wc/i,
      /(\d+)\s*sanitarios?/i
    ];
    for (const pattern of banheirosPatterns) {
      const match = texto.match(pattern);
      if (match) {
        let numBanheiros = parseInt(match[1]);
        if (resultado.config.numSuites) {
          numBanheiros = Math.max(0, numBanheiros - resultado.config.numSuites);
        }
        resultado.config.numBanheiros = numBanheiros;
        resultado.encontrados.push(`Banheiros extras: ${numBanheiros}`);
        break;
      }
    }

    // Lavabo
    if (textoLower.includes('lavabo') && !isNegado('lavabo')) {
      resultado.config.numBanheiros = (resultado.config.numBanheiros || 0) + 1;
      if (!resultado.encontrados.some(e => e.includes('Banheiros'))) {
        resultado.encontrados.push(`Banheiros extras: ${resultado.config.numBanheiros}`);
      }
    }

    // Estado/Região - Usar base de dados CidadesBrasil para identificação completa
    let estadoEncontrado = false;
    let cidadeInfo = null;

    // Tentar usar a base de dados CidadesBrasil se disponível
    if (typeof CidadesBrasil !== 'undefined') {
      cidadeInfo = CidadesBrasil.encontrarCidade(textoLower);
      if (cidadeInfo && cidadeInfo.uf) {
        resultado.config.estado = cidadeInfo.uf;
        resultado.config.cidadeInfo = cidadeInfo;

        // Construir descrição da localização
        let descricao = `${cidadeInfo.uf}`;
        if (cidadeInfo.cidade) {
          descricao = `${cidadeInfo.uf} (${cidadeInfo.cidade})`;
        }
        if (cidadeInfo.nobre) {
          descricao += ' - Bairro Nobre';
        } else if (cidadeInfo.litoral) {
          descricao += ' - Litoral';
        } else if (cidadeInfo.turistico) {
          descricao += ' - Turístico';
        }

        resultado.encontrados.push(`Região: ${descricao}`);
        estadoEncontrado = true;

        // Determinar tipo de localização para cálculo do terreno
        if (cidadeInfo.nobre) {
          resultado.config.tipoLocalizacao = 'nobre';
        } else if (cidadeInfo.litoral && cidadeInfo.turistico) {
          resultado.config.tipoLocalizacao = 'praia';
        } else if (cidadeInfo.tipo === 'capital') {
          resultado.config.tipoLocalizacao = 'urbano';
        } else if (cidadeInfo.tipo === 'metropole') {
          resultado.config.tipoLocalizacao = 'urbano';
        } else if (cidadeInfo.turistico) {
          resultado.config.tipoLocalizacao = 'nobre'; // turístico valoriza
        } else if (cidadeInfo.tipo === 'interior') {
          resultado.config.tipoLocalizacao = 'periferia';
        } else {
          resultado.config.tipoLocalizacao = 'urbano';
        }
      }
    }

    // Fallback: buscar por nome de estado se CidadesBrasil não encontrou
    if (!estadoEncontrado) {
      const estadosMap = {
        'rio grande do sul': 'RS', 'gaucho': 'RS',
        'santa catarina': 'SC', 'catarinense': 'SC',
        'parana': 'PR', 'paranaense': 'PR',
        'sao paulo': 'SP', 'paulista': 'SP',
        'rio de janeiro': 'RJ', 'carioca': 'RJ', 'fluminense': 'RJ',
        'minas gerais': 'MG', 'mineiro': 'MG',
        'bahia': 'BA', 'baiano': 'BA',
        'pernambuco': 'PE', 'pernambucano': 'PE',
        'ceara': 'CE', 'cearense': 'CE',
        'distrito federal': 'DF',
        'goias': 'GO', 'goiano': 'GO',
        'espirito santo': 'ES', 'capixaba': 'ES',
        'mato grosso do sul': 'MS',
        'mato grosso': 'MT',
        'amazonas': 'AM',
        'maranhao': 'MA',
        'piaui': 'PI',
        'rio grande do norte': 'RN', 'potiguar': 'RN',
        'paraiba': 'PB',
        'alagoas': 'AL', 'alagoano': 'AL',
        'sergipe': 'SE',
        'tocantins': 'TO',
        'rondonia': 'RO',
        'acre': 'AC',
        'roraima': 'RR',
        'amapa': 'AP'
      };

      for (const [termo, uf] of Object.entries(estadosMap)) {
        const regex = new RegExp(`\\b${termo}\\b`, 'i');
        if (regex.test(textoLower)) {
          resultado.config.estado = uf;
          resultado.encontrados.push(`Região: ${uf}`);
          estadoEncontrado = true;
          break;
        }
      }
    }

    // Estado de conservação - usar word boundaries para evitar falsos positivos (ex: "cobra" contém "obra")
    const conservacaoMap = {
      'nova': ['\\bnov[oa]\\b', '\\brecem construid[oa]\\b', '\\bzerad[oa]\\b', '\\bnunca habitad[oa]\\b', '\\bnunca morad[oa]\\b', '\\bnunca usad[oa]\\b', '\\bsem uso\\b', '\\bconstrucao nova\\b', '\\bprimeir[oa] morador\\b', '\\b0\\s*km\\b'],
      'bom': ['\\bbom estado\\b', '\\bbem conservad[ao]\\b', '\\bconservad[ao]\\b', '\\botimo estado\\b', '\\bexcelente estado\\b'],
      'medio': ['\\bmedio estado\\b', '\\bestado regular\\b', '\\busad[ao]\\b'],
      'ruim': ['\\bmal estado\\b', '\\bmau estado\\b', '\\bprecisa de reforma\\b', '\\breformar\\b', '\\bdeteriorad[ao]\\b', '\\bantig[ao]\\b'],
      'so_estrutura': ['\\bso estrutura\\b', '\\bapenas estrutura\\b', '\\binacabad[ao]\\b', '\\bem construcao\\b', '\\bna obra\\b', '\\bem obra\\b']
    };
    for (const [key, termos] of Object.entries(conservacaoMap)) {
      for (const termo of termos) {
        const regex = new RegExp(termo, 'i');
        if (regex.test(textoLower)) {
          resultado.config.estadoConservacao = key;
          const nomeConservacao = data.estadoConservacao[key]?.nome || key;
          resultado.encontrados.push(`Conservação: ${nomeConservacao}`);
          break;
        }
      }
      if (resultado.config.estadoConservacao) break;
    }

    // Se não detectou conservação, assumir bom estado (padrão para imóveis à venda)
    if (!resultado.config.estadoConservacao) {
      resultado.config.estadoConservacao = 'bom';
    }

    // Tipo de estrutura - com priorização inteligente
    // PRIORIDADE: casa/apartamento > chácara (mesmo que mencione "sítio" no contexto de terreno)

    // Verificar se tem "casa" explicitamente (alta prioridade)
    const temCasa = /\bcasa\b/i.test(textoLower);
    const temSobrado = /\bsobrado\b/i.test(textoLower) ||
                       /\bdois\s*(andares|pisos)\b/i.test(textoLower) ||
                       /\b2\s*(andares|pisos)\b/i.test(textoLower) ||
                       /\bduplex\b/i.test(textoLower);

    // Verificar chácara/sítio - MAS excluir padrões que são só descrição de terreno
    // "mini sítio", "tipo sítio", "como sítio" não contam
    const temSitioNoTexto = /\bsitio\b/i.test(textoLower);
    const sitioEhDescricaoTerreno = /mini\s*sitio/i.test(textoLower) ||
                                    /tipo\s*sitio/i.test(textoLower) ||
                                    /como\s*(?:um\s*)?sitio/i.test(textoLower) ||
                                    /\(.*sitio.*\)/i.test(textoLower); // sítio entre parênteses

    const temChacaraReal = /\bchacara\b/i.test(textoLower) ||
                          /\bfazenda\b/i.test(textoLower) ||
                          /\bcasa de campo\b/i.test(textoLower) ||
                          /\bzona rural\b/i.test(textoLower) ||
                          (temSitioNoTexto && !sitioEhDescricaoTerreno && !temCasa);

    const estruturaMap = {
      'apartamento': ['\\bapartamento\\b', '\\bapto\\b', '\\bflat\\b', '\\bcobertura\\b', '\\bloft\\b'],
      'terrea': ['\\bterrea\\b', '\\bterreo\\b', '\\bcasa terrea\\b', '\\bum andar\\b', '\\b1 andar\\b', '\\bunico piso\\b'],
      'sobrado': ['\\bsobrado\\b', '\\bdois andares\\b', '\\b2 andares\\b', '\\bduplex\\b', '\\bdois pisos\\b', '\\b2 pisos\\b'],
      'meia_agua': ['\\bmeia agua\\b', '\\bmeia-agua\\b', '\\bkitnet\\b', '\\bconjugado\\b'],
      'geminada': ['\\bgeminada\\b', '\\bcasa geminada\\b']
    };

    let tipoEncontrado = false;

    // Tentar encontrar tipo específico primeiro
    for (const [key, termos] of Object.entries(estruturaMap)) {
      for (const termo of termos) {
        const regex = new RegExp(termo, 'i');
        if (regex.test(textoLower)) {
          resultado.config.tipoEstrutura = key;
          const nomeEstrutura = data.tiposEstrutura[key]?.nome || key;
          resultado.encontrados.push(`Tipo: ${nomeEstrutura}`);
          tipoEncontrado = true;
          break;
        }
      }
      if (tipoEncontrado) break;
    }

    // Se não encontrou tipo específico mas tem "casa", assumir térrea (ou sobrado se indicado)
    // PRIORIDADE: "casa" sempre vence sobre "chácara" quando ambos presentes
    if (!tipoEncontrado && temCasa) {
      if (temSobrado) {
        resultado.config.tipoEstrutura = 'sobrado';
        resultado.encontrados.push(`Tipo: ${data.tiposEstrutura['sobrado']?.nome || 'Sobrado'}`);
      } else {
        resultado.config.tipoEstrutura = 'terrea';
        resultado.encontrados.push(`Tipo: ${data.tiposEstrutura['terrea']?.nome || 'Casa Térrea'}`);
      }
      tipoEncontrado = true;
    }

    // Só usar chácara se for realmente uma chácara E não tem "casa" no texto
    if (!tipoEncontrado && temChacaraReal && !temCasa) {
      resultado.config.tipoEstrutura = 'chacara';
      resultado.encontrados.push(`Tipo: ${data.tiposEstrutura['chacara']?.nome || 'Chácara/Sítio'}`);
    }

    // Tipo de construção
    const construcaoMap = {
      'alvenaria': ['alvenaria', 'tijolo', 'tijolos', 'concreto', 'bloco'],
      'steel_frame': ['steel frame', 'steelframe', 'estrutura metalica'],
      'wood_frame': ['wood frame', 'woodframe', 'casa de madeira'],
      'eps': ['eps', 'isopor', 'poliestireno']
    };
    for (const [key, termos] of Object.entries(construcaoMap)) {
      for (const termo of termos) {
        if (textoLower.includes(termo)) {
          resultado.config.tipoConstrucao = key;
          const nomeConstrucao = data.tiposConstrucao[key]?.nome || key;
          resultado.encontrados.push(`Construção: ${nomeConstrucao}`);
          break;
        }
      }
      if (resultado.config.tipoConstrucao) break;
    }

    // Padrão de acabamento
    const padraoMap = {
      'popular': ['popular', 'basico', 'economico', 'baixo padrao', 'baixo custo'],
      'medio': ['padrao medio', 'acabamento medio'],
      'alto': ['alto padrao', 'bom acabamento', 'fino acabamento', 'premium'],
      'luxo': ['luxo', 'luxuoso', 'altissimo padrao', 'super luxo']
    };
    for (const [key, termos] of Object.entries(padraoMap)) {
      for (const termo of termos) {
        if (textoLower.includes(termo)) {
          resultado.config.padrao = key;
          const nomePadrao = data.padroes[key]?.nome || key;
          resultado.encontrados.push(`Padrão: ${nomePadrao}`);
          break;
        }
      }
      if (resultado.config.padrao) break;
    }

    // Área de serviço
    if ((textoLower.includes('area de servico') || textoLower.includes('lavanderia')) && !isNegado('area de servico') && !isNegado('lavanderia')) {
      resultado.config.temAreaServico = true;
      resultado.encontrados.push('Área de serviço: Sim');
    }

    // Extras COM VERIFICAÇÃO DE NEGAÇÃO
    resultado.extras = {};

    // Piscina - com detecção de tamanho
    if (textoLower.includes('piscina') && !isNegado('piscina')) {
      resultado.extras.piscina = true;

      // Detectar dimensões da piscina (ex: "piscina 9x4", "piscina de 8x4m")
      const piscinaDimensoesMatch = texto.match(/piscina\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i);
      if (piscinaDimensoesMatch) {
        const comp = parseFloat(piscinaDimensoesMatch[1].replace(',', '.'));
        const larg = parseFloat(piscinaDimensoesMatch[2].replace(',', '.'));
        const areaPiscina = comp * larg;

        // Selecionar o tipo de piscina mais próximo baseado na área
        // Áreas disponíveis: 3x2=6, 4x2=8, 5x3=15, 6x3=18, 7x3=21, 8x4=32
        let tipoPiscina = 'fibra_grande_8x4'; // padrão para piscinas grandes
        if (areaPiscina <= 8) tipoPiscina = 'fibra_pequena_4x2';
        else if (areaPiscina <= 12) tipoPiscina = 'fibra_pequena_4x2';
        else if (areaPiscina <= 16) tipoPiscina = 'fibra_media_5x3';
        else if (areaPiscina <= 20) tipoPiscina = 'fibra_media_6x3';
        else if (areaPiscina <= 24) tipoPiscina = 'fibra_grande_7x3';
        else if (areaPiscina <= 35) tipoPiscina = 'fibra_grande_8x4';
        else tipoPiscina = 'alvenaria_grande_8x4'; // piscinas maiores que 8x4

        resultado.extras.piscinaTipo = tipoPiscina;
        resultado.extras.piscinaArea = areaPiscina;
        resultado.encontrados.push(`Extra: Piscina ${comp}x${larg}m (~${Math.round(areaPiscina)}m²)`);
      } else {
        resultado.encontrados.push('Extra: Piscina');
      }
    }

    // Churrasqueira
    if ((textoLower.includes('churrasqueira') || textoLower.includes('espaco gourmet')) && !isNegado('churrasqueira') && !isNegado('gourmet')) {
      resultado.extras.churrasqueira = true;
      resultado.encontrados.push('Extra: Churrasqueira');
    }

    // Garagem - verificar negação, detectar quantidade de carros e tipo
    const garagemPatterns = [
      /\bgaragem\b/i,
      /\bvaga\b/i,
      /\bvagas\b/i,
      /\d+\s*carros?\b/i,
      /cabe\s*\d+\s*carros?/i,
      /para\s*\d+\s*carros?/i,
      /p\/\s*\d+\s*carros?/i,            // "p/ 4 carros"
      /\bcobertura\s+para\s+carros?\b/i,
      /\bestacionamento\b/i,
      /entrada\s*(?:p(?:ara|\/)?|de)\s*carros?/i,  // "entrada p/carro"
      /area\s*(?:p(?:ara|\/)?|de)\s*\d*\s*carros?/i // "área p/ 4 carros"
    ];

    const temGaragem = garagemPatterns.some(pattern => pattern.test(textoLower));
    if (temGaragem && !isNegado('garagem') && !isNegado('vaga') && !isNegado('carro')) {
      // Detectar quantidade de carros
      const qtdCarrosPatterns = [
        /(\d+)\s*carros?/i,
        /(\d+)\s*vagas?/i,
        /garagem\s*(?:para\s*)?(\d+)/i,
        /cabe\s*(\d+)\s*carros?/i,
        /p\/\s*(\d+)\s*carros?/i  // "p/ 4 carros"
      ];
      let qtdCarros = 1; // default
      for (const pattern of qtdCarrosPatterns) {
        const match = texto.match(pattern);
        if (match && parseInt(match[1]) > 0 && parseInt(match[1]) <= 10) {
          qtdCarros = parseInt(match[1]);
          break;
        }
      }

      // Detectar tipo de garagem (fechada ou aberta/coberta)
      // Para apartamentos: pequenos (<60m²) = aberta, médios/grandes = fechada
      let tipoGaragem = 'coberta'; // default para casas
      let tipoExplicito = false;

      if (/garagem\s*fechada/i.test(texto) || /fechada/i.test(texto) && /garagem/i.test(texto)) {
        tipoGaragem = 'fechada';
        tipoExplicito = true;
      } else if (/garagem\s*aberta/i.test(texto) || /cobert(?:a|ura)/i.test(texto) || /toldo/i.test(texto)) {
        tipoGaragem = 'coberta';
        tipoExplicito = true;
      }

      // Se não foi especificado e é apartamento, definir baseado no tamanho
      // Apartamentos pequenos (<60m²) geralmente têm vaga aberta/descoberta
      // Apartamentos maiores podem ter garagem fechada/box
      if (!tipoExplicito && resultado.config.tipoEstrutura === 'apartamento') {
        const areaApto = resultado.config.areaTotal || 50;
        tipoGaragem = areaApto < 60 ? 'aberta' : 'fechada';
      }

      // Armazenar quantidade e tipo (usado pelos inputs de cômodos)
      resultado.extras.garagemQtd = qtdCarros;
      resultado.extras.garagemTipo = tipoGaragem;

      // Para apartamentos: NÃO marcar o checkbox de extras (garagem externa)
      // Usar apenas os inputs de cômodos para calcular o valor das vagas
      // Para casas: marcar o checkbox de extras (garagem externa/construção)
      const isApartamento = resultado.config.tipoEstrutura === 'apartamento';
      if (!isApartamento) {
        resultado.extras.garagem = true;
      }

      const tipoLabel = tipoGaragem === 'fechada' ? 'fechada' : (tipoGaragem === 'aberta' ? 'aberta' : 'coberta');
      resultado.encontrados.push(`Garagem: ${qtdCarros} vaga${qtdCarros > 1 ? 's' : ''} (${tipoLabel})`);
    }

    // Muro
    if ((textoLower.includes('muro') || textoLower.includes('murado')) && !isNegado('muro')) {
      resultado.extras.muro = true;
      resultado.encontrados.push('Extra: Muro');
    }

    // Portão
    if (textoLower.includes('portao') && !isNegado('portao')) {
      resultado.extras.portao = true;
      resultado.encontrados.push('Extra: Portão');
    }

    // Edícula - incluir salão campeiro, salão de festas, área de lazer externa
    const ediculaPatterns = [
      /\bedicula\b/i,
      /\bdependencia\b/i,
      /\bsalao\s*campeiro\b/i,
      /\bsalao\s*de\s*festas?\b/i,
      /\barea\s*(?:de\s*)?lazer\b/i,
      /\bquiosque\b/i,
      /\bespaco\s*gourmet\b/i,
      /\barea\s*gourmet\b/i
    ];

    const temEdicula = ediculaPatterns.some(pattern => pattern.test(textoLower));
    if (temEdicula && !isNegado('edicula') && !isNegado('salao')) {
      resultado.extras.edicula = true;

      // Detectar área da edícula se especificada
      const areaEdiculaMatch = texto.match(/(?:salao|edicula|quiosque|gourmet)[^0-9]*(\d+)\s*m[²2]/i);
      if (areaEdiculaMatch) {
        resultado.extras.ediculaArea = parseInt(areaEdiculaMatch[1]);
        resultado.encontrados.push(`Extra: Edícula (${areaEdiculaMatch[1]}m²)`);
      } else {
        // Tentar estimar área da edícula pelos cômodos descritos
        // Formato: "edícula com X quartos, sala, cozinha, banheiro"
        const ediculaComodos = texto.match(/edicula\s*com\s*([^,.]+(?:,[^,.]+)*)/i);
        if (ediculaComodos) {
          const descComodos = ediculaComodos[1].toLowerCase();
          let areaEstimada = 0;

          // Quartos na edícula
          const quartosEdMatch = descComodos.match(/(\d+)\s*quartos?/i);
          if (quartosEdMatch) {
            areaEstimada += parseInt(quartosEdMatch[1]) * 12; // 12m² por quarto
          }

          // Sala
          if (/\bsala\b/i.test(descComodos)) {
            areaEstimada += 15; // 15m² para sala
          }

          // Cozinha
          if (/\bcozinha\b/i.test(descComodos)) {
            areaEstimada += 8; // 8m² para cozinha
          }

          // Banheiro
          const banheirosEdMatch = descComodos.match(/(\d+)\s*banheiros?/i);
          if (banheirosEdMatch) {
            areaEstimada += parseInt(banheirosEdMatch[1]) * 4; // 4m² por banheiro
          } else if (/\bbanheiro\b/i.test(descComodos)) {
            areaEstimada += 4;
          }

          // Mínimo de 20m² para edícula
          if (areaEstimada > 0) {
            areaEstimada = Math.max(20, areaEstimada);
            resultado.extras.ediculaArea = areaEstimada;
            resultado.encontrados.push(`Extra: Edícula (~${areaEstimada}m² estimado)`);
          } else {
            resultado.encontrados.push('Extra: Edícula');
          }
        } else {
          resultado.encontrados.push('Extra: Edícula');
        }
      }
    }

    // Cozinha integrada com sala
    const cozinhaIntegradaPatterns = [
      /cozinha\s*(?:americana|integrada)/i,
      /cozinha\s*(?:com|e)\s*sala/i,
      /sala\s*(?:com|e)\s*cozinha/i,
      /conceito\s*aberto/i,
      /open\s*concept/i,
      /ambientes\s*integrados/i
    ];

    const temCozinhaIntegrada = cozinhaIntegradaPatterns.some(pattern => pattern.test(textoLower));
    if (temCozinhaIntegrada && !isNegado('integrada') && !isNegado('americana')) {
      resultado.config.cozinhaIntegrada = true;
      resultado.encontrados.push('Cozinha integrada: Sim');
    }

    // Energia Solar
    if ((textoLower.includes('energia solar') || textoLower.includes('fotovoltaico')) && !isNegado('solar')) {
      resultado.extras.solar = true;
      resultado.encontrados.push('Extra: Energia Solar');
    }

    // Automação
    if ((textoLower.includes('automacao') || textoLower.includes('casa inteligente') || textoLower.includes('smart home')) && !isNegado('automacao')) {
      resultado.extras.automacao = true;
      resultado.encontrados.push('Extra: Automação');
    }

    // ============================================
    // VALIDAÇÃO DE SANIDADE - verificar se os dados fazem sentido
    // ============================================

    // Calcular área mínima necessária baseado nos cômodos detectados
    const numQuartos = resultado.config.numQuartos || 0;
    const numSuites = resultado.config.numSuites || 0;
    const numBanheiros = resultado.config.numBanheiros || 0;
    const isApartamento = resultado.config.tipoEstrutura === 'apartamento';

    // Área mínima estimada por cômodo (valores em m²)
    // Apartamentos são muito mais compactos que casas
    const areaMinimaPorQuarto = isApartamento ? 6 : 9;    // apartamento: 2.5x2.4m, casa: 3x3m
    const areaMinimaPorSuite = isApartamento ? 10 : 15;   // apartamento: quarto+banheiro compacto
    const areaMinimaPorBanheiro = isApartamento ? 2 : 3;  // apartamento: banheiro mínimo
    const areaMinimaCozinha = isApartamento ? 4 : 6;      // apartamento: cozinha americana
    const areaMinimaSala = isApartamento ? 8 : 12;        // apartamento: sala compacta
    const areaMinimaCirculacao = isApartamento ? 3 : 10;  // apartamento: corredores mínimos

    // Calcular área mínima necessária
    const areaMinimaEstimada =
      (numQuartos * areaMinimaPorQuarto) +
      (numSuites * areaMinimaPorSuite) +
      (numBanheiros * areaMinimaPorBanheiro) +
      areaMinimaCozinha +
      areaMinimaSala +
      areaMinimaCirculacao;

    // Só invalidar se a área for MUITO menor que o mínimo (0.6x para dar margem)
    // Apartamentos compactos existem e são comuns
    const fatorValidacao = isApartamento ? 0.5 : 0.7;
    if (resultado.config.areaTotal && resultado.config.areaTotal < areaMinimaEstimada * fatorValidacao) {
      // Área muito pequena para os cômodos - invalidar
      resultado.encontrados = resultado.encontrados.filter(e => !e.startsWith('Área:'));
      delete resultado.config.areaTotal;
      resultado.avisos = resultado.avisos || [];
      resultado.avisos.push(`Área detectada incompatível com ${numQuartos + numSuites} quartos - ignorada`);
    }

    // Se não tem área mas tem terreno, estimar área construída como 30-40% do terreno
    if (!resultado.config.areaTotal && resultado.config.areaTerreno) {
      const areaEstimada = Math.round(resultado.config.areaTerreno * 0.35);
      // Só usar se for pelo menos a área mínima
      if (areaEstimada >= areaMinimaEstimada) {
        resultado.config.areaTotal = areaEstimada;
        resultado.encontrados.push(`Área: ~${areaEstimada}m² (estimada)`);
      }
    }

    // Se ainda não tem área, estimar baseado nos cômodos
    if (!resultado.config.areaTotal && (numQuartos > 0 || numSuites > 0)) {
      // Estimar área razoável (não mínima)
      const areaEstimada = Math.round(areaMinimaEstimada * 1.5);
      resultado.config.areaTotal = areaEstimada;
      resultado.encontrados.push(`Área: ~${areaEstimada}m² (estimada por cômodos)`);
    }

    return resultado;
  }

  // Aplicar configuração do parser no formulário
  function aplicarConfiguracao(config, extras) {
    // Aplicar configurações básicas
    if (config.areaTotal) {
      state.config.areaTotal = config.areaTotal;
      const el = document.getElementById('cc-area');
      if (el) el.value = config.areaTotal;
    }
    if (config.numQuartos !== undefined) {
      state.config.numQuartos = config.numQuartos;
      const el = document.getElementById('cc-quartos');
      if (el) el.value = config.numQuartos;
    }
    if (config.numSuites !== undefined) {
      state.config.numSuites = config.numSuites;
      const el = document.getElementById('cc-suites');
      if (el) el.value = config.numSuites;
    }
    if (config.numBanheiros !== undefined) {
      state.config.numBanheiros = config.numBanheiros;
      const el = document.getElementById('cc-banheiros');
      if (el) el.value = config.numBanheiros;
    }
    if (config.estado) {
      state.config.estado = config.estado;
      const el = document.getElementById('cc-estado');
      if (el) el.value = config.estado;
    }
    if (config.estadoConservacao) {
      state.config.estadoConservacao = config.estadoConservacao;
      const el = document.getElementById('cc-estado-conservacao');
      if (el) el.value = config.estadoConservacao;
      updateConservacaoInfo();
    }
    if (config.tipoEstrutura) {
      state.config.tipoEstrutura = config.tipoEstrutura;
      const el = document.getElementById('cc-tipo-estrutura');
      if (el) el.value = config.tipoEstrutura;
      updateTipoInfo();
      updateFormForTipo(); // Aplicar restrições de extras para apartamentos
    }
    if (config.tipoConstrucao) {
      state.config.tipoConstrucao = config.tipoConstrucao;
      const el = document.getElementById('cc-tipo-construcao');
      if (el) el.value = config.tipoConstrucao;
      updateTipoInfo();
    }
    if (config.padrao) {
      state.config.padrao = config.padrao;
      const el = document.getElementById('cc-padrao');
      if (el) el.value = config.padrao;
    }
    if (config.temAreaServico !== undefined) {
      state.config.temAreaServico = config.temAreaServico;
      const el = document.getElementById('cc-area-servico');
      if (el) el.checked = config.temAreaServico;
    }
    if (config.areaTerreno) {
      state.config.areaTerreno = config.areaTerreno;
      const el = document.getElementById('cc-area-terreno');
      if (el) el.value = config.areaTerreno;
    }

    // Aplicar garagem detectada (de extras)
    // O parser usa garagemQtd, mapeamos para garagemVagas
    const garagemVagas = extras?.garagemVagas ?? extras?.garagemQtd;
    if (garagemVagas !== undefined) {
      state.config.garagemVagas = garagemVagas;
      const el = document.getElementById('cc-vagas-garagem');
      if (el) el.value = garagemVagas;
    }
    if (extras && extras.garagemTipo) {
      state.config.garagemTipo = extras.garagemTipo;
      const el = document.getElementById('cc-tipo-vaga');
      if (el) el.value = extras.garagemTipo;
    }

    // Aplicar cidade detectada pelo parser (para ajuste de localização)
    if (config.cidadeInfo) {
      state.config.cidadeInfo = config.cidadeInfo;
    }
    // Atualizar campo de ajuste de localização
    updateLocalizacaoAjuste();

    // Aplicar extras
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        const checkbox = document.getElementById(`cc-extra-${key}`);
        const options = document.getElementById(`cc-${key}-options`);
        if (checkbox) {
          checkbox.checked = value;
          if (options) options.style.display = value ? 'block' : 'none';
        }
      });

      // Aplicar tipo de piscina detectado
      if (extras.piscinaTipo) {
        const piscinaTipoSelect = document.getElementById('cc-piscina-tipo');
        if (piscinaTipoSelect) {
          piscinaTipoSelect.value = extras.piscinaTipo;
        }
      }

      // Aplicar área da edícula detectada
      if (extras.ediculaArea) {
        const ediculaM2Input = document.getElementById('cc-edicula-m2');
        if (ediculaM2Input) {
          ediculaM2Input.value = extras.ediculaArea;
        }
      }
    }

    // Atualizar resumos
    updateComodosResumo();
    calculate();
  }

  // Resetar formulário para valores padrão
  function resetFormulario() {
    // Reset config - valores zerados para receber os dados do parser
    state.config = {
      estado: 'SP',
      tipoEstrutura: 'terrea',
      tipoConstrucao: 'alvenaria',
      estadoConservacao: 'bom',
      padrao: 'medio',
      areaTotal: 100,
      areaTerreno: 0,
      numQuartos: 0,
      numSuites: 0,
      numBanheiros: 0,
      temSala: true,
      temCozinha: true,
      temAreaServico: false,
      temVaranda: false,
      garagemVagas: 0,
      garagemTipo: 'aberta',
      cidadeInfo: null,
      ajusteLocalizacao: undefined
    };

    // Esconder o campo de ajuste de localização
    const locAjuste = document.getElementById('cc-localizacao-ajuste');
    if (locAjuste) locAjuste.style.display = 'none';
    const ajusteSelect = document.getElementById('cc-ajuste-localizacao');
    if (ajusteSelect) ajusteSelect.value = '0';
    const ajusteCustom = document.getElementById('cc-ajuste-custom');
    if (ajusteCustom) ajusteCustom.style.display = 'none';

    // Reset terreno
    const terrenoEl = document.getElementById('cc-area-terreno');
    if (terrenoEl) terrenoEl.value = '';

    // Reset garagem inputs
    const garagemVagasEl = document.getElementById('cc-vagas-garagem');
    if (garagemVagasEl) garagemVagasEl.value = 0;
    const garagemTipoEl = document.getElementById('cc-tipo-vaga');
    if (garagemTipoEl) garagemTipoEl.value = 'aberta';

    // Reset materiais
    state.materiais = {
      janelas: 'aluminio_simples',
      portas: 'madeira_semi_oca',
      pisos: 'ceramica_classe_b',
      telhado: 'ceramica_simples',
      forro: 'pvc_simples'
    };

    // Reset mão de obra (all checked)
    Object.keys(data.maoDeObra).forEach(k => {
      state.maoDeObra[k] = true;
    });

    // Reset custos adicionais (all checked)
    Object.keys(data.custosAdicionais).forEach(k => {
      const key = k.replace(/_([a-z])/g, (m, l) => l.toUpperCase());
      state.custosAdicionais[key] = true;
    });

    // Reset form fields
    const fieldMappings = {
      'cc-estado': state.config.estado,
      'cc-estado-conservacao': state.config.estadoConservacao,
      'cc-tipo-estrutura': state.config.tipoEstrutura,
      'cc-tipo-construcao': state.config.tipoConstrucao,
      'cc-padrao': state.config.padrao,
      'cc-area': state.config.areaTotal,
      'cc-quartos': state.config.numQuartos,
      'cc-suites': state.config.numSuites,
      'cc-banheiros': state.config.numBanheiros
    };

    Object.entries(fieldMappings).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });

    // Reset checkbox área de serviço
    const areaServicoEl = document.getElementById('cc-area-servico');
    if (areaServicoEl) areaServicoEl.checked = state.config.temAreaServico;

    // Reset mão de obra checkboxes
    document.querySelectorAll('[data-profissional]').forEach(checkbox => {
      checkbox.checked = true;
    });

    // Reset custos adicionais checkboxes
    document.querySelectorAll('[data-custo]').forEach(checkbox => {
      checkbox.checked = true;
    });

    // Reset all extras
    const extras = ['piscina', 'churrasqueira', 'garagem', 'piso-externo', 'muro', 'portao', 'edicula', 'solar', 'aquecedor', 'automacao', 'seguranca'];
    extras.forEach(name => {
      const checkbox = document.getElementById(`cc-extra-${name}`);
      const options = document.getElementById(`cc-${name}-options`);
      if (checkbox) {
        checkbox.checked = false;
        if (options) options.style.display = 'none';
      }
    });

    // Reset segurança checkboxes
    document.querySelectorAll('[data-seguranca]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Update UI
    updateTipoInfo();
    updateComodosResumo();
    updateConservacaoInfo();
  }

  // Mostrar feedback da análise
  function mostrarFeedback(encontrados) {
    const feedbackEl = document.getElementById('cc-descricao-feedback');
    if (!feedbackEl) return;

    if (encontrados.length === 0) {
      feedbackEl.innerHTML = `
        <div class="cc-feedback-vazio">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Nenhuma característica identificada. Tente descrever área, quartos, localização, etc.</span>
        </div>
      `;
    } else {
      feedbackEl.innerHTML = `
        <div class="cc-feedback-sucesso">
          <div class="cc-feedback-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>${encontrados.length} característica${encontrados.length > 1 ? 's' : ''} identificada${encontrados.length > 1 ? 's' : ''}:</span>
          </div>
          <div class="cc-feedback-tags">
            ${encontrados.map(e => `<span class="cc-feedback-tag">${e}</span>`).join('')}
          </div>
        </div>
      `;
    }
    feedbackEl.style.display = 'block';
  }

  function attachEventListeners() {
    // Descrição inteligente
    const btnAplicar = document.getElementById('cc-btn-aplicar');
    const btnLimpar = document.getElementById('cc-btn-limpar');
    const textareaDescricao = document.getElementById('cc-descricao-texto');

    if (btnAplicar && textareaDescricao) {
      btnAplicar.addEventListener('click', () => {
        const texto = textareaDescricao.value.trim();
        if (!texto) {
          mostrarFeedback([]);
          return;
        }
        // Resetar formulário antes de aplicar nova configuração
        resetFormulario();
        const resultado = parseDescricao(texto);
        aplicarConfiguracao(resultado.config, resultado.extras);
        mostrarFeedback(resultado.encontrados);
      });
    }

    if (btnLimpar && textareaDescricao) {
      btnLimpar.addEventListener('click', () => {
        textareaDescricao.value = '';
        const feedbackEl = document.getElementById('cc-descricao-feedback');
        if (feedbackEl) feedbackEl.style.display = 'none';
      });
    }

    // Toggle sections
    document.querySelectorAll('.cc-btn-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const target = document.getElementById(this.dataset.target);
        if (target) {
          target.classList.toggle('collapsed');
          this.classList.toggle('rotated');
        }
      });
    });

    // Header click to toggle sections
    document.querySelectorAll('.cc-section-header').forEach(header => {
      header.addEventListener('click', function(e) {
        if (e.target.closest('.cc-btn-toggle') || e.target.closest('.cc-select-all')) return;
        const targetId = this.dataset.target;
        const target = document.getElementById(targetId);
        const btn = this.querySelector('.cc-btn-toggle');
        if (target && btn) {
          target.classList.toggle('collapsed');
          btn.classList.toggle('rotated');
        }
      });
    });

    // Select all - Mão de Obra
    document.getElementById('cc-mao-obra-select-all')?.addEventListener('change', function() {
      const isChecked = this.checked;
      document.querySelectorAll('#mao-obra-content .cc-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = isChecked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Select all - Custos Adicionais
    document.getElementById('cc-custos-select-all')?.addEventListener('change', function() {
      const isChecked = this.checked;
      document.querySelectorAll('#custos-adicionais-content .cc-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = isChecked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Config changes
    const configHandlers = {
      'cc-estado': v => state.config.estado = v,
      'cc-estado-conservacao': v => { state.config.estadoConservacao = v; updateConservacaoInfo(); },
      'cc-tipo-estrutura': v => { state.config.tipoEstrutura = v; updateTipoInfo(); updateFormForTipo(); },
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

    // Escritório
    document.getElementById('cc-escritorios')?.addEventListener('input', function() {
      state.config.numEscritorios = parseInt(this.value) || 0;
      updateComodosResumo();
      calculate();
    });

    // Despensa
    document.getElementById('cc-despensa')?.addEventListener('change', function() {
      state.config.temDespensa = this.checked;
      calculate();
    });

    // Varanda/Sacada
    document.getElementById('cc-varanda')?.addEventListener('change', function() {
      state.config.temVaranda = this.checked;
      calculate();
    });

    // Garagem - vagas e tipo (nos cômodos)
    document.getElementById('cc-vagas-garagem')?.addEventListener('input', function() {
      state.config.garagemVagas = parseInt(this.value) || 0;
      updateComodosResumo();
      calculate();
    });

    document.getElementById('cc-tipo-vaga')?.addEventListener('change', function() {
      state.config.garagemTipo = this.value;
      calculate();
    });

    // Garagem extras (churrasqueira, banheiro, depósito, lavabo)
    document.getElementById('cc-garagem-churrasqueira')?.addEventListener('change', function() {
      state.config.garagemChurrasqueira = this.checked;
      calculate();
    });
    document.getElementById('cc-garagem-banheiro')?.addEventListener('change', function() {
      state.config.garagemBanheiro = this.checked;
      calculate();
    });
    document.getElementById('cc-garagem-deposito')?.addEventListener('change', function() {
      state.config.garagemDeposito = this.checked;
      calculate();
    });
    document.getElementById('cc-garagem-lavabo')?.addEventListener('change', function() {
      state.config.garagemLavabo = this.checked;
      calculate();
    });

    // Área Gourmet toggle and options
    document.getElementById('cc-tem-area-gourmet')?.addEventListener('change', function() {
      state.config.temAreaGourmet = this.checked;
      const options = document.getElementById('cc-area-gourmet-options');
      if (options) options.style.display = this.checked ? 'block' : 'none';
      calculate();
    });
    document.getElementById('cc-area-gourmet-m2')?.addEventListener('input', function() {
      state.config.areaGourmetM2 = parseInt(this.value) || 20;
      calculate();
    });
    // Área Gourmet extras
    ['churrasqueira', 'lareira', 'fogao-lenha', 'forno-pizza', 'bancada', 'banheiro'].forEach(item => {
      const camelCase = item.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const stateKey = 'gourmet' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
      document.getElementById(`cc-gourmet-${item}`)?.addEventListener('change', function() {
        state.config[stateKey] = this.checked;
        calculate();
      });
    });

    // Edícula - cômodos (number inputs)
    ['quartos', 'suites', 'banheiros', 'garagem'].forEach(item => {
      document.getElementById(`cc-edicula-${item}`)?.addEventListener('input', function() {
        if (!state.edicula) state.edicula = {};
        state.edicula[item] = parseInt(this.value) || 0;
        updateEdiculaArea();
        calculate();
      });
    });
    // Edícula - características (checkboxes)
    ['sala', 'cozinha', 'area-servico', 'escritorio', 'churrasqueira', 'lareira', 'varanda', 'piscina'].forEach(item => {
      const stateKey = item.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      document.getElementById(`cc-edicula-${item}`)?.addEventListener('change', function() {
        if (!state.edicula) state.edicula = {};
        state.edicula[stateKey] = this.checked;
        updateEdiculaArea();
        calculate();
      });
    });

    // Área do terreno
    document.getElementById('cc-area-terreno')?.addEventListener('input', function() {
      state.config.areaTerreno = parseInt(this.value) || 0;
      calculate();
    });

    // Ajuste de localização
    const ajusteSelect = document.getElementById('cc-ajuste-localizacao');
    const ajusteCustomDiv = document.getElementById('cc-ajuste-custom');
    const ajusteCustomInput = document.getElementById('cc-ajuste-custom-valor');

    if (ajusteSelect) {
      ajusteSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
          if (ajusteCustomDiv) ajusteCustomDiv.style.display = 'block';
          const customVal = parseInt(ajusteCustomInput?.value) || 0;
          state.config.ajusteLocalizacao = customVal;
        } else {
          if (ajusteCustomDiv) ajusteCustomDiv.style.display = 'none';
          state.config.ajusteLocalizacao = parseInt(this.value) || 0;
        }
        calculate();
      });
    }

    if (ajusteCustomInput) {
      ajusteCustomInput.addEventListener('input', function() {
        state.config.ajusteLocalizacao = parseInt(this.value) || 0;
        calculate();
      });
    }

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

    // Verificar se é apartamento
    const isApartamento = state.config.tipoEstrutura === 'apartamento';

    // Fator de localização (ajuste manual do usuário)
    const ajusteLocalizacaoUsuario = state.config.ajusteLocalizacao;
    let fatorLocalizacao = 1.0;
    if (ajusteLocalizacaoUsuario !== undefined && ajusteLocalizacaoUsuario !== null) {
      fatorLocalizacao = 1 + (ajusteLocalizacaoUsuario / 100);
    }

    // Custo base
    const custoBaseM2 = data.custoBaseM2.materiais + data.custoBaseM2.maoDeObra;

    // Custo por m² ajustado por todos os fatores
    let custoM2Ajustado = custoBaseM2 * regiao.fator * estrutura.fator * metodo.fator * padrao.fator * fatorLocalizacao;

    // Variáveis para detalhamento
    let custoMateriais = 0;
    let custoMaoObra = 0;
    let custoComodosExtra = 0;
    let percentualMaoObraAtivo = 100;
    let custoBase = 0;

    // Cálculo de materiais e mão de obra
    const proporcaoMateriais = data.custoBaseM2.materiais / custoBaseM2;
    const proporcaoMaoObra = data.custoBaseM2.maoDeObra / custoBaseM2;

    custoMateriais = custoM2Ajustado * proporcaoMateriais * area * fatorConservacao;
    custoMaoObra = custoM2Ajustado * proporcaoMaoObra * area * fatorConservacao;

    // Ajustar mão de obra com base nos profissionais desmarcados
    percentualMaoObraAtivo = 0;
    Object.entries(state.maoDeObra).forEach(([key, ativo]) => {
      if (ativo && data.maoDeObra[key]) {
        percentualMaoObraAtivo += data.maoDeObra[key].percentualObra;
      }
    });
    const fatorMaoObra = percentualMaoObraAtivo / 100;
    custoMaoObra = custoMaoObra * fatorMaoObra;

    // Custo adicional por cômodos (também ajustado pelo fator de conservação)
    const custoComodos = data.custoPorComodo;
    custoComodosExtra = 0;
    custoComodosExtra += state.config.numQuartos * custoComodos.quarto.custoBase * padrao.fator * fatorConservacao;
    custoComodosExtra += state.config.numSuites * custoComodos.suite.custoBase * padrao.fator * fatorConservacao;
    custoComodosExtra += state.config.numBanheiros * custoComodos.banheiro.custoBase * padrao.fator * fatorConservacao;
    if (state.config.temAreaServico) {
      custoComodosExtra += custoComodos.areaServico.custoBase * padrao.fator * fatorConservacao;
    }
    // Novos cômodos
    if (state.config.numEscritorios > 0) {
      custoComodosExtra += state.config.numEscritorios * 5000 * padrao.fator * fatorConservacao; // ~5k por escritório
    }
    if (state.config.temDespensa) {
      custoComodosExtra += 3000 * padrao.fator * fatorConservacao; // ~3k despensa
    }
    if (state.config.temVaranda) {
      custoComodosExtra += 8000 * padrao.fator * fatorConservacao; // ~8k varanda/sacada
    }

    // Custo base da construção
    custoBase = custoMateriais + custoMaoObra + custoComodosExtra;

    // AJUSTE DE MATERIAIS SELECIONADOS
    // Calcula a diferença entre os materiais selecionados e os materiais base
    let ajusteMateriais = 0;
    const detalhesMateriais = [];

    // Valores base de referência (materiais padrão incluídos no custo base)
    const materiaisBase = {
        pisos: { key: 'ceramica_classe_b', valorM2: 35 },
        telhado: { key: 'ceramica_simples', valorM2: 70 },
        forro: { key: 'pvc_simples', valorM2: 40 },
        janelas: { key: 'aluminio_simples', valorM2: 350 },  // por m² de janela
        portas: { key: 'madeira_semi_oca', valorUnidade: 350 }
      };

      // Piso - aplica-se a toda a área
      const pisoSelecionado = state.materiais.pisos;
      const pisoData = data.materiais.pisos[pisoSelecionado];
      if (pisoData && pisoData.valorM2) {
        const diferencaPiso = pisoData.valorM2 - materiaisBase.pisos.valorM2;
        if (diferencaPiso !== 0) {
          const ajustePiso = diferencaPiso * area;
          ajusteMateriais += ajustePiso;
          if (ajustePiso > 0) {
            detalhesMateriais.push({ nome: `Piso: ${pisoData.nome}`, valor: ajustePiso, tipo: 'upgrade' });
          } else {
            detalhesMateriais.push({ nome: `Piso: ${pisoData.nome}`, valor: ajustePiso, tipo: 'economia' });
          }
        }
      }

      // Telhado - aplica-se à área (para casas, não apartamentos)
      if (!isApartamento) {
        const telhadoSelecionado = state.materiais.telhado;
        const telhadoData = data.materiais.telhados[telhadoSelecionado];
        if (telhadoData && telhadoData.valorM2) {
          const diferencaTelhado = telhadoData.valorM2 - materiaisBase.telhado.valorM2;
          if (diferencaTelhado !== 0) {
            // Área do telhado é aproximadamente 1.1x a área construída (inclinação)
            const areaTelhado = area * 1.1;
            const ajusteTelhado = diferencaTelhado * areaTelhado;
            ajusteMateriais += ajusteTelhado;
            if (ajusteTelhado > 0) {
              detalhesMateriais.push({ nome: `Telhado: ${telhadoData.nome}`, valor: ajusteTelhado, tipo: 'upgrade' });
            } else {
              detalhesMateriais.push({ nome: `Telhado: ${telhadoData.nome}`, valor: ajusteTelhado, tipo: 'economia' });
            }
          }
        }

        // Forro - aplica-se à área interna
        const forroSelecionado = state.materiais.forro;
        const forroData = data.materiais.forros[forroSelecionado];
        if (forroData && forroData.valorM2) {
          const diferencaForro = forroData.valorM2 - materiaisBase.forro.valorM2;
          if (diferencaForro !== 0) {
            const ajusteForro = diferencaForro * area;
            ajusteMateriais += ajusteForro;
            if (ajusteForro > 0) {
              detalhesMateriais.push({ nome: `Forro: ${forroData.nome}`, valor: ajusteForro, tipo: 'upgrade' });
            } else {
              detalhesMateriais.push({ nome: `Forro: ${forroData.nome}`, valor: ajusteForro, tipo: 'economia' });
            }
          }
        }
      }

      // Janelas - estimar quantidade baseado na área (aprox. 1 janela a cada 8m²)
      const janelaSelecionada = state.materiais.janelas;
      const janelaData = data.materiais.janelas[janelaSelecionada];
      if (janelaData && janelaData.valorM2) {
        const diferencaJanela = janelaData.valorM2 - materiaisBase.janelas.valorM2;
        if (diferencaJanela !== 0) {
          // Estimar área de janelas: ~10% da área construída
          const areaJanelas = area * 0.10;
          const ajusteJanelas = diferencaJanela * areaJanelas;
          ajusteMateriais += ajusteJanelas;
          if (ajusteJanelas > 0) {
            detalhesMateriais.push({ nome: `Janelas: ${janelaData.nome}`, valor: ajusteJanelas, tipo: 'upgrade' });
          } else {
            detalhesMateriais.push({ nome: `Janelas: ${janelaData.nome}`, valor: ajusteJanelas, tipo: 'economia' });
          }
        }
      }

      // Portas - estimar quantidade (quartos + suítes + banheiros + cozinha + área serviço + entrada)
      const portaSelecionada = state.materiais.portas;
      const portaData = data.materiais.portas[portaSelecionada];
      if (portaData && portaData.valorUnidade) {
        const diferencaPorta = portaData.valorUnidade - materiaisBase.portas.valorUnidade;
        if (diferencaPorta !== 0) {
          const numPortas = state.config.numQuartos + state.config.numSuites +
                           state.config.numBanheiros + 3; // +3 = cozinha, entrada, serviço
          const ajustePortas = diferencaPorta * numPortas;
          ajusteMateriais += ajustePortas;
          if (ajustePortas > 0) {
            detalhesMateriais.push({ nome: `Portas: ${portaData.nome} (${numPortas}un)`, valor: ajustePortas, tipo: 'upgrade' });
          } else {
            detalhesMateriais.push({ nome: `Portas: ${portaData.nome} (${numPortas}un)`, valor: ajustePortas, tipo: 'economia' });
          }
        }
      }

      // Aplicar ajuste ao custo base
      custoBase += ajusteMateriais;

    // EXTRAS
    let custoExtras = 0;
    const detalhesExtras = [];

    // GARAGEM (do card Cômodos)
    const garagemVagas = state.config.garagemVagas || 0;
    if (garagemVagas > 0) {
      const garagemTipo = state.config.garagemTipo || 'aberta';
      // Custo por m² dependendo do tipo
      const custoPorVaga = {
        aberta: { m2: 15, custoM2: 150 },    // Descoberta, simples
        coberta: { m2: 18, custoM2: 350 },   // Coberta com telhado
        fechada: { m2: 20, custoM2: 650 }    // Box fechado com portão
      };
      const config = custoPorVaga[garagemTipo] || custoPorVaga.aberta;
      const areaGaragem = garagemVagas * config.m2;
      const valorGaragem = areaGaragem * config.custoM2 * padrao.fator;
      custoExtras += valorGaragem;
      const tipoNome = { aberta: 'Aberta', coberta: 'Coberta', fechada: 'Fechada' }[garagemTipo];
      detalhesExtras.push({ nome: `Garagem ${tipoNome} (${garagemVagas} vaga${garagemVagas > 1 ? 's' : ''}, ${areaGaragem}m²)`, valor: valorGaragem });

      // Extras da garagem
      if (state.config.garagemChurrasqueira) {
        const valorChurr = 4500 * padrao.fator;
        custoExtras += valorChurr;
        detalhesExtras.push({ nome: 'Churrasqueira na garagem', valor: valorChurr });
      }
      if (state.config.garagemBanheiro) {
        const valorBanh = 8000 * padrao.fator;
        custoExtras += valorBanh;
        detalhesExtras.push({ nome: 'Banheiro na garagem', valor: valorBanh });
      }
      if (state.config.garagemDeposito) {
        const valorDep = 3500 * padrao.fator;
        custoExtras += valorDep;
        detalhesExtras.push({ nome: 'Depósito na garagem', valor: valorDep });
      }
      if (state.config.garagemLavabo) {
        const valorLav = 5000 * padrao.fator;
        custoExtras += valorLav;
        detalhesExtras.push({ nome: 'Lavabo na garagem', valor: valorLav });
      }
    }

    // ÁREA GOURMET (do card Cômodos)
    if (state.config.temAreaGourmet) {
      const areaGourmetM2 = state.config.areaGourmetM2 || 20;
      // Custo base da área gourmet (construção + acabamento)
      const custoBaseGourmet = areaGourmetM2 * 1200 * padrao.fator; // ~R$1200/m² para espaço gourmet
      custoExtras += custoBaseGourmet;
      detalhesExtras.push({ nome: `Área Gourmet (${areaGourmetM2}m²)`, valor: custoBaseGourmet });

      // Equipamentos da área gourmet
      if (state.config.gourmetChurrasqueira) {
        const valor = 6000 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Churrasqueira (gourmet)', valor });
      }
      if (state.config.gourmetLareira) {
        const valor = 8000 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Lareira (gourmet)', valor });
      }
      if (state.config.gourmetFogaoLenha) {
        const valor = 5500 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Fogão a lenha (gourmet)', valor });
      }
      if (state.config.gourmetFornoPizza) {
        const valor = 4500 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Forno de pizza (gourmet)', valor });
      }
      if (state.config.gourmetBancada) {
        const valor = 3500 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Bancada/Pia (gourmet)', valor });
      }
      if (state.config.gourmetBanheiro) {
        const valor = 9000 * padrao.fator;
        custoExtras += valor;
        detalhesExtras.push({ nome: 'Banheiro (gourmet)', valor });
      }
    }

    // Piscina
    if (document.getElementById('cc-extra-piscina')?.checked) {
      const tipo = document.getElementById('cc-piscina-tipo')?.value;
      if (tipo && data.extras.piscina[tipo]) {
        const valor = data.extras.piscina[tipo].valor;
        custoExtras += valor;
        detalhesExtras.push({ nome: data.extras.piscina[tipo].nome, valor });
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

    // Edícula (com configuração completa)
    if (document.getElementById('cc-extra-edicula')?.checked) {
      const tipo = document.getElementById('cc-edicula-tipo')?.value;
      const m2 = parseFloat(document.getElementById('cc-edicula-m2')?.value) || 20;
      if (tipo && data.extras.edicula[tipo]) {
        const valorBase = data.extras.edicula[tipo].valorM2 * m2;
        custoExtras += valorBase;
        detalhesExtras.push({ nome: `${data.extras.edicula[tipo].nome} (${m2}m²)`, valor: valorBase });

        // Extras da edícula (usando state.edicula)
        const ed = state.edicula || {};
        // Cômodos com quantidade (custo adicional por instalações)
        if (ed.suites > 0) {
          const valor = ed.suites * 8000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: `Suítes na edícula (${ed.suites})`, valor });
        }
        if (ed.banheiros > 0) {
          const valor = ed.banheiros * 6000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: `Banheiros na edícula (${ed.banheiros})`, valor });
        }
        if (ed.garagem > 0) {
          const valor = ed.garagem * 4000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: `Vagas garagem na edícula (${ed.garagem})`, valor });
        }
        // Características extras
        if (ed.churrasqueira) {
          const valor = 5000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: 'Churrasqueira na edícula', valor });
        }
        if (ed.lareira) {
          const valor = 7000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: 'Lareira na edícula', valor });
        }
        if (ed.varanda) {
          const valor = 6000 * padrao.fator;
          custoExtras += valor;
          detalhesExtras.push({ nome: 'Varanda na edícula', valor });
        }
        if (ed.piscina) {
          const valor = 25000 * padrao.fator; // Piscina pequena na edícula
          custoExtras += valor;
          detalhesExtras.push({ nome: 'Piscina na edícula', valor });
        }
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

    // VALOR DO TERRENO (se informado e NÃO for apartamento)
    // Apartamentos não têm terreno próprio - o valor do terreno já está embutido no preço/m²
    let custoTerreno = 0;
    const areaTerreno = state.config.areaTerreno || 0;

    if (areaTerreno > 0 && !isApartamento) {
      // Usar tipo de localização detectado pelo parser, ou inferir do tipo de estrutura
      let tipoLocalizacao = state.config.tipoLocalizacao || 'urbano';

      // Fallback se não foi detectado pelo parser
      if (!state.config.tipoLocalizacao) {
        if (state.config.tipoEstrutura === 'chacara') {
          tipoLocalizacao = 'rural';
        }
      }

      // Usar fator regional para ajustar preço do terreno
      const fatorTerreno = data.custoTerrenoM2.fatores[tipoLocalizacao] || 1.0;
      const custoTerrenoM2 = data.custoTerrenoM2.base * fatorTerreno * regiao.fator;
      custoTerreno = areaTerreno * custoTerrenoM2;
    }

    // TOTAL
    const custoTotal = custoBase + custoExtras + custoAdicionais + custoTerreno;
    const custoM2Final = custoTotal / area;

    // Salvar para exportação
    state.calculoAtual = {
      custoTotal,
      custoM2Final,
      custoBase,
      custoMateriais,
      custoMaoObra,
      custoComodosExtra,
      ajusteMateriais,
      custoExtras,
      custoAdicionais,
      custoTerreno,
      areaTerreno,
      detalhesMateriais,
      detalhesExtras,
      detalhesAdicionais,
      config: { ...state.config },
      regiao,
      estrutura,
      metodo,
      padrao,
      conservacao,
      isReforma,
      fatorLocalizacao
    };

    // Atualizar cabeçalho com resumo
    const valorTopoEl = document.getElementById('cc-valor-topo');
    const valorM2El = document.getElementById('cc-valor-m2');
    const headerTipoEl = document.getElementById('cc-header-tipo');
    const headerAreaEl = document.getElementById('cc-header-area');
    const headerQuartosEl = document.getElementById('cc-header-quartos');
    const headerRegiaoEl = document.getElementById('cc-header-regiao');

    if (valorTopoEl) {
      valorTopoEl.textContent = `R$ ${formatNumber(custoTotal)}`;
    }
    if (valorM2El) {
      valorM2El.textContent = `R$ ${formatNumber(custoM2Final)}/m²`;
    }
    if (headerTipoEl) {
      headerTipoEl.textContent = estrutura.nome;
    }
    if (headerAreaEl) {
      let areaText = `${area}m²`;
      if (areaTerreno > 0) {
        areaText += ` • Terreno: ${areaTerreno}m²`;
      }
      headerAreaEl.textContent = areaText;
    }
    if (headerQuartosEl) {
      const totalQuartos = state.config.numQuartos + state.config.numSuites;
      headerQuartosEl.textContent = `${totalQuartos} quarto${totalQuartos !== 1 ? 's' : ''}`;
    }
    if (headerRegiaoEl) {
      headerRegiaoEl.textContent = state.config.estado;
    }

    // Render
    const tipoObra = isReforma ? conservacao.nome : 'Construção Nova';
    const labelResultado = isReforma ? 'Valor Estimado do Imóvel' : 'Custo de Construção Nova';

    resultado.innerHTML = `
      <div class="cc-resultado-main">
        <div class="cc-resultado-total">
          <span class="cc-resultado-label">${labelResultado}</span>
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

          ${detalhesMateriais.length > 0 ? `
            <div class="cc-breakdown-group">
              <div class="cc-breakdown-group-title">Ajuste de Materiais Selecionados</div>
              ${detalhesMateriais.map(e => `
                <div class="cc-breakdown-row ${e.tipo === 'economia' ? 'cc-economia' : 'cc-upgrade'}">
                  <span>${e.nome}</span>
                  <span>${e.valor > 0 ? '+' : ''}R$ ${formatNumber(e.valor)}</span>
                </div>
              `).join('')}
              <div class="cc-breakdown-subtotal">
                <span>Ajuste Total Materiais</span>
                <span>${ajusteMateriais > 0 ? '+' : ''}R$ ${formatNumber(ajusteMateriais)}</span>
              </div>
              <div class="cc-breakdown-hint">
                <small>* Diferença em relação aos materiais padrão (Cerâmica B, Telha Cerâmica, Forro PVC, Alumínio Simples, Porta Semi-oca)</small>
              </div>
            </div>
          ` : ''}

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

          ${custoTerreno > 0 ? `
            <div class="cc-breakdown-group">
              <div class="cc-breakdown-group-title">Valor do Terreno</div>
              <div class="cc-breakdown-row">
                <span>Terreno (${areaTerreno}m² × R$ ${formatNumber(custoTerreno / areaTerreno)}/m²)</span>
                <span>R$ ${formatNumber(custoTerreno)}</span>
              </div>
              <div class="cc-breakdown-hint">
                <small>* Valor estimado baseado na região e tipo de localização</small>
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
          ${fatorLocalizacao !== 1.0 ? `
          <div class="cc-info-item">
            <span class="cc-info-label">Fator Localização</span>
            <span class="cc-info-value">${fatorLocalizacao > 1 ? '+' : ''}${((fatorLocalizacao - 1) * 100).toFixed(0)}%</span>
          </div>
          ` : ''}
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
      </div>
    `;
  }

  function exportarExcel() {
    if (!state.calculoAtual) {
      calculate();
    }
    const c = state.calculoAtual;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const tipoObra = c.isReforma ? c.conservacao.nome : 'Construção Nova';

    // Gerar HTML estilizado que o Excel pode abrir
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid #ccc; padding: 10px 12px; text-align: left; }
  .header { background: #1a5f2a; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 20px; border: none; }
  .subheader { background: #f0f0f0; color: #666; font-size: 12px; text-align: center; padding: 8px; border: none; }
  .section-title { background: #2d5a3d; color: white; font-weight: bold; font-size: 14px; }
  .section-title td { border: none; }
  .table-header { background: #e8f5e9; font-weight: bold; color: #1a5f2a; }
  .row-alt { background: #fafafa; }
  .subtotal { background: #fff3e0; font-weight: bold; }
  .subtotal td { border-top: 2px solid #ff9800; }
  .total-row { background: #1a5f2a; color: white; font-weight: bold; font-size: 16px; }
  .total-row td { border: 2px solid #0d3d17; }
  .currency { text-align: right; font-family: 'Courier New', monospace; }
  .info-row td:first-child { color: #666; }
  .depreciation { background: #fff8e1; color: #e65100; }
  .obs { font-size: 11px; color: #666; font-style: italic; }
  .logo-text { color: #1a5f2a; font-weight: bold; }
</style>
</head>
<body>

<table>
  <tr><td class="header" colspan="2">ORÇAMENTO DE CONSTRUÇÃO</td></tr>
  <tr><td class="subheader" colspan="2"><span class="logo-text">Rico aos Poucos</span> - ricoaospoucos.com.br | Gerado em: ${dataAtual}</td></tr>
</table>

<table>
  <tr class="section-title"><td colspan="2">RESUMO DO ORÇAMENTO</td></tr>
  <tr class="total-row">
    <td>${c.isReforma ? 'Valor Estimado do Imóvel' : 'Custo Total de Construção'}</td>
    <td class="currency">R$ ${formatNumber(c.custoTotal)}</td>
  </tr>
  <tr class="subtotal">
    <td>Custo por m²</td>
    <td class="currency">R$ ${formatNumber(c.custoM2Final)}</td>
  </tr>
</table>

<table>
  <tr class="section-title"><td colspan="2">CONFIGURAÇÃO DO IMÓVEL</td></tr>
  <tr class="table-header"><td>Parâmetro</td><td>Valor</td></tr>
  <tr class="info-row"><td>Região</td><td>${c.config.estado} - ${c.regiao.nome}</td></tr>
  <tr class="info-row row-alt"><td>Situação</td><td>${tipoObra}</td></tr>
  ${c.isReforma ? `<tr class="depreciation"><td>Depreciação aplicada</td><td>${c.conservacao.desconto}%</td></tr>` : ''}
  <tr class="info-row"><td>Tipo de Casa</td><td>${c.estrutura.nome}</td></tr>
  <tr class="info-row row-alt"><td>Método Construtivo</td><td>${c.metodo.nome}</td></tr>
  <tr class="info-row"><td>Padrão de Acabamento</td><td>${c.padrao.nome}</td></tr>
  <tr class="info-row row-alt"><td>Área Total</td><td>${c.config.areaTotal} m²</td></tr>
  <tr class="info-row"><td>Quartos</td><td>${c.config.numQuartos}</td></tr>
  <tr class="info-row row-alt"><td>Suítes</td><td>${c.config.numSuites}</td></tr>
  <tr class="info-row"><td>Banheiros Extras</td><td>${c.config.numBanheiros}</td></tr>
  <tr class="info-row row-alt"><td>Área de Serviço</td><td>${c.config.temAreaServico ? 'Sim' : 'Não'}</td></tr>
</table>

<table>
  <tr class="section-title"><td colspan="2">COMPOSIÇÃO DO CUSTO</td></tr>
  <tr class="table-header"><td>Item</td><td>Valor (R$)</td></tr>
  <tr><td>Estrutura e Materiais Base</td><td class="currency">R$ ${formatNumber(c.custoMateriais)}</td></tr>
  <tr class="row-alt"><td>Mão de Obra</td><td class="currency">R$ ${formatNumber(c.custoMaoObra)}</td></tr>
  <tr><td>Adicionais de Cômodos (hidráulica, louças)</td><td class="currency">R$ ${formatNumber(c.custoComodosExtra)}</td></tr>
  <tr class="subtotal"><td><strong>SUBTOTAL CONSTRUÇÃO</strong></td><td class="currency"><strong>R$ ${formatNumber(c.custoBase)}</strong></td></tr>
</table>

${c.detalhesExtras.length > 0 ? `
<table>
  <tr class="section-title"><td colspan="2">ITENS EXTRAS</td></tr>
  <tr class="table-header"><td>Item</td><td>Valor (R$)</td></tr>
  ${c.detalhesExtras.map((e, i) => `<tr${i % 2 ? ' class="row-alt"' : ''}><td>${e.nome}</td><td class="currency">R$ ${formatNumber(e.valor)}</td></tr>`).join('')}
  <tr class="subtotal"><td><strong>SUBTOTAL EXTRAS</strong></td><td class="currency"><strong>R$ ${formatNumber(c.custoExtras)}</strong></td></tr>
</table>
` : ''}

${c.detalhesAdicionais.length > 0 ? `
<table>
  <tr class="section-title"><td colspan="2">PROJETOS E TAXAS</td></tr>
  <tr class="table-header"><td>Item</td><td>Valor (R$)</td></tr>
  ${c.detalhesAdicionais.map((e, i) => `<tr${i % 2 ? ' class="row-alt"' : ''}><td>${e.nome}</td><td class="currency">R$ ${formatNumber(e.valor)}</td></tr>`).join('')}
  <tr class="subtotal"><td><strong>SUBTOTAL PROJETOS</strong></td><td class="currency"><strong>R$ ${formatNumber(c.custoAdicionais)}</strong></td></tr>
</table>
` : ''}

<table>
  <tr class="section-title"><td colspan="2">DETALHES TÉCNICOS - FATORES APLICADOS</td></tr>
  <tr class="table-header"><td>Fator</td><td>Ajuste</td></tr>
  <tr><td>Regional (${c.regiao.nome})</td><td>${((c.regiao.fator - 1) * 100) >= 0 ? '+' : ''}${((c.regiao.fator - 1) * 100).toFixed(0)}%</td></tr>
  <tr class="row-alt"><td>Estrutura (${c.estrutura.nome})</td><td>${((c.estrutura.fator - 1) * 100) >= 0 ? '+' : ''}${((c.estrutura.fator - 1) * 100).toFixed(0)}%</td></tr>
  <tr><td>Método (${c.metodo.nome})</td><td>${((c.metodo.fator - 1) * 100) >= 0 ? '+' : ''}${((c.metodo.fator - 1) * 100).toFixed(0)}%</td></tr>
  <tr class="row-alt"><td>Padrão (${c.padrao.nome})</td><td>${((c.padrao.fator - 1) * 100) >= 0 ? '+' : ''}${((c.padrao.fator - 1) * 100).toFixed(0)}%</td></tr>
  ${c.isReforma ? `<tr class="depreciation"><td>Conservação (${c.conservacao.nome})</td><td>-${c.conservacao.desconto}%</td></tr>` : ''}
</table>

<table>
  <tr><td class="obs" colspan="2">
    <strong>Observações:</strong><br>
    • Valores de referência baseados em dados SINAPI e médias de mercado.<br>
    • Custos podem variar conforme localidade, período e negociação com fornecedores.<br>
    • Consulte profissionais para orçamentos detalhados.
  </td></tr>
</table>

</body>
</html>`;

    // Download como arquivo .xls (Excel reconhece HTML)
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento-construcao-${c.config.areaTotal}m2-${c.config.estado}-${Date.now()}.xls`;
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
    exportarExcel
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
