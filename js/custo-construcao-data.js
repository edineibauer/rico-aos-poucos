/**
 * Calculadora de Custo de Construção - Base de Dados
 * Valores atualizados: Janeiro 2026 (Base SINAPI Nov/2025 + Pesquisa de mercado)
 *
 * Fontes:
 * - SINAPI/IBGE
 * - CBIC
 * - Pesquisa de mercado regional
 */

const CustoConstrucaoData = {
  versao: '2.0',
  atualizacao: '2026-01',

  // Fator de correção regional (base = 1.0 para média nacional)
  regioes: {
    'AC': { nome: 'Acre', fator: 1.13, custoM2: 2108 },
    'AL': { nome: 'Alagoas', fator: 0.92, custoM2: 1713 },
    'AM': { nome: 'Amazonas', fator: 1.05, custoM2: 1956 },
    'AP': { nome: 'Amapá', fator: 1.08, custoM2: 2011 },
    'BA': { nome: 'Bahia', fator: 0.95, custoM2: 1770 },
    'CE': { nome: 'Ceará', fator: 0.94, custoM2: 1751 },
    'DF': { nome: 'Distrito Federal', fator: 1.06, custoM2: 1974 },
    'ES': { nome: 'Espírito Santo', fator: 0.91, custoM2: 1692 },
    'GO': { nome: 'Goiás', fator: 0.98, custoM2: 1825 },
    'MA': { nome: 'Maranhão', fator: 0.96, custoM2: 1788 },
    'MG': { nome: 'Minas Gerais', fator: 0.99, custoM2: 1844 },
    'MS': { nome: 'Mato Grosso do Sul', fator: 1.02, custoM2: 1900 },
    'MT': { nome: 'Mato Grosso', fator: 1.04, custoM2: 1937 },
    'PA': { nome: 'Pará', fator: 1.01, custoM2: 1881 },
    'PB': { nome: 'Paraíba', fator: 0.93, custoM2: 1732 },
    'PE': { nome: 'Pernambuco', fator: 0.90, custoM2: 1672 },
    'PI': { nome: 'Piauí', fator: 0.94, custoM2: 1751 },
    'PR': { nome: 'Paraná', fator: 1.07, custoM2: 1993 },
    'RJ': { nome: 'Rio de Janeiro', fator: 1.10, custoM2: 2049 },
    'RN': { nome: 'Rio Grande do Norte', fator: 0.93, custoM2: 1732 },
    'RO': { nome: 'Rondônia', fator: 1.11, custoM2: 2062 },
    'RR': { nome: 'Roraima', fator: 1.09, custoM2: 2030 },
    'RS': { nome: 'Rio Grande do Sul', fator: 1.06, custoM2: 1974 },
    'SC': { nome: 'Santa Catarina', fator: 1.13, custoM2: 2112 },
    'SE': { nome: 'Sergipe', fator: 0.89, custoM2: 1656 },
    'SP': { nome: 'São Paulo', fator: 1.08, custoM2: 2011 },
    'TO': { nome: 'Tocantins', fator: 0.97, custoM2: 1806 }
  },

  // Tipos estruturais de casa
  tiposEstrutura: {
    'terrea': {
      nome: 'Térrea',
      descricao: 'Casa em um único pavimento',
      fator: 1.0,
      observacao: 'Custo padrão de referência'
    },
    'sobrado': {
      nome: 'Sobrado (2 pavimentos)',
      descricao: 'Casa com dois andares',
      fator: 1.15,
      observacao: 'Requer escada, estrutura reforçada e mais instalações'
    },
    'meia_agua': {
      nome: 'Meia Água',
      descricao: 'Construção simples com telhado inclinado em uma direção',
      fator: 0.85,
      observacao: 'Economia na estrutura do telhado'
    },
    'geminada': {
      nome: 'Geminada',
      descricao: 'Casa que divide parede com outra construção',
      fator: 0.90,
      observacao: 'Economia por compartilhar parede lateral'
    },
    'edicula': {
      nome: 'Edícula/Kitnet',
      descricao: 'Construção pequena e simples',
      fator: 1.10,
      observacao: 'Custo/m² maior por ser compacta (mais instalações por m²)'
    },
    'triplex': {
      nome: 'Triplex (3 pavimentos)',
      descricao: 'Casa com três andares',
      fator: 1.30,
      observacao: 'Estrutura mais robusta, elevador opcional'
    },
    'apartamento': {
      nome: 'Apartamento',
      descricao: 'Unidade em edifício residencial',
      fator: 1.05,
      observacao: 'Custo considera apenas a unidade, sem áreas comuns'
    },
    'chacara': {
      nome: 'Chácara/Sítio',
      descricao: 'Casa em área rural ou de lazer',
      fator: 0.95,
      observacao: 'Geralmente mais simples, mas pode incluir área de lazer'
    }
  },

  // Estado de conservação (para avaliar valor de imóveis existentes)
  estadoConservacao: {
    'nova': {
      nome: 'Construção Nova',
      descricao: 'Construção do zero, valor de referência',
      fator: 1.0,
      desconto: 0,
      itensInclusos: 'Todos os itens e materiais novos'
    },
    'bom': {
      nome: 'Casa em Bom Estado',
      descricao: 'Imóvel bem conservado, poucos reparos necessários',
      fator: 0.85,
      desconto: 15,
      itensInclusos: 'Estrutura, instalações e acabamentos em bom estado'
    },
    'medio': {
      nome: 'Casa em Estado Médio',
      descricao: 'Imóvel com desgaste normal, precisa de alguns reparos',
      fator: 0.65,
      desconto: 35,
      itensInclusos: 'Estrutura boa, acabamentos com desgaste'
    },
    'ruim': {
      nome: 'Casa em Mau Estado',
      descricao: 'Imóvel deteriorado, precisa de reforma significativa',
      fator: 0.45,
      desconto: 55,
      itensInclusos: 'Apenas estrutura básica aproveitável'
    },
    'so_estrutura': {
      nome: 'Apenas Estrutura (esqueleto)',
      descricao: 'Casa no osso - apenas paredes e laje/telhado',
      fator: 0.30,
      desconto: 70,
      itensInclusos: 'Somente estrutura bruta, sem acabamentos'
    }
  },

  // Tipos de construção (método construtivo)
  tiposConstrucao: {
    'alvenaria': {
      nome: 'Alvenaria Convencional',
      descricao: 'Construção tradicional com tijolos/blocos e estrutura de concreto',
      fator: 1.0,
      tempoObra: 1.0,
      vantagens: ['Durabilidade', 'Flexibilidade de projeto', 'Mão de obra disponível'],
      desvantagens: ['Maior tempo de obra', 'Mais resíduos', 'Maior consumo de água']
    },
    'steel_frame': {
      nome: 'Steel Frame',
      descricao: 'Estrutura em aço galvanizado com fechamento em placas',
      fator: 1.15,
      tempoObra: 0.7,
      vantagens: ['Obra mais rápida', 'Menos resíduos', 'Precisão'],
      desvantagens: ['Custo inicial maior', 'Mão de obra especializada']
    },
    'wood_frame': {
      nome: 'Wood Frame (Madeira)',
      descricao: 'Estrutura em madeira tratada com fechamento em placas',
      fator: 1.20,
      tempoObra: 0.65,
      vantagens: ['Sustentável', 'Excelente isolamento térmico', 'Obra rápida'],
      desvantagens: ['Custo maior', 'Manutenção periódica']
    },
    'eps': {
      nome: 'Painéis EPS (Isopor)',
      descricao: 'Painéis de poliestireno expandido revestidos com argamassa',
      fator: 0.78,
      tempoObra: 0.6,
      vantagens: ['Custo menor', 'Obra rápida', 'Bom isolamento térmico'],
      desvantagens: ['Limitações estruturais', 'Menos resistente a impactos']
    },
    'mista': {
      nome: 'Construção Mista',
      descricao: 'Combinação de alvenaria com outros sistemas',
      fator: 1.05,
      tempoObra: 0.85,
      vantagens: ['Flexibilidade', 'Otimização de custos'],
      desvantagens: ['Requer planejamento cuidadoso']
    },
    'pre_fabricada': {
      nome: 'Pré-Fabricada',
      descricao: 'Casa com módulos industrializados',
      fator: 1.30,
      tempoObra: 0.4,
      vantagens: ['Obra muito rápida', 'Controle de qualidade'],
      desvantagens: ['Custo maior', 'Menos personalização']
    }
  },

  // Padrões de acabamento
  padroes: {
    'popular': {
      nome: 'Popular/Econômico',
      descricao: 'Acabamentos básicos, materiais simples',
      fator: 0.70,
      exemplos: 'Piso cerâmico simples, pintura básica, esquadrias simples'
    },
    'medio_baixo': {
      nome: 'Médio-Baixo',
      descricao: 'Acabamentos econômicos de qualidade razoável',
      fator: 0.85,
      exemplos: 'Cerâmica classe C, pintura acrílica básica'
    },
    'medio': {
      nome: 'Médio',
      descricao: 'Acabamentos de qualidade média',
      fator: 1.0,
      exemplos: 'Porcelanato nacional, pintura acrílica, alumínio'
    },
    'medio_alto': {
      nome: 'Médio-Alto',
      descricao: 'Acabamentos de boa qualidade',
      fator: 1.25,
      exemplos: 'Porcelanato retificado, pintura premium'
    },
    'alto': {
      nome: 'Alto Padrão',
      descricao: 'Acabamentos de alta qualidade',
      fator: 1.50,
      exemplos: 'Porcelanato importado, mármore, madeira nobre'
    },
    'luxo': {
      nome: 'Luxo',
      descricao: 'Acabamentos premium e materiais nobres',
      fator: 2.50,
      exemplos: 'Mármore importado, automação completa, design exclusivo'
    }
  },

  // Custo base por m² (SINAPI Nov/2025) - média nacional
  custoBaseM2: {
    materiais: 1076,
    maoDeObra: 807
  },

  // Custo ADICIONAL por cômodo (DIFERENCIAL sobre o custo base por m²)
  // O custo base m² já inclui um "quarto básico" na média
  // Estes valores representam apenas o EXTRA que cada tipo de cômodo exige
  custoPorComodo: {
    quarto: {
      areaPadrao: 12,
      custoBase: 2500, // Diferencial: porta, acabamentos básicos, ponto elétrico
      custoM2Adicional: 200,
      descricao: 'Porta, acabamentos, pontos elétricos'
    },
    suite: {
      areaPadrao: 18, // quarto + banheiro
      custoBase: 12000, // Diferencial: inclui banheiro privativo (hidráulica, louças, revestimentos)
      custoM2Adicional: 400,
      descricao: 'Quarto + banheiro completo com hidráulica e louças'
    },
    banheiro: {
      areaPadrao: 4,
      custoBase: 8000, // Diferencial: hidráulica, revestimentos especiais, louças, box
      custoM2Adicional: 1500,
      descricao: 'Hidráulica, revestimentos, louças, box'
    },
    cozinha: {
      areaPadrao: 10,
      custoBase: 10000, // Diferencial: hidráulica, elétrica reforçada, bancada, revestimentos
      custoM2Adicional: 800,
      descricao: 'Hidráulica, elétrica, bancada, revestimentos'
    },
    sala: {
      areaPadrao: 20,
      custoBase: 2000, // Diferencial: pontos elétricos extras, iluminação
      custoM2Adicional: 150,
      descricao: 'Pontos elétricos, iluminação'
    },
    areaServico: {
      areaPadrao: 5,
      custoBase: 4000, // Diferencial: tanque, pontos hidráulicos
      custoM2Adicional: 600,
      descricao: 'Tanque, pontos hidráulicos e elétricos'
    },
    varanda: {
      areaPadrao: 8,
      custoBase: 10000,
      custoM2Adicional: 1200
    },
    garagem: {
      areaPadrao: 15, // 1 vaga
      custoBase: 12000,
      custoM2Adicional: 800
    }
  },

  // Mão de obra - valores por profissional
  maoDeObra: {
    'pedreiro': {
      nome: 'Pedreiro',
      valorDia: 500,
      percentualObra: 25 // % do custo de mão de obra
    },
    'eletricista': {
      nome: 'Eletricista',
      valorDia: 600,
      percentualObra: 12
    },
    'encanador': {
      nome: 'Encanador',
      valorDia: 600,
      percentualObra: 12
    },
    'pintor': {
      nome: 'Pintor',
      valorDia: 400,
      percentualObra: 10
    },
    'gesseiro': {
      nome: 'Gesseiro',
      valorDia: 450,
      percentualObra: 8
    },
    'telhadista': {
      nome: 'Telhadista',
      valorDia: 420,
      percentualObra: 8
    },
    'vidraceiro': {
      nome: 'Vidraceiro',
      valorDia: 450,
      percentualObra: 5
    },
    'engenheiro': {
      nome: 'Engenheiro/Responsável Técnico',
      valorDia: 800,
      percentualObra: 5
    },
    'mestreObras': {
      nome: 'Mestre de Obras',
      valorDia: 600,
      percentualObra: 8
    },
    'servente': {
      nome: 'Servente/Ajudante',
      valorDia: 180,
      percentualObra: 7
    }
  },

  // Materiais específicos com opções de substituição
  materiais: {
    janelas: {
      'madeira_simples': {
        nome: 'Janela de Madeira Simples',
        valorM2: 250,
        durabilidade: 'Média'
      },
      'madeira_nobre': {
        nome: 'Janela de Madeira Nobre',
        valorM2: 600,
        durabilidade: 'Alta'
      },
      'aluminio_simples': {
        nome: 'Janela de Alumínio Simples',
        valorM2: 350,
        durabilidade: 'Alta'
      },
      'aluminio_linha_25': {
        nome: 'Janela de Alumínio Linha 25',
        valorM2: 500,
        durabilidade: 'Alta'
      },
      'aluminio_premium': {
        nome: 'Janela de Alumínio Premium',
        valorM2: 800,
        durabilidade: 'Alta'
      },
      'pvc_simples': {
        nome: 'Janela de PVC Simples',
        valorM2: 450,
        durabilidade: 'Alta'
      },
      'pvc_premium': {
        nome: 'Janela de PVC Premium (duplo vidro)',
        valorM2: 900,
        durabilidade: 'Alta'
      },
      'blindex_temperado': {
        nome: 'Vidro Temperado (Blindex)',
        valorM2: 550,
        durabilidade: 'Alta'
      }
    },
    portas: {
      'madeira_oca': {
        nome: 'Porta de Madeira Oca (interna)',
        valorUnidade: 180,
        observacao: 'Básica, uso interno'
      },
      'madeira_semi_oca': {
        nome: 'Porta de Madeira Semi-Oca',
        valorUnidade: 350,
        observacao: 'Melhor isolamento'
      },
      'madeira_macica_padrao': {
        nome: 'Porta de Madeira Maciça Padrão (80cm)',
        valorUnidade: 800,
        observacao: 'Durável, boa qualidade'
      },
      'madeira_macica_grande': {
        nome: 'Porta de Madeira Maciça Grande (90-100cm)',
        valorUnidade: 1500,
        observacao: 'Para entradas principais'
      },
      'madeira_macica_pivotante': {
        nome: 'Porta Pivotante Madeira Maciça',
        valorUnidade: 3500,
        observacao: 'Alto padrão'
      },
      'madeira_macica_especial': {
        nome: 'Porta Maciça Especial/Design (grande)',
        valorUnidade: 5500,
        observacao: 'Peça única, madeira nobre'
      },
      'aluminio_simples': {
        nome: 'Porta de Alumínio Simples',
        valorUnidade: 500,
        observacao: 'Prática e durável'
      },
      'aluminio_vidro': {
        nome: 'Porta de Alumínio com Vidro',
        valorUnidade: 900,
        observacao: 'Moderna'
      },
      'vidro_temperado': {
        nome: 'Porta de Vidro Temperado',
        valorUnidade: 1200,
        observacao: 'Elegante'
      },
      'aco_seguranca': {
        nome: 'Porta de Aço (segurança)',
        valorUnidade: 1800,
        observacao: 'Alta segurança'
      }
    },
    pisos: {
      'ceramica_classe_c': {
        nome: 'Cerâmica Classe C (básica)',
        valorM2: 25,
        observacao: 'Econômica, áreas internas'
      },
      'ceramica_classe_b': {
        nome: 'Cerâmica Classe B',
        valorM2: 35,
        observacao: 'Boa durabilidade'
      },
      'ceramica_classe_a': {
        nome: 'Cerâmica Classe A',
        valorM2: 55,
        observacao: 'Alta qualidade'
      },
      'porcelanato_classe_c': {
        nome: 'Porcelanato Classe C (popular)',
        valorM2: 45,
        observacao: 'Entrada de porcelanato'
      },
      'porcelanato_classe_b': {
        nome: 'Porcelanato Classe B',
        valorM2: 70,
        observacao: 'Bom custo-benefício'
      },
      'porcelanato_nacional': {
        nome: 'Porcelanato Nacional Classe A',
        valorM2: 95,
        observacao: 'Ótima qualidade'
      },
      'porcelanato_retificado': {
        nome: 'Porcelanato Retificado Premium',
        valorM2: 140,
        observacao: 'Acabamento perfeito'
      },
      'porcelanato_importado': {
        nome: 'Porcelanato Importado',
        valorM2: 220,
        observacao: 'Alto padrão'
      },
      'porcelanato_grande_formato': {
        nome: 'Porcelanato Grande Formato (120x120+)',
        valorM2: 180,
        observacao: 'Moderno, menos rejunte'
      },
      'vinilico_basico': {
        nome: 'Piso Vinílico Básico',
        valorM2: 45,
        observacao: 'Fácil instalação'
      },
      'vinilico_premium': {
        nome: 'Piso Vinílico Premium',
        valorM2: 95,
        observacao: 'Alta durabilidade'
      },
      'laminado_basico': {
        nome: 'Piso Laminado Básico',
        valorM2: 50,
        observacao: 'Econômico'
      },
      'laminado_premium': {
        nome: 'Piso Laminado Premium',
        valorM2: 90,
        observacao: 'Maior resistência'
      },
      'madeira_natural': {
        nome: 'Piso de Madeira Natural',
        valorM2: 200,
        observacao: 'Elegante, requer manutenção'
      },
      'madeira_nobre': {
        nome: 'Piso de Madeira Nobre (ipê, cumaru)',
        valorM2: 400,
        observacao: 'Luxo'
      },
      'cimento_queimado': {
        nome: 'Cimento Queimado',
        valorM2: 45,
        observacao: 'Industrial, moderno'
      },
      'granito': {
        nome: 'Granito',
        valorM2: 250,
        observacao: 'Resistente'
      },
      'marmore': {
        nome: 'Mármore',
        valorM2: 450,
        observacao: 'Luxo, requer cuidados'
      },
      'porcelanato_liquido': {
        nome: 'Porcelanato Líquido (Epóxi)',
        valorM2: 150,
        observacao: 'Sem rejunte'
      }
    },
    telhados: {
      'fibrocimento_basico': {
        nome: 'Telha Fibrocimento Básica',
        valorM2: 45,
        observacao: 'Econômica, 15-20 anos'
      },
      'fibrocimento_premium': {
        nome: 'Telha Fibrocimento Premium',
        valorM2: 65,
        observacao: 'Melhor acabamento'
      },
      'ceramica_simples': {
        nome: 'Telha Cerâmica Simples',
        valorM2: 70,
        observacao: 'Tradicional, 30+ anos'
      },
      'ceramica_esmaltada': {
        nome: 'Telha Cerâmica Esmaltada',
        valorM2: 95,
        observacao: 'Acabamento superior'
      },
      'concreto': {
        nome: 'Telha de Concreto',
        valorM2: 75,
        observacao: 'Durável, 40+ anos'
      },
      'metalica_simples': {
        nome: 'Telha Metálica Simples',
        valorM2: 70,
        observacao: 'Prática'
      },
      'metalica_sanduiche': {
        nome: 'Telha Metálica Sanduíche (térmica)',
        valorM2: 120,
        observacao: 'Isolamento térmico'
      },
      'galvalume': {
        nome: 'Telha Galvalume',
        valorM2: 95,
        observacao: 'Resistente, 25+ anos'
      },
      'shingle': {
        nome: 'Shingle (Telha Americana)',
        valorM2: 180,
        observacao: 'Estética diferenciada'
      },
      'laje_impermeabilizada': {
        nome: 'Laje Impermeabilizada (sem telha)',
        valorM2: 150,
        observacao: 'Moderna, permite terraço'
      },
      'telhado_verde': {
        nome: 'Telhado Verde',
        valorM2: 250,
        observacao: 'Sustentável'
      }
    },
    forros: {
      'pvc_simples': {
        nome: 'Forro de PVC Simples',
        valorM2: 40,
        observacao: 'Econômico, fácil manutenção'
      },
      'pvc_premium': {
        nome: 'Forro de PVC Premium',
        valorM2: 65,
        observacao: 'Melhor acabamento'
      },
      'gesso_liso': {
        nome: 'Forro de Gesso Liso',
        valorM2: 65,
        observacao: 'Acabamento elegante'
      },
      'gesso_acartonado': {
        nome: 'Forro de Gesso Acartonado (Drywall)',
        valorM2: 80,
        observacao: 'Permite embutidos'
      },
      'gesso_rebaixado_sanca': {
        nome: 'Forro Rebaixado com Sanca',
        valorM2: 120,
        observacao: 'Iluminação embutida'
      },
      'madeira_pinus': {
        nome: 'Forro de Madeira Pinus',
        valorM2: 80,
        observacao: 'Rústico'
      },
      'madeira_cedro': {
        nome: 'Forro de Madeira Cedro',
        valorM2: 140,
        observacao: 'Nobre'
      },
      'isopor': {
        nome: 'Forro de Isopor',
        valorM2: 30,
        observacao: 'Mais econômico'
      },
      'sem_forro': {
        nome: 'Sem Forro (laje aparente)',
        valorM2: 0,
        observacao: 'Industrial/moderno'
      }
    }
  },

  // Itens extras/opcionais - REVISADO
  extras: {
    piscina: {
      'fibra_pequena_3x2': {
        nome: 'Piscina de Fibra 3x2m',
        valor: 12000,
        observacao: 'Básica, instalação simples'
      },
      'fibra_pequena_4x2': {
        nome: 'Piscina de Fibra 4x2m',
        valor: 14000,
        observacao: 'Econômica'
      },
      'fibra_media_5x3': {
        nome: 'Piscina de Fibra 5x3m',
        valor: 16000,
        observacao: 'Tamanho familiar'
      },
      'fibra_media_6x3': {
        nome: 'Piscina de Fibra 6x3m',
        valor: 18000,
        observacao: 'Bom custo-benefício'
      },
      'fibra_grande_7x3': {
        nome: 'Piscina de Fibra 7x3m',
        valor: 22000,
        observacao: 'Espaçosa'
      },
      'fibra_grande_8x4': {
        nome: 'Piscina de Fibra 8x4m',
        valor: 28000,
        observacao: 'Grande porte'
      },
      'vinil_media_5x3': {
        nome: 'Piscina de Vinil 5x3m',
        valor: 22000,
        observacao: 'Personalizável'
      },
      'vinil_grande_6x3': {
        nome: 'Piscina de Vinil 6x3m',
        valor: 28000,
        observacao: 'Formato livre'
      },
      'vinil_grande_8x4': {
        nome: 'Piscina de Vinil 8x4m',
        valor: 38000,
        observacao: 'Grande porte'
      },
      'alvenaria_pequena_4x2': {
        nome: 'Piscina de Alvenaria 4x2m',
        valor: 25000,
        observacao: 'Personalizada, durável'
      },
      'alvenaria_media_6x3': {
        nome: 'Piscina de Alvenaria 6x3m',
        valor: 40000,
        observacao: 'Acabamento em azulejo'
      },
      'alvenaria_grande_8x4': {
        nome: 'Piscina de Alvenaria 8x4m',
        valor: 60000,
        observacao: 'Projeto personalizado'
      },
      'alvenaria_pastilha_6x3': {
        nome: 'Piscina Alvenaria c/ Pastilha 6x3m',
        valor: 55000,
        observacao: 'Acabamento premium'
      }
    },
    churrasqueira: {
      'pre_moldada_simples': {
        nome: 'Churrasqueira Pré-Moldada Simples',
        valor: 800,
        observacao: 'Básica'
      },
      'pre_moldada_media': {
        nome: 'Churrasqueira Pré-Moldada Média',
        valor: 1500,
        observacao: 'Com coifa'
      },
      'alvenaria_simples': {
        nome: 'Churrasqueira de Alvenaria Simples',
        valor: 3500,
        observacao: 'Tijolinho'
      },
      'alvenaria_completa': {
        nome: 'Churrasqueira de Alvenaria Completa',
        valor: 6000,
        observacao: 'Com bancada e pia'
      },
      'alvenaria_grande': {
        nome: 'Churrasqueira de Alvenaria Grande',
        valor: 10000,
        observacao: 'Forno de pizza incluso'
      },
      'gourmet_simples': {
        nome: 'Espaço Gourmet Simples',
        valor: 18000,
        observacao: 'Churrasqueira + bancada + pia'
      },
      'gourmet_completo': {
        nome: 'Espaço Gourmet Completo',
        valor: 35000,
        observacao: 'Com cooktop, forno, geladeira embutida'
      }
    },
    garagem: {
      'coberta_metalica_1v': {
        nome: 'Garagem Coberta Metálica (1 vaga)',
        valorM2: 350,
        areaBase: 15
      },
      'coberta_metalica_2v': {
        nome: 'Garagem Coberta Metálica (2 vagas)',
        valorM2: 320,
        areaBase: 30
      },
      'coberta_madeira_1v': {
        nome: 'Garagem Coberta Madeira (1 vaga)',
        valorM2: 450,
        areaBase: 15
      },
      'pergolado_madeira': {
        nome: 'Pergolado de Madeira',
        valorM2: 380,
        areaBase: 20
      },
      'pergolado_metalico': {
        nome: 'Pergolado Metálico',
        valorM2: 320,
        areaBase: 20
      },
      'pergolado_policarbonato': {
        nome: 'Pergolado com Policarbonato',
        valorM2: 450,
        areaBase: 20
      },
      'fechada_alvenaria_1v': {
        nome: 'Garagem Fechada Alvenaria (1 vaga)',
        valorM2: 1200,
        areaBase: 18
      },
      'fechada_alvenaria_2v': {
        nome: 'Garagem Fechada Alvenaria (2 vagas)',
        valorM2: 1100,
        areaBase: 35
      },
      'gourmet_garagem': {
        nome: 'Garagem Gourmet (coberta + churrasqueira + pia)',
        valorM2: 1500,
        areaBase: 25
      }
    },
    pisoExterno: {
      'terra_natural': {
        nome: 'Terra Natural (sem piso)',
        valorM2: 0,
        observacao: 'Apenas nivelamento'
      },
      'brita': {
        nome: 'Brita/Pedriscos',
        valorM2: 25,
        observacao: 'Drenagem, baixo custo'
      },
      'grama_natural': {
        nome: 'Grama Natural',
        valorM2: 35,
        observacao: 'Requer manutenção'
      },
      'grama_sintetica_basica': {
        nome: 'Grama Sintética Básica',
        valorM2: 80,
        observacao: 'Sem manutenção, 12mm'
      },
      'grama_sintetica_premium': {
        nome: 'Grama Sintética Premium',
        valorM2: 150,
        observacao: 'Alta durabilidade, 25mm+'
      },
      'contrapiso_cimento': {
        nome: 'Contrapiso/Cimento Alisado',
        valorM2: 45,
        observacao: 'Simples e funcional'
      },
      'paver_intertravado': {
        nome: 'Paver/Piso Intertravado',
        valorM2: 80,
        observacao: 'Durável, permeável'
      },
      'paver_premium': {
        nome: 'Paver Premium Colorido',
        valorM2: 120,
        observacao: 'Diversas cores'
      },
      'ceramica_externa': {
        nome: 'Cerâmica para Área Externa',
        valorM2: 65,
        observacao: 'Antiderrapante'
      },
      'porcelanato_externo': {
        nome: 'Porcelanato Externo',
        valorM2: 110,
        observacao: 'Resistente'
      },
      'pedra_natural': {
        nome: 'Pedra Natural (Miracema, São Tomé)',
        valorM2: 95,
        observacao: 'Rústico'
      },
      'deck_madeira': {
        nome: 'Deck de Madeira',
        valorM2: 350,
        observacao: 'Elegante, manutenção'
      },
      'deck_wpc': {
        nome: 'Deck WPC (Madeira Plástica)',
        valorM2: 280,
        observacao: 'Sem manutenção'
      }
    },
    varanda: {
      'aberta_simples': {
        nome: 'Varanda Aberta Simples',
        valorM2: 800,
        observacao: 'Só cobertura e piso'
      },
      'coberta_completa': {
        nome: 'Varanda Coberta Completa',
        valorM2: 1200,
        observacao: 'Com acabamentos'
      },
      'fechada_vidro': {
        nome: 'Varanda Fechada com Vidro',
        valorM2: 1800,
        observacao: 'Cortina de vidro'
      },
      'gourmet_aberta': {
        nome: 'Varanda Gourmet Aberta',
        valorM2: 1500,
        observacao: 'Com bancada e pia'
      },
      'gourmet_fechada': {
        nome: 'Varanda Gourmet Fechada',
        valorM2: 2200,
        observacao: 'Completa'
      }
    },
    muro: {
      'bloco_simples': {
        nome: 'Muro de Bloco Simples',
        valorMetroLinear: 250,
        alturaBase: 2
      },
      'bloco_rebocado': {
        nome: 'Muro de Bloco Rebocado e Pintado',
        valorMetroLinear: 380,
        alturaBase: 2
      },
      'bloco_texturizado': {
        nome: 'Muro com Textura/Grafiato',
        valorMetroLinear: 450,
        alturaBase: 2
      },
      'tijolo_aparente': {
        nome: 'Muro de Tijolo Aparente',
        valorMetroLinear: 420,
        alturaBase: 2
      },
      'pre_moldado': {
        nome: 'Muro Pré-Moldado',
        valorMetroLinear: 200,
        alturaBase: 2
      },
      'gradil_metalico': {
        nome: 'Muro Baixo + Gradil Metálico',
        valorMetroLinear: 480,
        alturaBase: 2
      },
      'vidro': {
        nome: 'Muro de Vidro',
        valorMetroLinear: 850,
        alturaBase: 2
      }
    },
    portao: {
      'ferro_simples': {
        nome: 'Portão de Ferro Simples',
        valorM2: 350
      },
      'ferro_trabalhado': {
        nome: 'Portão de Ferro Trabalhado',
        valorM2: 550
      },
      'aluminio_simples': {
        nome: 'Portão de Alumínio Simples',
        valorM2: 650
      },
      'aluminio_premium': {
        nome: 'Portão de Alumínio Premium',
        valorM2: 950
      },
      'basculante_manual': {
        nome: 'Portão Basculante Manual',
        valorUnidade: 2500
      },
      'basculante_automatico': {
        nome: 'Portão Basculante Automático',
        valorUnidade: 4500
      },
      'deslizante_manual': {
        nome: 'Portão Deslizante Manual',
        valorUnidade: 3000
      },
      'deslizante_automatico': {
        nome: 'Portão Deslizante Automático',
        valorUnidade: 5500
      },
      'pivotante': {
        nome: 'Portão Pivotante',
        valorUnidade: 6500
      }
    },
    edicula: {
      'simples_1_comodo': {
        nome: 'Edícula Simples (1 cômodo)',
        valorM2: 1400,
        areaBase: 15
      },
      'com_banheiro': {
        nome: 'Edícula com Banheiro',
        valorM2: 1700,
        areaBase: 20
      },
      'completa': {
        nome: 'Edícula Completa (quarto + banheiro + cozinha)',
        valorM2: 1900,
        areaBase: 30
      },
      'alto_padrao': {
        nome: 'Edícula Alto Padrão',
        valorM2: 2500,
        areaBase: 35
      }
    },
    energia: {
      'solar_2kw': {
        nome: 'Energia Solar 2kWp',
        valor: 12000,
        economia: 'R$ 200-300/mês'
      },
      'solar_3kw': {
        nome: 'Energia Solar 3kWp',
        valor: 16000,
        economia: 'R$ 300-400/mês'
      },
      'solar_5kw': {
        nome: 'Energia Solar 5kWp',
        valor: 24000,
        economia: 'R$ 500-700/mês'
      },
      'solar_8kw': {
        nome: 'Energia Solar 8kWp',
        valor: 36000,
        economia: 'R$ 800-1000/mês'
      },
      'solar_10kw': {
        nome: 'Energia Solar 10kWp',
        valor: 45000,
        economia: 'R$ 1000-1200/mês'
      },
      'aquecedor_solar_150l': {
        nome: 'Aquecedor Solar 150L',
        valor: 2500
      },
      'aquecedor_solar_200l': {
        nome: 'Aquecedor Solar 200L',
        valor: 3500
      },
      'aquecedor_solar_300l': {
        nome: 'Aquecedor Solar 300L',
        valor: 5000
      }
    },
    seguranca: {
      'cameras_4': {
        nome: 'Sistema 4 Câmeras',
        valor: 2000
      },
      'cameras_8': {
        nome: 'Sistema 8 Câmeras',
        valor: 3500
      },
      'cameras_8_premium': {
        nome: 'Sistema 8 Câmeras Premium (4K)',
        valor: 6000
      },
      'alarme_basico': {
        nome: 'Alarme Básico',
        valor: 1200
      },
      'alarme_monitorado': {
        nome: 'Alarme Monitorado (com central)',
        valor: 2500
      },
      'cerca_eletrica': {
        nome: 'Cerca Elétrica',
        valorMetro: 30
      },
      'concertina': {
        nome: 'Concertina',
        valorMetro: 22
      },
      'sensor_presenca': {
        nome: 'Sensores de Presença (kit 6)',
        valor: 800
      }
    },
    automacao: {
      'iluminacao_basica': {
        nome: 'Automação de Iluminação Básica',
        valor: 3500
      },
      'iluminacao_completa': {
        nome: 'Automação de Iluminação Completa',
        valor: 8000
      },
      'som_ambiente': {
        nome: 'Sistema de Som Ambiente',
        valor: 6000
      },
      'ar_condicionado': {
        nome: 'Automação de Ar Condicionado',
        valor: 4000
      },
      'cortinas_motorizadas': {
        nome: 'Cortinas Motorizadas',
        valor: 5000
      },
      'pacote_intermediario': {
        nome: 'Pacote Intermediário (luz + som)',
        valor: 15000
      },
      'pacote_completo': {
        nome: 'Automação Completa (tudo integrado)',
        valor: 40000
      }
    }
  },

  // Custos adicionais (percentual sobre a obra)
  custosAdicionais: {
    'projeto_arquitetonico': {
      nome: 'Projeto Arquitetônico',
      percentual: 3,
      valorMinimo: 4000
    },
    'projeto_estrutural': {
      nome: 'Projeto Estrutural',
      percentual: 1.5,
      valorMinimo: 2500
    },
    'projeto_eletrico': {
      nome: 'Projeto Elétrico',
      percentual: 0.5,
      valorMinimo: 1200
    },
    'projeto_hidraulico': {
      nome: 'Projeto Hidráulico',
      percentual: 0.5,
      valorMinimo: 1200
    },
    'aprovacao_prefeitura': {
      nome: 'Aprovação na Prefeitura',
      valorFixo: 3000
    },
    'art_rrt': {
      nome: 'ART/RRT',
      valorFixo: 700
    },
    'ligacao_agua': {
      nome: 'Ligação de Água',
      valorFixo: 1000
    },
    'ligacao_esgoto': {
      nome: 'Ligação de Esgoto',
      valorFixo: 700
    },
    'ligacao_energia': {
      nome: 'Ligação de Energia',
      valorFixo: 500
    },
    'habite_se': {
      nome: 'Habite-se',
      valorFixo: 400
    }
  },

  // Textos para tradução
  i18n: {
    pt: {
      titulo: 'Calculadora de Custo de Construção',
      subtitulo: 'Estime o custo para construir sua casa',
      configuracaoBasica: 'Configuração Básica',
      tipoEstrutura: 'Tipo de Casa',
      tipoConstrucao: 'Método Construtivo',
      padraoAcabamento: 'Padrão de Acabamento',
      regiao: 'Estado/Região',
      areaTotal: 'Área Total (m²)',
      materiais: 'Materiais',
      maoDeObra: 'Mão de Obra',
      extras: 'Itens Extras',
      resultado: 'Resultado',
      custoTotal: 'Custo Total Estimado',
      detalhamento: 'Detalhamento',
      calcular: 'Calcular',
      exportar: 'Exportar Orçamento',
      avisoValores: 'Valores de referência sujeitos a variação conforme localidade, período e negociação com fornecedores.'
    },
    en: {
      titulo: 'Construction Cost Calculator',
      subtitulo: 'Estimate the cost to build your home',
      configuracaoBasica: 'Basic Configuration',
      tipoEstrutura: 'House Type',
      tipoConstrucao: 'Construction Method',
      padraoAcabamento: 'Finishing Standard',
      regiao: 'State/Region',
      areaTotal: 'Total Area (m²)',
      materiais: 'Materials',
      maoDeObra: 'Labor',
      extras: 'Extra Items',
      resultado: 'Result',
      custoTotal: 'Estimated Total Cost',
      detalhamento: 'Breakdown',
      calcular: 'Calculate',
      exportar: 'Export Budget',
      avisoValores: 'Reference values subject to variation according to location, period and supplier negotiation.'
    },
    es: {
      titulo: 'Calculadora de Costo de Construcción',
      subtitulo: 'Estime el costo para construir su casa',
      configuracaoBasica: 'Configuración Básica',
      tipoEstrutura: 'Tipo de Casa',
      tipoConstrucao: 'Método Constructivo',
      padraoAcabamento: 'Estándar de Acabado',
      regiao: 'Estado/Región',
      areaTotal: 'Área Total (m²)',
      materiais: 'Materiales',
      maoDeObra: 'Mano de Obra',
      extras: 'Elementos Extra',
      resultado: 'Resultado',
      custoTotal: 'Costo Total Estimado',
      detalhamento: 'Desglose',
      calcular: 'Calcular',
      exportar: 'Exportar Presupuesto',
      avisoValores: 'Valores de referencia sujetos a variación según localidad, período y negociación con proveedores.'
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustoConstrucaoData;
}
