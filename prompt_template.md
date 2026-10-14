<persona>
Você é um [CARGO] com especialidade em [ATRIBUIÇÕES]. Segue estritamente todos os requisitos definidos e faz as entregas de acordo com o proposto.
</persona>

<task>
  [Nome curto da funcionalidade]
</task>

<goal>
  [Uma ou duas frases descrevendo o resultado para o usuário.]
</goal>

<requirements>
  Negócio:
  - [Capacidade principal 1]
  - [Capacidade principal 2]
  - [Capacidade principal 3]

  Arquitetura:
  - [Onde a funcionalidade deve ser implementada — módulo/pacote/camada]
  - [Qual camada é dona de cada responsabilidade — quem orquestra, quem só consome]
  - [Regra de integração, fluxo de dados ou fronteira de dependência que nunca deve ser cruzada]

  UI/UX — Componentes:
  - [Componente 1]: [o que orquestra/exibe]
  - [Componente 2]: [conteúdo ou interação]
  - [Componente de erro]: [mensagem + ação de recuperação, ex. "tentar novamente"]
  - [Componente de carregamento]: [skeleton com as mesmas dimensões do estado final]
  - Use nos arquivos gerados os nomes exatos definidos aqui.

  UI/UX — Paleta de cores (defina como CSS variables/design tokens do projeto):
  - [Tema ou estado 1]: fundo [#hex], superfície [#hex], texto [#hex], acento [#hex]
  - [Tema ou estado 2, se houver]: fundo [#hex], superfície [#hex], texto [#hex], acento [#hex]
  - [Regra de uso do acento — onde aparece e onde nunca aparece, ex. "nunca em texto corrido"]

  UI/UX — Tipografia:
  - [Fonte + peso]: [uso — títulos/destaque]
  - [Fonte + peso]: [uso — corpo/labels]
  - [Elemento de maior destaque visual e sua escala exata, ex. clamp(min, preferred, max)]

  UI/UX — Dimensões e layout (únicos valores permitidos — não inventar fora desta lista):
  - Container: [max-width, padding lateral, comportamento abaixo do breakpoint]
  - Escala de espaçamento: [lista fechada de valores em px]
  - [Componente]: [altura/padding/min-height exatos]
  - Arredondamentos: [um token por finalidade, ex. --radius-card, --radius-control]
  - Sombra: [valor único, diferenciado por tema se houver, ou "nenhuma"]
  - Tamanhos de texto: [um valor por elemento nomeado]
  - Breakpoint(s): [valor(es) e o que muda em cada um]

  UI/UX — Repetibilidade (geração determinística):
  - Use exatamente os valores definidos nesta spec; não inventar cor, tamanho, sombra ou fonte fora dos tokens.
  - Expor todos os tokens (cor, raio, sombra, fonte) como variáveis — nunca hardcoded dentro dos componentes.
  - Nenhuma biblioteca de UI, ícones ou fontes além das explicitamente listadas aqui.

  UI/UX — Comportamento:
  - Estados obrigatórios: [idle/loading/success/error ou equivalentes da funcionalidade]
  - Erros exibidos ao usuário: [cada erro esperado + mensagem/ação]
  - Acessibilidade: [foco visível, contraste mínimo, outros requisitos]
</requirements>

<api_contracts>
  APIs externas (consumidas somente por [camada responsável]):
  - [Nome do serviço externo]: [método + endpoint + o que resolve]

  APIs de backend:
  - [MÉTODO] [caminho]: [propósito, parâmetros obrigatórios/opcionais]
  - Resposta de sucesso ([status]): objeto JSON com todos os campos — liste cada campo e tipo, não resuma
  - Respostas de erro: [status code]: [condição exata que o dispara]
</api_contracts>

<acceptance_criteria>
  Cubra pelo menos: caminho feliz, um erro de entrada/validação, uma falha externa (rede/serviço) e um caso ambíguo ou de borda.
  - Dado [estado/contexto], quando [ação], então [resultado esperado].
  - Dado [estado/contexto], quando [ação], então [resultado esperado].
  - Dado [erro/caso de borda], quando [ação], então [feedback esperado].
</acceptance_criteria>

<constraints>
  - FAÇA: [decisão técnica ou de produto obrigatória]
  - FAÇA: [siga os padrões existentes do projeto — cite o pacote/convenção específico]
  - NÃO FAÇA: [comportamento explicitamente proibido]
  - NÃO FAÇA: [escopo fora do pedido que não deve ser tocado, ex. auth, cache, banco]
  - NUNCA: [fronteira crítica que não pode ser violada, ex. segredo exposto, contrato existente quebrado]
</constraints>
