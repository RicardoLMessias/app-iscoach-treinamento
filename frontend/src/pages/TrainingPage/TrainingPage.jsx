import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock3, Dumbbell, MessageSquareText, Play, TriangleAlert, X } from "lucide-react";
import { apiRequest, appPath, initializeCsrf } from "../../services/http/apiClient.js";
import { useRestTimer } from "../../features/training/restTimerStore.js";
import ScreenHeader from "../../shared/components/ScreenHeader/ScreenHeader.jsx";
import { formatWorkoutDuration } from "../../shared/formatWorkoutDuration.js";
import { orderPlansForStudent } from "../../features/training/orderWorkoutPlans.js";
import styles from "./TrainingPage.module.css";

const weekdayLabels = { monday: "Segunda-feira", tuesday: "Terça-feira", wednesday: "Quarta-feira", thursday: "Quinta-feira", friday: "Sexta-feira", saturday: "Sábado", sunday: "Domingo" };
const executionTimerKey = "iscoach-execution-timer";
const formatCountdown = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
function readExecutionTimer() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(executionTimerKey) || "null");
    return saved && Number.isFinite(saved.startedAt) && Number.isFinite(saved.sessionId) && Number.isFinite(saved.exerciseId) && Number.isFinite(saved.setNumber) ? saved : null;
  } catch { return null; }
}

function embedVideoUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return null;
    let videoId = null;
    if (parsed.hostname === "youtu.be" && /^\/[A-Za-z0-9_-]{11}\/?$/.test(parsed.pathname)) videoId = parsed.pathname.split("/")[1];
    if (["youtube.com", "www.youtube.com"].includes(parsed.hostname)) {
      if (parsed.pathname === "/watch" && /^[A-Za-z0-9_-]{11}$/.test(parsed.searchParams.get("v") ?? "")) videoId = parsed.searchParams.get("v");
      else videoId = parsed.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
    }
    if (parsed.hostname === "www.youtube-nocookie.com") videoId = parsed.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
    if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(parsed.hostname)) {
      const vimeoId = parsed.pathname.match(/^\/(?:video\/)?([0-9]{6,12})\/?$/)?.[1];
      if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
    }
  } catch { return null; }
  return null;
}

function sessionCompletion(session) {
  const exercises = session?.exercises ?? [];
  const prescribedSets = exercises.reduce((sum, exercise) => sum + (exercise.prescribed_sets ?? exercise.sets.length), 0);
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const activities = session?.activities ?? [];
  const completedActivities = activities.filter((activity) => activity.completed).length;
  return {
    completedActivities,
    completedSets,
    incompleteExercises: exercises.filter((exercise) => exercise.sets.length < (exercise.prescribed_sets ?? exercise.sets.length)).map((exercise) => ({
      name: exercise.exercise?.name ?? exercise.exercise_name,
      missingSets: (exercise.prescribed_sets ?? exercise.sets.length) - exercise.sets.length,
    })),
    missingActivities: activities.length - completedActivities,
    missingSets: prescribedSets - completedSets,
  };
}

export default function TrainingPage({ initialMovement = "exercise" }) {
  const [plans, setPlans] = useState([]);
  const [schedule, setSchedule] = useState({ mode: "rotating", rest_days: [], recommended_plan_id: null });
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("workout");
  const [movementTabs, setMovementTabs] = useState({});
  const [selected, setSelected] = useState(null);
  const [exerciseTab, setExerciseTab] = useState("execution");
  const [videoStarted, setVideoStarted] = useState(false);
  const [setValues, setSetValues] = useState({});
  const [pendingSets, setPendingSets] = useState({});
  const [finishConfirmation, setFinishConfirmation] = useState(null);
  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [executionTimer, setExecutionTimer] = useState(readExecutionTimer);
  const { prepareAlarm, reset: resetRestTimer, start: startRestTimer } = useRestTimer();

  const loadData = async () => {
    const [planResponse, sessionResponse, historyResponse] = await Promise.all([apiRequest("/v1/student/workouts"), apiRequest("/v1/student/workout/session"), apiRequest("/v1/student/workouts/history")]);
    setPlans(planResponse.data); setSchedule(planResponse.schedule ?? { mode: "rotating", rest_days: [], recommended_plan_id: null }); setSession(sessionResponse.data); setHistory(historyResponse.data);
  };

  useEffect(() => {
    Promise.all([apiRequest("/v1/student/workouts"), apiRequest("/v1/student/workout/session"), apiRequest("/v1/student/workouts/history")])
      .then(([planResponse, sessionResponse, historyResponse]) => { setPlans(planResponse.data); setSchedule(planResponse.schedule ?? { mode: "rotating", rest_days: [], recommended_plan_id: null }); setSession(sessionResponse.data); setHistory(historyResponse.data); })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) return undefined;
    const updateClock = () => setClockNow(Date.now());
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [sessionId]);
  const sessionElapsed = session?.started_at
    ? formatWorkoutDuration(Math.max(0, Math.floor((clockNow - new Date(session.started_at).getTime()) / 1000)))
    : null;
  const exercises = session?.exercises ?? [];
  const prescribedSets = (exercise) => exercise.prescribed_sets ?? exercise.sets;
  const details = (item) => item.exercise ?? { name: item.exercise_name, muscle_group: { name: item.muscle_group_name }, video_url: item.video_url, thumbnail_url: item.thumbnail_url, instructions: item.instructions };
  const completedSet = (exercise, number) => exercise.sets?.find((item) => item.set_number === number);
  const inputKey = (exercise, number, field) => `${exercise.id}:${number}:${field}`;
  const inputValue = (exercise, number, field) => setValues[inputKey(exercise, number, field)] ?? completedSet(exercise, number)?.[field] ?? (field === "load" ? exercise.target_load ?? "" : exercise.reps_min);
  const clearExecutionTimer = () => { window.localStorage.removeItem(executionTimerKey); setExecutionTimer(null); };
  const startExecutionTimer = (exercise, number) => {
    const timer = { sessionId: session.id, exerciseId: exercise.id, setNumber: number, startedAt: Date.now() };
    window.localStorage.setItem(executionTimerKey, JSON.stringify(timer));
    setExecutionTimer(timer); setClockNow(timer.startedAt); setMessage("");
  };
  const activeExecutionTimer = (exercise, number) => executionTimer?.sessionId === session?.id && executionTimer.exerciseId === exercise.id && executionTimer.setNumber === number ? executionTimer : null;
  const openExercise = (index) => { setSelected(index); setExerciseTab("execution"); setVideoStarted(false); };

  const startSession = async (workoutPlan) => {
    if (starting || session) return;
    setStarting(true);
    try {
      await initializeCsrf(); const response = await apiRequest("/v1/student/workout/session", { method: "POST", body: JSON.stringify({ workout_plan_id: workoutPlan.id }) });
      setSession(response.data); setSetValues({}); resetRestTimer(); clearExecutionTimer();
      const preferredCategory = movementTabs[workoutPlan.id] ?? initialMovement;
      const preferredIndex = response.data.exercises.findIndex((item) => (item.category ?? "exercise") === preferredCategory);
      openExercise(preferredIndex >= 0 ? preferredIndex : 0); setMessage("");
    } catch (error) { setMessage(error.message); }
    finally { setStarting(false); }
  };

  const toggleSet = async (exercise, number) => {
    const completed = completedSet(exercise, number);
    const timer = activeExecutionTimer(exercise, number);
    if (!completed && exercise.measurement_type === "time" && !timer) { setMessage("Inicie o cronômetro desta série antes de concluí-la."); return; }
    const durationSeconds = timer ? Math.min(3600, Math.max(1, Math.floor((Date.now() - timer.startedAt) / 1000))) : null;
    const url = `/v1/student/workout/sessions/${session.id}/exercises/${exercise.id}/sets/${number}`;
    const pendingKey = `${exercise.id}:${number}`;
    if (pendingSets[pendingKey]) return;
    prepareAlarm();
    setPendingSets((current) => ({ ...current, [pendingKey]: true }));
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      await initializeCsrf();
      if (completed) await apiRequest(url, { method: "DELETE" });
      else await apiRequest(url, { method: "PUT", body: JSON.stringify({ load: inputValue(exercise, number, "load") === "" ? null : Number(inputValue(exercise, number, "load")), ...(exercise.measurement_type === "time" ? { duration_seconds: durationSeconds } : { repetitions: Number(inputValue(exercise, number, "repetitions")) }) }) });
      const refreshed = await apiRequest("/v1/student/workout/session"); setSession(refreshed.data);
      if (timer) clearExecutionTimer();
      if (!completed && number < prescribedSets(exercise)) startRestTimer(exercise.rest_seconds, details(exercise).name);
    } catch (error) { setMessage(error.message); }
    finally { setPendingSets((current) => { const next = { ...current }; delete next[pendingKey]; return next; }); }
  };

  const finishSession = async (confirmIncomplete = false) => {
    if (finishing) return;
    setFinishing(true);
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/student/workout/sessions/${session.id}/complete`, { method: "POST", body: JSON.stringify({ confirm_incomplete: confirmIncomplete }) });
      resetRestTimer(); clearExecutionTimer(); setSession(null); setSelected(null); setFinishConfirmation(null);
      setMessage(response.data.is_partial ? "Treino finalizado com pendências. O registro foi salvo no histórico." : "Treino concluído com sucesso.");
      await loadData(); setActiveTab("history");
    } catch (error) { setMessage(error.message); }
    finally { setFinishing(false); }
  };

  const requestFinishSession = () => {
    const completion = sessionCompletion(session);
    const isIncomplete = completion.missingSets > 0 || completion.missingActivities > 0;
    if (!isIncomplete) {
      finishSession();
      return;
    }
    if ((completion.completedSets + completion.completedActivities) === 0) {
      setMessage("Conclua ao menos uma série ou atividade antes de finalizar. Se iniciou por engano, use “Cancelar treino iniciado por engano”.");
      return;
    }
    setFinishConfirmation(completion);
  };

  const cancelSession = async () => {
    if (!session || cancelling) return;
    setCancelling(true);
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/student/workout/sessions/${session.id}`, { method: "DELETE" });
      resetRestTimer(); clearExecutionTimer(); setSession(null); setSelected(null); setCancelConfirmation(false); setFinishConfirmation(null);
      await loadData(); setActiveTab("workout"); setMessage(response.message);
    } catch (error) { setMessage(error.message); }
    finally { setCancelling(false); }
  };

  const toggleActivity = async (index, completed) => {
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/student/workout/sessions/${session.id}/activities/${index}`, { method: "PUT", body: JSON.stringify({ completed: !completed }) });
      setSession(response.data); setMessage("");
    } catch (error) { setMessage(error.message); }
  };

  if (loading) return <div className={styles.page}><ScreenHeader /><div className="surface-card">Carregando treino…</div></div>;


  if (selected !== null && session) {
    const prescription = exercises[selected]; const exercise = details(prescription); const embedUrl = embedVideoUrl(exercise.video_url);
    const sameCategory = exercises.map((item, index) => ({ item, index })).filter(({ item }) => (item.category ?? "exercise") === (prescription.category ?? "exercise"));
    const categoryPosition = sameCategory.findIndex(({ index }) => index === selected);
    const nextInCategory = sameCategory[categoryPosition + 1]?.index;
    const hasProfessorGuidance = Boolean(prescription.notes?.trim());
    return <div className={styles.page}>
      <div className={styles.exerciseStickyHeader}>
        <ScreenHeader back onBack={() => setSelected(null)} title={exercise.name} subtitle={`${exercise.muscle_group.name} · ${prescription.category === "mobility" ? "mobilidade" : "exercício"} ${categoryPosition + 1} de ${sameCategory.length}`} />
        <div className={styles.counter}>{categoryPosition + 1} / {sameCategory.length}</div>
        {sessionElapsed && <div className={styles.sessionClock}><Clock3 size={17} /> Treino em andamento · {sessionElapsed}</div>}
      </div>
      <div className={`${styles.media} ${exerciseTab === "guidance" ? styles.mediaGuidance : ""}`}>{exerciseTab === "execution" ? (embedUrl ? (exercise.thumbnail_url && !videoStarted ? <button type="button" className={styles.videoPoster} onClick={() => setVideoStarted(true)} aria-label={`Reproduzir vídeo de ${exercise.name}`}><img src={exercise.thumbnail_url} alt="" referrerPolicy="no-referrer" /><span><Play size={22} fill="currentColor" /> Reproduzir vídeo</span></button> : <iframe src={embedUrl} title={`Demonstração de ${exercise.name}`} sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />) : <><img src={exercise.thumbnail_url || appPath("images/exercise-placeholder.jpg")} alt={`Demonstração de ${exercise.name}`} referrerPolicy="no-referrer" /><span>Vídeo ainda não disponível</span></>) : <section className={styles.guidance}>{prescription.notes && <div><strong>Orientações do professor</strong><p>{prescription.notes}</p></div>}{exercise.instructions && <div><strong>Instruções de execução</strong><p>{exercise.instructions}</p></div>}{!prescription.notes && !exercise.instructions && <p>Nenhuma orientação foi cadastrada para este exercício.</p>}</section>}</div>
      <div className={styles.tabs}><button type="button" className={exerciseTab === "execution" ? styles.tabActive : ""} onClick={() => setExerciseTab("execution")}>Execução</button><button type="button" className={exerciseTab === "guidance" ? styles.tabActive : ""} onClick={() => setExerciseTab("guidance")}>Orientações{hasProfessorGuidance && <span className={styles.guidanceIndicator} aria-label="Orientação do professor disponível" />}</button></div>
      {hasProfessorGuidance && exerciseTab === "execution" && <button type="button" className={styles.guidanceNotice} onClick={() => setExerciseTab("guidance")}><MessageSquareText size={18} /><span>O professor deixou uma orientação para este exercício. <strong>Ver orientação</strong></span></button>}
      <div className={`${styles.prescription} surface-card`}><Dumbbell size={18} /><strong>{prescribedSets(prescription)} séries · {prescription.measurement_type === "time" ? `${formatWorkoutDuration(prescription.target_seconds)} por série` : `${prescription.reps_min}–${prescription.reps_max} reps`} · {prescription.rest_seconds}s descanso</strong></div>
      {prescription.last_performance && <div className={`${styles.lastLoad} surface-card`}><small>Último treino</small><strong>Carga máxima: {prescription.last_performance.max_load ?? "—"} kg</strong><span>{prescription.last_performance.sets.map((set, index) => `${index + 1}ª: ${set.load ?? "—"} kg × ${prescription.measurement_type === "time" ? formatWorkoutDuration(set.duration_seconds) : `${set.repetitions} reps`}`).join(" · ")}</span></div>}
      <div className={styles.setTable}>
        <div className={`${styles.tableHead} ${prescription.measurement_type === "time" ? styles.timedRow : ""}`}><span>Série</span><span>Carga (kg)</span><span>{prescription.measurement_type === "time" ? "Tempo" : "Repetições"}</span><span>Concluir</span></div>
        {Array.from({ length: prescribedSets(prescription) }, (_, index) => index + 1).map((number) => {
          const completed = completedSet(prescription, number);
          const isPending = pendingSets[`${prescription.id}:${number}`];
          const timer = activeExecutionTimer(prescription, number);
          const elapsed = timer ? Math.max(0, Math.floor((clockNow - timer.startedAt) / 1000)) : 0;
          const remaining = Math.max(0, Number(prescription.target_seconds) - elapsed);
          return <div className={`${styles.setRow} ${prescription.measurement_type === "time" ? styles.timedRow : ""}`} key={number}>
            <span>{number}</span>
            <input type="number" min="0" step="0.5" disabled={Boolean(completed) || isPending} value={inputValue(prescription, number, "load")} onChange={(event) => setSetValues({ ...setValues, [inputKey(prescription, number, "load")]: event.target.value })} aria-label={`Carga da série ${number}`} />
            {prescription.measurement_type === "time"
              ? <div className={styles.executionTimerCell}><strong aria-live="off">{completed ? formatCountdown(completed.duration_seconds ?? 0) : formatCountdown(timer ? remaining : Number(prescription.target_seconds) || 0)}</strong>{!completed && <button type="button" className={styles.startTimer} disabled={isPending} onClick={() => startExecutionTimer(prescription, number)}>{timer ? "Reiniciar" : "Iniciar"}</button>}</div>
              : <input type="number" min="1" max="999" disabled={Boolean(completed) || isPending} value={inputValue(prescription, number, "repetitions")} onChange={(event) => setSetValues({ ...setValues, [inputKey(prescription, number, "repetitions")]: event.target.value })} aria-label={`Repetições da série ${number}`} />}
            <button type="button" disabled={isPending || (prescription.measurement_type === "time" && !completed && !timer)} aria-busy={isPending} className={`${completed ? styles.checked : ""} ${isPending ? styles.checkPending : ""}`} onClick={() => toggleSet(prescription, number)} aria-label={`${completed ? "Desmarcar" : "Concluir"} série ${number}`}>{completed && <Check size={15} />}</button>
          </div>;
        })}
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <button className="primary-button" onClick={() => nextInCategory !== undefined ? openExercise(nextInCategory) : setSelected(null)}>{nextInCategory !== undefined ? (prescription.category === "mobility" ? "Próxima mobilidade" : "Próximo exercício") : "Voltar ao treino"} <ChevronRight size={17} /></button>
    </div>;
  }

  if (activeTab === "history") {
    const displayedHistory = session ? [session, ...history.filter((item) => item.id !== session.id)] : history;
    return <div className={styles.page}>
      <ScreenHeader />
      <div className={styles.switcher}><button onClick={() => setActiveTab("workout")}>Meu treino</button><button className={styles.tabActive}>Histórico</button></div>
      {message && <p className={styles.message} role="status">{message}</p>}
      <div className={styles.history}>{displayedHistory.length ? displayedHistory.map((item) => <article className="surface-card" key={item.id}>
        <div><strong>{item.workout_name}</strong><span>{new Date(item.completed_at ?? item.started_at).toLocaleDateString("pt-BR")}</span></div>
        {item.status === "in_progress" && <p className={styles.ongoingNotice}><Clock3 size={16} /><span>Em andamento · {item.completion.completed_sets}/{item.completion.prescribed_sets} séries concluídas</span></p>}
        {item.is_partial && <p className={styles.partialNotice}><TriangleAlert size={16} /><span>Finalizado com pendências: {item.completion.missing_sets} série(s){item.completion.missing_activities > 0 ? ` e ${item.completion.missing_activities} atividade(s)` : ""} não concluída(s).</span></p>}
        <small>{item.exercises.length} exercícios · {item.status === "in_progress" ? `Iniciado às ${new Date(item.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : formatWorkoutDuration(item.duration_seconds ?? item.duration_minutes * 60)}</small>
        <details><summary>Ver desempenho</summary>{item.exercises.map((exercise) => <p key={exercise.id}><strong>{exercise.exercise_name}</strong><span>{exercise.measurement_type === "time" ? `${formatWorkoutDuration(exercise.performance.total_duration_seconds)} de execução` : `Máx. ${exercise.performance.max_load ?? "—"} kg · ${exercise.performance.total_repetitions} reps · volume ${exercise.performance.volume} kg`}</span></p>)}</details>
      </article>) : <div className="surface-card">Nenhum treino iniciado.</div>}</div>
    </div>;
  }

  if (!plans.length && !session) return <div className={styles.page}><ScreenHeader /><div className={styles.switcher}><button className={styles.tabActive}>Meu treino</button><button onClick={() => setActiveTab("history")}>Histórico</button></div><section className={`${styles.empty} surface-card`}><Dumbbell size={30} /><h1>{message ? "Não foi possível carregar os treinos" : "Nenhum treino publicado"}</h1><p>{message || "Seu professor ainda não disponibilizou um treino para você."}</p>{message && <button type="button" className="primary-button" onClick={() => window.location.reload()}>Tentar novamente</button>}</section></div>;

  const orderedPlans = orderPlansForStudent(plans, schedule, session?.workout_plan_id);
  const visiblePlans = session && !orderedPlans.some((item) => item.id === session.workout_plan_id)
    ? [{ id: session.workout_plan_id, name: session.workout_name, subtitle: session.workout_subtitle }, ...orderedPlans]
    : orderedPlans;
  return <div className={styles.page}>
    <ScreenHeader />
    <div className={styles.switcher}><button className={styles.tabActive}>Meus treinos</button><button onClick={() => setActiveTab("history")}>Histórico</button></div>
    {message && <p className={styles.message} role="status">{message}</p>}
    {!session && plans.length > 0 && !schedule.recommended_plan_id && <p className={styles.message} role="status">Hoje está configurado como dia de descanso. Os treinos continuam disponíveis caso você precise consultá-los.</p>}
    {session && <div className={styles.sessionClock}><Clock3 size={17} /> Treino iniciado às {new Date(session.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {sessionElapsed}</div>}
    <div className={styles.workoutList}>{visiblePlans.map((workoutPlan) => {
      const isCurrent = session?.workout_plan_id === workoutPlan.id;
      const workoutExercises = isCurrent ? exercises : workoutPlan.exercises;
      const workoutActivities = isCurrent ? session.activities ?? [] : workoutPlan.activities ?? [];
      const hasMobility = workoutExercises.some((item) => (item.category ?? "exercise") === "mobility") || workoutActivities.some((activity) => activity.type === "mobility");
      const movementTab = hasMobility ? movementTabs[workoutPlan.id] ?? initialMovement : "exercise";
      const visibleExerciseEntries = workoutExercises.map((item, index) => ({ item, index })).filter(({ item }) => (item.category ?? "exercise") === movementTab);
      const totalSets = workoutExercises.reduce((sum, item) => sum + prescribedSets(item), 0);
      const completedCount = isCurrent ? workoutExercises.reduce((sum, item) => sum + item.sets.length, 0) : 0;
      return <section className={styles.workoutCard} key={workoutPlan.id} aria-label={workoutPlan.name}>
        <div className={styles.titleRow}><div><h2>{isCurrent ? session.workout_name : workoutPlan.name}</h2><strong>{isCurrent ? session.workout_subtitle : workoutPlan.subtitle}</strong>{workoutPlan.weekdays?.length > 0 && <small>{workoutPlan.weekdays.map((day) => weekdayLabels[day]).join(", ")}</small>}</div>{hasMobility && <button type="button" className={styles.mobilityBadge} onClick={() => setMovementTabs((current) => ({ ...current, [workoutPlan.id]: "mobility" }))}>Mobilidade</button>}</div>
        {!isCurrent && workoutPlan.id === schedule.recommended_plan_id && <small className={styles.inProgress}>Recomendado para hoje</small>}
        {isCurrent && <small className={styles.inProgress}>Em andamento</small>}
        <div className={styles.metrics}><span><Dumbbell size={15} /><strong>{workoutExercises.filter((item) => (item.category ?? "exercise") === "exercise").length}</strong><small>exercícios</small></span><span><Dumbbell size={15} /><strong>{completedCount}/{totalSets}</strong><small>séries</small></span><span><Clock3 size={15} /><strong>{workoutPlan.estimated_duration_minutes ? `~${formatWorkoutDuration(workoutPlan.estimated_duration_minutes * 60)}` : "—"}</strong><small>duração</small></span></div>
        {hasMobility && <div className={styles.tabs} role="tablist" aria-label={`Seções do treino ${workoutPlan.name}`}><button type="button" role="tab" aria-selected={movementTab === "exercise"} className={movementTab === "exercise" ? styles.tabActive : ""} onClick={() => setMovementTabs((current) => ({ ...current, [workoutPlan.id]: "exercise" }))}>Exercícios</button><button type="button" role="tab" aria-selected={movementTab === "mobility"} className={movementTab === "mobility" ? styles.tabActive : ""} onClick={() => setMovementTabs((current) => ({ ...current, [workoutPlan.id]: "mobility" }))}>Mobilidade</button></div>}
        <div className={styles.exerciseList}>{visibleExerciseEntries.map(({ item, index }, categoryIndex) => {
          const exercise = details(item);
          const done = isCurrent && item.sets.length === prescribedSets(item);
          return <button type="button" key={item.id} disabled={!isCurrent} onClick={() => openExercise(index)}>
            <span className={styles.number}>{categoryIndex + 1}</span><span className={styles.exerciseText}><strong>{exercise.name}</strong><small>{prescribedSets(item)} séries · {item.measurement_type === "time" ? `${formatWorkoutDuration(item.target_seconds)} por série` : `${item.reps_min}–${item.reps_max} reps`}</small>{item.notes?.trim() && <span className={styles.exerciseGuidance}><MessageSquareText size={13} /> Orientação do professor</span>}</span>
            <img src={exercise.thumbnail_url || appPath("images/exercise-placeholder.jpg")} alt="" referrerPolicy="no-referrer" loading="lazy" /><span className={done ? styles.done : styles.circle}>{done && <Check size={12} />}</span>
          </button>;
        })}</div>
        {isCurrent && session.activities?.some((activity) => (activity.type === "mobility" ? "mobility" : "exercise") === movementTab) && <div className={styles.activities}><h3>{movementTab === "mobility" ? "Mobilidade complementar" : "Atividades complementares"}</h3>{session.activities.map((activity, index) => ({ activity, index })).filter(({ activity }) => (activity.type === "mobility" ? "mobility" : "exercise") === movementTab).map(({ activity, index }) => <div className={styles.activityRow} key={`${activity.type}-${index}`}><button type="button" onClick={() => toggleActivity(index, activity.completed)}><span><strong>{{ cardio: "Cardio", mobility: "Mobilidade", vacuum: "Vacuum" }[activity.type]}</strong><small>{activity.name}{activity.duration_minutes ? ` · ${formatWorkoutDuration(activity.duration_minutes * 60)}` : ""}{activity.rounds ? ` · ${activity.rounds} voltas/séries` : ""}</small>{activity.instructions && <small>{activity.instructions}</small>}{activity.notes && <small>{activity.notes}</small>}</span>{activity.thumbnail_url && <img src={activity.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" />}<span className={activity.completed ? styles.done : styles.circle}>{activity.completed && <Check size={12} />}</span></button>{activity.video_url && <a href={activity.video_url} target="_blank" rel="noopener noreferrer" referrerPolicy="strict-origin-when-cross-origin">Ver vídeo de {activity.name}</a>}</div>)}</div>}
        {isCurrent ? <><button className="primary-button" onClick={() => visibleExerciseEntries.length ? openExercise(visibleExerciseEntries[0].index) : setMovementTabs((current) => ({ ...current, [workoutPlan.id]: "exercise" }))}>{visibleExerciseEntries.length ? "Continuar treino" : "Ver exercícios"} <ChevronRight size={16} /></button><button className={styles.finish} disabled={finishing || cancelling} onClick={requestFinishSession}>{finishing ? "Finalizando…" : "Finalizar treino"}</button><button className={styles.cancelWorkout} disabled={finishing || cancelling} onClick={() => setCancelConfirmation(true)}>Cancelar treino iniciado por engano</button></> :
          <button className="primary-button" disabled={Boolean(session) || starting} onClick={() => startSession(workoutPlan)}>Iniciar treino <ChevronRight size={16} /></button>}
      </section>;
    })}</div>
    {finishConfirmation && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !finishing) setFinishConfirmation(null); }}><section className={styles.finishDialog} role="dialog" aria-modal="true" aria-labelledby="finish-partial-title"><button type="button" className={styles.dialogClose} disabled={finishing} onClick={() => setFinishConfirmation(null)} aria-label="Fechar"><X size={19} /></button><span className={styles.dialogIcon}><TriangleAlert size={24} /></span><h2 id="finish-partial-title">Finalizar com pendências?</h2><p>O professor será avisado de que este treino não foi concluído por completo.</p><div className={styles.pendingSummary}><strong>{finishConfirmation.missingSets} série(s) pendente(s)</strong>{finishConfirmation.missingActivities > 0 && <strong>{finishConfirmation.missingActivities} atividade(s) pendente(s)</strong>}{finishConfirmation.incompleteExercises.map((exercise) => <span key={exercise.name}>{exercise.name}: faltam {exercise.missingSets} série(s)</span>)}</div><div className={styles.dialogActions}><button type="button" disabled={finishing} onClick={() => setFinishConfirmation(null)}>Continuar treinando</button><button type="button" className="primary-button" disabled={finishing} onClick={() => finishSession(true)}>{finishing ? "Finalizando…" : "Finalizar mesmo assim"}</button></div></section></div>}
    {cancelConfirmation && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelling) setCancelConfirmation(false); }}><section className={styles.finishDialog} role="dialog" aria-modal="true" aria-labelledby="cancel-workout-title"><button type="button" className={styles.dialogClose} disabled={cancelling} onClick={() => setCancelConfirmation(false)} aria-label="Fechar"><X size={19} /></button><span className={styles.dialogIcon}><TriangleAlert size={24} /></span><h2 id="cancel-workout-title">Cancelar este treino?</h2><p>Use esta opção somente se o treino foi iniciado por engano. Ele não aparecerá no histórico e não avançará a sequência.</p><div className={styles.dialogActions}><button type="button" disabled={cancelling} onClick={() => setCancelConfirmation(false)}>Voltar ao treino</button><button type="button" className={styles.dangerAction} disabled={cancelling} onClick={cancelSession}>{cancelling ? "Cancelando…" : "Sim, cancelar treino"}</button></div></section></div>}
  </div>;
}
