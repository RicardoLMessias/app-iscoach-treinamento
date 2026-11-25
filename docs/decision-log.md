# Registro de decisões

Este arquivo registra decisões técnicas e funcionais sem substituir a
especificação oficial.

| ID | Data | Decisão | Estado | Origem |
|---|---|---|---|---|
| DEC-001 | 2026-08-27 | A aplicação será web responsiva e mobile-first. | Aprovada | Especificação v1.0 |
| DEC-002 | 2026-08-27 | O frontend utilizará React com Vite. | Aprovada | Cliente |
| DEC-003 | 2026-08-27 | O backend utilizará Laravel/PHP. | Aprovada | Cliente |
| DEC-004 | 2026-08-27 | A persistência utilizará MySQL. | Aprovada | Cliente |
| DEC-005 | 2026-08-27 | A publicação será realizada na HostGator. | Aprovada | Cliente |
| DEC-006 | 2026-08-27 | Haverá um profissional administrador e alunos somente por convite. | Aprovada | Especificação v1.0 |
| DEC-007 | 2026-08-27 | A especificação v1.0 é a fonte oficial do escopo. | Aprovada | Cliente |
| DEC-008 | 2026-08-27 | Frontend e API no mesmo domínio, com API sob `/api`. | Proposta, depende da hospedagem | Arquitetura técnica |
| DEC-009 | 2026-08-27 | Autenticação SPA com Laravel Sanctum e sessão por cookie. | Proposta, depende da DEC-008 | Arquitetura técnica |
| DEC-010 | 2026-08-27 | O plano contratado informado pelo cliente é o HostGator Turbo. | Aprovada, validar no painel | Cliente |
| DEC-011 | 2026-08-27 | O domínio ainda não foi adquirido. | Pendente | Cliente |
| DEC-012 | 2026-08-27 | A hospedagem informa PHP 8.5; a versão efetiva deverá ser conferida no cPanel após a ativação. | Confirmada documentalmente | Cliente/HostGator |
| DEC-013 | 2026-08-27 | As imagens enviadas definem o design das telas de aluno: home, treino, execução, dieta, avaliação e evolução. | Aprovada | Cliente |
| DEC-014 | 2026-08-27 | O domínio será adquirido após a regularização do pagamento. | Pendente, não bloqueia planejamento local | Cliente |
| DEC-015 | 2026-08-27 | A aba Perfil será criada a partir do sistema visual das telas aprovadas. | Aprovada | Cliente |
| DEC-016 | 2026-08-27 | O envio de e-mails utilizará uma conta Gmail. | Aprovada; configuração segura pendente | Cliente |
| DEC-017 | 2026-08-27 | A senha de aplicativo do Gmail já está disponível e não será registrada no repositório. | Confirmada | Cliente |
| DEC-018 | 2026-08-27 | A fundação utilizará Laravel 13, compatível com PHP 8.5 e com suporte de segurança vigente. | Implementada | Arquitetura técnica |
| DEC-019 | 2026-08-27 | SQLite será usado somente na validação local até o MySQL da HostGator estar disponível. | Temporária | Arquitetura técnica |
| DEC-020 | 2026-09-15 | A aplicação será publicada na raiz do subdomínio `app.iscoach.com.br`, substituindo o endereço planejado em `/istreinamento`. | Aprovada | Cliente |

## Controle de mudanças

Uma nova tela, regra, cálculo, integração ou comportamento não descrito na
especificação será registrado como solicitação de mudança antes de qualquer
implementação.
