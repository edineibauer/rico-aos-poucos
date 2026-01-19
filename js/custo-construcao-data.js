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
      fator: 3.50,
      observacao: 'Valor de mercado médio - inclui fração do terreno, área comum e infraestrutura',
      isValorMercado: true
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

  // =====================================================
  // COMPOSIÇÃO DETALHADA DE MATERIAIS POR TIPO DE CONSTRUÇÃO
  // =====================================================
  // Preços unitários base dos materiais (podem ser personalizados pelo usuário)
  // Total esperado por m² para alvenaria padrão médio: ~R$ 1.076/m²
  materiaisBase: {
    // ========== FUNDAÇÃO E ESTRUTURA ==========
    tijolo_ceramico: { nome: 'Tijolo Cerâmico 9 furos', unidade: 'milheiro', preco: 850, categoria: 'estrutura' },
    bloco_concreto: { nome: 'Bloco de Concreto 14x19x39', unidade: 'unidade', preco: 3.50, categoria: 'estrutura' },
    cimento: { nome: 'Cimento CP-II 50kg', unidade: 'saco', preco: 38, categoria: 'estrutura' },
    areia_media: { nome: 'Areia Média', unidade: 'm³', preco: 130, categoria: 'estrutura' },
    areia_fina: { nome: 'Areia Fina', unidade: 'm³', preco: 145, categoria: 'estrutura' },
    brita: { nome: 'Brita 1', unidade: 'm³', preco: 140, categoria: 'estrutura' },
    ferro_8mm: { nome: 'Ferro CA-50 8mm', unidade: 'kg', preco: 8.50, categoria: 'estrutura' },
    ferro_10mm: { nome: 'Ferro CA-50 10mm', unidade: 'kg', preco: 8.50, categoria: 'estrutura' },
    ferro_12mm: { nome: 'Ferro CA-50 12mm', unidade: 'kg', preco: 9.00, categoria: 'estrutura' },
    arame_recozido: { nome: 'Arame Recozido', unidade: 'kg', preco: 14, categoria: 'estrutura' },
    concreto_usinado: { nome: 'Concreto Usinado fck25', unidade: 'm³', preco: 450, categoria: 'estrutura' },
    forma_madeira: { nome: 'Forma de Madeira (compensado)', unidade: 'm²', preco: 45, categoria: 'estrutura' },
    lona_plastica: { nome: 'Lona Plástica Preta', unidade: 'm²', preco: 3.50, categoria: 'estrutura' },
    impermeabilizante: { nome: 'Impermeabilizante Manta Asfáltica', unidade: 'm²', preco: 65, categoria: 'estrutura' },

    // ========== COBERTURA/TELHADO ==========
    madeira_telhado: { nome: 'Madeiramento Telhado (tesoura)', unidade: 'm²', preco: 85, categoria: 'cobertura' },
    telha_ceramica: { nome: 'Telha Cerâmica Colonial', unidade: 'm²', preco: 55, categoria: 'cobertura' },
    cumeeira: { nome: 'Cumeeira Cerâmica', unidade: 'unidade', preco: 8, categoria: 'cobertura' },
    rufo_galvanizado: { nome: 'Rufo Galvanizado', unidade: 'm', preco: 35, categoria: 'cobertura' },
    calha_pvc: { nome: 'Calha PVC 170mm', unidade: 'm', preco: 28, categoria: 'cobertura' },
    condutor_pvc: { nome: 'Condutor Pluvial PVC 100mm', unidade: 'm', preco: 22, categoria: 'cobertura' },

    // ========== INSTALAÇÃO ELÉTRICA ==========
    fio_eletrico_2_5mm: { nome: 'Fio Elétrico 2,5mm', unidade: 'm', preco: 2.80, categoria: 'eletrica' },
    fio_eletrico_4mm: { nome: 'Fio Elétrico 4mm', unidade: 'm', preco: 4.50, categoria: 'eletrica' },
    fio_eletrico_6mm: { nome: 'Fio Elétrico 6mm', unidade: 'm', preco: 7.20, categoria: 'eletrica' },
    fio_eletrico_10mm: { nome: 'Fio Elétrico 10mm', unidade: 'm', preco: 12.00, categoria: 'eletrica' },
    eletroduto_pvc_20mm: { nome: 'Eletroduto PVC 20mm', unidade: 'm', preco: 3.80, categoria: 'eletrica' },
    eletroduto_pvc_25mm: { nome: 'Eletroduto PVC 25mm', unidade: 'm', preco: 4.50, categoria: 'eletrica' },
    caixa_4x2: { nome: 'Caixa de Luz 4x2', unidade: 'unidade', preco: 2.50, categoria: 'eletrica' },
    caixa_4x4: { nome: 'Caixa de Luz 4x4', unidade: 'unidade', preco: 4.00, categoria: 'eletrica' },
    tomada_simples: { nome: 'Tomada 2P+T 10A', unidade: 'unidade', preco: 12, categoria: 'eletrica' },
    tomada_dupla: { nome: 'Tomada Dupla 2P+T', unidade: 'unidade', preco: 22, categoria: 'eletrica' },
    interruptor_simples: { nome: 'Interruptor Simples', unidade: 'unidade', preco: 10, categoria: 'eletrica' },
    interruptor_paralelo: { nome: 'Interruptor Paralelo', unidade: 'unidade', preco: 15, categoria: 'eletrica' },
    disjuntor_10a: { nome: 'Disjuntor 10A', unidade: 'unidade', preco: 12, categoria: 'eletrica' },
    disjuntor_20a: { nome: 'Disjuntor 20A', unidade: 'unidade', preco: 14, categoria: 'eletrica' },
    disjuntor_32a: { nome: 'Disjuntor 32A', unidade: 'unidade', preco: 18, categoria: 'eletrica' },
    disjuntor_geral: { nome: 'Disjuntor Geral 50A', unidade: 'unidade', preco: 45, categoria: 'eletrica' },
    quadro_distribuicao: { nome: 'Quadro de Distribuição 12 disjuntores', unidade: 'unidade', preco: 120, categoria: 'eletrica' },
    dr_dispositivo: { nome: 'Dispositivo DR 30mA', unidade: 'unidade', preco: 95, categoria: 'eletrica' },
    lustre_plafon: { nome: 'Plafon LED 18W', unidade: 'unidade', preco: 45, categoria: 'eletrica' },
    spot_embutir: { nome: 'Spot LED Embutir', unidade: 'unidade', preco: 28, categoria: 'eletrica' },

    // ========== INSTALAÇÃO HIDRÁULICA ==========
    tubo_pvc_25mm: { nome: 'Tubo PVC Água Fria 25mm', unidade: 'm', preco: 4.50, categoria: 'hidraulica' },
    tubo_pvc_32mm: { nome: 'Tubo PVC Água Fria 32mm', unidade: 'm', preco: 6.50, categoria: 'hidraulica' },
    tubo_pvc_50mm: { nome: 'Tubo PVC Esgoto 50mm', unidade: 'm', preco: 12, categoria: 'hidraulica' },
    tubo_pvc_100mm: { nome: 'Tubo PVC Esgoto 100mm', unidade: 'm', preco: 28, categoria: 'hidraulica' },
    conexoes_pvc: { nome: 'Kit Conexões PVC (joelhos, tês, caps)', unidade: 'conjunto', preco: 85, categoria: 'hidraulica' },
    registro_gaveta: { nome: 'Registro Gaveta 3/4"', unidade: 'unidade', preco: 35, categoria: 'hidraulica' },
    registro_pressao: { nome: 'Registro de Pressão', unidade: 'unidade', preco: 55, categoria: 'hidraulica' },
    caixa_dagua_500l: { nome: 'Caixa d\'Água 500L', unidade: 'unidade', preco: 350, categoria: 'hidraulica' },
    caixa_dagua_1000l: { nome: 'Caixa d\'Água 1000L', unidade: 'unidade', preco: 550, categoria: 'hidraulica' },
    caixa_sifonada: { nome: 'Caixa Sifonada', unidade: 'unidade', preco: 25, categoria: 'hidraulica' },
    ralo_linear: { nome: 'Ralo Linear Inox', unidade: 'unidade', preco: 85, categoria: 'hidraulica' },
    sifao: { nome: 'Sifão Sanfonado', unidade: 'unidade', preco: 18, categoria: 'hidraulica' },
    vaso_sanitario: { nome: 'Vaso Sanitário com Caixa Acoplada', unidade: 'unidade', preco: 450, categoria: 'hidraulica' },
    lavatorio: { nome: 'Lavatório com Coluna', unidade: 'unidade', preco: 180, categoria: 'hidraulica' },
    torneira_lavatorio: { nome: 'Torneira para Lavatório', unidade: 'unidade', preco: 65, categoria: 'hidraulica' },
    torneira_cozinha: { nome: 'Torneira de Cozinha Mesa', unidade: 'unidade', preco: 85, categoria: 'hidraulica' },
    chuveiro: { nome: 'Chuveiro Elétrico', unidade: 'unidade', preco: 95, categoria: 'hidraulica' },
    ducha_higienica: { nome: 'Ducha Higiênica', unidade: 'unidade', preco: 75, categoria: 'hidraulica' },
    pia_cozinha: { nome: 'Cuba Inox Cozinha', unidade: 'unidade', preco: 180, categoria: 'hidraulica' },
    tanque_lavar: { nome: 'Tanque de Lavar Roupa', unidade: 'unidade', preco: 220, categoria: 'hidraulica' },

    // ========== ESQUADRIAS (PORTAS E JANELAS) ==========
    porta_madeira_interna: { nome: 'Porta Madeira Interna 80cm (kit completo)', unidade: 'unidade', preco: 380, categoria: 'esquadrias' },
    porta_madeira_externa: { nome: 'Porta Madeira Externa 90cm (maciça)', unidade: 'unidade', preco: 850, categoria: 'esquadrias' },
    janela_aluminio_100x120: { nome: 'Janela Alumínio 100x120cm', unidade: 'unidade', preco: 450, categoria: 'esquadrias' },
    janela_aluminio_150x120: { nome: 'Janela Alumínio 150x120cm', unidade: 'unidade', preco: 650, categoria: 'esquadrias' },
    janela_aluminio_200x120: { nome: 'Janela Alumínio 200x120cm', unidade: 'unidade', preco: 850, categoria: 'esquadrias' },
    basculante_aluminio: { nome: 'Basculante Alumínio 60x60cm', unidade: 'unidade', preco: 180, categoria: 'esquadrias' },
    vidro_comum_4mm: { nome: 'Vidro Comum 4mm (instalado)', unidade: 'm²', preco: 95, categoria: 'esquadrias' },

    // ========== PISOS E REVESTIMENTOS ==========
    contrapiso: { nome: 'Contrapiso/Regularização', unidade: 'm²', preco: 35, categoria: 'piso' },
    ceramica_piso: { nome: 'Piso Cerâmico 45x45cm (padrão)', unidade: 'm²', preco: 38, categoria: 'piso' },
    ceramica_parede: { nome: 'Revestimento Cerâmico Parede', unidade: 'm²', preco: 35, categoria: 'piso' },
    argamassa_colante: { nome: 'Argamassa Colante AC-II', unidade: 'saco 20kg', preco: 28, categoria: 'acabamento' },
    rejunte: { nome: 'Rejunte', unidade: 'kg', preco: 8, categoria: 'acabamento' },
    rodape_ceramico: { nome: 'Rodapé Cerâmico', unidade: 'm', preco: 8, categoria: 'piso' },
    soleira: { nome: 'Soleira Granito', unidade: 'm', preco: 95, categoria: 'piso' },

    // ========== REBOCO E PINTURA ==========
    reboco: { nome: 'Argamassa Reboco', unidade: 'saco 20kg', preco: 18, categoria: 'acabamento' },
    gesso_liso: { nome: 'Gesso Liso (teto)', unidade: 'm²', preco: 38, categoria: 'acabamento' },
    massa_corrida: { nome: 'Massa Corrida PVA', unidade: 'lata 18L', preco: 95, categoria: 'acabamento' },
    tinta_acrilica: { nome: 'Tinta Acrílica Premium', unidade: 'lata 18L', preco: 320, categoria: 'acabamento' },
    selador: { nome: 'Selador Acrílico', unidade: 'lata 18L', preco: 180, categoria: 'acabamento' },
    textura: { nome: 'Textura/Grafiato', unidade: 'lata 25kg', preco: 145, categoria: 'acabamento' },

    // ========== MATERIAIS STEEL FRAME ==========
    perfil_aco: { nome: 'Perfil de Aço Galvanizado', unidade: 'm', preco: 28, categoria: 'estrutura' },
    parafuso_auto: { nome: 'Parafuso Auto-Brocante', unidade: 'unidade', preco: 0.35, categoria: 'estrutura' },
    placa_osb: { nome: 'Placa OSB 18mm', unidade: 'm²', preco: 75, categoria: 'fechamento' },
    placa_cimenticia: { nome: 'Placa Cimentícia 10mm', unidade: 'm²', preco: 65, categoria: 'fechamento' },
    la_vidro: { nome: 'Lã de Vidro 50mm', unidade: 'm²', preco: 28, categoria: 'isolamento' },

    // ========== MATERIAIS WOOD FRAME ==========
    madeira_pinus_tratado: { nome: 'Pinus Tratado (estrutura)', unidade: 'm³', preco: 2200, categoria: 'estrutura' },
    madeira_eucalipto: { nome: 'Eucalipto Tratado', unidade: 'm³', preco: 1800, categoria: 'estrutura' },
    madeira_nobre: { nome: 'Madeira Nobre (Ipê, Cumaru)', unidade: 'm³', preco: 8500, categoria: 'estrutura' },

    // ========== MATERIAIS EPS ==========
    painel_eps: { nome: 'Painel EPS 10cm', unidade: 'm²', preco: 85, categoria: 'estrutura' },
    tela_galvanizada: { nome: 'Tela Galvanizada', unidade: 'm²', preco: 18, categoria: 'estrutura' },
    argamassa_projetada: { nome: 'Argamassa Projetada', unidade: 'saco 40kg', preco: 45, categoria: 'estrutura' },

    // ========== MATERIAIS TIJOLO ECOLÓGICO ==========
    tijolo_ecologico: { nome: 'Tijolo Ecológico Solo-Cimento', unidade: 'milheiro', preco: 750, categoria: 'estrutura' },

    // ========== MATERIAIS ALVENARIA ESTRUTURAL ==========
    bloco_estrutural: { nome: 'Bloco Estrutural 14x19x39', unidade: 'milheiro', preco: 1200, categoria: 'estrutura' },
    reboco_pronto: { nome: 'Reboco Pronto (saco 20kg)', unidade: 'saco', preco: 22, categoria: 'acabamento' },

    // ========== MATERIAIS CONTAINER ==========
    container_20pes: { nome: 'Container Marítimo 20 pés (usado)', unidade: 'unidade', preco: 12000, categoria: 'estrutura' },
    la_de_vidro: { nome: 'Lã de Vidro 50mm (isolamento)', unidade: 'm²', preco: 32, categoria: 'isolamento' },
    drywall: { nome: 'Placa Drywall Standard 12,5mm', unidade: 'm²', preco: 28, categoria: 'fechamento' },
    perfil_metalico_drywall: { nome: 'Perfil Metálico p/ Drywall', unidade: 'm', preco: 12, categoria: 'estrutura' },
    telha_sanduiche: { nome: 'Telha Sanduíche 30mm (termo-acústica)', unidade: 'm²', preco: 95, categoria: 'cobertura' },
    estrutura_metalica_leve: { nome: 'Estrutura Metálica Leve (perfis)', unidade: 'kg/m²', preco: 18, categoria: 'estrutura' },
    piso_vinilico: { nome: 'Piso Vinílico Click', unidade: 'm²', preco: 65, categoria: 'piso' },
    rodape_mdf: { nome: 'Rodapé MDF 7cm', unidade: 'm', preco: 12, categoria: 'acabamento' },
    tinta_epoxi: { nome: 'Tinta Epóxi (proteção metálica)', unidade: 'lata 3,6L', preco: 280, categoria: 'acabamento' },

    // ========== BANCADAS E COMPLEMENTOS ==========
    bancada_granito: { nome: 'Bancada Granito Cozinha (por metro linear)', unidade: 'm', preco: 350, categoria: 'acabamento' },
    bancada_banheiro: { nome: 'Bancada Granito Banheiro', unidade: 'unidade', preco: 280, categoria: 'acabamento' }
  },

  // Composição de materiais por tipo de construção (quantidade por m² de área construída)
  // Meta: breakdown totaliza aproximadamente R$ 1.076/m² para alvenaria padrão médio
  composicaoMateriais: {
    alvenaria: {
      nome: 'Alvenaria Convencional',
      descricao: 'Construção tradicional com tijolos e concreto armado',
      materiais: {
        // ========== FUNDAÇÃO E ESTRUTURA (~R$ 380/m²) ==========
        tijolo_ceramico: { qtdPorM2: 0.035, unidadeCalc: 'milheiro' }, // 35 tijolos por m² construído
        cimento: { qtdPorM2: 0.85, unidadeCalc: 'saco' }, // estrutura + reboco + contrapiso
        areia_media: { qtdPorM2: 0.12, unidadeCalc: 'm³' },
        areia_fina: { qtdPorM2: 0.06, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.10, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 6.0, unidadeCalc: 'kg' },
        ferro_10mm: { qtdPorM2: 3.5, unidadeCalc: 'kg' },
        ferro_12mm: { qtdPorM2: 2.0, unidadeCalc: 'kg' },
        arame_recozido: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        concreto_usinado: { qtdPorM2: 0.15, unidadeCalc: 'm³' }, // laje + vigas
        forma_madeira: { qtdPorM2: 0.4, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.25, unidadeCalc: 'm²' }, // fundação + banheiros
        lona_plastica: { qtdPorM2: 0.3, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' }, // área telhado > área construída
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        disjuntor_32a: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        spot_embutir: { qtdPorM2: 0.05, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' }, // ~6 portas/100m²
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' }, // 1 porta/100m²
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' }, // cozinha + banheiros
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== REBOCO E PINTURA (~R$ 86/m²) ==========
        reboco: { qtdPorM2: 0.8, unidadeCalc: 'saco' },
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.055, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.025, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 1.0
    },
    steel_frame: {
      nome: 'Steel Frame',
      descricao: 'Estrutura em aço galvanizado com fechamento em placas',
      materiais: {
        // ========== ESTRUTURA STEEL FRAME (~R$ 420/m²) ==========
        perfil_aco: { qtdPorM2: 10.0, unidadeCalc: 'm' },
        parafuso_auto: { qtdPorM2: 55, unidadeCalc: 'unidade' },
        placa_osb: { qtdPorM2: 1.5, unidadeCalc: 'm²' },
        placa_cimenticia: { qtdPorM2: 2.8, unidadeCalc: 'm²' },
        la_vidro: { qtdPorM2: 1.3, unidadeCalc: 'm²' },
        cimento: { qtdPorM2: 0.25, unidadeCalc: 'saco' }, // fundação radier
        areia_media: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.05, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 2.0, unidadeCalc: 'kg' },
        lona_plastica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.20, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 75/m²) ==========
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.045, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.025, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.85,
      vantagens: ['Obra 30% mais rápida', 'Menos resíduos', 'Alta precisão'],
      desvantagens: ['Mão de obra especializada', 'Maior custo de material']
    },
    wood_frame: {
      nome: 'Wood Frame (Madeira)',
      descricao: 'Estrutura em madeira tratada',
      subtipos: {
        economico: {
          nome: 'Madeira Econômica (Pinus/Eucalipto)',
          fator: 1.0,
          material: 'madeira_pinus_tratado'
        },
        premium: {
          nome: 'Madeira Nobre (Ipê, Cumaru)',
          fator: 2.2,
          material: 'madeira_nobre'
        }
      },
      materiais: {
        // ========== ESTRUTURA WOOD FRAME (~R$ 350/m²) ==========
        madeira_pinus_tratado: { qtdPorM2: 0.10, unidadeCalc: 'm³' },
        placa_osb: { qtdPorM2: 2.5, unidadeCalc: 'm²' },
        la_vidro: { qtdPorM2: 1.3, unidadeCalc: 'm²' },
        cimento: { qtdPorM2: 0.20, unidadeCalc: 'saco' }, // fundação radier
        areia_media: { qtdPorM2: 0.03, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 1.5, unidadeCalc: 'kg' },
        lona_plastica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.18, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 65/m²) ==========
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.040, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.022, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.80,
      vantagens: ['Sustentável', 'Excelente isolamento térmico', 'Obra rápida'],
      desvantagens: ['Requer tratamento da madeira', 'Manutenção periódica']
    },
    eps: {
      nome: 'Painéis EPS (Isopor Estrutural)',
      descricao: 'Painéis de poliestireno com malha de aço e argamassa',
      materiais: {
        // ========== ESTRUTURA EPS (~R$ 320/m²) ==========
        painel_eps: { qtdPorM2: 2.8, unidadeCalc: 'm²' },
        tela_galvanizada: { qtdPorM2: 3.0, unidadeCalc: 'm²' },
        argamassa_projetada: { qtdPorM2: 1.5, unidadeCalc: 'saco' },
        ferro_8mm: { qtdPorM2: 2.0, unidadeCalc: 'kg' },
        cimento: { qtdPorM2: 0.25, unidadeCalc: 'saco' }, // fundação
        areia_fina: { qtdPorM2: 0.03, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        lona_plastica: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.18, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 65/m²) - sem reboco tradicional ==========
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.045, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.025, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.70,
      naoUsa: ['tijolo_ceramico', 'areia_media', 'reboco'],
      vantagens: ['Custo de material menor', 'Obra muito rápida', 'Excelente isolamento'],
      desvantagens: ['Limitações em vãos grandes', 'Menos resistente a impactos', 'Requer cuidado com fixações']
    },
    mista: {
      nome: 'Construção Mista',
      descricao: 'Combinação de alvenaria com outros sistemas',
      materiais: {
        // ========== ESTRUTURA MISTA (~R$ 360/m²) ==========
        tijolo_ceramico: { qtdPorM2: 0.025, unidadeCalc: 'milheiro' },
        cimento: { qtdPorM2: 0.65, unidadeCalc: 'saco' },
        areia_media: { qtdPorM2: 0.08, unidadeCalc: 'm³' },
        areia_fina: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.07, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 4.5, unidadeCalc: 'kg' },
        ferro_10mm: { qtdPorM2: 2.5, unidadeCalc: 'kg' },
        arame_recozido: { qtdPorM2: 0.4, unidadeCalc: 'kg' },
        perfil_aco: { qtdPorM2: 3.0, unidadeCalc: 'm' },
        concreto_usinado: { qtdPorM2: 0.12, unidadeCalc: 'm³' },
        forma_madeira: { qtdPorM2: 0.3, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.22, unidadeCalc: 'm²' },
        lona_plastica: { qtdPorM2: 0.25, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== REBOCO E PINTURA (~R$ 80/m²) ==========
        reboco: { qtdPorM2: 0.6, unidadeCalc: 'saco' },
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.050, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.025, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.90
    },
    pre_fabricada: {
      nome: 'Pré-Fabricada/Modular',
      descricao: 'Módulos industrializados montados no local',
      materiais: {
        // ========== FUNDAÇÃO E MONTAGEM (~R$ 120/m²) ==========
        cimento: { qtdPorM2: 0.15, unidadeCalc: 'saco' },
        areia_media: { qtdPorM2: 0.03, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 1.5, unidadeCalc: 'kg' },
        lona_plastica: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        impermeabilizante: { qtdPorM2: 0.15, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 65/m²) ==========
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.040, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.022, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.50,
      vantagens: ['Obra muito rápida (2-4 semanas)', 'Controle de qualidade fabril'],
      desvantagens: ['Menos personalização', 'Custo maior', 'Transporte dos módulos']
    },

    // ========== TIJOLO ECOLÓGICO (SOLO-CIMENTO) ==========
    // Custo base: ~R$ 1.350/m² (fator 0.72 em relação à alvenaria)
    // Economia: dispensa argamassa vertical, paredes já saem prontas para pintura
    tijolo_ecologico: {
      nome: 'Tijolo Ecológico (Solo-Cimento)',
      descricao: 'Tijolos modulares de solo-cimento que se encaixam, dispensando argamassa nas juntas verticais',
      materiais: {
        // ========== FUNDAÇÃO E ESTRUTURA (~R$ 280/m²) ==========
        // Menos concreto armado, tijolos absorvem mais carga
        tijolo_ecologico: { qtdPorM2: 0.040, unidadeCalc: 'milheiro' }, // 40 tijolos por m²
        cimento: { qtdPorM2: 0.55, unidadeCalc: 'saco' }, // menos argamassa de assentamento
        areia_media: { qtdPorM2: 0.08, unidadeCalc: 'm³' },
        areia_fina: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.08, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 4.0, unidadeCalc: 'kg' }, // menos ferro
        ferro_10mm: { qtdPorM2: 2.5, unidadeCalc: 'kg' },
        arame_recozido: { qtdPorM2: 0.4, unidadeCalc: 'kg' },
        concreto_usinado: { qtdPorM2: 0.12, unidadeCalc: 'm³' },
        impermeabilizante: { qtdPorM2: 0.20, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        disjuntor_32a: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        spot_embutir: { qtdPorM2: 0.05, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 115/m²) - ECONOMIA ==========
        // Paredes de tijolo ecológico podem ficar aparentes (economia no reboco)
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.25, unidadeCalc: 'm²' }, // só áreas molhadas
        argamassa_colante: { qtdPorM2: 0.30, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.4, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 45/m²) - ECONOMIA ==========
        // Dispensa reboco externo, apenas selador e pintura
        gesso_liso: { qtdPorM2: 0.8, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.025, unidadeCalc: 'lata' }, // menos massa
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.030, unidadeCalc: 'lata' } // mais selador para tijolo aparente
      },
      maoDeObraFator: 0.85, // Economia de mão de obra (menos reboco, menos argamassa)
      vantagens: ['25-30% mais barato', 'Ecológico', 'Obra limpa', 'Dispensa reboco externo'],
      desvantagens: ['Mão de obra precisa treinamento', 'Projetos específicos']
    },

    // ========== ALVENARIA ESTRUTURAL ==========
    // Custo base: ~R$ 1.600/m² (fator 0.85 em relação à alvenaria convencional)
    // Economia: dispensa vigas e pilares de concreto armado
    alvenaria_estrutural: {
      nome: 'Alvenaria Estrutural',
      descricao: 'Blocos estruturais que suportam a carga - dispensa pilares e vigas',
      materiais: {
        // ========== FUNDAÇÃO E ESTRUTURA (~R$ 310/m²) ==========
        // Blocos estruturais mais caros, mas sem vigas e pilares
        bloco_estrutural: { qtdPorM2: 0.040, unidadeCalc: 'milheiro' }, // 40 blocos por m²
        cimento: { qtdPorM2: 0.65, unidadeCalc: 'saco' }, // grauteamento + argamassa
        areia_media: { qtdPorM2: 0.10, unidadeCalc: 'm³' },
        areia_fina: { qtdPorM2: 0.05, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.06, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 3.0, unidadeCalc: 'kg' }, // menos ferro (só graute)
        ferro_10mm: { qtdPorM2: 1.5, unidadeCalc: 'kg' },
        arame_recozido: { qtdPorM2: 0.3, unidadeCalc: 'kg' },
        concreto_usinado: { qtdPorM2: 0.10, unidadeCalc: 'm³' }, // só laje
        impermeabilizante: { qtdPorM2: 0.22, unidadeCalc: 'm²' },
        lona_plastica: { qtdPorM2: 0.3, unidadeCalc: 'm²' },

        // ========== COBERTURA (~R$ 145/m²) ==========
        madeira_telhado: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        telha_ceramica: { qtdPorM2: 1.2, unidadeCalc: 'm²' },
        cumeeira: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        rufo_galvanizado: { qtdPorM2: 0.15, unidadeCalc: 'm' },
        calha_pvc: { qtdPorM2: 0.12, unidadeCalc: 'm' },
        condutor_pvc: { qtdPorM2: 0.06, unidadeCalc: 'm' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 95/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 4.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.0, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.35, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.25, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        disjuntor_32a: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },
        spot_embutir: { qtdPorM2: 0.05, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 120/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.8, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.6, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.3, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.04, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 95/m²) ==========
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.025, unidadeCalc: 'unidade' },
        basculante_aluminio: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.12, unidadeCalc: 'm²' },

        // ========== PISOS E REVESTIMENTOS (~R$ 155/m²) ==========
        contrapiso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_piso: { qtdPorM2: 1.0, unidadeCalc: 'm²' },
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.35, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.5, unidadeCalc: 'kg' },
        rodape_ceramico: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        soleira: { qtdPorM2: 0.08, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 80/m²) ==========
        reboco_pronto: { qtdPorM2: 0.25, unidadeCalc: 'saco' },
        gesso_liso: { qtdPorM2: 0.9, unidadeCalc: 'm²' },
        massa_corrida: { qtdPorM2: 0.040, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.035, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.022, unidadeCalc: 'lata' }
      },
      maoDeObraFator: 0.90, // Menos mão de obra (sem armar vigas e pilares)
      vantagens: ['10-15% mais barato', 'Obra mais rápida', 'Menos desperdício'],
      desvantagens: ['Projetos menos flexíveis', 'Dificuldade para reformas', 'Vãos limitados']
    },

    // ========== CASA CONTAINER ==========
    // Custo base: ~R$ 2.500/m² (fator 1.33 em relação à alvenaria)
    // Estrutura já pronta, mas exige adaptações caras
    container: {
      nome: 'Casa Container',
      descricao: 'Construção com containers marítimos adaptados',
      materiais: {
        // ========== CONTAINER E FUNDAÇÃO (~R$ 350/m²) ==========
        container_20pes: { qtdPorM2: 0.07, unidadeCalc: 'unidade' }, // 1 container de 20 pés = ~15m²
        cimento: { qtdPorM2: 0.25, unidadeCalc: 'saco' }, // fundação radier
        areia_media: { qtdPorM2: 0.04, unidadeCalc: 'm³' },
        brita: { qtdPorM2: 0.05, unidadeCalc: 'm³' },
        ferro_8mm: { qtdPorM2: 2.0, unidadeCalc: 'kg' },
        impermeabilizante: { qtdPorM2: 0.30, unidadeCalc: 'm²' },

        // ========== ISOLAMENTO TÉRMICO/ACÚSTICO (~R$ 180/m²) - OBRIGATÓRIO ==========
        la_de_vidro: { qtdPorM2: 1.8, unidadeCalc: 'm²' }, // paredes e teto
        drywall: { qtdPorM2: 2.5, unidadeCalc: 'm²' }, // fechamento interno
        perfil_metalico_drywall: { qtdPorM2: 3.0, unidadeCalc: 'm' },

        // ========== COBERTURA ADICIONAL (~R$ 100/m²) ==========
        // Proteção contra sol direto no container
        telha_sanduiche: { qtdPorM2: 1.1, unidadeCalc: 'm²' },
        estrutura_metalica_leve: { qtdPorM2: 0.8, unidadeCalc: 'kg/m²' },

        // ========== INSTALAÇÃO ELÉTRICA (~R$ 110/m²) ==========
        fio_eletrico_2_5mm: { qtdPorM2: 5.0, unidadeCalc: 'm' },
        fio_eletrico_4mm: { qtdPorM2: 2.5, unidadeCalc: 'm' },
        fio_eletrico_6mm: { qtdPorM2: 1.0, unidadeCalc: 'm' },
        eletroduto_pvc_20mm: { qtdPorM2: 3.0, unidadeCalc: 'm' },
        eletroduto_pvc_25mm: { qtdPorM2: 1.0, unidadeCalc: 'm' },
        caixa_4x2: { qtdPorM2: 0.40, unidadeCalc: 'unidade' },
        caixa_4x4: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        tomada_simples: { qtdPorM2: 0.30, unidadeCalc: 'unidade' },
        tomada_dupla: { qtdPorM2: 0.12, unidadeCalc: 'unidade' },
        interruptor_simples: { qtdPorM2: 0.15, unidadeCalc: 'unidade' },
        interruptor_paralelo: { qtdPorM2: 0.05, unidadeCalc: 'unidade' },
        disjuntor_10a: { qtdPorM2: 0.05, unidadeCalc: 'unidade' },
        disjuntor_20a: { qtdPorM2: 0.07, unidadeCalc: 'unidade' },
        disjuntor_32a: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        quadro_distribuicao: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        dr_dispositivo: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        lustre_plafon: { qtdPorM2: 0.10, unidadeCalc: 'unidade' },
        spot_embutir: { qtdPorM2: 0.08, unidadeCalc: 'unidade' },

        // ========== INSTALAÇÃO HIDRÁULICA (~R$ 130/m²) ==========
        tubo_pvc_25mm: { qtdPorM2: 0.9, unidadeCalc: 'm' },
        tubo_pvc_32mm: { qtdPorM2: 0.5, unidadeCalc: 'm' },
        tubo_pvc_50mm: { qtdPorM2: 0.7, unidadeCalc: 'm' },
        tubo_pvc_100mm: { qtdPorM2: 0.35, unidadeCalc: 'm' },
        conexoes_pvc: { qtdPorM2: 0.05, unidadeCalc: 'conjunto' },
        registro_gaveta: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        registro_pressao: { qtdPorM2: 0.02, unidadeCalc: 'unidade' },
        caixa_dagua_1000l: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        caixa_sifonada: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        sifao: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vaso_sanitario: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_lavatorio: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        torneira_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        chuveiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        pia_cozinha: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },
        tanque_lavar: { qtdPorM2: 0.01, unidadeCalc: 'unidade' },

        // ========== ESQUADRIAS (~R$ 120/m²) ==========
        // Recortes no container são caros
        porta_madeira_interna: { qtdPorM2: 0.06, unidadeCalc: 'unidade' },
        porta_madeira_externa: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },
        janela_aluminio_100x120: { qtdPorM2: 0.04, unidadeCalc: 'unidade' },
        janela_aluminio_150x120: { qtdPorM2: 0.03, unidadeCalc: 'unidade' },
        vidro_comum_4mm: { qtdPorM2: 0.15, unidadeCalc: 'm²' },

        // ========== PISOS E ACABAMENTOS (~R$ 170/m²) ==========
        contrapiso: { qtdPorM2: 0.3, unidadeCalc: 'm²' }, // só áreas molhadas
        piso_vinilico: { qtdPorM2: 0.7, unidadeCalc: 'm²' }, // mais leve para container
        ceramica_piso: { qtdPorM2: 0.3, unidadeCalc: 'm²' }, // só banheiro/cozinha
        ceramica_parede: { qtdPorM2: 0.35, unidadeCalc: 'm²' },
        argamassa_colante: { qtdPorM2: 0.20, unidadeCalc: 'saco' },
        rejunte: { qtdPorM2: 0.4, unidadeCalc: 'kg' },
        rodape_mdf: { qtdPorM2: 0.4, unidadeCalc: 'm' },
        bancada_granito: { qtdPorM2: 0.025, unidadeCalc: 'm' },
        bancada_banheiro: { qtdPorM2: 0.015, unidadeCalc: 'unidade' },

        // ========== ACABAMENTO (~R$ 90/m²) ==========
        massa_corrida: { qtdPorM2: 0.045, unidadeCalc: 'lata' },
        tinta_acrilica: { qtdPorM2: 0.040, unidadeCalc: 'lata' },
        selador: { qtdPorM2: 0.025, unidadeCalc: 'lata' },
        tinta_epoxi: { qtdPorM2: 0.015, unidadeCalc: 'lata' } // exterior do container
      },
      maoDeObraFator: 0.75, // Menos mão de obra convencional, mas especializada
      vantagens: ['Obra rápida', 'Estética industrial', 'Estrutura robusta', 'Sustentável'],
      desvantagens: ['Isolamento térmico obrigatório', 'Largura limitada', 'Adaptações caras']
    }
  },

  // =====================================================
  // TIPOS DE CONSTRUÇÃO - FATORES BASEADOS EM PESQUISA DE MERCADO 2025/2026
  // =====================================================
  // Base: Alvenaria Convencional = R$ 1.880/m² (fator 1.0)
  // Fontes: SINAPI, CBIC, pesquisa de mercado com ChatGPT/Gemini/Perplexity
  //
  // RESUMO DOS FATORES (pesquisa jan/2026):
  // | Método                  | Faixa R$/m²      | Fator |
  // |-------------------------|------------------|-------|
  // | Pré-fab Concreto        | R$ 900-1.500     | 0.64  |
  // | Madeira Simples         | R$ 900-1.500     | 0.64  |
  // | Tijolo Ecológico        | R$ 900-1.800     | 0.72  |
  // | Alvenaria Estrutural    | R$ 1.400-1.800   | 0.85  |
  // | Construção Mista        | R$ 1.500-1.900   | 0.90  |
  // | ALVENARIA (base)        | R$ 1.500-2.200   | 1.00  |
  // | EPS (Isopor)            | R$ 1.600-2.400   | 1.06  |
  // | Container               | R$ 1.800-3.500   | 1.33  |
  // | Steel Frame             | R$ 2.500-3.500   | 1.60  |
  // | Madeira Nobre           | R$ 2.800-4.000   | 1.70  |
  tiposConstrucao: {
    // ----- OPÇÕES MAIS ECONÔMICAS -----
    'pre_fabricada_concreto': {
      nome: 'Pré-Fabricada em Concreto',
      descricao: 'Painéis de concreto armado produzidos em fábrica e montados no local',
      composicao: 'pre_fabricada',
      fator: 0.64, // R$ 900-1.500/m² (média R$ 1.200) - pesquisa de mercado 2025
      tempoObra: 0.30,
      custoM2Referencia: '~R$ 1.200/m² padrão médio',
      vantagens: ['Mais econômica entre as sólidas', 'Obra rápida (3-6 semanas)', 'Controle de qualidade fabril', 'Preço fechado', 'Durabilidade'],
      desvantagens: ['Projetos padronizados', 'Custo de transporte pesado', 'Precisa de guindaste', 'Menos flexibilidade']
    },
    'madeira_simples': {
      nome: 'Casa de Madeira Simples (Pinus/Eucalipto)',
      descricao: 'Casa em madeira tratada (pinus ou eucalipto) - estilo chalé brasileiro, econômica',
      composicao: 'wood_frame',
      subtipo: 'simples',
      fator: 0.64, // R$ 900-1.500/m² (média R$ 1.200) - casas de madeira simples
      tempoObra: 0.25,
      custoM2Referencia: '~R$ 1.200/m² padrão médio',
      vantagens: ['Econômica', 'Montagem muito rápida (2-4 semanas)', 'Estética rústica', 'Ecológica', 'Excelente conforto térmico'],
      desvantagens: ['Manutenção periódica', 'Menor valor de revenda', 'Tratamento obrigatório contra cupins', 'Cuidado com umidade']
    },
    'tijolo_ecologico': {
      nome: 'Tijolo Ecológico (Solo-Cimento)',
      descricao: 'Tijolos modulares de solo-cimento sem queima, encaixe perfeito que dispensa argamassa nas juntas',
      composicao: 'tijolo_ecologico',
      fator: 0.72, // R$ 900-1.800/m² (média R$ 1.350) - economia de materiais e mão de obra
      tempoObra: 0.60,
      custoM2Referencia: '~R$ 1.350/m² padrão médio',
      vantagens: ['25-30% mais barato que alvenaria', 'Ecológico (sem queima)', 'Obra limpa', 'Dispensa reboco em algumas áreas', 'Isolamento térmico'],
      desvantagens: ['Mão de obra precisa treinamento', 'Projetos específicos', 'Menos conhecido no mercado']
    },
    'alvenaria_estrutural': {
      nome: 'Alvenaria Estrutural',
      descricao: 'Blocos estruturais que dispensam pilares e vigas - a própria parede é a estrutura',
      composicao: 'alvenaria_estrutural',
      fator: 0.85, // R$ 1.400-1.800/m² (média R$ 1.600) - economia de concreto armado
      tempoObra: 0.80,
      custoM2Referencia: '~R$ 1.600/m² padrão médio',
      vantagens: ['10-15% mais barata que convencional', 'Obra mais rápida', 'Menos desperdício', 'Estrutura já pronta'],
      desvantagens: ['Projetos menos flexíveis', 'Dificuldade para reformas futuras', 'Vãos limitados']
    },
    'mista': {
      nome: 'Construção Mista',
      descricao: 'Combinação de alvenaria estrutural com drywall interno ou outros sistemas',
      composicao: 'mista',
      fator: 0.90,
      tempoObra: 0.75,
      custoM2Referencia: '~R$ 1.690/m² padrão médio',
      vantagens: ['Flexibilidade de projeto', 'Otimiza custos por ambiente', 'Combina vantagens dos sistemas'],
      desvantagens: ['Requer planejamento cuidadoso', 'Diferentes especialistas']
    },

    // ----- CUSTO MÉDIO (PRÓXIMO À ALVENARIA) -----
    'alvenaria': {
      nome: 'Alvenaria Convencional',
      descricao: 'Construção tradicional com tijolos/blocos e estrutura de concreto armado (vigas e pilares)',
      composicao: 'alvenaria',
      fator: 1.0, // R$ 1.500-2.200/m² (média R$ 1.880) - REFERÊNCIA BASE
      tempoObra: 1.0,
      custoM2Referencia: '~R$ 1.880/m² padrão médio',
      vantagens: ['Durabilidade comprovada', 'Flexibilidade de projeto', 'Mão de obra disponível', 'Maior valor de revenda', 'Facilidade de reforma'],
      desvantagens: ['Maior tempo de obra (4-6 meses)', 'Mais resíduos', 'Maior consumo de água']
    },
    'eps': {
      nome: 'Painéis EPS (Isopor Estrutural)',
      descricao: 'Painéis de poliestireno expandido com malha de aço e argamassa projetada',
      composicao: 'eps',
      fator: 1.06, // R$ 1.600-2.400/m² (média R$ 2.000) - custo similar ou levemente maior que alvenaria
      tempoObra: 0.40,
      custoM2Referencia: '~R$ 2.000/m² padrão médio',
      vantagens: ['Obra 60% mais rápida', 'Excelente isolamento térmico/acústico', 'Estrutura muito leve', 'Menos sujeira na obra'],
      desvantagens: ['Vãos limitados (até 4m)', 'Menos resistente a impactos', 'Fixações especiais', 'Mão de obra especializada']
    },

    // ----- OPÇÕES MAIS CARAS (SISTEMAS CONSTRUTIVOS MODERNOS) -----
    'container': {
      nome: 'Casa Container',
      descricao: 'Construção utilizando containers marítimos adaptados e conectados',
      composicao: 'container',
      fator: 1.33, // R$ 1.800-3.500/m² (média R$ 2.500) - varia muito conforme acabamento
      tempoObra: 0.35,
      custoM2Referencia: '~R$ 2.500/m² padrão médio',
      vantagens: ['Obra rápida', 'Estética industrial moderna', 'Estrutura robusta', 'Sustentável (reuso)'],
      desvantagens: ['Isolamento térmico obrigatório', 'Largura limitada (2,4m interno)', 'Adaptações caras', 'Pode aquecer muito']
    },
    'steel_frame': {
      nome: 'Steel Frame',
      descricao: 'Estrutura em perfis de aço galvanizado com fechamento em placas cimentícias e drywall',
      composicao: 'steel_frame',
      fator: 1.60, // R$ 2.500-3.500/m² (média R$ 3.000) - ~60% mais caro que alvenaria no Brasil
      tempoObra: 0.50,
      custoM2Referencia: '~R$ 3.000/m² padrão médio',
      vantagens: ['Obra 50% mais rápida', 'Menos resíduos', 'Alta precisão', 'Paredes finas = mais área útil', 'Durabilidade do aço'],
      desvantagens: ['60% mais caro que alvenaria', 'Mão de obra especializada escassa', 'Materiais importados', 'Menor inércia térmica']
    },
    'madeira_nobre': {
      nome: 'Casa de Madeira Nobre',
      descricao: 'Estrutura em madeira nobre (ipê, cumaru, cedro) com acabamento superior - alta durabilidade',
      composicao: 'wood_frame',
      subtipo: 'premium',
      fator: 1.70, // R$ 2.800-4.000/m² - Madeira nobre é cara
      tempoObra: 0.55,
      custoM2Referencia: '~R$ 3.200/m² padrão médio',
      vantagens: ['Alta durabilidade (50+ anos)', 'Estética premium', 'Valorização do imóvel', 'Não precisa tratamento contra cupins'],
      desvantagens: ['Custo muito elevado', 'Mão de obra especializada', 'Disponibilidade limitada de madeira certificada']
    }
  },

  // Custo base do terreno por m² (valores médios de mercado)
  // O valor varia muito por localização, estes são valores médios para áreas urbanas/periurbanas
  custoTerrenoM2: {
    base: 150, // Valor médio nacional (áreas residenciais comuns)
    // Fatores de ajuste por tipo de localização
    fatores: {
      'rural': 0.3,        // Área rural - R$ 45/m²
      'periferia': 0.6,    // Periferia - R$ 90/m²
      'urbano': 1.0,       // Urbano normal - R$ 150/m²
      'nobre': 2.5,        // Bairro nobre - R$ 375/m²
      'praia': 3.0,        // Litoral/praia - R$ 450/m²
      'centro': 4.0        // Centro de grandes cidades - R$ 600/m²
    }
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
      'bloco_rebocado': {
        nome: 'Muro de Bloco Rebocado e Pintado',
        valorMetroLinear: 420,
        alturaBase: 2
      },
      'bloco_simples': {
        nome: 'Muro de Bloco Simples (sem acabamento)',
        valorMetroLinear: 280,
        alturaBase: 2
      },
      'bloco_texturizado': {
        nome: 'Muro com Textura/Grafiato',
        valorMetroLinear: 500,
        alturaBase: 2
      },
      'tijolo_aparente': {
        nome: 'Muro de Tijolo Aparente',
        valorMetroLinear: 480,
        alturaBase: 2
      },
      'pre_moldado': {
        nome: 'Muro Pré-Moldado',
        valorMetroLinear: 220,
        alturaBase: 2
      },
      'gradil_metalico': {
        nome: 'Muro Baixo + Gradil Metálico',
        valorMetroLinear: 520,
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
        valorM2: 380
      },
      'ferro_trabalhado': {
        nome: 'Portão de Ferro Trabalhado',
        valorM2: 580
      },
      'aluminio_simples': {
        nome: 'Portão de Alumínio Simples',
        valorM2: 700
      },
      'aluminio_premium': {
        nome: 'Portão de Alumínio Premium',
        valorM2: 1000
      },
      'basculante_manual': {
        nome: 'Portão Basculante Manual',
        valorUnidade: 3200
      },
      'basculante_automatico': {
        nome: 'Portão Basculante Automático',
        valorUnidade: 5500
      },
      'deslizante_manual': {
        nome: 'Portão Deslizante Manual',
        valorUnidade: 3800
      },
      'deslizante_automatico': {
        nome: 'Portão Deslizante Automático',
        valorUnidade: 6500
      },
      'pivotante': {
        nome: 'Portão Pivotante',
        valorUnidade: 7500
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
