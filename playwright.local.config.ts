import { defineConfig, devices } from "@playwright/test";

// Usa exclusivamente scripts/preview_local.py y el build de demo en 5180.
// No prepara ni borra bases y no toma capturas, videos ni trazas.
process.env.E2E_API_BASE_URL = "http://127.0.0.1:8026/api";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "importacion-animales.spec.ts",
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5180",
    locale: "es-AR",
    channel: "chrome",
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" } },
  ],
});
