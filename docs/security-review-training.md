# Revisão de segurança — biblioteca e treinos

Data: 2026-09-06

## Controles aplicados

- Acesso à biblioteca e às prescrições restrito ao papel de professor.
- Consulta do aluno derivada exclusivamente da sessão autenticada, sem aceitar ID de aluno do cliente.
- Verificação do vínculo entre aluno e treino antes de exclusão.
- URLs de vídeo normalizadas no servidor e limitadas a HTTPS, YouTube sem cookies e Vimeo.
- Validação do identificador real do vídeo, além do domínio.
- Rejeição de credenciais, portas e domínios semelhantes em URLs externas.
- Miniaturas limitadas aos hosts oficiais do YouTube e Vimeo.
- `iframe` com `sandbox`, permissões mínimas e política sem envio de referência.
- CSP de produção permitindo frames somente dos dois provedores aprovados.
- Snapshot imutável do exercício dentro da prescrição publicada.
- Trava transacional por aluno durante a publicação para evitar dois treinos ativos concorrentes.
- Limites para quantidade de exercícios, séries, repetições, carga, descanso e tamanho de textos.
- Limites de retorno para biblioteca e histórico de prescrições.
- Auditoria de criação e edição de exercícios, criação e exclusão de treinos.

## Testes de abuso

- Bloqueio de aluno tentando acessar rotas do professor.
- Isolamento entre alunos.
- Bloqueio de exclusão usando combinação de aluno e treino incompatível.
- Rejeição de HTTP, domínio falso, URL sem vídeo e credenciais embutidas.
- Rejeição de miniatura externa usada para rastreamento.
- Confirmação de que alterações na biblioteca não modificam prescrições existentes.

## Pendências operacionais

- Validar os cabeçalhos `.htaccess` no Apache da HostGator durante a homologação.
- Executar `composer audit --locked` quando o Composer estiver disponível.
- Revisar privacidade e termos de uso dos provedores de vídeo escolhidos antes da produção.
