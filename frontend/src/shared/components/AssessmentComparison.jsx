import { useEffect, useMemo, useState } from "react";
import { apiRequest, appPath } from "../../services/http/apiClient.js";
import styles from "./AssessmentComparison.module.css";
import PrintableReport, { ReportButton } from "../reports/PrintableReport.jsx";
import { AssessmentComparisonReport } from "../reports/ReportDocuments.jsx";

const positions = { front: "Frontal", right: "Lateral direita", left: "Lateral esquerda", back: "Posterior" };
const resultFields = {
  bmi: { label: "IMC", unit: "kg/m²" },
  waist_hip_ratio: { label: "Relação cintura/quadril", unit: "" },
  skinfolds_seven: { label: "Soma de 7 dobras", unit: "mm" },
  body_density: { label: "Densidade corporal", unit: "g/cm³" },
  body_fat_percentage: { label: "Gordura corporal", unit: "%" },
  fat_mass: { label: "Massa gorda", unit: "kg" },
  fat_free_mass: { label: "Massa livre de gordura", unit: "kg" },
  muscle_mass: { label: "Massa muscular", unit: "kg" },
  arm_difference: { label: "Diferença entre braços", unit: "cm" },
  forearm_difference: { label: "Diferença entre antebraços", unit: "cm" },
  thigh_difference: { label: "Diferença entre coxas", unit: "cm" },
  calf_difference: { label: "Diferença entre panturrilhas", unit: "cm" },
};
const dateLabel = (value) => value?.split("-").reverse().join("/") ?? "—";
const numeric = (value) => value !== null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const formatValue = (value, unit = "") => {
  if (value === null || value === undefined || value === "") return "—";
  const number = numeric(value);
  const displayed = number === null ? String(value) : number.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return `${displayed}${unit ? ` ${unit}` : ""}`;
};
const deltaLabel = (first, second, unit = "") => {
  const before = numeric(first), after = numeric(second);
  if (before === null || after === null) return "—";
  const delta = after - before;
  return `${delta > 0 ? "+" : ""}${delta.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}${unit ? ` ${unit}` : ""}`;
};
const optionLabel = (assessment) => `${dateLabel(assessment.assessed_on)} · Versão ${assessment.version}`;

function ComparisonRows({ fields, first, second }) {
  return <div className={styles.rows}>{fields.map((field) => {
    const before = field.read(first), after = field.read(second);
    const comparable = numeric(before) !== null && numeric(after) !== null;
    return <div className={styles.row} key={field.key}>
      <strong>{field.label}</strong>
      <span>{formatValue(before, field.unit)}</span>
      <span>{formatValue(after, field.unit)}</span>
      <em>{comparable ? deltaLabel(before, after, field.unit) : before === after && before ? "Sem alteração" : "Alterado"}</em>
    </div>;
  })}</div>;
}

export default function AssessmentComparison({ student, assessments = [], schema = [], showPdf = true }) {
  const safeSchema = Array.isArray(schema) ? schema : [];
  const available = useMemo(() => (Array.isArray(assessments) ? assessments : []).filter(({ status }) => status === "finalized" || status === "corrected"), [assessments]);
  const [firstId, setFirstId] = useState(() => String(available.at(-1)?.id ?? ""));
  const [secondId, setSecondId] = useState(() => String(available[0]?.id ?? ""));
  const [photos, setPhotos] = useState({});
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const first = available.find(({ id }) => String(id) === firstId);
  const second = available.find(({ id }) => String(id) === secondId);

  const openReport = async () => {
    setReportBusy(true);
    setMessage("");
    try {
      const entries = await Promise.all([...new Set([firstId, secondId])].map(async (id) => [id, await apiRequest(`/v1/assessments/${id}/photos`)]));
      setPhotos(Object.fromEntries(entries));
      setReportOpen(true);
    } catch (error) { setMessage(`Não foi possível preparar as fotos para o PDF: ${error.message}`); }
    finally { setReportBusy(false); }
  };

  useEffect(() => {
    let active = true;
    if (!firstId || !secondId) return undefined;
    Promise.all([...new Set([firstId, secondId])].map(async (id) => [id, await apiRequest(`/v1/assessments/${id}/photos`)]))
      .then((entries) => { if (active) { setPhotos(Object.fromEntries(entries)); setMessage(""); } })
      .catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [firstId, secondId]);

  if (available.length < 2) return <section className={styles.comparison}><div><p className="eyebrow">Comparativo completo</p><h2>Comparar avaliações</h2></div><p className={styles.empty}>São necessárias duas avaliações finalizadas para realizar a comparação.</p></section>;

  const resultRows = Object.entries(resultFields).map(([key, metadata]) => ({ ...metadata, key, read: (assessment) => assessment?.results?.values?.[key] }));
  const options = available.map((assessment) => <option key={assessment.id} value={assessment.id}>{optionLabel(assessment)}</option>);
  const consentMissing = photos[firstId]?.photo_consent === false || photos[secondId]?.photo_consent === false;

  return <section className={styles.comparison}>
    <div><p className="eyebrow">Comparativo completo</p><h2>Comparar avaliações por data</h2><p>Compare todos os dados registrados, resultados calculados e fotos.</p></div>
    <div className={styles.selectors}><label>Primeira avaliação<select value={firstId} onChange={(event) => setFirstId(event.target.value)}>{options}</select></label><label>Segunda avaliação<select value={secondId} onChange={(event) => setSecondId(event.target.value)}>{options}</select></label></div>
    {first && second && <>
      {showPdf && <ReportButton disabled={reportBusy} onClick={openReport}>{reportBusy ? "Preparando fotos…" : "Gerar PDF do comparativo"}</ReportButton>}
      <div className={styles.legend}><strong>Dado</strong><span>{dateLabel(first.assessed_on)}</span><span>{dateLabel(second.assessed_on)}</span><em>Diferença</em></div>
      <section className={styles.group}><h3>Resultados calculados</h3><ComparisonRows fields={resultRows} first={first} second={second} /></section>
      {safeSchema.map((group) => <section className={styles.group} key={group.key}><h3>{group.label}</h3><ComparisonRows fields={(Array.isArray(group.fields) ? group.fields : []).filter((field) => !field.hidden).map((field) => ({ ...field, key: `${group.key}.${field.key}`, read: (assessment) => assessment?.inputs?.[group.key]?.[field.key] }))} first={first} second={second} /></section>)}
      <section className={styles.photos}><h3>Fotos das avaliações</h3>{message && <p role="alert">{message}</p>}{consentMissing && <p className={styles.empty}>As fotos ficam disponíveis somente enquanto a autorização específica estiver ativa.</p>}<div className={styles.photoGrid}>{Object.entries(positions).map(([position, label]) => {
        const before = photos[firstId]?.data?.find((photo) => photo.position === position), after = photos[secondId]?.data?.find((photo) => photo.position === position);
        return <article key={position}><h4>{label}</h4><div>{[[firstId, before, dateLabel(first.assessed_on)], [secondId, after, dateLabel(second.assessed_on)]].map(([assessmentId, photo, caption]) => <figure key={`${assessmentId}-${position}`}>{photo ? <img src={appPath(`api/v1/assessments/${assessmentId}/photos/${photo.id}?v=${photo.version}`)} alt={`${label}, avaliação de ${caption}`} loading="lazy" /> : <span>Sem foto</span>}<figcaption>{caption}</figcaption></figure>)}</div></article>;
      })}</div></section>
      {showPdf && reportOpen && <PrintableReport title={`comparativo-avaliacoes-${first.assessed_on}-${second.assessed_on}`} variant="assessment" onClose={() => setReportOpen(false)}><AssessmentComparisonReport student={student} first={first} second={second} schema={schema} photos={photos} /></PrintableReport>}
    </>}
  </section>;
}
