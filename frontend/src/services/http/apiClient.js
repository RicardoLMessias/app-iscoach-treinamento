const DEFAULT_HEADERS = { Accept: "application/json", "Content-Type": "application/json", "X-IS-Coach-SPA": "1" };
const BASE_PATH = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function appPath(path = "") {
  return `${BASE_PATH}${String(path).replace(/^\/+/, "")}`;
}

function csrfToken() {
  const cookie = document.cookie.split("; ").find((item) => item.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

export async function initializeCsrf() {
  const response = await fetch(appPath("sanctum/csrf-cookie"), { credentials: "include", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Não foi possível iniciar a sessão segura. Atualize a página e tente novamente.");
}

export async function apiRequest(path, options = {}) {
  const headers = { ...DEFAULT_HEADERS, ...(csrfToken() ? { "X-XSRF-TOKEN": csrfToken() } : {}), ...options.headers };
  if (options.body instanceof FormData) delete headers["Content-Type"];
  const response = await fetch(appPath(`api${path}`), {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json") ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const error = new Error(data?.message ?? data?.error?.message ?? "Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }
  if (data === null) throw new Error("O servidor retornou uma resposta inesperada. Atualize a página e tente novamente.");
  return data;
}
