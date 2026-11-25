import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import AppErrorBoundary from "./app/AppErrorBoundary.jsx";
import AboutPage from "./pages/AboutPage/AboutPage.jsx";
import InstallAppPrompt from "./pages/AboutPage/InstallAppPrompt.jsx";
import FormValidationFeedback from "./app/FormValidationFeedback.jsx";
import "./styles/index.css";

const installPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has("install-preview");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>{installPreview ? <><AboutPage role="student" /><InstallAppPrompt userId="preview" preview /></> : <App />}{!installPreview && <FormValidationFeedback />}</AppErrorBoundary>
  </StrictMode>,
);
