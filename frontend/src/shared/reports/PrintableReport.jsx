import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Printer, X } from "lucide-react";
import styles from "./PrintableReport.module.css";

export function ReportButton({ onClick, children = "Gerar PDF", disabled = false }) {
  return <button type="button" className={styles.trigger} disabled={disabled} onClick={onClick}><FileDown size={16} /> {children}</button>;
}

export default function PrintableReport({ title, children, onClose, variant = "default" }) {
  const sheetRef = useRef(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [imageError, setImageError] = useState("");
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const images = [...(sheetRef.current?.querySelectorAll("img[data-report-photo]") ?? [])];
    const waitForImage = (image) => new Promise((resolve, reject) => {
      if (image.complete) { if (image.naturalWidth > 0) resolve(); else reject(); return; }
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(); };
      const cleanup = () => { image.removeEventListener("load", loaded); image.removeEventListener("error", failed); };
      image.addEventListener("load", loaded, { once: true });
      image.addEventListener("error", failed, { once: true });
    });
    Promise.all(images.map(waitForImage))
      .then(() => { if (active) setImagesReady(true); })
      .catch(() => { if (active) setImageError("Uma ou mais fotos não carregaram. Confira as fotos e abra o PDF novamente."); });
    return () => { active = false; };
  }, []);

  const print = () => {
    if (!imagesReady || imageError) return;
    const previousTitle = document.title;
    const cleanup = () => {
      document.body.classList.remove("report-printing");
      document.title = previousTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    document.title = title;
    document.body.classList.add("report-printing");
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return createPortal(<div className={styles.portal} role="dialog" aria-modal="true" aria-label={`Prévia de ${title}`}>
    <div className={styles.toolbar}>
      <div><strong>Prévia do documento</strong><span>{imageError || (imagesReady ? "Na impressão, escolha “Salvar como PDF”." : "Carregando fotos para impressão…")}</span></div>
      <button type="button" onClick={print} disabled={!imagesReady || Boolean(imageError)}><Printer size={17} /> Imprimir / salvar PDF</button>
      <button type="button" onClick={onClose}><X size={17} /> Fechar</button>
    </div>
    <main ref={sheetRef} className={`${styles.sheet} ${variant === "assessment" ? styles.assessmentSheet : ""}`}>{children}</main>
  </div>, document.body);
}

export function ReportHeader({ title, subtitle }) {
  return <header className={styles.header}>
    <img
      className={styles.logo}
      src="/images/igor-santos-logo.webp"
      alt="Logo IS Coach"
    />
    <div><strong>IS Coach</strong><span>Treinamento</span></div>
    <section><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</section>
  </header>;
}

export function ReportInfo({ items }) {
  return <dl className={styles.info}>{items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "").map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

export function ReportSection({ title, children, className = "" }) {
  return <section className={`${styles.section} ${className}`}><h2>{title}</h2>{children}</section>;
}

export function ReportTable({ columns, rows, compact = false }) {
  return <div className={styles.tableWrap}><table className={compact ? styles.compact : ""}>
    <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.key ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? "—"}</td>)}</tr>)}</tbody>
  </table></div>;
}
