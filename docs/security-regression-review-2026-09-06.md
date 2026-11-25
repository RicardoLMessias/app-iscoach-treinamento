# Revisão de regressões de segurança

Data: 2026-09-06

## Escopo revisado

- Login, recuperação, convites, cadastro inicial e sessões.
- Criação administrativa da conta do professor.
- Cadastro, edição, desativação e exclusão de alunos.
- Anamnese, biblioteca de exercícios, vídeos e prescrições.
- Rotas, autorização, transações, saídas React e dependências JavaScript.

## Regressões corrigidas

- O comando `coach:create-professor` ainda usava a política antiga de 10 caracteres. Agora aplica de 15 a 128 caracteres, igual aos demais fluxos.
- E-mail e nome do professor agora são normalizados e limitados antes da criação.
- Busca de alunos agora limita a entrada a 100 caracteres e escapa curingas SQL.
- Atualização da anamnese agora bloqueia o registro do aluno durante a transação, evitando perda de versão em gravações concorrentes.
- O cadastro inicial não depende mais da existência dos documentos jurídicos. Mesmo quando ainda não há termos publicados, o aluno precisa preencher o perfil obrigatório antes de acessar as APIs do aplicativo.
- A verificação do cadastro consulta o perfil atual no banco e não reutiliza uma relação ausente armazenada em cache na sessão.
- Telefone, CEP, UF e sexo agora recebem normalização e validação semântica tanto no primeiro cadastro quanto na edição feita pelo professor.
- Todas as rotas de treino do aluno exigem cadastro inicial completo e aceite dos documentos obrigatórios vigentes.

## Controles recentes revalidados

- Revogação de sessões após redefinição, desativação e exclusão.
- Autorização por papel e vínculo do recurso.
- Tokens de convite com formato, expiração, hash e uso único.
- URLs de vídeo e miniatura por lista permitida.
- Snapshot de prescrições e isolamento de iframe.
- CSP e `.htaccess` presentes também no build de produção.

## Resultados

- Backend: 27 testes, 166 asserções.
- Frontend: lint e build aprovados.
- npm audit de produção: zero vulnerabilidades conhecidas.
- Composer audit: pendente porque o executável Composer ainda não está instalado neste ambiente.
