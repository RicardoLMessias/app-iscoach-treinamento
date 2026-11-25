import { useEffect, useRef, useState } from "react";
import { AssessmentForm } from "./ProfessorAssessmentManager.jsx";
import { AssessmentReport } from "../../shared/reports/ReportDocuments.jsx";
import PrintableReport, { ReportButton } from "../../shared/reports/PrintableReport.jsx";
import styles from "./PhysicalAssessments.module.css";

const initialPerson = { name: "", birth_date: "", sex: "", email: "" };
const photoPositions = { front: "Frontal", right: "Lateral direita", left: "Lateral esquerda", back: "Posterior" };

export default function ProfessorExternalAssessmentManager({ schema }) {
  const [person, setPerson] = useState(initialPerson);
  const [assessment, setAssessment] = useState(null);
  const [photos, setPhotos] = useState({});
  const [authorization, setAuthorization] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const photoUrls = useRef({});
  const isMinor = person.birth_date && new Date(person.birth_date) > new Date(new Date().setFullYear(new Date().getFullYear() - 18));

  useEffect(() => () => Object.values(photoUrls.current).forEach((url) => URL.revokeObjectURL(url)), []);

  function clearPhotos() {
    Object.values(photoUrls.current).forEach((url) => URL.revokeObjectURL(url));
    photoUrls.current = {};
    setPhotos({});
  }

  function updatePerson(key, value) {
    setPerson((current) => ({ ...current, [key]: value }));
    setAssessment(null);
  }

  function selectPhoto(position, file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setMessage("Use uma imagem JPG, PNG ou WebP de até 10 MB.");
      return;
    }
    if (photoUrls.current[position]) URL.revokeObjectURL(photoUrls.current[position]);
    photoUrls.current[position] = URL.createObjectURL(file);
    setPhotos({ ...photoUrls.current });
    setMessage("");
  }

  function reset() {
    setReportOpen(false);
    setAssessment(null);
    clearPhotos();
    setPerson(initialPerson);
    setAuthorization(false);
    setMessage("");
    setFormVersion((version) => version + 1);
  }

  const reportPerson = { external: true, name: person.name, email: person.email, profile: { birth_date: person.birth_date, sex: person.sex } };
  return <section className={styles.manager} aria-labelledby="external-assessments-title">
    <div className={styles.card}>
      <h2 id="external-assessments-title">Avaliação avulsa</h2>
      <p className={styles.notice}>Preencha os dados e salve o PDF durante o atendimento. Esta avaliação e suas fotos não são cadastradas no sistema. Ao sair ou atualizar a página, os dados serão perdidos.</p>
    </div>
    <div className={styles.card}>
      <h3>Pessoa avaliada</h3>
      <div className={styles.fields}>
        <label>Nome completo<input required minLength={2} maxLength={160} value={person.name} onChange={(event) => updatePerson("name", event.target.value)} /></label>
        <label>Data de nascimento<input type="date" max={new Date().toLocaleDateString("en-CA")} value={person.birth_date} onChange={(event) => updatePerson("birth_date", event.target.value)} /></label>
        <label>Sexo para os cálculos de dobras<select value={person.sex} onChange={(event) => updatePerson("sex", event.target.value)}><option value="">Não informado</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option><option value="prefiro_nao_informar">Prefiro não informar</option></select></label>
        <label>E-mail opcional<input type="email" value={person.email} onChange={(event) => updatePerson("email", event.target.value)} /></label>
      </div>
    </div>
    {schema.length > 0 && <AssessmentForm key={formVersion} initial={{}} schema={schema} previewPerson={person} onSaved={setAssessment} onCancel={reset} />}
    <div className={styles.card}>
      <h3>Fotos opcionais para o PDF</h3>
      <p className={styles.notice}>Peça autorização verbal antes de selecionar as fotos. Elas ficam apenas na memória deste navegador e são usadas somente na prévia do PDF.</p>
      <label className={styles.verbalConsent}><input type="checkbox" checked={authorization} onChange={(event) => { setAuthorization(event.target.checked); if (!event.target.checked) clearPhotos(); }} /> Confirmo que expliquei o uso privado das fotos e recebi autorização verbal {isMinor ? "do responsável" : "da pessoa avaliada"}.</label>
      {authorization && <div className={styles.photoGrid}>{Object.entries(photoPositions).map(([position, label]) => <section key={position}>
        <label>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectPhoto(position, event.target.files?.[0])} /></label>
        {photos[position] && <img src={photos[position]} alt={`Prévia ${label.toLowerCase()}`} />}
      </section>)}</div>}
    </div>
    {message && <p role="alert">{message}</p>}
    {assessment && <div className={styles.card}>
      <h3>PDF pronto</h3>
      <p className={styles.notice}>Confira os dados e use “Imprimir / salvar PDF”. Guarde uma cópia, pois esta avaliação não ficará disponível depois.</p>
      <div className={styles.actions}><ReportButton onClick={() => setReportOpen(true)} /><button type="button" onClick={reset}>Limpar avaliação</button></div>
    </div>}
    {reportOpen && assessment && <PrintableReport title={`avaliacao-${person.name}-${assessment.assessed_on}`} variant="assessment" onClose={() => setReportOpen(false)}>
      <AssessmentReport student={reportPerson} assessment={assessment} schema={schema} localPhotos={authorization ? photos : undefined} />
    </PrintableReport>}
  </section>;
}
