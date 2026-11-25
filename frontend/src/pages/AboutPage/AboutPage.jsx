import { ArrowUpRight, ClipboardList, Droplets, Dumbbell, HeartPulse, ShieldCheck, Utensils, Users } from "lucide-react";
import ScreenHeader from "../../shared/components/ScreenHeader/ScreenHeader.jsx";
import InstallGuide from "./InstallGuide.jsx";
import styles from "./AboutPage.module.css";

const developerSite = "https://www.drkworks.com.br/";

const studentFeatures = [
  { icon: Dumbbell, title: "Treinos e mobilidade", description: "Veja os treinos publicados, acompanhe as orientações e registre séries, cargas e repetições. Quando houver mobilidade, ela aparece em uma seção própria do treino." },
  { icon: HeartPulse, title: "Evolução", description: "Consulte avaliações físicas, histórico e comparativos disponibilizados pelo professor." },
  { icon: Utensils, title: "Alimentação", description: "Acompanhe refeições, substituições e receitas incluídas no seu plano alimentar." },
  { icon: Droplets, title: "Hidratação", description: "Registre a água consumida e acompanhe seu progresso diário em relação à meta do plano." },
  { icon: ShieldCheck, title: "Perfil e privacidade", description: "Atualize seus dados, ajuste o som do descanso e consulte seus termos e autorizações na aba Perfil." },
];

const professorFeatures = [
  { icon: ClipboardList, title: "Visão geral", description: "Acompanhe as atividades recentes, os indicadores e os alunos que precisam de atenção." },
  { icon: Users, title: "Alunos e convites", description: "Envie e gerencie convites, selecione um aluno e consulte seu cadastro e anamnese." },
  { icon: Dumbbell, title: "Treinos", description: "Cadastre exercícios e mobilidades, monte planos e modelos, configure a agenda e acompanhe o histórico de execução." },
  { icon: HeartPulse, title: "Avaliações", description: "Registre avaliações físicas, acompanhe comparativos e gere os PDFs disponíveis para o professor." },
  { icon: Utensils, title: "Alimentação", description: "Crie planos alimentares e modelos com refeições, substituições e receitas opcionais." },
  { icon: ShieldCheck, title: "Conta e atualizações", description: "Use Segurança para alterar sua senha e Atualizações para acompanhar as mudanças do sistema." },
];

export default function AboutPage({ role }) {
  const isProfessor = role === "professor";
  const features = isProfessor ? professorFeatures : studentFeatures;

  return <div className={styles.page}>
    {!isProfessor && <ScreenHeader title="Sobre o app" />}
    <section className={styles.hero}>
      <span className={styles.mark}>IS</span>
      <p className="eyebrow">IS Coach Treinamento</p>
      <h1>Sobre o app</h1>
      <p>{isProfessor
        ? "Um espaço para organizar o acompanhamento dos alunos, da prescrição ao histórico de treinos, avaliações e alimentação."
        : "Seu espaço para acompanhar o que foi preparado pelo professor e registrar sua rotina de treino e hidratação."}</p>
      <small>Versão 1.0</small>
    </section>

    <section className={styles.guide} aria-labelledby="about-guide-title">
      <h2 id="about-guide-title">O que você encontra aqui</h2>
      <div className={styles.featureList}>{features.map(({ icon: Icon, title, description }) => <article key={title}>
        <span className={styles.featureIcon}><Icon size={19} aria-hidden="true" /></span>
        <div><h3>{title}</h3><p>{description}</p></div>
      </article>)}</div>
    </section>

    <section className={styles.install} id="install-app" aria-labelledby="install-app-title">
      <p className="eyebrow">Acesso rápido</p>
      <h2 id="install-app-title">Colocar o IS Coach na tela inicial</h2>
      <p>Crie um ícone no celular para abrir o site com mais facilidade. Escolha seu aparelho e siga o passo a passo.</p>
      <InstallGuide />
    </section>

    <section className={styles.developer} aria-labelledby="about-developer-title">
      <p className="eyebrow">Desenvolvimento</p>
      <h2 id="about-developer-title">Criado pela DRK</h2>
      <p>Quer conhecer o desenvolvedor do IS Coach? Visite o site da DRK.</p>
      <a href={developerSite} target="_blank" rel="noopener noreferrer">Visitar site da DRK <ArrowUpRight size={17} aria-hidden="true" /></a>
    </section>
  </div>;
}
