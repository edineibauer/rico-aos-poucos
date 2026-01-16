/**
 * Calculadora de Custo de Construção
 * Lógica principal e UI
 */

(function() {
  'use strict';

  // Estado da calculadora
  const state = {
    config: {
      estado: 'SP',
      tipoConstrucao: 'alvenaria',
      padrao: 'medio',
      areaTotal: 100,
      numQuartos: 3,
      numBanheiros: 2,
      numSuites: 1,
      temSala: true,
      temCozinha: true,
      temAreaServico: true,
      temGaragem: true,
      numVagasGaragem: 1
    },
    materiais: {
      janelas: 'aluminio',
      portas: 'madeira_semi_oca',
      pisos: 'ceramica_qualidade',
      telhado: 'ceramica',
      forro: 'gesso_liso'
    },
    maoDeObra: {
      pedreiro: true,
      eletricista: true,
      encanador: true,
      pintor: true,
      gesseiro: true,
      telhadista: true,
      vidraceiro: true,
      engenheiro: true,
      mestreObras: true
    },
    extras: {
      piscina: null,
      churrasqueira: null,
      muro: { tipo: null, metros: 0 },
      portao: { tipo: null, m2: 0 },
      edicula: null,
      varanda: { tipo: null, m2: 0 },
      energiaSolar: null,
      aquecedorSolar: false,
      automacao: null,
      seguranca: []
    },
    custosAdicionais: {
      projetoArquitetonico: true,
      projetoEstrutural: true,
      projetoEletrico: true,
      projetoHidraulico: true,
      aprovacaoPrefeitura: true,
      artRrt: true,
      ligacaoAgua: true,
      ligacaoEsgoto: true,
      ligacaoEnergia: true,
      habiteSe: true
    },
    itensZerados: new Set() // Itens que o usuário quer zerar o custo
  };

  let data = null; // Será preenchido com CustoConstrucaoData
  let lang = 'pt';

  // Inicialização
  function init() {
    if (typeof CustoConstrucaoData === 'undefined') {
      console.error('CustoConstrucaoData não carregado');
      return;
    }
    data = CustoConstrucaoData;

    // Detectar idioma
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

  // Construir interface
  function buildUI() {
    const container = document.getElementById('custo-construcao-container');
    if (!container) return;

    const t = data.i18n[lang] || data.i18n.pt;

    container.innerHTML = `
      <div class="cc-calculator">
        <!-- Configuração Básica -->
        <section class="cc-section cc-section-config">
          <h2 class="cc-section-title">${t.configuracaoBasica}</h2>

          <div class="cc-grid cc-grid-4">
            <div class="cc-field">
              <label>${t.regiao}</label>
              <select id="cc-estado">
                ${Object.entries(data.regioes).map(([uf, info]) =>
                  `<option value="${uf}" ${uf === state.config.estado ? 'selected' : ''}>${uf} - ${info.nome}</option>`
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

            <div class="cc-field">
              <label>${t.areaTotal}</label>
              <div class="cc-input-group">
                <input type="number" id="cc-area" value="${state.config.areaTotal}" min="30" max="1000" step="5">
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
            <div class="cc-grid cc-grid-5">
              <div class="cc-field">
                <label>Quartos</label>
                <input type="number" id="cc-quartos" value="${state.config.numQuartos}" min="0" max="10">
              </div>
              <div class="cc-field">
                <label>Suítes</label>
                <input type="number" id="cc-suites" value="${state.config.numSuites}" min="0" max="10">
              </div>
              <div class="cc-field">
                <label>Banheiros</label>
                <input type="number" id="cc-banheiros" value="${state.config.numBanheiros}" min="1" max="10">
              </div>
              <div class="cc-field">
                <label>Vagas Garagem</label>
                <input type="number" id="cc-vagas" value="${state.config.numVagasGaragem}" min="0" max="5">
              </div>
              <div class="cc-field cc-field-checkbox">
                <label>
                  <input type="checkbox" id="cc-area-servico" ${state.config.temAreaServico ? 'checked' : ''}>
                  Área de Serviço
                </label>
              </div>
            </div>
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
            <div class="cc-grid cc-grid-3">
              ${buildMaterialSelect('janelas', 'Janelas')}
              ${buildMaterialSelect('portas', 'Portas')}
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
            <p class="cc-hint">Desmarque os profissionais cujo custo você não terá (ex: você mesmo faz, ou alguém faz de graça).</p>
            <div class="cc-grid cc-grid-4">
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
                  <span class="cc-extra-name">Churrasqueira</span>
                </div>
                <div class="cc-extra-options" id="cc-churrasqueira-options" style="display:none;">
                  <select id="cc-churrasqueira-tipo">
                    ${Object.entries(data.extras.churrasqueira).map(([key, info]) =>
                      `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valor)}</option>`
                    ).join('')}
                  </select>
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

              <!-- Varanda Extra -->
              <div class="cc-extra-item">
                <div class="cc-extra-header">
                  <label class="cc-switch">
                    <input type="checkbox" id="cc-extra-varanda">
                    <span class="cc-switch-slider"></span>
                  </label>
                  <span class="cc-extra-name">Varanda/Terraço Extra</span>
                </div>
                <div class="cc-extra-options" id="cc-varanda-options" style="display:none;">
                  <select id="cc-varanda-tipo">
                    ${Object.entries(data.extras.varanda).map(([key, info]) =>
                      `<option value="${key}">${info.nome} - R$ ${formatNumber(info.valorM2)}/m²</option>`
                    ).join('')}
                  </select>
                  <div class="cc-input-group cc-input-inline">
                    <input type="number" id="cc-varanda-m2" value="15" min="5" max="100">
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
                  <span class="cc-extra-price">R$ ${formatNumber(data.extras.energia.aquecedor_solar.valor)}</span>
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
            <p class="cc-hint">Desmarque os custos que você não terá.</p>
            <div class="cc-grid cc-grid-3">
              ${buildCustosAdicionaisCheckboxes()}
            </div>
          </div>
        </section>

        <!-- Resultado -->
        <section class="cc-section cc-section-resultado">
          <h2 class="cc-section-title">${t.resultado}</h2>

          <div class="cc-resultado-card" id="cc-resultado">
            <div class="cc-resultado-loading">
              Calculando...
            </div>
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
            const preco = info.valorM2
              ? `R$ ${formatNumber(info.valorM2)}/m²`
              : `R$ ${formatNumber(info.valorUnidade)}/un`;
            return `<option value="${k}" ${k === state.materiais[key] ? 'selected' : ''}>${info.nome} - ${preco}</option>`;
          }).join('')}
        </select>
      </div>
    `;
  }

  function buildMaoDeObraCheckboxes() {
    const profissionais = [
      { key: 'pedreiro', label: 'Pedreiro' },
      { key: 'eletricista', label: 'Eletricista' },
      { key: 'encanador', label: 'Encanador' },
      { key: 'pintor', label: 'Pintor' },
      { key: 'gesseiro', label: 'Gesseiro' },
      { key: 'telhadista', label: 'Telhadista' },
      { key: 'vidraceiro', label: 'Vidraceiro' },
      { key: 'engenheiro', label: 'Engenheiro' },
      { key: 'mestreObras', label: 'Mestre de Obras' }
    ];

    return profissionais.map(p => `
      <div class="cc-field cc-field-checkbox">
        <label>
          <input type="checkbox" id="cc-mao-${p.key}" data-profissional="${p.key}" ${state.maoDeObra[p.key] ? 'checked' : ''}>
          ${p.label}
        </label>
      </div>
    `).join('');
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
          valorStr = `${custoData.percentual}% da obra`;
        }
      }
      return `
        <div class="cc-field cc-field-checkbox">
          <label>
            <input type="checkbox" id="cc-custo-${c.key}" data-custo="${c.key}" ${state.custosAdicionais[c.key] ? 'checked' : ''}>
            ${c.label}
            <span class="cc-custo-valor">${valorStr}</span>
          </label>
        </div>
      `;
    }).join('');
  }

  function updateTipoInfo() {
    const tipoInfo = document.getElementById('cc-tipo-info');
    if (!tipoInfo) return;

    const tipo = data.tiposConstrucao[state.config.tipoConstrucao];
    if (!tipo) return;

    tipoInfo.innerHTML = `
      <div class="cc-tipo-card">
        <p class="cc-tipo-desc">${tipo.descricao}</p>
        <div class="cc-tipo-details">
          <div class="cc-tipo-detail">
            <span class="cc-tipo-label">Fator de custo:</span>
            <span class="cc-tipo-value ${tipo.fator > 1 ? 'cc-red' : tipo.fator < 1 ? 'cc-green' : ''}">${tipo.fator > 1 ? '+' : ''}${((tipo.fator - 1) * 100).toFixed(0)}%</span>
          </div>
          <div class="cc-tipo-detail">
            <span class="cc-tipo-label">Tempo de obra:</span>
            <span class="cc-tipo-value ${tipo.tempoObra < 1 ? 'cc-green' : ''}">${tipo.tempoObra < 1 ? '-' + ((1 - tipo.tempoObra) * 100).toFixed(0) + '%' : 'Normal'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Event Listeners
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
    document.getElementById('cc-estado')?.addEventListener('change', function() {
      state.config.estado = this.value;
      calculate();
    });

    document.getElementById('cc-tipo-construcao')?.addEventListener('change', function() {
      state.config.tipoConstrucao = this.value;
      updateTipoInfo();
      calculate();
    });

    document.getElementById('cc-padrao')?.addEventListener('change', function() {
      state.config.padrao = this.value;
      calculate();
    });

    document.getElementById('cc-area')?.addEventListener('input', function() {
      state.config.areaTotal = parseFloat(this.value) || 100;
      calculate();
    });

    document.getElementById('cc-quartos')?.addEventListener('input', function() {
      state.config.numQuartos = parseInt(this.value) || 0;
      calculate();
    });

    document.getElementById('cc-suites')?.addEventListener('input', function() {
      state.config.numSuites = parseInt(this.value) || 0;
      calculate();
    });

    document.getElementById('cc-banheiros')?.addEventListener('input', function() {
      state.config.numBanheiros = parseInt(this.value) || 1;
      calculate();
    });

    document.getElementById('cc-vagas')?.addEventListener('input', function() {
      state.config.numVagasGaragem = parseInt(this.value) || 0;
      calculate();
    });

    document.getElementById('cc-area-servico')?.addEventListener('change', function() {
      state.config.temAreaServico = this.checked;
      calculate();
    });

    // Material changes
    document.querySelectorAll('[id^="cc-material-"]').forEach(select => {
      select.addEventListener('change', function() {
        const categoria = this.dataset.categoria;
        state.materiais[categoria] = this.value;
        calculate();
      });
    });

    // Mão de obra changes
    document.querySelectorAll('[data-profissional]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const prof = this.dataset.profissional;
        state.maoDeObra[prof] = this.checked;
        calculate();
      });
    });

    // Custos adicionais
    document.querySelectorAll('[data-custo]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const custo = this.dataset.custo;
        state.custosAdicionais[custo] = this.checked;
        calculate();
      });
    });

    // Extras toggles
    setupExtraToggle('piscina', 'cc-piscina-options');
    setupExtraToggle('churrasqueira', 'cc-churrasqueira-options');
    setupExtraToggle('muro', 'cc-muro-options');
    setupExtraToggle('portao', 'cc-portao-options');
    setupExtraToggle('edicula', 'cc-edicula-options');
    setupExtraToggle('varanda', 'cc-varanda-options');
    setupExtraToggle('solar', 'cc-solar-options');
    setupExtraToggle('aquecedor');
    setupExtraToggle('automacao', 'cc-automacao-options');
    setupExtraToggle('seguranca', 'cc-seguranca-options');

    // Extra option changes
    document.getElementById('cc-piscina-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-churrasqueira-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-muro-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-muro-metros')?.addEventListener('input', calculate);
    document.getElementById('cc-portao-tipo')?.addEventListener('change', function() {
      const tipo = data.extras.portao[this.value];
      const m2Group = document.getElementById('cc-portao-m2-group');
      if (m2Group) {
        m2Group.style.display = tipo.valorUnidade ? 'none' : 'flex';
      }
      calculate();
    });
    document.getElementById('cc-portao-m2')?.addEventListener('input', calculate);
    document.getElementById('cc-edicula-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-edicula-m2')?.addEventListener('input', calculate);
    document.getElementById('cc-varanda-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-varanda-m2')?.addEventListener('input', calculate);
    document.getElementById('cc-solar-tipo')?.addEventListener('change', calculate);
    document.getElementById('cc-automacao-tipo')?.addEventListener('change', calculate);

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
    document.getElementById('cc-cerca-metros')?.addEventListener('input', calculate);
  }

  function setupExtraToggle(extraName, optionsId = null) {
    const checkbox = document.getElementById(`cc-extra-${extraName}`);
    const options = optionsId ? document.getElementById(optionsId) : null;

    if (checkbox) {
      checkbox.addEventListener('change', function() {
        if (options) {
          options.style.display = this.checked ? 'block' : 'none';
        }
        calculate();
      });
    }
  }

  // Cálculo principal
  function calculate() {
    const resultado = document.getElementById('cc-resultado');
    if (!resultado) return;

    // Dados base
    const regiao = data.regioes[state.config.estado];
    const tipoConstrucao = data.tiposConstrucao[state.config.tipoConstrucao];
    const padrao = data.padroes[state.config.padrao];
    const area = state.config.areaTotal;

    // Custo base por m²
    const custoBaseM2 = data.custoBaseM2.materiais + data.custoBaseM2.maoDeObra;

    // Aplicar fatores
    let custoM2Ajustado = custoBaseM2 * regiao.fator * tipoConstrucao.fator * padrao.fator;

    // Separar materiais e mão de obra
    const proporcaoMateriais = data.custoBaseM2.materiais / custoBaseM2;
    const proporcaoMaoObra = data.custoBaseM2.maoDeObra / custoBaseM2;

    let custoMateriais = custoM2Ajustado * proporcaoMateriais * area;
    let custoMaoObra = custoM2Ajustado * proporcaoMaoObra * area;

    // Ajustar mão de obra se profissionais foram desmarcados
    const totalProfissionais = Object.keys(state.maoDeObra).length;
    const profissionaisAtivos = Object.values(state.maoDeObra).filter(v => v).length;
    const fatorMaoObra = profissionaisAtivos / totalProfissionais;
    custoMaoObra = custoMaoObra * fatorMaoObra;

    // Custo base da construção
    let custoBase = custoMateriais + custoMaoObra;

    // ===== EXTRAS =====
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

    // Varanda Extra
    if (document.getElementById('cc-extra-varanda')?.checked) {
      const tipo = document.getElementById('cc-varanda-tipo')?.value;
      const m2 = parseFloat(document.getElementById('cc-varanda-m2')?.value) || 15;
      if (tipo && data.extras.varanda[tipo]) {
        const valor = data.extras.varanda[tipo].valorM2 * m2;
        custoExtras += valor;
        detalhesExtras.push({ nome: `${data.extras.varanda[tipo].nome} (${m2}m²)`, valor });
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
      const valor = data.extras.energia.aquecedor_solar.valor;
      custoExtras += valor;
      detalhesExtras.push({ nome: 'Aquecedor Solar', valor });
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

    // ===== CUSTOS ADICIONAIS =====
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

    // ===== TOTAL =====
    const custoTotal = custoBase + custoExtras + custoAdicionais;
    const custoM2Final = custoTotal / area;

    // Render resultado
    resultado.innerHTML = `
      <div class="cc-resultado-main">
        <div class="cc-resultado-total">
          <span class="cc-resultado-label">Custo Total Estimado</span>
          <span class="cc-resultado-valor">R$ ${formatNumber(custoTotal)}</span>
          <span class="cc-resultado-m2">R$ ${formatNumber(custoM2Final)}/m²</span>
        </div>

        <div class="cc-resultado-breakdown">
          <div class="cc-breakdown-item">
            <span class="cc-breakdown-label">Construção Base (${area}m²)</span>
            <span class="cc-breakdown-valor">R$ ${formatNumber(custoBase)}</span>
          </div>
          <div class="cc-breakdown-sub">
            <span>Materiais</span>
            <span>R$ ${formatNumber(custoMateriais)}</span>
          </div>
          <div class="cc-breakdown-sub">
            <span>Mão de Obra</span>
            <span>R$ ${formatNumber(custoMaoObra)}</span>
          </div>

          ${custoExtras > 0 ? `
            <div class="cc-breakdown-item">
              <span class="cc-breakdown-label">Itens Extras</span>
              <span class="cc-breakdown-valor">R$ ${formatNumber(custoExtras)}</span>
            </div>
            ${detalhesExtras.map(e => `
              <div class="cc-breakdown-sub">
                <span>${e.nome}</span>
                <span>R$ ${formatNumber(e.valor)}</span>
              </div>
            `).join('')}
          ` : ''}

          ${custoAdicionais > 0 ? `
            <div class="cc-breakdown-item">
              <span class="cc-breakdown-label">Projetos e Taxas</span>
              <span class="cc-breakdown-valor">R$ ${formatNumber(custoAdicionais)}</span>
            </div>
            ${detalhesAdicionais.map(e => `
              <div class="cc-breakdown-sub">
                <span>${e.nome}</span>
                <span>R$ ${formatNumber(e.valor)}</span>
              </div>
            `).join('')}
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
            <span class="cc-info-label">Tipo</span>
            <span class="cc-info-value">${tipoConstrucao.nome}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Padrão</span>
            <span class="cc-info-value">${padrao.nome}</span>
          </div>
          <div class="cc-info-item">
            <span class="cc-info-label">Custo base região</span>
            <span class="cc-info-value">R$ ${formatNumber(regiao.custoM2)}/m²</span>
          </div>
        </div>
      </div>

      <div class="cc-resultado-actions">
        <button class="cc-btn cc-btn-primary" onclick="CustoConstrucao.exportar()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar Orçamento
        </button>
      </div>
    `;
  }

  // Exportar orçamento
  function exportar() {
    const resultado = document.getElementById('cc-resultado');
    if (!resultado) return;

    const texto = resultado.innerText;
    const data = new Date().toLocaleDateString('pt-BR');

    const conteudo = `
ORÇAMENTO DE CONSTRUÇÃO
Gerado em: ${data}
Rico aos Poucos - ricoaospoucos.com.br

${texto}

---
Este é um orçamento estimativo baseado em valores médios de mercado.
Os valores reais podem variar conforme fornecedores e condições locais.
    `.trim();

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento-construcao-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Utilitários
  function formatNumber(num) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // API pública
  window.CustoConstrucao = {
    init,
    calculate,
    exportar
  };

  // Auto-init quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
