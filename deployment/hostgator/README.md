# Publicação na HostGator

> Pacote da versão 1.0: `is-coach-hostgator-2026-11-17-v1-0-r32.zip`. Não use os ZIPs anteriores. Este pacote foi reconstruído do zero com caminhos compatíveis com Linux, inclui dependências de produção completas, sem dados locais e sem credenciais.

Esta revisão mostra ao aluno os treinos na ordem em que o professor os criou, começando pelo próximo da sequência; com dias fixos, a lista começa pelo treino de hoje e os dias de cada treino aparecem de segunda a domingo. A migração `2026_11_17_123534_sort_workout_plan_weekdays_in_week_order.php` apenas reordena os dias já salvos em cada treino, sem alterar colunas nem apagar dados; execute `migrate --force`. Também inclui ajustes de segurança: rotas protegidas respondem 401 a visitantes sem sessão, a API só aceita leitura entre origens pelo endereço do próprio app (`FRONTEND_URL` no `.env`, que deve ser `https://app.iscoach.com.br`) e a rota `/storage` do Laravel foi desligada. Execute `config:cache` após o envio. A revisão r31 está incluída integralmente.

Esta revisão separa a lista de alunos do professor nas abas Ativos e Desativados, cada uma com a sua contagem. Ao desativar um aluno, ele sai da lista de ativos e passa para a de desativados; ao reativar, volta. O seletor de aluno continua mostrando todos. Não há migração nova; a revisão r30 está incluída integralmente.

Esta revisão reposiciona o feedback semanal na visão geral do professor: o cartão fica abaixo dos indicadores, na coluna ao lado das atividades recentes; ao expandir Pendentes ou Respondidos, ele ocupa a largura do painel e as atividades recentes e "Precisam de atenção" descem, com animação suave ao abrir e ao recolher. Não há migração nova; a revisão r29 está incluída integralmente.

Esta revisão completa a correção das folhas em branco nos PDFs gerados no iPhone. O iOS ignora as margens e o tamanho de página definidos pelo app, então as páginas dos relatórios passam a ter altura ajustada ao conteúdo nesse sistema, com quebra antes de cada página. Android e computador não mudam. Não há migração nova; a revisão r28 está incluída integralmente.

Esta revisão corrige a impressão da avaliação física no Safari, que acrescentava folhas vazias entre as páginas. Avaliações avulsas com apenas peso, altura, pressão arterial e frequência cardíaca, sem fotos nem outras medidas, agora geram uma única página; fotos não enviadas deixam de criar uma página extra na avaliação avulsa. A revisão anterior r27 está incluída integralmente neste pacote. Estas mudanças no PDF não exigem migração adicional.

Esta revisão coloca o feedback semanal no topo da visão geral do professor e permite marcar cada resposta como vista. O aluno recebe o aviso no sino somente após essa confirmação; um novo envio não reexibe avisos antigos. A migração `2026_11_10_182753_add_review_to_weekly_feedbacks_table.php` acrescenta `reviewed_at` e `reviewed_by` à tabela existente, sem apagar respostas. Depois de extrair o pacote, execute `migrate --force` antes de abrir o painel.

Esta revisão corrige os nomes longos dos índices MySQL nas migrações de avaliação avulsa e lembretes. Se a migração de `external_assessments` falhou após criar a tabela, execute `migrate --force` novamente após extrair este pacote: ela concluirá o índice sem apagar a tabela. Confira `migrate:status` ao final. Não execute `migrate:fresh`, `migrate:refresh` ou `db:wipe`.


Esta revisão inclui o feedback semanal obrigatório do aluno, histórico e comparação no painel do professor, resumo de pendentes e respondidos no feed e aviso manual por e-mail e no app. Também permite gerar PDF de avaliação avulsa com fotos opcionais e autorização verbal, sem criar novos registros dessa avaliação no banco. As novas migrações criam as tabelas de feedback e lembretes; as tabelas de avaliação avulsa preservam compatibilidade de leitura com registros anteriores. Nenhuma migração desta revisão apaga alunos, treinos ou avaliações existentes.

O comando `weekly-feedback:remind` está incluído, mas o envio automático às segundas-feiras às 7h só funcionará após configurar o agendamento na hospedagem. Esta publicação não ativa o cron da hospedagem. O aviso manual do professor funciona pela interface após a publicação e configuração do e-mail.
Esta revisão identifica o aplicativo como versão 1.0 e inclui o guia para adicionar o site à tela inicial, o aviso opcional de instalação e a opção de manter a sessão conectada por 30 dias. O número de versão aparece em Sobre o app para aluno e professor. As migrações da revisão atual estão incluídas neste pacote.

Esta versão acrescenta a prescrição de séries por tempo, com cronômetro de execução independente do descanso, registro da duração efetiva, histórico e PDF. A migração `2026_10_16_205121_add_timed_sets_to_workouts.php` apenas adiciona colunas; treinos existentes continuam no modo de repetições. Também inclui quatro séries como padrão para exercícios novos, cadastro próprio de cardio e vacuum na biblioteca e seleção como atividades complementares, ajustes de layout para celulares, paginação dos alunos, feed do professor no celular, página Sobre o app para ambos os perfis e a correção do início do treino em dia de descanso. Tudo está descrito na aba Atualizações do professor.

Esta versão separa exercícios e mobilidades na biblioteca e na prescrição do professor. O aluno vê um selo animado de mobilidade e uma aba própria dentro do treino. O PDF do programa mostra exercícios e mobilidades em seções e contagens distintas; a aba de atualizações do professor também registra a mudança. A migração `2026_10_09_100000_add_category_to_exercises_and_workout_snapshots.php` acrescenta a categoria com valor padrão `exercise` aos registros existentes, sem apagar exercícios, treinos ou sessões. Execute somente `migrate --force` após fazer backup; não use `migrate:fresh`, `migrate:refresh` ou `db:wipe`.

Na revisão anterior, as sete dobras passaram a poder ser calculadas sem bloqueio por idade, com aviso de cautela quando a idade estiver fora da faixa original do protocolo. O aluno vê um destaque quando o professor inclui orientação no exercício. Os históricos do aluno e do professor mostram treinos em andamento, separados dos finalizados, com horário de início e séries concluídas. Também foram corrigidos alinhamento e proporções do formulário de treino e das telas de treino e histórico. Essas mudanças anteriores não exigiram migração nova.

Revisões anteriores incluíram a indicação dos campos obrigatórios, receitas opcionais nas substituições alimentares e receitas dos alimentos e substituições no PDF nutricional. Também permitem salvar como novo modelo enquanto o professor revisa um plano alimentar, sem publicar a revisão automaticamente. Nenhuma migração nova de banco de dados foi necessária para esses campos, pois as refeições já são armazenadas em JSON.

O professor pode enviar uma miniatura própria ao cadastrar ou editar um exercício (JPG, PNG ou WebP, recomendação 1280 × 720 px). Ela aparece na lista de treino e como capa antes da reprodução do vídeo; o arquivo é convertido para JPEG 960 × 540 e armazenado em `storage/app/private/exercise-thumbnails`. O professor também pode salvar um treino revisado como novo modelo, sem salvar automaticamente a revisão do treino do aluno. Essas duas mudanças anteriores não exigiram migração nova. Preserve todo o `storage` privado em futuras atualizações.

## Atualização de uma instalação existente

Faça backup do banco, do `.env`, da `APP_KEY`, das fotos privadas e do `.htaccess` antes do envio. Substitua somente o código de `private/is-coach-backend` e os arquivos de `public_html/app`, preservando o `.env`, `storage` e o `.htaccess` existentes. Não copie `.env.homologation.example` sobre o `.env` atual, não gere outra `APP_KEY`, não limpe o banco e não execute os seeders novamente. Antes de executar Artisan, confirme no navegador que o PHP do site é 8.5; `php -v` no terminal verifica somente o CLI. Depois do upload completo, no diretório `private/is-coach-backend`, execute com o PHP 8.5 da hospedagem:

```bash
/opt/cpanel/ea-php85/root/usr/bin/php artisan optimize:clear
/opt/cpanel/ea-php85/root/usr/bin/php artisan migrate --force
/opt/cpanel/ea-php85/root/usr/bin/php artisan config:cache
/opt/cpanel/ea-php85/root/usr/bin/php artisan view:cache
```

Confirme `/api/v1/health`, faça login e teste um treino em andamento nos históricos do aluno e do professor, um exercício com orientação e a criação de avaliação com sete dobras para um aluno fora da antiga faixa etária. Confira o alinhamento do formulário de treino no PC e no celular. Teste também a miniatura personalizada na biblioteca e na tela do aluno, a reprodução do vídeo, a remoção/substituição da miniatura, o salvamento de um modelo durante a revisão de um treino e as receitas dos planos alimentares em seus PDFs. Cadastre uma mobilidade, vincule-a a um treino e confirme a aba do aluno, o selo e a separação no PDF do programa. Prescreva uma prancha de 4 séries de 30 segundos, execute uma série, confira o tempo realizado no histórico e a meta no PDF. Verifique cardio e vacuum como complementares, a paginação dos alunos, o feed no celular e o início de treino em dia de descanso. Os passos de instalação inicial abaixo não devem ser repetidos em uma atualização.

O ZIP não inclui `public_html/app/.htaccess`: a extração preserva o arquivo e o handler gerenciados pelo cPanel. Antes de atualizar, selecione explicitamente PHP 8.5 para `app.iscoach.com.br` no Gerenciador de MultiPHP e confira o PHP-FPM do domínio, se estiver ativo. O `AddHandler` no `.htaccess` não substitui essa configuração. O modelo `docs/public-htaccess.template` contém apenas regras de segurança e roteamento para uma instalação nova; mescle essas regras ao `.htaccess` criado pelo cPanel, sem apagar o bloco de PHP dele.

Este modelo publica o aplicativo em `https://app.iscoach.com.br` e mantém o Laravel fora da pasta pública.

## Estrutura esperada na hospedagem

```text
raiz-da-conta/
├── private/
│   └── is-coach-backend/       # Laravel, vendor, .env e storage privado
└── public_html/
    └── app/                     # raiz pública configurada para o subdomínio
```

Não envie o `.env` local nem `database.sqlite`. O pacote de homologação contém um modelo sem senhas.

## Configuração

1. Envie o conteúdo de `private/is-coach-backend` para a pasta privada correspondente.
2. Envie o conteúdo de `public_html/app` para a pasta pública e configure essa pasta como document root de `app.iscoach.com.br` no cPanel.
3. Copie `.env.homologation.example` para `private/is-coach-backend/.env` e preencha domínio, MySQL e Gmail diretamente no servidor.
4. Apenas na primeira instalação, gere uma chave exclusiva com `php artisan key:generate` no servidor. Em atualizações, preserve o `.env`, a APP_KEY e o storage existentes. Faça backup antes de atualizar.
5. Execute `php artisan migrate --force`.
6. Execute somente os seeders aprovados:

```bash
php artisan db:seed --class=LegalDocumentsSeeder --force
php artisan db:seed --class=MuscleGroupSeeder --force
php artisan db:seed --class=RequestedExerciseLibrarySeeder --force
php artisan db:seed --class=DanielaOliveiraExerciseLibrarySeeder --force
```

7. Crie o professor sem registrar a senha no terminal:

```bash
php artisan coach:create-professor contato.igorpersonal@gmail.com --name="Igor Santos"
```

8. Execute `php artisan config:cache` e `php artisan view:cache`.
9. Confirme permissão de escrita em `storage` e `bootstrap/cache`.
10. Acesse `https://app.iscoach.com.br/api/v1/health` e confirme o retorno `status: ok`.

O Gmail usa `MAIL_SCHEME=smtp`, porta `587` e `MAIL_REQUIRE_TLS=true` (STARTTLS obrigatório). Não use `MAIL_SCHEME=tls`. Execute `composer check-platform-reqs --no-dev` no servidor quando Composer estiver disponível. Use PHP 8.5 tanto no site quanto no terminal (lock exige ao menos 8.4.1), PDO MySQL, GD e suporte Argon2id. Nunca envie a pasta `private` para dentro de `public_html`. O layout precisa corresponder ao acima; caso o cPanel use outro caminho, ajuste `index.php` antes de publicar.

O ZIP não está instalado automaticamente: configure MySQL, SMTP, HTTPS, permissões e o document root. Não extraia o ZIP inteiro dentro da pasta pública. Use FileZilla com SFTP, se disponível, ou FTP explícito sobre TLS. Sem SSH/Terminal, peça ao suporte para executar Artisan; não crie um instalador PHP público.

## Validação obrigatória

- HTTPS ativo e sem alertas.
- Login e logout.
- Convite por e-mail e primeiro acesso.
- Recuperação de senha.
- CEP.
- Upload e visualização autorizada de fotos.
- Criação, execução e histórico de treino.
- Avaliação física e plano alimentar.
- Teste em Android e iPhone.

Antes de atualizar a produção, faça backup do banco, do `.env`, da `APP_KEY` e das fotos privadas. O pacote não substitui esses dados persistentes.
