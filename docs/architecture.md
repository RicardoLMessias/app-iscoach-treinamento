# Arquitetura aprovada para implementação

## Tecnologias

- Frontend: React com Vite.
- Backend: Laravel/PHP.
- Banco de dados: MySQL.
- Hospedagem: HostGator.
- Interface: aplicação web responsiva e mobile-first.

O React não acessará o banco diretamente. Toda leitura e alteração passará pela
API Laravel, que validará identidade, papel, propriedade do recurso e dados de
entrada.

## Frontend

- `app`: composição global da aplicação.
- `pages`: telas associadas a rotas.
- `features`: módulos de negócio, como autenticação e treinos.
- `shared`: componentes reutilizáveis e sem regra de negócio.
- `services/http`: comunicação centralizada com a API.
- `hooks`: hooks compartilhados.
- `styles`: tokens e estilos globais.

## Backend Laravel

- `public`: único diretório público e ponto de entrada do Laravel.
- `Http/Controllers`: tradução entre HTTP e casos de uso.
- `Http/Requests`: validação e autorização contextual.
- `Policies`: autorização por recurso e propriedade.
- `Actions` e `Services`: casos de uso, cálculos e regras de negócio.
- `Models`: persistência Eloquent e relacionamentos.
- `database/migrations`: evolução versionada do MySQL.
- `storage/app/private`: fotos e documentos fora da raiz pública.

## Autenticação

A proposta técnica é Laravel Sanctum com sessão e cookie seguro, mantendo
frontend e API no mesmo domínio. Essa topologia depende da validação das
capacidades da HostGator.

## Integridade

- Avaliações finalizadas terão histórico e correções versionadas.
- Treinos executados preservarão a prescrição vigente na execução.
- Planos alimentares publicados terão versão e autoria.
- Valores de entrada e resultados calculados serão preservados para auditoria.
- Documentos e fotos serão entregues apenas por rotas autorizadas.

## Limites

Esta arquitetura não inclui recursos listados como fora do escopo na
especificação oficial. Qualquer alteração será registrada e dependerá de
aprovação expressa do cliente.
