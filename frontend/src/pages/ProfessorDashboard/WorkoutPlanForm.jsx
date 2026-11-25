import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Send, Trash2, Video, VideoOff } from "lucide-react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ProfessorTrainingManager.module.css";

const blankItem = (category = "exercise") => ({ key: crypto.randomUUID(), category, exercise_id: "", group_id: "", search: "", sets: 4, measurement_type: "repetitions", target_seconds: "", reps_min: 8, reps_max: 12, rest_seconds: "", target_load: "", notes: "" });
const blankActivity = (type = "cardio") => ({ key: crypto.randomUUID(), type, exercise_id: "", name: "", duration_minutes: "", rounds: "", notes: "", legacy: false });
const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
const optionalNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);
const prescriptionPayload = (item) => ({ exercise_id: Number(item.exercise_id), sets: Number(item.sets), measurement_type: item.measurement_type, target_seconds: item.measurement_type === "time" ? Number(item.target_seconds) : null, reps_min: item.measurement_type === "time" ? null : Number(item.reps_min), reps_max: item.measurement_type === "time" ? null : Number(item.reps_max), rest_seconds: Number(item.rest_seconds), target_load: optionalNumber(item.target_load), notes: item.notes || null });
const mapActivity = (item) => ({ ...blankActivity(item.type), ...item, exercise_id: item.exercise_id ?? "", duration_minutes: item.duration_minutes ?? "", rounds: item.rounds ?? "", notes: item.notes ?? "", legacy: !item.exercise_id });
const weekdays = [["monday", "Segunda-feira"], ["tuesday", "Terça-feira"], ["wednesday", "Quarta-feira"], ["thursday", "Quinta-feira"], ["friday", "Sexta-feira"], ["saturday", "Sábado"], ["sunday", "Domingo"]];

export default function WorkoutPlanForm({ studentId, scheduleMode = "rotating", catalog, initial, templates = [], onTemplateSaved, onTemplateUpdated, onTemplateDeleted, onSaved, onCancel }) {
  const formId = useId();
  const formRef = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [plan, setPlan] = useState(() => ({
    name: initial?.name ?? "", subtitle: initial?.subtitle ?? "", weekdays: initial?.weekdays ?? (initial?.weekday ? [initial.weekday] : []),
    estimated_duration_minutes: initial?.estimated_duration_minutes ?? 60, status: initial?.status ?? "active",
  }));
  const [items, setItems] = useState(() => initial ? initial.exercises.map((item) => {
    const entry = catalog.exercises.find((exercise) => exercise.id === item.exercise.id);
    return { ...blankItem(item.category ?? entry?.category ?? item.exercise.category ?? "exercise"), exercise_id: item.exercise.id, group_id: String(entry?.muscle_group.id ?? ""), search: entry?.name ?? item.exercise.name,
      sets: item.sets, measurement_type: item.measurement_type ?? "repetitions", target_seconds: item.target_seconds ?? "", reps_min: item.reps_min, reps_max: item.reps_max, rest_seconds: item.rest_seconds ?? "", target_load: item.target_load ?? "", notes: item.notes ?? "" };
  }) : [blankItem()]);
  const [activities, setActivities] = useState(() => (initial?.activities ?? []).map(mapActivity));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const updateItem = (key, patch) => setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  const updatePlan = ({ target }) => setPlan((current) => ({ ...current, [target.name]: target.value }));
  const moveItem = (index, direction) => setItems((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const copy = [...current];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  });
  const mapExercise = (item) => {
    const entry = catalog.exercises.find((exercise) => exercise.id === item.exercise.id);
    return { ...blankItem(item.category ?? entry?.category ?? item.exercise.category ?? "exercise"), exercise_id: item.exercise.id, group_id: String(entry?.muscle_group.id ?? item.exercise.muscle_group?.id ?? ""), search: entry?.name ?? item.exercise.name,
      sets: item.sets, measurement_type: item.measurement_type ?? "repetitions", target_seconds: item.target_seconds ?? "", reps_min: item.reps_min, reps_max: item.reps_max, rest_seconds: item.rest_seconds ?? "", target_load: item.target_load ?? "", notes: item.notes ?? "" };
  };
  const applyTemplate = () => {
    const template = templates.find((item) => String(item.id) === selectedTemplateId);
    if (!template) return;
    const unavailable = template.exercises.filter((item) => !catalog.exercises.some((exercise) => exercise.id === item.exercise.id && exercise.is_active));
    if (unavailable.length) { setMessage(`Este modelo contém ${unavailable.length} exercício(s) indisponível(is).`); return; }
    const unavailableActivities = (template.activities ?? []).filter((item) => item.exercise_id && !catalog.exercises.some((exercise) => exercise.id === item.exercise_id && exercise.is_active && exercise.category === item.type));
    if (unavailableActivities.length) { setMessage(`Este modelo contém ${unavailableActivities.length} atividade(s) indisponível(is) na biblioteca.`); return; }
    setPlan((current) => ({ ...current, name: template.name, subtitle: template.subtitle ?? "", estimated_duration_minutes: template.estimated_duration_minutes ?? 60 }));
    setItems(template.exercises.map(mapExercise));
    setActivities((template.activities ?? []).map(mapActivity));
    setMessage("Modelo carregado. Você pode personalizar antes de salvar para o aluno.");
  };
  const saveAsTemplate = async (updateExisting = false) => {
    setMessage("");
    // A reusable model does not carry a student's fixed weekdays.
    const weekdayRequired = formRef.current?.querySelector('input[type="checkbox"][required]');
    if (weekdayRequired) weekdayRequired.required = false;
    const formValid = formRef.current?.reportValidity();
    if (weekdayRequired) weekdayRequired.required = true;
    if (!formValid) return;
    if (!plan.name.trim() || items.some((item) => !item.exercise_id)) { setMessage("Informe o nome e selecione todos os exercícios antes de salvar o modelo."); return; }
    if (items.some((item) => item.rest_seconds === "" || item.rest_seconds === null || item.rest_seconds === undefined)) { setMessage("Informe o tempo de descanso de todos os exercícios antes de salvar o modelo."); return; }
    setBusy(true);
    try {
      await initializeCsrf();
      const payload = { name: plan.name, subtitle: plan.subtitle || null, estimated_duration_minutes: Number(plan.estimated_duration_minutes), exercises: items.map(prescriptionPayload), activities: activities.map(({ type, exercise_id, name, duration_minutes, rounds, notes }) => ({ type, exercise_id: optionalNumber(exercise_id), name, duration_minutes: optionalNumber(duration_minutes), rounds: optionalNumber(rounds), notes: notes || null })) };
      const path = updateExisting ? `/v1/professor/workout-templates/${selectedTemplateId}` : "/v1/professor/workout-templates";
      const response = await apiRequest(path, { method: updateExisting ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (updateExisting) onTemplateUpdated?.(response.data); else onTemplateSaved?.(response.data);
      setSelectedTemplateId(String(response.data.id)); setMessage(updateExisting ? "Modelo atualizado." : initial ? "Modelo salvo para reutilização. A revisão do treino continua aberta e deve ser salva separadamente." : "Modelo salvo na biblioteca de atalhos.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const deleteTemplate = async () => {
    const template = templates.find((item) => String(item.id) === selectedTemplateId);
    if (!template || !window.confirm(`Excluir o modelo "${template.name}"? Os treinos já atribuídos aos alunos serão preservados.`)) return;
    setBusy(true);
    try {
      await initializeCsrf(); await apiRequest(`/v1/professor/workout-templates/${template.id}`, { method: "DELETE" });
      onTemplateDeleted?.(template.id); setSelectedTemplateId(""); setMessage("Modelo excluído. Os treinos dos alunos foram preservados.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  async function save(event) {
    event.preventDefault();
    setMessage("");
    if (items.some((item) => !item.exercise_id)) {
      setMessage("Selecione um exercício existente nas sugestões de cada linha.");
      return;
    }
    if (items.some((item) => item.rest_seconds === "" || item.rest_seconds === null || item.rest_seconds === undefined)) {
      setMessage("Informe o tempo de descanso de todos os exercícios antes de salvar o treino.");
      return;
    }
    if (new Set(items.map((item) => String(item.exercise_id))).size !== items.length) {
      setMessage("O mesmo exercício não pode aparecer duas vezes no treino.");
      return;
    }
    if (scheduleMode === "fixed" && plan.weekdays.length === 0) {
      setMessage("Selecione ao menos um dia da semana para este treino fixo.");
      return;
    }
    setBusy(true);
    try {
      await initializeCsrf();
      const exercises = items.map(prescriptionPayload);
      const complementaryActivities = activities.map(({ type, exercise_id, name, duration_minutes, rounds, notes }) => ({
        type, exercise_id: optionalNumber(exercise_id), name, duration_minutes: optionalNumber(duration_minutes), rounds: optionalNumber(rounds), notes,
      }));
      const workoutPlan = {
        ...plan,
        weekdays: scheduleMode === "fixed" ? plan.weekdays : undefined,
        estimated_duration_minutes: Number(plan.estimated_duration_minutes),
        exercises,
        activities: complementaryActivities,
      };
      const response = await apiRequest(`/v1/professor/students/${studentId}/workouts${initial ? `/${initial.id}` : ""}`, {
        method: initial ? "PUT" : "POST", body: JSON.stringify(workoutPlan),
      });
      if (mounted.current) onSaved(response.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form ref={formRef} className={styles.form} onSubmit={save}>
    <h2>{initial ? `Editar ${initial.name}` : "Novo treino"}</h2>
    {!initial && <div className={styles.templatePicker}><label>Usar modelo salvo<select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}><option value="">Selecione um atalho</option>{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label><button type="button" disabled={!selectedTemplateId || busy} onClick={applyTemplate}>Preencher treino</button><button type="button" disabled={!selectedTemplateId || busy} onClick={() => saveAsTemplate(true)}>Atualizar modelo</button><button type="button" disabled={!selectedTemplateId || busy} onClick={deleteTemplate}>Excluir modelo</button></div>}
    <fieldset className={styles.editorFields} disabled={busy}>
      <label>Nome<input required name="name" maxLength={100} value={plan.name} onChange={updatePlan} /></label>
      <label>Descrição<input name="subtitle" maxLength={150} value={plan.subtitle} onChange={updatePlan} /></label>
      {scheduleMode === "fixed" ? <fieldset className={styles.weekdayPicker}><legend>Dias deste treino</legend>{weekdays.map(([value, label], index) => <label key={value}><input type="checkbox" aria-label={index === 0 ? "ao menos um dia da semana" : label} required={index === 0 && plan.weekdays.length === 0} checked={plan.weekdays.includes(value)} onChange={(event) => setPlan((current) => ({ ...current, weekdays: event.target.checked ? weekdays.map(([day]) => day).filter((day) => day === value || current.weekdays.includes(day)) : current.weekdays.filter((day) => day !== value) }))} />{label}</label>)}</fieldset> : <div className={styles.rotationNotice}><strong>Sequência rotativa</strong><span>Este treino entrará na rotação em ordem alfabética pelo nome.</span></div>}
      <label>Duração estimada (min)<input required name="estimated_duration_minutes" type="number" min="1" max="600" value={plan.estimated_duration_minutes} onChange={updatePlan} /></label>
      <label>Status<select name="status" value={plan.status} onChange={updatePlan}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>
      <div className={styles.full}><h3>Exercícios e mobilidade</h3><small>Adicione os movimentos de mobilidade pela biblioteca exclusiva; o aluno os verá em uma aba própria.</small>
        {catalog.exercises.length === 0 && <p>Cadastre os exercícios na aba Biblioteca.</p>}
        {catalog.exercises.length > 0 && <div className={styles.videoLegend} aria-label="Situação dos vídeos na biblioteca"><span data-video="true"><Video size={15} /> {catalog.exercises.filter((entry) => entry.video_url).length} com vídeo</span><span data-video="false"><VideoOff size={15} /> {catalog.exercises.filter((entry) => !entry.video_url).length} sem vídeo</span></div>}
        {items.map((item, index) => {
          const available = catalog.exercises.filter((entry) => entry.is_active && (entry.category ?? "exercise") === item.category && (!item.group_id || String(entry.muscle_group.id) === item.group_id));
          const suggestions = available.filter((entry) => normalize(entry.name).includes(normalize(item.search)));
          const selectedExercise = available.find((entry) => String(entry.id) === String(item.exercise_id));
          const listId = `${formId}-${item.key}`;
          return <div className={styles.planItem} key={item.key}>
            <strong className={styles.full}>{item.category === "mobility" ? "Mobilidade" : "Exercício"} {items.slice(0, index + 1).filter((entry) => entry.category === item.category).length}</strong>
            <label className={styles.full}>Agrupamento<select value={item.group_id} onChange={(event) => updateItem(item.key, { group_id: event.target.value, search: "", exercise_id: "" })}>
              <option value="">Todos os agrupamentos</option>{catalog.muscle_groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select></label>
            <label className={styles.full}>Buscar {item.category === "mobility" ? "mobilidade" : "exercício"} por nome
              <input required list={listId} autoComplete="off" maxLength={255} placeholder="Digite ou selecione um exercício" value={item.search}
                onChange={(event) => {
                  const match = available.find((entry) => normalize(entry.name) === normalize(event.target.value));
                  updateItem(item.key, { search: event.target.value, exercise_id: match?.id ?? "" });
                }} />
              <datalist id={listId}>{suggestions.map((entry) => <option key={entry.id} value={entry.name}>{entry.muscle_group.name} · {entry.video_url ? "Com vídeo" : "Sem vídeo"}</option>)}</datalist>
              <small>{item.exercise_id ? "Exercício selecionado" : suggestions.length ? "Escolha um nome da biblioteca." : "Nenhum exercício encontrado neste agrupamento."}</small>
            </label>
            <label className={styles.full}>{item.category === "mobility" ? "Mobilidade" : "Exercício"}<select required value={item.exercise_id} onChange={(event) => {
              const selected = available.find((entry) => String(entry.id) === event.target.value);
              updateItem(item.key, { exercise_id: selected?.id ?? "", search: selected?.name ?? "" });
            }}><option value="">Selecione na lista filtrada</option>{available.filter((entry) => String(entry.id) === String(item.exercise_id) || suggestions.includes(entry)).map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.muscle_group.name} · {entry.video_url ? "Com vídeo" : "Sem vídeo"}</option>)}</select>{selectedExercise && <span className={styles.videoStatus} data-video={Boolean(selectedExercise.video_url)}>{selectedExercise.video_url ? <Video size={15} /> : <VideoOff size={15} />}{selectedExercise.video_url ? "Este exercício possui vídeo" : "Este exercício ainda está sem vídeo"}</span>}</label>
            <div className={styles.metricFields}>
              <label className={styles.measurementType}>Medir por<select value={item.measurement_type} onChange={(event) => updateItem(item.key, { measurement_type: event.target.value, reps_min: event.target.value === "repetitions" ? item.reps_min || 8 : item.reps_min, reps_max: event.target.value === "repetitions" ? item.reps_max || 12 : item.reps_max })}><option value="repetitions">Repetições</option><option value="time">Tempo</option></select></label>
              <label>Séries<input required type="number" min="1" max="20" value={item.sets} onChange={(event) => updateItem(item.key, { sets: event.target.value })} /></label>
              {item.measurement_type === "time" ? <label>Duração por série (s)<input required type="number" min="1" max="3600" placeholder="Ex.: 30" value={item.target_seconds} onChange={(event) => updateItem(item.key, { target_seconds: event.target.value })} /></label> : <><label>Reps mín.<input required type="number" min="1" max="999" value={item.reps_min} onChange={(event) => updateItem(item.key, { reps_min: event.target.value })} /></label><label>Reps máx.<input required type="number" min={item.reps_min || 1} max="999" value={item.reps_max} onChange={(event) => updateItem(item.key, { reps_max: event.target.value })} /></label></>}
              <label>Descanso (s)<input required type="number" min="0" max="3600" placeholder="Ex.: 60" value={item.rest_seconds} onChange={(event) => updateItem(item.key, { rest_seconds: event.target.value })} /><small>Obrigatório para iniciar o cronômetro.</small></label>
              <label>Carga sugerida (kg)<input type="number" min="0" max="99999.99" step="0.01" value={item.target_load} onChange={(event) => updateItem(item.key, { target_load: event.target.value })} /></label>
            </div>
            <label className={styles.itemNotes}>Orientações para o aluno<textarea maxLength={2000} placeholder="Ex.: mantenha as escápulas apoiadas e controle a descida" value={item.notes} onChange={(event) => updateItem(item.key, { notes: event.target.value })} /></label>
            <div className={styles.orderButtons}><button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label={`Mover exercício ${index + 1} para cima`}><ArrowUp size={15} /></button><button type="button" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} aria-label={`Mover exercício ${index + 1} para baixo`}><ArrowDown size={15} /></button></div>
            {items.length > 1 && <button className={styles.remove} type="button" onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}><Trash2 size={15} /> Remover {item.category === "mobility" ? "mobilidade" : "exercício"} {items.slice(0, index + 1).filter((entry) => entry.category === item.category).length}</button>}
          </div>;
        })}
        <div className={styles.addActions}><button className={styles.add} type="button" disabled={items.length >= 50} onClick={() => setItems((current) => [...current, blankItem()])}><Plus size={15} /> Adicionar exercício</button><button className={styles.add} type="button" disabled={items.length >= 50} onClick={() => setItems((current) => [...current, blankItem("mobility")])}><Plus size={15} /> Adicionar mobilidade</button></div>
      </div>
      <div className={styles.full}><h3>Atividades complementares</h3><small>Cadastre cardio e vacuum na Biblioteca e selecione aqui o item específico. Atividades antigas continuam editáveis.</small>
        {activities.map((activity, index) => <div className={styles.activityItem} key={activity.key}>
          <strong className={styles.full}>{activity.type === "mobility" ? "Mobilidade antiga" : activity.type === "cardio" ? "Cardio" : "Vacuum"} {index + 1}</strong>
          {activity.legacy ? <><label>Tipo<select value={activity.type} onChange={(event) => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, type: event.target.value } : item))}><option value="cardio">Cardio</option>{activity.type === "mobility" && <option value="mobility">Mobilidade antiga</option>}<option value="vacuum">Vacuum</option></select></label><label>Nome<input required maxLength={255} value={activity.name} onChange={(event) => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, name: event.target.value } : item))} /></label>{activity.type !== "mobility" && <button type="button" className={styles.add} onClick={() => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, legacy: false, exercise_id: "", name: "" } : item))}>Escolher da biblioteca</button>}</> : <label className={styles.full}>Selecionar {activity.type} da biblioteca<select required value={activity.exercise_id} onChange={(event) => { const selected = catalog.exercises.find((entry) => String(entry.id) === event.target.value); setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, exercise_id: selected?.id ?? "", name: selected?.name ?? "" } : item)); }}><option value="">Selecione um item</option>{catalog.exercises.filter((entry) => entry.is_active && entry.category === activity.type).map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.muscle_group.name}</option>)}</select>{!catalog.exercises.some((entry) => entry.is_active && entry.category === activity.type) && <small>Cadastre primeiro este tipo na Biblioteca.</small>}</label>}
          <label>Duração (min)<input type="number" min="1" max="600" value={activity.duration_minutes} onChange={(event) => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, duration_minutes: event.target.value } : item))} /></label>
          <label>Voltas/séries<input type="number" min="1" max="100" value={activity.rounds} onChange={(event) => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, rounds: event.target.value } : item))} /></label>
          <label className={styles.itemNotes}>Orientações<input maxLength={1000} value={activity.notes} onChange={(event) => setActivities((current) => current.map((item) => item.key === activity.key ? { ...item, notes: event.target.value } : item))} /></label>
          <button className={styles.remove} type="button" onClick={() => setActivities((current) => current.filter((item) => item.key !== activity.key))}><Trash2 size={15} /> Remover atividade {index + 1}</button>
        </div>)}
        <div className={styles.addActions}><button className={styles.add} type="button" disabled={activities.length >= 12} onClick={() => setActivities((current) => [...current, blankActivity("cardio")])}><Plus size={15} /> Adicionar cardio</button><button className={styles.add} type="button" disabled={activities.length >= 12} onClick={() => setActivities((current) => [...current, blankActivity("vacuum")])}><Plus size={15} /> Adicionar vacuum</button></div>
      </div>
    </fieldset>
    {message && <p className={styles.full} role="alert">{message}</p>}
    <button className="primary-button" disabled={busy || !studentId}><Send size={16} />{busy ? "Salvando…" : initial ? "Salvar alterações" : "Salvar treino"}</button>
    <button type="button" disabled={busy} onClick={() => saveAsTemplate(false)}>{initial ? "Salvar revisão como novo modelo" : "Salvar como novo modelo"}</button>
    {onCancel && <button type="button" disabled={busy} onClick={onCancel}>Cancelar edição</button>}
  </form>;
}
