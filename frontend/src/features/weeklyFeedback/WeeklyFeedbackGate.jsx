import { useEffect, useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./WeeklyFeedbackGate.module.css";

const empty = { training_percent: "", nutrition_percent: "", intestinal_percent: "", comment: "", improvement_suggestion: "", fasted_weight: "", sleep_hours: "", sleep_quality: "", rested: "" };
const numericFields = [
  ["training_percent", "Quanto do treino conseguiu realizar?", 0, 100, 1],
  ["nutrition_percent", "Quanto da dieta conseguiu seguir?", 0, 100, 1],
  ["intestinal_percent", "Como avalia o funcionamento do intestino?", 0, 100, 1],
  ["fasted_weight", "Peso em jejum (kg)", 1, 500, 0.1],
  ["sleep_hours", "Quantas horas dorme por noite, em média?", 0, 24, 0.5],
];

export default function WeeklyFeedbackGate({ userId, children }) {
  const [state, setState] = useState("loading");
  const [week, setWeek] = useState("");
  const [appReminder, setAppReminder] = useState(null);
  const [answers, setAnswers] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const check = () => {
      if (document.visibilityState === "hidden") return;
      apiRequest("/v1/student/weekly-feedback").then((response) => {
        if (active) { setWeek(response.data.week_starts_on); setAppReminder(response.data.app_reminder); setState(response.data.due ? "due" : "complete"); }
      }).catch((failure) => { if (active) { setError(failure.message); setState("error"); } });
    };
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { active = false; window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [userId]);

  const retry = () => {
    setState("loading"); setError("");
    apiRequest("/v1/student/weekly-feedback").then((response) => {
      setWeek(response.data.week_starts_on); setAppReminder(response.data.app_reminder); setState(response.data.due ? "due" : "complete");
    }).catch((failure) => { setError(failure.message); setState("error"); });
  };

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await initializeCsrf();
      await apiRequest("/v1/student/weekly-feedback", { method: "POST", body: JSON.stringify({
        ...answers,
        training_percent: Number(answers.training_percent), nutrition_percent: Number(answers.nutrition_percent),
        intestinal_percent: Number(answers.intestinal_percent), fasted_weight: Number(answers.fasted_weight),
        sleep_hours: Number(answers.sleep_hours), rested: answers.rested === "yes",
      }) });
      setState("complete");
    } catch (failure) {
      if (failure.status === 409) retry(); else setError(failure.message);
    } finally { setBusy(false); }
  }

  if (state === "complete") return children;
  if (state === "loading") return <main className={styles.center}>Verificando o feedback semanal…</main>;
  if (state === "error") return <main className={styles.center}><section className={styles.card}><h1>Não foi possível carregar o feedback</h1><p role="alert">{error}</p><button type="button" onClick={retry}>Tentar novamente</button></section></main>;
  const update = (name, value) => {
    const bounded = name.endsWith("_percent") && value !== "" && Number.isFinite(Number(value))
      ? String(Math.min(100, Math.max(0, Number(value)))) : value;
    setAnswers((current) => ({ ...current, [name]: bounded }));
  };
  const weekLabel = week ? new Date(`${week}T12:00:00`).toLocaleDateString("pt-BR") : "esta semana";

  return <main className={styles.center}><form className={styles.card} onSubmit={submit}>
    <p className={styles.eyebrow}>IS Coach · semana de {weekLabel}</p>
    <h1>Feedback semanal</h1>
    {appReminder && <p className={styles.professorReminder} role="status">{appReminder.message}</p>}
    <p>Conte ao professor como foi sua semana para continuar no aplicativo. Sua resposta ficará registrada no histórico e poderá ser comparada com as próximas semanas.</p>
    <div className={styles.fields}>
      {numericFields.map(([name, label, min, max, step]) => <label key={name}>{label}<input required type="number" min={min} max={max} step={step} value={answers[name]} onChange={(event) => update(name, event.target.value)} />{name.endsWith("_percent") && <small>De 0 a 100%</small>}{name === "intestinal_percent" && <small>Considere a regularidade e a qualidade das evacuações.</small>}</label>)}
      <label>Como costuma acordar?<select required value={answers.rested} onChange={(event) => update("rested", event.target.value)}><option value="">Selecione</option><option value="yes">Recomposto</option><option value="no">Cansado</option></select></label>
      <label>Como avalia a qualidade do sono?<select required value={answers.sleep_quality} onChange={(event) => update("sleep_quality", event.target.value)}><option value="">Selecione</option><option value="boa">Boa</option><option value="regular">Regular</option><option value="ruim">Ruim</option></select></label>
      <label className={styles.full}>Algum comentário a compartilhar? (opcional)<textarea rows="3" maxLength="2000" value={answers.comment} onChange={(event) => update("comment", event.target.value)} /></label>
      <label className={styles.full}>O que ajudaria a realizar mais dos protocolos? (opcional)<textarea rows="3" maxLength="2000" value={answers.improvement_suggestion} onChange={(event) => update("improvement_suggestion", event.target.value)} /></label>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar feedback e continuar"}</button>
  </form></main>;
}
