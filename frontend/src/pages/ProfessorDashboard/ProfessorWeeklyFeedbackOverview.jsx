import { useRef, useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ProfessorWeeklyFeedbackOverview.module.css";

const displayDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "";

export default function ProfessorWeeklyFeedbackOverview({ data, onFilter, onPage, onRefresh, onStudentSelect, onExpandedChange, beforeCollapse }) {
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedStatus, setExpandedStatus] = useState(null);
  const collapsing = useRef(false);
  const pagination = data?.pagination ?? { current_page: 1, last_page: 1, total: 0 };
  const visibleStudents = data?.items?.filter((student) => student.status === expandedStatus) ?? [];

  async function toggleStatus(status) {
    if (collapsing.current) return;
    const nextStatus = expandedStatus === status ? null : status;
    if (!nextStatus && beforeCollapse) {
      // Recolhe o painel com a lista ainda visível; só depois a lista sai e o layout muda.
      collapsing.current = true;
      try { await beforeCollapse(); } finally { collapsing.current = false; }
    }
    setMessage("");
    setExpandedStatus(nextStatus);
    onExpandedChange?.(Boolean(nextStatus));
    if (nextStatus) onFilter(nextStatus);
  }

  async function remind(student) {
    setBusyId(student.student_id); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${student.student_id}/weekly-feedback/reminder`, { method: "POST" });
      setMessage(`${student.student_name}: ${response.message}`);
      await onRefresh();
    } catch (error) {
      setMessage(`${student.student_name}: ${error.message}`);
    } finally { setBusyId(null); }
  }

  async function review(student) {
    setBusyId(student.student_id); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${student.student_id}/weekly-feedback/${student.feedback_id}/review`, { method: "POST" });
      setMessage(`${student.student_name}: ${response.message}`);
      await onRefresh();
    } catch (error) {
      setMessage(`${student.student_name}: ${error.message}`);
    } finally { setBusyId(null); }
  }

  return <section className={styles.panel} data-expanded={Boolean(expandedStatus)} aria-labelledby="weekly-overview-title">
    <div className={styles.heading}>
      <h2 id="weekly-overview-title">Feedback semanal</h2>
      <p>Semana de {displayDate(data?.week_starts_on)}</p>
    </div>
    <div className={styles.counts} aria-label="Situação do feedback semanal">
      <button type="button" data-status="pending" aria-expanded={expandedStatus === "pending"} aria-controls="weekly-feedback-list" onClick={() => toggleStatus("pending")}>
        <strong>{data?.pending_count ?? 0}</strong><span>Pendentes</span>
      </button>
      <button type="button" data-status="submitted" aria-expanded={expandedStatus === "submitted"} aria-controls="weekly-feedback-list" onClick={() => toggleStatus("submitted")}>
        <strong>{data?.submitted_count ?? 0}</strong><span>Respondidos</span>
      </button>
    </div>
    {expandedStatus && <div key={expandedStatus} id="weekly-feedback-list" className={styles.expanded}>
      <h3>{expandedStatus === "pending" ? "Pendentes" : "Respondidos"}</h3>
    {message && <p role="status" className={styles.message}>{message}</p>}
    <div className={styles.list}>
      {visibleStudents.length ? visibleStudents.map((student) => <article className={styles.row} key={student.student_id}>
        <div className={styles.identity}><strong>{student.student_name}</strong><small>{student.student_email}</small></div>
        <span className={styles.status} data-status={student.status}>{student.status === "submitted" ? "Respondido" : "Pendente"}</span>
        {student.status === "submitted" ? <div className={styles.actions}>
          <small className={styles.date}>{student.reviewed_at ? `Visto em ${new Date(student.reviewed_at).toLocaleString("pt-BR")}` : student.submitted_at ? `Enviado em ${new Date(student.submitted_at).toLocaleString("pt-BR")}` : ""}</small>
          {!student.reviewed_at && <button type="button" disabled={busyId !== null} onClick={() => review(student)}>{busyId === student.student_id ? "Registrando…" : "Marcar como visto"}</button>}
        </div> :
          <div className={styles.actions}>
            <button type="button" onClick={() => remind(student)} disabled={busyId !== null || Boolean(student.mail_sent_at && student.app_notified_at)}>
              {busyId === student.student_id ? "Enviando…" : student.mail_sent_at && student.app_notified_at ? "Aviso enviado" : student.mail_sent_at ? "Avisar no app" : "Avisar por e-mail e no app"}
            </button>
          </div>}
        <button type="button" className={styles.view} onClick={() => onStudentSelect(student.student_id)}>Ver aluno</button>
      </article>) : <p className={styles.empty}>Nenhum aluno {expandedStatus === "pending" ? "pendente" : "respondido"} nesta semana.</p>}
    </div>
    {pagination.last_page > 1 && <nav className={styles.pagination} aria-label="Páginas de feedback semanal">
      <button type="button" disabled={pagination.current_page <= 1} onClick={() => onPage(pagination.current_page - 1)}>Anterior</button>
      <span>Página {pagination.current_page} de {pagination.last_page}</span>
      <button type="button" disabled={pagination.current_page >= pagination.last_page} onClick={() => onPage(pagination.current_page + 1)}>Próxima</button>
    </nav>}
    </div>}
  </section>;
}
