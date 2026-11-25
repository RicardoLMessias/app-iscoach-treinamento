import { useEffect, useState } from "react";

function fieldName(field) {
  const label = field.closest("label") ?? (field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null);
  const text = label && [...label.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent.trim()).filter(Boolean).join(" ");
  return field.getAttribute("aria-label") || text || field.getAttribute("placeholder") || "o campo destacado";
}

export default function FormValidationFeedback() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onInvalid(event) {
      const field = event.target;
      const form = field.form;
      if (!form) return;
      form.dataset.validationAttempted = "true";
      field.setAttribute("aria-invalid", "true");
      if (form.querySelector(":invalid") !== field) return;
      const reason = field.type === "checkbox" ? "Selecione" : field.validity.valueMissing ? "Preencha" : "Confira";
      setMessage(`${reason} ${fieldName(field)} antes de continuar.`);
    }

    function onEdit(event) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      const form = field.form;
      if (!form?.dataset.validationAttempted) return;
      if (field.validity.valid && (!field.dataset.assessmentField || field.value.trim())) field.removeAttribute("aria-invalid");
      if (!form.querySelector(":invalid") && !form.querySelector('[aria-invalid="true"]')) {
        delete form.dataset.validationAttempted;
        setMessage("");
      }
    }

    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 7000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return message && <div className="form-validation-feedback" role="alert">{message}</div>;
}
