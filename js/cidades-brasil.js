/**
 * Base de dados de cidades brasileiras para identificação de localização
 * Usado pela calculadora de custo de construção
 *
 * Tipos de localização:
 * - capital: Capital do estado
 * - metropole: Região metropolitana de capital
 * - litoral: Cidade litorânea (praia)
 * - interior: Cidade do interior
 * - rural: Zona rural/agrícola
 * - turistico: Destino turístico (serra, termas, etc)
 */

const CidadesBrasil = {
  versao: '1.0',
  atualizacao: '2026-01',

  // Regiões do Brasil
  regioes: {
    'norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
    'nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'centro-oeste': ['DF', 'GO', 'MS', 'MT'],
    'sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'sul': ['PR', 'RS', 'SC']
  },

  // Estados com informações básicas
  estados: {
    'AC': { nome: 'Acre', capital: 'Rio Branco', regiao: 'norte' },
    'AL': { nome: 'Alagoas', capital: 'Maceió', regiao: 'nordeste' },
    'AM': { nome: 'Amazonas', capital: 'Manaus', regiao: 'norte' },
    'AP': { nome: 'Amapá', capital: 'Macapá', regiao: 'norte' },
    'BA': { nome: 'Bahia', capital: 'Salvador', regiao: 'nordeste' },
    'CE': { nome: 'Ceará', capital: 'Fortaleza', regiao: 'nordeste' },
    'DF': { nome: 'Distrito Federal', capital: 'Brasília', regiao: 'centro-oeste' },
    'ES': { nome: 'Espírito Santo', capital: 'Vitória', regiao: 'sudeste' },
    'GO': { nome: 'Goiás', capital: 'Goiânia', regiao: 'centro-oeste' },
    'MA': { nome: 'Maranhão', capital: 'São Luís', regiao: 'nordeste' },
    'MG': { nome: 'Minas Gerais', capital: 'Belo Horizonte', regiao: 'sudeste' },
    'MS': { nome: 'Mato Grosso do Sul', capital: 'Campo Grande', regiao: 'centro-oeste' },
    'MT': { nome: 'Mato Grosso', capital: 'Cuiabá', regiao: 'norte' },
    'PA': { nome: 'Pará', capital: 'Belém', regiao: 'norte' },
    'PB': { nome: 'Paraíba', capital: 'João Pessoa', regiao: 'nordeste' },
    'PE': { nome: 'Pernambuco', capital: 'Recife', regiao: 'nordeste' },
    'PI': { nome: 'Piauí', capital: 'Teresina', regiao: 'nordeste' },
    'PR': { nome: 'Paraná', capital: 'Curitiba', regiao: 'sul' },
    'RJ': { nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', regiao: 'sudeste' },
    'RN': { nome: 'Rio Grande do Norte', capital: 'Natal', regiao: 'nordeste' },
    'RO': { nome: 'Rondônia', capital: 'Porto Velho', regiao: 'norte' },
    'RR': { nome: 'Roraima', capital: 'Boa Vista', regiao: 'norte' },
    'RS': { nome: 'Rio Grande do Sul', capital: 'Porto Alegre', regiao: 'sul' },
    'SC': { nome: 'Santa Catarina', capital: 'Florianópolis', regiao: 'sul' },
    'SE': { nome: 'Sergipe', capital: 'Aracaju', regiao: 'nordeste' },
    'SP': { nome: 'São Paulo', capital: 'São Paulo', regiao: 'sudeste' },
    'TO': { nome: 'Tocantins', capital: 'Palmas', regiao: 'norte' }
  },

  // Cidades por estado com tipo de localização
  cidades: {
    // ========== ACRE ==========
    'AC': {
      'rio branco': { tipo: 'capital', populacao: 'grande' },
      'cruzeiro do sul': { tipo: 'interior', populacao: 'media' },
      'sena madureira': { tipo: 'interior', populacao: 'pequena' },
      'tarauaca': { tipo: 'interior', populacao: 'pequena' },
      'feijo': { tipo: 'interior', populacao: 'pequena' }
    },

    // ========== ALAGOAS ==========
    'AL': {
      'maceio': { tipo: 'capital', populacao: 'grande', litoral: true },
      'arapiraca': { tipo: 'interior', populacao: 'grande' },
      'palmeira dos indios': { tipo: 'interior', populacao: 'media' },
      'rio largo': { tipo: 'metropole', populacao: 'media' },
      'penedo': { tipo: 'interior', populacao: 'media' },
      'uniao dos palmares': { tipo: 'interior', populacao: 'media' },
      'sao miguel dos campos': { tipo: 'interior', populacao: 'media' },
      'maragogi': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'barra de sao miguel': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'marechal deodoro': { tipo: 'litoral', populacao: 'media' }
    },

    // ========== AMAZONAS ==========
    'AM': {
      'manaus': { tipo: 'capital', populacao: 'grande' },
      'parintins': { tipo: 'interior', populacao: 'media', turistico: true },
      'itacoatiara': { tipo: 'interior', populacao: 'media' },
      'manacapuru': { tipo: 'interior', populacao: 'media' },
      'coari': { tipo: 'interior', populacao: 'media' },
      'tefe': { tipo: 'interior', populacao: 'media' },
      'tabatinga': { tipo: 'interior', populacao: 'media' },
      'presidente figueiredo': { tipo: 'interior', populacao: 'pequena', turistico: true }
    },

    // ========== AMAPÁ ==========
    'AP': {
      'macapa': { tipo: 'capital', populacao: 'grande' },
      'santana': { tipo: 'metropole', populacao: 'media' },
      'laranjal do jari': { tipo: 'interior', populacao: 'media' },
      'oiapoque': { tipo: 'interior', populacao: 'pequena' }
    },

    // ========== BAHIA ==========
    'BA': {
      'salvador': { tipo: 'capital', populacao: 'grande', litoral: true },
      'feira de santana': { tipo: 'interior', populacao: 'grande' },
      'vitoria da conquista': { tipo: 'interior', populacao: 'grande' },
      'camacari': { tipo: 'metropole', populacao: 'grande' },
      'itabuna': { tipo: 'interior', populacao: 'grande' },
      'juazeiro': { tipo: 'interior', populacao: 'grande' },
      'lauro de freitas': { tipo: 'metropole', populacao: 'grande' },
      'ilheus': { tipo: 'litoral', populacao: 'media', turistico: true },
      'jequie': { tipo: 'interior', populacao: 'media' },
      'teixeira de freitas': { tipo: 'interior', populacao: 'media' },
      'barreiras': { tipo: 'interior', populacao: 'media' },
      'alagoinhas': { tipo: 'interior', populacao: 'media' },
      'porto seguro': { tipo: 'litoral', populacao: 'media', turistico: true },
      'simoes filho': { tipo: 'metropole', populacao: 'media' },
      'paulo afonso': { tipo: 'interior', populacao: 'media' },
      'eunapolis': { tipo: 'interior', populacao: 'media' },
      'santo antonio de jesus': { tipo: 'interior', populacao: 'media' },
      'valenca': { tipo: 'litoral', populacao: 'media' },
      'candeias': { tipo: 'metropole', populacao: 'media' },
      'guanambi': { tipo: 'interior', populacao: 'media' },
      'itapetinga': { tipo: 'interior', populacao: 'media' },
      'morro de sao paulo': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'trancoso': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'arraial d\'ajuda': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'praia do forte': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'costa do sauipe': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'chapada diamantina': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'lencois': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== CEARÁ ==========
    'CE': {
      'fortaleza': { tipo: 'capital', populacao: 'grande', litoral: true },
      'caucaia': { tipo: 'metropole', populacao: 'grande' },
      'juazeiro do norte': { tipo: 'interior', populacao: 'grande' },
      'maracanau': { tipo: 'metropole', populacao: 'grande' },
      'sobral': { tipo: 'interior', populacao: 'grande' },
      'crato': { tipo: 'interior', populacao: 'media' },
      'itapipoca': { tipo: 'interior', populacao: 'media' },
      'maranguape': { tipo: 'metropole', populacao: 'media' },
      'iguatu': { tipo: 'interior', populacao: 'media' },
      'quixada': { tipo: 'interior', populacao: 'media' },
      'pacatuba': { tipo: 'metropole', populacao: 'media' },
      'aquiraz': { tipo: 'litoral', populacao: 'media', turistico: true },
      'caninde': { tipo: 'interior', populacao: 'media' },
      'russas': { tipo: 'interior', populacao: 'media' },
      'tiangua': { tipo: 'interior', populacao: 'media' },
      'eusebio': { tipo: 'metropole', populacao: 'media' },
      'jericoacoara': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'canoa quebrada': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'cumbuco': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'morro branco': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'praia de iracema': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'beach park': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== DISTRITO FEDERAL ==========
    'DF': {
      'brasilia': { tipo: 'capital', populacao: 'grande' },
      'taguatinga': { tipo: 'metropole', populacao: 'grande' },
      'ceilandia': { tipo: 'metropole', populacao: 'grande' },
      'samambaia': { tipo: 'metropole', populacao: 'grande' },
      'planaltina': { tipo: 'metropole', populacao: 'grande' },
      'aguas claras': { tipo: 'metropole', populacao: 'grande' },
      'gama': { tipo: 'metropole', populacao: 'grande' },
      'guara': { tipo: 'metropole', populacao: 'grande' },
      'sobradinho': { tipo: 'metropole', populacao: 'grande' },
      'recanto das emas': { tipo: 'metropole', populacao: 'grande' },
      'santa maria': { tipo: 'metropole', populacao: 'grande' },
      'lago sul': { tipo: 'metropole', populacao: 'media', nobre: true },
      'lago norte': { tipo: 'metropole', populacao: 'media', nobre: true },
      'asa sul': { tipo: 'capital', populacao: 'grande', nobre: true },
      'asa norte': { tipo: 'capital', populacao: 'grande', nobre: true }
    },

    // ========== ESPÍRITO SANTO ==========
    'ES': {
      'vitoria': { tipo: 'capital', populacao: 'grande', litoral: true },
      'vila velha': { tipo: 'metropole', populacao: 'grande', litoral: true },
      'serra': { tipo: 'metropole', populacao: 'grande' },
      'cariacica': { tipo: 'metropole', populacao: 'grande' },
      'cachoeiro de itapemirim': { tipo: 'interior', populacao: 'grande' },
      'linhares': { tipo: 'interior', populacao: 'media' },
      'colatina': { tipo: 'interior', populacao: 'media' },
      'sao mateus': { tipo: 'interior', populacao: 'media' },
      'guarapari': { tipo: 'litoral', populacao: 'media', turistico: true },
      'aracruz': { tipo: 'interior', populacao: 'media' },
      'viana': { tipo: 'metropole', populacao: 'media' },
      'nova venecia': { tipo: 'interior', populacao: 'media' },
      'domingos martins': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'santa teresa': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'iriri': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'anchieta': { tipo: 'litoral', populacao: 'pequena' },
      'piuma': { tipo: 'litoral', populacao: 'pequena' }
    },

    // ========== GOIÁS ==========
    'GO': {
      'goiania': { tipo: 'capital', populacao: 'grande' },
      'aparecida de goiania': { tipo: 'metropole', populacao: 'grande' },
      'anapolis': { tipo: 'interior', populacao: 'grande' },
      'rio verde': { tipo: 'interior', populacao: 'grande' },
      'luziania': { tipo: 'interior', populacao: 'grande' },
      'aguas lindas de goias': { tipo: 'metropole', populacao: 'grande' },
      'trindade': { tipo: 'metropole', populacao: 'media' },
      'formosa': { tipo: 'interior', populacao: 'media' },
      'novo gama': { tipo: 'metropole', populacao: 'media' },
      'senador canedo': { tipo: 'metropole', populacao: 'media' },
      'itumbiara': { tipo: 'interior', populacao: 'media' },
      'catalao': { tipo: 'interior', populacao: 'media' },
      'jatai': { tipo: 'interior', populacao: 'media' },
      'caldas novas': { tipo: 'turistico', populacao: 'media', turistico: true },
      'rio quente': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'pirenopolis': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'cidade de goias': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'alto paraiso': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'chapada dos veadeiros': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== MARANHÃO ==========
    'MA': {
      'sao luis': { tipo: 'capital', populacao: 'grande', litoral: true },
      'imperatriz': { tipo: 'interior', populacao: 'grande' },
      'sao jose de ribamar': { tipo: 'metropole', populacao: 'grande' },
      'timon': { tipo: 'interior', populacao: 'grande' },
      'caxias': { tipo: 'interior', populacao: 'media' },
      'codó': { tipo: 'interior', populacao: 'media' },
      'paço do lumiar': { tipo: 'metropole', populacao: 'media' },
      'acailandia': { tipo: 'interior', populacao: 'media' },
      'bacabal': { tipo: 'interior', populacao: 'media' },
      'balsas': { tipo: 'interior', populacao: 'media' },
      'santa ines': { tipo: 'interior', populacao: 'media' },
      'barreirinhas': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'lencois maranhenses': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'alcantara': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== MINAS GERAIS ==========
    'MG': {
      'belo horizonte': { tipo: 'capital', populacao: 'grande' },
      'uberlandia': { tipo: 'interior', populacao: 'grande' },
      'contagem': { tipo: 'metropole', populacao: 'grande' },
      'juiz de fora': { tipo: 'interior', populacao: 'grande' },
      'betim': { tipo: 'metropole', populacao: 'grande' },
      'montes claros': { tipo: 'interior', populacao: 'grande' },
      'ribeirao das neves': { tipo: 'metropole', populacao: 'grande' },
      'uberaba': { tipo: 'interior', populacao: 'grande' },
      'governador valadares': { tipo: 'interior', populacao: 'grande' },
      'ipatinga': { tipo: 'interior', populacao: 'grande' },
      'sete lagoas': { tipo: 'interior', populacao: 'grande' },
      'divinopolis': { tipo: 'interior', populacao: 'grande' },
      'santa luzia': { tipo: 'metropole', populacao: 'grande' },
      'ibirite': { tipo: 'metropole', populacao: 'media' },
      'pocos de caldas': { tipo: 'turistico', populacao: 'media', turistico: true },
      'patos de minas': { tipo: 'interior', populacao: 'media' },
      'pouso alegre': { tipo: 'interior', populacao: 'media' },
      'teofilo otoni': { tipo: 'interior', populacao: 'media' },
      'barbacena': { tipo: 'interior', populacao: 'media' },
      'sabara': { tipo: 'metropole', populacao: 'media' },
      'varginha': { tipo: 'interior', populacao: 'media' },
      'conselheiro lafaiete': { tipo: 'interior', populacao: 'media' },
      'araguari': { tipo: 'interior', populacao: 'media' },
      'passos': { tipo: 'interior', populacao: 'media' },
      'coronel fabriciano': { tipo: 'interior', populacao: 'media' },
      'muriae': { tipo: 'interior', populacao: 'media' },
      'uba': { tipo: 'interior', populacao: 'media' },
      'lavras': { tipo: 'interior', populacao: 'media' },
      'itabira': { tipo: 'interior', populacao: 'media' },
      'nova lima': { tipo: 'metropole', populacao: 'media', nobre: true },
      'ouro preto': { tipo: 'turistico', populacao: 'media', turistico: true },
      'tiradentes': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'mariana': { tipo: 'turistico', populacao: 'media', turistico: true },
      'diamantina': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'sao joao del rei': { tipo: 'turistico', populacao: 'media', turistico: true },
      'capitolio': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'monte verde': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'serra do cipo': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'inhotim': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'brumadinho': { tipo: 'interior', populacao: 'pequena' }
    },

    // ========== MATO GROSSO DO SUL ==========
    'MS': {
      'campo grande': { tipo: 'capital', populacao: 'grande' },
      'dourados': { tipo: 'interior', populacao: 'grande' },
      'tres lagoas': { tipo: 'interior', populacao: 'media' },
      'corumba': { tipo: 'interior', populacao: 'media', turistico: true },
      'ponta pora': { tipo: 'interior', populacao: 'media' },
      'naviraí': { tipo: 'interior', populacao: 'media' },
      'nova andradina': { tipo: 'interior', populacao: 'media' },
      'aquidauana': { tipo: 'interior', populacao: 'media' },
      'sidrolandia': { tipo: 'interior', populacao: 'media' },
      'paranaiba': { tipo: 'interior', populacao: 'media' },
      'bonito': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'jardim': { tipo: 'interior', populacao: 'pequena' },
      'miranda': { tipo: 'interior', populacao: 'pequena', turistico: true },
      'pantanal': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== MATO GROSSO ==========
    'MT': {
      'cuiaba': { tipo: 'capital', populacao: 'grande' },
      'varzea grande': { tipo: 'metropole', populacao: 'grande' },
      'rondonopolis': { tipo: 'interior', populacao: 'grande' },
      'sinop': { tipo: 'interior', populacao: 'grande' },
      'tangara da serra': { tipo: 'interior', populacao: 'media' },
      'caceres': { tipo: 'interior', populacao: 'media' },
      'sorriso': { tipo: 'interior', populacao: 'media' },
      'lucas do rio verde': { tipo: 'interior', populacao: 'media' },
      'primavera do leste': { tipo: 'interior', populacao: 'media' },
      'barra do garcas': { tipo: 'interior', populacao: 'media' },
      'alta floresta': { tipo: 'interior', populacao: 'media' },
      'chapada dos guimaraes': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'nobres': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'bom jardim': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== PARÁ ==========
    'PA': {
      'belem': { tipo: 'capital', populacao: 'grande', litoral: true },
      'ananindeua': { tipo: 'metropole', populacao: 'grande' },
      'santarem': { tipo: 'interior', populacao: 'grande' },
      'maraba': { tipo: 'interior', populacao: 'grande' },
      'parauapebas': { tipo: 'interior', populacao: 'grande' },
      'castanhal': { tipo: 'interior', populacao: 'grande' },
      'abaetetuba': { tipo: 'interior', populacao: 'media' },
      'cameta': { tipo: 'interior', populacao: 'media' },
      'marituba': { tipo: 'metropole', populacao: 'media' },
      'braganca': { tipo: 'interior', populacao: 'media' },
      'tucurui': { tipo: 'interior', populacao: 'media' },
      'redencao': { tipo: 'interior', populacao: 'media' },
      'barcarena': { tipo: 'interior', populacao: 'media' },
      'alter do chao': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'salinas': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'salinopolis': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'ilha de marajo': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'soure': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== PARAÍBA ==========
    'PB': {
      'joao pessoa': { tipo: 'capital', populacao: 'grande', litoral: true },
      'campina grande': { tipo: 'interior', populacao: 'grande' },
      'santa rita': { tipo: 'metropole', populacao: 'media' },
      'patos': { tipo: 'interior', populacao: 'media' },
      'bayeux': { tipo: 'metropole', populacao: 'media' },
      'sousa': { tipo: 'interior', populacao: 'media' },
      'cajazeiras': { tipo: 'interior', populacao: 'media' },
      'cabedelo': { tipo: 'litoral', populacao: 'media', turistico: true },
      'guarabira': { tipo: 'interior', populacao: 'media' },
      'conde': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'tambaba': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== PERNAMBUCO ==========
    'PE': {
      'recife': { tipo: 'capital', populacao: 'grande', litoral: true },
      'jaboatao dos guararapes': { tipo: 'metropole', populacao: 'grande', litoral: true },
      'olinda': { tipo: 'metropole', populacao: 'grande', litoral: true, turistico: true },
      'caruaru': { tipo: 'interior', populacao: 'grande' },
      'paulista': { tipo: 'metropole', populacao: 'grande' },
      'petrolina': { tipo: 'interior', populacao: 'grande' },
      'cabo de santo agostinho': { tipo: 'litoral', populacao: 'grande' },
      'camaragibe': { tipo: 'metropole', populacao: 'media' },
      'garanhuns': { tipo: 'interior', populacao: 'media' },
      'vitoria de santo antao': { tipo: 'interior', populacao: 'media' },
      'igarassu': { tipo: 'metropole', populacao: 'media' },
      'sao lourenco da mata': { tipo: 'metropole', populacao: 'media' },
      'abreu e lima': { tipo: 'metropole', populacao: 'media' },
      'ipojuca': { tipo: 'litoral', populacao: 'media' },
      'porto de galinhas': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'fernando de noronha': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'gravata': { tipo: 'interior', populacao: 'media' },
      'carpina': { tipo: 'interior', populacao: 'media' },
      'serra talhada': { tipo: 'interior', populacao: 'media' },
      'maragogi': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'boa viagem': { tipo: 'litoral', populacao: 'grande', nobre: true }
    },

    // ========== PIAUÍ ==========
    'PI': {
      'teresina': { tipo: 'capital', populacao: 'grande' },
      'parnaiba': { tipo: 'litoral', populacao: 'media' },
      'picos': { tipo: 'interior', populacao: 'media' },
      'piripiri': { tipo: 'interior', populacao: 'media' },
      'floriano': { tipo: 'interior', populacao: 'media' },
      'campo maior': { tipo: 'interior', populacao: 'media' },
      'barra grande': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'luis correia': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'delta do parnaiba': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'sete cidades': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== PARANÁ ==========
    'PR': {
      'curitiba': { tipo: 'capital', populacao: 'grande' },
      'londrina': { tipo: 'interior', populacao: 'grande' },
      'maringa': { tipo: 'interior', populacao: 'grande' },
      'ponta grossa': { tipo: 'interior', populacao: 'grande' },
      'cascavel': { tipo: 'interior', populacao: 'grande' },
      'sao jose dos pinhais': { tipo: 'metropole', populacao: 'grande' },
      'foz do iguacu': { tipo: 'interior', populacao: 'grande', turistico: true },
      'colombo': { tipo: 'metropole', populacao: 'grande' },
      'guarapuava': { tipo: 'interior', populacao: 'media' },
      'paranagua': { tipo: 'litoral', populacao: 'media' },
      'araucaria': { tipo: 'metropole', populacao: 'media' },
      'toledo': { tipo: 'interior', populacao: 'media' },
      'apucarana': { tipo: 'interior', populacao: 'media' },
      'pinhais': { tipo: 'metropole', populacao: 'media' },
      'campo largo': { tipo: 'metropole', populacao: 'media' },
      'arapongas': { tipo: 'interior', populacao: 'media' },
      'almirante tamandare': { tipo: 'metropole', populacao: 'media' },
      'umuarama': { tipo: 'interior', populacao: 'media' },
      'fazenda rio grande': { tipo: 'metropole', populacao: 'media' },
      'piraquara': { tipo: 'metropole', populacao: 'media' },
      'cambe': { tipo: 'interior', populacao: 'media' },
      'sarandi': { tipo: 'interior', populacao: 'media' },
      'campo mourao': { tipo: 'interior', populacao: 'media' },
      'matinhos': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'guaratuba': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'pontal do parana': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'ilha do mel': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'morretes': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'lapa': { tipo: 'interior', populacao: 'pequena', turistico: true },
      'vila velha': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== RIO DE JANEIRO ==========
    'RJ': {
      'rio de janeiro': { tipo: 'capital', populacao: 'grande', litoral: true },
      'sao goncalo': { tipo: 'metropole', populacao: 'grande' },
      'duque de caxias': { tipo: 'metropole', populacao: 'grande' },
      'nova iguacu': { tipo: 'metropole', populacao: 'grande' },
      'niteroi': { tipo: 'metropole', populacao: 'grande', litoral: true },
      'belford roxo': { tipo: 'metropole', populacao: 'grande' },
      'campos dos goytacazes': { tipo: 'interior', populacao: 'grande' },
      'sao joao de meriti': { tipo: 'metropole', populacao: 'grande' },
      'petropolis': { tipo: 'turistico', populacao: 'grande', turistico: true },
      'volta redonda': { tipo: 'interior', populacao: 'grande' },
      'macae': { tipo: 'litoral', populacao: 'grande' },
      'mage': { tipo: 'metropole', populacao: 'grande' },
      'itaborai': { tipo: 'metropole', populacao: 'grande' },
      'mesquita': { tipo: 'metropole', populacao: 'media' },
      'nova friburgo': { tipo: 'turistico', populacao: 'media', turistico: true },
      'barra mansa': { tipo: 'interior', populacao: 'media' },
      'angra dos reis': { tipo: 'litoral', populacao: 'media', turistico: true },
      'cabo frio': { tipo: 'litoral', populacao: 'media', turistico: true },
      'teresopolis': { tipo: 'turistico', populacao: 'media', turistico: true },
      'resende': { tipo: 'interior', populacao: 'media' },
      'nilópolis': { tipo: 'metropole', populacao: 'media' },
      'queimados': { tipo: 'metropole', populacao: 'media' },
      'araruama': { tipo: 'litoral', populacao: 'media', turistico: true },
      'itaguai': { tipo: 'metropole', populacao: 'media' },
      'marica': { tipo: 'litoral', populacao: 'media' },
      'rio das ostras': { tipo: 'litoral', populacao: 'media' },
      'barra do pirai': { tipo: 'interior', populacao: 'media' },
      'saquarema': { tipo: 'litoral', populacao: 'media', turistico: true },
      'buzios': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'paraty': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'ilha grande': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'arraial do cabo': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'penedo': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'visconde de maua': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'itaipava': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'barra da tijuca': { tipo: 'litoral', populacao: 'grande', nobre: true },
      'leblon': { tipo: 'litoral', populacao: 'grande', nobre: true },
      'ipanema': { tipo: 'litoral', populacao: 'grande', nobre: true },
      'copacabana': { tipo: 'litoral', populacao: 'grande', turistico: true },
      'zona sul': { tipo: 'litoral', populacao: 'grande', nobre: true }
    },

    // ========== RIO GRANDE DO NORTE ==========
    'RN': {
      'natal': { tipo: 'capital', populacao: 'grande', litoral: true },
      'mossoro': { tipo: 'interior', populacao: 'grande' },
      'parnamirim': { tipo: 'metropole', populacao: 'grande' },
      'sao goncalo do amarante': { tipo: 'metropole', populacao: 'media' },
      'macaiba': { tipo: 'metropole', populacao: 'media' },
      'ceara-mirim': { tipo: 'interior', populacao: 'media' },
      'caico': { tipo: 'interior', populacao: 'media' },
      'acu': { tipo: 'interior', populacao: 'media' },
      'currais novos': { tipo: 'interior', populacao: 'media' },
      'pipa': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'tibau do sul': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'ponta negra': { tipo: 'litoral', populacao: 'media', turistico: true },
      'genipabu': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'sao miguel do gostoso': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'galinhos': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'touros': { tipo: 'litoral', populacao: 'pequena' }
    },

    // ========== RONDÔNIA ==========
    'RO': {
      'porto velho': { tipo: 'capital', populacao: 'grande' },
      'ji-parana': { tipo: 'interior', populacao: 'media' },
      'ariquemes': { tipo: 'interior', populacao: 'media' },
      'vilhena': { tipo: 'interior', populacao: 'media' },
      'cacoal': { tipo: 'interior', populacao: 'media' },
      'rolim de moura': { tipo: 'interior', populacao: 'media' },
      'jaru': { tipo: 'interior', populacao: 'media' },
      'guajara-mirim': { tipo: 'interior', populacao: 'pequena' }
    },

    // ========== RORAIMA ==========
    'RR': {
      'boa vista': { tipo: 'capital', populacao: 'grande' },
      'rorainopolis': { tipo: 'interior', populacao: 'pequena' },
      'caracarai': { tipo: 'interior', populacao: 'pequena' },
      'alto alegre': { tipo: 'interior', populacao: 'pequena' },
      'mucajai': { tipo: 'interior', populacao: 'pequena' }
    },

    // ========== RIO GRANDE DO SUL ==========
    'RS': {
      'porto alegre': { tipo: 'capital', populacao: 'grande' },
      'caxias do sul': { tipo: 'interior', populacao: 'grande' },
      'pelotas': { tipo: 'interior', populacao: 'grande' },
      'canoas': { tipo: 'metropole', populacao: 'grande' },
      'santa maria': { tipo: 'interior', populacao: 'grande' },
      'gravataí': { tipo: 'metropole', populacao: 'grande' },
      'viamao': { tipo: 'metropole', populacao: 'grande' },
      'novo hamburgo': { tipo: 'metropole', populacao: 'grande' },
      'sao leopoldo': { tipo: 'metropole', populacao: 'grande' },
      'rio grande': { tipo: 'litoral', populacao: 'grande' },
      'alvorada': { tipo: 'metropole', populacao: 'grande' },
      'passo fundo': { tipo: 'interior', populacao: 'grande' },
      'sapucaia do sul': { tipo: 'metropole', populacao: 'media' },
      'uruguaiana': { tipo: 'interior', populacao: 'media' },
      'santa cruz do sul': { tipo: 'interior', populacao: 'media' },
      'cachoeirinha': { tipo: 'metropole', populacao: 'media' },
      'bage': { tipo: 'interior', populacao: 'media' },
      'bento goncalves': { tipo: 'turistico', populacao: 'media', turistico: true },
      'erechim': { tipo: 'interior', populacao: 'media' },
      'guaiba': { tipo: 'metropole', populacao: 'media' },
      'cachoeira do sul': { tipo: 'interior', populacao: 'media' },
      'santana do livramento': { tipo: 'interior', populacao: 'media' },
      'esteio': { tipo: 'metropole', populacao: 'media' },
      'ijui': { tipo: 'interior', populacao: 'media' },
      'sapiranga': { tipo: 'metropole', populacao: 'media' },
      'lajeado': { tipo: 'interior', populacao: 'media' },
      'alegrete': { tipo: 'interior', populacao: 'media' },
      'torres': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'tramandai': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'capao da canoa': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'xangri-la': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'osorio': { tipo: 'litoral', populacao: 'pequena' },
      'imbe': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'cidreira': { tipo: 'litoral', populacao: 'pequena' },
      'arroio do sal': { tipo: 'litoral', populacao: 'pequena' },
      'gramado': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'canela': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'sao jose dos ausentes': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'cambara do sul': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'garibaldi': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'carlos barbosa': { tipo: 'interior', populacao: 'pequena' },
      'farroupilha': { tipo: 'interior', populacao: 'media' },
      'campo bonito': { tipo: 'interior', populacao: 'pequena' },
      'passo de torres': { tipo: 'litoral', populacao: 'pequena' },
      'morro reuter': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'nova petropolis': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    },

    // ========== SANTA CATARINA ==========
    'SC': {
      'joinville': { tipo: 'interior', populacao: 'grande' },
      'florianopolis': { tipo: 'capital', populacao: 'grande', litoral: true },
      'blumenau': { tipo: 'interior', populacao: 'grande' },
      'sao jose': { tipo: 'metropole', populacao: 'grande' },
      'chapeco': { tipo: 'interior', populacao: 'grande' },
      'criciuma': { tipo: 'interior', populacao: 'grande' },
      'itajai': { tipo: 'litoral', populacao: 'grande' },
      'jaragua do sul': { tipo: 'interior', populacao: 'grande' },
      'lages': { tipo: 'interior', populacao: 'media' },
      'palhoca': { tipo: 'metropole', populacao: 'media' },
      'balneario camboriu': { tipo: 'litoral', populacao: 'media', turistico: true, nobre: true },
      'brusque': { tipo: 'interior', populacao: 'media' },
      'tubarao': { tipo: 'interior', populacao: 'media' },
      'sao bento do sul': { tipo: 'interior', populacao: 'media' },
      'cacador': { tipo: 'interior', populacao: 'media' },
      'camboriu': { tipo: 'litoral', populacao: 'media' },
      'navegantes': { tipo: 'litoral', populacao: 'media' },
      'concordia': { tipo: 'interior', populacao: 'media' },
      'rio do sul': { tipo: 'interior', populacao: 'media' },
      'ararangua': { tipo: 'litoral', populacao: 'media' },
      'biguacu': { tipo: 'metropole', populacao: 'media' },
      'gaspar': { tipo: 'interior', populacao: 'media' },
      'itapema': { tipo: 'litoral', populacao: 'media', turistico: true },
      'bombinhas': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'porto belo': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'penha': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'picarras': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'garopaba': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'imbituba': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'laguna': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'joacaba': { tipo: 'interior', populacao: 'media' },
      'canoinhas': { tipo: 'interior', populacao: 'media' },
      'mafra': { tipo: 'interior', populacao: 'media' },
      'indaial': { tipo: 'interior', populacao: 'media' },
      'pomerode': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'urubici': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'sao joaquim': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'bom jardim da serra': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'praia do rosa': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'santo amaro da imperatriz': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'jurere': { tipo: 'litoral', populacao: 'pequena', nobre: true },
      'jurere internacional': { tipo: 'litoral', populacao: 'pequena', nobre: true },
      'canasvieiras': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'ingleses': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'lagoa da conceicao': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== SERGIPE ==========
    'SE': {
      'aracaju': { tipo: 'capital', populacao: 'grande', litoral: true },
      'nossa senhora do socorro': { tipo: 'metropole', populacao: 'grande' },
      'lagarto': { tipo: 'interior', populacao: 'media' },
      'itabaiana': { tipo: 'interior', populacao: 'media' },
      'sao cristovao': { tipo: 'metropole', populacao: 'media', turistico: true },
      'estancia': { tipo: 'interior', populacao: 'media' },
      'tobias barreto': { tipo: 'interior', populacao: 'media' },
      'barra dos coqueiros': { tipo: 'litoral', populacao: 'pequena' },
      'atalaia': { tipo: 'litoral', populacao: 'pequena', turistico: true }
    },

    // ========== SÃO PAULO ==========
    'SP': {
      'sao paulo': { tipo: 'capital', populacao: 'grande' },
      'guarulhos': { tipo: 'metropole', populacao: 'grande' },
      'campinas': { tipo: 'interior', populacao: 'grande' },
      'sao bernardo do campo': { tipo: 'metropole', populacao: 'grande' },
      'santo andre': { tipo: 'metropole', populacao: 'grande' },
      'osasco': { tipo: 'metropole', populacao: 'grande' },
      'ribeirao preto': { tipo: 'interior', populacao: 'grande' },
      'sorocaba': { tipo: 'interior', populacao: 'grande' },
      'sao jose dos campos': { tipo: 'interior', populacao: 'grande' },
      'santos': { tipo: 'litoral', populacao: 'grande', turistico: true },
      'maua': { tipo: 'metropole', populacao: 'grande' },
      'mogi das cruzes': { tipo: 'metropole', populacao: 'grande' },
      'diadema': { tipo: 'metropole', populacao: 'grande' },
      'jundiai': { tipo: 'interior', populacao: 'grande' },
      'piracicaba': { tipo: 'interior', populacao: 'grande' },
      'carapicuiba': { tipo: 'metropole', populacao: 'grande' },
      'bauru': { tipo: 'interior', populacao: 'grande' },
      'itaquaquecetuba': { tipo: 'metropole', populacao: 'grande' },
      'sao jose do rio preto': { tipo: 'interior', populacao: 'grande' },
      'franca': { tipo: 'interior', populacao: 'grande' },
      'guaruja': { tipo: 'litoral', populacao: 'grande', turistico: true },
      'taubate': { tipo: 'interior', populacao: 'grande' },
      'praia grande': { tipo: 'litoral', populacao: 'grande', turistico: true },
      'limeira': { tipo: 'interior', populacao: 'grande' },
      'suzano': { tipo: 'metropole', populacao: 'grande' },
      'taboao da serra': { tipo: 'metropole', populacao: 'grande' },
      'sumare': { tipo: 'interior', populacao: 'grande' },
      'barueri': { tipo: 'metropole', populacao: 'grande' },
      'embu das artes': { tipo: 'metropole', populacao: 'grande' },
      'sao vicente': { tipo: 'litoral', populacao: 'grande' },
      'indaiatuba': { tipo: 'interior', populacao: 'grande' },
      'marilia': { tipo: 'interior', populacao: 'grande' },
      'presidente prudente': { tipo: 'interior', populacao: 'grande' },
      'cotia': { tipo: 'metropole', populacao: 'grande' },
      'americana': { tipo: 'interior', populacao: 'grande' },
      'aracatuba': { tipo: 'interior', populacao: 'media' },
      'itu': { tipo: 'interior', populacao: 'media' },
      'jacarei': { tipo: 'interior', populacao: 'grande' },
      'hortolandia': { tipo: 'interior', populacao: 'grande' },
      'sao caetano do sul': { tipo: 'metropole', populacao: 'media', nobre: true },
      'araraquara': { tipo: 'interior', populacao: 'grande' },
      'santa barbara d\'oeste': { tipo: 'interior', populacao: 'media' },
      'ferraz de vasconcelos': { tipo: 'metropole', populacao: 'grande' },
      'rio claro': { tipo: 'interior', populacao: 'media' },
      'itapevi': { tipo: 'metropole', populacao: 'grande' },
      'francisco morato': { tipo: 'metropole', populacao: 'media' },
      'braganca paulista': { tipo: 'interior', populacao: 'media' },
      'pindamonhangaba': { tipo: 'interior', populacao: 'media' },
      'franco da rocha': { tipo: 'metropole', populacao: 'media' },
      'itapecerica da serra': { tipo: 'metropole', populacao: 'media' },
      'mogi guacu': { tipo: 'interior', populacao: 'media' },
      'tatui': { tipo: 'interior', populacao: 'media' },
      'atibaia': { tipo: 'interior', populacao: 'media', turistico: true },
      'sertaozinho': { tipo: 'interior', populacao: 'media' },
      'jaboticabal': { tipo: 'interior', populacao: 'media' },
      'varzea paulista': { tipo: 'interior', populacao: 'media' },
      'catanduva': { tipo: 'interior', populacao: 'media' },
      'botucatu': { tipo: 'interior', populacao: 'media' },
      'jau': { tipo: 'interior', populacao: 'media' },
      'assis': { tipo: 'interior', populacao: 'media' },
      'ourinhos': { tipo: 'interior', populacao: 'media' },
      'lencois paulista': { tipo: 'interior', populacao: 'media' },
      'avare': { tipo: 'interior', populacao: 'media' },
      'registro': { tipo: 'interior', populacao: 'media' },
      'caraguatatuba': { tipo: 'litoral', populacao: 'media', turistico: true },
      'ubatuba': { tipo: 'litoral', populacao: 'media', turistico: true },
      'sao sebastiao': { tipo: 'litoral', populacao: 'media', turistico: true },
      'ilhabela': { tipo: 'litoral', populacao: 'pequena', turistico: true },
      'bertioga': { tipo: 'litoral', populacao: 'media', turistico: true },
      'mongagua': { tipo: 'litoral', populacao: 'media' },
      'itanhaem': { tipo: 'litoral', populacao: 'media' },
      'peruibe': { tipo: 'litoral', populacao: 'media' },
      'campos do jordao': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'serra negra': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'aguas de lindoia': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'lindoia': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'socorro': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'brotas': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'holambra': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'sao roque': { tipo: 'interior', populacao: 'media', turistico: true },
      'embu': { tipo: 'metropole', populacao: 'grande', turistico: true },
      'alphaville': { tipo: 'metropole', populacao: 'grande', nobre: true },
      'granja viana': { tipo: 'metropole', populacao: 'media', nobre: true },
      'jardins': { tipo: 'capital', populacao: 'grande', nobre: true },
      'moema': { tipo: 'capital', populacao: 'grande', nobre: true },
      'pinheiros': { tipo: 'capital', populacao: 'grande', nobre: true },
      'vila mariana': { tipo: 'capital', populacao: 'grande', nobre: true },
      'morumbi': { tipo: 'capital', populacao: 'grande', nobre: true },
      'riviera de sao lourenco': { tipo: 'litoral', populacao: 'pequena', nobre: true, turistico: true }
    },

    // ========== TOCANTINS ==========
    'TO': {
      'palmas': { tipo: 'capital', populacao: 'grande' },
      'araguaina': { tipo: 'interior', populacao: 'media' },
      'gurupi': { tipo: 'interior', populacao: 'media' },
      'porto nacional': { tipo: 'interior', populacao: 'media' },
      'paraiso do tocantins': { tipo: 'interior', populacao: 'media' },
      'colinas do tocantins': { tipo: 'interior', populacao: 'pequena' },
      'guarai': { tipo: 'interior', populacao: 'pequena' },
      'jalapao': { tipo: 'turistico', populacao: 'pequena', turistico: true },
      'taquarucu': { tipo: 'turistico', populacao: 'pequena', turistico: true }
    }
  },

  // Bairros nobres conhecidos (para detecção de localização premium)
  bairrosNobres: [
    // São Paulo
    'jardins', 'jardim paulista', 'jardim america', 'jardim europa', 'cerqueira cesar',
    'itaim bibi', 'vila olimpia', 'moema', 'pinheiros', 'vila madalena', 'perdizes',
    'higienopolis', 'pacaembu', 'morumbi', 'vila nova conceicao', 'brooklin',
    'campo belo', 'alphaville', 'granja viana', 'tambore',
    // Rio de Janeiro
    'leblon', 'ipanema', 'copacabana', 'gavea', 'jardim botanico', 'lagoa',
    'barra da tijuca', 'recreio', 'sao conrado', 'urca', 'flamengo', 'botafogo',
    // Outras capitais
    'lago sul', 'lago norte', 'asa sul', 'asa norte', // Brasília
    'lourdes', 'savassi', 'funcionarios', 'sion', 'mangabeiras', // BH
    'moinhos de vento', 'bela vista', 'petropolis', 'auxiliadora', // POA
    'batel', 'agua verde', 'bigorrilho', 'ecoville', // Curitiba
    'boa viagem', 'casa forte', 'espinheiro', // Recife
    'pituba', 'horto florestal', 'ondina', // Salvador
    'jurere', 'jurere internacional', // Floripa
    'centro historico', 'meireles', 'aldeota' // Fortaleza
  ],

  // Função auxiliar para encontrar cidade e estado
  encontrarCidade: function(texto) {
    const textoNorm = texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Primeiro, verificar bairros nobres
    for (const bairro of this.bairrosNobres) {
      if (textoNorm.includes(bairro)) {
        return { bairro: bairro, nobre: true };
      }
    }

    // Depois, procurar cidades
    for (const [uf, cidades] of Object.entries(this.cidades)) {
      for (const [cidade, info] of Object.entries(cidades)) {
        if (textoNorm.includes(cidade)) {
          return {
            cidade: cidade,
            uf: uf,
            estado: this.estados[uf].nome,
            ...info
          };
        }
      }
    }

    return null;
  },

  // Função para determinar tipo de localização para cálculo de terreno
  getTipoLocalizacao: function(cidade, info) {
    if (info.nobre) return 'nobre';
    if (info.litoral && info.turistico) return 'praia';
    if (info.tipo === 'capital' || info.tipo === 'metropole') return 'urbano';
    if (info.turistico) return 'turistico';
    if (info.tipo === 'interior') return 'periferia';
    if (info.tipo === 'rural') return 'rural';
    return 'urbano'; // default
  }
};

// Exportar para uso no navegador
if (typeof window !== 'undefined') {
  window.CidadesBrasil = CidadesBrasil;
}
