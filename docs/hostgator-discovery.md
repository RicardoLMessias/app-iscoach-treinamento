# Levantamento técnico da HostGator

Preencher com informações do painel ou suporte da hospedagem. Não registrar
senhas, tokens ou chaves neste arquivo.

## Conta e plano

- Nome exato do plano: HostGator Turbo (informado pelo cliente; validar no painel)
- Painel utilizado (cPanel ou outro): cPanel, conforme documentação oficial
- Domínio principal:
- Subdomínio de homologação disponível: domínio ainda não adquirido

## Runtime

- Versão PHP informada: 8.5, confirmada pela documentação oficial atual; validar conta após ativação
- Extensões PHP disponíveis:
- Limite de memória do PHP:
- Tempo máximo de execução:
- Tamanho máximo de upload:
- Acesso SSH: disponível, mas exige habilitação pelo suporte nos planos compartilhados
- Composer disponível: sim / não
- Cron disponível: sim, com intervalo mínimo de 15 minutos

## Publicação

- É possível apontar o document root para `backend/public`: sim / não
- É possível executar comandos de build Node no servidor: sim / não
- Estratégia prevista para publicar o build React:
- Estratégia prevista para tarefas agendadas Laravel:

## Banco

- MySQL ou MariaDB: MySQL, conforme documentação oficial; validar servidor da conta
- Versão: 5.7 em servidores CentOS ou 8.0 em AlmaLinux; validar no painel
- Limite de bancos: ilimitados, sujeito aos recursos do plano
- Limite de tamanho:
- Acesso remoto permitido: sim / não

## Arquivos, backup e e-mail

- Espaço total disponível: 150 GB NVMe; limite de 500 mil inodes
- Política de backup da HostGator: cópias diárias, semanais e mensais; manter cópia externa própria
- Restauração incluída ou paga: solicitar confirmação ao suporte
- SMTP previsto: Gmail
- Limite de envios por hora/dia:
- Endereço remetente previsto:
- Senha de aplicativo: disponível; valor não registrado

O Gmail será configurado por credencial exclusiva de aplicação ou OAuth, nunca
pela senha normal da conta. A credencial ficará somente no `.env` do Laravel.
Os limites e a confiabilidade do Gmail serão reavaliados se o volume de alunos
ou de mensagens crescer.

## Validações necessárias

- O plano atende aos requisitos atuais do Laravel escolhido.
- O diretório de arquivos privados não fica exposto pela web.
- O SSL cobre produção e homologação.
- Existe estratégia verificável de backup do banco e dos arquivos.

## Configuração inicial proposta para uploads

Valores sujeitos à confirmação dos limites efetivos da conta:

- `memory_limit`: mínimo de 256 MB; desejável 512 MB para processamento de imagens.
- `upload_max_filesize`: 16 MB.
- `post_max_size`: 20 MB.
- Limite da aplicação para foto: 5 MB por arquivo antes da compressão.
- Limite da aplicação para PDF: 10 MB por arquivo.
- Tempo máximo pretendido para requisições de upload: 60 segundos.

Os limites do Laravel serão menores ou iguais aos limites do PHP. Fotos serão
validadas, redimensionadas e comprimidas; PDFs serão validados por tamanho,
extensão e MIME antes de serem armazenados fora da pasta pública.

## Estratégia proposta para a pasta pública

Manter o projeto Laravel fora de `public_html` e expor apenas o conteúdo da
pasta `backend/public`. A opção preferida é configurar o document root do
domínio para essa pasta. Se o plano não permitir alterar a raiz do domínio
principal, `public_html` conterá somente os arquivos públicos e um front
controller com caminhos ajustados para o Laravel privado. O código, `.env`,
`vendor`, storage privado e banco nunca ficarão diretamente acessíveis pela web.
