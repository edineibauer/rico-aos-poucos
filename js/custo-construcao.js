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
          <h2 class="cc-section-title">
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Descrição Rápida
            </span>
            <button class="cc-btn-toggle" data-target="descricao-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </h2>

          <div class="cc-section-content" id="descricao-content">
            <p class="cc-hint">Descreva o imóvel de forma livre e o sistema identificará automaticamente as características.</p>
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

            <details class="cc-dicas-details">
              <summary>Exemplos de descrição</summary>
              <div class="cc-dicas-grid">
                <span>120m²</span>
                <span>3 quartos</span>
                <span>1 suíte</span>
                <span>apartamento</span>
                <span>chácara</span>
                <span>sobrado</span>
                <span>bom estado</span>
                <span>alto padrão</span>
                <span>piscina</span>
              </div>
            </details>
          </div>
        </section>

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

    // Área em m² - priorizar área total/construída, ignorar áreas de cômodos específicos
    // Lista de termos que indicam cômodos específicos (não é a área total)
    const comodoTermos = ['salao', 'sala', 'cozinha', 'quarto', 'banheiro', 'churrasqueira', 'varanda', 'sacada', 'escritorio', 'closet', 'lavabo', 'despensa', 'edicula', 'garagem', 'suite', 'piscina', 'area gourmet', 'espaco gourmet', 'campeiro'];

    // Padrão 1: Área explícita total/construída/privativa (maior prioridade)
    const areaTotalPatterns = [
      /area\s*(?:total|construida|privativa|util)\s*(?:de\s*)?(\d+)\s*m[²2]?/i,
      /(\d+)\s*m[²2]?\s*(?:de\s*)?area\s*(?:total|construida|privativa|util)/i,
      /(?:casa|imovel|apartamento|apto|sobrado|residencia)\s+(?:de\s+|com\s+)?(\d+)\s*m[²2]/i,
      /(\d+)\s*m[²2]\s*(?:de\s*)?(?:casa|imovel|apartamento|apto|sobrado|residencia)/i
    ];

    let areaEncontrada = false;
    for (const pattern of areaTotalPatterns) {
      const match = texto.match(pattern);
      if (match) {
        const area = parseInt(match[1]);
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
      // Encontrar todas as menções de m²
      const areaRegex = /(\d+)\s*m[²2]/gi;
      let match;
      const areasEncontradas = [];

      while ((match = areaRegex.exec(texto)) !== null) {
        const area = parseInt(match[1]);
        if (area >= 20 && area <= 5000) {
          // Verificar o contexto antes do número (últimos 50 caracteres)
          const contextoBefore = texto.slice(Math.max(0, match.index - 50), match.index).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

          // Verificar se está associado a um cômodo específico
          const isComodo = comodoTermos.some(comodo => {
            // Verificar se o termo do cômodo aparece logo antes do número
            const regex = new RegExp(`${comodo}[^0-9]*$`, 'i');
            return regex.test(contextoBefore);
          });

          if (!isComodo) {
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

    // Estado/Região - PRIORIZAR CIDADES ANTES DE SIGLAS DE 2 LETRAS
    // Primeiro: cidades conhecidas (mais específico)
    const cidadesMap = {
      // RS
      'torres': 'RS', 'porto alegre': 'RS', 'gramado': 'RS', 'canela': 'RS', 'caxias do sul': 'RS',
      'pelotas': 'RS', 'santa maria': 'RS', 'novo hamburgo': 'RS', 'sao leopoldo': 'RS',
      'capao da canoa': 'RS', 'tramandai': 'RS', 'xangri-la': 'RS', 'osorio': 'RS',
      // SC
      'florianopolis': 'SC', 'floripa': 'SC', 'joinville': 'SC', 'blumenau': 'SC', 'balneario camboriu': 'SC',
      'itajai': 'SC', 'chapeco': 'SC', 'criciuma': 'SC', 'itapema': 'SC', 'bombinhas': 'SC',
      // PR
      'curitiba': 'PR', 'londrina': 'PR', 'maringa': 'PR', 'foz do iguacu': 'PR', 'cascavel': 'PR',
      'ponta grossa': 'PR', 'guarapuava': 'PR',
      // SP
      'sao paulo': 'SP', 'campinas': 'SP', 'santos': 'SP', 'guaruja': 'SP', 'ribeirao preto': 'SP',
      'sorocaba': 'SP', 'sao jose dos campos': 'SP', 'osasco': 'SP', 'santo andre': 'SP',
      'sao bernardo': 'SP', 'guarulhos': 'SP', 'praia grande': 'SP', 'ubatuba': 'SP', 'caraguatatuba': 'SP',
      // RJ
      'rio de janeiro': 'RJ', 'niteroi': 'RJ', 'petropolis': 'RJ', 'buzios': 'RJ', 'cabo frio': 'RJ',
      'angra dos reis': 'RJ', 'paraty': 'RJ', 'campos dos goytacazes': 'RJ', 'nova friburgo': 'RJ',
      // MG
      'belo horizonte': 'MG', 'uberlandia': 'MG', 'contagem': 'MG', 'juiz de fora': 'MG',
      'betim': 'MG', 'montes claros': 'MG', 'ouro preto': 'MG', 'tiradentes': 'MG',
      // BA
      'salvador': 'BA', 'feira de santana': 'BA', 'porto seguro': 'BA', 'ilheus': 'BA',
      'vitoria da conquista': 'BA', 'itabuna': 'BA', 'morro de sao paulo': 'BA',
      // CE
      'fortaleza': 'CE', 'caucaia': 'CE', 'juazeiro do norte': 'CE', 'jericoacoara': 'CE', 'canoa quebrada': 'CE',
      // PE
      'recife': 'PE', 'olinda': 'PE', 'jaboatao': 'PE', 'caruaru': 'PE', 'porto de galinhas': 'PE',
      // DF
      'brasilia': 'DF',
      // GO
      'goiania': 'GO', 'aparecida de goiania': 'GO', 'anapolis': 'GO', 'caldas novas': 'GO',
      // ES
      'vitoria': 'ES', 'vila velha': 'ES', 'serra': 'ES', 'guarapari': 'ES',
      // MT
      'cuiaba': 'MT', 'varzea grande': 'MT', 'rondonopolis': 'MT',
      // MS
      'campo grande': 'MS', 'dourados': 'MS', 'bonito': 'MS',
      // PA
      'belem': 'PA', 'ananindeua': 'PA', 'santarem': 'PA', 'maraba': 'PA', 'alter do chao': 'PA',
      // AM
      'manaus': 'AM', 'parintins': 'AM',
      // RN
      'natal': 'RN', 'parnamirim': 'RN', 'pipa': 'RN', 'mossoro': 'RN',
      // PB
      'joao pessoa': 'PB', 'campina grande': 'PB',
      // AL
      'maceio': 'AL', 'arapiraca': 'AL', 'maragogi': 'AL',
      // SE
      'aracaju': 'SE',
      // PI
      'teresina': 'PI',
      // MA
      'sao luis': 'MA', 'imperatriz': 'MA', 'lencois maranhenses': 'MA',
      // TO
      'palmas': 'TO',
      // RO
      'porto velho': 'RO',
      // AC
      'rio branco': 'AC',
      // RR
      'boa vista': 'RR',
      // AP
      'macapa': 'AP'
    };

    // Buscar cidade primeiro
    let estadoEncontrado = false;
    for (const [cidade, uf] of Object.entries(cidadesMap)) {
      if (textoLower.includes(cidade)) {
        resultado.config.estado = uf;
        resultado.encontrados.push(`Região: ${uf} (${cidade})`);
        estadoEncontrado = true;
        break;
      }
    }

    // Se não achou cidade, buscar por estado/sigla (apenas siglas isoladas com word boundary)
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
          break;
        }
      }
    }

    // Estado de conservação - usar word boundaries para evitar falsos positivos (ex: "cobra" contém "obra")
    const conservacaoMap = {
      'nova': ['\\bnova\\b', '\\brecem construida\\b', '\\bzerada\\b', '\\bnunca habitada\\b', '\\bconstrucao nova\\b'],
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
    // Primeiro verificar se "casa" está explicitamente mencionada
    const temCasa = /\bcasa\b/i.test(textoLower);
    const temSobrado = /\bsobrado\b/i.test(textoLower) || /\bdois\s*(andares|pisos)\b/i.test(textoLower) || /\b2\s*(andares|pisos)\b/i.test(textoLower) || /\bduplex\b/i.test(textoLower);

    // Verificar chácara/sítio apenas se for descrição da propriedade (não "mini sítio", "tipo sítio", etc)
    const temChacaraReal = /\bchacara\b/i.test(textoLower) ||
                          /\bfazenda\b/i.test(textoLower) ||
                          /\bcasa de campo\b/i.test(textoLower) ||
                          /\bzona rural\b/i.test(textoLower) ||
                          (/\bsitio\b/i.test(textoLower) && !/mini\s*sitio/i.test(textoLower) && !/tipo\s*sitio/i.test(textoLower));

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

    // Só usar chácara se for realmente uma chácara e não encontrou outro tipo
    if (!tipoEncontrado && temChacaraReal) {
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

    // Piscina
    if (textoLower.includes('piscina') && !isNegado('piscina')) {
      resultado.extras.piscina = true;
      resultado.encontrados.push('Extra: Piscina');
    }

    // Churrasqueira
    if ((textoLower.includes('churrasqueira') || textoLower.includes('espaco gourmet')) && !isNegado('churrasqueira') && !isNegado('gourmet')) {
      resultado.extras.churrasqueira = true;
      resultado.encontrados.push('Extra: Churrasqueira');
    }

    // Garagem - verificar negação e detectar menções de carros/vagas
    const garagemPatterns = [
      /\bgaragem\b/i,
      /\bvaga\b/i,
      /\bvagas\b/i,
      /\d+\s*carros?\b/i,        // "4 carros", "2 carro"
      /cabe\s*\d+\s*carros?/i,   // "cabe 4 carros"
      /para\s*\d+\s*carros?/i,   // "para 4 carros"
      /\bcobertura\s+para\s+carros?\b/i,
      /\bestacionamento\b/i
    ];

    const temGaragem = garagemPatterns.some(pattern => pattern.test(textoLower));
    if (temGaragem && !isNegado('garagem') && !isNegado('vaga') && !isNegado('carro')) {
      resultado.extras.garagem = true;
      resultado.encontrados.push('Extra: Garagem');
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

    // Edícula
    if ((textoLower.includes('edicula') || textoLower.includes('dependencia')) && !isNegado('edicula') && !isNegado('dependencia')) {
      resultado.extras.edicula = true;
      resultado.encontrados.push('Extra: Edícula');
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
    }

    // Atualizar resumos
    updateComodosResumo();
    calculate();
  }

  // Resetar formulário para valores padrão
  function resetFormulario() {
    // Reset config
    state.config = {
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
    };

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
      headerAreaEl.textContent = `${area}m²`;
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
