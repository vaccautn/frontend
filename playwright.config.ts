import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/** E2E contra el stack real: Postgres (docker-compose del backend), el backend
 * con una base propia (vacca_e2e, se recrea en cada corrida) y Vite apuntando
 * a ese backend. Ver frontend/e2e/README.md. */

const BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../backend");
const PUERTO_API = 8010;
const PUERTO_WEB = 5174;

function pythonDelBackend(): string {
  if (process.env.E2E_PYTHON) return process.env.E2E_PYTHON;
  const candidatos = [
    path.join(BACKEND, ".venv", "Scripts", "python.exe"),
    path.join(BACKEND, ".venv", "bin", "python"),
  ];
  return candidatos.find((candidato) => existsSync(candidato)) ?? "python";
}

const python = `"${pythonDelBackend()}"`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    locale: "es-AR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `${python} scripts/e2e_preparar_base.py && ${python} -m uvicorn app.main:app --port ${PUERTO_API}`,
      cwd: BACKEND,
      url: `http://127.0.0.1:${PUERTO_API}/health`,
      // Explícitos para no depender del .env local del backend.
      env: {
        POSTGRES_DB: "vacca_e2e",
        CORS_ALLOWED_ORIGINS: `http://localhost:${PUERTO_WEB}`,
        ALLOWED_HOSTS: "localhost,127.0.0.1",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `pnpm exec vite --port ${PUERTO_WEB} --strictPort`,
      url: `http://localhost:${PUERTO_WEB}`,
      env: { VITE_API_BASE_URL: `http://127.0.0.1:${PUERTO_API}/api` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
