import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";

// Use the existing browser installation; never download a browser or contact a real API.
if (!process.env.PLAYWRIGHT_MODULE_PATH) throw new Error("PLAYWRIGHT_MODULE_PATH is required");
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
const origin = "http://127.0.0.1:4189";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4189", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
after(() => server.kill());
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Preview startup timed out")), 15000);
  server.once("error", reject);
  server.once("exit", (code) => reject(new Error(`Preview exited: ${code}`)));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  server.stdout.on("data", (chunk) => {
    if (chunk.toString().includes("4189")) { clearTimeout(timeout); resolve(); }
  });
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
after(() => browser.close());
const now = "2026-11-01T12:00:00";
const user = { id: 909, nombre: "Prueba", apellido: "Local", email: "image-test@example.invalid", rol: "PRODUCTOR" };
const token = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.fixture`;
const animal = { id: 51, caravana: "IMAGE-01", sexo: "HEMBRA", categoria: "VACA_SECA", raza: "Angus", estado: "ACTIVO", lote_id: 1, origen: "COMPRA", observacion: "", creado_en: now, actualizado_en: now };
const lot = { id: 1, nombre: "Prueba", categoria: "VACA_SECA", usuario_administrador_id: user.id, activo: true, creado_en: now, actualizado_en: now };

for (const scenario of ["inferred", "pending", "manual", "low", "negative", "validation", "storage", "network"]) {
  test(`rendered image upload: ${scenario}`, { timeout: 30000 }, async (t) => {
    const context = await browser.newContext();
    t.after(() => context.close());
    const evaluation = { id: 70, sesion_id: 7, animal_id: animal.id, animal_rfid: animal.caravana, usuario_id: user.id, fecha: now, valor_cc: scenario === "manual" ? 3 : null, orden_entrada: 1, escala_min: 1, escala_max: 5, observaciones: "", estado: scenario === "manual" ? "CONFIRMADA" : "BORRADOR", creado_en: now, actualizado_en: now };
    const images = [];
    const unexpected = [];
    let uploads = 0;
    await context.addInitScript(({ token, user }) => {
      localStorage.setItem("auth.accessToken", token);
      localStorage.setItem("auth.tokenType", "Bearer");
      localStorage.setItem("auth.user", JSON.stringify(user));
    }, { token, user });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/")) {
        return url.origin === origin ? route.continue() : route.abort();
      }
      const path = url.pathname.replace(/^\/api/, "");
      const headers = { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,OPTIONS", "content-type": "application/json" };
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      let body;
      let status = 200;
      if (request.method() === "POST" && path === "/evaluaciones-cc/70/imagenes") {
        uploads++;
        assert.match(request.postDataBuffer().toString(), /name="imagenes"/);
        if (scenario === "network") return route.abort("failed");
        const failures = {
          low: [400, { code: "image_low_confidence", message: "Safe" }],
          negative: [400, { code: "image_no_cow", message: "Safe" }],
          validation: [422, [{ loc: ["body", "imagenes"], msg: "Field required" }]],
          storage: [502, { code: "image_storage_unavailable", message: "Safe" }],
        };
        if (failures[scenario]) {
          status = failures[scenario][0];
          body = { detail: failures[scenario][1] };
        } else {
          if (scenario === "inferred") { evaluation.valor_cc = 4; evaluation.estado = "CONFIRMADA"; }
          images.push({ id: 1, evaluacion_id: 70, tipo: "IMAGEN", origen: "UPLOAD_MANUAL", estado: "DISPONIBLE", storage_key: "evaluaciones/70/fixture.jpg", url: "", metadatos_json: { nombre_original: "fixture.png" } });
          status = 201;
          body = images;
        }
      } else if (request.method() !== "GET") {
        unexpected.push(`${request.method()} ${path}`);
        status = 500; body = {};
      } else if (path === "/sesiones-captura/7") {
        body = { id: 7, usuario_id: user.id, fecha_inicio: now, fecha_fin: null, estado: "ABIERTA", observaciones: "", creado_en: now, actualizado_en: now };
      } else if (path === "/sesiones-captura/7/entradas") body = { orden_disponible: true, items: [evaluation] };
      else if (path === "/sesiones-captura/7/analisis-video") body = { items: [] };
      else if (path === "/evaluaciones-cc/70/imagenes") body = images;
      else if (path === "/evaluaciones-cc/70") body = evaluation;
      else if (path === "/lotes/") body = [lot];
      else if (path === "/animales/agrupados-por-lote") body = [{ lote: lot, animales: [animal] }];
      else { unexpected.push(`${request.method()} ${path}`); status = 500; body = {}; }
      return route.fulfill({ status, headers, body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/sesiones/7/cargar`);
    await page.getByRole("button", { name: "Editar a IMAGE-01" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="file"]').setInputFiles({ name: "fixture.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9XkAAAAASUVORK5CYII=", "base64") });
    const messages = {
      inferred: "CC registrada: 4", pending: "sigue pendiente de CC", manual: "CC registrada: 3",
      low: "confianza es inferior", negative: "no detectó un bovino", validation: "solicitud de subida no es válida",
      storage: "servicio de almacenamiento", network: "No se pudo conectar con el servidor",
    };
    await page.getByText(messages[scenario], { exact: false }).waitFor();
    if (["inferred", "pending", "manual"].includes(scenario)) {
      assert.equal(await dialog.getByRole("button", { name: "Seleccionar valor de CC" }).innerText(), evaluation.valor_cc == null ? "Sin CC (pendiente)" : String(evaluation.valor_cc));
    }
    assert.equal(uploads, 1);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  });
}
