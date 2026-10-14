CREATE TABLE grupo (
    id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL,
    nome   VARCHAR(50) NOT NULL
);

CREATE UNIQUE INDEX ux_grupo_codigo ON grupo (LOWER(codigo));
CREATE UNIQUE INDEX ux_grupo_nome ON grupo (LOWER(nome));
