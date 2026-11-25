import { useEffect, useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import AssessmentDetails, { AssessmentResults } from "../../shared/components/AssessmentDetails.jsx";
import styles from "./PhysicalAssessments.module.css";
import AssessmentPhotos from "../../shared/components/AssessmentPhotos.jsx";
import AssessmentComparison from "../../shared/components/AssessmentComparison.jsx";
import { AssessmentReportButton } from "../../shared/reports/ReportDocuments.jsx";
import ProfessorWeeklyFeedback from "./ProfessorWeeklyFeedback.jsx";
import ProfessorExternalAssessmentManager from "./ProfessorExternalAssessmentManager.jsx";

const statusLabels = { draft:"Rascunho", finalized:"Finalizada", corrected:"Versão anterior corrigida" };
export default function ProfessorAssessmentManager({ student }) {
  const studentId = student ? String(student.id) : "";
  const [schema,setSchema] = useState([]);
  const [message,setMessage] = useState("");
  useEffect(() => {
    let active = true;
    apiRequest("/v1/professor/assessments/schema").then((schemaResponse) => {
      if (active) { setSchema(schemaResponse.data); }
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  },[]);
  return <section className={styles.manager}>
    {studentId && <ProfessorWeeklyFeedback key={`feedback-${studentId}`} studentId={studentId} />}
    <div className={styles.card}><h2>Avaliação física</h2>
    <p className={styles.notice}>Salve a avaliação para adicionar fotos privadas. A composição corporal usa Jackson & Pollock de 7 dobras com conversão de Siri; a classificação aguarda a tabela do professor.</p></div>
    {message && <p role="alert">{message}</p>}
    {!studentId && <p>Selecione primeiro o aluno na aba Alunos para consultar suas avaliações.</p>}
    {studentId && schema.length > 0 && <StudentAssessments key={studentId} student={student} studentId={studentId} schema={schema} />}
    {!studentId && <ProfessorExternalAssessmentManager schema={schema} />}
  </section>;
}

function StudentAssessments({ student,studentId,schema }) {
  const [assessments,setAssessments] = useState([]);
  const [editing,setEditing] = useState(null);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  useEffect(() => {
    let active = true;
    apiRequest(`/v1/professor/students/${studentId}/assessments`).then((response) => { if(active) setAssessments(response.data); })
      .catch((error) => { if(active) setMessage(error.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[studentId]);
  async function correct(assessment) {
    setBusy(true); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${studentId}/assessments/${assessment.id}/corrections`, { method:"POST" });
      setAssessments((current) => [response.data,...current]); setEditing(response.data);
    } catch(error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function remove(assessment) {
    if (!window.confirm("Excluir definitivamente esta avaliação, todas as versões corrigidas e suas fotos? Esta ação não poderá ser desfeita.")) return;
    setBusy(true); setMessage("");
    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/students/${studentId}/assessments/${assessment.id}`, { method:"DELETE" });
      const byId = new Map(assessments.map((item) => [item.id,item]));
      let root = assessment;
      while (root.previous_version_id && byId.has(root.previous_version_id)) root = byId.get(root.previous_version_id);
      const removedIds = new Set([root.id]);
      let current = root;
      let next = assessments.find((item) => item.previous_version_id === current.id);
      while (next) {
        removedIds.add(next.id);
        current = next;
        next = assessments.find((item) => item.previous_version_id === current.id);
      }
      setAssessments((items) => items.filter((item) => !removedIds.has(item.id)));
      setMessage("Avaliação excluída definitivamente.");
    } catch(error) { setMessage(error.message); } finally { setBusy(false); }
  }
  function saved(assessment) {
    setAssessments((current) => [assessment,...current.filter((item) => item.id !== assessment.id).map((item) => assessment.status === "finalized" && item.id === assessment.previous_version_id ? {...item,status:"corrected"} : item)]);
    setEditing(null); setMessage("Avaliação salva.");
  }
  return <><div className={styles.actions}><button disabled={busy || loading || editing !== null} onClick={() => setEditing({})}>Nova avaliação</button></div>
    {loading && <p>Carregando avaliações…</p>}
    {message && <p role="status">{message}</p>}
    {editing && <AssessmentForm key={editing.id ?? "new"} initial={editing} schema={schema} studentId={studentId} onSaved={saved} onCancel={() => setEditing(null)} />}
    {!loading && !assessments.length && <p>Nenhuma avaliação cadastrada.</p>}
    {!loading && assessments.length > 0 && <AssessmentComparison student={student} assessments={assessments} schema={schema} showPdf />}
    {assessments.map((assessment) => <article className={styles.card} key={assessment.id}>
      <h3>{assessment.assessed_on.split("-").reverse().join("/")} · Versão {assessment.version}</h3>
      <span>{statusLabels[assessment.status]}</span>
      <AssessmentDetails assessment={assessment} schema={schema} />
      <AssessmentPhotos assessmentId={assessment.id} canEdit />
      <div className={styles.actions}>
        <AssessmentReportButton student={student} assessment={assessment} schema={schema} />
        {assessment.status === "draft" && <button disabled={busy || editing !== null} onClick={() => setEditing(assessment)}>Editar rascunho</button>}
        {assessment.status === "finalized" && !assessments.some((item) => item.previous_version_id === assessment.id) && <button disabled={busy || editing !== null} onClick={() => correct(assessment)}>Criar correção</button>}
        <button className={styles.danger} disabled={busy || editing !== null} onClick={() => remove(assessment)}>Excluir avaliação</button>
      </div>
    </article>)}
  </>;
}

export function AssessmentForm({ initial,schema,studentId,basePath,onSaved,onCancel,previewPerson }) {
  const [date,setDate] = useState(initial.assessed_on ?? new Date().toLocaleDateString("en-CA"));
  const [inputs,setInputs] = useState(initial.inputs ?? {});
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  async function save(event) {
    event.preventDefault();
    if (previewPerson && previewPerson.name.trim().length < 2) {
      setMessage("Informe o nome completo da pessoa avaliada antes de calcular.");
      return;
    }
    const status = previewPerson || event.nativeEvent.submitter?.value === "finalized" ? "finalized" : "draft";
    if (status === "finalized") {
      const missing = [["weight", "Peso"], ["height", "Altura"]].find(([key]) => inputs.general?.[key] === null || inputs.general?.[key] === undefined || inputs.general?.[key] === "");
      if (missing) {
        const field = event.currentTarget.querySelector(`[data-assessment-field="${missing[0]}"]`);
        event.currentTarget.dataset.validationAttempted = "true";
        field?.setAttribute("aria-invalid", "true");
        field?.focus();
        field?.scrollIntoView({ block: "center", behavior: "smooth" });
        setMessage(`Preencha ${missing[1]} para finalizar a avaliação.`);
        return;
      }
    }
    if (status === "finalized" && !previewPerson && !window.confirm("Finalizar e disponibilizar esta avaliação ao aluno? Alterações futuras exigirão uma nova versão.")) return;
    setBusy(true);setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(previewPerson ? "/v1/professor/external-assessment-preview" : `${basePath ?? `/v1/professor/students/${studentId}/assessments`}${initial.id ? "/"+initial.id : ""}`, {
        method:!previewPerson && initial.id ? "PUT" : "POST",body:JSON.stringify({assessed_on:date,status,inputs,revision:initial.revision,...(previewPerson ? { person: previewPerson } : {})}),
      });
      onSaved(response.data);
    } catch(error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <form className={styles.card} onSubmit={save}><h3>{previewPerson ? "Dados da avaliação avulsa" : initial.id ? "Editar avaliação" : "Nova avaliação"}</h3>
    <fieldset className={styles.fields} disabled={busy}>
      <label>Data da avaliação<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      {schema.map((group) => <details className={styles.group} key={group.key} open><summary>{group.label}</summary><div>{group.fields.filter((field) => !field.hidden).map((field) => {
        const update = (event) => setInputs((current) => ({...current,[group.key]:{...current[group.key],[field.key]:event.target.value === "" ? null : field.type === "number" ? Number(event.target.value) : event.target.value}}));
        const value = inputs[group.key]?.[field.key] ?? "";
        const options = field.options ?? [];
        const legacyValue = field.type === "select" && value && !options.includes(value);
        return <label key={field.key}>{field.label}{field.unit ? " ("+field.unit+")" : ""}{field.type === "number" ? <input type="number" data-assessment-field={group.key === "general" ? field.key : undefined} step="any" min={field.min} max={field.max} value={value} onChange={update} /> : field.type === "select" ? <select value={value} onChange={update}><option value="">Selecione</option>{legacyValue && <option value={value}>{value} (valor anterior)</option>}{options.map((option) => <option value={option} key={option}>{option}</option>)}</select> : <textarea maxLength={3000} value={value} onChange={update} />}</label>;
      })}</div></details>)}
    </fieldset>
    <p className={styles.notice}>{previewPerson ? "Peso e altura são obrigatórios para gerar o PDF. Os dados ficam apenas nesta tela até você sair ou atualizar a página." : "Peso e altura são obrigatórios para finalizar. Os demais campos podem ficar em branco quando não avaliados. Resultados são calculados ao salvar; não são editados manualmente."}</p>
    {initial.results && <AssessmentResults results={initial.results} />}
    {message && <p role="alert">{message}</p>}
    <div className={styles.actions}>{!previewPerson && <button disabled={busy} type="submit" value="draft">{busy ? "Salvando…" : "Salvar rascunho"}</button>}<button disabled={busy} type="submit" value="finalized">{previewPerson ? busy ? "Calculando…" : "Calcular e preparar PDF" : "Finalizar avaliação"}</button><button disabled={busy} type="button" onClick={onCancel}>Cancelar</button></div>
  </form>;
}
