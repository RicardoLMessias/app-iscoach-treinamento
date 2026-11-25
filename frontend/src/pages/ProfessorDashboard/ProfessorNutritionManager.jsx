import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ProfessorNutritionManager.module.css";
import guidanceStyles from "./ProfessorNutritionGuidance.module.css";
import PrintableReport, { ReportButton } from "../../shared/reports/PrintableReport.jsx";
import { NutritionReport } from "../../shared/reports/ReportDocuments.jsx";

const units = ["g", "ml", "unidade", "colher", "xicara", "fatia", "porcao"];
const blankFood = () => ({ key: crypto.randomUUID(), name: "", quantity: "", unit: "g", notes: "", recipe: "", substitutions: [] });
const blankMeal = () => ({ key: crypto.randomUUID(), name: "", time: "", notes: "", foods: [blankFood()] });
const blankGuidance = () => ({ key: crypto.randomUUID(), name: "", dose: "", schedule: "", notes: "" });
const withGuidanceKeys = (items = []) => items.map((item) => ({ ...item, key: crypto.randomUUID() }));
const blankPlan = () => ({ name: "Plano alimentar", status: "active", target_calories: "", target_protein_g: "", target_carbohydrates_g: "", target_fat_g: "", hydration_target_ml: 3000, notes: "", meals: [blankMeal()], supplements: [], ergogenic_resources: [] });
const numeric = (value) => value === "" ? null : Number(value);
const cleanGuidance = (items) => items.map((item) => ({ name: item.name, dose: item.dose || null, schedule: item.schedule || null, notes: item.notes || null }));
const cleanSubstitution = (item) => ({ name: item.name, quantity: Number(item.quantity), unit: item.unit, notes: item.notes || null, recipe: item.recipe?.trim() || null });
const cleanFood = (food) => ({ name: food.name, quantity: Number(food.quantity), unit: food.unit, notes: food.notes || null, recipe: food.recipe?.trim() || null, substitutions: food.substitutions.map(cleanSubstitution) });
const cleanMeal = (meal) => ({ name: meal.name, time: meal.time || null, notes: meal.notes || null, foods: meal.foods.map(cleanFood) });
const cleanPlan = (plan) => ({ name: plan.name, status: plan.status, target_calories: numeric(plan.target_calories), target_protein_g: numeric(plan.target_protein_g), target_carbohydrates_g: numeric(plan.target_carbohydrates_g), target_fat_g: numeric(plan.target_fat_g), hydration_target_ml: numeric(plan.hydration_target_ml), notes: plan.notes || null, meals: plan.meals.map(cleanMeal), supplements: cleanGuidance(plan.supplements), ergogenic_resources: cleanGuidance(plan.ergogenic_resources) });
const editablePlan = (saved) => ({
  ...blankPlan(), ...saved,
  supplements: withGuidanceKeys(saved.supplements ?? []),
  ergogenic_resources: withGuidanceKeys(saved.ergogenic_resources ?? []),
  meals: (saved.meals ?? []).map((meal) => ({ ...meal, key: crypto.randomUUID(), foods: (meal.foods ?? []).map((food) => ({ ...food, key: crypto.randomUUID(), substitutions: withGuidanceKeys(food.substitutions ?? []) })) })),
});

function GuidanceEditor({ title, description, items, onChange }) {
  const update = (key, patch) => onChange(items.map((item) => item.key === key ? { ...item, ...patch } : item));
  return <section className={guidanceStyles.guidance}>
    <h3>{title}</h3><small>{description}</small>
    {items.map((item, index) => <div className={guidanceStyles.guidanceItem} key={item.key}>
      <label>Nome<input required maxLength={150} value={item.name} onChange={(event) => update(item.key, { name: event.target.value })} /></label>
      <label>Dose/quantidade<input maxLength={100} value={item.dose ?? ""} onChange={(event) => update(item.key, { dose: event.target.value })} /></label>
      <label>Horário/frequência<input maxLength={100} value={item.schedule ?? ""} onChange={(event) => update(item.key, { schedule: event.target.value })} /></label>
      <label className={styles.full}>Orientações<textarea maxLength={1000} value={item.notes ?? ""} onChange={(event) => update(item.key, { notes: event.target.value })} /></label>
      <button type="button" onClick={() => onChange(items.filter((entry) => entry.key !== item.key))}><Trash2 size={15} /> Remover item {index + 1}</button>
    </div>)}
    <button type="button" disabled={items.length >= 20} onClick={() => onChange([...items, blankGuidance()])}><Plus size={15} /> Adicionar item</button>
  </section>;
}

export default function ProfessorNutritionManager({ student }) {
  const formRef = useRef(null);
  const [plans, setPlans] = useState([]); const [templates, setTemplates] = useState([]); const [selectedTemplateId, setSelectedTemplateId] = useState(""); const [editing, setEditing] = useState(null); const [plan, setPlan] = useState(blankPlan); const [busy, setBusy] = useState(false); const [templateBusy, setTemplateBusy] = useState(false); const [deletingPlanId, setDeletingPlanId] = useState(null); const [reportPlan, setReportPlan] = useState(null); const [message, setMessage] = useState("");
  const studentId = student?.id;
  const load = () => studentId && apiRequest(`/v1/professor/students/${studentId}/nutrition-plans`).then((response) => setPlans(response.data));
  const loadTemplates = () => apiRequest("/v1/professor/nutrition-templates").then((response) => setTemplates(response.data));
  useEffect(() => { apiRequest("/v1/professor/nutrition-templates").then((response) => setTemplates(response.data)).catch((error) => setMessage(error.message)); }, []);
  useEffect(() => { if (studentId) apiRequest(`/v1/professor/students/${studentId}/nutrition-plans`).then((response) => setPlans(response.data)).catch((error) => setMessage(error.message)); }, [studentId]);
  const updateMeal = (mealKey, updater) => setPlan((current) => ({ ...current, meals: current.meals.map((meal) => meal.key === mealKey ? updater(meal) : meal) }));
  const updateFood = (mealKey, foodKey, patch) => updateMeal(mealKey, (meal) => ({ ...meal, foods: meal.foods.map((food) => food.key === foodKey ? { ...food, ...patch } : food) }));
  const removeMeal = (meal, index) => {
    const label = meal.name.trim() || `Refeição ${index + 1}`;
    if (!window.confirm(`Excluir “${label}” deste plano?\n\nOs alimentos e substituições desta refeição também serão removidos.`)) return;
    setPlan((current) => ({ ...current, meals: current.meals.filter((item) => item.key !== meal.key) }));
    setMessage(`A refeição “${label}” foi removida do formulário.`);
  };
  const editPlan = (saved) => {
    setEditing(saved);
    setPlan(editablePlan(saved));
    setMessage("Uma revisão será criada; a versão anterior permanecerá no histórico.");
  };
  const applyTemplate = () => {
    const template = templates.find((item) => String(item.id) === selectedTemplateId);
    if (!template) return;
    setEditing(null); setPlan(editablePlan(template));
    setMessage("Modelo carregado. Você pode personalizar antes de salvar para o aluno.");
  };
  const saveTemplate = async (updateExisting = false) => {
    if (updateExisting && !selectedTemplateId) return;
    if (!formRef.current?.reportValidity()) return;
    if (plan.meals.length === 0) { setMessage("Adicione ao menos uma refeição antes de salvar o modelo alimentar."); return; }
    setTemplateBusy(true); setMessage("");
    try {
      await initializeCsrf();
      const path = updateExisting ? `/v1/professor/nutrition-templates/${selectedTemplateId}` : "/v1/professor/nutrition-templates";
      const response = await apiRequest(path, { method: updateExisting ? "PUT" : "POST", body: JSON.stringify(cleanPlan(plan)) });
      await loadTemplates(); setSelectedTemplateId(String(response.data.id));
      setMessage(updateExisting ? "Modelo alimentar atualizado." : editing ? "Modelo salvo para reutilização. A revisão continua aberta e deve ser salva separadamente." : "Modelo alimentar salvo para reutilização.");
    } catch (error) { setMessage(error.message); } finally { setTemplateBusy(false); }
  };
  const deleteTemplate = async () => {
    const template = templates.find((item) => String(item.id) === selectedTemplateId);
    if (!template || !window.confirm(`Excluir o modelo alimentar "${template.name}"? Os planos já atribuídos aos alunos serão preservados.`)) return;
    setTemplateBusy(true); setMessage("");
    try {
      await initializeCsrf(); await apiRequest(`/v1/professor/nutrition-templates/${template.id}`, { method: "DELETE" });
      setTemplates((current) => current.filter((item) => item.id !== template.id)); setSelectedTemplateId("");
      setMessage("Modelo alimentar excluído. Os planos dos alunos foram preservados.");
    } catch (error) { setMessage(error.message); } finally { setTemplateBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault();
    if (plan.meals.length === 0) { setMessage("Adicione ao menos uma refeição antes de salvar o plano alimentar."); return; }
    setBusy(true); setMessage("");
    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/students/${studentId}/nutrition-plans${editing ? `/${editing.id}` : ""}`, { method: editing ? "PUT" : "POST", body: JSON.stringify(cleanPlan(plan)) });
      setPlan(blankPlan()); setEditing(null); await load(); setMessage("Plano alimentar salvo e registrado no histórico.");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const deletePlan = async (saved) => {
    if (busy || deletingPlanId !== null || editing) return;
    const studentName = student?.name ?? "este aluno";
    if (!window.confirm(`Excluir definitivamente o plano alimentar "${saved.name}" de ${studentName}?\n\nEssa ação não pode ser desfeita.`)) return;
    setDeletingPlanId(saved.id); setMessage("");
    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/students/${studentId}/nutrition-plans/${saved.id}`, { method: "DELETE" });
      setPlans((current) => current.filter((item) => item.id !== saved.id));
      setMessage(`Plano alimentar "${saved.name}" excluído definitivamente.`);
    } catch (error) { setMessage(error.message); } finally { setDeletingPlanId(null); }
  };
  if (!studentId) return <p>Selecione primeiro um aluno para montar o plano alimentar.</p>;
  return <section className={styles.manager}>
    <form ref={formRef} className={styles.form} onSubmit={save}>
      <h2>{editing ? "Revisar plano alimentar" : "Novo plano alimentar"}</h2>
      {!editing && <div className={styles.templatePicker}><label>Usar modelo salvo<select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}><option value="">Selecione um atalho</option>{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label><button type="button" disabled={!selectedTemplateId || busy || templateBusy} onClick={applyTemplate}>Preencher plano</button><button type="button" disabled={!selectedTemplateId || busy || templateBusy} onClick={() => saveTemplate(true)}>Atualizar modelo</button><button type="button" disabled={!selectedTemplateId || busy || templateBusy} onClick={deleteTemplate}>Excluir modelo</button></div>}
      <fieldset disabled={busy}>
        <label>Nome<input required maxLength={100} value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} /></label>
        <label>Status<select value={plan.status} onChange={(event) => setPlan({ ...plan, status: event.target.value })}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>
        <label>Calorias (kcal)<input type="number" min="1" max="20000" value={plan.target_calories ?? ""} onChange={(event) => setPlan({ ...plan, target_calories: event.target.value })} /></label>
        <label>Proteína (g)<input type="number" min="0" max="2000" step="0.1" value={plan.target_protein_g ?? ""} onChange={(event) => setPlan({ ...plan, target_protein_g: event.target.value })} /></label>
        <label>Carboidratos (g)<input type="number" min="0" max="3000" step="0.1" value={plan.target_carbohydrates_g ?? ""} onChange={(event) => setPlan({ ...plan, target_carbohydrates_g: event.target.value })} /></label>
        <label>Gorduras (g)<input type="number" min="0" max="1000" step="0.1" value={plan.target_fat_g ?? ""} onChange={(event) => setPlan({ ...plan, target_fat_g: event.target.value })} /></label>
        <label>Meta de água (ml)<input type="number" min="250" max="20000" value={plan.hydration_target_ml ?? ""} onChange={(event) => setPlan({ ...plan, hydration_target_ml: event.target.value })} /></label>
        <label className={styles.full}>Orientações gerais<textarea maxLength={5000} value={plan.notes ?? ""} onChange={(event) => setPlan({ ...plan, notes: event.target.value })} /></label>
      </fieldset>
      <h3>Refeições</h3>
      {plan.meals.length === 0 && <div className={styles.emptyMeals}><strong>Nenhuma refeição no plano</strong><span>Adicione uma refeição para poder salvar o plano ou o modelo alimentar.</span></div>}
      {plan.meals.map((meal, mealIndex) => <section className={styles.meal} key={meal.key}>
        <div className={styles.mealHeader}><h4>Refeição {mealIndex + 1}</h4><button type="button" className={styles.removeMeal} onClick={() => removeMeal(meal, mealIndex)}><Trash2 size={15} /> Excluir refeição</button></div>
        <div className={styles.row}><label>Nome da refeição<input required value={meal.name} onChange={(event) => updateMeal(meal.key, (item) => ({ ...item, name: event.target.value }))} /></label><label>Horário<input type="time" value={meal.time ?? ""} onChange={(event) => updateMeal(meal.key, (item) => ({ ...item, time: event.target.value }))} /></label></div>
        {meal.foods.map((food) => <div className={styles.food} key={food.key}>
          <label>Alimento<input required value={food.name} onChange={(event) => updateFood(meal.key, food.key, { name: event.target.value })} /></label><label>Quantidade<input required type="number" min="0.01" step="0.01" value={food.quantity} onChange={(event) => updateFood(meal.key, food.key, { quantity: event.target.value })} /></label><label>Unidade<select value={food.unit} onChange={(event) => updateFood(meal.key, food.key, { unit: event.target.value })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
          <button type="button" disabled={meal.foods.length === 1} onClick={() => updateMeal(meal.key, (item) => ({ ...item, foods: item.foods.filter((entry) => entry.key !== food.key) }))}><Trash2 size={15} /></button>
          <label className={styles.full}>Receita (opcional, até 3.000 caracteres)<textarea maxLength={3000} rows={6} value={food.recipe ?? ""} onChange={(event) => updateFood(meal.key, food.key, { recipe: event.target.value })} placeholder="Ingredientes e modo de preparo" /></label>
          <div className={styles.substitutions}><strong>Substituições deste alimento</strong>{food.substitutions.map((substitution) => <div className={styles.substitutionItem} key={substitution.key}><div className={styles.substitutionFields}><input required aria-label="Nome da substituição" placeholder="Ex.: peixe" value={substitution.name} onChange={(event) => updateFood(meal.key, food.key, { substitutions: food.substitutions.map((item) => item.key === substitution.key ? { ...item, name: event.target.value } : item) })} /><input required aria-label="Quantidade da substituição" type="number" min="0.01" step="0.01" placeholder="Quantidade" value={substitution.quantity} onChange={(event) => updateFood(meal.key, food.key, { substitutions: food.substitutions.map((item) => item.key === substitution.key ? { ...item, quantity: event.target.value } : item) })} /><select aria-label="Unidade da substituição" value={substitution.unit} onChange={(event) => updateFood(meal.key, food.key, { substitutions: food.substitutions.map((item) => item.key === substitution.key ? { ...item, unit: event.target.value } : item) })}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select><button type="button" aria-label="Remover substituição" onClick={() => updateFood(meal.key, food.key, { substitutions: food.substitutions.filter((item) => item.key !== substitution.key) })}><Trash2 size={14} /></button></div><label>Receita da substituição (opcional, até 3.000 caracteres)<textarea maxLength={3000} rows={5} value={substitution.recipe ?? ""} onChange={(event) => updateFood(meal.key, food.key, { substitutions: food.substitutions.map((item) => item.key === substitution.key ? { ...item, recipe: event.target.value } : item) })} placeholder="Ingredientes e modo de preparo" /></label></div>)}<button type="button" onClick={() => updateFood(meal.key, food.key, { substitutions: [...food.substitutions, { key: crypto.randomUUID(), name: "", quantity: "", unit: "g", notes: "", recipe: "" }] })}><Plus size={14} /> Substituição</button></div>
        </div>)}
        <button type="button" onClick={() => updateMeal(meal.key, (item) => ({ ...item, foods: [...item.foods, blankFood()] }))}><Plus size={15} /> Alimento</button>
      </section>)}
      <button type="button" onClick={() => setPlan((current) => ({ ...current, meals: [...current.meals, blankMeal()] }))}><Plus size={15} /> Adicionar refeição</button>
      <GuidanceEditor title="Suplementos" description="Orientações que ficarão disponíveis para consulta do aluno." items={plan.supplements} onChange={(supplements) => setPlan((current) => ({ ...current, supplements }))} />
      <GuidanceEditor title="Recursos ergogênicos" description="Registre somente orientações definidas pelo profissional responsável." items={plan.ergogenic_resources} onChange={(ergogenic_resources) => setPlan((current) => ({ ...current, ergogenic_resources }))} />
      <button className="primary-button" disabled={busy || templateBusy}>{busy ? "Salvando…" : editing ? "Salvar nova versão" : "Salvar plano"}</button>
      <button type="button" disabled={busy || templateBusy} onClick={() => saveTemplate(false)}>{templateBusy ? "Salvando modelo…" : editing ? "Salvar revisão como novo modelo" : "Salvar como novo modelo"}</button>
      {editing && <button type="button" disabled={busy || templateBusy} onClick={() => { setEditing(null); setPlan(blankPlan()); }}>Cancelar revisão</button>}
    </form>
    <section className={styles.history}><h2>Planos e histórico</h2>{plans.map((saved) => <article key={saved.id}><div><strong>{saved.name}</strong><small>{saved.status === "active" ? "Ativo" : "Arquivado"} · {saved.meals.length} refeições · {new Date(saved.created_at).toLocaleDateString("pt-BR")}</small></div><div className={styles.planActions}><ReportButton onClick={() => setReportPlan(saved)}>Gerar PDF</ReportButton><button type="button" disabled={deletingPlanId !== null} onClick={() => editPlan(saved)}>Revisar</button><button type="button" className={styles.deletePlan} disabled={saved.status === "active" || deletingPlanId !== null || editing !== null} title={saved.status === "active" ? "Arquive o plano antes de excluí-lo" : editing ? "Conclua ou cancele a revisão antes de excluir" : undefined} onClick={() => deletePlan(saved)}>{deletingPlanId === saved.id ? "Excluindo…" : "Excluir plano"}</button></div></article>)}</section>
    {message && <p className={styles.message}>{message}</p>}
    {reportPlan && <PrintableReport title={`plano-alimentar-${student?.name ?? "aluno"}`} variant="assessment" onClose={() => setReportPlan(null)}><NutritionReport student={student} plan={reportPlan} /></PrintableReport>}
  </section>;
}
