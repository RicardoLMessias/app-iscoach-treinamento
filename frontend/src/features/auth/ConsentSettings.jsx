import { useEffect, useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ConsentSettings.module.css";

const confirmationLabels = {
  terms: "Li e concordo com os Termos de Uso.",
  privacy: "Li e estou ciente do Aviso de Privacidade.",
  health_data: "Li e forneço consentimento específico para o tratamento dos meus dados de saúde.",
  assessment_photos: "Li e autorizo, opcionalmente, o uso privado das fotos para minha avaliação.",
};

export default function ConsentSettings({ onContinue }) {
  const [documents,setDocuments] = useState([]);
  const [checked,setChecked] = useState({});
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const load = async () => { const response = await apiRequest("/v1/consents");setDocuments(response.data); };
  useEffect(() => {
    let active = true;
    apiRequest("/v1/consents").then((response) => { if(active) setDocuments(response.data); }).catch((error) => { if(active) setMessage(error.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[]);
  async function change(document,revoke = false) {
    if(revoke && !window.confirm(document.type === "assessment_photos" ? "Revogar a autorização de fotos? Os envios e a visualização serão bloqueados. Os arquivos anteriores não serão excluídos automaticamente." : "Revogar o consentimento de saúde? Os módulos dependentes ficarão bloqueados. Os registros anteriores não serão excluídos automaticamente.")) return;
    setBusy(true);setMessage("");
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/consents/"+document.id+"/accept",{method:revoke ? "DELETE" : "POST",...(revoke ? {} : {body:JSON.stringify({accepted:true})})});
      await load();setChecked((current) => ({...current,[document.id]:false}));setMessage(response.message);
      if(revoke && document.is_required) window.location.reload();
    } catch(error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <section className={styles.settings}><h2>Termos e autorizações</h2>
    <p>Leia cada documento. Somente você pode registrar o aceite. A autorização de fotos é opcional e não inclui divulgação pública.</p>
    {loading && <p>Carregando documentos…</p>}
    {!loading && !documents.length && <p>Nenhum documento está disponível. Entre em contato com o professor.</p>}
    {documents.map((document) => <article className={styles.document} key={document.id}><h3>{document.title}</h3><small>Versão {document.version} · {document.is_required ? "Necessário para acessar os módulos" : "Opcional"}</small>
      <details><summary>Ler documento completo</summary><p className={styles.text}>{document.content}</p></details>
      {document.accepted ? <><p>Aceito em {new Date(document.accepted_at).toLocaleString("pt-BR")}</p>{["assessment_photos","health_data"].includes(document.type) && <button disabled={busy} onClick={() => change(document,true)}>Revogar autorização</button>}</> :
      <><label className={styles.check}><input type="checkbox" disabled={busy} checked={Boolean(checked[document.id])} onChange={(event) => setChecked({...checked,[document.id]:event.target.checked})} />{confirmationLabels[document.type] ?? "Li e aceito esta versão do documento."}</label><button disabled={busy || !checked[document.id]} onClick={() => change(document)}>Confirmar aceite</button></>}
    </article>)}
    {message && <p role="status">{message}</p>}
    {onContinue && <button disabled={busy || loading || !documents.length || documents.some((document) => document.is_required && !document.accepted)} onClick={onContinue}>Continuar para o aplicativo</button>}
    <p>Dúvidas, exclusão de dados ou encerramento da conta: <a href="mailto:contato.igorpersonal@gmail.com">contato.igorpersonal@gmail.com</a>.</p>
  </section>;
}
