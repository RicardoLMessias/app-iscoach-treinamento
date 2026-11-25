# IS Coach Treinamento — catálogo completo de funcionalidades

**Data do levantamento:** 23/09/2026  
**Situação deste trabalho:** incluído no pacote de produção r12, ainda não publicado na hospedagem.  
**Base do levantamento:** interface React, rotas e controladores da API Laravel, recursos, migrações e testes do repositório nesta data.

## 1. O que é o sistema

O IS Coach Treinamento é uma aplicação web responsiva para acompanhamento de alunos por um professor. O professor administra cadastros, convites, biblioteca de exercícios, treinos, avaliações físicas e planos alimentares. O aluno acessa o que foi disponibilizado para ele, executa treinos, registra hidratação e acompanha sua evolução. A aplicação funciona no navegador do computador e do celular; o layout do professor tem adaptações específicas para telas grandes.

Há dois perfis de usuário:

| Perfil | Pode fazer | Não pode fazer |
|---|---|---|
| Professor | Gerenciar alunos e conteúdo profissional, consultar acompanhamento e gerar documentos | Aceitar ou revogar consentimentos em nome do aluno |
| Aluno | Completar seu cadastro, gerenciar seu acesso e consentimentos, consultar planos e avaliações, registrar treinos e água | Editar prescrições, avaliações e dados profissionais de outros usuários |

A interface mostra apenas os módulos do perfil autenticado. A API também separa as rotas por papel; ocultar botões não é a única camada de proteção.

## 2. Entrada no sistema e segurança da conta

### 2.1 Sessão e autenticação

- Login por e-mail e senha, logout e recuperação de senha por e-mail.
- Sessão baseada em cookies e Laravel Sanctum, com proteção CSRF nas alterações de dados.
- Limitação de tentativas nas operações sensíveis, incluindo login, recuperação, convites e alteração de senha.
- Usuários inativos não entram normalmente; o professor pode reativar o acesso do aluno.
- Senhas exigem pelo menos dez caracteres, com maiúscula, minúscula, número e símbolo.
- Alterações de senha e de estado de acesso podem gerar avisos transacionais por e-mail.
- Alteração de e-mail exige confirmação por link; até a confirmação, o endereço anterior permanece como referência de acesso.

### 2.2 Primeiro acesso do professor

- Uma conta criada com senha temporária exige que o professor escolha uma senha pessoal.
- Depois da troca da senha temporária, o fluxo retorna ao login para entrar com a nova senha.
- Na área **Segurança**, o professor pode alterar novamente sua senha, informando a senha atual.

### 2.3 Convite e primeiro acesso do aluno

- O professor informa nome, e-mail e validade de um a três dias.
- O sistema envia o convite por e-mail e mostra o link para cópia naquele momento.
- O token do convite é armazenado apenas como hash, expira e só pode ser aceito uma vez.
- O aluno cria a própria senha, completa o cadastro inicial e realiza os aceites exigidos.
- Um e-mail que já pertence a uma conta não recebe uma segunda conta pelo fluxo de convite; contas inativas são reativadas pelo professor.

### 2.4 Gestão dos convites

- Em **Alunos → Convites enviados**, o professor vê nome, e-mail, data de envio, validade e situação.
- Filtros: todos, pendentes, aceitos, expirados e cancelados. A lista é paginada.
- Convite pendente pode ser cancelado; o link deixa de ser utilizável.
- Convite não aceito pode ser reenviado como um novo convite de um dia. O link anterior do mesmo professor é invalidado; o novo link é mostrado para cópia e enviado por e-mail.
- O professor só consulta e cancela os convites que ele criou. O token antigo não pode ser recuperado no histórico.

## 3. Cadastro e administração dos alunos

- Lista de alunos com busca por nome ou e-mail.
- Seleção de um aluno como contexto de trabalho, preservada ao alternar entre módulos. É possível trocar ou retirar a seleção.
- Módulos gerais, como biblioteca de exercícios, podem ser abertos sem aluno selecionado; operações individuais exigem seleção.
- Na versão para computador há barra lateral e contexto do aluno. O celular mantém navegação adaptada.
- Perfil do aluno: nome, e-mail, nascimento, sexo, telefone, CEP, rua, número, complemento, bairro, cidade, UF, objetivos opcionais e notas profissionais.
- Consulta de CEP pelo backend para preencher os dados de endereço disponíveis; número e complemento dependem de preenchimento humano.
- Telefone pode ser informado com código de país, conforme a validação do cadastro.
- Professor pode editar o cadastro e a anamnese, além de ativar/inativar o acesso.
- Exclusão definitiva do aluno exige confirmação e remove os dados vinculados conforme as regras da aplicação; deve ser tratada como operação irreversível.
- A lista sinaliza se o aluno autorizou, não autorizou ou revogou a autorização de fotos de avaliação.

## 4. Painel inicial do professor

- Indicadores de alunos ativos, inativos, convites pendentes, treinos concluídos na semana, avaliações recentes e alunos sem planos ativos.
- Feed de treinos e hidratação dos últimos sete dias, com filtros e paginação.
- Identificação de alunos sem treino concluído há mais de três dias.
- Prévia da atividade e atalhos para selecionar o aluno ou abrir seus treinos e cadastro.
- No celular, os indicadores são apresentados em cartões; no computador, o painel tem composição própria com barra lateral.
- O feed é uma janela de visualização semanal. Isso não significa eliminação automática dos registros históricos de treino, hidratação ou auditoria.

## 5. Biblioteca de exercícios

- Cadastro e consulta de exercícios agrupados por região/grupo muscular.
- Cada exercício pode ter nome, agrupamento, instruções, vídeo opcional e imagem/miniatura opcional.
- A lista mostra claramente quais exercícios têm vídeo e quais estão sem vídeo.
- Edição posterior dos dados e do vídeo.
- Exclusão de exercício da biblioteca, com preservação dos treinos e históricos existentes.
- Exclusão de agrupamento muscular quando estiver vazio. Um agrupamento com exercícios não pode ser removido diretamente.
- No aplicativo do aluno, vídeo compatível é incorporado no espaço de mídia; quando não há vídeo, a tela mostra o estado de indisponibilidade.
- As orientações escritas pelo professor aparecem na aba **Orientações**, no mesmo espaço destinado ao vídeo, e não abaixo das séries.

## 6. Montagem e gestão de treinos

### 6.1 Prescrição

- Vários treinos podem coexistir para o mesmo aluno; criar um novo não apaga os anteriores.
- Cada treino pode conter exercícios da biblioteca e atividades complementares, como cardio, mobilidade e vacuum.
- Exercício prescrito contém séries, intervalo de repetições, descanso, carga sugerida e orientações.
- O tempo de descanso deve ser definido pelo professor ao salvar o treino ou modelo; não se presume um valor oculto.
- O formulário mostra quais itens da biblioteca já têm vídeo.
- Treinos podem ser editados, arquivados/ativados e excluídos. Exclusões preservam sessões e históricos já registrados.
- Histórico de execuções pode ser consultado pelo professor, inclusive duração e itens não concluídos.

### 6.2 Modelos reutilizáveis

- Um treino pode ser salvo como modelo para prescrição posterior a outros alunos.
- Modelos podem ser selecionados, ajustados antes da atribuição, atualizados e excluídos.
- Excluir um modelo não remove treinos já atribuídos.

### 6.3 Agenda do aluno

- **Modo rotativo:** treinos seguem a ordem da sequência nos dias de treino e continuam de uma semana para outra. O professor escolhe os dias de folga.
- **Modo de dias fixos:** cada treino pode ser associado a um ou mais dias da semana.
- O aluno vê qual treino é recomendado para o dia e pode consultar os demais treinos disponíveis.
- Um dia de descanso não elimina os planos nem bloqueia sua consulta.

## 7. Execução de treino pelo aluno

- O aluno inicia ou retoma uma sessão. O sistema registra o momento de início.
- A execução mostra exercício, vídeo ou orientação, séries, repetições, carga e descanso.
- O aluno marca/desmarca séries e atividades complementares. A interface evita acionamento acidental imediato de alguns controles.
- O cronômetro de descanso permanece disponível durante a navegação interna e calcula o tempo a partir de horário de término, para não depender apenas de contagem visual na tela.
- O aviso de fim do descanso possui volume ajustável e quantidade configurável de toques. O último check de cada exercício não inicia um descanso desnecessário.
- O aluno pode finalizar com itens incompletos mediante confirmação; o histórico e a visão do professor indicam o que faltou.
- Uma sessão iniciada por engano pode ser cancelada. O cancelamento não conta como treino concluído nem avança a sequência rotativa.
- A duração é registrada e apresentada em horas, minutos e segundos no histórico.
- O histórico preserva uma cópia da prescrição executada para que mudanças futuras na biblioteca ou no plano não reescrevam o passado.

**Limite técnico importante:** este projeto não instala um PWA nem garante alarme audível com o telefone bloqueado ou navegador suspenso. O volume final depende do aparelho e do navegador. A funcionalidade “manter tela sempre ligada como aplicativo nativo” ficou fora do escopo aprovado.

### 7.1 Página inicial do aluno

- Mostra o próximo treino recomendado, uma sessão em andamento ou um dia de descanso, conforme a agenda.
- Resume treinos feitos na semana e o progresso em relação à meta semanal.
- Exibe a última avaliação, um resumo do plano alimentar e a hidratação do dia.
- Oferece atalhos para evolução, dieta, avaliação física e perfil.
- A central de notificações da própria interface sinaliza novos treinos e planos alimentares. O estado de leitura é guardado no navegador do aluno; não se trata de notificação push do sistema operacional.
- Há um atalho para conversar com o profissional pelo WhatsApp ou, quando disponível, por e-mail.

## 8. Avaliação física e evolução

### 8.1 Registro profissional

- O professor cria avaliações em rascunho, edita o rascunho e finaliza para disponibilizá-lo ao aluno.
- Peso e altura são obrigatórios para finalização; campos não avaliados podem ficar vazios.
- Os resultados derivados são calculados pelo backend e não editados manualmente no formulário.
- O formulário agrupa dados gerais, medidas, dobras e observações posturais conforme o esquema atual da API.
- Algumas observações de postura usam opções pré-selecionáveis nas visões lateral, posterior e anterior.
- Campos retirados anteriormente do formulário de postura, como tíbias, EIPS e pés da visão anterior/posterior, não devem ser reintroduzidos sem nova decisão. A opção de pés na visão lateral segue o esquema vigente.
- Avaliação finalizada pode receber correção versionada, preservando versões anteriores.
- Professor pode consultar o histórico, inserir/substituir/excluir fotos autorizadas e excluir uma avaliação com confirmação.

### 8.2 Consulta e comparação

- O aluno vê somente avaliações publicadas para ele, com resumo da última, histórico e gráfico de evolução.
- Os gráficos mostram valores e datas, incluindo peso, cintura, IMC e gordura corporal quando existem dados suficientes.
- Professor e aluno podem escolher duas datas para comparar dados registrados, resultados calculados e fotos disponíveis.
- A comparação inclui massa muscular em quilogramas quando calculada e registrada.
- Fotos de avaliação dependem de autorização específica. A interface informa ao professor quando ela não existe ou foi revogada.
- PDF de avaliação e PDF de comparativo são ferramentas do professor; o botão de PDF não aparece na evolução do aluno.

## 9. Alimentação, orientações e hidratação

### 9.1 Planos alimentares do professor

- Criação, edição, arquivamento/ativação e exclusão de planos alimentares por aluno.
- Nome, metas nutricionais e meta diária de hidratação.
- Refeições com alimentos e substituições; o professor pode adicionar e remover refeições do formulário.
- Cadastro de suplementos e recursos ergogênicos com nome, dose, horário/frequência e observações.
- Modelos alimentares reutilizáveis: salvar, carregar, editar e excluir. Planos já atribuídos não são apagados ao excluir um modelo.
- Consulta do histórico de planos e geração de PDF do plano para o professor.

### 9.2 Consulta do aluno

- O aluno vê seu plano ativo, refeições, alimentos, substituições, suplementos e recursos ergogênicos informados pelo profissional.
- Registra água por botões de porção ou informando outra quantidade em mililitros.
- A tela mostra total consumido no dia e progresso em relação à meta do plano.
- A API valida cada lançamento e o limite diário para evitar quantidades indevidas.

## 10. Documentos para impressão/PDF

- O professor pode gerar prévias imprimíveis do programa de treino, plano alimentar, avaliação física e comparativo entre avaliações.
- A ação **Imprimir / salvar PDF** abre o mecanismo de impressão do navegador; o professor escolhe “Salvar como PDF”.
- Os relatórios seguem a identidade visual de avaliação aprovada para os documentos do sistema.
- A geração é feita na interface do professor. O aluno consulta os dados no aplicativo, mas não vê os botões de PDF.
- A qualidade final e a paginação podem variar conforme navegador e configurações de impressão.

## 11. Perfil e consentimentos do aluno

- Edição de dados pessoais, endereço e objetivos opcionais.
- Upload, troca e exclusão de foto de perfil; a imagem é preparada antes do envio e armazenada de forma privada.
- Alteração de senha e solicitação de alteração de e-mail confirmada por link.
- Visualização dos termos aceitos e das autorizações; o aluno realiza seus próprios aceites e revogações quando aplicável.
- Consentimento específico para tratamento de dados de saúde e autorização separada, opcional, para fotos de avaliação.
- Área de privacidade com canal de contato para solicitações sobre dados e conta.
- Configuração individual do som do cronômetro.

## 12. Documentos legais e privacidade

- Termos de uso e aviso de privacidade estão versionados no backend; a versão legal presente no código nesta data é `2026.09.22`.
- Aceites são vinculados ao documento e à versão vigente.
- Quando um documento obrigatório muda, a aplicação pode exigir novo aceite antes do uso regular.
- O professor consegue saber se fotos foram autorizadas, mas não pode autorizar pelo aluno.
- Dados de saúde, fotos e arquivos privados usam controles de acesso. Registros sensíveis também têm medidas de criptografia em repouso no backend.
- A preservação da `APP_KEY` do Laravel é essencial: perda da chave impede recuperar campos criptografados.

**Ponto de revisão antes de futura publicação:** os textos legais ainda descrevem a hidratação registrada “pelos botões”, enquanto a interface já permite digitar uma quantidade. O texto deve ser harmonizado e revisado pelo responsável jurídico antes de publicar esta alteração documental ou uma nova versão dos termos.

## 13. Área “Atualizações do sistema”

- Uma entrada própria no menu do professor abre um histórico de novidades com data, título e descrição.
- O conteúdo é somente de leitura; não há editor de atualizações nem envio automático de avisos por e-mail.
- A tela não depende da seleção de aluno e não mostra o seletor de contexto do aluno.
- Ela é renderizada apenas dentro do painel do perfil de professor. Não foi criada rota pública para o aluno.
- As entradas são mantidas no código da interface nesta primeira versão; futuras atualizações precisam alterar a lista em `ProfessorUpdates.jsx`.
- Esta funcionalidade está incluída no pacote r12, mas não foi publicada no servidor.

## 14. Arquitetura resumida

```text
Navegador (professor ou aluno)
  └─ React + Vite (interface responsiva)
      └─ /api/v1 e sessão Sanctum
          └─ Laravel 13
              ├─ MySQL: usuários, convites, planos, sessões, avaliações e auditoria
              ├─ storage privado: fotos e anexos protegidos
              ├─ SMTP: convites e mensagens transacionais
              └─ ViaCEP: consulta de endereço
```

O backend oficial está em `backend-laravel/`. A pasta `backend/` é uma base preliminar preservada no repositório, não a API de produção. A pasta `frontend/dist/` é gerada pela compilação; editar apenas arquivos-fonte não atualiza automaticamente uma hospedagem que usa a versão compilada.

## 15. Principais grupos da API

| Grupo | Exemplos de operações |
|---|---|
| Autenticação | Login, logout, sessão atual, recuperação de senha, confirmação de e-mail |
| Convites | Criação, histórico filtrado, cancelamento, validação e aceite |
| Professor/alunos | Busca, detalhe, edição, exclusão, ativação e inativação |
| Professor/treinos | Biblioteca, agrupamentos, planos, agenda, modelos e histórico |
| Aluno/treinos | Lista, sessão atual, início, séries, atividades, conclusão, cancelamento e histórico |
| Avaliações | Esquema, rascunhos, finalização, correções, fotos e leitura pelo aluno |
| Alimentação | Planos, modelos, leitura pelo aluno e hidratação |
| Consentimentos | Documentos, aceite, revogação e estado atual |
| Utilitários | CEP e verificação de saúde da API |

O contrato exato de campos, validações e permissões está nas rotas, requests, resources e controladores do Laravel. Este catálogo descreve o comportamento funcional, não substitui esses contratos executáveis.

## 16. Situação e limites deste levantamento

- Este arquivo é um retrato do código em 23/09/2026. Ele não afirma que todos os módulos foram testados manualmente em Android, iPhone e produção nesta data.
- A versão de produção preparada para este levantamento é o pacote r12. A geração do ZIP não altera o site publicado.
- Não foi feita publicação, migração ou alteração de dados reais como parte deste documento.
- Alterações futuras no código devem atualizar este catálogo e a lista de novidades do professor para evitar divergência.
- Para instalação, configuração de servidor e backup, usar o guia de publicação separado; este documento não é uma instrução para sobrescrever `.env`, `APP_KEY` ou `storage`.
