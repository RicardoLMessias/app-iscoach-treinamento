import { ArrowLeft, Bell } from "lucide-react";
import { appPath } from "../../../services/http/apiClient.js";
import styles from "./ScreenHeader.module.css";

export default function ScreenHeader({ title, subtitle, back, onBack }) {
  return (
    <header className={styles.header}>
      {back ? <button className="icon-button" aria-label="Voltar" onClick={onBack}><ArrowLeft size={19} /></button> : (
        <div className={styles.brand}><img src={appPath("images/igor-santos-logo.webp")} alt="" /><span><strong>Igor Santos</strong><small>IS Coach Treinamento</small></span></div>
      )}
      {title && <div className={styles.title}><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>}
      <button className="icon-button" aria-label="Notificações"><Bell size={18} /></button>
    </header>
  );
}
