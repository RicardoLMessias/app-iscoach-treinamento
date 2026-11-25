import styles from "./ProfessorUpdates.module.css";

const updates = [
  {
    date: "17/11/2026",
    title: "Treinos na ordem montada pelo professor",
    status: "Implementado",
    details: [
      "Na sequência de treinos, o aluno vê os treinos na ordem em que o professor os criou, começando pelo próximo: depois do A vem o B, depois o C, e assim por diante.",
      "Com dias fixos, a lista começa pelo treino de hoje e segue pelos próximos dias da semana; os dias de cada treino aparecem de segunda a domingo.",
    ],
  },
  {
    date: "15/11/2026",
    title: "Alunos ativos e desativados em listas separadas",
    status: "Implementado",
    details: [
      "A lista de alunos tem as abas Ativos e Desativados, cada uma com a sua contagem; a busca funciona dentro da aba aberta.",
      "Ao desativar um aluno, ele sai da lista de ativos e passa para a de desativados; ao reativar, volta para a de ativos.",
    ],
  },
  {
    date: "11/11/2026",
    title: "Feedback semanal ao lado do feed e PDF no iPhone",
    status: "Implementado",
    details: [
      "Na visão geral, o feedback semanal fica abaixo dos indicadores; ao expandir a lista, ele ocupa a largura do painel e as atividades recentes descem logo abaixo.",
      "Os PDFs gerados no iPhone deixam de incluir folhas em branco entre as páginas.",
    ],
  },
  {
    date: "10/11/2026",
    title: "Confirmação de leitura do feedback semanal",
    status: "Implementado",
    details: [
      "O resumo do feedback semanal aparece no topo da visão geral do professor, com expansão dos alunos pendentes ou respondidos.",
      "O professor pode marcar cada resposta como vista; o registro fica salvo e o aluno recebe um aviso dentro do aplicativo.",
    ],
  },
  {
    date: "10/11/2026",
    title: "Feedback semanal e avaliação avulsa",
    status: "Implementado",
    details: [
      "O aluno responde um feedback semanal obrigatório ao entrar no aplicativo; percentuais de treino, dieta e funcionamento intestinal ficam limitados de 0 a 100%.",
      "O professor consulta o histórico do feedback no início da avaliação do aluno e compara duas semanas na mesma tela.",
      "O professor pode preencher uma avaliação avulsa e gerar seu PDF, com fotos opcionais após registrar a autorização verbal; a avaliação avulsa e as fotos não são salvas como novos registros no banco.",
    ],
  },
  {
    date: "10/11/2026",
    title: "Acompanhamento do feedback na visão geral",
    status: "Implementado",
    details: [
      "A visão geral mostra quantos alunos responderam e quantos estão pendentes; ao selecionar um grupo, a lista correspondente se expande ao lado do feed com animação suave.",
      "O professor pode enviar um aviso manual por e-mail e no aplicativo para cada aluno pendente, uma vez por semana.",
      "O e-mail de lembrete foi traduzido para português. O envio automático às segundas-feiras às 7h depende de configurar o agendamento na hospedagem.",
    ],
  },
  {
    date: "16/10/2026",
    title: "Exercícios por tempo e execução das séries",
    status: "Implementado",
    details: [
      "O professor pode prescrever cada exercício ou mobilidade por repetições ou por tempo, definindo a duração em segundos de cada série.",
      "O aluno inicia o cronômetro da série, acompanha a contagem regressiva e registra o tempo efetivamente executado; o descanso permanece separado.",
      "Prescrição, histórico do aluno e do professor e PDF do treino distinguem séries por tempo de séries por repetições. Treinos anteriores continuam em repetições.",
    ],
  },
  {
    date: "16/10/2026",
    title: "Biblioteca, prescrição e visualização dos treinos",
    status: "Implementado",
    details: [
      "Novos exercícios entram com quatro séries por padrão; a quantidade continua editável pelo professor.",
      "Cardio e vacuum têm cadastro próprio na biblioteca e podem ser escolhidos como atividades complementares do treino.",
      "A tela do aluno recebeu ajustes de largura e alinhamento para evitar que cartões e conteúdo ultrapassem a área visível em celulares, incluindo iPhone.",
    ],
  },
  {
    date: "16/10/2026",
    title: "Navegação, acompanhamento e informações do aplicativo",
    status: "Implementado",
    details: [
      "A lista e a seleção de alunos do professor têm paginação para que todos os cadastros possam ser encontrados.",
      "O feed de atividades da visão geral do professor também está disponível na versão para celular.",
      "Professor e aluno têm a página Sobre o app, com um guia das funções e botão para visitar o site da DRK.",
      "O aluno pode iniciar um treino também em um dia marcado como descanso, sem erro de servidor.",
    ],
  },
  {
    date: "10/10/2026",
    title: "Mobilidade integrada aos treinos e ao PDF",
    status: "Implementado",
    details: [
      "A biblioteca do professor agora separa exercícios e mobilidades, com cadastro e edição próprios para cada tipo.",
      "Na prescrição, o professor pode adicionar mobilidades ao treino; o aluno as encontra em uma aba separada dos exercícios.",
      "Treinos com mobilidade exibem um selo animado, seguindo a identidade visual do aplicativo.",
      "O PDF do programa de treino apresenta exercícios e mobilidades em seções e contagens separadas.",
    ],
  },
  {
    date: "08/10/2026",
    title: "Avaliações e acompanhamento dos treinos",
    status: "Implementado",
    details: [
      "As sete dobras podem ser registradas e calculadas em qualquer idade; fora da faixa original do protocolo, a avaliação exibe um aviso de cautela.",
      "Exercícios com orientações do professor são destacados na lista e na execução do treino do aluno.",
      "Treinos em andamento aparecem no histórico do aluno e do professor com horário de início e séries concluídas, sem serem marcados como finalizados.",
      "O formulário de prescrição e as telas de treino e histórico receberam ajustes de alinhamento e proporção para PC e celular.",
    ],
  },
  {
    date: "06/10/2026",
    title: "Miniaturas e modelos de treino revisados",
    status: "Implementado",
    details: [
      "O professor pode enviar uma miniatura própria ao cadastrar ou editar exercícios; ela aparece como capa na lista e antes do vídeo.",
      "Ao revisar um treino, o professor pode salvar uma cópia como novo modelo sem alterar automaticamente o treino do aluno.",
    ],
  },
  {
    date: "04/10/2026",
    title: "Agrupamentos e receitas na alimentação",
    status: "Implementado",
    details: [
      "O professor pode criar agrupamentos de exercícios diretamente na biblioteca de treinos.",
      "Cada alimento do plano ou modelo alimentar pode receber uma receita opcional de até 3.000 caracteres; o aluno vê a receita somente quando preenchida.",
    ],
  },
  {
    date: "02/10/2026",
    title: "Validação do plano alimentar",
    status: "Implementado",
    details: [
      "Ao salvar um plano ou modelo alimentar, as metas numéricas fora do intervalo permitido agora exibem uma mensagem clara com o campo e os limites aceitos.",
      "Os campos de metas também indicam os limites máximos no formulário.",
    ],
  },
  {
    date: "01/10/2026",
    title: "Cadastro de alunos menores de 18 anos",
    status: "Implementado",
    details: [
      "O cadastro aceita alunos de qualquer idade. Para menores de 18 anos, exige uma declaração de ciência dos pais ou responsáveis.",
      "A declaração é registrada, mas o aplicativo não verifica a identidade do responsável.",
    ],
  },
  {
    date: "24/09/2026",
    title: "Avaliação postural e plano alimentar",
    status: "Implementado",
    details: [
      "O campo EIAS foi retirado da visão anterior da avaliação postural; avaliações já registradas foram preservadas.",
      "No plano alimentar, kcal, proteínas, carboidratos e gorduras são definidos apenas como metas gerais, sem campos por alimento.",
      "A tela do aluno não exibe mais um total de kcal calculado para cada refeição.",
    ],
  },
  {
    date: "23/09/2026",
    title: "Histórico e gestão de convites",
    status: "Implementado",
    details: [
      "A lista de convites enviados mostra nome, e-mail, datas e situação de cada convite.",
      "Agora é possível filtrar, cancelar um convite pendente e reenviar um novo link.",
      "Cada professor visualiza e gerencia apenas os convites que criou.",
    ],
  },
  {
    date: "22/09/2026",
    title: "Treinos, tempo e hidratação",
    status: "Implementado",
    details: [
      "O tempo de treino é registrado desde o início e exibido em horas, minutos e segundos.",
      "O aviso sonoro do descanso permite ajustar volume e número de toques.",
      "Além dos botões de porção, o aluno pode informar a quantidade de água que bebeu.",
      "O aluno pode cancelar uma sessão iniciada por engano, e a agenda admite sequência rotativa ou dias fixos.",
    ],
  },
  {
    date: "20/09/2026",
    title: "Biblioteca e prescrição de treinos",
    status: "Implementado",
    details: [
      "O professor pode excluir exercícios da biblioteca sem apagar o histórico de treinos já realizados.",
      "Agrupamentos musculares vazios podem ser excluídos.",
      "Planos de treino e avaliações continuam com histórico e opção de gerar documentos em PDF para o professor.",
    ],
  },
];

export default function ProfessorUpdates() {
  return <section className={styles.panel} aria-labelledby="system-updates-title">
    <div className={styles.heading}><p className="eyebrow">Área do professor</p><h2 id="system-updates-title">Atualizações do sistema</h2><p>Novidades e melhorias do IS Coach Treinamento. Esta página é informativa e está disponível somente para o professor.</p></div>
    <div className={styles.list}>{updates.map((update) => <article className={styles.card} key={`${update.date}-${update.title}`}>
      <div className={styles.cardHeading}><div><time>{update.date}</time><h3>{update.title}</h3></div><span>{update.status}</span></div>
      <ul>{update.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
    </article>)}</div>
  </section>;
}
