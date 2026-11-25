import { useEffect, useState } from "react";
import { Dumbbell, Library, Plus, Trash2 } from "lucide-react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import { formatWorkoutDuration } from "../../shared/formatWorkoutDuration.js";
import WorkoutPlanForm from "./WorkoutPlanForm.jsx";
import styles from "./ProfessorTrainingManager.module.css";
import PrintableReport, { ReportButton } from "../../shared/reports/PrintableReport.jsx";
import { WorkoutReport } from "../../shared/reports/ReportDocuments.jsx";
import { prepareExerciseThumbnail } from "../../shared/prepareExerciseThumbnail.js";

const emptyExercise = { category: "exercise", muscle_group_id: "", name: "", video_url: "", thumbnail_url: "", instructions: "" };
const libraryLabels = { exercise: "Exercícios", mobility: "Mobilidade", cardio: "Cardio", vacuum: "Vacuum" };
const newLibraryLabels = { exercise: "Novo exercício", mobility: "Nova mobilidade", cardio: "Novo cardio", vacuum: "Novo vacuum" };
const weekdayLabels = { monday: "Segunda-feira", tuesday: "Terça-feira", wednesday: "Quarta-feira", thursday: "Quinta-feira", friday: "Sexta-feira", saturday: "Sábado", sunday: "Domingo" };
const prescriptionSummary = (item) => `${item.sets} séries · ${item.measurement_type === "time" ? `${formatWorkoutDuration(item.target_seconds)} por série` : `${item.reps_min}–${item.reps_max} repetições`}`;
const performanceSummary = (exercise) => exercise.measurement_type === "time" ? `${formatWorkoutDuration(exercise.performance.total_duration_seconds)} de execução` : `máx. ${exercise.performance.max_load ?? "—"} kg · ${exercise.performance.total_repetitions} reps · volume ${exercise.performance.volume} kg`;
const weekdays = Object.entries(weekdayLabels);

export default function ProfessorTrainingManager({ student }) {
  const studentId = student ? String(student.id) : "";
  const [section, setSection] = useState("plans");
  const [libraryCategory, setLibraryCategory] = useState("exercise");
  const [catalog, setCatalog] = useState({ muscle_groups: [], exercises: [] });
  const [editingId, setEditingId] = useState(null);
  const [savingExercise, setSavingExercise] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState(null);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [exercise, setExercise] = useState(emptyExercise);
  const [editedExercise, setEditedExercise] = useState(emptyExercise);
  const [formVersion, setFormVersion] = useState(0);
  const [savedPlans, setSavedPlans] = useState([]);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [reportPlans, setReportPlans] = useState(null);
  const [schedule, setSchedule] = useState({ mode: "rotating", rest_days: [] });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [message, setMessage] = useState("");

  const loadCatalog = () => apiRequest("/v1/professor/exercises").then((response) => setCatalog(response.data));
  useEffect(() => {
    Promise.all([apiRequest("/v1/professor/exercises"), apiRequest("/v1/professor/workout-templates")]).then(([catalogResponse, templateResponse]) => {
      setCatalog(catalogResponse.data); setTemplates(templateResponse.data);
    }).catch((error) => setMessage(error.message));
  }, []);

  const saveExercise = async (event, isEditing = false) => {
    const values = isEditing ? editedExercise : exercise;
    const exerciseId = isEditing ? editingId : null;
    const photo = values.thumbnail_file;
    event.preventDefault(); setMessage(""); setSavingExercise(true);
    try {
      await initializeCsrf();
      const body = new FormData();
      body.append("name", values.name);
      body.append("category", isEditing ? values.category : libraryCategory);
      body.append("muscle_group_id", values.muscle_group_id);
      body.append("video_url", values.video_url.trim());
      body.append("instructions", values.instructions);
      if (photo) body.append("thumbnail", await prepareExerciseThumbnail(photo), "miniatura.jpg");
      if (isEditing && values.remove_thumbnail && !photo) body.append("remove_thumbnail", "1");
      await apiRequest(exerciseId ? `/v1/professor/exercises/${exerciseId}` : "/v1/professor/exercises", { method: "POST", body });
      if (isEditing) { setEditedExercise(emptyExercise); setEditingId(null); } else { setExercise(emptyExercise); }
      await loadCatalog(); setMessage("Exercício salvo na biblioteca.");
    } catch (error) { setMessage(error.message); }
    finally { setSavingExercise(false); }
  };

  const deleteExercise = async (item) => {
    if (savingExercise || deletingExerciseId !== null) return;
    if (!window.confirm(`Excluir definitivamente "${item.name}" da biblioteca?\n\nOs treinos e históricos existentes serão preservados, mas o exercício não poderá ser usado em novos treinos.`)) return;
    setDeletingExerciseId(item.id); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/exercises/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) { setEditingId(null); setEditedExercise(emptyExercise); }
      await loadCatalog(); setMessage(response.message);
    } catch (error) { setMessage(error.message); }
    finally { setDeletingExerciseId(null); }
  };

  const deleteGroup = async (group) => {
    if (group.exercises_count > 0 || deletingGroupId !== null) return;
    if (!window.confirm(`Excluir definitivamente o agrupamento "${group.name}"?\n\nEssa ação não pode ser desfeita.`)) return;
    setDeletingGroupId(group.id); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/muscle-groups/${group.id}`, { method: "DELETE" });
      await loadCatalog(); setMessage(response.message);
    } catch (error) { setMessage(error.message); }
    finally { setDeletingGroupId(null); }
  };

  const saveGroup = async (event) => {
    event.preventDefault();
    const name = newGroupName.trim();
    if (!name || savingGroup) return;
    setSavingGroup(true); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/professor/muscle-groups", { method: "POST", body: JSON.stringify({ name }) });
      await loadCatalog();
      setNewGroupName("");
      setExercise((current) => current.muscle_group_id ? current : { ...current, muscle_group_id: String(response.data.id) });
      setMessage(`Agrupamento "${response.data.name}" criado. Ele já pode ser usado nos exercícios.`);
    } catch (error) { setMessage(error.message); }
    finally { setSavingGroup(false); }
  };

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    apiRequest(`/v1/professor/students/${studentId}/workouts`).then((response) => {
      if (!cancelled) { setSavedPlans(response.data); setSchedule(response.schedule ?? { mode: "rotating", rest_days: [] }); }
    }).catch((error) => { if (!cancelled) setMessage(error.message); });
    return () => { cancelled = true; };
  }, [studentId]);

  const saveSchedule = async () => {
    setSavingSchedule(true); setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest(`/v1/professor/students/${studentId}/workout-schedule`, { method: "PUT", body: JSON.stringify(schedule) });
      setSchedule(response.data); setMessage(response.data.mode === "rotating" ? "Agenda rotativa salva. A sequência continuará nos dias que não forem folga." : "Agenda fixa salva. Defina os dias de cada treino.");
    } catch (error) { setMessage(error.message); }
    finally { setSavingSchedule(false); }
  };

  const deletePlan = async (saved) => {
    if (deletingPlanId !== null || editingPlanId !== null) return;
    const studentName = student?.name ?? "este aluno";
    if (!window.confirm(`Excluir definitivamente "${saved.name}" de ${studentName}?\n\nEssa ação não pode ser desfeita. O histórico e as sessões já iniciadas serão preservados.`)) return;
    setDeletingPlanId(saved.id);
    setMessage("");
    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/students/${studentId}/workouts/${saved.id}`, { method: "DELETE" });
      setSavedPlans((current) => current.filter((item) => item.id !== saved.id));
      setMessage(`Treino "${saved.name}" excluído definitivamente. O histórico foi preservado.`);
    } catch (error) { setMessage(error.message); }
    finally { setDeletingPlanId(null); }
  };

  const loadHistory = async () => {
    try {
      const response = await apiRequest(`/v1/professor/students/${studentId}/workout-history`);
      setWorkoutHistory(response.data); setMessage("");
    } catch (error) { setMessage(error.message); }
  };

  return <section className={styles.manager}>
    <div className={styles.switcher}><button data-active={section === "plans"} onClick={() => setSection("plans")}><Dumbbell size={16} /> Montar treino</button><button data-active={section === "library"} onClick={() => setSection("library")}><Library size={16} /> Biblioteca</button></div>
    {section === "library" && <><div className={`${styles.switcher} ${styles.librarySwitcher}`} role="tablist" aria-label="Tipo de item da biblioteca">{Object.entries(libraryLabels).map(([category, label]) => <button key={category} type="button" role="tab" aria-selected={libraryCategory === category} data-active={libraryCategory === category} onClick={() => { setLibraryCategory(category); setEditingId(null); }}>{label}</button>)}</div><form className={styles.groupCreateForm} onSubmit={saveGroup}><h2>Novo agrupamento</h2><p>Crie um agrupamento para organizar os itens da biblioteca.</p><label>Nome do agrupamento<input required maxLength={80} value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Ex.: Posterior de coxa" disabled={savingGroup} /></label><button type="submit" className="primary-button" disabled={savingGroup}><Plus size={16} /> {savingGroup ? "Salvando…" : "Criar agrupamento"}</button></form></>}
    {section === "library" ? <>
      <form className={styles.form} onSubmit={saveExercise}><h2>{newLibraryLabels[libraryCategory]}</h2><ExerciseFields value={exercise} onChange={setExercise} groups={catalog.muscle_groups} disabled={savingExercise} /><button className="primary-button" disabled={savingExercise}><Plus size={16} /> {savingExercise ? "Salvando…" : "Adicionar à biblioteca"}</button></form>
      <section className={styles.groupManager}><h2>Agrupamentos <small>{catalog.muscle_groups.length} cadastrados</small></h2><p>Para excluir um agrupamento, remova ou mova primeiro todos os itens dele.</p><div>{catalog.muscle_groups.map((group) => <article key={group.id}><span><strong>{group.name}</strong><small>{group.exercises_count} item(ns)</small></span><button type="button" disabled={group.exercises_count > 0 || deletingGroupId !== null} title={group.exercises_count > 0 ? "Este agrupamento ainda possui itens" : `Excluir ${group.name}`} onClick={() => deleteGroup(group)}><Trash2 size={15} /> {deletingGroupId === group.id ? "Excluindo…" : "Excluir"}</button></article>)}</div></section>
      <div className={styles.catalog}><h2>{libraryLabels[libraryCategory]} cadastrados <small>{catalog.exercises.filter((item) => (item.category ?? "exercise") === libraryCategory).length} cadastrados</small></h2>{catalog.exercises.filter((item) => (item.category ?? "exercise") === libraryCategory).map((item) => <article key={item.id}><div><strong>{item.name}</strong><span>{item.muscle_group.name}</span></div>{item.video_url ? <a href={item.video_url} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin">Ver vídeo</a> : <span>Sem vídeo</span>}<button type="button" disabled={savingExercise || deletingExerciseId !== null} aria-expanded={editingId === item.id} aria-controls={editingId === item.id ? `edit-exercise-${item.id}` : undefined} onClick={() => { setEditingId(item.id); setEditedExercise({ category: item.category ?? "exercise", name: item.name, muscle_group_id: item.muscle_group.id, video_url: item.video_url ?? "", thumbnail_url: item.thumbnail_url ?? "", instructions: item.instructions ?? "" }); setMessage(""); }}>Editar</button><button type="button" className={styles.deletePlan} disabled={savingExercise || deletingExerciseId !== null} onClick={() => deleteExercise(item)}><Trash2 size={15} /> {deletingExerciseId === item.id ? "Excluindo…" : "Excluir"}</button>{editingId === item.id && <section className={styles.inlineEditor} id={`edit-exercise-${item.id}`}><form className={styles.form} onSubmit={(event) => saveExercise(event, true)}><h2>Editar {libraryLabels[libraryCategory]}</h2><ExerciseFields value={editedExercise} onChange={setEditedExercise} groups={catalog.muscle_groups} disabled={savingExercise} /><button className="primary-button" disabled={savingExercise}>{savingExercise ? "Salvando…" : "Salvar alterações"}</button><button type="button" disabled={savingExercise} onClick={() => { setEditingId(null); setEditedExercise(emptyExercise); }}>Cancelar edição</button></form></section>}</article>)}</div>
    </> : <>{!studentId && <p>Selecione primeiro o aluno na aba Alunos para consultar ou montar seus treinos.</p>}{studentId && <><section className={styles.scheduleEditor}><div><h2>Agenda dos treinos</h2><p>{schedule.mode === "rotating" ? "Os treinos seguem A, B, C e continuam a sequência entre as semanas." : "Cada treino pode ser marcado em um ou mais dias da semana."}</p></div><label>Modo<select value={schedule.mode} onChange={(event) => setSchedule((current) => ({ ...current, mode: event.target.value, rest_days: event.target.value === "fixed" ? [] : current.rest_days }))}><option value="rotating">Rotativo</option><option value="fixed">Dias fixos</option></select></label>{schedule.mode === "rotating" && <fieldset><legend>Dias de folga</legend>{weekdays.map(([value, label]) => <label key={value}><input type="checkbox" checked={schedule.rest_days.includes(value)} onChange={(event) => setSchedule((current) => ({ ...current, rest_days: event.target.checked ? [...current.rest_days, value] : current.rest_days.filter((day) => day !== value) }))} />{label}</label>)}</fieldset>}<button type="button" className="primary-button" disabled={savingSchedule} onClick={saveSchedule}>{savingSchedule ? "Salvando…" : "Salvar agenda"}</button></section><WorkoutPlanForm key={studentId + ":" + formVersion + ":" + schedule.mode} studentId={studentId} scheduleMode={schedule.mode} catalog={catalog} templates={templates} onTemplateSaved={(saved) => setTemplates((current) => [saved, ...current])} onTemplateUpdated={(updated) => setTemplates((current) => current.map((item) => item.id === updated.id ? updated : item))} onTemplateDeleted={(id) => setTemplates((current) => current.filter((item) => item.id !== id))} onSaved={(saved) => { setSavedPlans((current) => [saved, ...current]); setFormVersion((current) => current + 1); setMessage("Treino criado. Os demais treinos foram mantidos."); }} /></>}</>}
    {section === "plans" && studentId && <section className={styles.catalog}><h2>Treinos deste aluno</h2>{savedPlans.length > 0 && <ReportButton onClick={() => setReportPlans(savedPlans)}>PDF do programa completo</ReportButton>}{savedPlans.length === 0 && <p>Nenhum treino cadastrado.</p>}{savedPlans.map((saved) => <article key={saved.id}><div><strong>{saved.name}</strong><span>{schedule.mode === "fixed" && saved.weekdays?.length ? `${saved.weekdays.map((day) => weekdayLabels[day]).join(", ")} · ` : ""}{{ active: "Ativo", archived: "Arquivado" }[saved.status]} · {saved.exercises.length} exercícios · {(saved.activities ?? []).length} atividades</span><details><summary>Ver prescrição</summary>{saved.exercises.map((item) => <p key={item.id}>{item.exercise.name} — {prescriptionSummary(item)}</p>)}{(saved.activities ?? []).map((item, index) => <p key={`${item.type}-${index}`}>{{ cardio: "Cardio", mobility: "Mobilidade", vacuum: "Vacuum" }[item.type]}: {item.name}{item.duration_minutes ? ` · ${formatWorkoutDuration(item.duration_minutes * 60)}` : ""}</p>)}</details></div><ReportButton onClick={() => setReportPlans([saved])}>Gerar PDF</ReportButton><button type="button" disabled={deletingPlanId !== null} aria-expanded={editingPlanId === saved.id} aria-controls={`edit-plan-${saved.id}`} onClick={() => setEditingPlanId(editingPlanId === saved.id ? null : saved.id)}>{editingPlanId === saved.id ? "Fechar edição" : "Editar treino"}</button><button type="button" className={styles.deletePlan} disabled={deletingPlanId !== null || editingPlanId !== null} title={editingPlanId !== null ? "Salve ou cancele a edição antes de excluir" : undefined} onClick={() => deletePlan(saved)}>{deletingPlanId === saved.id ? "Excluindo…" : "Excluir treino"}</button>{editingPlanId === saved.id && <section className={styles.inlineEditor} id={`edit-plan-${saved.id}`}><WorkoutPlanForm key={studentId + ":" + saved.id + ":" + schedule.mode} studentId={studentId} scheduleMode={schedule.mode} catalog={catalog} initial={saved} onCancel={() => setEditingPlanId(null)} onSaved={(updated) => { setSavedPlans((current) => current.map((item) => item.id === updated.id ? updated : item)); setEditingPlanId(null); setMessage("Treino atualizado."); }} /></section>}</article>)}</section>} 
    {section === "plans" && studentId && <section className={styles.history}><div><h2>Histórico do aluno</h2><button type="button" onClick={loadHistory}>Carregar histórico</button></div>{workoutHistory.map((item) => <article key={item.id}><div><strong>{item.workout_name}</strong><span>{new Date(item.completed_at ?? item.started_at).toLocaleDateString("pt-BR")} · {item.status === "in_progress" ? `Iniciado às ${new Date(item.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : formatWorkoutDuration(item.duration_seconds ?? item.duration_minutes * 60)} · {item.exercises.length} exercícios</span>{item.status === "in_progress" && <small className={styles.ongoingHistory}>Em andamento · {item.completion.completed_sets}/{item.completion.prescribed_sets} séries concluídas</small>}{item.is_partial && <small className={styles.partialHistory}>Finalizado parcialmente · {item.completion.missing_sets} série(s){item.completion.missing_activities > 0 ? ` e ${item.completion.missing_activities} atividade(s)` : ""} pendente(s)</small>}</div><details><summary>Ver cargas e progresso</summary>{item.exercises.map((exercise) => <p key={exercise.id}><strong>{exercise.exercise_name}</strong> — {performanceSummary(exercise)}</p>)}</details></article>)}{workoutHistory.length === 0 && <small>Carregue para consultar os treinos iniciados e concluídos.</small>}</section>}
    {message && <p className={styles.message}>{message}</p>}
    {reportPlans && <PrintableReport title={`programa-de-treino-${student?.name ?? "aluno"}`} variant="assessment" onClose={() => setReportPlans(null)}><WorkoutReport student={student} plans={reportPlans} /></PrintableReport>}
  </section>;
}

function ExerciseFields({ value, onChange, groups, disabled }) {
  const update = (event) => onChange((current) => ({ ...current, [event.target.name]: event.target.value }));
  const [preview, setPreview] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const selectedPreview = value.thumbnail_file ? preview : (!value.remove_thumbnail && value.thumbnail_url ? value.thumbnail_url : null);
  return <fieldset className={styles.editorFields} disabled={disabled}>
    <label>Nome<input required name="name" value={value.name} onChange={update} /></label>
    <label>Agrupamento<select required name="muscle_group_id" value={value.muscle_group_id} onChange={update}><option value="">Selecione</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
    <label className={styles.full}>Link do vídeo (opcional — YouTube ou Vimeo)<input type="url" name="video_url" value={value.video_url} onChange={update} /></label>
    <div className={styles.thumbnailField}>
      <label>Miniatura do exercício (opcional)<input key={value.thumbnail_file ? "selected" : "empty"} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setPreview(file ? URL.createObjectURL(file) : null); onChange((current) => ({ ...current, thumbnail_file: file, remove_thumbnail: false })); }} /></label>
      <small>Recomendado: imagem horizontal 16:9, 1280 × 720 px, JPG, PNG ou WebP. O sistema ajusta e centraliza a imagem para 960 × 540 px. Até 25 MB no celular/computador; o envio é otimizado automaticamente.</small>
      {selectedPreview && <><img src={selectedPreview} alt="Prévia da miniatura do exercício" />{!value.thumbnail_file && <button type="button" onClick={() => onChange((current) => ({ ...current, thumbnail_url: "", remove_thumbnail: true }))}>Remover miniatura</button>}</>}
    </div>
    <label className={styles.full}>Instruções<textarea name="instructions" value={value.instructions} onChange={update} /></label>
  </fieldset>;
}
