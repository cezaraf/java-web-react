precisamos criar um cadastro de exames no projeto:

1 - backend: spring boot: adicione flyway para as migrações
2 - frontend: crie rotas e componentes respeitando o design (organização de pastas) padrão de projetos react;

CRUDS:

GRUPO:

1 - CÓDIGO, INFORMADO PELO USUÁRIO, STRING, 10;
2 - NOME, INFORMADO PELO USUÁRIO, STRING 50;

O CÓDIGO É ÚNICO E NÃO PODE SE REPETIR;
O NOME É ÚNICO E NÃO PODE SE REPETIR;


EXAME:

1 - CÓDIGO: INFORMADO PELO USUÁRIO, STRING, 10
2 - NOME: INFORMADO PELO USUÁRIO, STRING, 100
3 - TEMPO DE PROCESSAMENTO: INFORMADO PELO USUÁRIO: DURATION: HORAS
4 - GRUPO: REFERÊNCIA PARA O GRUPO DE EXAMES (CRUD DE GRUPO)

CÓDIGO É ÚNICO
NOME É UNICO