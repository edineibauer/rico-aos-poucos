/**
 * Interface de Usuário - Pesquisa de Preços de Mercado
 * Rico aos Poucos - 2026
 */

const PesquisaPrecosUI = (function() {
  'use strict';

  let container = null;
  let currentView = 'dashboard'; // dashboard, adicionar, lista, estatisticas

  // Formatar moeda
  function formatarMoeda(valor) {
    if (!valor) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  // Formatar percentual
  function formatarPercent(valor) {
    if (valor === undefined || valor === null) return '0%';
    const sinal = valor > 0 ? '+' : '';
    return `${sinal}${valor.toFixed(1)}%`;
  }

  // Obter classe de cor baseado na diferença
  function getCorDiferenca(valor) {
    if (valor > 15) return 'pesquisa-muito-acima';  // vermelho
    if (valor > 5) return 'pesquisa-acima';         // laranja
    if (valor < -15) return 'pesquisa-muito-abaixo'; // verde escuro
    if (valor < -5) return 'pesquisa-abaixo';       // verde
    return 'pesquisa-neutro';                       // cinza
  }

  // Render principal
  function render() {
    if (!container) return;

    const stats = PesquisaPrecos.getEstatisticasGerais();

    container.innerHTML = `
      <div class="pesquisa-precos-wrapper">
        <header class="pesquisa-header">
          <h2>Pesquisa de Preços de Mercado</h2>
          <p class="pesquisa-subtitle">Compare anúncios reais com valores calculados pelo sistema</p>
        </header>

        <nav class="pesquisa-nav">
          <button class="pesquisa-nav-btn ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            Dashboard
          </button>
          <button class="pesquisa-nav-btn ${currentView === 'adicionar' ? 'active' : ''}" data-view="adicionar">
            + Adicionar Anúncio
          </button>
          <button class="pesquisa-nav-btn ${currentView === 'lista' ? 'active' : ''}" data-view="lista">
            Lista (${stats.totalAnuncios})
          </button>
          <button class="pesquisa-nav-btn ${currentView === 'estatisticas' ? 'active' : ''}" data-view="estatisticas">
            Estatísticas
          </button>
        </nav>

        <div class="pesquisa-content">
          ${renderContent()}
        </div>
      </div>
    `;

    attachEventListeners();
  }

  // Render conteúdo baseado na view atual
  function renderContent() {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'adicionar': return renderFormulario();
      case 'lista': return renderLista();
      case 'estatisticas': return renderEstatisticas();
      default: return renderDashboard();
    }
  }

  // Dashboard principal
  function renderDashboard() {
    const stats = PesquisaPrecos.getEstatisticasGerais();
    const regioes = PesquisaPrecos.getRegioes();

    if (stats.totalAnuncios === 0) {
      return `
        <div class="pesquisa-empty">
          <div class="pesquisa-empty-icon">📊</div>
          <h3>Nenhum anúncio cadastrado</h3>
          <p>Comece adicionando anúncios de imóveis da região para comparar com os valores calculados pelo sistema.</p>
          <button class="pesquisa-btn-primary" data-action="goto-adicionar">
            + Adicionar Primeiro Anúncio
          </button>
        </div>
      `;
    }

    // Cards de resumo por cidade
    let cidadeCards = '';
    for (const [key, info] of Object.entries(regioes)) {
      const cidadeStats = stats.porCidade[key];
      if (cidadeStats && cidadeStats.totalAnuncios > 0) {
        cidadeCards += `
          <div class="pesquisa-cidade-card">
            <h4>${info.nome} - ${info.uf}</h4>
            <div class="pesquisa-cidade-stats">
              <div class="pesquisa-stat">
                <span class="pesquisa-stat-value">${cidadeStats.totalAnuncios}</span>
                <span class="pesquisa-stat-label">anúncios</span>
              </div>
              <div class="pesquisa-stat">
                <span class="pesquisa-stat-value ${getCorDiferenca(cidadeStats.diferencaMedia)}">
                  ${formatarPercent(cidadeStats.diferencaMedia)}
                </span>
                <span class="pesquisa-stat-label">diferença média</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Últimos anúncios
    const ultimosAnuncios = PesquisaPrecos.getAnuncios().slice(0, 5);
    let listaRecentes = '';
    for (const anuncio of ultimosAnuncios) {
      listaRecentes += `
        <div class="pesquisa-anuncio-mini">
          <div class="pesquisa-anuncio-info">
            <strong>${anuncio.tipoNome}</strong> - ${anuncio.cidadeNome}
            ${anuncio.bairro ? `(${anuncio.bairro})` : ''}
          </div>
          <div class="pesquisa-anuncio-valores">
            <span>Anúncio: ${formatarMoeda(anuncio.precoAnunciado)}</span>
            <span class="${getCorDiferenca(anuncio.diferencaPercent)}">
              ${formatarPercent(anuncio.diferencaPercent)}
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div class="pesquisa-dashboard">
        <div class="pesquisa-resumo-geral">
          <div class="pesquisa-resumo-card pesquisa-resumo-principal">
            <h3>Resumo Geral</h3>
            <div class="pesquisa-resumo-grid">
              <div class="pesquisa-resumo-item">
                <span class="pesquisa-resumo-valor">${stats.totalAnuncios}</span>
                <span class="pesquisa-resumo-label">Total de Anúncios</span>
              </div>
              <div class="pesquisa-resumo-item">
                <span class="pesquisa-resumo-valor ${getCorDiferenca(stats.diferencaMedia)}">
                  ${formatarPercent(stats.diferencaMedia)}
                </span>
                <span class="pesquisa-resumo-label">Diferença Média</span>
              </div>
              <div class="pesquisa-resumo-item">
                <span class="pesquisa-resumo-valor ${getCorDiferenca(stats.diferencaMediana)}">
                  ${formatarPercent(stats.diferencaMediana)}
                </span>
                <span class="pesquisa-resumo-label">Diferença Mediana</span>
              </div>
              <div class="pesquisa-resumo-item">
                <span class="pesquisa-resumo-valor pesquisa-sugestao">
                  ${formatarPercent(stats.sugestaoAjuste)}
                </span>
                <span class="pesquisa-resumo-label">Sugestão de Ajuste</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pesquisa-interpretacao">
          <h4>Interpretação:</h4>
          ${stats.diferencaMediana > 5 ? `
            <p class="pesquisa-alerta-acima">
              O mercado está pedindo em média <strong>${formatarPercent(stats.diferencaMediana)}</strong> acima do que o sistema calcula.
              Isso pode indicar que o sistema está subvalorizando os imóveis da região ou que o mercado está aquecido.
            </p>
          ` : stats.diferencaMediana < -5 ? `
            <p class="pesquisa-alerta-abaixo">
              O mercado está pedindo em média <strong>${formatarPercent(Math.abs(stats.diferencaMediana))}</strong> abaixo do que o sistema calcula.
              Isso pode indicar oportunidades de compra ou que o sistema está supervalorizando.
            </p>
          ` : `
            <p class="pesquisa-alerta-neutro">
              O sistema está bem calibrado para esta região. A diferença mediana de <strong>${formatarPercent(stats.diferencaMediana)}</strong> está dentro da margem aceitável.
            </p>
          `}
        </div>

        <div class="pesquisa-section">
          <h3>Por Cidade</h3>
          <div class="pesquisa-cidades-grid">
            ${cidadeCards || '<p class="pesquisa-empty-msg">Adicione anúncios para ver estatísticas por cidade</p>'}
          </div>
        </div>

        <div class="pesquisa-section">
          <h3>Últimos Anúncios</h3>
          <div class="pesquisa-recentes">
            ${listaRecentes || '<p class="pesquisa-empty-msg">Nenhum anúncio recente</p>'}
          </div>
        </div>
      </div>
    `;
  }

  // Formulário de adicionar
  function renderFormulario() {
    const regioes = PesquisaPrecos.getRegioes();
    const tipos = PesquisaPrecos.getTipos();

    let cidadeOptions = '';
    for (const [key, info] of Object.entries(regioes)) {
      cidadeOptions += `<option value="${key}">${info.nome} - ${info.uf}</option>`;
    }

    let tipoOptions = '';
    for (const [key, nome] of Object.entries(tipos)) {
      tipoOptions += `<option value="${key}">${nome}</option>`;
    }

    return `
      <div class="pesquisa-formulario">
        <div class="pesquisa-form-section">
          <h3>Cole a Descrição do Anúncio</h3>
          <p class="pesquisa-form-help">Cole o texto completo do anúncio. O sistema tentará extrair automaticamente as informações.</p>
          <textarea id="pesquisa-descricao" class="pesquisa-textarea" rows="6" placeholder="Cole aqui a descrição do anúncio...

Exemplo:
Casa 3 quartos em Torres
Área: 120m² | Terreno: 300m²
R$ 450.000
Bairro Centro"></textarea>
          <button class="pesquisa-btn-secondary" id="pesquisa-btn-analisar">
            Analisar Texto
          </button>
        </div>

        <div class="pesquisa-form-section">
          <h3>Informações do Anúncio</h3>

          <div class="pesquisa-form-row">
            <div class="pesquisa-form-group">
              <label>Preço Anunciado (R$) *</label>
              <input type="number" id="pesquisa-preco" class="pesquisa-input" placeholder="Ex: 450000">
            </div>
            <div class="pesquisa-form-group">
              <label>Cidade *</label>
              <select id="pesquisa-cidade" class="pesquisa-select">
                ${cidadeOptions}
              </select>
            </div>
          </div>

          <div class="pesquisa-form-row">
            <div class="pesquisa-form-group">
              <label>Tipo de Imóvel</label>
              <select id="pesquisa-tipo" class="pesquisa-select">
                ${tipoOptions}
              </select>
            </div>
            <div class="pesquisa-form-group">
              <label>Bairro</label>
              <input type="text" id="pesquisa-bairro" class="pesquisa-input" placeholder="Ex: Centro">
            </div>
          </div>

          <div class="pesquisa-form-row">
            <div class="pesquisa-form-group">
              <label>Área Construída (m²)</label>
              <input type="number" id="pesquisa-area" class="pesquisa-input" placeholder="Ex: 120">
            </div>
            <div class="pesquisa-form-group">
              <label>Área do Terreno (m²)</label>
              <input type="number" id="pesquisa-area-terreno" class="pesquisa-input" placeholder="Ex: 300">
            </div>
          </div>

          <div class="pesquisa-form-row">
            <div class="pesquisa-form-group">
              <label>Quartos</label>
              <input type="number" id="pesquisa-quartos" class="pesquisa-input" placeholder="Ex: 3" min="0" max="20">
            </div>
            <div class="pesquisa-form-group">
              <label>Banheiros</label>
              <input type="number" id="pesquisa-banheiros" class="pesquisa-input" placeholder="Ex: 2" min="0" max="20">
            </div>
          </div>

          <div class="pesquisa-form-group">
            <label>Fonte do Anúncio</label>
            <input type="text" id="pesquisa-fonte" class="pesquisa-input" placeholder="Ex: OLX, ZAP, VivaReal...">
          </div>

          <div class="pesquisa-form-group">
            <label>URL do Anúncio (opcional)</label>
            <input type="url" id="pesquisa-url" class="pesquisa-input" placeholder="https://...">
          </div>

          <div class="pesquisa-form-group">
            <label>Observações</label>
            <textarea id="pesquisa-obs" class="pesquisa-textarea" rows="2" placeholder="Notas adicionais..."></textarea>
          </div>
        </div>

        <div class="pesquisa-form-actions">
          <button class="pesquisa-btn-primary" id="pesquisa-btn-salvar">
            Salvar Anúncio
          </button>
          <button class="pesquisa-btn-secondary" id="pesquisa-btn-limpar">
            Limpar Formulário
          </button>
        </div>

        <div id="pesquisa-resultado-preview" class="pesquisa-preview" style="display: none;">
          <h4>Preview da Comparação</h4>
          <div class="pesquisa-preview-content"></div>
        </div>
      </div>
    `;
  }

  // Lista de anúncios
  function renderLista() {
    const anuncios = PesquisaPrecos.getAnuncios();
    const regioes = PesquisaPrecos.getRegioes();
    const tipos = PesquisaPrecos.getTipos();

    if (anuncios.length === 0) {
      return `
        <div class="pesquisa-empty">
          <p>Nenhum anúncio cadastrado ainda.</p>
          <button class="pesquisa-btn-primary" data-action="goto-adicionar">
            + Adicionar Anúncio
          </button>
        </div>
      `;
    }

    // Filtros
    let cidadeOptions = '<option value="">Todas as cidades</option>';
    for (const [key, info] of Object.entries(regioes)) {
      cidadeOptions += `<option value="${key}">${info.nome}</option>`;
    }

    let tipoOptions = '<option value="">Todos os tipos</option>';
    for (const [key, nome] of Object.entries(tipos)) {
      tipoOptions += `<option value="${key}">${nome}</option>`;
    }

    let listaHtml = '';
    for (const anuncio of anuncios) {
      listaHtml += `
        <div class="pesquisa-anuncio-card" data-id="${anuncio.id}">
          <div class="pesquisa-anuncio-header">
            <div class="pesquisa-anuncio-tipo">${anuncio.tipoNome}</div>
            <div class="pesquisa-anuncio-local">
              ${anuncio.cidadeNome} ${anuncio.bairro ? `- ${anuncio.bairro}` : ''}
            </div>
            <button class="pesquisa-btn-icon pesquisa-btn-delete" data-action="delete" data-id="${anuncio.id}" title="Remover">
              ×
            </button>
          </div>

          <div class="pesquisa-anuncio-body">
            <div class="pesquisa-anuncio-caracteristicas">
              ${anuncio.area ? `<span>Área: ${anuncio.area}m²</span>` : ''}
              ${anuncio.areaTerreno ? `<span>Terreno: ${anuncio.areaTerreno}m²</span>` : ''}
              ${anuncio.quartos ? `<span>${anuncio.quartos} quartos</span>` : ''}
              ${anuncio.banheiros ? `<span>${anuncio.banheiros} banheiros</span>` : ''}
            </div>

            <div class="pesquisa-anuncio-valores-grid">
              <div class="pesquisa-valor-item">
                <span class="pesquisa-valor-label">Anunciado</span>
                <span class="pesquisa-valor-numero">${formatarMoeda(anuncio.precoAnunciado)}</span>
              </div>
              <div class="pesquisa-valor-item">
                <span class="pesquisa-valor-label">Calculado</span>
                <span class="pesquisa-valor-numero">${formatarMoeda(anuncio.valorCalculado)}</span>
              </div>
              <div class="pesquisa-valor-item">
                <span class="pesquisa-valor-label">Diferença</span>
                <span class="pesquisa-valor-numero ${getCorDiferenca(anuncio.diferencaPercent)}">
                  ${formatarPercent(anuncio.diferencaPercent)}
                </span>
              </div>
            </div>

            ${anuncio.descricao ? `
              <div class="pesquisa-anuncio-descricao">
                <small>${anuncio.descricao.substring(0, 150)}${anuncio.descricao.length > 150 ? '...' : ''}</small>
              </div>
            ` : ''}

            ${anuncio.fonte ? `<div class="pesquisa-anuncio-fonte">Fonte: ${anuncio.fonte}</div>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="pesquisa-lista">
        <div class="pesquisa-filtros">
          <select id="pesquisa-filtro-cidade" class="pesquisa-select-small">
            ${cidadeOptions}
          </select>
          <select id="pesquisa-filtro-tipo" class="pesquisa-select-small">
            ${tipoOptions}
          </select>
          <button class="pesquisa-btn-secondary-small" id="pesquisa-btn-exportar">
            Exportar JSON
          </button>
        </div>

        <div class="pesquisa-anuncios-grid">
          ${listaHtml}
        </div>
      </div>
    `;
  }

  // Estatísticas detalhadas
  function renderEstatisticas() {
    const stats = PesquisaPrecos.getEstatisticasGerais();
    const regioes = PesquisaPrecos.getRegioes();

    if (stats.totalAnuncios === 0) {
      return `
        <div class="pesquisa-empty">
          <p>Adicione anúncios para ver as estatísticas detalhadas.</p>
          <button class="pesquisa-btn-primary" data-action="goto-adicionar">
            + Adicionar Anúncio
          </button>
        </div>
      `;
    }

    // Tabela por cidade
    let tabelaCidades = '';
    for (const [key, cidadeStats] of Object.entries(stats.porCidade)) {
      const info = regioes[key];
      tabelaCidades += `
        <tr>
          <td><strong>${info?.nome || key}</strong> - ${info?.uf || ''}</td>
          <td>${cidadeStats.totalAnuncios}</td>
          <td class="${getCorDiferenca(cidadeStats.diferencaMedia)}">${formatarPercent(cidadeStats.diferencaMedia)}</td>
          <td class="${getCorDiferenca(cidadeStats.diferencaMediana)}">${formatarPercent(cidadeStats.diferencaMediana)}</td>
        </tr>
      `;

      // Detalhes por bairro
      if (Object.keys(cidadeStats.porBairro).length > 0) {
        for (const [bairro, bairroStats] of Object.entries(cidadeStats.porBairro)) {
          tabelaCidades += `
            <tr class="pesquisa-row-bairro">
              <td style="padding-left: 30px;">↳ ${bairro}</td>
              <td>${bairroStats.count}</td>
              <td class="${getCorDiferenca(bairroStats.media)}">${formatarPercent(bairroStats.media)}</td>
              <td>-</td>
            </tr>
          `;
        }
      }
    }

    // Gráfico de barras simples (ASCII/HTML)
    let graficoBarras = '';
    for (const [key, cidadeStats] of Object.entries(stats.porCidade)) {
      const info = regioes[key];
      const valor = cidadeStats.diferencaMedia;
      const largura = Math.min(Math.abs(valor) * 2, 100);
      const direcao = valor >= 0 ? 'right' : 'left';

      graficoBarras += `
        <div class="pesquisa-grafico-row">
          <div class="pesquisa-grafico-label">${info?.nome || key}</div>
          <div class="pesquisa-grafico-bar-container">
            <div class="pesquisa-grafico-center"></div>
            <div class="pesquisa-grafico-bar pesquisa-grafico-${direcao} ${getCorDiferenca(valor)}"
                 style="width: ${largura}%"></div>
          </div>
          <div class="pesquisa-grafico-valor ${getCorDiferenca(valor)}">${formatarPercent(valor)}</div>
        </div>
      `;
    }

    return `
      <div class="pesquisa-estatisticas">
        <div class="pesquisa-section">
          <h3>Resumo por Região</h3>
          <div class="pesquisa-table-container">
            <table class="pesquisa-table">
              <thead>
                <tr>
                  <th>Cidade/Bairro</th>
                  <th>Anúncios</th>
                  <th>Dif. Média</th>
                  <th>Dif. Mediana</th>
                </tr>
              </thead>
              <tbody>
                ${tabelaCidades}
              </tbody>
            </table>
          </div>
        </div>

        <div class="pesquisa-section">
          <h3>Gráfico de Diferenças por Cidade</h3>
          <p class="pesquisa-grafico-legenda">
            <span class="pesquisa-legenda-item pesquisa-abaixo">← Mercado abaixo do sistema</span>
            <span class="pesquisa-legenda-item pesquisa-acima">Mercado acima do sistema →</span>
          </p>
          <div class="pesquisa-grafico">
            ${graficoBarras}
          </div>
        </div>

        <div class="pesquisa-section">
          <h3>Recomendações de Ajuste</h3>
          <div class="pesquisa-recomendacoes">
            ${Object.entries(stats.porCidade).map(([key, cidadeStats]) => {
              const info = regioes[key];
              const ajuste = -cidadeStats.diferencaMediana;
              if (Math.abs(ajuste) < 5) return '';

              return `
                <div class="pesquisa-recomendacao-item">
                  <strong>${info?.nome || key}:</strong>
                  ${ajuste > 0
                    ? `Aumentar valores em aproximadamente <span class="pesquisa-acima">${formatarPercent(ajuste)}</span>`
                    : `Reduzir valores em aproximadamente <span class="pesquisa-abaixo">${formatarPercent(Math.abs(ajuste))}</span>`
                  }
                  <small>(baseado em ${cidadeStats.totalAnuncios} anúncios)</small>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="pesquisa-section">
          <h3>Ações</h3>
          <div class="pesquisa-acoes">
            <button class="pesquisa-btn-secondary" id="pesquisa-btn-exportar-completo">
              Exportar Relatório Completo (JSON)
            </button>
            <button class="pesquisa-btn-danger" id="pesquisa-btn-limpar-dados">
              Limpar Todos os Dados
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Anexar event listeners
  function attachEventListeners() {
    if (!container) return;

    // Navegação
    container.querySelectorAll('.pesquisa-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentView = e.target.dataset.view;
        render();
      });
    });

    // Botões de ação geral
    container.querySelectorAll('[data-action="goto-adicionar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentView = 'adicionar';
        render();
      });
    });

    // Específicos por view
    if (currentView === 'adicionar') {
      attachFormListeners();
    } else if (currentView === 'lista') {
      attachListListeners();
    } else if (currentView === 'estatisticas') {
      attachStatsListeners();
    }
  }

  // Listeners do formulário
  function attachFormListeners() {
    const btnAnalisar = document.getElementById('pesquisa-btn-analisar');
    const btnSalvar = document.getElementById('pesquisa-btn-salvar');
    const btnLimpar = document.getElementById('pesquisa-btn-limpar');

    if (btnAnalisar) {
      btnAnalisar.addEventListener('click', analisarTexto);
    }

    if (btnSalvar) {
      btnSalvar.addEventListener('click', salvarAnuncio);
    }

    if (btnLimpar) {
      btnLimpar.addEventListener('click', limparFormulario);
    }
  }

  // Analisar texto do anúncio
  function analisarTexto() {
    const descricao = document.getElementById('pesquisa-descricao')?.value || '';
    if (!descricao.trim()) {
      alert('Cole a descrição do anúncio primeiro.');
      return;
    }

    // Usar funções do parser principal se disponível
    if (typeof parseDescricao === 'function') {
      const resultado = parseDescricao(descricao);
      if (resultado && resultado.config) {
        preencherFormulario(resultado.config, descricao);
      }
    } else {
      // Usar detecção local
      const preco = PesquisaPrecos.extrairPreco(descricao);
      const cidade = PesquisaPrecos.detectarCidade(descricao);
      const tipo = PesquisaPrecos.detectarTipo(descricao);

      const dados = {
        precoAnunciado: preco,
        cidade: cidade,
        tipo: tipo
      };

      preencherFormulario(dados, descricao);
    }

    mostrarPreview();
  }

  // Preencher formulário com dados detectados
  function preencherFormulario(dados, descricao) {
    if (dados.precoAnunciado) {
      document.getElementById('pesquisa-preco').value = dados.precoAnunciado;
    }
    if (dados.cidade) {
      document.getElementById('pesquisa-cidade').value = dados.cidade;
    }
    if (dados.tipo || dados.tipoEstrutura) {
      document.getElementById('pesquisa-tipo').value = dados.tipo || dados.tipoEstrutura;
    }
    if (dados.areaTotal || dados.area) {
      document.getElementById('pesquisa-area').value = dados.areaTotal || dados.area;
    }
    if (dados.areaTerreno) {
      document.getElementById('pesquisa-area-terreno').value = dados.areaTerreno;
    }
    if (dados.numQuartos || dados.quartos) {
      document.getElementById('pesquisa-quartos').value = dados.numQuartos || dados.quartos;
    }
    if (dados.numBanheiros || dados.banheiros) {
      document.getElementById('pesquisa-banheiros').value = dados.numBanheiros || dados.banheiros;
    }

    // Detectar bairro
    const cidade = document.getElementById('pesquisa-cidade').value;
    const bairro = PesquisaPrecos.detectarBairro(descricao, cidade);
    if (bairro && bairro !== 'outros') {
      document.getElementById('pesquisa-bairro').value = bairro;
    }
  }

  // Mostrar preview da comparação
  function mostrarPreview() {
    const preview = document.getElementById('pesquisa-resultado-preview');
    const previewContent = preview?.querySelector('.pesquisa-preview-content');
    if (!preview || !previewContent) return;

    const dados = coletarDadosFormulario();
    if (!dados.precoAnunciado) {
      preview.style.display = 'none';
      return;
    }

    // Simular o cálculo
    const anuncioTemp = PesquisaPrecos.adicionarAnuncio({
      ...dados,
      descricao: document.getElementById('pesquisa-descricao')?.value || ''
    });

    // Remover o anúncio temporário
    PesquisaPrecos.removerAnuncio(anuncioTemp.id);

    previewContent.innerHTML = `
      <div class="pesquisa-preview-valores">
        <div class="pesquisa-preview-item">
          <span>Preço Anunciado:</span>
          <strong>${formatarMoeda(anuncioTemp.precoAnunciado)}</strong>
        </div>
        <div class="pesquisa-preview-item">
          <span>Valor Calculado:</span>
          <strong>${formatarMoeda(anuncioTemp.valorCalculado)}</strong>
        </div>
        <div class="pesquisa-preview-item">
          <span>Diferença:</span>
          <strong class="${getCorDiferenca(anuncioTemp.diferencaPercent)}">
            ${formatarPercent(anuncioTemp.diferencaPercent)}
          </strong>
        </div>
      </div>
      <p class="pesquisa-preview-nota">
        ${anuncioTemp.diferencaPercent > 0
          ? `O anúncio está ${formatarPercent(anuncioTemp.diferencaPercent)} acima do valor calculado pelo sistema.`
          : `O anúncio está ${formatarPercent(Math.abs(anuncioTemp.diferencaPercent))} abaixo do valor calculado pelo sistema.`
        }
      </p>
    `;

    preview.style.display = 'block';
  }

  // Coletar dados do formulário
  function coletarDadosFormulario() {
    return {
      precoAnunciado: parseFloat(document.getElementById('pesquisa-preco')?.value) || 0,
      cidade: document.getElementById('pesquisa-cidade')?.value || 'torres',
      tipo: document.getElementById('pesquisa-tipo')?.value || 'casa',
      bairro: document.getElementById('pesquisa-bairro')?.value || '',
      area: parseFloat(document.getElementById('pesquisa-area')?.value) || 0,
      areaTerreno: parseFloat(document.getElementById('pesquisa-area-terreno')?.value) || 0,
      quartos: parseInt(document.getElementById('pesquisa-quartos')?.value) || 0,
      banheiros: parseInt(document.getElementById('pesquisa-banheiros')?.value) || 0,
      fonte: document.getElementById('pesquisa-fonte')?.value || '',
      url: document.getElementById('pesquisa-url')?.value || '',
      observacoes: document.getElementById('pesquisa-obs')?.value || ''
    };
  }

  // Salvar anúncio
  function salvarAnuncio() {
    const dados = coletarDadosFormulario();
    const descricao = document.getElementById('pesquisa-descricao')?.value || '';

    if (!dados.precoAnunciado || dados.precoAnunciado <= 0) {
      alert('Informe o preço anunciado.');
      return;
    }

    if (!dados.area && !dados.areaTerreno) {
      alert('Informe a área construída ou do terreno.');
      return;
    }

    const anuncio = PesquisaPrecos.adicionarAnuncio({
      ...dados,
      descricao: descricao
    });

    alert(`Anúncio salvo!\n\nPreço: ${formatarMoeda(anuncio.precoAnunciado)}\nCalculado: ${formatarMoeda(anuncio.valorCalculado)}\nDiferença: ${formatarPercent(anuncio.diferencaPercent)}`);

    limparFormulario();
    currentView = 'lista';
    render();
  }

  // Limpar formulário
  function limparFormulario() {
    const campos = ['pesquisa-descricao', 'pesquisa-preco', 'pesquisa-bairro',
                    'pesquisa-area', 'pesquisa-area-terreno', 'pesquisa-quartos',
                    'pesquisa-banheiros', 'pesquisa-fonte', 'pesquisa-url', 'pesquisa-obs'];

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const preview = document.getElementById('pesquisa-resultado-preview');
    if (preview) preview.style.display = 'none';
  }

  // Listeners da lista
  function attachListListeners() {
    // Deletar anúncio
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.target.dataset.id;
        if (confirm('Remover este anúncio?')) {
          PesquisaPrecos.removerAnuncio(id);
          render();
        }
      });
    });

    // Exportar
    const btnExportar = document.getElementById('pesquisa-btn-exportar');
    if (btnExportar) {
      btnExportar.addEventListener('click', exportarDados);
    }

    // Filtros
    const filtroCidade = document.getElementById('pesquisa-filtro-cidade');
    const filtroTipo = document.getElementById('pesquisa-filtro-tipo');

    if (filtroCidade) {
      filtroCidade.addEventListener('change', aplicarFiltros);
    }
    if (filtroTipo) {
      filtroTipo.addEventListener('change', aplicarFiltros);
    }
  }

  // Aplicar filtros na lista
  function aplicarFiltros() {
    const cidade = document.getElementById('pesquisa-filtro-cidade')?.value;
    const tipo = document.getElementById('pesquisa-filtro-tipo')?.value;

    const anuncios = PesquisaPrecos.getAnuncios({ cidade, tipo });
    const grid = container.querySelector('.pesquisa-anuncios-grid');

    if (grid) {
      const cards = grid.querySelectorAll('.pesquisa-anuncio-card');
      cards.forEach(card => {
        const id = card.dataset.id;
        const anuncio = anuncios.find(a => a.id === id);
        card.style.display = anuncio ? 'block' : 'none';
      });
    }
  }

  // Listeners das estatísticas
  function attachStatsListeners() {
    const btnExportar = document.getElementById('pesquisa-btn-exportar-completo');
    const btnLimpar = document.getElementById('pesquisa-btn-limpar-dados');

    if (btnExportar) {
      btnExportar.addEventListener('click', exportarDados);
    }

    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar TODOS os dados da pesquisa? Esta ação não pode ser desfeita.')) {
          PesquisaPrecos.limparDados();
          render();
        }
      });
    }
  }

  // Exportar dados
  function exportarDados() {
    const dados = PesquisaPrecos.exportarDados();
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pesquisa-precos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // Inicializar UI
  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) {
      console.error('Container não encontrado:', containerId);
      return;
    }

    render();
  }

  // API pública
  return {
    init,
    render,
    setView: (view) => {
      currentView = view;
      render();
    }
  };
})();
