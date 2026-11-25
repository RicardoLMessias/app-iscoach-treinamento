# Etapa 2 — fundação técnica

## Estado

Implementada em 27/08/2026. A aprovação final depende da validação da conta
MySQL real na HostGator quando ela estiver disponível.

## Backend

- Laravel 13.29 com suporte a PHP 8.5.
- API versionada sob `/api/v1`.
- Endpoint de saúde em `/api/v1/health`.
- Respostas JSON para rotas da API.
- Middleware global com headers básicos de segurança.
- Timezone `America/Sao_Paulo` e locale `pt_BR`.
- Configuração de produção com debug desativado.
- Sessões criptografadas e cookies seguros previstos no ambiente de produção.
- Gmail preparado como SMTP, sem credenciais registradas no repositório.

## Banco

- MySQL definido no `.env.example` como banco oficial.
- Migrations técnicas iniciais para usuários, cache e jobs.
- SQLite utilizado exclusivamente para validação local enquanto o MySQL da
  hospedagem não está disponível.
- Nenhuma tabela funcional dos módulos foi antecipada nesta etapa.

## Frontend

- Proxy do Vite atualizado para a API Laravel na porta 8000.
- Cliente HTTP preparado para respostas e erros do Laravel.
- Protótipo visual da Etapa 1 preservado.

## Segurança

- `.env` fora do versionamento.
- Segredos não expostos ao Vite.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e
  `Permissions-Policy` aplicados.
- API com `Cache-Control: no-store` e CSP restritiva.
- Auditorias do Composer e npm sem vulnerabilidades conhecidas.

## Validações concluídas

- Testes Laravel aprovados.
- Formatação PHP aprovada pelo Laravel Pint.
- Migrations técnicas executadas em banco local isolado.
- ESLint e build de produção do frontend aprovados.
- Comunicação pelo proxy Vite → Laravel aprovada.

## Pendências externas

- Criar banco e usuário MySQL na HostGator.
- Confirmar versão efetiva do MySQL.
- Confirmar extensões PHP exigidas pelo Laravel, principalmente Fileinfo,
  PDO MySQL, Mbstring, OpenSSL, Tokenizer, XML e cURL.
- Habilitar SSH e confirmar Composer na hospedagem.
- Adquirir e configurar o domínio antes da publicação.

## Próxima etapa

Etapa 3 — autenticação: convite, login, logout, recuperação de senha,
autorização por papel e desativação de acesso.
