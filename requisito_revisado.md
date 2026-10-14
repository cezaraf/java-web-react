<persona>
Você é um Engenheiro de Software Full-Stack Sênior com especialidade em Java 25, Spring Boot 4 (Spring MVC, Spring Data JPA, Bean Validation, Flyway), PostgreSQL, React 19 com TypeScript e Vite, e acessibilidade web (WCAG 2.2 AA). Segue estritamente todos os requisitos definidos e faz as entregas de acordo com o proposto.
</persona>

<task>
  Cadastro de Grupos de Exames e de Exames (CRUD completo, backend + frontend)
</task>

<goal>
  O usuário consegue cadastrar, consultar (com busca, paginação e ordenação), editar e excluir Grupos de Exames e Exames, em uma interface web responsiva, acessível e com tema claro/escuro, com garantia de que código e nome nunca se repetem e de que nenhum grupo em uso é excluído.
</goal>

<requirements>
  Negócio:
  - Grupo de Exames possui:
    - `codigo`: informado pelo usuário, texto, obrigatório, máximo 10 caracteres, único.
    - `nome`: informado pelo usuário, texto, obrigatório, máximo 50 caracteres, único.
  - Exame possui:
    - `codigo`: informado pelo usuário, texto, obrigatório, máximo 10 caracteres, único.
    - `nome`: informado pelo usuário, texto, obrigatório, máximo 100 caracteres, único (unicidade global, não por grupo).
    - `tempoProcessamento`: informado pelo usuário, duração (`java.time.Duration`) em horas inteiras, obrigatória, mínimo 1 hora, máximo 8760 horas (1 ano). Trafega na API como string ISO-8601 (ex.: `"PT48H"`); na UI é digitada como número inteiro de horas.
    - `grupo`: referência obrigatória a um Grupo de Exames existente.
  - Normalização antes de validar e persistir: `codigo` e `nome` sofrem `trim()`; `codigo` é convertido para MAIÚSCULAS (`toUpperCase(Locale.ROOT)`); `nome` mantém a caixa digitada.
  - Unicidade case-insensitive: `HEM01` e `hem01` conflitam; `Hemograma` e `HEMOGRAMA` conflitam. Vale na criação e na edição (na edição, ignora o próprio registro).
  - Código é editável após a criação, desde que continue único.
  - Exclusão de grupo com exames vinculados é bloqueada (HTTP 409); exclusão de exame é livre.
  - Listagens paginadas (padrão 20, máximo 100 por página), com busca textual `q` (contém, case-insensitive, em `codigo` OU `nome`) e ordenação; listagem de exames também filtra por `grupoId`.

  Arquitetura:
  - Backend em `backend/`, pacote raiz `br.com.neovita.exames`, organizado por feature:
    - `br.com.neovita.exames.grupo`: `Grupo` (entidade), `GrupoRepository`, `GrupoService`, `GrupoController`, `dto/GrupoRequest`, `dto/GrupoResponse`.
    - `br.com.neovita.exames.exame`: `Exame` (entidade), `ExameRepository`, `ExameService`, `ExameController`, `dto/ExameRequest`, `dto/ExameResponse`, `dto/GrupoResumoResponse`.
    - `br.com.neovita.exames.shared`: `ApiExceptionHandler` (`@RestControllerAdvice`), exceções de domínio (`RecursoNaoEncontradoException`, `ConflitoException`) e configuração de paginação (`WebConfig`).
  - Responsabilidades backend: a normalização (`strip()` em `codigo` e `nome`; `toUpperCase(Locale.ROOT)` em `codigo`; `null` permanece `null`) acontece no construtor compacto dos `record`s `GrupoRequest`/`ExameRequest`, para que o `@Valid` valide os valores já normalizados (texto só com espaços vira `""` e é barrado por `@NotBlank`); Controller só recebe, valida (Bean Validation) e delega; Service é dono das regras (unicidade, existência do grupo, bloqueio de exclusão) e das transações (`@Transactional`); Repository só acessa dados. DTOs são `record`s; entidades JPA nunca saem do Service para o Controller.
  - `ApiExceptionHandler` também traduz: `HttpMessageNotReadableException` causada por valor inválido em um campo (ex.: `tempoProcessamento: "48"`) → 400 com `errors[{ field, message }]` apontando o campo; JSON malformado → 400 sem `errors`; `PropertyReferenceException` (sort inválido) → 400; `DataIntegrityViolationException` de índice único → 409 com `field`.
  - Paginação: `size` > 100 e campo de `sort` fora da lista permitida são validados explicitamente e retornam 400. O clamp silencioso de `spring.data.web.pageable.max-page-size` NÃO satisfaz este requisito.
  - Flyway é o dono do schema: migrações em `backend/src/main/resources/db/migration` (`V1__criar_tabela_grupo.sql`, `V2__criar_tabela_exame.sql`); `spring.jpa.hibernate.ddl-auto=validate`; `spring.jpa.open-in-view=false`.
  - Dependências backend a adicionar no `pom.xml` (versões gerenciadas pelo Spring Boot 4.1.1): `spring-boot-starter-flyway`, `org.flywaydb:flyway-database-postgresql`, `spring-boot-starter-validation`; testes: `spring-boot-testcontainers` e o módulo PostgreSQL do Testcontainers (Testcontainers 2.x: `org.testcontainers:testcontainers-postgresql` e `org.testcontainers:testcontainers-junit-jupiter`).
  - Schema PostgreSQL:
    - `grupo`: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `codigo VARCHAR(10) NOT NULL`, `nome VARCHAR(50) NOT NULL`; índices únicos `ux_grupo_codigo ON grupo (LOWER(codigo))` e `ux_grupo_nome ON grupo (LOWER(nome))`.
    - `exame`: `id BIGINT GENERATED ALWAYS AS IDENTITY PK`, `codigo VARCHAR(10) NOT NULL`, `nome VARCHAR(100) NOT NULL`, `tempo_processamento INTERVAL NOT NULL CHECK (tempo_processamento >= INTERVAL '1 hour' AND tempo_processamento <= INTERVAL '8760 hours')`, `grupo_id BIGINT NOT NULL REFERENCES grupo(id) ON DELETE RESTRICT`; índices únicos `ux_exame_codigo ON exame (LOWER(codigo))`, `ux_exame_nome ON exame (LOWER(nome))`; índice `ix_exame_grupo_id ON exame (grupo_id)`.
  - Mapeamento da duração: campo `Duration tempoProcessamento` em `Exame` anotado com `@JdbcTypeCode(SqlTypes.INTERVAL_SECOND)` para mapear a coluna `INTERVAL`. Jackson deve serializar/desserializar `Duration` como string ISO-8601 (`"PT48H"`), nunca como número; configurar explicitamente se o padrão do Jackson do Boot 4 divergir.
  - Unicidade: o Service verifica antes de gravar (para devolver mensagem por campo) E os índices únicos do banco garantem em concorrência; `DataIntegrityViolationException` é traduzida para 409 pelo `ApiExceptionHandler`.
  - Datasource por variáveis de ambiente com defaults apenas para desenvolvimento local: `spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/exames}`, `spring.datasource.username=${DB_USER:exames}`, `spring.datasource.password=${DB_PASSWORD:exames}`.
  - `compose.yaml` na raiz do repositório com serviço `postgres` (imagem `postgres:17`, porta `5432`, banco/usuário/senha `exames`, volume nomeado).
  - Frontend em `frontend/`, organizado por feature:
    - `src/app/`: `router.tsx` (rotas), `AppLayout.tsx` (TopNav + `<Outlet/>`), `NotFoundPage.tsx`.
    - `src/features/grupos/`: `api.ts`, `types.ts`, `pages/GrupoListPage.tsx`, `pages/GrupoFormPage.tsx`, `components/GrupoTable.tsx`, `components/GrupoForm.tsx`.
    - `src/features/exames/`: `api.ts`, `types.ts`, `pages/ExameListPage.tsx`, `pages/ExameFormPage.tsx`, `components/ExameTable.tsx`, `components/ExameForm.tsx`.
    - `src/shared/api/`: `http.ts` (wrapper de `fetch` que lança `ApiError` com o `ProblemDetail` parseado), `types.ts` (`Page<T>`, `ProblemDetail`, `FieldError`).
    - `src/shared/components/`: componentes compartilhados listados em "UI/UX — Componentes" (um arquivo `.tsx` + um `.module.css` cada).
    - `src/shared/utils/duration.ts`: `horasParaIso(horas: number): string` e `isoParaHoras(iso: string): number`.
    - `src/shared/styles/`: `tokens.css` (todas as variáveis) e `base.css` (reset, tipografia base, foco).
  - Rotas (react-router 7, `createBrowserRouter` + `RouterProvider`):
    - `/` → redireciona para `/exames`
    - `/grupos` → `GrupoListPage`; `/grupos/novo` e `/grupos/:id/editar` → `GrupoFormPage`
    - `/exames` → `ExameListPage`; `/exames/novo` e `/exames/:id/editar` → `ExameFormPage`
    - `*` → `NotFoundPage`
  - Estado de listagem (`q`, `page`, `sort`, `grupoId`) fica nos search params da URL (link compartilhável, botão voltar funciona). Busca com debounce de 300 ms e volta para `page=0`.
  - Frontend só conversa com o backend por `/api/**` via `src/shared/api/http.ts`; o proxy do Vite já existente (`vite.config.ts`: `/api` → `http://localhost:8080`) é mantido. Componentes nunca chamam `fetch` diretamente.
  - Estilos: CSS Modules nativos do Vite + `tokens.css`. Remover o boilerplate do Vite: `src/App.tsx`, `src/App.css`, `src/assets/*`, conteúdo atual de `src/index.css` (substituído por imports de `tokens.css` e `base.css`).
  - Dependências frontend a adicionar: `react-router` (7.x); dev: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`. Script `"test": "vitest run"`.

  UI/UX — Componentes:
  - `AppLayout`: TopNav no topo + container centralizado com o conteúdo da rota.
  - `TopNav`: marca textual "Neovita Exames" à esquerda; links "Exames" e "Grupos" (NavLink); link ativo com `aria-current="page"` e sublinhado de 2px na cor de acento.
  - `PageHeader`: título `h1` da página + ação principal à direita (ex.: botão "Novo grupo"); empilha abaixo de 640px.
  - `SearchInput`: campo pill de busca com `label` visualmente oculto ("Buscar por código ou nome") e debounce de 300 ms.
  - `GrupoListPage`: orquestra busca, paginação, ordenação, carregamento, erro, vazio e exclusão de grupos.
  - `GrupoTable`: tabela com colunas Código, Nome, Ações (Editar, Excluir); cabeçalhos Código e Nome ordenáveis (`aria-sort`).
  - `GrupoFormPage`: carrega o grupo (modo edição) e orquestra submit, erros de campo e navegação de volta para `/grupos`.
  - `GrupoForm`: campos Código e Nome + botões "Salvar" (primário) e "Cancelar" (secundário).
  - `ExameListPage`: igual a `GrupoListPage`, com filtro adicional por grupo (`select` "Todos os grupos").
  - `ExameTable`: colunas Código, Nome, Tempo de processamento (ex.: `48 h`), Grupo (badge com nome do grupo), Ações; ordenáveis: Código, Nome, Tempo de processamento, Grupo.
  - `ExameFormPage`: carrega exame (modo edição) e a lista de grupos para o select; orquestra submit e erros.
  - `ExameForm`: campos Código, Nome, Tempo de processamento (horas, `type="number"`, `min=1`, `max=8760`, `step=1`, sufixo "horas"), Grupo (`select` obrigatório) + Salvar/Cancelar. Sem grupos cadastrados: mensagem "Cadastre um grupo antes de cadastrar exames." com link para `/grupos/novo` e botão Salvar desabilitado.
  - `Pagination`: "Anterior" / "Próxima" + texto "Página X de Y · N registros"; botões desabilitados nos limites.
  - `ConfirmDialog`: `<dialog>` nativo (`showModal()`), título, mensagem, botões "Cancelar" (secundário) e "Excluir" (primário); em 409 de exclusão, exibe o erro dentro do próprio dialog, oculta "Excluir" e o botão "Cancelar" passa a se chamar "Fechar".
  - `FlashMessage`: mensagem de sucesso após salvar/excluir ("Grupo salvo com sucesso.", "Exame excluído com sucesso."), `role="status"`, botão "Fechar"; some após 5 s ou ao fechar.
  - `ErrorState`: mensagem do erro + botão "Tentar novamente" que refaz a requisição; em 404 de edição, mensagem "Registro não encontrado." + link "Voltar para a lista".
  - `EmptyState`: sem registros → "Nenhum grupo cadastrado." / "Nenhum exame cadastrado." + botão "Novo …"; com busca → "Nenhum resultado para “{q}”." + botão "Limpar busca".
  - `TableSkeleton`: 5 linhas com a mesma altura (56px) e colunas da tabela final; `aria-busy="true"` no container.
  - `FormSkeleton`: blocos com a altura exata dos campos (48px) e botões (44px) do formulário final.
  - `TextField` / `SelectField`: label + controle + texto de erro (`aria-invalid`, `aria-describedby`).
  - `NotFoundPage`: "Página não encontrada." + link para `/exames`.
  - Use nos arquivos gerados os nomes exatos definidos aqui.

  UI/UX — Paleta de cores (defina como CSS variables em `src/shared/styles/tokens.css`; valores do DESIGN.md):
  - Tema claro (padrão): fundo `--color-bg: #ffffff`, superfície `--color-surface: #ffffff`, superfície forte `--color-surface-strong: #eef0f3`, texto `--color-text: #0a0b0d`, texto secundário `--color-text-soft: #5b616e`, divisória `--color-border: #dee1e6`, borda de controle `--color-border-control: #7c828a`, acento `--color-primary: #0052ff`, acento pressionado `--color-primary-active: #003ecc`, acento desabilitado `--color-primary-disabled: #a8b8cc`, texto sobre acento `--color-on-primary: #ffffff`, erro `--color-danger: #cf202f`, sucesso `--color-success: #05b169`, backdrop `--color-backdrop: rgba(10, 11, 13, 0.5)`.
  - Tema escuro (`@media (prefers-color-scheme: dark)`): fundo `#0a0b0d`, superfície `#16181c`, superfície forte `#5b616e`, texto `#ffffff`, texto secundário `#a8acb3`, divisória `#5b616e`, borda de controle `#7c828a`, acento `#0052ff` / `#003ecc` / `#a8b8cc`, texto sobre acento `#ffffff`, erro `#ff5c69` (único valor derivado fora do DESIGN.md: `#cf202f` tem contraste 3.6:1 sobre `#0a0b0d`, abaixo do AA; `#ff5c69` atinge ~6.5:1), sucesso `#05b169`, backdrop `rgba(10, 11, 13, 0.7)`.
  - Desvio consciente do DESIGN.md: borda de inputs usa `#7c828a` (contraste ≥3:1, WCAG 1.4.11) em vez do hairline `#dee1e6` (1.3:1); hairline fica só para divisórias de tabela e cards.
  - Acento (`--color-primary`) só aparece em: botão primário, anel/borda de foco, sublinhado do link ativo da TopNav. Nunca em texto corrido, links de texto, erros ou fundos de seção.
  - Erro (`--color-danger`) só em texto de erro e borda de campo inválido; nunca como fundo. Sucesso (`--color-success`) só como borda esquerda de 4px da `FlashMessage` (texto da mensagem em `--color-text`); nunca como texto ou fundo.
  - Botão secundário: claro → fundo `--color-surface-strong`, texto `--color-text`; escuro → fundo transparente, borda 1px `#ffffff`, texto `#ffffff` (`button-outline-on-dark`).

  UI/UX — Tipografia:
  - Inter 400 (`--font-sans`): corpo, inputs, células de tabela, títulos de página (`h1` em peso 400, nunca negrito — regra do DESIGN.md).
  - Inter 500/600 (`--font-sans`): 500 em labels e links da TopNav; 600 em botões, título de card e cabeçalhos de tabela.
  - JetBrains Mono 500 (`--font-mono`): valores de código e tempo de processamento nas tabelas.
  - Carregamento: Google Fonts via `<link>` no `frontend/index.html` (Inter 400;500;600 e JetBrains Mono 500, `display=swap`). Fallback: `-apple-system, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` e `ui-monospace, Consolas, monospace`.
  - Elemento de maior destaque: `h1` da página, `font-size: clamp(28px, 2.5vw + 16px, 32px)`, `line-height: 1.13`, `letter-spacing: -0.4px`.

  UI/UX — Dimensões e layout (únicos valores permitidos — não inventar fora desta lista):
  - Container: `max-width: 1200px`, centralizado, padding lateral 24px; abaixo de 640px, padding lateral 16px. Padding vertical do conteúdo: 48px (32px abaixo de 640px).
  - Escala de espaçamento: 4, 8, 12, 16, 20, 24, 32, 48px (tokens `--space-1` … `--space-8`).
  - TopNav: altura 64px, borda inferior 1px `--color-border`, links com gap 24px.
  - Botões (primário e secundário): altura 44px, padding 12px 20px, raio pill.
  - Input / select: altura 48px, padding 14px 16px, borda 1px `--color-border-control`, raio de controle; borda sempre 1px (nunca muda de espessura). Foco: apenas o anel global `:focus-visible` (outline 2px `--color-primary`, offset 2px), sem alterar a borda. Inválido: borda 1px `--color-danger`.
  - Interação: não há estado de hover (regra do DESIGN.md) em botões, links ou linhas de tabela; apenas `cursor: pointer`. Estado pressionado (`:active`): botão primário → fundo `--color-primary-active`; botão secundário claro → fundo `--color-border`; botão secundário escuro → fundo `--color-surface-strong`. Desabilitado: primário com fundo `--color-primary-disabled`; secundário com `opacity: 0.5`; ambos `cursor: not-allowed`.
  - FlashMessage: padding 12px 16px, fundo `--color-surface`, borda 1px `--color-border` com borda esquerda 4px `--color-success`, raio de controle, texto 16px `--color-text`, margem inferior 24px; botão "Fechar" no padrão secundário.
  - Pagination: botões "Anterior"/"Próxima" no padrão secundário (44px, pill), gap 12px, texto de status 13px `--color-text-soft`, margem superior 24px.
  - ErrorState / EmptyState: renderizados dentro do card da lista (ou do formulário), conteúdo centralizado, padding 48px 32px (32px 16px abaixo de 640px), mensagem 16px `--color-text`, gap 16px entre mensagem e botão.
  - SearchInput: altura 44px, padding 12px 20px, fundo `--color-surface-strong`, raio pill, largura máxima 360px (100% abaixo de 640px).
  - Card (container de tabela e de formulário): fundo `--color-surface`, borda 1px `--color-border`, raio de card, padding 32px (16px abaixo de 640px). Formulário com `max-width: 640px`; gap entre campos 20px.
  - Linha de tabela: `min-height: 56px`, padding 16px 12px, divisória inferior 1px `--color-border`.
  - Badge (grupo na tabela de exames): padding 4px 12px, fundo `--color-surface-strong`, raio pill.
  - ConfirmDialog: `max-width: 480px`, padding 32px, raio de card.
  - Arredondamentos: `--radius-control: 12px` (inputs, selects), `--radius-card: 24px` (cards, dialog), `--radius-pill: 100px` (botões, busca, badges), `--radius-skeleton: 8px` (blocos de skeleton).
  - Sombra: valor único `--shadow-overlay: 0 4px 12px rgba(0, 0, 0, 0.04)`, usado só no `ConfirmDialog` no tema claro; tema escuro: nenhuma (profundidade pela superfície `#16181c`).
  - Tamanhos de texto: `h1` clamp acima; título de card 18px/600; corpo, inputs e células 16px/400; botões 16px/600; labels e links da TopNav 14px/500; marca da TopNav 18px/600; cabeçalho de tabela 12px/600 maiúsculas, cor `--color-text-soft`; texto de erro, ajuda e paginação 13px/400; badge 12px/600.
  - Breakpoint único 640px: abaixo dele, tabela vira lista empilhada — cada registro é um bloco com padding 16px 0 e divisória inferior 1px `--color-border`, linhas "Rótulo: valor" de 16px com `line-height` 24px e gap 4px, e linha de ações (botões secundários 44px, gap 12px) com margem superior 12px. PageHeader e toolbar (busca + filtro) empilham em coluna, botões de formulário ocupam 100% da largura, paddings reduzidos conforme acima.
  - TableSkeleton segue o layout do breakpoint ativo: acima de 640px, 5 linhas de 56px com as colunas da tabela; abaixo, 5 blocos com exatamente as dimensões do bloco empilhado acima (linhas de 24px, gap 4px, barra de ações de 44px).
  - `base.css` declara `color-scheme: light dark` em `:root` para que controles nativos (select, scrollbar, dialog) acompanhem o tema.

  UI/UX — Repetibilidade (geração determinística):
  - Use exatamente os valores definidos nesta spec; não inventar cor, tamanho, sombra ou fonte fora dos tokens.
  - Expor todos os tokens (cor, raio, sombra, fonte, espaçamento) como variáveis em `tokens.css` — nunca hardcoded dentro dos componentes.
  - Nenhuma biblioteca de UI, ícones ou fontes além das explicitamente listadas aqui (Inter, JetBrains Mono). Ações usam texto, sem ícones.

  UI/UX — Comportamento:
  - Estados obrigatórios das listas: `loading` (TableSkeleton), `success` (tabela + Pagination), `empty` (EmptyState, com e sem busca), `error` (ErrorState com "Tentar novamente").
  - Estados obrigatórios dos formulários: `loading` (FormSkeleton, só em edição), `idle`, `submitting` (botão Salvar desabilitado com texto "Salvando…", `aria-busy`), `error` (erros por campo e/ou banner `role="alert"` no topo do formulário), `success` (navega para a lista e exibe FlashMessage).
  - Validação no cliente via atributos HTML (`required`, `maxLength`, `min`, `max`, `step`) com mensagens próprias em pt-BR; o campo Código converte para maiúsculas ao digitar. A validação do backend é a fonte da verdade.
  - Erros exibidos ao usuário:
    - 400 com `errors[]` → mensagem sob cada campo correspondente; foco vai para o primeiro campo inválido.
    - 409 de duplicidade → sob o campo indicado em `field`: "Já existe um grupo com este código." / "Já existe um grupo com este nome." / "Já existe um exame com este código." / "Já existe um exame com este nome."
    - 409 ao excluir grupo em uso → dentro do ConfirmDialog: "Este grupo possui N exame(s) vinculado(s) e não pode ser excluído."; botão Excluir some, fica só "Fechar".
    - 404 na edição → ErrorState "Registro não encontrado." + "Voltar para a lista".
    - 404 ao excluir (registro já removido) → fecha o dialog, recarrega a lista e mostra FlashMessage "O registro já havia sido excluído."
    - Falha de rede / 5xx → listas: ErrorState "Não foi possível carregar os dados. Verifique sua conexão e tente novamente." + "Tentar novamente"; formulário: banner "Não foi possível salvar. Tente novamente." mantendo os dados digitados.
  - Após excluir o último item de uma página > 0, voltar para a página anterior.
  - Acessibilidade: `<html lang="pt-BR">`, `<title>` "Neovita Exames"; foco visível em todos os controles (`outline: 2px solid var(--color-primary); outline-offset: 2px`, via `:focus-visible`); contraste mínimo 4.5:1 para texto e 3:1 para bordas de controle e foco; todo input com `<label>` associado; tabelas com `<caption>` (visualmente oculto) e `<th scope="col">`; cabeçalhos ordenáveis são `<button>` dentro do `<th>` com `aria-sort`; ConfirmDialog com foco inicial em "Cancelar" e retorno do foco ao botão que o abriu; toda funcionalidade operável só por teclado; skeleton sem animação quando `prefers-reduced-motion: reduce`; alvos de toque ≥44px.
</requirements>

<api_contracts>
  APIs externas:
  - Nenhuma.

  Convenções gerais (backend):
  - Base: `/api`. JSON em UTF-8. Nomes de campos em camelCase.
  - Erros no formato `ProblemDetail` (RFC 9457, `application/problem+json`): `type` (string), `title` (string), `status` (number), `detail` (string), `instance` (string) e, quando aplicável, `errors` (array de `{ field: string, message: string }`) ou `field` (string, campo em conflito).
  - Paginação (`@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`): `page` (≥0, padrão 0), `size` (1–100, padrão 20), `sort` (`campo,asc|desc`, padrão `nome,asc`). Resposta paginada: `{ "content": [...], "page": { "size": number, "number": number, "totalElements": number, "totalPages": number } }`.
  - `size` > 100 ou campo de `sort` fora da lista permitida → 400.

  APIs de backend — Grupos:
  - GET `/api/grupos`: lista paginada. Opcionais: `q` (string, contém em código ou nome, case-insensitive), `page`, `size`, `sort` (permitidos: `codigo`, `nome`).
    - 200: página de `GrupoResponse`.
    - 400: parâmetro de paginação/ordenação inválido.
  - GET `/api/grupos/{id}`: busca por id.
    - 200: `GrupoResponse`.
    - 404: id inexistente.
  - POST `/api/grupos`: cria. Body `GrupoRequest`: `codigo` (string, obrigatório, 1–10 após trim), `nome` (string, obrigatório, 1–50 após trim).
    - 201: `GrupoResponse` + header `Location: /api/grupos/{id}`.
    - 400: campo ausente, vazio ou acima do tamanho (`errors[]`).
    - 409: código ou nome já existente, case-insensitive (`field`: `"codigo"` ou `"nome"`).
  - PUT `/api/grupos/{id}`: atualiza. Body `GrupoRequest`.
    - 200: `GrupoResponse`.
    - 400: validação (`errors[]`).
    - 404: id inexistente.
    - 409: código ou nome já usado por outro grupo (`field`).
  - DELETE `/api/grupos/{id}`: exclui.
    - 204: sem corpo.
    - 404: id inexistente.
    - 409: grupo possui exames vinculados (`detail`: "Este grupo possui N exame(s) vinculado(s) e não pode ser excluído.").
  - `GrupoResponse`: `id` (number), `codigo` (string, maiúsculas), `nome` (string).

  APIs de backend — Exames:
  - GET `/api/exames`: lista paginada. Opcionais: `q` (contém em código ou nome, case-insensitive), `grupoId` (number), `page`, `size`, `sort` (permitidos: `codigo`, `nome`, `tempoProcessamento`, `grupo.nome`).
    - 200: página de `ExameResponse`.
    - 400: parâmetro de paginação/ordenação inválido ou `grupoId` não numérico.
  - GET `/api/exames/{id}`: busca por id.
    - 200: `ExameResponse`.
    - 404: id inexistente.
  - POST `/api/exames`: cria. Body `ExameRequest`: `codigo` (string, obrigatório, 1–10 após trim), `nome` (string, obrigatório, 1–100 após trim), `tempoProcessamento` (string ISO-8601, obrigatório, horas inteiras entre `PT1H` e `PT8760H`, sem minutos/segundos), `grupoId` (number, obrigatório).
    - 201: `ExameResponse` + header `Location: /api/exames/{id}`.
    - 400: validação de campos (`errors[]`), incluindo `tempoProcessamento` em formato inválido, ≤0, fora do intervalo ou fracionário, e `grupoId` inexistente (`field: "grupoId"`, mensagem "Grupo não encontrado.").
    - 409: código ou nome já existente (`field`).
  - PUT `/api/exames/{id}`: atualiza. Body `ExameRequest`.
    - 200: `ExameResponse`.
    - 400: validação (mesmas regras do POST).
    - 404: id do exame inexistente.
    - 409: código ou nome já usado por outro exame (`field`).
  - DELETE `/api/exames/{id}`:
    - 204: sem corpo.
    - 404: id inexistente.
  - `ExameResponse`: `id` (number), `codigo` (string, maiúsculas), `nome` (string), `tempoProcessamento` (string ISO-8601, ex.: `"PT48H"`), `grupo` (`GrupoResumoResponse`: `id` (number), `codigo` (string), `nome` (string)).

  Consumo pelo frontend:
  - O select de grupos do `ExameForm` e o filtro de `ExameListPage` usam `GET /api/grupos?size=100&sort=nome,asc`. Limite consciente de 100 grupos no select.
</api_contracts>

<acceptance_criteria>
  Caminho feliz:
  - Dado que não existe grupo "HEM", quando o usuário cria o grupo com código " hem " e nome "Hematologia", então a API responde 201 com `codigo: "HEM"`, a UI volta para `/grupos`, exibe "Grupo salvo com sucesso." e o grupo aparece na lista.
  - Dado o grupo "HEM" existente, quando o usuário cria o exame código "HMG01", nome "Hemograma completo", tempo 48 horas, grupo "Hematologia", então a API recebe `tempoProcessamento: "PT48H"`, grava `INTERVAL '48 hours'`, responde 201 e a lista de exames mostra "48 h" e o badge "Hematologia".
  - Dado um exame existente, quando o usuário edita o código para outro valor ainda não usado, então a alteração é salva e refletida na lista.
  - Dado 25 grupos, quando o usuário abre `/grupos`, então vê 20 registros, "Página 1 de 2 · 25 registros", e ao clicar "Próxima" vê os 5 restantes com `page=1` na URL.
  - Dado exames de grupos diferentes, quando o usuário digita "hemo" na busca e filtra pelo grupo "Hematologia", então após 300 ms a lista mostra apenas exames daquele grupo cujo código ou nome contém "hemo" (sem diferenciar maiúsculas).
  - Dado um exame, quando o usuário confirma "Excluir" no ConfirmDialog, então a API responde 204, a linha some e aparece "Exame excluído com sucesso."

  Erros de entrada/validação:
  - Dado o formulário de grupo, quando o usuário envia com Código vazio, então o envio é bloqueado no cliente e o campo mostra mensagem de obrigatório com `aria-invalid="true"`; se a requisição for feita direto na API, ela responde 400 com `errors[{ field: "codigo" }]`.
  - Dado o formulário de exame, quando o usuário informa tempo 0 ou 1,5, então o cliente bloqueia; e uma chamada direta à API com `"PT0H"`, `"PT1H30M"`, `"PT8761H"` ou `"48"` responde 400 com `errors[{ field: "tempoProcessamento" }]`.
  - Dado um nome de grupo com 51 caracteres enviado direto à API, então a resposta é 400 com `errors[{ field: "nome" }]`.

  Falha externa (rede/serviço):
  - Dado o backend fora do ar, quando o usuário abre `/exames`, então vê o ErrorState "Não foi possível carregar os dados. Verifique sua conexão e tente novamente."; ao religar o backend e clicar "Tentar novamente", a lista carrega.
  - Dado o backend fora do ar, quando o usuário clica "Salvar" no formulário, então vê o banner "Não foi possível salvar. Tente novamente." e os dados digitados permanecem nos campos.

  Casos de borda/ambíguos:
  - Dado o grupo de código "HEM", quando o usuário tenta criar outro com código "hem", então a API responde 409 com `field: "codigo"` e a UI mostra "Já existe um grupo com este código." sob o campo Código.
  - Dado o exame "Hemograma completo", quando outro exame é criado com nome "HEMOGRAMA COMPLETO", então a API responde 409 com `field: "nome"`.
  - Dado duas requisições simultâneas criando o mesmo código, então apenas uma grava (índice único) e a outra recebe 409, nunca 500.
  - Dado o grupo "Hematologia" com 3 exames, quando o usuário tenta excluí-lo, então a API responde 409 e o ConfirmDialog mostra "Este grupo possui 3 exame(s) vinculado(s) e não pode ser excluído." sem remover nada.
  - Dado nenhum grupo cadastrado, quando o usuário abre `/exames/novo`, então vê "Cadastre um grupo antes de cadastrar exames." com link para `/grupos/novo` e o botão Salvar desabilitado.
  - Dado `/grupos/999/editar` com id inexistente, então a UI mostra "Registro não encontrado." com link "Voltar para a lista".
  - Dado uma busca sem resultados por "xyz", então aparece "Nenhum resultado para “xyz”." com botão "Limpar busca".
  - Dado o único item da página 2 excluído, então a lista volta para a página 1.
  - Dado `GET /api/grupos?size=500` ou `?sort=senha,asc`, então a API responde 400.
  - Dado o sistema operacional em modo escuro, então a interface usa os tokens do tema escuro e mantém contraste AA.

  Testes automatizados obrigatórios:
  - Backend (JUnit + Testcontainers PostgreSQL com `@ServiceConnection`, Flyway rodando nas migrações reais): criar grupo (201 + normalização), duplicidade case-insensitive (409), exclusão de grupo com exames (409), validação de tamanho (400), round-trip de `tempoProcessamento` `"PT48H"`, `tempoProcessamento` inválido (400), `grupoId` inexistente (400), paginação/busca.
  - Frontend (Vitest + Testing Library + jsdom): `duration.ts` (`horasParaIso(48) === "PT48H"`, `isoParaHoras("PT48H") === 48`); `GrupoForm` exibe erro de campo vindo de um 409; `GrupoListPage` exibe ErrorState e recarrega ao clicar "Tentar novamente".
</acceptance_criteria>

<constraints>
  - FAÇA: Flyway como única fonte do schema (`ddl-auto=validate`); migrações versionadas `V{n}__descricao.sql` em `db/migration`.
  - FAÇA: Bean Validation nos DTOs `record` + `@Valid` nos controllers; erros sempre em `ProblemDetail` pelo `ApiExceptionHandler`.
  - FAÇA: garantir unicidade case-insensitive com índice único em `LOWER(coluna)` no banco, além da checagem no Service; traduzir violação de integridade para 409.
  - FAÇA: seguir o pacote raiz existente `br.com.neovita.exames`, Java 25, Spring Boot 4.1.1 e Lombok (já presente) apenas nas entidades; DTOs como `record`.
  - FAÇA: seguir a convenção de pastas por feature definida acima e o proxy `/api` já existente em `frontend/vite.config.ts`.
  - FAÇA: todos os textos da interface em pt-BR.
  - NÃO FAÇA: autenticação/autorização, cache, configuração de CORS (o proxy do Vite resolve), soft delete, auditoria (createdAt/updatedAt), internacionalização, exportação ou importação de dados.
  - NÃO FAÇA: adicionar bibliotecas não listadas (MapStruct, Tailwind, MUI, bibliotecas de ícones, TanStack Query, react-hook-form, zod, gerenciadores de estado, axios).
  - NÃO FAÇA: expor entidades JPA nas respostas da API nem usar `spring.jpa.hibernate.ddl-auto` diferente de `validate`.
  - NUNCA: alterar uma migração Flyway já aplicada (correções vão em nova versão).
  - NUNCA: commitar credenciais reais; senhas só via variáveis de ambiente (defaults existem apenas para o banco local do `compose.yaml`).
  - NUNCA: usar a cor de acento para erro, texto corrido ou fundo de seção, nem cores/tamanhos fora dos tokens desta spec.
</constraints>
