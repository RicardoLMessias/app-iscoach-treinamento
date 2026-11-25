import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Check, ChevronLeft, ChevronRight, CircleHelp, Copy, Droplets, Dumbbell, KeyRound, LayoutDashboard, LogOut, Megaphone, Search, Send, Trash2, UserCheck, UserPlus, Users, Utensils, X } from "lucide-react";
import AboutPage from "../AboutPage/AboutPage.jsx";
import BrandMark from "../../shared/components/BrandMark/BrandMark.jsx";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import ProfessorAssessmentManager from "./ProfessorAssessmentManager.jsx";
import ProfessorWeeklyFeedbackOverview from "./ProfessorWeeklyFeedbackOverview.jsx";
import ProfessorTrainingManager from "./ProfessorTrainingManager.jsx";
import ProfessorNutritionManager from "./ProfessorNutritionManager.jsx";
import ProfessorInvitations from "./ProfessorInvitations.jsx";
import ProfessorUpdates from "./ProfessorUpdates.jsx";
import styles from "./ProfessorDashboard.module.css";

const emptyStudent = { name: "", email: "", birth_date: "", sex: "", phone: "", postal_code: "", address: "", address_number: "", address_complement: "", district: "", city: "", state: "", goals: [], professional_notes: "" };
const anamnesisFields = [
  ["family_diseases", "Doenças na família"], ["personal_diseases", "Doenças pessoais"], ["exercise_restrictions", "Restrições para exercícios"],
  ["surgeries", "Cirurgias"], ["allergies", "Alergias"], ["injuries", "Acidentes ou lesões"], ["medication_use", "Medicamentos"],
  ["body_pain", "Dores no corpo"], ["smoking", "Tabagismo"], ["diet", "Dieta atual"], ["current_activity", "Atividade atual"],
  ["current_frequency", "Frequência atual"], ["previous_activity", "Atividade anterior"], ["previous_duration", "Tempo de prática anterior"],
  ["previous_frequency", "Frequência anterior"], ["notes", "Observações da consulta"],
];
const passwordChecks = [["10 caracteres", (value) => value.length >= 10], ["letra maiúscula", (value) => /\p{Lu}/u.test(value)], ["letra minúscula", (value) => /\p{Ll}/u.test(value)], ["número", (value) => /\p{N}/u.test(value)], ["símbolo", (value) => /[^\p{L}\p{N}\s]/u.test(value)]];
const activityDate = (value) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(value));
const activityTime = (value) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const initialStudentPagination = { current_page: 1, last_page: 1, per_page: 20, total: 0 };

function StudentPagination({ pagination, busy, onPageChange }) {
  const { current_page: currentPage, last_page: lastPage, per_page: perPage, total } = pagination;
  if (lastPage <= 1) return null;
  const pages = [];
  for (let page = 1; page <= lastPage; page++) {
    if (page <= 2 || page >= lastPage - 1 || Math.abs(page - currentPage) <= 1) pages.push(page);
  }
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return <nav className={styles.studentPagination} aria-label="Páginas de alunos">
    <span>Mostrando {from}–{to} de {total} alunos</span>
    <div>
      <button type="button" disabled={busy || currentPage === 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
      {pages.map((page, index) => <span key={page} className={styles.pageSlot}>
        {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
        <button type="button" disabled={busy} data-active={page === currentPage} aria-current={page === currentPage ? "page" : undefined} aria-label={`Página ${page}`} onClick={() => onPageChange(page)}>{page}</button>
      </span>)}
      <button type="button" disabled={busy || currentPage === lastPage} onClick={() => onPageChange(currentPage + 1)} aria-label="Próxima página"><ChevronRight size={16} /></button>
    </div>
  </nav>;
}

const photoConsentLabels = {
  accepted: "Fotos autorizadas",
  revoked: "Autorização de fotos revogada",
  pending: "Fotos não autorizadas",
};

function PhotoConsentStatus({ student }) {
  const status = student.photo_consent?.status ?? "pending";
  return <small className={styles.photoConsent} data-status={status}>{photoConsentLabels[status]}</small>;
}

function ProfessorSecurityPanel({ onMessage }) {
  const [password, setPassword] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [busy, setBusy] = useState(false);
  const valid = passwordChecks.every(([, check]) => check(password.password)) && password.password === password.password_confirmation;
  const submit = async (event) => {
    event.preventDefault();
    if (!valid) { onMessage("Confira todos os requisitos e a confirmação da nova senha."); return; }
    setBusy(true); onMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/professor/profile/password", { method: "PUT", body: JSON.stringify(password) });
      setPassword({ current_password: "", password: "", password_confirmation: "" });
      onMessage(response.message);
    } catch (error) { onMessage(error.message); } finally { setBusy(false); }
  };

  return <section className={styles.panel}><h2>Segurança da conta</h2><p className={styles.securityNotice}>Use uma senha exclusiva. Ao alterá-la, as outras sessões abertas serão encerradas e um aviso será enviado por e-mail.</p><form className={styles.form} onSubmit={submit}><label className={styles.full}>Senha atual<input required type="password" autoComplete="current-password" maxLength={128} value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} /></label><label className={styles.full}>Nova senha<input required type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password.password} onChange={(event) => setPassword({ ...password, password: event.target.value })} /></label><ul className={styles.passwordRules}>{passwordChecks.map(([label, check]) => <li data-valid={check(password.password)} key={label}>{label}</li>)}<li data-valid={password.password_confirmation.length > 0 && password.password === password.password_confirmation}>senhas iguais</li></ul><label className={styles.full}>Confirmar nova senha<input required type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password.password_confirmation} onChange={(event) => setPassword({ ...password, password_confirmation: event.target.value })} /></label><button className="primary-button" disabled={busy || !valid}>{busy ? "Alterando…" : "Alterar senha"}</button></form></section>;
}

export default function ProfessorDashboard({ user }) {
  const [summary, setSummary] = useState({});
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [studentPagination, setStudentPagination] = useState(initialStudentPagination);
  const [studentsBusy, setStudentsBusy] = useState(false);
  const [studentStatus, setStudentStatus] = useState("active");
  const [studentCounts, setStudentCounts] = useState({ active: 0, inactive: 0 });
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(emptyStudent);
  const [answers, setAnswers] = useState({ parq: {} });
  const [tab, setTab] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  const dashboardColumnsRef = useRef(null);
  const layoutBeforeFeedbackToggle = useRef(null);

  // Anima a troca de layout do feedback semanal com os próprios elementos (sem "fotos" esticadas).
  // O painel anima largura, altura e deslocamento reais: o conteúdo interno (contadores, lista)
  // se reacomoda a cada quadro, então nada fica esticado nem escondido.
  const measureDashboardLayout = () => new Map([...(dashboardColumnsRef.current?.querySelectorAll("[data-flip]") ?? [])].map((element) => [element, element.getBoundingClientRect()]));
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toggleFeedbackLayout = (expanded) => {
    layoutBeforeFeedbackToggle.current = measureDashboardLayout();
    setFeedbackExpanded(expanded);
  };
  // Ao recolher, o painel aberto encolhe (com a lista ainda presente) até o tamanho e a posição do
  // cartão fechado, na coluna de "Precisam de atenção"; só então o layout muda.
  const collapseFeedbackPanel = async () => {
    const root = dashboardColumnsRef.current;
    const panel = root?.querySelector('[data-flip="feedback"]');
    const attention = root?.querySelector('[data-flip="attention"]');
    if (!panel || !attention || reducedMotion()) return;
    const box = panel.getBoundingClientRect(), column = attention.getBoundingClientRect();
    const list = panel.querySelector("#weekly-feedback-list");
    const collapsedHeight = Math.max(0, box.height - (list ? list.offsetHeight + 16 : 0));
    const timing = { duration: 380, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" };
    panel.style.overflow = "hidden";
    list?.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, duration: 180 });
    await panel.animate([
      { width: `${box.width}px`, height: `${box.height}px`, marginLeft: "0px" },
      { width: `${column.width}px`, height: `${collapsedHeight}px`, marginLeft: `${Math.max(0, column.left - box.left)}px` },
    ], timing).finished.catch(() => {});
  };
  useLayoutEffect(() => {
    const before = layoutBeforeFeedbackToggle.current;
    layoutBeforeFeedbackToggle.current = null;
    const panel = dashboardColumnsRef.current?.querySelector('[data-flip="feedback"]');
    // Remove o estado mantido no fim do recolhimento: o cartão já está no lugar final.
    panel?.getAnimations().forEach((animation) => animation.cancel());
    if (panel) panel.style.overflow = "";
    if (!before || reducedMotion()) return;
    const timing = { duration: 420, easing: "cubic-bezier(.22, 1, .36, 1)" };
    if (panel && feedbackExpanded && before.has(panel)) {
      // Parte do cartão fechado e cresce até a largura e a altura do painel aberto.
      const old = before.get(panel), now = panel.getBoundingClientRect();
      panel.style.overflow = "hidden";
      panel.animate([
        { width: `${old.width}px`, height: `${old.height}px`, marginLeft: `${Math.max(0, old.left - now.left)}px` },
        { width: `${now.width}px`, height: `${now.height}px`, marginLeft: "0px" },
      ], timing).finished.then(() => { panel.style.overflow = ""; }).catch(() => {});
    }
    // Os demais quadros deslizam da posição antiga; a medição já considera o primeiro quadro da animação do painel.
    for (const [element, old] of before) {
      if (element === panel || !element.isConnected) continue;
      const now = element.getBoundingClientRect();
      const dx = old.left - now.left, dy = old.top - now.top;
      if (dx || dy) element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], timing);
    }
  }, [feedbackExpanded]);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorStudents, setSelectorStudents] = useState([]);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [appliedSelectorSearch, setAppliedSelectorSearch] = useState("");
  const [selectorPagination, setSelectorPagination] = useState(initialStudentPagination);
  const [selectorBusy, setSelectorBusy] = useState(false);
  const [pendingModule, setPendingModule] = useState(null);
  const [activityPreview, setActivityPreview] = useState(null);
  const [recentStudentIds, setRecentStudentIds] = useState(() => { try { return JSON.parse(window.localStorage.getItem("is-coach:professor-recent-students") ?? "[]"); } catch { return []; } });
  const [invite, setInvite] = useState({ name: "", email: "", expires_in_days: 1 });
  const [invitationLink, setInvitationLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const lookupVersion = useRef(0);
  const [postalCodeMessage, setPostalCodeMessage] = useState("");

  const loadStudents = async (term = appliedSearch, page = studentPagination.current_page, status = studentStatus) => {
    setStudentsBusy(true);
    try {
      const response = await apiRequest(`/v1/professor/students?status=${status}&search=${encodeURIComponent(term)}&page=${page}`);
      setStudents(response.data);
      setStudentPagination(response.meta ?? initialStudentPagination);
      setStudentCounts(response.counts ?? { active: 0, inactive: 0 });
    } finally { setStudentsBusy(false); }
  };
  const changeStudentStatus = (status) => {
    setStudentStatus(status);
    loadStudents(appliedSearch, 1, status).catch((error) => setMessage(error.message));
  };

  const loadSelectorStudents = async (term = appliedSelectorSearch, page = selectorPagination.current_page) => {
    setSelectorBusy(true);
    try {
      const response = await apiRequest(`/v1/professor/students?search=${encodeURIComponent(term)}&page=${page}`);
      setSelectorStudents(response.data);
      setSelectorPagination(response.meta ?? initialStudentPagination);
    } finally { setSelectorBusy(false); }
  };

  const loadDashboard = async (page = 1, type = activityFilter, feedbackPage = summary.weekly_feedback?.pagination?.current_page ?? 1, weeklyStatus = feedbackFilter) => {
    setDashboardBusy(true);
    try {
      const response = await apiRequest(`/v1/professor/dashboard?activity_page=${page}&activity_type=${type}&feedback_page=${feedbackPage}&feedback_status=${weeklyStatus}`);
      setSummary(response.data);
    } finally { setDashboardBusy(false); }
  };

  useEffect(() => {
    Promise.all([apiRequest("/v1/professor/dashboard"), apiRequest("/v1/professor/students?status=active")]).then(([dashboardResponse, studentsResponse]) => {
      setSummary(dashboardResponse.data);
      setStudents(studentsResponse.data);
      setStudentPagination(studentsResponse.meta ?? initialStudentPagination);
      setStudentCounts(studentsResponse.counts ?? { active: 0, inactive: 0 });
    }).catch((error) => setMessage(error.message));
  }, []);
  const chooseStudent = async (id, destination = null) => {
    lookupVersion.current++;
    setPostalCodeMessage("");
    const response = await apiRequest(`/v1/professor/students/${id}`);
    setSelected(response.data);
    setProfile({ ...emptyStudent, ...response.data.profile, name: response.data.name, email: response.data.email, goals: response.data.profile?.goals ?? [] });
    setAnswers(response.data.anamnesis?.answers ?? { parq: {} });
    const recent = [response.data.id, ...recentStudentIds.filter((studentId) => studentId !== response.data.id)].slice(0, 5);
    setRecentStudentIds(recent); window.localStorage.setItem("is-coach:professor-recent-students", JSON.stringify(recent));
    setSelectorOpen(false); setPendingModule(null); setActivityPreview(null);
    if (destination) setTab(destination);
    setMessage("");
  };

  const clearStudentSelection = () => {
    lookupVersion.current++;
    setSelected(null); setProfile(emptyStudent); setAnswers({ parq: {} }); setPostalCodeMessage(""); setMessage("");
    if (tab === "profile" || tab === "anamnesis") setTab("students");
  };

  const openStudentSelector = async (destination = null) => {
    setPendingModule(destination); setSelectorSearch(""); setAppliedSelectorSearch(""); setSelectorOpen(true);
    try {
      await loadSelectorStudents("", 1);
    } catch (error) { setMessage(error.message); }
  };

  const searchSelector = async (event) => {
    event.preventDefault();
    try {
      setAppliedSelectorSearch(selectorSearch);
      await loadSelectorStudents(selectorSearch, 1);
    } catch (error) { setMessage(error.message); }
  };

  const openModule = (module) => {
    setTab(module); setMessage("");
  };

  const openStudentsList = () => {
    if (!window.matchMedia("(min-width: 1024px)").matches) setSelected(null);
    setTab("students"); setMessage("");
  };

  const submitInvite = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/professor/invitations", { method: "POST", body: JSON.stringify(invite) });
      setInvitationLink(response.data.invitation_url); setLinkCopied(false);
      setInvite({ name: "", email: "", expires_in_days: 1 }); setMessage("Convite enviado por e-mail. O link também está pronto para copiar.");
      const dashboardResponse = await apiRequest("/v1/professor/dashboard"); setSummary(dashboardResponse.data);
    } catch (error) { setMessage(error.message); }
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
    } catch {
      const field = document.createElement("textarea");
      field.value = invitationLink; field.style.position = "fixed"; field.style.opacity = "0";
      document.body.appendChild(field); field.select(); document.execCommand("copy"); field.remove();
    }
    setLinkCopied(true); setMessage("Link do convite copiado.");
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${selected.id}`, { method: "PUT", body: JSON.stringify(profile) });
      setSelected(response.data); setProfile((current) => ({ ...current, email: response.data.email })); setMessage(response.data.pending_email ? "Cadastro salvo. Confirme o novo e-mail pelo link enviado; o acesso atual continua válido." : "Cadastro atualizado e registrado na auditoria."); await loadStudents();
    } catch (error) { setMessage(error.message); }
  };

  const lookupPostalCode = async () => {
    const version = ++lookupVersion.current;
    const postalCode = String(profile.postal_code ?? "").replace(/\D/g, "");
    if (postalCode.length !== 8) {
      setPostalCodeMessage("Digite os 8 números do CEP.");
      return;
    }

    setPostalCodeMessage("Consultando CEP…");
    try {
      const response = await apiRequest(`/v1/address/cep/${postalCode}`);
      if (version !== lookupVersion.current) return;
      setProfile((current) => ({
        ...current,
        postal_code: response.data.postal_code,
        address: response.data.address || current.address,
        district: response.data.district || current.district,
        city: response.data.city || current.city,
        state: response.data.state || current.state,
      }));
      setPostalCodeMessage("Endereço preenchido. Confira os dados e informe o número.");
    } catch (error) {
      if (version === lookupVersion.current) setPostalCodeMessage(error.message);
    }
  };

  const saveAnamnesis = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${selected.id}/anamnesis`, { method: "PUT", body: JSON.stringify({ answers }) });
      setMessage(`Anamnese salva — versão ${response.data.version}.`);
    } catch (error) { setMessage(error.message); }
  };

  const toggleAccess = async () => {
    await initializeCsrf();
    const activate = selected.status === "inactive";
    await apiRequest(`/v1/professor/students/${selected.id}/access`, { method: activate ? "POST" : "DELETE" });
    // O aluno sai da lista atual (ativos ou desativados); volta uma página se ele era o último desta.
    await chooseStudent(selected.id); await loadStudents(appliedSearch, Math.max(1, studentPagination.current_page - (students.length === 1 ? 1 : 0))); setMessage(activate ? "Conta reativada." : "Conta desativada.");
  };

  const deleteStudent = async () => {
    const confirmed = window.confirm(`Excluir definitivamente o cadastro de ${selected.name}? Todos os dados vinculados serão apagados. Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/students/${selected.id}`, { method: "DELETE" });
      lookupVersion.current++; setSelected(null); setTab("students"); setMessage("Cadastro do aluno excluído definitivamente.");
      await loadStudents(appliedSearch, Math.max(1, studentPagination.current_page - (students.length === 1 ? 1 : 0)));
      const dashboardResponse = await apiRequest("/v1/professor/dashboard"); setSummary(dashboardResponse.data);
    } catch (error) { setMessage(error.message); }
  };

  const logout = async () => {
    await initializeCsrf();
    await apiRequest("/v1/auth/logout", { method: "POST" });
    window.location.assign("/login");
  };

  const field = (name, label, type = "text") => <label>{label}<input required={name !== "address_complement"} type={type} value={profile[name] ?? ""} onChange={(event) => { lookupVersion.current++; setPostalCodeMessage(""); setProfile({ ...profile, [name]: event.target.value }); }} /></label>;
  const recentSelectorStudents = recentStudentIds.map((id) => selectorStudents.find((student) => student.id === id)).filter(Boolean);
  const otherSelectorStudents = selectorStudents.filter((student) => !recentStudentIds.includes(student.id));

  return <main className={styles.app}>
    <header><BrandMark /><div><p className="eyebrow">Área do professor</p><h1>Olá, {user.name}</h1></div><button className={styles.logout} onClick={() => logout().catch((error) => setMessage(error.message))} aria-label="Sair"><LogOut size={18} /></button></header>
    {tab !== "security" && tab !== "updates" && tab !== "about" && <section className={styles.desktopStudentBar} aria-label="Contexto do aluno"><div className={styles.studentIdentity}>{selected ? <><span className={styles.avatar}>{selected.name.slice(0, 2).toUpperCase()}</span><span><small>Aluno selecionado</small><strong>{selected.name}</strong><em>{selected.email}</em></span></> : <><span className={styles.emptyStudentIcon}><Users size={19} /></span><span><small>Contexto de atendimento</small><strong>Nenhum aluno selecionado</strong><em>Selecione para trabalhar nos dados individuais de um aluno.</em></span></>}</div><div className={styles.studentBarActions}>{selected && <button type="button" className={styles.clearStudent} onClick={clearStudentSelection}>Tirar seleção</button>}<button type="button" onClick={() => openStudentSelector(tab).catch((error) => setMessage(error.message))}>{selected ? "Trocar aluno" : "Selecionar aluno"}</button></div></section>}
    <div className={styles.mobileOverview}><section className={styles.stats}>
      <article><Users /><strong>{summary.active_students ?? 0}</strong><span>Alunos ativos</span></article>
      <article><UserCheck /><strong>{summary.pending_invitations ?? 0}</strong><span>Convites pendentes</span></article>
      <article><Activity /><strong>{summary.inactive_students ?? 0}</strong><span>Inativos</span></article>
    </section>
    <section className={styles.stats} aria-label="Indicadores operacionais">
      <article><Activity /><strong>{summary.workouts_completed_this_week ?? 0}</strong><span>Treinos na semana</span></article>
      <article><Activity /><strong>{summary.assessments_last_30_days ?? 0}</strong><span>Avaliações em 30 dias</span></article>
      <article><Dumbbell /><strong>{summary.students_without_active_workout ?? 0}</strong><span>Sem treino ativo</span></article>
      <article><Utensils /><strong>{summary.students_without_active_nutrition ?? 0}</strong><span>Sem alimentação ativa</span></article>
    </section></div>

    {selected && tab !== "security" && tab !== "updates" && tab !== "about" && <section className={styles.studentContext} aria-label="Aluno selecionado"><div><small>Aluno selecionado</small><strong>{selected.name}</strong><span>{selected.email}</span></div><div className={styles.contextActions}><button type="button" onClick={() => { setTab("profile"); setMessage(""); }}>Cadastro e anamnese</button><button type="button" onClick={clearStudentSelection}>Tirar seleção</button></div></section>}
    <nav className={styles.moduleNav} aria-label="Módulos do professor"><button data-active={tab === "dashboard"} onClick={() => { setTab("dashboard"); setMessage(""); }}><LayoutDashboard size={16} /> Visão geral</button><button data-active={['students', 'invite', 'invitations', 'profile', 'anamnesis'].includes(tab)} onClick={openStudentsList}><Users size={16} /> Alunos</button><button data-active={tab === "training"} onClick={() => openModule("training")}><Activity size={16} /> Treinos</button><button data-active={tab === "assessments"} onClick={() => openModule("assessments")}><Activity size={16} /> Avaliações</button><button data-active={tab === "nutrition"} onClick={() => openModule("nutrition")}><Utensils size={16} /> Alimentação</button><button data-active={tab === "security"} onClick={() => { setTab("security"); setMessage(""); }}><KeyRound size={16} /> Segurança</button><button data-active={tab === "updates"} onClick={() => { setTab("updates"); setMessage(""); }}><Megaphone size={16} /> Atualizações</button><button data-active={tab === "about"} onClick={() => { setTab("about"); setMessage(""); }}><CircleHelp size={16} /> Sobre o app</button></nav>
    {tab === "dashboard" && <section className={styles.desktopDashboard}>
      <div className={styles.dashboardHeading}><div><p className="eyebrow">Acompanhamento dos alunos</p><h2>Visão geral da semana</h2><span>Atividades registradas nos últimos 7 dias.</span></div><button type="button" onClick={() => loadDashboard().catch((error) => setMessage(error.message))} disabled={dashboardBusy}>{dashboardBusy ? "Atualizando…" : "Atualizar painel"}</button></div>
      <section className={styles.desktopStats} aria-label="Indicadores principais">
        <article><Users /><span><strong>{summary.active_students ?? 0}</strong><small>Alunos ativos</small></span></article>
        <article><Dumbbell /><span><strong>{summary.workouts_completed_this_week ?? 0}</strong><small>Treinos na semana</small></span></article>
        <article><UserCheck /><span><strong>{summary.pending_invitations ?? 0}</strong><small>Convites pendentes</small></span></article>
        <article data-alert={(summary.students_inactive_over_3_days ?? 0) > 0}><AlertTriangle /><span><strong>{summary.students_inactive_over_3_days ?? 0}</strong><small>Sem treinar há 3 dias</small></span></article>
      </section>
      <div ref={dashboardColumnsRef} className={styles.dashboardColumns} data-feedback-expanded={feedbackExpanded}>
        <section data-flip="activity" className={styles.activityPanel}><div className={styles.sectionHeading}><div><h2>Atividades recentes</h2><span>Treinos, água e feedback da semana</span></div><div className={styles.activityFilters}>{[["all", "Todas"], ["workout", "Treinos"], ["hydration", "Água"], ["feedback", "Feedback"]].map(([value, label]) => <button type="button" data-active={activityFilter === value} key={value} onClick={() => { setActivityFilter(value); loadDashboard(1, value).catch((error) => setMessage(error.message)); }}>{label}</button>)}</div></div>
          <div className={styles.activityList}>{summary.activity_feed?.items?.length ? summary.activity_feed.items.map((activityItem) => <button type="button" key={activityItem.id} onClick={() => setActivityPreview(activityItem)}><span className={styles.activityIcon} data-type={activityItem.type}>{activityItem.type === "hydration" ? <Droplets size={18} /> : activityItem.type === "feedback" ? <Megaphone size={18} /> : <Dumbbell size={18} />}</span><span><strong>{activityItem.student_name}</strong><small>{activityItem.message}</small></span><time><strong>{activityTime(activityItem.occurred_at)}</strong><small>{activityDate(activityItem.occurred_at)}</small></time><ChevronRight size={17} /></button>) : <div className={styles.emptyActivity}>Nenhuma atividade encontrada neste período.</div>}</div>
          {(summary.activity_feed?.pagination?.last_page ?? 1) > 1 && <div className={styles.pagination}><button type="button" disabled={dashboardBusy || summary.activity_feed.pagination.current_page === 1} onClick={() => loadDashboard(summary.activity_feed.pagination.current_page - 1).catch((error) => setMessage(error.message))}><ChevronLeft size={16} /> Anterior</button><span>Página {summary.activity_feed.pagination.current_page} de {summary.activity_feed.pagination.last_page}</span><button type="button" disabled={dashboardBusy || summary.activity_feed.pagination.current_page === summary.activity_feed.pagination.last_page} onClick={() => loadDashboard(summary.activity_feed.pagination.current_page + 1).catch((error) => setMessage(error.message))}>Próxima <ChevronRight size={16} /></button></div>}
        </section>
        <div className={styles.dashboardSidebar}>
          <div data-flip="feedback" className={styles.feedbackSlot}>
            <ProfessorWeeklyFeedbackOverview
              data={summary.weekly_feedback}
              onFilter={(value) => { setFeedbackFilter(value); loadDashboard(summary.activity_feed?.pagination?.current_page ?? 1, activityFilter, 1, value).catch((error) => setMessage(error.message)); }}
              onPage={(page) => loadDashboard(summary.activity_feed?.pagination?.current_page ?? 1, activityFilter, page, feedbackFilter).catch((error) => setMessage(error.message))}
              onRefresh={() => loadDashboard(summary.activity_feed?.pagination?.current_page ?? 1, activityFilter, summary.weekly_feedback?.pagination?.current_page ?? 1, feedbackFilter)}
              onStudentSelect={(id) => chooseStudent(id, "assessments").catch((error) => setMessage(error.message))}
              onExpandedChange={toggleFeedbackLayout}
              beforeCollapse={collapseFeedbackPanel}
            />
          </div>
          <aside data-flip="attention" className={styles.attentionPanel}><div className={styles.sectionHeading}><div><h2>Precisam de atenção</h2><span>Mais de 3 dias sem concluir treino</span></div></div><div className={styles.attentionList}>{summary.inactive_students_attention?.length ? summary.inactive_students_attention.map((student) => <button type="button" key={student.id} onClick={() => chooseStudent(student.id, "dashboard").catch((error) => setMessage(error.message))}><span className={styles.avatar}>{student.name.slice(0, 2).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.last_workout_at ? `Último treino há ${student.days_without_workout} dias` : `Nenhum treino concluído há ${student.days_without_workout} dias`}</small></span><ChevronRight size={16} /></button>) : <div className={styles.emptyActivity}>Todos os alunos estão em dia.</div>}</div><div className={styles.pendingCards}><button onClick={() => setTab("students")}><Dumbbell /><span><strong>{summary.students_without_active_workout ?? 0}</strong><small>Sem treino ativo</small></span></button><button onClick={() => setTab("students")}><Utensils /><span><strong>{summary.students_without_active_nutrition ?? 0}</strong><small>Sem alimentação ativa</small></span></button></div></aside>
        </div>
      </div>
    </section>}
    {tab === "training" && <ProfessorTrainingManager key={selected?.id ?? "none"} student={selected} />}
    {tab === "assessments" && <ProfessorAssessmentManager key={selected?.id ?? "none"} student={selected} />}
    {tab === "nutrition" && <ProfessorNutritionManager key={selected?.id ?? "none"} student={selected} />}
    {tab === "security" && <ProfessorSecurityPanel onMessage={setMessage} />}
    {tab === "updates" && <ProfessorUpdates />}
    {tab === "about" && <AboutPage role="professor" />}

    {tab === "students" && <section className={styles.panel}>
      <div className={styles.title}><h2>Alunos</h2><div className={styles.studentListActions}><button type="button" onClick={() => setTab("invitations")}>Convites enviados</button><button type="button" onClick={() => setTab("invite")}><UserPlus size={16} /> Convidar</button></div></div>
      <div className={styles.statusTabs} role="tablist" aria-label="Situação dos alunos">{[["active", "Ativos"], ["inactive", "Desativados"]].map(([value, label]) => <button type="button" role="tab" key={value} aria-selected={studentStatus === value} data-active={studentStatus === value} disabled={studentsBusy} onClick={() => changeStudentStatus(value)}>{label} <span>{studentCounts[value] ?? 0}</span></button>)}</div>
      <form className={styles.search} onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search); loadStudents(search, 1).catch((error) => setMessage(error.message)); }}><Search size={17} /><input placeholder="Buscar nome ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} /><button disabled={studentsBusy}>Buscar</button></form>
      <div className={styles.list}>{students.length ? students.map((student) => <button key={student.id} onClick={() => chooseStudent(student.id, "profile").catch((error) => setMessage(error.message))}><span className={styles.avatar}>{student.name.slice(0, 2).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small><PhotoConsentStatus student={student} /></span><em data-active={student.status === "active"}>{student.status === "active" ? "Ativo" : "Inativo"}</em></button>) : <div className={styles.emptyActivity}>Nenhum aluno encontrado.</div>}</div>
      <StudentPagination pagination={studentPagination} busy={studentsBusy} onPageChange={(page) => loadStudents(appliedSearch, page).catch((error) => setMessage(error.message))} />
    </section>}

    {tab === "invitations" && <><button className={styles.back} type="button" onClick={() => setTab("students")}>← Voltar aos alunos</button><ProfessorInvitations onMessage={setMessage} onNew={() => setTab("invite")} onChange={() => loadDashboard().catch((error) => setMessage(error.message))} /></>}

    {tab === "invite" && <section className={styles.panel}><button className={styles.back} onClick={() => setTab("students")}>← Voltar</button><h2>Novo convite</h2><form className={styles.form} onSubmit={submitInvite}><label>Nome<input required value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} /></label><label>E-mail<input required type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} /></label><label>Validade<select value={invite.expires_in_days} onChange={(event) => setInvite({ ...invite, expires_in_days: Number(event.target.value) })}><option value={1}>1 dia</option><option value={2}>2 dias</option><option value={3}>3 dias</option></select></label><button className="primary-button"><Send size={16} /> Enviar convite</button></form>{invitationLink && <div className={styles.invitationLink}><span>Link do convite</span><div><input readOnly value={invitationLink} aria-label="Link do convite" /><button type="button" onClick={copyInvitationLink}>{linkCopied ? <Check size={16} /> : <Copy size={16} />}{linkCopied ? "Copiado" : "Copiar link"}</button></div><small>Este link é exibido somente agora. Envie-o apenas para o aluno convidado.</small></div>}</section>}

    {selected && (tab === "profile" || tab === "anamnesis") && <section className={styles.panel}><button className={styles.back} onClick={() => { setSelected(null); setTab("students"); }}>← Alunos</button><div className={styles.title}><div><h2>{selected.name}</h2><small>{selected.email}</small></div><button className={styles.access} onClick={() => toggleAccess().catch((error) => setMessage(error.message))}>{selected.status === "active" ? "Desativar" : "Reativar"}</button></div><div className={styles.tabs}><button data-active={tab === "profile"} onClick={() => setTab("profile")}>Cadastro</button><button data-active={tab === "anamnesis"} onClick={() => setTab("anamnesis")}>Anamnese</button></div>{tab === "profile" ? <form className={styles.form} onSubmit={saveProfile}>{field("name", "Nome completo")}{field("email", "E-mail", "email")}{field("birth_date", "Data de nascimento", "date")}<label>Sexo<select required value={profile.sex ?? ""} onChange={(event) => setProfile({ ...profile, sex: event.target.value })}><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option><option value="prefiro_nao_informar">Prefiro não informar</option></select></label>{field("phone", "Telefone")}<label>CEP<input required value={profile.postal_code ?? ""} onChange={(event) => { lookupVersion.current++; setPostalCodeMessage(""); setProfile({ ...profile, postal_code: event.target.value }); }} onBlur={lookupPostalCode} /><small>{postalCodeMessage || "Ao sair do campo, buscaremos o endereço."}</small></label>{field("address", "Endereço")}{field("address_number", "Número")}{field("address_complement", "Complemento")}{field("district", "Bairro")}{field("city", "Cidade")}{field("state", "UF")}<label>Objetivos<input value={(profile.goals ?? []).join(", ")} onChange={(event) => setProfile({ ...profile, goals: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><label className={styles.full}>Observações profissionais<textarea value={profile.professional_notes ?? ""} onChange={(event) => setProfile({ ...profile, professional_notes: event.target.value })} /></label><button className="primary-button">Salvar cadastro</button></form> : <form className={styles.form} onSubmit={saveAnamnesis}>{anamnesisFields.map(([name, label]) => <label key={name} className={name === "notes" ? styles.full : ""}>{label}<textarea value={answers[name] ?? ""} onChange={(event) => setAnswers({ ...answers, [name]: event.target.value })} /></label>)}<fieldset className={styles.full}><legend>PAR-Q</legend>{[["heart_condition", "Problema cardíaco"], ["chest_pain_activity", "Dor no peito durante atividade"], ["chest_pain_recent", "Dor no peito no último mês"], ["dizziness", "Tontura ou perda de consciência"], ["bone_joint_problem", "Problema ósseo ou articular"], ["blood_pressure_medication", "Medicamento para pressão/coração"], ["other_restriction", "Outro impedimento"]].map(([key, label]) => <label className={styles.check} key={key}><input type="checkbox" checked={Boolean(answers.parq?.[key])} onChange={(event) => setAnswers({ ...answers, parq: { ...answers.parq, [key]: event.target.checked } })} />{label}</label>)}</fieldset><button className="primary-button">Salvar anamnese</button></form>}</section>}
    {selected && (tab === "profile" || tab === "anamnesis") && <section className={styles.dangerZone}><div><strong>Excluir cadastro</strong><span>Apaga definitivamente a conta e todos os dados vinculados.</span></div><button type="button" onClick={deleteStudent}><Trash2 size={16} /> Excluir definitivamente</button></section>}
    {selectorOpen && <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectorOpen(false); }}><section className={styles.studentDrawer} role="dialog" aria-modal="true" aria-labelledby="student-selector-title">
      <div className={styles.drawerHeader}><div><small>Contexto de atendimento</small><h2 id="student-selector-title">Selecionar aluno</h2><span>A página atual será mantida após a seleção.</span></div><button type="button" aria-label="Fechar seletor" onClick={() => setSelectorOpen(false)}><X size={20} /></button></div>
      <form className={styles.drawerSearch} onSubmit={searchSelector}><Search size={18} /><input autoFocus placeholder="Buscar por nome ou e-mail" value={selectorSearch} onChange={(event) => setSelectorSearch(event.target.value)} /><button disabled={selectorBusy}>Buscar</button></form>
      {recentSelectorStudents.length > 0 && <div className={styles.selectorGroup}><h3>Acessados recentemente</h3>{recentSelectorStudents.map((student) => <button type="button" key={`recent-${student.id}`} onClick={() => chooseStudent(student.id, pendingModule ?? tab).catch((error) => setMessage(error.message))}><span className={styles.avatar}>{student.name.slice(0, 2).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small></span><em data-active={student.status === "active"}>{student.status === "active" ? "Ativo" : "Inativo"}</em><ChevronRight size={16} /></button>)}</div>}
      <div className={styles.selectorGroup}><h3>{recentSelectorStudents.length ? "Todos os alunos" : "Alunos"}</h3>{otherSelectorStudents.length ? otherSelectorStudents.map((student) => <button type="button" key={student.id} onClick={() => chooseStudent(student.id, pendingModule ?? tab).catch((error) => setMessage(error.message))}><span className={styles.avatar}>{student.name.slice(0, 2).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small></span><em data-active={student.status === "active"}>{student.status === "active" ? "Ativo" : "Inativo"}</em><ChevronRight size={16} /></button>) : !selectorStudents.length && <div className={styles.emptyActivity}>Nenhum aluno encontrado.</div>}</div>
      <StudentPagination pagination={selectorPagination} busy={selectorBusy} onPageChange={(page) => loadSelectorStudents(appliedSelectorSearch, page).catch((error) => setMessage(error.message))} />
    </section></div>}
    {activityPreview && <div className={styles.drawerBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivityPreview(null); }}><section className={`${styles.studentDrawer} ${styles.previewDrawer}`} role="dialog" aria-modal="true" aria-labelledby="activity-preview-title"><div className={styles.drawerHeader}><div><small>Atividade recente</small><h2 id="activity-preview-title">{activityPreview.student_name}</h2><span>{activityDate(activityPreview.occurred_at)} às {activityTime(activityPreview.occurred_at)}</span></div><button type="button" aria-label="Fechar atividade" onClick={() => setActivityPreview(null)}><X size={20} /></button></div><div className={styles.activityPreviewCard}><span className={styles.activityIcon} data-type={activityPreview.type}>{activityPreview.type === "hydration" ? <Droplets size={20} /> : activityPreview.type === "feedback" ? <Megaphone size={20} /> : <Dumbbell size={20} />}</span><div><strong>{activityPreview.student_name}</strong><span>{activityPreview.message}</span></div></div><div className={styles.previewActions}><button type="button" onClick={() => chooseStudent(activityPreview.student_id, "dashboard").catch((error) => setMessage(error.message))}>Selecionar aluno</button><button type="button" onClick={() => chooseStudent(activityPreview.student_id, activityPreview.type === "feedback" ? "assessments" : "training").catch((error) => setMessage(error.message))}>{activityPreview.type === "feedback" ? "Ver feedback" : "Ver treinos"}</button><button type="button" onClick={() => chooseStudent(activityPreview.student_id, "profile").catch((error) => setMessage(error.message))}>Ver cadastro</button></div></section></div>}
    {message && <div className={styles.toast}>{message}</div>}
  </main>;
}
