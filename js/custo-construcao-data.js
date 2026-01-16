/**
 * Calculadora de Custo de Construção - Base de Dados
 * Valores atualizados: Janeiro 2026 (Base SINAPI Nov/2025)
 *
 * Fontes:
 * - SINAPI/IBGE
 * - CBIC
 * - Pesquisa de mercado
 */

const CustoConstrucaoData = {
  // Versão dos dados
  versao: '1.0',
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

  // Tipos de construção com fatores de custo
  tiposConstrucao: {
    'alvenaria': {
      nome: 'Alvenaria Convencional',
      descricao: 'Construção tradicional com tijolos/blocos e estrutura de concreto',
      fator: 1.0,
      tempoObra: 1.0, // referência
      vantagens: ['Durabilidade', 'Flexibilidade de projeto', 'Mão de obra disponível'],
      desvantagens: ['Maior tempo de obra', 'Mais resíduos', 'Maior consumo de água']
    },
    'steel_frame': {
      nome: 'Steel Frame',
      descricao: 'Estrutura em aço galvanizado com fechamento em placas',
      fator: 1.15, // 15% mais caro que alvenaria
      tempoObra: 0.7, // 30% mais rápido
      vantagens: ['Obra mais rápida', 'Menos resíduos', 'Precisão'],
      desvantagens: ['Custo inicial maior', 'Mão de obra especializada', 'Menor flexibilidade para reformas']
    },
    'wood_frame': {
      nome: 'Wood Frame (Madeira)',
      descricao: 'Estrutura em madeira tratada com fechamento em placas',
      fator: 1.20,
      tempoObra: 0.65,
      vantagens: ['Sustentável', 'Excelente isolamento térmico', 'Obra rápida'],
      desvantagens: ['Custo maior', 'Manutenção periódica', 'Mão de obra especializada']
    },
    'eps': {
      nome: 'Painéis EPS (Isopor)',
      descricao: 'Painéis de poliestireno expandido revestidos com argamassa',
      fator: 0.78, // 22% mais barato
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
      fator: 1.30, // R$ 2.400 a R$ 3.600/m²
      tempoObra: 0.4,
      vantagens: ['Obra muito rápida', 'Controle de qualidade', 'Menos desperdício'],
      desvantagens: ['Custo maior', 'Menos personalização', 'Transporte dos módulos']
    }
  },

  // Padrões de acabamento
  padroes: {
    'popular': {
      nome: 'Popular/Econômico',
      descricao: 'Acabamentos básicos, materiais simples',
      fator: 0.75,
      exemplos: 'Piso cerâmico simples, pintura básica, esquadrias simples'
    },
    'medio': {
      nome: 'Médio',
      descricao: 'Acabamentos de qualidade média',
      fator: 1.0,
      exemplos: 'Porcelanato, pintura acrílica, esquadrias de alumínio'
    },
    'alto': {
      nome: 'Alto Padrão',
      descricao: 'Acabamentos de alta qualidade',
      fator: 1.5,
      exemplos: 'Porcelanato importado, pintura especial, esquadrias premium'
    },
    'luxo': {
      nome: 'Luxo',
      descricao: 'Acabamentos premium e materiais nobres',
      fator: 2.5,
      exemplos: 'Mármore, madeira nobre, automação completa'
    }
  },

  // Custo base por m² (SINAPI Nov/2025) - média nacional
  custoBaseM2: {
    materiais: 1076, // R$/m²
    maoDeObra: 807   // R$/m²
  },

  // Etapas da obra com percentual do custo total
  etapas: {
    'infraestrutura': {
      nome: 'Infraestrutura',
      descricao: 'Fundação, baldrame, contrapiso',
      percentual: 8,
      itens: ['Escavação', 'Fundação', 'Baldrame', 'Impermeabilização', 'Contrapiso']
    },
    'estrutura': {
      nome: 'Estrutura',
      descricao: 'Pilares, vigas, lajes',
      percentual: 15,
      itens: ['Pilares', 'Vigas', 'Lajes', 'Escadas']
    },
    'alvenaria': {
      nome: 'Alvenaria',
      descricao: 'Paredes, divisórias',
      percentual: 8,
      itens: ['Paredes externas', 'Paredes internas', 'Vergas e contravergas']
    },
    'cobertura': {
      nome: 'Cobertura',
      descricao: 'Telhado, calhas, rufos',
      percentual: 10,
      itens: ['Estrutura do telhado', 'Telhas', 'Calhas', 'Rufos', 'Cumeeiras']
    },
    'instalacoes_eletricas': {
      nome: 'Instalações Elétricas',
      descricao: 'Fiação, tomadas, disjuntores',
      percentual: 8,
      itens: ['Quadro de distribuição', 'Fiação', 'Tomadas', 'Interruptores', 'Iluminação']
    },
    'instalacoes_hidraulicas': {
      nome: 'Instalações Hidráulicas',
      descricao: 'Água fria, água quente, esgoto',
      percentual: 8,
      itens: ['Tubulação água fria', 'Tubulação água quente', 'Esgoto', 'Caixa d\'água', 'Aquecedor']
    },
    'revestimentos': {
      nome: 'Revestimentos',
      descricao: 'Reboco, chapisco, gesso',
      percentual: 10,
      itens: ['Chapisco', 'Reboco interno', 'Reboco externo', 'Gesso', 'Forro']
    },
    'pisos': {
      nome: 'Pisos',
      descricao: 'Cerâmica, porcelanato, outros',
      percentual: 10,
      itens: ['Contrapiso', 'Piso cerâmico/porcelanato', 'Rodapé', 'Soleira']
    },
    'esquadrias': {
      nome: 'Esquadrias',
      descricao: 'Portas, janelas, vidros',
      percentual: 8,
      itens: ['Portas internas', 'Portas externas', 'Janelas', 'Vidros', 'Fechaduras']
    },
    'pintura': {
      nome: 'Pintura',
      descricao: 'Interna e externa',
      percentual: 6,
      itens: ['Selador', 'Massa corrida', 'Pintura interna', 'Pintura externa', 'Textura']
    },
    'loucas_metais': {
      nome: 'Louças e Metais',
      descricao: 'Vasos, pias, torneiras',
      percentual: 5,
      itens: ['Vaso sanitário', 'Pia', 'Tanque', 'Torneiras', 'Chuveiro', 'Acessórios']
    },
    'acabamentos_finais': {
      nome: 'Acabamentos Finais',
      descricao: 'Limpeza, detalhes',
      percentual: 4,
      itens: ['Limpeza da obra', 'Arremates', 'Detalhes finais']
    }
  },

  // Mão de obra - valores por profissional
  maoDeObra: {
    'pedreiro': {
      nome: 'Pedreiro',
      valorHora: 60, // R$/hora (média)
      valorDia: 500, // R$/dia (média)
      valorM2: 65,   // R$/m² (serviço geral)
      servicos: {
        'alvenaria': { nome: 'Alvenaria (levantar paredes)', valorM2: 25 },
        'reboco': { nome: 'Reboco', valorM2: 55 },
        'contrapiso': { nome: 'Contrapiso', valorM2: 35 },
        'assentamento_piso': { nome: 'Assentamento de piso cerâmico', valorM2: 60 },
        'assentamento_porcelanato': { nome: 'Assentamento de porcelanato', valorM2: 80 }
      }
    },
    'eletricista': {
      nome: 'Eletricista',
      valorHora: 80,
      valorDia: 600,
      valorPonto: 45, // R$ por ponto elétrico
      salarioMes: 3800
    },
    'encanador': {
      nome: 'Encanador',
      valorHora: 80,
      valorDia: 600,
      valorPonto: 50, // R$ por ponto hidráulico
      salarioMes: 3800
    },
    'pintor': {
      nome: 'Pintor',
      valorHora: 50,
      valorDia: 400,
      valorM2: 18, // R$/m² pintura simples
      salarioMes: 3500,
      servicos: {
        'pintura_simples': { nome: 'Pintura simples (1 demão)', valorM2: 12 },
        'pintura_completa': { nome: 'Pintura completa (massa + 2 demãos)', valorM2: 25 },
        'textura': { nome: 'Textura', valorM2: 35 }
      }
    },
    'gesseiro': {
      nome: 'Gesseiro',
      valorHora: 60,
      valorDia: 450,
      valorM2: 45,
      servicos: {
        'forro_liso': { nome: 'Forro de gesso liso', valorM2: 45 },
        'forro_tabicado': { nome: 'Forro de gesso tabicado', valorM2: 55 },
        'sanca': { nome: 'Sanca', valorMetro: 80 }
      }
    },
    'marceneiro': {
      nome: 'Marceneiro',
      valorHora: 70,
      valorDia: 550,
      salarioMes: 4200
    },
    'serralheiro': {
      nome: 'Serralheiro',
      valorHora: 65,
      valorDia: 500,
      salarioMes: 4000
    },
    'vidraceiro': {
      nome: 'Vidraceiro',
      valorHora: 60,
      valorDia: 450,
      valorM2: 30 // instalação
    },
    'telhadista': {
      nome: 'Telhadista',
      valorHora: 55,
      valorDia: 420,
      valorM2: 80 // inclui estrutura simples
    },
    'engenheiro': {
      nome: 'Engenheiro Civil',
      valorProjeto: 5000, // projeto básico
      valorART: 800,
      acompanhamentoMes: 2500
    },
    'arquiteto': {
      nome: 'Arquiteto',
      valorProjeto: 8000, // projeto completo
      valorM2Projeto: 80 // R$/m² para projeto
    },
    'mestre_obras': {
      nome: 'Mestre de Obras',
      salarioMes: 5500,
      percentualObra: 3 // 3% do valor da obra
    },
    'servente': {
      nome: 'Servente/Ajudante',
      valorHora: 25,
      valorDia: 180,
      salarioMes: 2100
    }
  },

  // Materiais específicos com opções de substituição
  materiais: {
    janelas: {
      'madeira': {
        nome: 'Janela de Madeira',
        valorM2: 350, // R$/m²
        durabilidade: 'Média (requer manutenção)',
        manutencao: 'Pintura a cada 2-3 anos'
      },
      'aluminio': {
        nome: 'Janela de Alumínio',
        valorM2: 450,
        durabilidade: 'Alta',
        manutencao: 'Baixa'
      },
      'pvc': {
        nome: 'Janela de PVC',
        valorM2: 600,
        durabilidade: 'Alta',
        manutencao: 'Muito baixa',
        isolamento: 'Excelente térmico e acústico'
      },
      'vidro_temperado': {
        nome: 'Vidro Temperado (blindex)',
        valorM2: 550,
        durabilidade: 'Alta',
        manutencao: 'Baixa'
      }
    },
    portas: {
      'madeira_macica': {
        nome: 'Porta de Madeira Maciça',
        valorUnidade: 800,
        durabilidade: 'Alta'
      },
      'madeira_semi_oca': {
        nome: 'Porta de Madeira Semi-Oca',
        valorUnidade: 350,
        durabilidade: 'Média'
      },
      'madeira_oca': {
        nome: 'Porta de Madeira Oca',
        valorUnidade: 200,
        durabilidade: 'Baixa'
      },
      'aluminio': {
        nome: 'Porta de Alumínio',
        valorUnidade: 600,
        durabilidade: 'Alta'
      },
      'vidro': {
        nome: 'Porta de Vidro Temperado',
        valorM2: 650,
        durabilidade: 'Alta'
      },
      'aco': {
        nome: 'Porta de Aço',
        valorUnidade: 500,
        durabilidade: 'Alta',
        seguranca: 'Alta'
      }
    },
    pisos: {
      'ceramica_simples': {
        nome: 'Cerâmica Simples',
        valorM2: 35,
        durabilidade: 'Média'
      },
      'ceramica_qualidade': {
        nome: 'Cerâmica Qualidade',
        valorM2: 55,
        durabilidade: 'Alta'
      },
      'porcelanato_nacional': {
        nome: 'Porcelanato Nacional',
        valorM2: 85,
        durabilidade: 'Alta'
      },
      'porcelanato_importado': {
        nome: 'Porcelanato Importado',
        valorM2: 180,
        durabilidade: 'Alta'
      },
      'vinilico': {
        nome: 'Piso Vinílico',
        valorM2: 75,
        durabilidade: 'Média'
      },
      'laminado': {
        nome: 'Piso Laminado',
        valorM2: 65,
        durabilidade: 'Média'
      },
      'madeira': {
        nome: 'Piso de Madeira',
        valorM2: 180,
        durabilidade: 'Alta (com manutenção)'
      },
      'cimento_queimado': {
        nome: 'Cimento Queimado',
        valorM2: 45,
        durabilidade: 'Alta'
      },
      'granito': {
        nome: 'Granito',
        valorM2: 220,
        durabilidade: 'Alta'
      },
      'porcelanato_liquido': {
        nome: 'Porcelanato Líquido',
        valorM2: 150,
        durabilidade: 'Alta'
      }
    },
    telhados: {
      'ceramica': {
        nome: 'Telha Cerâmica',
        valorM2: 85, // com estrutura de madeira
        durabilidade: 'Alta (30+ anos)'
      },
      'concreto': {
        nome: 'Telha de Concreto',
        valorM2: 75,
        durabilidade: 'Alta (40+ anos)'
      },
      'fibrocimento': {
        nome: 'Telha Fibrocimento',
        valorM2: 55,
        durabilidade: 'Média (15-20 anos)'
      },
      'metalica': {
        nome: 'Telha Metálica (Galvalume)',
        valorM2: 95,
        durabilidade: 'Alta (25+ anos)'
      },
      'shingle': {
        nome: 'Shingle (Telha Americana)',
        valorM2: 180,
        durabilidade: 'Alta (30+ anos)'
      },
      'laje': {
        nome: 'Laje (sem telha)',
        valorM2: 150,
        durabilidade: 'Alta',
        observacao: 'Requer impermeabilização'
      }
    },
    forros: {
      'gesso_liso': {
        nome: 'Forro de Gesso Liso',
        valorM2: 65, // material + mão de obra
        durabilidade: 'Alta'
      },
      'gesso_acartonado': {
        nome: 'Forro de Gesso Acartonado (Drywall)',
        valorM2: 75,
        durabilidade: 'Alta'
      },
      'pvc': {
        nome: 'Forro de PVC',
        valorM2: 55,
        durabilidade: 'Alta'
      },
      'madeira': {
        nome: 'Forro de Madeira',
        valorM2: 120,
        durabilidade: 'Alta'
      },
      'isopor': {
        nome: 'Forro de Isopor',
        valorM2: 35,
        durabilidade: 'Média'
      }
    },
    revestimentos: {
      'azulejo_simples': {
        nome: 'Azulejo Simples',
        valorM2: 30
      },
      'azulejo_decorado': {
        nome: 'Azulejo Decorado',
        valorM2: 60
      },
      'porcelanato_parede': {
        nome: 'Porcelanato Parede',
        valorM2: 95
      },
      'pastilha_vidro': {
        nome: 'Pastilha de Vidro',
        valorM2: 180
      },
      'pedra_natural': {
        nome: 'Pedra Natural',
        valorM2: 250
      }
    }
  },

  // Itens extras/opcionais
  extras: {
    piscina: {
      'fibra_pequena': {
        nome: 'Piscina de Fibra Pequena (4x2m)',
        valor: 22000,
        manutencaoAnual: 1500
      },
      'fibra_media': {
        nome: 'Piscina de Fibra Média (6x3m)',
        valor: 28000,
        manutencaoAnual: 2000
      },
      'fibra_grande': {
        nome: 'Piscina de Fibra Grande (8x4m)',
        valor: 38000,
        manutencaoAnual: 2500
      },
      'vinil_pequena': {
        nome: 'Piscina de Vinil Pequena',
        valor: 30000,
        manutencaoAnual: 1800
      },
      'vinil_media': {
        nome: 'Piscina de Vinil Média',
        valor: 42000,
        manutencaoAnual: 2200
      },
      'alvenaria_pequena': {
        nome: 'Piscina de Alvenaria Pequena (5x2.5m)',
        valor: 45000,
        manutencaoAnual: 2000
      },
      'alvenaria_media': {
        nome: 'Piscina de Alvenaria Média (6x3m)',
        valor: 60000,
        manutencaoAnual: 2500
      },
      'alvenaria_grande': {
        nome: 'Piscina de Alvenaria Grande (8x4m)',
        valor: 85000,
        manutencaoAnual: 3000
      }
    },
    churrasqueira: {
      'simples': {
        nome: 'Churrasqueira Simples (pré-moldada)',
        valor: 1500
      },
      'alvenaria_pequena': {
        nome: 'Churrasqueira Alvenaria Pequena',
        valor: 4000
      },
      'alvenaria_media': {
        nome: 'Churrasqueira Alvenaria Média',
        valor: 7000
      },
      'alvenaria_grande': {
        nome: 'Churrasqueira Alvenaria Grande',
        valor: 12000
      },
      'gourmet_completa': {
        nome: 'Área Gourmet Completa',
        valor: 25000
      }
    },
    garagem: {
      'coberta_1_vaga': {
        nome: 'Garagem Coberta 1 Vaga (15m²)',
        valorM2: 800
      },
      'coberta_2_vagas': {
        nome: 'Garagem Coberta 2 Vagas (30m²)',
        valorM2: 750
      },
      'fechada_1_vaga': {
        nome: 'Garagem Fechada 1 Vaga',
        valorM2: 1200
      },
      'fechada_2_vagas': {
        nome: 'Garagem Fechada 2 Vagas',
        valorM2: 1100
      }
    },
    varanda: {
      'simples': {
        nome: 'Varanda Simples',
        valorM2: 900
      },
      'coberta': {
        nome: 'Varanda Coberta',
        valorM2: 1200
      },
      'fechada_vidro': {
        nome: 'Varanda Fechada com Vidro',
        valorM2: 1800
      }
    },
    muro: {
      'bloco_simples': {
        nome: 'Muro de Bloco Simples',
        valorMetroLinear: 280, // por metro linear, 2m de altura
        alturaBase: 2
      },
      'bloco_rebocado': {
        nome: 'Muro de Bloco Rebocado',
        valorMetroLinear: 380,
        alturaBase: 2
      },
      'gradil': {
        nome: 'Muro com Gradil',
        valorMetroLinear: 450,
        alturaBase: 2
      },
      'pre_moldado': {
        nome: 'Muro Pré-Moldado',
        valorMetroLinear: 250,
        alturaBase: 2
      }
    },
    portao: {
      'ferro_simples': {
        nome: 'Portão de Ferro Simples',
        valorM2: 450
      },
      'ferro_trabalhado': {
        nome: 'Portão de Ferro Trabalhado',
        valorM2: 700
      },
      'aluminio': {
        nome: 'Portão de Alumínio',
        valorM2: 850
      },
      'automatico_basculante': {
        nome: 'Portão Automático Basculante',
        valorUnidade: 4500
      },
      'automatico_deslizante': {
        nome: 'Portão Automático Deslizante',
        valorUnidade: 5500
      }
    },
    edicula: {
      'simples_1_comodo': {
        nome: 'Edícula Simples (1 cômodo)',
        valorM2: 1500
      },
      'com_banheiro': {
        nome: 'Edícula com Banheiro',
        valorM2: 1800
      },
      'completa': {
        nome: 'Edícula Completa (quarto + banheiro + cozinha)',
        valorM2: 2000
      }
    },
    areaDeLazer: {
      'deck_madeira': {
        nome: 'Deck de Madeira',
        valorM2: 350
      },
      'deck_wpc': {
        nome: 'Deck WPC (madeira plástica)',
        valorM2: 280
      },
      'pergolado_madeira': {
        nome: 'Pergolado de Madeira',
        valorM2: 450
      },
      'pergolado_metalico': {
        nome: 'Pergolado Metálico',
        valorM2: 550
      },
      'jardim': {
        nome: 'Paisagismo/Jardim',
        valorM2: 120
      }
    },
    energia: {
      'solar_3kw': {
        nome: 'Energia Solar 3kWp',
        valor: 18000,
        economia: 'R$ 300-400/mês'
      },
      'solar_5kw': {
        nome: 'Energia Solar 5kWp',
        valor: 28000,
        economia: 'R$ 500-700/mês'
      },
      'solar_8kw': {
        nome: 'Energia Solar 8kWp',
        valor: 42000,
        economia: 'R$ 800-1000/mês'
      },
      'aquecedor_solar': {
        nome: 'Aquecedor Solar (200L)',
        valor: 3500
      }
    },
    seguranca: {
      'cameras_4': {
        nome: 'Sistema 4 Câmeras',
        valor: 2500
      },
      'cameras_8': {
        nome: 'Sistema 8 Câmeras',
        valor: 4500
      },
      'alarme': {
        nome: 'Alarme Monitorado',
        valor: 1800,
        mensalidade: 100
      },
      'cerca_eletrica': {
        nome: 'Cerca Elétrica',
        valorMetro: 35
      },
      'concertina': {
        nome: 'Concertina',
        valorMetro: 25
      }
    },
    automacao: {
      'basica': {
        nome: 'Automação Básica (iluminação)',
        valor: 5000
      },
      'intermediaria': {
        nome: 'Automação Intermediária (luz + som)',
        valor: 15000
      },
      'completa': {
        nome: 'Automação Completa',
        valor: 40000
      }
    }
  },

  // Custos adicionais (percentual sobre a obra)
  custosAdicionais: {
    'projeto_arquitetonico': {
      nome: 'Projeto Arquitetônico',
      percentual: 3,
      valorMinimo: 5000
    },
    'projeto_estrutural': {
      nome: 'Projeto Estrutural',
      percentual: 1.5,
      valorMinimo: 3000
    },
    'projeto_eletrico': {
      nome: 'Projeto Elétrico',
      percentual: 0.5,
      valorMinimo: 1500
    },
    'projeto_hidraulico': {
      nome: 'Projeto Hidráulico',
      percentual: 0.5,
      valorMinimo: 1500
    },
    'aprovacao_prefeitura': {
      nome: 'Aprovação na Prefeitura',
      valorFixo: 3500
    },
    'art_rrt': {
      nome: 'ART/RRT',
      valorFixo: 800
    },
    'ligacao_agua': {
      nome: 'Ligação de Água',
      valorFixo: 1200
    },
    'ligacao_esgoto': {
      nome: 'Ligação de Esgoto',
      valorFixo: 800
    },
    'ligacao_energia': {
      nome: 'Ligação de Energia',
      valorFixo: 600
    },
    'habite_se': {
      nome: 'Habite-se',
      valorFixo: 500
    }
  },

  // Cômodos típicos com áreas médias
  comodosReferencia: {
    'quarto_pequeno': { nome: 'Quarto Pequeno', areaMedia: 9 },
    'quarto_medio': { nome: 'Quarto Médio', areaMedia: 12 },
    'quarto_grande': { nome: 'Quarto Grande/Suíte', areaMedia: 16 },
    'suite_master': { nome: 'Suíte Master', areaMedia: 25 },
    'banheiro_pequeno': { nome: 'Banheiro Pequeno', areaMedia: 3 },
    'banheiro_medio': { nome: 'Banheiro Médio', areaMedia: 5 },
    'banheiro_grande': { nome: 'Banheiro Grande', areaMedia: 8 },
    'sala_pequena': { nome: 'Sala Pequena', areaMedia: 15 },
    'sala_media': { nome: 'Sala Média', areaMedia: 25 },
    'sala_grande': { nome: 'Sala Grande', areaMedia: 40 },
    'cozinha_pequena': { nome: 'Cozinha Pequena', areaMedia: 8 },
    'cozinha_media': { nome: 'Cozinha Média', areaMedia: 12 },
    'cozinha_grande': { nome: 'Cozinha Grande', areaMedia: 18 },
    'area_servico_pequena': { nome: 'Área de Serviço Pequena', areaMedia: 4 },
    'area_servico_media': { nome: 'Área de Serviço Média', areaMedia: 6 },
    'varanda': { nome: 'Varanda', areaMedia: 8 },
    'garagem_1_vaga': { nome: 'Garagem 1 Vaga', areaMedia: 15 },
    'garagem_2_vagas': { nome: 'Garagem 2 Vagas', areaMedia: 30 },
    'circulacao': { nome: 'Circulação (corredores)', percentual: 10 } // % da área total
  },

  // Estimativa de pontos por cômodo
  pontosReferencia: {
    quarto: { eletricos: 8, hidraulicos: 0 },
    quarto_suite: { eletricos: 8, hidraulicos: 4 },
    banheiro: { eletricos: 4, hidraulicos: 6 },
    sala: { eletricos: 12, hidraulicos: 0 },
    cozinha: { eletricos: 10, hidraulicos: 4 },
    area_servico: { eletricos: 4, hidraulicos: 4 },
    varanda: { eletricos: 4, hidraulicos: 1 },
    garagem: { eletricos: 4, hidraulicos: 1 }
  },

  // Textos para tradução
  i18n: {
    pt: {
      titulo: 'Calculadora de Custo de Construção',
      subtitulo: 'Estime o custo para construir sua casa',
      configuracaoBasica: 'Configuração Básica',
      tipoConstrucao: 'Tipo de Construção',
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
      avisoValores: 'Valores de referência sujeitos a variação conforme localidade e período.'
    },
    en: {
      titulo: 'Construction Cost Calculator',
      subtitulo: 'Estimate the cost to build your home',
      configuracaoBasica: 'Basic Configuration',
      tipoConstrucao: 'Construction Type',
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
      avisoValores: 'Reference values subject to variation according to location and period.'
    },
    es: {
      titulo: 'Calculadora de Costo de Construcción',
      subtitulo: 'Estime el costo para construir su casa',
      configuracaoBasica: 'Configuración Básica',
      tipoConstrucao: 'Tipo de Construcción',
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
      avisoValores: 'Valores de referencia sujetos a variación según localidad y período.'
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustoConstrucaoData;
}
