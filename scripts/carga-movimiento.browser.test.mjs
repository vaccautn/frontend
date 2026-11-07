// Flujos reales contra la demo local. No genera capturas.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.PREVIEW_WEB ?? "http://127.0.0.1:5176";
const api = process.env.PREVIEW_API ?? "http://127.0.0.1:8026/api";
const response = await fetch(`${api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "demo@vacca.test", password: "VaccaDemo2026!" }) });
const auth = await response.json();
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(auth => { localStorage.setItem("auth.accessToken", auth.access_token); localStorage.setItem("auth.user", JSON.stringify(auth.user)); }, auth);
  await page.goto(`${base}/rodeo/carga-tabla`, { waitUntil: "domcontentloaded" });
  const loteUno = page.getByLabel("Lote fila 1", { exact: true });
  await loteUno.locator("option[value='1']").waitFor({ state: "attached" });
  const numero = 8000 + Math.floor(Math.random() * 900);
  await page.getByLabel("Caravana fila 1", { exact: true }).fill(`AB123${numero}`);
  await loteUno.selectOption("1");
  await page.getByRole("button", { name: /Agregar fila/ }).click();
  await page.getByLabel("Caravana fila 2", { exact: true }).fill(`AB123${numero+1}`);
  await page.getByLabel("Lote fila 2", { exact: true }).selectOption("2");
  const guardado = page.waitForResponse(r => r.url().endsWith("/animales/carga-tabla") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar tanda de 2 animales" }).click();
  assert.equal((await guardado).status(), 201);
  await page.waitForURL("**/actividad");
  await page.getByRole("heading", { name: "Historial de actividad" }).waitFor();
  await page.goto(`${base}/rodeo`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: `Seleccionar AB123${numero}`, exact: true }).check();
  await page.getByRole("checkbox", { name: `Seleccionar AB123${numero+1}`, exact: true }).check();
  await page.getByRole("alert").filter({ hasText: "distintos lotes" }).waitFor();
  await page.getByRole("combobox", { name: /Mover al lote/ }).selectOption("1");
  let advertido = false;
  page.once("dialog", async dialog => { advertido = dialog.message().includes("distintos lotes"); await dialog.accept(); });
  const movido = page.waitForResponse(r => r.url().endsWith("/animales/mover") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Mover animales", exact: true }).click();
  assert.equal((await movido).status(), 200);
  assert.equal(advertido, true);
  console.log(JSON.stringify({ cargaTabla: "ok", historial: "ok", advertenciaVariosLotes: "ok", movimiento: "ok", capturas: false }));
} finally { await browser.close(); }
