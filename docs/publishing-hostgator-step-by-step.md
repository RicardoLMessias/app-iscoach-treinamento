# Publicação segura na HostGator — passo a passo

Destino: `https://app.iscoach.com.br`  
Pacote: `releases/is-coach-hostgator-2026-11-10-v1-0-r27.zip`

> Pacote da versão 1.0, reconstruído e revisado em 10/11/2026, revisão 27, com caminhos compatíveis com Linux. Use somente este ZIP; os pacotes anteriores e os ZIPs de reparo permanecem obsoletos. Em atualização, preserve o banco, `.env`, APP_KEY e storage do servidor. Siga a seção "Atualização de uma instalação existente" do README incluído no ZIP; não repita os passos de instalação inicial abaixo.

## Antes de começar

Você precisará de:

- domínio `iscoach.com.br` registrado e apontado para a HostGator;
- plano HostGator ativo e acesso ao cPanel;
- usuário e senha principal do cPanel;
- FileZilla;
- senha de aplicativo do Gmail;
- acesso SSH habilitado pela HostGator;
- pacote completo ainda compactado em ZIP.

Não envie senhas por WhatsApp, e-mail ou captura de tela. Guarde a senha do banco, a senha de aplicativo do Gmail e a `APP_KEY` em um gerenciador de senhas.

## 1. Enviar o pacote completo

Não descompacte o pacote no Windows e não envie milhares de arquivos individualmente pelo FileZilla. Envie o arquivo único `is-coach-hostgator-2026-11-10-v1-0-r27.zip` para a raiz `app.iscoach.com.br` e extraia pelo Gerenciador de Arquivos do cPanel. A estrutura interna é:

```text
├── private/is-coach-backend/  # inclui .env.homologation.example
├── public_html/app/
├── docs/public-htaccess.template
└── README.md
```

Não altere os nomes `private/is-coach-backend` e `public_html/app`, pois o arquivo público de entrada já está configurado para essa estrutura. A extração no servidor evita falhas do Windows em caminhos longos. Em atualização, a extração mescla os arquivos; o pacote preserva o `.htaccess` que o cPanel gerencia e não contém `.env` real nem dados locais de `storage`.

## 2. Criar o subdomínio

1. Entre no cPanel da HostGator.
2. Procure por **Domínios**.
3. Selecione **Create A New Domain** ou **Criar um novo domínio**.
4. Digite `app.iscoach.com.br`.
5. Deixe desmarcada a opção **Share document root**.
6. No document root, informe `app.iscoach.com.br/public_html/app`, conforme a estrutura de extração deste pacote. Em uma instalação existente, mantenha o document root já configurado.
7. Confirme a criação.

Se o DNS do domínio estiver na HostGator, o registro normalmente será criado junto. Caso o DNS esteja em outro provedor, crie um registro `A` para `app` apontando para o IP da hospedagem.

Pode haver um período de propagação antes de o subdomínio abrir.

## 3. Ativar e conferir o HTTPS

No Portal do Cliente ou cPanel, abra a área de SSL e confirme que `app.iscoach.com.br` está protegido. Só prossiga com o teste de login quando o endereço abrir com `https://` e sem alerta de certificado.

Não ignore avisos de “site não seguro”. Senhas e cookies nunca devem ser testados sem HTTPS em produção.

## 4. Criar o banco MySQL

1. No cPanel, procure **Manage My Databases**, **MySQL Databases** ou **Gerenciar banco de dados**.
2. Crie um banco, por exemplo `iscoach`.
3. Crie um usuário exclusivo, por exemplo `iscoach_app`.
4. Gere uma senha longa e aleatória.
5. Adicione o usuário ao banco.
6. Conceda **All Privileges** para esse usuário nesse banco.
7. Anote os nomes completos exibidos pelo cPanel. Eles geralmente recebem o prefixo da conta, como `usuario_iscoach` e `usuario_iscoach_app`.

Não reutilize a senha do cPanel ou do Gmail no banco.

## 5. Habilitar o SSH

Nos planos compartilhados da HostGator, incluindo o Turbo, solicite ao suporte a habilitação do SSH. O SSH será usado para criar a chave da aplicação, montar as tabelas e criar o professor.

Depois da liberação, use o servidor, usuário e senha principal informados pela HostGator. Nos planos compartilhados, a porta SFTP indicada atualmente é `2222`.

## 6. Configurar o FileZilla com SFTP

1. Abra **Arquivo > Gerenciador de Sites**.
2. Crie um novo site chamado `IS Coach - HostGator`.
3. Em protocolo, escolha **SFTP — SSH File Transfer Protocol**.
4. Em host, use o nome do servidor da HostGator, por exemplo `brXX.hostgator.com.br`. O nome correto aparece nos dados do plano.
5. Porta: `2222`.
6. Tipo de logon: **Normal** ou **Perguntar a senha**.
7. Usuário: usuário principal do cPanel.
8. Senha: senha do cPanel.
9. Conecte.

Na primeira conexão, confira se o host exibido é o servidor informado pela HostGator antes de aceitar a chave. Prefira não salvar a senha; se salvar, proteja as senhas do FileZilla com uma senha mestra.

No FileZilla, ative **Servidor > Forçar a exibição de arquivos ocultos** para verificar e preservar o `.htaccess` existente.

## 7. Conferir os arquivos privados

Depois de extrair o ZIP na raiz `app.iscoach.com.br`, confira pelo cPanel:

O resultado remoto deve ser:

```text
/home/USUARIO/app.iscoach.com.br/private/is-coach-backend/artisan
/home/USUARIO/app.iscoach.com.br/private/is-coach-backend/app
/home/USUARIO/app.iscoach.com.br/private/is-coach-backend/vendor
/home/USUARIO/app.iscoach.com.br/private/is-coach-backend/storage
```

Não coloque `is-coach-backend` dentro de `public_html`.

## 8. Conferir os arquivos públicos

Abra `public_html/app` no Gerenciador de Arquivos do cPanel e confira:

O resultado remoto deve conter diretamente:

```text
public_html/app/.htaccess
public_html/app/.user.ini
public_html/app/index.php
public_html/app/index.html
public_html/app/assets/
public_html/app/images/
```

O ZIP não contém `public_html/app/.htaccess`, para não sobrescrever a versão de PHP gerenciada pelo cPanel. Em uma instalação nova, configure PHP 8.5 no Gerenciador de MultiPHP e mescle as regras de `docs/public-htaccess.template` ao `.htaccess` criado pelo cPanel. Em atualização, preserve o arquivo existente. Depois de confirmar a extração, exclua apenas o arquivo ZIP enviado ao servidor.

## 9. Criar o `.env` no servidor

1. Envie `.env.homologation.example` para `/private/is-coach-backend`.
2. Renomeie o arquivo para `.env`.
3. Pelo Gerenciador de Arquivos do cPanel, edite o `.env`.
4. Preencha os campos abaixo com os valores reais:

```dotenv
APP_URL=https://app.iscoach.com.br
FRONTEND_URL=https://app.iscoach.com.br
SANCTUM_STATEFUL_DOMAINS=app.iscoach.com.br

DB_HOST=localhost
DB_DATABASE=nome_completo_do_banco
DB_USERNAME=nome_completo_do_usuario
DB_PASSWORD="senha-forte-do-banco"

MAIL_USERNAME=contato.igorpersonal@gmail.com
MAIL_PASSWORD="senha-de-aplicativo-sem-espacos"
MAIL_FROM_ADDRESS=contato.igorpersonal@gmail.com
```

Mantenha:

```dotenv
APP_ENV=production
APP_DEBUG=false
SESSION_SECURE_COOKIE=true
SESSION_PATH=/
```

Na primeira instalação, deixe `APP_KEY=` vazio por enquanto. Ela será gerada no próximo passo. Em atualizações, preserve a chave e o `.env` existentes.

Após salvar, ajuste a permissão do `.env` para `600`, se o cPanel permitir. Nunca coloque esse arquivo em `public_html`.

## 10. Preparar o Laravel por SSH

Conecte por SSH ou use o Terminal do cPanel, se ele estiver disponível. Execute um comando por vez:

```bash
cd ~/app.iscoach.com.br/private/is-coach-backend
php -v
php artisan key:generate
php artisan migrate --force
```

O comando `/opt/cpanel/ea-php85/root/usr/bin/php -v` verifica apenas o PHP do terminal. Confirme também a versão PHP efetiva do site no navegador; o lock exige no mínimo PHP 8.4.1. Se o site mostrar PHP 8.3, ajuste `app.iscoach.com.br` no Gerenciador de MultiPHP e confira o PHP-FPM antes de continuar. Execute `key:generate` somente na primeira instalação, nunca em atualização de uma base existente.

Depois carregue os documentos e exercícios iniciais:

```bash
php artisan db:seed --class=LegalDocumentsSeeder --force
php artisan db:seed --class=MuscleGroupSeeder --force
php artisan db:seed --class=RequestedExerciseLibrarySeeder --force
php artisan db:seed --class=DanielaOliveiraExerciseLibrarySeeder --force
```

Use os seeders explícitos acima. O seeder padrão agora bloqueia a conta de teste em produção; fora de produção ainda cria dados de desenvolvimento.

Crie o professor:

```bash
php artisan coach:create-professor contato.igorpersonal@gmail.com --name="Igor Santos"
```

O terminal solicitará a senha sem mostrá-la na tela. Use uma senha exclusiva, longa e com maiúscula, minúscula, número e símbolo.

Finalize:

```bash
chmod 750 storage bootstrap/cache
chmod 600 .env
php artisan config:clear
php artisan config:cache
php artisan view:cache
```

Na preparação do novo pacote, instale as dependências de produção com `composer install --no-dev --optimize-autoloader` e valide `composer check-platform-reqs --no-dev` no servidor. Não copie caches locais de `bootstrap/cache` nem conteúdo local de `storage`. Envie `deployment/hostgator/.user.ini` para `public_html/app/.user.ini`; ele desabilita erros públicos e limita uploads. As permissões devem permitir escrita ao processo PHP sem liberar escrita para outros usuários; confirme isso no painel, sem aplicar `777`.

## 11. Testar a instalação

Teste nesta ordem:

1. Abra `https://app.iscoach.com.br/api/v1/health`.
2. Confirme que aparece `status: ok`.
3. Abra `https://app.iscoach.com.br`.
4. Entre com o professor.
5. Crie um convite usando um e-mail de teste controlado por você.
6. Confirme o recebimento do e-mail.
7. Conclua o primeiro acesso do aluno.
8. Teste CEP, consentimentos, treino, avaliação, alimentação e foto.
9. Teste logout e recuperação de senha.
10. Repita os principais fluxos em Android e iPhone.

Para a demonstração ao cliente, use somente dados fictícios. Não coloque dados reais de saúde antes da revisão jurídica dos termos e da autorização do cliente.

## 12. Se ocorrer erro

### Erro 500

- confira `APP_KEY`, banco e permissões de `storage`;
- consulte `private/is-coach-backend/storage/logs/laravel.log`;
- não ative `APP_DEBUG=true` em um endereço público;
- copie apenas a mensagem necessária, removendo dados pessoais antes de compartilhar.

### Página abre, mas login ou API falha

- confirme `APP_URL`, `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS`;
- confirme HTTPS;
- confirme que o `.htaccess` existente foi preservado e que o domínio usa PHP 8.5 no Gerenciador de MultiPHP;
- confirme que `public_html/app/index.php` aponta para `private/is-coach-backend`.

### Banco não conecta

- use os nomes completos com prefixo do cPanel;
- confira se o usuário foi adicionado ao banco com privilégios;
- tente `DB_HOST=localhost`;
- limpe e refaça o cache com `php artisan config:clear` e `php artisan config:cache`.

### E-mail não chega

- retire espaços da senha de aplicativo no `.env`;
- confira porta `587`, TLS e endereço Gmail;
- verifique spam;
- limpe o cache de configuração após alterar o `.env`.

## 13. Backup e operação segura

Antes de cada atualização futura:

1. gere um backup no cPanel;
2. exporte o MySQL;
3. copie `storage/app/private`;
4. mantenha uma cópia segura da `APP_KEY` fora da hospedagem;
5. nunca substitua o `.env` por uma versão local;
6. teste a nova versão antes de liberar aos alunos.

A rotina automática da hospedagem não substitui um backup próprio e testado.

## Referências oficiais

- [Criar subdomínio na HostGator](https://suporte.hostgator.com.br/hc/pt-br/articles/30814940779283-Como-adicionar-subdom%C3%ADnios-na-hospedagem)
- [Criar banco de dados no cPanel](https://suporte.hostgator.com.br/hc/pt-br/articles/30813397059987-Como-criar-um-banco-de-dados-no-cPanel)
- [Habilitar SSH](https://suporte.hostgator.com.br/hc/pt-br/articles/30814927583379-Como-habilitar-o-acesso-SSH-no-plano-de-hospedagem)
- [Usar SFTP no FileZilla](https://suporte.hostgator.com.br/hc/pt-br/articles/30811326950291-Como-usar-SFTP-no-FileZilla-para-acessar-sua-hospedagem)
- [Enviar arquivos com FileZilla](https://suporte.hostgator.com.br/hc/pt-br/articles/30817062131091-Como-enviar-arquivos-para-a-hospedagem-com-o-FileZilla)
- [Fazer backup completo](https://suporte.hostgator.com.br/hc/pt-br/articles/30813484137491-Como-fazer-um-backup-completo-da-hospedagem)
