import styles from "../../pages/ProfessorDashboard/PhysicalAssessments.module.css";

const resultLabels = { bmi:"IMC (kg/m²)", waist_hip_ratio:"Relação cintura/quadril", skinfolds_seven:"Soma de 7 dobras (mm)", body_density:"Densidade corporal (g/cm³)", body_fat_percentage:"Gordura corporal (%)", fat_mass:"Massa gorda (kg)", fat_free_mass:"Massa livre de gordura (kg)", muscle_mass:"Massa muscular (kg)", arm_difference:"Diferença entre braços (cm)", forearm_difference:"Diferença entre antebraços (cm)", thigh_difference:"Diferença entre coxas (cm)", calf_difference:"Diferença entre panturrilhas (cm)" };
export function AssessmentResults({ results }) {
  return <section className={styles.results}><h3>Resultados calculados</h3>
    {Object.entries(results?.values ?? {}).filter(([key]) => resultLabels[key]).map(([key,value]) => <div key={key}><span>{resultLabels[key]}</span><strong>{Number(value).toLocaleString("pt-BR", { maximumFractionDigits:3 })}</strong></div>)}
    {!Object.keys(results?.values ?? {}).some((key) => resultLabels[key]) && <p>Preencha as medidas necessárias e salve para calcular.</p>}
    {results?.pending && <p className={styles.notice}>{results.pending}</p>}
  </section>;
}
export default function AssessmentDetails({ assessment, schema = [] }) {
  const safeSchema = Array.isArray(schema) ? schema : [];
  return <><AssessmentResults results={assessment.results} />{safeSchema.map((group) => {
    const fields = (Array.isArray(group.fields) ? group.fields : []).filter((field) => !field.hidden && assessment.inputs?.[group.key]?.[field.key] != null && assessment.inputs[group.key][field.key] !== "");
    if (!fields.length) return null;
    return <details className={styles.group} key={group.key}><summary>{group.label}</summary><section className={styles.results}>{fields.map((field) => <div key={field.key}><span>{field.label}</span><strong>{assessment.inputs[group.key][field.key]} {field.unit ?? ""}</strong></div>)}</section></details>;
  })}</>;
}
