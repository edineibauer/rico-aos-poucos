/**
 * Pesquisa de Preços de Mercado
 * Sistema para coletar anúncios e comparar com valores calculados
 * Rico aos Poucos - 2026
 */

const PesquisaPrecos = (function() {
  'use strict';

  // Chave do localStorage
  const STORAGE_KEY = 'rico-pesquisa-precos';
  const STORAGE_KEY_CONFIG = 'rico-pesquisa-config';

  // Regiões de interesse (Torres, Arroio do Sal, Passo de Torres e proximidades)
  const regioesAlvo = {
    'torres': {
      nome: 'Torres',
      uf: 'RS',
      bairros: [
        'centro', 'praia grande', 'praia da cal', 'prainha', 'itapeva',
        'stan', 'predial', 'getúlio vargas', 'parque balonismo', 'morada das torres'
      ]
    },
    'arroio-do-sal': {
      nome: 'Arroio do Sal',
      uf: 'RS',
      bairros: [
        'centro', 'arroio do sal', 'rondinha', 'praia rondinha', 'balneário',
        'areias brancas', 'santa rita', 'inter praias'
      ]
    },
    'passo-de-torres': {
      nome: 'Passo de Torres',
      uf: 'SC',
      bairros: [
        'centro', 'rosa do mar', 'beira rio', 'balneário', 'costa do rio',
        'praia', 'vila nova', 'jardim'
      ]
    },
    'capao-da-canoa': {
      nome: 'Capão da Canoa',
      uf: 'RS',
      bairros: [
        'centro', 'zona nova', 'navegantes', 'santa monica', 'capão novo'
      ]
    },
    'tramandai': {
      nome: 'Tramandaí',
      uf: 'RS',
      bairros: [
        'centro', 'beira mar', 'zona nova', 'tiroleza', 'indianópolis'
      ]
    },
    'xangri-la': {
      nome: 'Xangri-lá',
      uf: 'RS',
      bairros: [
        'centro', 'rainha do mar', 'atlantida', 'remanso'
      ]
    }
  };

  // Tipos de imóvel
  const tiposImovel = {
    'terreno': 'Terreno',
    'casa': 'Casa',
    'apartamento': 'Apartamento',
    'sobrado': 'Sobrado',
    'kitnet': 'Kitnet/Studio',
    'comercial': 'Comercial'
  };

  // Estado inicial
  let state = {
    anuncios: [],
    config: {
      regiaoAtual: 'torres'
    }
  };

  // Carregar dados do localStorage
  function carregarDados() {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      if (dados) {
        state.anuncios = JSON.parse(dados);
      }
      const config = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (config) {
        state.config = { ...state.config, ...JSON.parse(config) };
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }

  // Salvar dados no localStorage
  function salvarDados() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.anuncios));
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(state.config));
    } catch (e) {
      console.error('Erro ao salvar dados:', e);
    }
  }

  // Gerar ID único
  function gerarId() {
    return 'anuncio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Detectar bairro no texto
  function detectarBairro(texto, cidade) {
    const textoLower = texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const cidadeInfo = regioesAlvo[cidade];
    if (!cidadeInfo) return null;

    for (const bairro of cidadeInfo.bairros) {
      const bairroNorm = bairro.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textoLower.includes(bairroNorm)) {
        return bairro;
      }
    }

    return 'outros';
  }

  // Detectar cidade no texto
  function detectarCidade(texto) {
    const textoLower = texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Priorizar nomes mais longos
    const cidadesOrdenadas = Object.entries(regioesAlvo)
      .map(([key, info]) => ({
        key,
        nome: info.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        tamanho: info.nome.length
      }))
      .sort((a, b) => b.tamanho - a.tamanho);

    for (const cidade of cidadesOrdenadas) {
      if (textoLower.includes(cidade.nome)) {
        return cidade.key;
      }
    }

    return null;
  }

  // Extrair preço do texto
  function extrairPreco(texto) {
    const patterns = [
      /R\$\s*([\d.,]+)/i,
      /(\d{2,3})[.,](\d{3})[.,](\d{3})/,  // 250.000.000 ou 250,000,000
      /(\d{2,3})[.,](\d{3})/,              // 250.000 ou 250,000
      /(\d+)\s*mil/i,
      /(\d+)\s*k/i
    ];

    for (const pattern of patterns) {
      const match = texto.match(pattern);
      if (match) {
        let valor;
        if (match[3]) {
          // Formato X.XXX.XXX
          valor = parseInt(match[1]) * 1000000 + parseInt(match[2]) * 1000 + parseInt(match[3]);
        } else if (match[2]) {
          // Formato XXX.XXX
          valor = parseInt(match[1]) * 1000 + parseInt(match[2]);
        } else if (/mil|k/i.test(texto)) {
          // X mil ou Xk
          valor = parseInt(match[1]) * 1000;
        } else {
          // R$ valor
          valor = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        }

        if (valor >= 10000 && valor <= 50000000) {
          return valor;
        }
      }
    }

    return null;
  }

  // Detectar tipo de imóvel
  function detectarTipo(texto) {
    const textoLower = texto.toLowerCase();

    if (/\bterreno\b|\blote\b|\bterrenos\b/.test(textoLower)) return 'terreno';
    if (/\bapartamento\b|\bapto\b/.test(textoLower)) return 'apartamento';
    if (/\bsobrado\b|\bduplex\b/.test(textoLower)) return 'sobrado';
    if (/\bkitnet\b|\bstudio\b|\bkit\b/.test(textoLower)) return 'kitnet';
    if (/\bcomercial\b|\bloja\b|\bsala\b/.test(textoLower)) return 'comercial';
    if (/\bcasa\b/.test(textoLower)) return 'casa';

    return 'casa'; // default
  }

  // Calcular valor usando o sistema existente
  function calcularValorSistema(dadosImovel) {
    // Verificar se o módulo CustosConstrucao está disponível
    if (typeof window.calcularCustoConstrucao === 'function') {
      return window.calcularCustoConstrucao(dadosImovel);
    }

    // Fallback: cálculo simplificado
    const custoM2Base = {
      'terreno': 300,    // R$/m² médio terreno litoral
      'casa': 2500,      // R$/m² construção média
      'apartamento': 3500,
      'sobrado': 2800,
      'kitnet': 3000,
      'comercial': 2200
    };

    const fatorRegiao = {
      'torres': 1.2,
      'arroio-do-sal': 0.9,
      'passo-de-torres': 0.85,
      'capao-da-canoa': 1.0,
      'tramandai': 0.85,
      'xangri-la': 1.1
    };

    const tipo = dadosImovel.tipo || 'casa';
    const area = dadosImovel.area || 100;
    const cidade = dadosImovel.cidade || 'torres';
    const areaTerreno = dadosImovel.areaTerreno || 0;

    let valor = 0;

    if (tipo === 'terreno') {
      valor = areaTerreno * custoM2Base['terreno'] * (fatorRegiao[cidade] || 1.0);
    } else {
      // Valor da construção
      valor = area * custoM2Base[tipo] * (fatorRegiao[cidade] || 1.0);

      // Adicionar valor do terreno se informado
      if (areaTerreno > 0) {
        valor += areaTerreno * custoM2Base['terreno'] * (fatorRegiao[cidade] || 1.0) * 0.5;
      }
    }

    return Math.round(valor);
  }

  // Adicionar novo anúncio
  function adicionarAnuncio(dados) {
    const id = gerarId();
    const dataAtual = new Date().toISOString();

    // Detectar informações automaticamente se não fornecidas
    const texto = dados.descricao || '';
    const cidade = dados.cidade || detectarCidade(texto) || state.config.regiaoAtual;
    const bairro = dados.bairro || detectarBairro(texto, cidade);
    const tipo = dados.tipo || detectarTipo(texto);
    const precoAnunciado = dados.precoAnunciado || extrairPreco(texto);

    // Calcular valor do sistema
    const dadosCalculo = {
      tipo: tipo,
      area: dados.area || 100,
      areaTerreno: dados.areaTerreno || 0,
      cidade: cidade,
      quartos: dados.quartos || 0,
      banheiros: dados.banheiros || 0
    };

    const valorCalculado = calcularValorSistema(dadosCalculo);

    // Calcular diferença percentual
    let diferencaPercent = 0;
    if (valorCalculado > 0 && precoAnunciado > 0) {
      diferencaPercent = ((precoAnunciado - valorCalculado) / valorCalculado) * 100;
    }

    const anuncio = {
      id: id,
      dataCriacao: dataAtual,
      descricao: texto,
      fonte: dados.fonte || 'manual',
      url: dados.url || '',

      // Localização
      cidade: cidade,
      cidadeNome: regioesAlvo[cidade]?.nome || cidade,
      uf: regioesAlvo[cidade]?.uf || '',
      bairro: bairro,

      // Características
      tipo: tipo,
      tipoNome: tiposImovel[tipo] || tipo,
      area: dados.area || 0,
      areaTerreno: dados.areaTerreno || 0,
      quartos: dados.quartos || 0,
      banheiros: dados.banheiros || 0,

      // Valores
      precoAnunciado: precoAnunciado,
      valorCalculado: valorCalculado,
      diferencaPercent: diferencaPercent,

      // Status
      validado: false,
      observacoes: dados.observacoes || ''
    };

    state.anuncios.push(anuncio);
    salvarDados();

    return anuncio;
  }

  // Remover anúncio
  function removerAnuncio(id) {
    state.anuncios = state.anuncios.filter(a => a.id !== id);
    salvarDados();
  }

  // Atualizar anúncio
  function atualizarAnuncio(id, dados) {
    const index = state.anuncios.findIndex(a => a.id === id);
    if (index !== -1) {
      // Recalcular se dados relevantes mudaram
      if (dados.area || dados.tipo || dados.cidade || dados.areaTerreno) {
        const dadosCalculo = {
          tipo: dados.tipo || state.anuncios[index].tipo,
          area: dados.area || state.anuncios[index].area,
          areaTerreno: dados.areaTerreno || state.anuncios[index].areaTerreno,
          cidade: dados.cidade || state.anuncios[index].cidade
        };
        dados.valorCalculado = calcularValorSistema(dadosCalculo);

        if (dados.precoAnunciado || state.anuncios[index].precoAnunciado) {
          const preco = dados.precoAnunciado || state.anuncios[index].precoAnunciado;
          dados.diferencaPercent = ((preco - dados.valorCalculado) / dados.valorCalculado) * 100;
        }
      }

      state.anuncios[index] = { ...state.anuncios[index], ...dados };
      salvarDados();
      return state.anuncios[index];
    }
    return null;
  }

  // Obter estatísticas por cidade
  function getEstatisticasCidade(cidade) {
    const anuncios = state.anuncios.filter(a => a.cidade === cidade && a.precoAnunciado > 0);

    if (anuncios.length === 0) {
      return {
        cidade: cidade,
        cidadeNome: regioesAlvo[cidade]?.nome || cidade,
        totalAnuncios: 0,
        diferencaMedia: 0,
        diferencaMediana: 0,
        porTipo: {},
        porBairro: {}
      };
    }

    const diferencas = anuncios.map(a => a.diferencaPercent);
    const media = diferencas.reduce((a, b) => a + b, 0) / diferencas.length;

    // Calcular mediana
    const sorted = [...diferencas].sort((a, b) => a - b);
    const mediana = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Estatísticas por tipo
    const porTipo = {};
    for (const tipo of Object.keys(tiposImovel)) {
      const anunciosTipo = anuncios.filter(a => a.tipo === tipo);
      if (anunciosTipo.length > 0) {
        const difs = anunciosTipo.map(a => a.diferencaPercent);
        porTipo[tipo] = {
          count: anunciosTipo.length,
          media: difs.reduce((a, b) => a + b, 0) / difs.length,
          precoMedio: anunciosTipo.reduce((a, b) => a + b.precoAnunciado, 0) / anunciosTipo.length
        };
      }
    }

    // Estatísticas por bairro
    const porBairro = {};
    const bairrosUnicos = [...new Set(anuncios.map(a => a.bairro))];
    for (const bairro of bairrosUnicos) {
      const anunciosBairro = anuncios.filter(a => a.bairro === bairro);
      if (anunciosBairro.length > 0) {
        const difs = anunciosBairro.map(a => a.diferencaPercent);
        porBairro[bairro] = {
          count: anunciosBairro.length,
          media: difs.reduce((a, b) => a + b, 0) / difs.length,
          precoMedio: anunciosBairro.reduce((a, b) => a + b.precoAnunciado, 0) / anunciosBairro.length
        };
      }
    }

    return {
      cidade: cidade,
      cidadeNome: regioesAlvo[cidade]?.nome || cidade,
      totalAnuncios: anuncios.length,
      diferencaMedia: media,
      diferencaMediana: mediana,
      porTipo: porTipo,
      porBairro: porBairro
    };
  }

  // Obter estatísticas gerais
  function getEstatisticasGerais() {
    const anuncios = state.anuncios.filter(a => a.precoAnunciado > 0);

    if (anuncios.length === 0) {
      return {
        totalAnuncios: 0,
        diferencaMedia: 0,
        diferencaMediana: 0,
        porCidade: {},
        sugestaoAjuste: 0
      };
    }

    const diferencas = anuncios.map(a => a.diferencaPercent);
    const media = diferencas.reduce((a, b) => a + b, 0) / diferencas.length;

    const sorted = [...diferencas].sort((a, b) => a - b);
    const mediana = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Por cidade
    const porCidade = {};
    for (const cidade of Object.keys(regioesAlvo)) {
      const stats = getEstatisticasCidade(cidade);
      if (stats.totalAnuncios > 0) {
        porCidade[cidade] = stats;
      }
    }

    // Sugestão de ajuste (usar mediana para evitar outliers)
    const sugestaoAjuste = -mediana; // Se mercado está 10% acima, sistema deve aumentar 10%

    return {
      totalAnuncios: anuncios.length,
      diferencaMedia: media,
      diferencaMediana: mediana,
      porCidade: porCidade,
      sugestaoAjuste: sugestaoAjuste
    };
  }

  // Exportar dados
  function exportarDados() {
    return {
      anuncios: state.anuncios,
      estatisticas: getEstatisticasGerais(),
      exportadoEm: new Date().toISOString()
    };
  }

  // Importar dados
  function importarDados(dados) {
    if (dados.anuncios && Array.isArray(dados.anuncios)) {
      state.anuncios = [...state.anuncios, ...dados.anuncios];
      salvarDados();
      return true;
    }
    return false;
  }

  // Limpar todos os dados
  function limparDados() {
    state.anuncios = [];
    salvarDados();
  }

  // Obter todos os anúncios
  function getAnuncios(filtros = {}) {
    let anuncios = [...state.anuncios];

    if (filtros.cidade) {
      anuncios = anuncios.filter(a => a.cidade === filtros.cidade);
    }
    if (filtros.tipo) {
      anuncios = anuncios.filter(a => a.tipo === filtros.tipo);
    }
    if (filtros.bairro) {
      anuncios = anuncios.filter(a => a.bairro === filtros.bairro);
    }

    // Ordenar por data (mais recentes primeiro)
    anuncios.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

    return anuncios;
  }

  // Obter regiões disponíveis
  function getRegioes() {
    return regioesAlvo;
  }

  // Obter tipos de imóvel
  function getTipos() {
    return tiposImovel;
  }

  // Inicialização
  function init() {
    carregarDados();
    console.log('PesquisaPrecos inicializado com', state.anuncios.length, 'anúncios');
  }

  // API pública
  return {
    init,
    adicionarAnuncio,
    removerAnuncio,
    atualizarAnuncio,
    getAnuncios,
    getEstatisticasCidade,
    getEstatisticasGerais,
    getRegioes,
    getTipos,
    exportarDados,
    importarDados,
    limparDados,
    detectarCidade,
    detectarBairro,
    detectarTipo,
    extrairPreco
  };
})();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PesquisaPrecos.init());
} else {
  PesquisaPrecos.init();
}
