import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import InstallGuide from "./InstallGuide.jsx";
import { isStandaloneApp, mobilePlatform, shouldShowInstallPrompt } from "./installApp.js";
import styles from "./InstallAppPrompt.module.css";

const dismissalDays = 14;
const storageKey = (userId) => `is-coach:install-hint:${userId}`;

function readPreference(userId) {
  try { return JSON.parse(window.localStorage.getItem(storageKey(userId)) || "{}"); }
  catch { return {}; }
}

function savePreference(userId, preference) {
  try { window.localStorage.setItem(storageKey(userId), JSON.stringify(preference)); }
  catch { /* Browsers with blocked storage still allow the current visit to continue. */ }
}

export default function InstallAppPrompt({ userId, preview = false }) {
  const [visible, setVisible] = useState(preview);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (preview) return undefined;
    const platform = mobilePlatform(navigator.userAgent, navigator.maxTouchPoints);
    const standalone = isStandaloneApp(window.matchMedia("(display-mode: standalone)").matches, navigator.standalone);
    const preference = readPreference(userId);
    if (!shouldShowInstallPrompt({ platform, standalone, installed: preference.installed, dismissedUntil: preference.dismissedUntil, now: Date.now() })) return undefined;
    const timeout = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [preview, userId]);

  const close = (installed = false) => {
    savePreference(userId, installed ? { installed: true } : { dismissedUntil: Date.now() + dismissalDays * 86400000 });
    setVisible(false);
  };

  if (!visible) return null;

  return <section className={styles.prompt} role="dialog" aria-modal="false" aria-labelledby="install-prompt-title">
    <button type="button" className={styles.close} aria-label="Fechar aviso de instalação" onClick={() => close()}><X size={18} /></button>
    <div className={styles.heading}><Download size={19} aria-hidden="true" /><h2 id="install-prompt-title">IS Coach na tela inicial</h2></div>
    <p>Acesse seus treinos pelo ícone no celular. São poucos passos.</p>
    {showGuide && <InstallGuide compact />}
    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={() => setShowGuide((current) => !current)}>{showGuide ? "Ocultar passos" : "Ver como adicionar"}</button>
      <button type="button" onClick={() => close(true)}>Já adicionei</button>
      <button type="button" onClick={() => close()}>Agora não</button>
    </div>
    <small>Você também encontra esse guia em Sobre o app.</small>
  </section>;
}
