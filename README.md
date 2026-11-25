# IS COACH TREINAMENTO

Aplicação mobile-first com frontend React + Vite, API Laravel e banco MySQL.

> Versão atual do código: 1.0.0. Consulte a documentação principal para conhecer
> os módulos implementados, a instalação e as orientações de publicação.

## Estrutura

- `frontend/`: interface React, componentes, páginas, serviços e estilos.
- `backend-laravel/`: API oficial em Laravel 13.
- `backend/`: base PHP preliminar preservada temporariamente até o processo local
  antigo ser encerrado; não é o backend oficial.
- `docs/`: decisões de arquitetura e documentação futura.

## Desenvolvimento

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend Laravel

```bash
cd backend-laravel
php artisan serve
```

Em desenvolvimento, o frontend encaminha `/api` para a aplicação Laravel em
`http://127.0.0.1:8000`.

## Segurança

- Segredos pertencem somente ao `backend/.env` e nunca ao frontend.
- Variáveis `VITE_*` são públicas e não devem conter credenciais.
- A API Laravel concentrará autenticação, autorização, validação, cálculos e acesso ao MySQL.
- Autenticação e persistência serão implementadas apenas nas etapas previstas no plano aprovado.

## Planejamento

- [Documentação completa do sistema](docs/system-documentation.md)
- [Catálogo atualizado de funcionalidades (23/09/2026)](docs/funcionalidades-completas-2026-09-23.md)
- [Manual de uso do professor e do aluno](docs/user-manual.md)
- [Publicação de homologação na HostGator](deployment/hostgator/README.md)
- [Publicação segura passo a passo para iniciantes](docs/publishing-hostgator-step-by-step.md)
- [Arquitetura aprovada](docs/architecture.md)
- [Registro de decisões](docs/decision-log.md)
- [Checklist da Etapa 0](docs/stage-0-readiness.md)
- [Levantamento da HostGator](docs/hostgator-discovery.md)
- [Acompanhamento da Etapa 1](docs/stage-1-design.md)
- [Acompanhamento da Etapa 2](docs/stage-2-foundation.md)
