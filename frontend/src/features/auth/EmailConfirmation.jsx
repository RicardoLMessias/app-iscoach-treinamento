import { useState } from "react";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import styles from "./AuthGate.module.css";

export default function EmailConfirmation() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await initializeCsrf();
      const token = new URLSearchParams(window.location.search).get("token");
      const response = await apiRequest("/v1/auth/confirm-email", { method: "POST", body: JSON.stringify({ token }) });
      setMessage(response.message);
      setDone(true);
      window.history.replaceState({}, "", "/confirmar-email");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <main className={styles.center}><section className={styles.card}><h1>Confirmar novo e-mail</h1><p>Confirme para atualizar seu endereço de acesso.</p>{message && <p role="status">{message}</p>}{!done && <button className="primary-button" disabled={busy} onClick={confirm}>{busy ? "Confirmando…" : "Confirmar alteração"}</button>}<a href="/">Voltar ao login</a></section></main>;
}
