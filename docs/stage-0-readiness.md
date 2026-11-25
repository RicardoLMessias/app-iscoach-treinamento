# Etapa 0 — preparação e aprovações

**Estado:** encerrada em 27/08/2026. Pendências não bloqueadoras foram mantidas
para resolução antes dos módulos ou da publicação correspondentes.

## Objetivo

Encerrar decisões de arquitetura e reunir os insumos necessários para iniciar o
design e, posteriormente, a fundação técnica sem interpretações divergentes.

## Concluído

- [x] Especificação funcional definida como fonte oficial.
- [x] React com Vite aprovado para o frontend.
- [x] Laravel/PHP aprovado para o backend.
- [x] MySQL aprovado para persistência.
- [x] HostGator aprovada como hospedagem.
- [x] Arquitetura lógica documentada.
- [x] Escopo e itens excluídos identificados.
- [x] Inventário inicial das decisões pendentes registrado.

## Pendente — infraestrutura

- [x] Identificar o plano como HostGator Turbo, conforme informação do cliente.
- [x] Confirmar documentalmente que o plano oferece cPanel, SSH, Cron Job, SSL e MySQL.
- [x] Confirmar documentalmente que a HostGator atualmente utiliza PHP 8.5.
- [ ] Confirmar no painel as versões efetivas de PHP e MySQL/MariaDB da conta.
- [ ] Solicitar a habilitação do SSH ao suporte da HostGator.
- [ ] Confirmar Composer e possibilidade de configurar document root.
- [ ] Confirmar no painel limites efetivos de memória e upload.
- [x] Armazenamento anunciado do plano: 150 GB NVMe e 500 mil inodes.
- [ ] Definir domínio ou subdomínio final.
- [ ] Definir ambiente de homologação.
- [x] Definir Gmail como serviço inicial de e-mail.
- [x] Confirmar disponibilidade de senha de aplicativo do Gmail.
- [ ] Definir endereço remetente e configurar a credencial somente no ambiente seguro.
- [ ] Criar acessos separados de banco para homologação e produção.

## Pendente — conteúdo e regras

- [x] Receber e aprovar a direção visual das telas do aluno.
- [x] Definir que a aba Perfil seguirá o mesmo sistema visual.
- [ ] Receber arquivos de logo e fotos com autorização de uso.
- [ ] Receber planilhas originais e casos de referência.
- [ ] Receber tabelas de classificação.
- [ ] Confirmar TMB por sexo.
- [ ] Confirmar unidades dos diâmetros ósseos.
- [ ] Definir área muscular do braço ou campo manual.
- [ ] Definir casas decimais e arredondamentos.
- [ ] Receber perguntas oficiais do PAR-Q e anamnese.
- [ ] Aprovar política de privacidade, termos e consentimento de fotos.
- [ ] Definir formatos, dimensões e limites de fotos e PDFs.
- [ ] Preparar dados fictícios para homologação.

## Regra de avanço

A Etapa 1 (design) pode começar quando identidade e mockups estiverem
disponíveis. A Etapa 2 (fundação técnica) exige a validação da hospedagem. Cada
módulo dependente de fórmulas ou conteúdo só poderá ser finalizado após receber
seus respectivos insumos.

## Observação operacional da hospedagem

No plano compartilhado, tarefas cron têm intervalo mínimo de 15 minutos. A
arquitetura não deverá depender de workers permanentes. E-mails e tarefas em
segundo plano precisarão respeitar essa limitação.
