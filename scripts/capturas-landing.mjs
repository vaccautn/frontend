// Capturas reales y reproducibles de la demo local; nunca usa cuentas productivas.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PREVIEW_WEB ?? "http://127.0.0.1:5180";
const api = "http://127.0.0.1:8026/api";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const carpeta = new URL("../public/landing/", import.meta.url);
await mkdir(carpeta, { recursive: true });
const response = await fetch(`${api}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "demo@vacca.test",
    password: "VaccaDemo2026!",
  }),
});
assert.equal(
  response.status,
  200,
  "Iniciá scripts/preview_local.py del backend",
);
const auth = await response.json();
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const capturas = [];
const fallos = [];
try {
  for (const viewport of [
    { width: 1440, height: 960 },
    { width: 390, height: 844 },
  ]) {
    const mobile = viewport.width < 500;
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      locale: "es-AR",
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: "reduce",
    });
    await context.addInitScript((a) => {
      localStorage.setItem("auth.accessToken", a.access_token);
      localStorage.setItem("auth.user", JSON.stringify(a.user));
      localStorage.setItem("auth.tokenType", "Bearer");
    }, auth);
    const page = await context.newPage();
    page.on("pageerror", (error) => fallos.push(error.message));
    page.on("response", (response) => {
      if (response.url().startsWith(api) && response.status() >= 400)
        fallos.push(`${response.status()} ${response.url()}`);
    });
    const vistas = mobile
      ? [
          ["inicio-movil", "/inicio"],
          ["animal-movil", "/rodeo/1"],
        ]
      : [
          ["inicio", "/inicio"],
          ["rodeo", "/rodeo"],
          ["mapa", "/rodeo"],
          ["animal", "/rodeo/1"],
          ["sesiones", "/sesiones"],
          ["sesion", "/sesiones/1"],
          ["servicios", "/servicios"],
          ["servicio", "/servicios/1"],
          ["importacion", "/rodeo/importar"],
          ["carga-tabla", "/rodeo/carga-tabla"],
          ["historial", "/actividad"],
          ["campo", "/campo"],
        ];
    for (const [nombre, ruta] of vistas) {
      await page.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () =>
          document.body.innerText.length > 100 &&
          !document.body.innerText.includes("Cargando pantalla"),
      );
      if (nombre === "mapa") {
        await page
          .getByRole("button", { name: "Abrir mapa", exact: true })
          .click();
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(650);
      const texto = await page.locator("body").innerText();
      assert.ok(
        !/No se pudo cargar|No se pudieron cargar|Cargando pantalla/.test(
          texto,
        ),
        `Vista incompleta: ${nombre}`,
      );
      await page.screenshot({
        path: new URL(`${nombre}.jpg`, carpeta).pathname.replace(
          /^\/([A-Za-z]:)/,
          "$1",
        ),
        type: "jpeg",
        quality: 87,
        animations: "disabled",
      });
      capturas.push({
        archivo: `${nombre}.jpg`,
        ruta,
        viewport,
        origen: "Aplicación local con datos de demostración",
      });
      console.log(`Captura ${nombre}`);
    }
    await context.close();
  }
  assert.deepEqual(fallos, []);
  await writeFile(
    new URL("capturas.json", carpeta),
    JSON.stringify(
      {
        generadas: new Date().toISOString(),
        datos: "Demo local, no productivos",
        capturas,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
