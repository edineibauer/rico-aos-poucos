/**
 * Base de Dados de Preços de Mercado Imobiliário
 * Região: Torres, Arroio do Sal, Passo de Torres e proximidades
 * Última atualização: Janeiro 2026
 * Fonte: Pesquisa em ZAP Imóveis, Imovelweb, Viva Real, OLX, Wimoveis
 */

const DadosMercadoImoveis = {
  // Data da última atualização
  ultimaAtualizacao: '2026-01-16',

  // Preços médios por m² por cidade e tipo
  precoM2: {
    // TORRES - RS (mais valorizado, turístico)
    'torres': {
      apartamento: {
        praiaNobre: { min: 10000, medio: 12500, max: 15000 }, // Praia Grande, Prainha
        centro: { min: 7000, medio: 9000, max: 12000 },
        outros: { min: 5000, medio: 6500, max: 8000 }
      },
      casa: {
        praiaNobre: { min: 6000, medio: 8000, max: 12000 },
        centro: { min: 4500, medio: 5500, max: 7000 },
        outros: { min: 3000, medio: 4000, max: 5500 }
      },
      terreno: {
        praiaNobre: { min: 800, medio: 1200, max: 2000 },
        centro: { min: 500, medio: 700, max: 1000 },
        outros: { min: 300, medio: 450, max: 600 }
      }
    },

    // ARROIO DO SAL - RS
    'arroio-do-sal': {
      apartamento: {
        beiramar: { min: 8000, medio: 10000, max: 14000 },
        centro: { min: 5500, medio: 6630, max: 8500 },
        outros: { min: 4000, medio: 5000, max: 6000 }
      },
      casa: {
        beiramar: { min: 5000, medio: 6000, max: 8000 },
        centro: { min: 3500, medio: 4500, max: 5500 },
        outros: { min: 2500, medio: 3500, max: 4500 }
      },
      terreno: {
        beiramar: { min: 600, medio: 900, max: 1500 },
        centro: { min: 350, medio: 500, max: 700 },
        outros: { min: 200, medio: 350, max: 500 }
      }
    },

    // PASSO DE TORRES - SC (mais acessível)
    'passo-de-torres': {
      apartamento: {
        beiramar: { min: 5500, medio: 7000, max: 9000 },
        centro: { min: 4000, medio: 5500, max: 7000 },
        outros: { min: 3500, medio: 4500, max: 5500 }
      },
      casa: {
        beiramar: { min: 4500, medio: 5500, max: 7000 },
        centro: { min: 3500, medio: 4500, max: 5500 },
        outros: { min: 2800, medio: 3521, max: 4500 }
      },
      sobrado: {
        todos: { min: 4500, medio: 5091, max: 6000 }
      },
      terreno: {
        beiramar: { min: 400, medio: 600, max: 900 },
        centro: { min: 250, medio: 400, max: 550 },
        outros: { min: 150, medio: 280, max: 400 }
      }
    },

    // CAPÃO DA CANOA - RS
    'capao-da-canoa': {
      apartamento: {
        praia: { min: 7000, medio: 9000, max: 12000 },
        centro: { min: 5000, medio: 6500, max: 8000 },
        outros: { min: 4000, medio: 5000, max: 6500 }
      },
      casa: {
        praia: { min: 5000, medio: 6500, max: 9000 },
        centro: { min: 3500, medio: 4500, max: 6000 },
        outros: { min: 2500, medio: 3500, max: 4500 }
      },
      terreno: {
        praia: { min: 600, medio: 900, max: 1400 },
        centro: { min: 350, medio: 550, max: 800 },
        outros: { min: 200, medio: 350, max: 500 }
      }
    },

    // TRAMANDAÍ - RS
    'tramandai': {
      apartamento: {
        beiramar: { min: 5000, medio: 6500, max: 9000 },
        centro: { min: 3500, medio: 4500, max: 6000 },
        outros: { min: 2500, medio: 3500, max: 4500 }
      },
      casa: {
        beiramar: { min: 4000, medio: 5000, max: 7000 },
        centro: { min: 2500, medio: 3500, max: 4500 },
        outros: { min: 2000, medio: 2800, max: 3500 }
      },
      terreno: {
        beiramar: { min: 400, medio: 600, max: 900 },
        centro: { min: 250, medio: 400, max: 600 },
        outros: { min: 150, medio: 280, max: 400 }
      }
    }
  },

  // Anúncios de exemplo (dados reais coletados)
  anunciosReferencia: [
    // TORRES - Apartamentos
    {
      cidade: 'torres',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 78,
      quartos: 2,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      preco: 990000,
      precoM2: 12692,
      fonte: 'ZAP Imóveis',
      data: '2026-01'
    },
    {
      cidade: 'torres',
      tipo: 'apartamento',
      bairro: 'praia-grande',
      area: 88,
      quartos: 2,
      suites: 1,
      banheiros: 2,
      vagas: 2,
      preco: 1100000,
      precoM2: 12500,
      fonte: 'Viva Real',
      data: '2026-01',
      obs: 'Alto padrão, 150m do mar'
    },
    {
      cidade: 'torres',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 45,
      quartos: 1,
      suites: 0,
      banheiros: 1,
      vagas: 1,
      preco: 320000,
      precoM2: 7111,
      fonte: 'OLX',
      data: '2026-01'
    },

    // ARROIO DO SAL - Apartamentos
    {
      cidade: 'arroio-do-sal',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 94,
      quartos: 3,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      preco: 1290000,
      precoM2: 13723,
      fonte: 'Imovelweb',
      data: '2026-01',
      obs: 'Mobiliado, vista mar'
    },
    {
      cidade: 'arroio-do-sal',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 65,
      quartos: 2,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      preco: 650000,
      precoM2: 10000,
      fonte: 'Imovelweb',
      data: '2026-01',
      obs: 'Ed. Encanto da Praia'
    },
    {
      cidade: 'arroio-do-sal',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 60,
      quartos: 2,
      suites: 0,
      banheiros: 1,
      vagas: 1,
      preco: 550000,
      precoM2: 9166,
      fonte: 'Imovelweb',
      data: '2026-01',
      obs: 'Ed. Encanto da Erechim'
    },
    {
      cidade: 'arroio-do-sal',
      tipo: 'apartamento',
      bairro: 'outros',
      area: 50,
      quartos: 1,
      suites: 0,
      banheiros: 1,
      vagas: 1,
      preco: 405000,
      precoM2: 8100,
      fonte: 'Mitula',
      data: '2026-01'
    },

    // PASSO DE TORRES - Casas
    {
      cidade: 'passo-de-torres',
      tipo: 'casa',
      bairro: 'centro',
      area: 71,
      areaTerreno: 200,
      quartos: 2,
      suites: 0,
      banheiros: 1,
      vagas: 1,
      preco: 250000,
      precoM2: 3521,
      fonte: 'Imovelweb',
      data: '2026-01'
    },
    {
      cidade: 'passo-de-torres',
      tipo: 'sobrado',
      bairro: 'centro',
      area: 55,
      areaTerreno: 120,
      quartos: 2,
      suites: 0,
      banheiros: 1,
      vagas: 1,
      preco: 280000,
      precoM2: 5091,
      fonte: 'Imovelweb',
      data: '2026-01',
      obs: 'Geminado'
    },
    {
      cidade: 'passo-de-torres',
      tipo: 'casa',
      bairro: 'centro',
      area: 100,
      areaTerreno: 300,
      quartos: 3,
      suites: 1,
      banheiros: 2,
      vagas: 2,
      preco: 710000,
      precoM2: 7100,
      fonte: 'Wimoveis',
      data: '2026-01'
    },
    {
      cidade: 'passo-de-torres',
      tipo: 'apartamento',
      bairro: 'centro',
      area: 64,
      quartos: 2,
      suites: 1,
      banheiros: 1,
      vagas: 1,
      preco: 280000,
      precoM2: 4375,
      fonte: 'Chaves na Mão',
      data: '2026-01',
      obs: 'Lançamento'
    },

    // TORRES - Terrenos
    {
      cidade: 'torres',
      tipo: 'terreno',
      bairro: 'vila-sao-joao',
      area: 0,
      areaTerreno: 840,
      quartos: 0,
      preco: 350000,
      precoM2Terreno: 416,
      fonte: 'Guilherme Knabben',
      data: '2026-01',
      obs: 'Esquina'
    },
    {
      cidade: 'torres',
      tipo: 'terreno',
      bairro: 'praia-real',
      area: 0,
      areaTerreno: 300,
      quartos: 0,
      preco: 180000,
      precoM2Terreno: 600,
      fonte: 'Wimoveis',
      data: '2026-01'
    }
  ],

  // Estatísticas calculadas
  estatisticas: {
    'torres': {
      apartamento: {
        precoMedioM2: 9500,
        amostragem: 3,
        variacao: '7.000 - 12.700'
      },
      terreno: {
        precoMedioM2: 500,
        amostragem: 2
      }
    },
    'arroio-do-sal': {
      apartamento: {
        precoMedioM2: 6630, // fonte: Mitula
        amostragem: 4,
        variacao: '6.290 - 10.315 por quarto'
      }
    },
    'passo-de-torres': {
      casa: {
        precoMedio: 623181, // fonte: Imovelweb
        precoMedioM2: 4300,
        amostragem: 3,
        porQuartos: {
          1: 584500,
          2: 544735,
          3: 709650,
          4: 920234
        }
      },
      apartamento: {
        precoMedioM2: 4500,
        amostragem: 1
      }
    }
  },

  // Função para obter preço de referência
  getPrecoReferencia: function(cidade, tipo, bairro, area) {
    const cidadeNorm = cidade.toLowerCase().replace(/\s/g, '-')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const dadosCidade = this.precoM2[cidadeNorm];
    if (!dadosCidade) return null;

    const dadosTipo = dadosCidade[tipo];
    if (!dadosTipo) return null;

    // Tentar encontrar bairro específico ou usar 'outros'
    let dadosBairro = dadosTipo[bairro] || dadosTipo['centro'] || dadosTipo['outros'] || dadosTipo['todos'];
    if (!dadosBairro) {
      // Pegar primeiro disponível
      const keys = Object.keys(dadosTipo);
      if (keys.length > 0) {
        dadosBairro = dadosTipo[keys[0]];
      }
    }

    if (!dadosBairro) return null;

    return {
      precoM2Min: dadosBairro.min,
      precoM2Medio: dadosBairro.medio,
      precoM2Max: dadosBairro.max,
      valorEstimadoMin: area * dadosBairro.min,
      valorEstimadoMedio: area * dadosBairro.medio,
      valorEstimadoMax: area * dadosBairro.max
    };
  },

  // Função para comparar com valor calculado
  compararComCalculadora: function(valorCalculado, cidade, tipo, bairro, area) {
    const referencia = this.getPrecoReferencia(cidade, tipo, bairro, area);
    if (!referencia) return null;

    const diferencaMedia = ((valorCalculado - referencia.valorEstimadoMedio) / referencia.valorEstimadoMedio) * 100;
    const diferencaMin = ((valorCalculado - referencia.valorEstimadoMin) / referencia.valorEstimadoMin) * 100;
    const diferencaMax = ((valorCalculado - referencia.valorEstimadoMax) / referencia.valorEstimadoMax) * 100;

    let status = 'adequado';
    if (diferencaMedia > 20) status = 'muito_acima';
    else if (diferencaMedia > 10) status = 'acima';
    else if (diferencaMedia < -20) status = 'muito_abaixo';
    else if (diferencaMedia < -10) status = 'abaixo';

    return {
      valorCalculado,
      referencia,
      diferencaMedia: diferencaMedia.toFixed(1),
      diferencaMin: diferencaMin.toFixed(1),
      diferencaMax: diferencaMax.toFixed(1),
      status,
      recomendacao: this.getRecomendacao(status, diferencaMedia)
    };
  },

  // Recomendação baseada na comparação
  getRecomendacao: function(status, diferenca) {
    switch(status) {
      case 'muito_acima':
        return `Sistema ${diferenca.toFixed(0)}% acima do mercado. Considere reduzir fatores de custo para esta região.`;
      case 'acima':
        return `Sistema ${diferenca.toFixed(0)}% acima do mercado. Valores ligeiramente elevados.`;
      case 'abaixo':
        return `Sistema ${Math.abs(diferenca).toFixed(0)}% abaixo do mercado. Pode estar subvalorizando.`;
      case 'muito_abaixo':
        return `Sistema ${Math.abs(diferenca).toFixed(0)}% abaixo do mercado. Considere aumentar fatores de custo.`;
      default:
        return 'Valores dentro da faixa de mercado.';
    }
  }
};

  // Fatores de ajuste regional para a calculadora de custo
  // Usados para ajustar o cálculo base às realidades de mercado locais
  fatoresAjusteRegional: {
    'torres': {
      casa: 1.35,        // Casas em Torres são ~35% mais caras que média RS
      apartamento: 1.45, // Apartamentos ainda mais valorizados
      terreno: 1.80      // Terrenos muito valorizados no litoral
    },
    'arroio-do-sal': {
      casa: 1.15,
      apartamento: 1.25,
      terreno: 1.40
    },
    'passo-de-torres': {
      casa: 1.10,
      apartamento: 1.15,
      terreno: 1.25
    },
    'capao-da-canoa': {
      casa: 1.25,
      apartamento: 1.35,
      terreno: 1.60
    },
    'tramandai': {
      casa: 1.05,
      apartamento: 1.15,
      terreno: 1.30
    },
    'xangri-la': {
      casa: 1.30,
      apartamento: 1.40,
      terreno: 1.70
    }
  },

  // Função para obter fator de ajuste para uma cidade
  getFatorAjuste: function(cidade, tipo) {
    const cidadeNorm = cidade?.toLowerCase().replace(/\s/g, '-')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const fatores = this.fatoresAjusteRegional[cidadeNorm];
    if (!fatores) return 1.0;

    // Mapear tipos de estrutura para categorias
    const tipoMap = {
      'apartamento': 'apartamento',
      'terrea': 'casa',
      'sobrado': 'casa',
      'meia_agua': 'casa',
      'geminada': 'casa',
      'edicula': 'casa',
      'triplex': 'casa',
      'chacara': 'casa'
    };

    const categoria = tipoMap[tipo] || 'casa';
    return fatores[categoria] || 1.0;
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.DadosMercadoImoveis = DadosMercadoImoveis;
}
