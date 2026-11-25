import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Send, X } from "lucide-react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./ProfessorInvitations.module.css";

const filters = [["all", "Todos"], ["pending", "Pendentes"], ["accepted", "Aceitos"], ["expired", "Expirados"], ["cancelled", "Cancelados"]];
const statusLabels = { pending: "Pendente", accepted: "Aceito", expired: "Expirado", cancelled: "Cancelado" };
const dateTime = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default function ProfessorInvitations({ onMessage, onNew, onChange }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [invitations, setInvitations] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [busy, setBusy] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [newLink, setNewLink] = useState("");

  const load = async (nextPage = page, nextFilter = filter) => {
    setBusy(true);
    try {
      const status = nextFilter === "all" ? "" : `&status=${nextFilter}`;
      const response = await apiRequest(`/v1/professor/invitations?page=${nextPage}${status}`);
      setInvitations(response.data);
      setPagination(response.meta);
    } catch (error) { onMessage(error.message); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    apiRequest("/v1/professor/invitations?page=1")
      .then((response) => { setInvitations(response.data); setPagination(response.meta); })
      .catch((error) => onMessage(error.message))
      .finally(() => setBusy(false));
  }, [onMessage]);

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter); setPage(1); load(1, nextFilter);
  };

  const changePage = (nextPage) => {
    setPage(nextPage); load(nextPage, filter);
  };

  const cancel = async (invitation) => {
    if (!window.confirm(`Cancelar o convite para ${invitation.email}? O link atual deixará de funcionar.`)) return;
    setActingOn(invitation.id);
    try {
      await initializeCsrf();
      await apiRequest(`/v1/professor/invitations/${invitation.id}`, { method: "DELETE" });
      onMessage("Convite cancelado. O link anterior não funciona mais.");
      await load(page, filter); await onChange();
    } catch (error) { onMessage(error.message); }
    finally { setActingOn(null); }
  };

  const resend = async (invitation) => {
    if (!window.confirm(`Enviar um novo convite para ${invitation.email}, válido por 1 dia? O link anterior será invalidado.`)) return;
    setActingOn(invitation.id);
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/professor/invitations", { method: "POST", body: JSON.stringify({ name: invitation.name, email: invitation.email, expires_in_days: 1 }) });
      setNewLink(response.data.invitation_url);
      onMessage("Novo convite enviado por e-mail. Copie o novo link se necessário.");
      setPage(1); await load(1, filter); await onChange();
    } catch (error) { onMessage(error.message); }
    finally { setActingOn(null); }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(newLink);
      onMessage("Novo link copiado.");
    } catch { onMessage("Não foi possível copiar automaticamente. Selecione o link para copiá-lo."); }
  };

  return <section className={styles.panel}>
    <div className={styles.heading}><div><h2>Convites enviados</h2><p>Consulte o andamento dos convites e gerencie os links de acesso.</p></div><button type="button" onClick={onNew}><Send size={16} /> Novo convite</button></div>
    <div className={styles.filters} aria-label="Filtrar convites">{filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => changeFilter(value)}>{label}</button>)}</div>
    {newLink && <div className={styles.link}><strong>Novo link gerado</strong><div><input readOnly value={newLink} aria-label="Novo link do convite" onFocus={(event) => event.target.select()} /><button type="button" onClick={copyLink}><Copy size={16} /> Copiar</button><button type="button" aria-label="Ocultar link" onClick={() => setNewLink("")}><X size={16} /></button></div><small>Este link é exibido somente agora; os links anteriores não podem ser recuperados.</small></div>}
    {busy && <p className={styles.note}>Carregando convites…</p>}
    {!busy && invitations.length === 0 && <p className={styles.empty}>Nenhum convite encontrado.</p>}
    {!busy && <div className={styles.list}>{invitations.map((invitation) => <article key={invitation.id} className={styles.card}>
      <div className={styles.identity}><strong>{invitation.name}</strong><span>{invitation.email}</span></div><span className={styles.status} data-status={invitation.status}>{statusLabels[invitation.status]}</span>
      <div className={styles.dates}><span>Enviado: {dateTime(invitation.created_at)}</span><span>Validade: {dateTime(invitation.expires_at)}</span>{invitation.accepted_at && <span>Aceito: {dateTime(invitation.accepted_at)}</span>}{invitation.cancelled_at && <span>Cancelado: {dateTime(invitation.cancelled_at)}</span>}</div>
      {invitation.status !== "accepted" && <div className={styles.actions}><button type="button" disabled={actingOn !== null} onClick={() => resend(invitation)}><Send size={15} /> Reenviar novo link</button>{invitation.status === "pending" && <button type="button" disabled={actingOn !== null} onClick={() => cancel(invitation)}><X size={15} /> Cancelar convite</button>}</div>}
    </article>)}</div>}
    {pagination.last_page > 1 && <div className={styles.pagination}><button type="button" disabled={busy || page <= 1} onClick={() => changePage(page - 1)}><ChevronLeft size={16} /> Anterior</button><span>Página {pagination.current_page} de {pagination.last_page}</span><button type="button" disabled={busy || page >= pagination.last_page} onClick={() => changePage(page + 1)}>Próxima <ChevronRight size={16} /></button></div>}
  </section>;
}
