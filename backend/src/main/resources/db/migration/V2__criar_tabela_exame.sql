CREATE TABLE exame (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo              VARCHAR(10)  NOT NULL,
    nome                VARCHAR(100) NOT NULL,
    tempo_processamento INTERVAL     NOT NULL
        CHECK (tempo_processamento >= INTERVAL '1 hour' AND tempo_processamento <= INTERVAL '8760 hours'),
    grupo_id            BIGINT       NOT NULL REFERENCES grupo (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_exame_codigo ON exame (LOWER(codigo));
CREATE UNIQUE INDEX ux_exame_nome ON exame (LOWER(nome));
CREATE INDEX ix_exame_grupo_id ON exame (grupo_id);
