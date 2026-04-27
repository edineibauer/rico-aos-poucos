-- Schema do tracker de FIIs (rico aos poucos)
-- ----------------------------------------------------------------------------
-- Espelha o estado dos pipelines (mineracao, otimizacao, analise, publicacao)
-- num banco consultavel. A fonte da verdade continua sendo os JSONs no disco;
-- o MySQL eh apenas leitura rapida + fila de reanalise.
--
-- Recriar do zero:
--   mysql -u root < scripts/tracker/schema.sql
-- ----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS rico_aos_poucos
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rico_aos_poucos;

-- ----------------------------------------------------------------------------
-- fii_tracker — 1 linha por ticker do universo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fii_tracker (
  ticker                  VARCHAR(10)  NOT NULL PRIMARY KEY,
  cnpj                    VARCHAR(20)  NULL,
  nome_pregao             VARCHAR(160) NULL,
  segmento                VARCHAR(60)  NULL,
  liquidez_diaria         DECIMAL(15,2) NULL,
  -- Mineracao (data/fiis-raw/{T}/meta.json)
  total_docs_raw          INT          NOT NULL DEFAULT 0,
  data_ultimo_doc         DATE         NULL,
  id_ultimo_doc           VARCHAR(20)  NULL,
  tipo_ultimo_doc         VARCHAR(120) NULL,
  data_ultima_mineracao   DATETIME     NULL,
  -- Otimizacao (data/fiis-optimized/{T}/)
  total_docs_otimizados   INT          NOT NULL DEFAULT 0,
  data_ultima_otimizacao  DATETIME     NULL,
  -- Analise (data/fiis/{T}.json)
  tem_analise             TINYINT(1)   NOT NULL DEFAULT 0,
  data_ultima_analise     DATETIME     NULL,
  versao_analise          VARCHAR(40)  NULL,
  -- Publicacao (fiis/{T}/index.html)
  tem_pagina              TINYINT(1)   NOT NULL DEFAULT 0,
  data_ultima_pagina      DATETIME     NULL,
  -- Estado derivado
  status_geral            ENUM('nao_minerado','minerado','otimizado','analisado','desatualizado','em_processo')
                          NOT NULL DEFAULT 'nao_minerado',
  precisa_reanalise       TINYINT(1)   NOT NULL DEFAULT 0,
  obs                     TEXT         NULL,
  atualizado_em           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status      (status_geral),
  INDEX idx_reanalise   (precisa_reanalise),
  INDEX idx_ultimo_doc  (data_ultimo_doc DESC),
  INDEX idx_ultima_anl  (data_ultima_analise)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- fii_doc — 1 linha por documento minerado/otimizado
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fii_doc (
  ticker            VARCHAR(10)  NOT NULL,
  doc_id            VARCHAR(20)  NOT NULL,
  tipo              VARCHAR(160) NULL,
  categoria         VARCHAR(160) NULL,
  data_entrega      DATE         NULL,
  data_referencia   DATE         NULL,
  bytes_original    BIGINT       NULL,
  bytes_otimizado   BIGINT       NULL,
  paginas           INT          NULL,
  formato           VARCHAR(8)   NULL,
  baixado_em        DATETIME     NULL,
  otimizado_em      DATETIME     NULL,
  PRIMARY KEY (ticker, doc_id),
  INDEX idx_ticker_data (ticker, data_entrega DESC),
  INDEX idx_data        (data_entrega DESC),
  CONSTRAINT fk_fii_doc_ticker FOREIGN KEY (ticker)
    REFERENCES fii_tracker(ticker) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- fii_evento — auditoria de mineracao/otimizacao/analise/publicacao/erro
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fii_evento (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticker       VARCHAR(10) NOT NULL,
  tipo         ENUM('mineracao','otimizacao','analise','publicacao','erro') NOT NULL,
  ocorreu_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  docs_novos   INT NOT NULL DEFAULT 0,
  ids_novos    JSON NULL,
  duracao_s    DECIMAL(8,2) NULL,
  detalhe      TEXT NULL,
  INDEX idx_ticker_data (ticker, ocorreu_em DESC),
  INDEX idx_tipo        (tipo, ocorreu_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- fii_fila — fila de reanalise (consumida por loop_gerar.sh)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fii_fila (
  ticker          VARCHAR(10) NOT NULL PRIMARY KEY,
  prioridade      INT NOT NULL DEFAULT 0,
  motivo          VARCHAR(80) NOT NULL,
  enfileirado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  iniciado_em     DATETIME NULL,
  concluido_em    DATETIME NULL,
  tentativas      INT NOT NULL DEFAULT 0,
  ultimo_erro     TEXT NULL,
  INDEX idx_prio  (prioridade DESC, enfileirado_em ASC),
  INDEX idx_aberto (concluido_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Views de conveniencia
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_fundos_pendentes AS
  SELECT ticker, total_docs_raw, data_ultimo_doc, data_ultima_analise,
         status_geral, precisa_reanalise,
         DATEDIFF(CURRENT_DATE, COALESCE(DATE(data_ultima_analise), '2000-01-01')) AS dias_desde_analise
  FROM fii_tracker
  WHERE precisa_reanalise = 1 OR tem_analise = 0
  ORDER BY status_geral, data_ultimo_doc DESC;

CREATE OR REPLACE VIEW v_resumo_estagios AS
  SELECT status_geral, COUNT(*) AS qtd
  FROM fii_tracker
  GROUP BY status_geral
  ORDER BY FIELD(status_geral, 'nao_minerado','minerado','otimizado','analisado','desatualizado','em_processo');
