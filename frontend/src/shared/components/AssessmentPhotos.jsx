import { useEffect, useRef, useState } from "react";
import { apiRequest, appPath, initializeCsrf } from "../../services/http/apiClient.js";
import { compressAssessmentPhoto } from "../compressAssessmentPhoto.js";
import styles from "../../pages/ProfessorDashboard/PhysicalAssessments.module.css";

const positions = { front:"Frontal", right:"Lateral direita", left:"Lateral esquerda", back:"Posterior" };
export default function AssessmentPhotos({ assessmentId, canEdit = false, basePath }) {
  const [open,setOpen] = useState(false);
  return <details className={styles.group} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Fotos da avaliação</summary>
    {open && <PhotoPanel key={assessmentId} assessmentId={assessmentId} canEdit={canEdit} basePath={basePath} />}
  </details>;
}
function PhotoPanel({ assessmentId,canEdit,basePath }) {
  const [data,setData] = useState(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [pending,setPending] = useState(null);
  const preview = useRef(null);
  const active = useRef(true);
  const base = basePath ?? `/v1/assessments/${assessmentId}/photos`;
  useEffect(() => {
    active.current = true;
    apiRequest(base).then((response) => { if(active.current) setData(response); }).catch((error) => { if(active.current) setMessage(error.message); });
    return () => { active.current = false; if(preview.current) URL.revokeObjectURL(preview.current); };
  },[base]);
  function clearPreview() {
    if(preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null; setPending(null);
  }
  async function choose(event,position) {
    const file = event.target.files?.[0]; event.target.value = "";
    if(!file) return;
    clearPreview(); setBusy(true); setMessage("Otimizando a foto neste dispositivo…");
    try {
      const result = await compressAssessmentPhoto(file);
      if(!active.current) return;
      preview.current = URL.createObjectURL(result.blob);
      setPending({...result,position,url:preview.current}); setMessage("");
    } catch(error) { if(active.current) setMessage(error.message); } finally { if(active.current) setBusy(false); }
  }
  async function save() {
    setBusy(true);setMessage("");
    try {
      await initializeCsrf();
      const body = new FormData(); body.append("position",pending.position); body.append("photo",pending.blob,"avaliacao.jpg");
      await apiRequest(base,{method:"POST",body});
      const response = await apiRequest(base);
      if(active.current) { setData(response);clearPreview();setMessage("Foto otimizada salva. O original não foi enviado."); }
    } catch(error) { if(active.current) setMessage(error.message); } finally { if(active.current) setBusy(false); }
  }
  async function remove(photo) {
    if(!window.confirm("Excluir definitivamente esta foto? Não será possível recuperá-la pelo aplicativo.")) return;
    setBusy(true);
    try {
      await initializeCsrf();
      await apiRequest(base+"/"+photo.id,{method:"DELETE"});
      if(active.current) { setData((current) => ({...current,data:current.data.filter((item) => item.id !== photo.id)}));setMessage("Foto excluída."); }
    } catch(error) { if(active.current) setMessage(error.message); } finally { if(active.current) setBusy(false); }
  }
  return <section className={styles.photoPanel}>
    {!data && !message && <p>Carregando fotos…</p>}
    {data && !data.photo_consent && <p>O aluno ainda não aceitou a autorização específica para fotos. As imagens não estão disponíveis.</p>}
    {canEdit && data?.photo_consent && !data.processing_available && <p>O servidor precisa da extensão PHP GD para receber fotos. A visualização permanece disponível.</p>}
    {data?.photo_consent && <><p className={styles.notice}>{canEdit ? "JPG até 16 MB no dispositivo. Enviamos apenas a versão otimizada, até 1.600 px. Confira a prévia antes de salvar; substituir remove a foto anterior." : "Fotos privadas da sua avaliação."}</p>
      <div className={styles.photoGrid}>{Object.entries(positions).map(([position,label]) => {
        const photo = data.data.find((item) => item.position === position);
        return <section key={position}><h4>{label}</h4>{photo ? <><img src={appPath("api"+base+"/"+photo.id+"?v="+photo.version)} alt={label+" da avaliação"} loading="lazy" /><small>{Math.ceil(photo.bytes/1024)} KB</small></> : <p>Sem foto</p>}
          {canEdit && <><label>{photo ? "Substituir foto" : "Adicionar foto"}<input disabled={busy || !data.processing_available} type="file" accept="image/jpeg,.jpg,.jpeg" onChange={(event) => choose(event,position)} /></label>{photo && <button type="button" disabled={busy} onClick={() => remove(photo)}>Excluir foto</button>}</>}
        </section>;
      })}</div>
    </>}
    {pending && <section className={styles.card}><h4>Conferir foto — {positions[pending.position]}</h4><img className={styles.photoPreview} src={pending.url} alt="Prévia da foto otimizada" /><p>{(pending.originalBytes/1024/1024).toFixed(1)} MB → {Math.ceil(pending.blob.size/1024)} KB</p><div className={styles.actions}><button disabled={busy} type="button" onClick={save}>Confirmar e enviar</button><button disabled={busy} type="button" onClick={clearPreview}>Cancelar</button></div></section>}
    {message && <p role="status">{message}</p>}
  </section>;
}
