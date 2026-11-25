import { useEffect, useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ProfessorWeeklyFeedback.module.css";

const fields = [
  ["training_percent", "Treino realizado", "%"],
  ["nutrition_percent", "Dieta seguida", "%"],
  ["intestinal_percent", "Funcionamento intestinal", "%"],
  ["fasted_weight", "Peso em jejum", "kg"],
  ["sleep_hours", "Sono por noite", "h"],
  ["sleep_quality", "Qualidade do sono", ""],
  ["rested", "Ao acordar", ""],
  ["comment", "Comentário", ""],
  ["improvement_suggestion", "Sugestão do aluno", ""],
];
const dateLabel = (value) => value?.split("-").reverse().join("/") ?? "—";
const valueLabel = (key, value, unit) => {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "rested") return value ? "Recomposto" : "Cansado";
  if (key === "sleep_quality") return ({ boa: "Boa", regular: "Regular", ruim: "Ruim" })[value] ?? value;
  return `${value}${unit ? ` ${unit}` : ""}`;
};

export default function ProfessorWeeklyFeedback({ studentId }) {
  const [items, setItems] = useState([]);
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    let active = true;

    apiRequest(`/v1/professor/students/${studentId}/weekly-feedback`).then((response) => {
      if (!active) return;
      const feedbacks = Array.isArray(response.data) ? response.data : [];
      setItems(feedbacks);
      setFirstId(String(feedbacks[0]?.id ?? ""));
      setSecondId(String(feedbacks[1]?.id ?? ""));
    }).catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  const first = items.find((item) => String(item.id) === firstId);
  const second = items.find((item) => String(item.id) === secondId);
  const review = async () => {
    if (!first || first.reviewed_at) return;
    setReviewing(true); setReviewMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${studentId}/weekly-feedback/${first.id}/review`, { method: "POST" });
      setItems((current) => current.map((item) => item.id === first.id ? { ...item, reviewed_at: response.data.reviewed_at } : item));
      setReviewMessage(response.message);
    } catch (failure) { setReviewMessage(failure.message); }
    finally { setReviewing(false); }
  };

  return <section className={styles.panel} aria-labelledby="weekly-feedback-title">
    <div><p className={styles.eyebrow}>Autoavaliação do aluno</p><h2 id="weekly-feedback-title">Feedback semanal</h2><p>Respostas registradas pelo aluno a cada semana.</p></div>
    {loading && <p>Carregando feedbacks…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && items.length === 0 && <p>Nenhum feedback semanal enviado ainda.</p>}
    {items.length > 0 && <>
      <div className={styles.selectors}>
        <label>Primeira semana<select value={firstId} onChange={(event) => { setFirstId(event.target.value); if (event.target.value === secondId) setSecondId(""); }}>{items.map((item) => <option value={item.id} key={item.id}>Semana de {dateLabel(item.week_starts_on)}</option>)}</select></label>
        <label>Comparar com<select value={secondId} onChange={(event) => setSecondId(event.target.value)}><option value="">Selecione uma semana</option>{items.filter((item) => String(item.id) !== firstId).map((item) => <option value={item.id} key={item.id}>Semana de {dateLabel(item.week_starts_on)}</option>)}</select></label>
      </div>
      <div className={styles.reviewStatus}>
        {first?.reviewed_at ? <span>Visto pelo professor em {new Date(first.reviewed_at).toLocaleString("pt-BR")}</span> : <button type="button" disabled={reviewing} onClick={review}>{reviewing ? "Registrando…" : "Marcar como visto e avisar o aluno"}</button>}
        {reviewMessage && <small role="status">{reviewMessage}</small>}
      </div>
      <div className={styles.tableWrap}><table><thead><tr><th>Indicador</th><th>{first ? dateLabel(first.week_starts_on) : "—"}</th><th>{second ? dateLabel(second.week_starts_on) : "—"}</th></tr></thead><tbody>{fields.map(([key, label, unit]) => <tr key={key}><th>{label}</th><td>{valueLabel(key, first?.answers?.[key], unit)}</td><td>{valueLabel(key, second?.answers?.[key], unit)}</td></tr>)}</tbody></table></div>
      <details><summary>Ver histórico completo ({items.length})</summary><ol className={styles.history}>{items.map((item) => <li key={item.id}>Semana de {dateLabel(item.week_starts_on)} · enviado em {new Date(item.submitted_at).toLocaleDateString("pt-BR")}</li>)}</ol></details>
    </>}
  </section>;
}
