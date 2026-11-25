# Auditoria de segurança — 18/09/2026

## Complemento: revisão 2 e pacote HostGator

Esta seção atualiza os resultados históricos abaixo. Pacote: `releases/is-coach-hostgator-2026-09-18-r2.zip`. O ZIP antigo continua obsoleto.

- **Alta:** alteração de e-mail pelo aluno sem reautenticação: `UpdateProfileRequest` exige senha atual somente quando muda o e-mail; `ProfileController` exclui a senha dos campos persistidos; tela de perfil inclui a confirmação. Testados senha ausente, incorreta, correta e edição comum sem senha.
- **Alta:** confirmação pendente de e-mail sobrevivia à alteração/recuperação de senha: ambos os controladores agora limpam e-mail pendente, hash e expiração. Testes verificam rejeição do link anterior após os dois fluxos.
- **Média:** atualizações de perfil podiam disparar e-mails sem limite: rotas do aluno/professor limitadas a 5/10 solicitações por minuto, respectivamente. Teste cobre resposta 429 e quantidade de envios do aluno.
- **Média:** links de segurança sobreviviam à desativação: `StudentAccessController` revoga tokens de recuperação e mudança de e-mail; recuperação de conta inativa é rejeitada. Testados revogação e hash de senha inalterado.
- **Operacional:** `MAIL_SCHEME=tls` não é aceito pela biblioteca instalada. Modelo usa `smtp` na porta 587, STARTTLS obrigatório e timeout de 15 segundos. Testada criação do transporte sem conexão externa; entrega Gmail depende do servidor.
- **Operacional:** front controller aponta para a raiz correta e registra a pasta pública com `usePublicPath`. Corrigida a regressão de contagem de diretórios da primeira auditoria. HTML real e `/api/v1/health` executados a partir do pacote, sem usar banco local.
- **Preventiva:** seeder padrão não cria conta de demonstração em produção; teste específico aprovado.

Resultado final: **85 testes / 564 asserções**, Pint, ESLint e build aprovados. npm audit e Composer audit consultados novamente sem vulnerabilidades reportadas. Dependências instaladas pelo lock com `--no-dev`; 77 pacotes de produção. Verificação da plataforma aprovada localmente em PHP 8.5.9; lock exige PHP >= 8.4.1. Servidor ainda precisa ser verificado.

Novos/alterados nesta rodada: `UpdateProfileRequest`, `ProfileController`, `PasswordController`, `PasswordResetController`, `StudentAccessController`, `routes/api.php`, `config/mail.php`, `DatabaseSeeder`, `ProfilePage.jsx`, `AccountSecurityReviewTest`, `StudentProfileTest`, modelos e guias HostGator, `prepare-package.ps1` e esta documentação.

Empacotamento por lista permitida, sem `.env` real, banco SQLite, logs, fotos privadas, cache local, Git, node_modules ou ferramentas de teste. Credenciais serão preenchidas somente no servidor. Teste da API usa sessão/cache em memória e chave temporária, não incluída no pacote. Não houve deploy, migrations em dados reais nem envio de e-mails.

Pendências: teste real do Apache/HTTPS/CSP, MySQL e concorrência, SMTP, permissões e teste visual em celular. Não houve pentest dinâmico completo. As configurações de servidor e textos jurídicos ainda precisam de validação antes de usar dados reais. Orientações de testes consultadas em https://laravel.com/framework/docs/http-tests e https://laravel.com/framework/docs/mocking.

## Resultado e escopo

Revisão estática direcionada do React/Vite, API Laravel 13.29.0/Sanctum 4.3.3, autenticação, rotas e autorizações, validações, uploads, configurações e preparação HostGator. Foram corrigidas falhas concretas sem executar migrations no banco local ou alterar produção. Não é certificação nem pentest do servidor publicado.

Arquitetura preservada: navegador → sessão Sanctum/CSRF → controladores e FormRequests → Eloquent → banco; imagens privadas entregues por rotas autenticadas. Senhas já usam Argon2id com migração de hashes bcrypt existentes. Mantida a política de senha previamente aprovada.

## Achados corrigidos

### Alto — links de recuperação sobreviviam à troca de senha autenticada

- Arquivo: `backend-laravel/app/Http/Controllers/Api/V1/Student/PasswordController.php`, método `update`, após exclusão das outras sessões.
- Cenário: alguém obtém um link de recuperação ainda válido; mesmo após o titular mudar a senha no perfil, o link continuava permitindo outra troca até expirar.
- Impacto: possível retomada da conta, condicionado à posse do token.
- Correção: excluir tokens do e-mail na mesma transação da alteração; regenerar a sessão com destruição do identificador anterior.
- Evidência: `StudentProfileTest::test_student_changes_password_only_with_current_password` agora cria um token antes da troca e verifica sua remoção; teste aprovado.

### Médio — sessão renovável sem prazo absoluto

- Arquivos: `SessionController::store`, `EnsureActiveUser::handle`, `config/session.php` e modelos de ambiente.
- Cenário: uma sessão capturada pode ser mantida ativa por requisições periódicas, renovando o limite de inatividade.
- Impacto: prolongamento indevido do acesso.
- Correção: instante de autenticação no servidor e limite absoluto configurável, padrão 720 minutos (12 horas); expiração invalida sessão, autenticação e token CSRF. Inatividade permanece em 120 minutos. Sessões anteriores recebem o marco na primeira requisição protegida após a atualização.
- Evidência: testes aprovados para sessão expirada, sessão recente e manutenção do marco original.

### Médio — HTML de produção sem CSP e HTTPS sem HSTS

- Arquivos: `SecurityHeaders::handle` e `backend-laravel/public/.htaccess`.
- Cenário: a API tinha CSP, mas o HTML estático podia ser servido diretamente pelo Apache sem as mesmas proteções. Ausência de CSP agrava uma eventual injeção, sem comprovar por si só XSS explorável.
- Correção: CSP em produção e para `index.html` estático, scripts somente da própria origem, proibição de objetos/embedding/base externa; HSTS somente em HTTPS; limite de corpo em 10 MiB; bloqueio de arquivos ocultos, dumps e backups na pasta pública; índice pelo PHP.
- Compatibilidade: `style-src-attr 'unsafe-inline'` permite somente atributos de estilo usados pelo React (barras/gráficos). Scripts inline e eval não foram liberados. Frames restritos aos players YouTube/Vimeo. Imagens HTTPS permanecem permitidas, com validação de miniaturas no backend.
- Evidência: teste de resposta HTML em ambiente production com CSP e HSTS aprovado. Regras Apache ainda exigem homologação no servidor; PHPUnit não executa Apache.

### Baixo — proteção insuficiente dos artefatos contra inclusão acidental no Git

- Arquivo: `.gitignore` da raiz.
- Cenário: pacotes, SQLite ou arquivos de ambiente poderiam ser adicionados ao versionamento por engano.
- Correção: ignorar releases, SQLite e ambientes sensíveis. Isso não remove arquivos já versionados nem substitui revisão de segredos.
- Evidência: no índice atual do backend, a consulta dos caminhos de ambiente, SQLite e storage encontrou apenas arquivos estruturais `.gitignore`; não foi encontrado `.env` no histórico consultado. Há nomes de SQLite em histórico antigo do framework; isso não comprova vazamento de dados deste aplicativo.

### Retificação — caminho do front controller de publicação

- Arquivo: `deployment/hostgator/public-index.php`, `$applicationPath`.
- A primeira revisão contou incorretamente os níveis de `dirname(__DIR__)`. Dois níveis a partir de `/home/USUARIO/public_html/app` já chegam a `/home/USUARIO`.
- A revisão 2 restaurou `dirname(__DIR__, 2)` após reproduzir a falha de inicialização no layout do pacote. Também adicionou `usePublicPath(__DIR__)` para servir o frontend da pasta correta.
- A validação sintática anterior não detectava esse defeito; a revisão 2 inclui execução do front controller empacotado.

## Verificações e resultados

- `php .tools/composer.phar show --direct --working-dir=backend-laravel`: versões instaladas conferidas.
- `php .tools/composer.phar audit --locked --working-dir=backend-laravel --format=json`: sem advisories ou pacotes abandonados reportados.
- `npm audit --json`: zero vulnerabilidades reportadas.
- As consultas inicialmente falharam por restrição de rede; foram repetidas com acesso autorizado e concluídas.
- `php artisan test`: 76 testes e 528 asserções aprovados após as correções principais.
- Após adicionar o caso SQL injection: `php artisan test --filter=SecurityDeploymentTest`: 6 testes e 17 asserções aprovados.
- Reexecução final da suíte completa, incluindo SQL injection: `php artisan test`: 77 testes e 530 asserções aprovados.
- Testes novos verificam também login sem CSRF (419), limitação de login (429) e busca com payload SQL sem ampliar resultados.
- A suíte existente cobre isolamento entre alunos, privilégio de professor, mass assignment, tokens expirados/uso único, revogação de sessões, consentimentos e uploads disfarçados/inválidos.
- `npm run lint` e `npm run build`: aprovados.
- `php vendor/bin/pint --dirty --format agent`: aprovado após ordenação de imports. Não houve refatoração ampla dos arquivos existentes.
- `php -l`: aprovado nos 121 arquivos PHP de app, config, routes e tests, além do front controller de publicação.
- Não há PHPStan/Psalm configurado; não se afirma análise estática de tipos. ESLint, inspeção de código e verificação sintática PHP foram realizados.

## Controles existentes revisados

- Eloquent usa parâmetros vinculados; nenhuma concatenação de entrada em SQL bruto foi identificada na busca dirigida.
- React renderiza texto sem `dangerouslySetInnerHTML`; localStorage contém apenas IDs de notificações lidas, não tokens de acesso.
- Uploads validam extensão, MIME detectado, dimensão e tamanho, recodificam JPEG e geram nomes UUID fora da pasta pública.
- Consultas de fotos validam aluno/avaliação/consentimento; execução valida sessão, aluno e exercício.
- Biblioteca limita provedores de vídeo e miniaturas; CEP consulta origem configurada com timeout.
- Mensagens de login/recuperação são genéricas; tokens de convite e confirmação têm hash; recuperação usa o broker Laravel.
- Não foi identificada configuração CORS personalizada com curinga e credenciais. A topologia prevista é mesma origem.

## Arquivos alterados nesta revisão

- `.gitignore`
- `backend-laravel/.env.example`
- `backend-laravel/config/session.php`
- `backend-laravel/app/Http/Controllers/Api/V1/Auth/SessionController.php`
- `backend-laravel/app/Http/Controllers/Api/V1/Student/PasswordController.php`
- `backend-laravel/app/Http/Middleware/EnsureActiveUser.php`
- `backend-laravel/app/Http/Middleware/SecurityHeaders.php`
- `backend-laravel/public/.htaccess`
- `backend-laravel/routes/web.php` (somente formatação de imports)
- `backend-laravel/tests/Feature/StudentProfileTest.php`
- `backend-laravel/tests/Feature/SecurityDeploymentTest.php`
- `deployment/hostgator/public-index.php`
- `deployment/hostgator/.env.homologation.example`
- `deployment/hostgator/.user.ini`
- `deployment/hostgator/README.md`
- `docs/publishing-hostgator-step-by-step.md`
- `releases/NAO-PUBLICAR-PACOTE-ANTIGO.md`
- este relatório.

## Pendências e limites

1. **Não publicar o ZIP de 15/09.** Ele continua preservado e contém o código antigo. Regenerar por cópia controlada, sem `.env`, SQLite, fotos, logs, caches locais ou ferramentas de desenvolvimento. Instalar dependências `--no-dev` e validar requisitos da plataforma no servidor. A auditoria não fez deploy.
2. Confirmar HTTPS/redirecionamento, suporte aos módulos Apache e leitura de `.user.ini`; testar respostas estáticas e API reais. CSP necessita teste visual com fotos, gráficos e players reais.
3. MySQL de produção não foi acessado: testar migrations/constraints e concorrência em homologação MySQL. A suíte usa SQLite em memória.
4. Nenhum teste de navegador autenticado/XSS dinâmico ou ataque de carga foi executado nesta revisão. Ausência de sink perigoso na inspeção não prova ausência absoluta de XSS.
5. Rever logs PHP/Laravel/Apache e sua retenção: URLs de convites e recuperação podem aparecer nos access logs; restringir acesso e evitar coleta de query strings/tokens. Backups também exigem controle de acesso.
6. Confirmar backup e restauração da APP_KEY/banco/fotos; definir retenção dos dados com o responsável jurídico.
7. Revisar privilégio MySQL: usar conta exclusiva do banco; se possível separar conta de migrations (DDL) da conta de execução (leitura/escrita necessárias).
8. O sistema foi projetado para um profissional administrador; não interpretar acesso de professores aos alunos como isolamento entre organizações. Uma expansão para múltiplos profissionais independentes exige autorização e modelagem próprias.
9. A política de inatividade depende do driver configurado no servidor; foi mantida, não simulada em uma sessão MySQL real.

## Segredos e rotação

Nenhum valor de segredo foi exibido. A inspeção não comprovou segredo publicado, portanto não há rotação obrigatória identificada por evidência nesta revisão. Se o ZIP antigo, logs ou arquivos de ambiente foram disponibilizados publicamente, avaliar exposição e rotacionar SMTP/MySQL/sessões conforme o conteúdo. Nunca trocar APP_KEY sem plano de recriptografia dos dados existentes.

## Referência

Usados como critérios de revisão os temas solicitados de ASVS/OWASP Top 10/API Security Top 10. Não foi realizada certificação de conformidade completa. APIs de sessão conferidas no framework instalado e na documentação oficial: https://api.laravel.com/docs/13.x/Illuminate/Support/Facades/Session.html.
