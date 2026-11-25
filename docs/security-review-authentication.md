# Revisão de segurança — autenticação e cadastro

Data: 2026-09-06

## Controles verificados e reforçados

- Autenticação por sessão Laravel/Sanctum com cookie HttpOnly e CSRF.
- Renovação do identificador da sessão após login e invalidação no logout.
- Limites independentes de tentativas por conta e por endereço IP.
- Mensagem genérica para credenciais inválidas, conta inexistente ou inativa.
- Normalização dos e-mails antes da autenticação e recuperação.
- Senhas novas entre 15 e 128 caracteres, sem truncamento silencioso.
- Tokens de convite aleatórios, armazenados como hash, com 64 caracteres, uso único e expiração.
- Recuperação com resposta genérica e tempo mínimo uniforme para reduzir enumeração por tempo.
- Token de recuperação com expiração de 30 minutos e uso único pelo broker do Laravel.
- Revogação das sessões anteriores após redefinição de senha ou desativação da conta.
- Notificação por e-mail após alteração de senha.
- Cadastro inicial e consentimentos gravados em uma única transação.
- Bloqueio de reenvio do cadastro inicial depois de concluído.
- Cabeçalhos `no-store`, `no-referrer`, CSP, proteção contra MIME sniffing e enquadramento.
- Campos sensíveis do perfil armazenados criptografados.

## Verificação automatizada

- Testes de sucesso, falha, força bruta, limites de entrada, expiração e uso único.
- Testes de autorização entre professor e aluno.
- Teste de revogação de sessões após redefinição e desativação.
- Auditoria npm de dependências de produção sem vulnerabilidades conhecidas.

## Pendência operacional

- Executar `composer audit --locked` assim que o Composer estiver instalado no ambiente de desenvolvimento e antes de cada publicação.
- Confirmar HTTPS, `APP_DEBUG=false`, cookie `Secure` e domínio final no ambiente HostGator.
- Avaliar MFA para a conta do professor em uma etapa futura.
