import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cwd } from "node:process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  const configuredBase = env.VITE_BASE_PATH || "/";
  const base = `/${configuredBase.replace(/^\/+|\/+$/g, "")}${configuredBase === "/" ? "" : "/"}`;

  return {
    base,
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false,
        },
        "/sanctum": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false,
        },
      },
    },
    build: {
      sourcemap: false,
    },
  };
});
