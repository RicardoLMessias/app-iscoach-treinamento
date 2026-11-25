# Documentação do sistema — IS COACH TREINAMENTO

## 1. Identificação

| Item | Definição |
|---|---|
| Produto | IS COACH TREINAMENTO |
| Tipo | Aplicação web responsiva, mobile-first |
| Frontend | React + Vite |
| Backend | Laravel 13 / PHP 8.3 ou superior |
| Banco de produção | MySQL |
| Autenticação | Laravel Sanctum, sessão e cookie HTTP-only |
| Hospedagem prevista | HostGator, plano Turbo |
| Endereço previsto | `https://app.iscoach.com.br` (a confirmar após aquisição/configuração do domínio) |
| E-mail operacional | `contato.igorpersonal@gmail.com` |
| Documento de escopo | Especificação funcional v1.0, de 27/08/2026 |
| Estado deste documento | Retrato técnico e funcional do repositório em 15/09/2026 |

Esta documentação descreve o que existe no código atual. A especificação funcional aprovada continua sendo a fonte oficial do escopo. Mudanças de escopo dependem de autorização do cliente.

## 2. Objetivo e perfis de acesso

O sistema centraliza o acompanhamento dos alunos do professor Igor Santos: cadastro por convite, treinos, execução de exercícios, avaliações físicas, alimentação, hidratação, suplementos, recursos ergogênicos, perfil, consentimentos e comunicação por WhatsApp.

Existem dois papéis:

- **Professor:** administra alunos, convites, biblioteca de exercícios, treinos, modelos de treino, avaliações, anamnese e alimentação.
- **Aluno:** conclui o primeiro acesso, aceita seus próprios termos, mantém o perfil, consulta e executa treinos, acompanha avaliações, consulta alimentação e registra hidratação.

O professor pode editar os dados operacionais e clínicos autorizados, mas nunca aceita ou revoga consentimentos em nome do aluno.

## 3. Funcionalidades implementadas

### 3.1 Acesso, convite e conta

- Login e logout com sessão.
- Alunos entram somente por convite criado pelo professor.
- Convite com validade selecionável entre 1 e 3 dias, expiração automática, envio por e-mail e opção de copiar o link.
- Primeiro acesso realizado pelo próprio aluno, com cadastro e aceite dos documentos vigentes.
- Senha com no mínimo 10 caracteres, letras maiúsculas e minúsculas, número e caractere especial.
- Recuperação de senha por e-mail com validade de 30 minutos.
- Alteração de e-mail mediante confirmação por link com validade de 30 minutos.
- Notificação por e-mail após alteração de senha e ativação/inativação do acesso.
- Conta inativada só pode ser reativada manualmente pelo professor.

### 3.2 Área do professor

- Painel com indicadores de alunos ativos, convites pendentes, inativos, treinos na semana, avaliações recentes e alunos sem plano ativo.
- Seleção prévia do aluno, preservada durante a navegação entre módulos.
- Listagem, consulta, edição, ativação, inativação e exclusão definitiva de alunos.
- Edição do cadastro e da anamnese durante o atendimento.
- Gestão dos consentimentos apenas para consulta; o aceite permanece exclusivo do aluno.
- Biblioteca de exercícios por agrupamento muscular, com busca e preenchimento por exercícios existentes.
- Cadastro de exercício com vídeo opcional e inclusão/alteração posterior do vídeo.
- Incorporação de vídeos externos compatíveis no player interno do aplicativo.
- Criação de vários treinos para o mesmo aluno, edição no próprio card, exclusão, status ativo/arquivado e dia da semana opcional.
- Exercícios do treino com séries, repetições, descanso, carga sugerida, instruções e atividades complementares.
- Modelos de treino reutilizáveis como atalhos de prescrição.
- Histórico das execuções do aluno.
- Avaliações físicas com histórico, comparação, gráficos, fotos, correção versionada e exclusão.
- Planos alimentares com refeições, alimentos, substituições unitárias, metas, suplementos e recursos ergogênicos.

### 3.3 Área do aluno

- Página inicial com dados reais do aluno, plano atual, progresso e atalhos.
- Foto de perfil privada, redimensionada e comprimida antes do armazenamento.
- Central de notificações da interface e acesso direto ao WhatsApp do professor (`+55 11 97613-5348`).
- Listagem vertical de todos os treinos disponíveis.
- Execução do treino, registro de séries, carga e repetições, atividades complementares e conclusão da sessão.
- Histórico de treinos.
- Avaliações físicas, evolução, comparativos e fotos autorizadas.
- Plano alimentar ativo, refeições, alimentos, substituições, suplementos, recursos ergogênicos e registro de hidratação.
- Edição de perfil, endereço por CEP, senha, e-mail, foto e consentimentos.

### 3.4 Avaliação física

As informações de entrada são editadas pelo professor; resultados calculados não são editáveis diretamente. O backend possui o serviço `AssessmentCalculations`, que centraliza os cálculos.

O módulo contempla composição corporal, medidas, perímetros e protocolo de Jackson & Pollock de sete dobras para a faixa prevista de 18 a 61 anos. Foram retirados do escopo da tela: teste físico, teste de flexibilidade, diâmetros ósseos e dobra cutânea da panturrilha.

As fotos de avaliação são JPG, podem ser substituídas/excluídas e dependem da autorização correspondente do aluno.

## 4. Arquitetura

```text
Navegador mobile/desktop
        |
        | HTTPS + cookie de sessão + CSRF
        v
Frontend React/Vite
        |
        | /api/v1 e /sanctum
        v
API Laravel/Sanctum
   |          |             |
   v          v             v
 MySQL   storage privado   SMTP Gmail
                           ViaCEP / vídeos incorporados
```

O React nunca acessa o banco diretamente. Validação, autorização, cálculos, persistência e acesso a arquivos privados ficam no Laravel.

### 4.1 Estrutura de diretórios

```text
is-coach-treinamento/
├── frontend/
│   ├── public/                 # ativos públicos e imagem padrão de exercício
│   └── src/
│       ├── app/                # composição, sessão e navegação
│       ├── features/auth/      # login, primeiro acesso e consentimentos
│       ├── pages/              # telas do aluno e painel do professor
│       ├── services/http/      # cliente único da API
│       ├── shared/             # componentes e utilitários reutilizáveis
│       └── styles/             # estilos globais
├── backend-laravel/
│   ├── app/
│   │   ├── Actions/            # ações transversais, como auditoria
│   │   ├── Http/Controllers/   # endpoints da API
│   │   ├── Http/Middleware/    # usuário ativo, papel, consentimento e headers
│   │   ├── Http/Requests/      # validação e autorização de entrada
│   │   ├── Http/Resources/     # respostas públicas controladas
│   │   ├── Models/             # entidades Eloquent
│   │   ├── Notifications/      # mensagens de e-mail
│   │   ├── Services/           # cálculos de avaliação
│   │   └── Support/            # senha forte e URL segura de vídeo
│   ├── database/migrations/    # estrutura versionada do banco
│   ├── database/seeders/       # documentos e bibliotecas iniciais
│   ├── routes/api.php          # API v1
│   ├── storage/app/private/    # arquivos que não podem ser públicos
│   └── tests/                  # testes automatizados
└── docs/                       # decisões, auditorias e esta documentação
```

O diretório `backend/` contém uma base PHP preliminar preservada por histórico. O backend oficial é `backend-laravel/`.

## 5. Banco de dados

As migrations são a referência executável da estrutura. Os principais grupos são:

| Grupo | Tabelas | Responsabilidade |
|---|---|---|
| Identidade | `users`, `password_reset_tokens`, `sessions` | Conta, papel, status, sessão e recuperação |
| Convites e jurídico | `invitations`, `legal_documents`, `consent_acceptances` | Entrada controlada e versão dos aceites |
| Aluno | `student_profiles`, `anamneses` | Cadastro, endereço, foto e anamnese |
| Auditoria | `audit_logs` | Registro de alterações relevantes |
| Exercícios | `muscle_groups`, `exercises` | Biblioteca e agrupamentos |
| Prescrição de treino | `workout_plans`, `workout_plan_exercises`, `workout_templates` | Planos, itens e modelos reutilizáveis |
| Execução | `workout_sessions`, `workout_session_exercises`, `workout_set_logs` | Histórico real, atividades e séries |
| Avaliação | `physical_assessments`, `assessment_photos` | Entradas, resultados, versões e fotos |
| Alimentação | `nutrition_plans`, `hydration_logs` | Planos, refeições, metas e hidratação |
| Infraestrutura | `cache`, `jobs`, `job_batches`, `failed_jobs` | Cache e processamento assíncrono |

Relações centrais:

- um aluno (`users`) possui um perfil, uma anamnese e seus consentimentos;
- um aluno pode possuir vários treinos, sessões, avaliações e planos alimentares;
- um treino possui vários exercícios prescritos;
- uma sessão preserva uma cópia da prescrição utilizada na execução;
- uma avaliação pode possuir fotos e uma versão anterior para correções;
- o professor é registrado como autor dos conteúdos que cria ou altera.

Campos sensíveis de perfil, anamnese, avaliação e auditoria usam casts criptografados do Laravel. Isso protege o conteúdo no banco, mas exige preservação segura e permanente da `APP_KEY`; perdê-la torna os dados cifrados irrecuperáveis.

## 6. API HTTP

Prefixo: `/api/v1`. As respostas são JSON. Rotas protegidas exigem sessão Sanctum, usuário ativo e, quando indicado, papel/consentimentos.

### 6.1 Públicas e autenticação

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/health` | Saúde da API |
| POST | `/auth/login` | Iniciar sessão |
| POST | `/auth/forgot-password` | Solicitar recuperação |
| POST | `/auth/reset-password` | Definir nova senha |
| POST | `/auth/confirm-email` | Confirmar alteração de e-mail |
| GET | `/invitations/{token}` | Validar convite |
| POST | `/invitations/{token}/accept` | Criar conta pelo convite |

### 6.2 Sessão, consentimentos e utilitários

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/auth/me` | Usuário autenticado |
| POST | `/auth/logout` | Encerrar sessão |
| GET/POST | `/consents` | Consultar e realizar aceite inicial |
| POST/DELETE | `/consents/{document}/accept` | Aceitar ou revogar documento |
| GET | `/address/cep/{postalCode}` | Buscar endereço pelo ViaCEP no backend |
| GET | `/assessments/{assessment}/photos` | Listar fotos autorizadas |
| GET | `/assessments/{assessment}/photos/{photo}` | Entregar foto privada |

### 6.3 Aluno

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/student/dashboard` | Resumo inicial |
| GET/PUT | `/student/profile` | Consultar/editar perfil |
| GET/POST/DELETE | `/student/profile/photo` | Consultar, enviar ou excluir foto |
| PUT | `/student/profile/password` | Alterar senha |
| GET | `/student/assessments` | Listar avaliações |
| GET | `/student/assessments/{assessment}` | Detalhar avaliação |
| GET | `/student/workout` | Plano atual compatível |
| GET | `/student/workouts` | Todos os planos disponíveis |
| GET/POST | `/student/workout/session` | Consultar/iniciar sessão |
| PUT/DELETE | `/student/workout/sessions/{session}/exercises/{exercise}/sets/{set}` | Registrar/remover série |
| PUT | `/student/workout/sessions/{session}/activities/{activity}` | Atualizar atividade complementar |
| POST | `/student/workout/sessions/{session}/complete` | Concluir sessão |
| GET | `/student/workouts/history` | Histórico |
| GET | `/student/nutrition` | Plano alimentar atual |
| POST | `/student/nutrition/hydration` | Registrar hidratação |

### 6.4 Professor

| Recurso | Operações |
|---|---|
| Dashboard | `GET /professor/dashboard` |
| Alunos | listar, detalhar, atualizar e excluir em `/professor/students` |
| Acesso do aluno | ativar/inativar em `/professor/students/{student}/access` |
| Convites | listar, criar e cancelar em `/professor/invitations` |
| Anamnese | `PUT /professor/students/{student}/anamnesis` |
| Exercícios | listar, criar e atualizar em `/professor/exercises` |
| Treinos | listar, criar, atualizar e excluir em `/professor/students/{student}/workouts` |
| Modelos de treino | CRUD em `/professor/workout-templates` (sem rota de detalhe isolada) |
| Histórico de treino | `GET /professor/students/{student}/workout-history` |
| Avaliações | schema, lista, criação, edição, correção e exclusão sob `/professor` |
| Fotos da avaliação | enviar/excluir em `/assessments/{assessment}/photos` |
| Alimentação | listar, criar, atualizar e excluir em `/professor/students/{student}/nutrition-plans` |

Para nomes de parâmetros e contratos exatos, consultar `routes/api.php`, os `Http/Requests` e os `Http/Resources` do backend.

## 7. Regras de negócio importantes

- Status aceitos para treino e alimentação: `active` e `archived`; `draft` foi removido do fluxo.
- O dia da semana do treino é opcional.
- Um aluno pode ter vários treinos simultaneamente; cadastrar outro não substitui os anteriores.
- Exercícios podem existir sem vídeo.
- URLs de vídeo são normalizadas e limitadas a provedores incorporáveis aceitos pelo backend.
- O histórico usa snapshots para que alterações futuras na biblioteca não modifiquem execuções passadas.
- Convites são de uso único e armazenam somente o hash do token.
- Alterações em avaliações finalizadas geram correções/versionamento em vez de apagar silenciosamente o histórico.
- Fotos e documentos privados são servidos por controladores após autorização, nunca por URL pública direta.
- A exclusão definitiva de aluno é uma ação administrativa destrutiva; a interface deve confirmar claramente o alvo.

## 8. Segurança implementada

- Sessão Sanctum com proteção CSRF.
- Cookies HTTP-only, `SameSite=Lax`, criptografia de sessão e cookie seguro em produção.
- Senhas armazenadas por hash e política forte centralizada.
- Limitação de requisições em login, recuperação, convites, fotos, consentimentos, senha, CEP e hidratação.
- Middlewares para usuário ativo, papel e consentimentos obrigatórios.
- Validação com `FormRequest` e autorização por recurso/aluno.
- Respostas por Resources para evitar exposição acidental de atributos.
- Tokens de convite e alteração de e-mail armazenados como SHA-256, com validade e consumo controlado.
- Campos pessoais e de saúde criptografados no banco.
- Fotos reprocessadas, comprimidas e armazenadas fora da raiz pública.
- Cabeçalhos HTTP de segurança aplicados globalmente.
- Registro de auditoria para operações sensíveis.
- `APP_DEBUG=false`, source maps desabilitados e segredos somente no `.env` em produção.

Regras operacionais:

- nunca incluir senha do Gmail, `APP_KEY`, senha MySQL ou tokens no Git ou no frontend;
- não usar variáveis `VITE_*` para segredos, pois elas ficam públicas no bundle;
- manter HTTPS obrigatório em produção;
- fazer backup externo do banco, arquivos privados e `APP_KEY`;
- revisar acesso de ex-alunos e contas administrativas periodicamente.

## 9. Ambiente local

### 9.1 Pré-requisitos

- PHP 8.3 ou superior (produção informou disponibilidade do PHP 8.5).
- Composer 2.
- Extensões PHP usuais do Laravel: OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, Fileinfo, cURL e driver PDO do banco.
- Node.js LTS e npm.
- MySQL para paridade com produção; SQLite pode ser usado apenas para testes locais.

### 9.2 Backend

No PowerShell:

```powershell
cd backend-laravel
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed --class=LegalDocumentsSeeder
php artisan db:seed --class=MuscleGroupSeeder
php artisan db:seed --class=RequestedExerciseLibrarySeeder
php artisan db:seed --class=DanielaOliveiraExerciseLibrarySeeder
php artisan coach:create-professor contato.igorpersonal@gmail.com --name="Igor Santos"
php artisan serve
```

Não execute o `DatabaseSeeder` em produção sem revisão: no estado atual ele também cria `test@example.com`. Os seeders específicos acima são seguros para inicializar os catálogos previstos.

### 9.3 Frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

O Vite abre em `http://127.0.0.1:5173` e encaminha `/api` e `/sanctum` para `http://127.0.0.1:8000`.

## 10. Configuração de produção

Principais variáveis do `backend-laravel/.env`:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://app.iscoach.com.br
FRONTEND_URL=https://app.iscoach.com.br
SANCTUM_STATEFUL_DOMAINS=app.iscoach.com.br

DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_REQUIRE_TLS=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=contato.igorpersonal@gmail.com
MAIL_PASSWORD=senha-de-aplicativo-no-servidor
MAIL_FROM_ADDRESS=contato.igorpersonal@gmail.com
```

A senha de aplicativo deve ser digitada somente no `.env` do servidor, sem aspas extras ou espaços, e nunca documentada com seu valor real.

Após configurar:

```bash
php artisan migrate --force
php artisan config:cache
php artisan view:cache
```

## 11. Publicação na HostGator

Estratégia recomendada:

1. Confirmar no cPanel PHP 8.5, extensões, Composer/SSH, MySQL, SSL, limites de upload/memória e possibilidade de alterar o document root.
2. Criar o banco e um usuário MySQL exclusivo com privilégio somente nesse banco.
3. Manter o projeto Laravel fora de `public_html`.
4. Apontar o document root somente para `backend-laravel/public`. Se o plano não permitir, expor em `public_html` apenas os arquivos públicos e ajustar com cuidado o `index.php` para o Laravel privado.
5. Gerar o frontend com `npm ci` e `npm run build`; publicar somente o conteúdo de `frontend/dist` na raiz web definida para a aplicação.
6. Configurar `.env`, executar migrations/seeders e criar o professor por comando.
7. Garantir permissão de escrita somente em `storage` e `bootstrap/cache`.
8. Ativar HTTPS e testar sessão, CSRF, e-mail, CEP, uploads e arquivos privados no endereço definitivo.
9. Configurar cron do Laravel se tarefas agendadas forem adotadas. O plano informado possui intervalo mínimo a confirmar (levantamento atual: 15 minutos).
10. Manter backup externo periódico do MySQL, `storage/app/private` e `APP_KEY`.

O subdomínio deve apontar para uma pasta pública exclusiva que contenha somente o front controller do Laravel e o build do React. O código Laravel, `.env`, `vendor` e arquivos privados permanecem fora de `public_html`. A topologia final ainda depende das opções disponíveis no cPanel.

## 12. Testes e qualidade

Comandos de validação:

```powershell
cd backend-laravel
php artisan test

cd ..\frontend
npm run lint
npm run build
```

Baseline conhecida em 15/09/2026: **70 testes do backend e 507 asserções aprovadas**, além de lint e build do frontend aprovados. Esse número é uma referência histórica; toda mudança deve executar novamente os testes relevantes.

Critérios mínimos antes da publicação:

- aluno não acessa rotas de professor e não acessa dados de outro aluno;
- usuário inativo perde o acesso imediatamente;
- aluno sem consentimentos vigentes é direcionado ao aceite;
- convite expirado, cancelado ou já usado é recusado;
- login e recuperação não revelam se determinado e-mail existe;
- cadastro, senha e uploads recusam formatos/tamanhos inválidos;
- dois ou mais treinos do aluno coexistem e podem ser editados/excluídos isoladamente;
- snapshots preservam prescrições e avaliações anteriores;
- resultados de avaliação são recalculados no servidor;
- fotos privadas não abrem sem sessão/autorização;
- interface funciona nos principais tamanhos de celular;
- e-mails chegam pelo SMTP real e links apontam para a produção;
- CEP é consultado no backend e falhas externas recebem mensagem tratada;
- build de produção não contém segredo nem source map.

## 13. Pendências conhecidas para conclusão e produção

Estas pendências não devem ser confundidas com funcionalidades concluídas:

1. Conteúdo jurídico definitivo de Termos de Uso, Política de Privacidade e autorização de imagens deve ser revisado pelo advogado do cliente; o mecanismo técnico já existe.
2. Comprar/configurar o domínio, criar `app.iscoach.com.br` e validar seu document root e SSL.
3. Confirmar versão do MySQL, extensões PHP, memória, upload, Composer/SSH, cron e document root no cPanel.
4. Realizar teste real de SMTP Gmail, entregabilidade, spam e links de convite/recuperação.
5. Realizar teste do ViaCEP em produção e definir comportamento operacional em indisponibilidade do serviço.
6. Definir o canal definitivo de hospedagem dos vídeos e suas regras de privacidade/disponibilidade. Atualmente o sistema trabalha com reprodução incorporada por URL, sem armazenar os vídeos na hospedagem.
7. Persistir no backend o estado de leitura das notificações. A leitura visual atual é mantida localmente no navegador e não sincroniza entre dispositivos.
8. Revisar a modelagem de alongamentos para duração/tempo quando a prescrição não usar séries e repetições.
9. Fazer homologação completa com o professor e alunos em celulares reais, incluindo acessibilidade e textos.
10. Definir rotina externa de backup, restauração testada, monitoramento, retenção de logs e resposta a incidentes.

## 14. Manutenção

- Toda alteração de banco deve ser uma migration nova; migrations já publicadas não devem ser reescritas.
- Regras de entrada ficam em `Http/Requests`; autorização deve permanecer no backend mesmo quando a interface esconder uma ação.
- Cálculos ficam em Services e precisam de testes com casos conhecidos.
- Conteúdo histórico deve usar snapshots/versionamento, não referências mutáveis sem cópia.
- Novos arquivos enviados devem ser validados por conteúdo, reprocessados quando forem imagens e armazenados privadamente.
- Dependências devem ser atualizadas com revisão das notas de segurança e nova execução dos testes.
- Toda nova integração externa precisa de timeout, tratamento de falha e segredo somente no servidor.

## 15. Documentos relacionados

- `docs/architecture.md`: decisões arquiteturais originais.
- `docs/decision-log.md`: registro de decisões aprovadas e pendentes.
- `docs/hostgator-discovery.md`: levantamento da hospedagem.
- `docs/security-review-authentication.md`: auditoria do módulo de autenticação.
- `docs/security-review-training.md`: auditoria do módulo de treinos.
- `docs/security-regression-review-2026-09-06.md`: revisão de regressões.
- `docs/stage-0-readiness.md` a `docs/stage-5-training-foundation.md`: histórico das etapas iniciais.
