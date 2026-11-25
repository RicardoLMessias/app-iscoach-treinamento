import { useEffect, useState } from "react";
import { Activity, Bell, CalendarDays, ChevronRight, Dumbbell, FileText, MessageCircle, Utensils } from "lucide-react";
import { apiRequest, appPath } from "../../services/http/apiClient.js";
import { formatWorkoutDuration } from "../../shared/formatWorkoutDuration.js";
import styles from "./HomePage.module.css";

const shortcuts = [
  { icon: Activity, label: "Evolução", page: "progress" },
  { icon: Utensils, label: "Dieta", page: "nutrition" },
  { icon: CalendarDays, label: "Avaliação física", page: "progress" },
  { icon: FileText, label: "Meu cadastro", page: "profile" },
];
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "Sem avaliação";
const readStorageKey = (userId) => `is-coach:read-notifications:${userId ?? "student"}`;
const loadReadNotifications = (userId) => { try { return JSON.parse(window.localStorage.getItem(readStorageKey(userId)) ?? "[]"); } catch { return []; } };

export default function HomePage({ onNavigate, user }) {
  const [dashboard, setDashboard] = useState(null); const [message, setMessage] = useState(""); const [notificationsOpen, setNotificationsOpen] = useState(false); const [readNotifications, setReadNotifications] = useState(() => loadReadNotifications(user?.id));
  useEffect(() => {
    let active = true;
    const refresh = () => apiRequest("/v1/student/dashboard", { cache: "no-store" })
      .then((response) => { if (active) setDashboard(response.data); })
      .catch((error) => { if (active) setMessage(error.message); });
    const onVisibilityChange = () => { if (!document.hidden) refresh(); };
    refresh();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { active = false; document.removeEventListener("visibilitychange", onVisibilityChange); };
  }, []);
  const workout = dashboard?.workout; const plan = workout?.plan; const assessment = dashboard?.latest_assessment; const nutrition = dashboard?.nutrition;
  const contactHref = dashboard?.contact?.whatsapp_url || (dashboard?.contact?.email ? `mailto:${dashboard.contact.email}` : null);
  const updates = dashboard?.recent_updates ?? []; const unreadUpdates = updates.filter((update) => !readNotifications.includes(update.id)); const initials = (user?.name ?? "Aluno").trim().slice(0, 2).toUpperCase();
  const markAsRead = (ids) => { const next = [...new Set([...readNotifications, ...ids])]; setReadNotifications(next); window.localStorage.setItem(readStorageKey(user?.id), JSON.stringify(next)); };
  const openUpdate = (update) => { markAsRead([update.id]); setNotificationsOpen(false); if (update.type !== "weekly_feedback" && update.type !== "weekly_feedback_reviewed") onNavigate(update.type === "nutrition" ? "nutrition" : "training"); };
  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.brand}><img src={appPath("images/igor-santos-logo.webp")} alt="" /><div><strong>Igor Santos</strong><span>IS Coach Treinamento</span></div></div><div className={styles.notificationControl}><button className="icon-button" aria-label={notificationsOpen ? "Fechar notificações" : "Abrir notificações"} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} />{unreadUpdates.length > 0 && <span className={styles.notificationBadge} aria-label={`${unreadUpdates.length} novidade${unreadUpdates.length === 1 ? "" : "s"}`}>{unreadUpdates.length}</span>}</button>{notificationsOpen && <section className={styles.notificationPanel} aria-label="Notificações"><div className={styles.notificationTitle}><strong>Notificações</strong>{unreadUpdates.length > 0 && <button onClick={() => markAsRead(unreadUpdates.map((update) => update.id))}>Marcar todas como lidas</button>}</div>{unreadUpdates.length > 0 ? unreadUpdates.map((update) => <button className={styles.notificationItem} key={update.id} onClick={() => openUpdate(update)}><Bell size={15} /><span>{update.message}</span><ChevronRight size={15} /></button>) : <p>Você não tem novas notificações.</p>}</section>}</div></header>
    <section className={styles.greeting}><div><h1>Olá, {user?.name ?? "aluno"}! <span>👋</span></h1><p>Bora continuar evoluindo hoje.</p></div><button className={styles.profileShortcut} onClick={() => onNavigate("profile")} aria-label="Abrir meu perfil">{dashboard?.profile?.avatar_url ? <img src={dashboard.profile.avatar_url} alt="Sua foto de perfil" /> : <span>{initials}</span>}</button></section>
    {message && <p className={styles.error} role="alert">{message}</p>}
    <section className={styles.workoutCard}><div className={styles.workoutCardTop}><p className="eyebrow">{workout?.current_session_id ? "Treino em andamento" : workout?.is_rest_day ? "Agenda de hoje" : "Próximo treino"}</p>{workout?.has_mobility && <button type="button" className={styles.mobilityBadge} onClick={() => onNavigate("training", "mobility")}>Mobilidade</button>}</div><div className={styles.workoutHero}><div><h2>{plan?.name ?? (workout?.is_rest_day ? "Dia de descanso" : "Nenhum treino ativo")}</h2><strong>{plan?.subtitle || (plan ? `${workout.active_plan_count} treino(s) disponível(is)` : workout?.is_rest_day ? "A sequência continua no próximo dia de treino" : "Aguarde a publicação do professor")}</strong><span>{plan?.estimated_duration_minutes ? `Aprox. ${formatWorkoutDuration(plan.estimated_duration_minutes * 60)}` : ""}</span></div><Dumbbell className={styles.dumbbell} aria-hidden="true" /></div><button className="primary-button" disabled={!workout?.active_plan_count} onClick={() => onNavigate("training")}>{workout?.current_session_id ? "Continuar treino" : "Ver treinos"} <ChevronRight size={17} /></button></section>
    <section className="surface-card"><div className={styles.weekHead}><div><span>Sua semana</span><strong>{workout?.completed_this_week ?? 0} de {workout?.weekly_target ?? 0} treinos realizados</strong></div><CalendarDays size={18} /></div><div className="progress-track"><span style={{ width: `${workout?.weekly_percentage ?? 0}%` }} /></div><small className={styles.percent}>{workout?.weekly_percentage ?? 0}%</small></section>
    <section className={styles.liveSummary}><article className="surface-card"><Activity size={18} /><span><strong>Última avaliação</strong><small>{dateLabel(assessment?.assessed_on)}</small><b>{assessment?.weight ? `${assessment.weight} kg` : "Sem peso"}{assessment?.body_fat_percentage ? ` · ${assessment.body_fat_percentage}% gordura` : ""}</b></span></article><article className="surface-card"><Utensils size={18} /><span><strong>{nutrition?.name ?? "Sem plano alimentar"}</strong><small>{nutrition ? `${nutrition.meal_count} refeições · ${nutrition.target_calories ?? "—"} kcal` : "Aguarde o professor"}</small><b>{nutrition ? `${(nutrition.hydration_amount_ml / 1000).toLocaleString("pt-BR")} / ${((nutrition.hydration_target_ml || 3000) / 1000).toLocaleString("pt-BR")} L de água` : ""}</b></span></article></section>
    <section className={styles.shortcuts} aria-label="Atalhos">{shortcuts.map(({ icon: Icon, label, page }) => <button key={label} className="surface-card" onClick={() => onNavigate(page)}><Icon size={20} /><span><strong>{label}</strong><small>{label === "Dieta" ? (nutrition ? "Plano ativo e hidratação" : "Nenhum plano ativo") : label === "Evolução" || label === "Avaliação física" ? (assessment ? `Última em ${dateLabel(assessment.assessed_on)}` : "Sem avaliações") : "Dados e consentimentos"}</small></span></button>)}</section>
    {contactHref ? <a className={`${styles.whatsapp} surface-card`} href={contactHref} target={dashboard?.contact?.whatsapp_url ? "_blank" : undefined} rel={dashboard?.contact?.whatsapp_url ? "noopener" : undefined}><span className={styles.whatsappIcon}><MessageCircle size={21} /></span><span><strong>Falar com o profissional</strong><small>{dashboard?.contact?.whatsapp_url ? "Abrir conversa no WhatsApp" : dashboard?.contact?.email}</small></span><ChevronRight size={18} /></a> : <div className={`${styles.whatsapp} surface-card`}><span className={styles.whatsappIcon}><MessageCircle size={21} /></span><span><strong>Contato indisponível</strong><small>O professor ainda não informou o canal de contato.</small></span></div>}
  </div>;
}
