-- E-Bus / qbus.ifce - esquema do banco (PostgreSQL 17)
-- Para recriar do zero, descomente as duas linhas abaixo:
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

CREATE TABLE cidade (
  id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  uf    CHAR(2) NOT NULL,
  UNIQUE (nome, uf)
);

CREATE TABLE escola (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       VARCHAR(150) NOT NULL,
  endereco   VARCHAR(255),
  cidade_id  INTEGER NOT NULL REFERENCES cidade(id),
  UNIQUE (nome, cidade_id)
);

-- Todos os perfis (aluno, motorista, admin) fazem login por aqui
CREATE TABLE usuario (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  telefone    VARCHAR(20),
  perfil      VARCHAR(10) NOT NULL CHECK (perfil IN ('aluno', 'motorista', 'admin')),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE aluno (
  usuario_id  INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  matricula   VARCHAR(30) NOT NULL UNIQUE,
  escola_id   INTEGER NOT NULL REFERENCES escola(id),
  cidade_id   INTEGER NOT NULL REFERENCES cidade(id),
  destino     VARCHAR(150)
);

CREATE TABLE motorista (
  usuario_id     INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  identificacao  VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE onibus (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero        VARCHAR(20) NOT NULL UNIQUE,
  placa         VARCHAR(10) NOT NULL UNIQUE,
  capacidade    INTEGER NOT NULL CHECK (capacidade > 0),
  status        VARCHAR(15) NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo', 'em_viagem', 'manutencao', 'inativo')),
  motorista_id  INTEGER REFERENCES motorista(usuario_id) ON DELETE SET NULL
);

CREATE TABLE rota (
  id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome                  VARCHAR(100) NOT NULL,
  cidade_id             INTEGER NOT NULL REFERENCES cidade(id),
  origem                VARCHAR(150) NOT NULL,
  destino               VARCHAR(150) NOT NULL,
  distancia_km          NUMERIC(6,1),
  tempo_estimado_min    INTEGER CHECK (tempo_estimado_min > 0)
);

-- Uma rota passa por varias escolas, em ordem. Uma escola pode estar em varias rotas.
CREATE TABLE rota_escola (
  rota_id    INTEGER NOT NULL REFERENCES rota(id) ON DELETE CASCADE,
  escola_id  INTEGER NOT NULL REFERENCES escola(id),
  ordem      INTEGER NOT NULL CHECK (ordem > 0),
  PRIMARY KEY (rota_id, escola_id),
  UNIQUE (rota_id, ordem)
);

-- Cada onibus atende uma ou mais rotas
CREATE TABLE onibus_rota (
  onibus_id  INTEGER NOT NULL REFERENCES onibus(id) ON DELETE CASCADE,
  rota_id    INTEGER NOT NULL REFERENCES rota(id) ON DELETE CASCADE,
  PRIMARY KEY (onibus_id, rota_id)
);

-- dias_semana: 0 = domingo ... 6 = sabado
CREATE TABLE horario (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  onibus_id         INTEGER NOT NULL,
  rota_id           INTEGER NOT NULL,
  saida             TIME NOT NULL,
  chegada_prevista  TIME NOT NULL,
  dias_semana       SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  FOREIGN KEY (onibus_id, rota_id) REFERENCES onibus_rota(onibus_id, rota_id) ON DELETE CASCADE
);

-- Registro de inicio e termino do trajeto pelo motorista
CREATE TABLE viagem (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  horario_id     INTEGER NOT NULL REFERENCES horario(id),
  motorista_id   INTEGER NOT NULL REFERENCES motorista(usuario_id),
  iniciada_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizada_em  TIMESTAMPTZ
);

CREATE TABLE ocorrencia (
  id                      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo                    VARCHAR(30) NOT NULL
                          CHECK (tipo IN ('problema_mecanico', 'falta_combustivel', 'atolamento',
                                          'bloqueio_estrada', 'atraso', 'cancelamento')),
  descricao               TEXT,
  local                   VARCHAR(255),
  onibus_id               INTEGER NOT NULL REFERENCES onibus(id),
  rota_id                 INTEGER NOT NULL REFERENCES rota(id),
  motorista_id            INTEGER NOT NULL REFERENCES motorista(usuario_id),
  status                  VARCHAR(15) NOT NULL DEFAULT 'em_andamento'
                          CHECK (status IN ('em_andamento', 'resolvida', 'cancelada')),
  previsao_normalizacao   TIMESTAMPTZ,
  criada_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvida_em            TIMESTAMPTZ
);

-- Indices para as consultas mais comuns
CREATE INDEX idx_escola_cidade      ON escola(cidade_id);
CREATE INDEX idx_rota_cidade        ON rota(cidade_id);
CREATE INDEX idx_rota_escola_escola ON rota_escola(escola_id);
CREATE INDEX idx_horario_rota       ON horario(rota_id);
CREATE INDEX idx_ocorrencia_ativa   ON ocorrencia(rota_id) WHERE status = 'em_andamento';
