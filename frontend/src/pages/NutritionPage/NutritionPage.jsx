import { useEffect, useState } from "react";
import { Beef, ChevronDown, ChevronUp, Droplet, Droplets, Dumbbell, Flame, Pill, Utensils, Wheat } from "lucide-react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import ScreenHeader from "../../shared/components/ScreenHeader/ScreenHeader.jsx";
import styles from "./NutritionPage.module.css";

const targetLabel = (value, unit = "") => value === null || value === undefined || value === "" ? "—" : `${value}${unit}`;

function GuidanceList({ items, type }) {
  const Icon = type === "supplements" ? Pill : Dumbbell;
  const title = type === "supplements" ? "Suplementos" : "Recursos ergogênicos";
  if (!items.length) return <section className={`${styles.guidanceEmpty} surface-card`}><Icon /><h1>Nenhuma orientação cadastrada</h1><p>O professor ainda não adicionou itens em {title.toLocaleLowerCase("pt-BR")}.</p></section>;
  return <section className={styles.guidanceList}>{items.map((item, index) => <article className="surface-card" key={`${item.name}-${index}`}><Icon size={20} /><div><strong>{item.name}</strong>{item.dose && <span>Dose/quantidade: {item.dose}</span>}{item.schedule && <span>Horário/frequência: {item.schedule}</span>}{item.notes && <small>{item.notes}</small>}</div></article>)}</section>;
}

function FoodItem({ food }) {
  return <article>
    <div><strong>{food.name}</strong><span>{food.quantity} {food.unit}</span></div>
    {food.notes && <small>{food.notes}</small>}
    {food.recipe?.trim() && <details className={styles.recipe}><summary>Ver receita</summary><p>{food.recipe}</p></details>}
    {food.substitutions?.length > 0 && <details><summary>Opções de substituição</summary>{food.substitutions.map((substitution, index) => <div key={`${substitution.name}-${index}`}><p>{substitution.name} — {substitution.quantity} {substitution.unit}</p>{substitution.recipe?.trim() && <details className={styles.recipe}><summary>Ver receita da substituição</summary><p>{substitution.recipe}</p></details>}</div>)}</details>}
  </article>;
}

export default function NutritionPage() {
  const [plan, setPlan] = useState(null); const [hydration, setHydration] = useState({ amount_ml: 0 }); const [expanded, setExpanded] = useState(null); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const [activeTab, setActiveTab] = useState("plan");
  const [customWater, setCustomWater] = useState(""); const [savingWater, setSavingWater] = useState(false);
  useEffect(() => { apiRequest("/v1/student/nutrition").then((response) => { setPlan(response.data.plan); setHydration(response.data.hydration); }).catch((error) => setMessage(error.message)).finally(() => setLoading(false)); }, []);
  const addWater = async (amount) => {
    if (savingWater || !Number.isInteger(amount) || amount < 50 || amount > 2000) return;
    setSavingWater(true);
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/student/nutrition/hydration", { method: "POST", body: JSON.stringify({ amount_ml: amount }) });
      setHydration(response.data); setCustomWater(""); setMessage("");
    } catch (error) { setMessage(error.message); }
    finally { setSavingWater(false); }
  };
  const addCustomWater = (event) => { event.preventDefault(); addWater(Number(customWater)); };
  if (loading) return <div className={styles.page}><ScreenHeader /><div className="surface-card">Carregando plano alimentar…</div></div>;
  if (!plan) return <div className={styles.page}><ScreenHeader /><section className="surface-card"><h1>Nenhum plano alimentar publicado</h1><p>{message || "Seu professor ainda não disponibilizou seu plano."}</p></section></div>;
  const target = plan.hydration_target_ml || 3000; const percentage = Math.min(100, Math.round((hydration.amount_ml / target) * 100));
  return <div className={styles.page}><ScreenHeader />
    <div className={styles.tabs}><button className={activeTab === "plan" ? styles.active : ""} onClick={() => setActiveTab("plan")}>Plano alimentar</button><button className={activeTab === "supplements" ? styles.active : ""} onClick={() => setActiveTab("supplements")}>Suplementos</button><button className={activeTab === "ergogenic" ? styles.active : ""} onClick={() => setActiveTab("ergogenic")}>Recursos ergogênicos</button></div>
    {activeTab === "plan" && <><div className={styles.sectionTitle}><h1>{plan.name}</h1><span>Plano atual</span></div><section className={styles.macros}><div><Flame /><strong>{targetLabel(plan.target_calories)}</strong><small>kcal</small></div><div><Beef /><strong>{targetLabel(plan.target_protein_g, "g")}</strong><small>Proteína</small></div><div><Wheat /><strong>{targetLabel(plan.target_carbohydrates_g, "g")}</strong><small>Carboidratos</small></div><div><Droplet /><strong>{targetLabel(plan.target_fat_g, "g")}</strong><small>Gorduras</small></div></section>{plan.notes && <section className="surface-card"><small>{plan.notes}</small></section>}<div className={styles.meals}>{plan.meals.map((meal, index) => <section key={`${meal.name}-${index}`} className={styles.mealCard}><button type="button" onClick={() => setExpanded(expanded === index ? null : index)}><Utensils size={17} /><span><strong>{meal.name}</strong></span><time>{meal.time || "—"}</time>{expanded === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>{expanded === index && <div className={styles.foods}>{meal.foods.map((food, foodIndex) => <FoodItem key={`${food.name}-${foodIndex}`} food={food} />)}{meal.notes && <small>{meal.notes}</small>}</div>}</section>)}</div><section className={`${styles.hydration} surface-card`}><div className={styles.waterHead}><Droplets size={21} /><span><strong>Hidratação diária</strong><small>{percentage}% da meta</small></span><b>{(hydration.amount_ml / 1000).toLocaleString("pt-BR")} L / {(target / 1000).toLocaleString("pt-BR")} L</b></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div><button type="button" className="primary-button" disabled={savingWater} onClick={() => addWater(250)}>Adicionar 250 ml</button><form className={styles.customWater} onSubmit={addCustomWater}><label htmlFor="custom-water-ml">Outra quantidade (ml)</label><div><input id="custom-water-ml" type="number" inputMode="numeric" min="50" max="2000" step="1" required placeholder="Ex.: 350" value={customWater} onChange={(event) => setCustomWater(event.target.value)} /><button type="submit" disabled={savingWater || !customWater}>Adicionar água</button></div><small>De 50 a 2.000 ml por registro.</small></form></section></>}
    {activeTab === "supplements" && <GuidanceList items={plan.supplements ?? []} type="supplements" />}
    {activeTab === "ergogenic" && <><div className={styles.safetyNotice}>Consulte somente as orientações registradas pelo profissional responsável. Não altere doses ou frequência por conta própria.</div><GuidanceList items={plan.ergogenic_resources ?? []} type="ergogenic" /></>}
    {message && <p>{message}</p>}
  </div>;
}
