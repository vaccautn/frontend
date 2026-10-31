import assert from "node:assert/strict";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";

const browserModulePath = process.env.PLAYWRIGHT_MODULE_PATH;
if (!browserModulePath) {
  throw new Error(
    "Definí PLAYWRIGHT_MODULE_PATH con la ruta a una instalación de playwright-core antes de ejecutar las pruebas de navegador.",
  );
}

const { chromium } = await import(pathToFileURL(browserModulePath).href);
const baseUrl = process.env.VACCA_FRONTEND_E2E_URL ?? "http://127.0.0.1:5173";
const origin = new URL(baseUrl).origin;
const browser = await chromium.launch({ channel: "msedge", headless: true });
after(() => browser.close());

const ahora = "2026-10-30T12:00:00Z";
const usuario = {
  id: 909,
  nombre: "Prueba",
  apellido: "Local",
  email: "browser-test@example.invalid",
  rol: "PRODUCTOR",
};
const token = `e30.${Buffer.from(
  JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
).toString("base64url")}.fixture`;
const animal = {
  id: 51,
  caravana: "BROWSER-01",
  sexo: "HEMBRA",
  categoria: "VACA_SECA",
  raza: "Angus",
  fecha_nacimiento: null,
  estado: "ACTIVO",
  observacion: "",
  lote_id: 1,
  origen: "COMPRA",
  servicio_id: null,
  creado_en: ahora,
  actualizado_en: ahora,
};
const lote = {
  id: 1,
  nombre: "Lote de prueba",
  descripcion: "",
  categoria: "VACA_SECA",
  usuario_administrador_id: usuario.id,
  activo: true,
  creado_en: ahora,
  actualizado_en: ahora,
};
const entrada = (valorCc = 3) => ({
  id: 70,
  sesion_id: 7,
  animal_id: animal.id,
  animal_rfid: animal.caravana,
  usuario_id: usuario.id,
  fecha: ahora,
  valor_cc: valorCc,
  orden_entrada: 1,
  escala_min: 1,
  escala_max: 5,
  observaciones: "observación del servidor",
  estado: valorCc == null ? "BORRADOR" : "CONFIRMADA",
  creado_en: ahora,
  actualizado_en: ahora,
});
const sesion = {
  id: 7,
  usuario_id: usuario.id,
  fecha_inicio: ahora,
  fecha_fin: null,
  estado: "ABIERTA",
  observaciones: "",
  creado_en: ahora,
  actualizado_en: ahora,
};
const analisisCompleto = (overrides = {}) => ({
  id: "analysis-browser-1",
  sesion_id: sesion.id,
  estado: "ENVIANDO",
  entradas_count: 1,
  pasajes_count: null,
  unresolved_count: 0,
  aplicados_count: 0,
  discrepancia: null,
  animales_sin_pasaje: [],
  pasajes_sin_asignar: [],
  advertencias: [],
  error_code: null,
  limpieza: "PENDIENTE",
  error_limpieza: null,
  resultados: [],
  ...overrides,
});

function jsonResponse(body, status = 200) {
  return { body, status, headers: { "content-type": "application/json" } };
}

function createFixture() {
  return {
    analysisItems: [],
    analysisRequests: 0,
    entriesRequests: 0,
    entriesValue: 3,
    showAnimal: true,
    failFirstAnalysisRequest: false,
    uploadGate: null,
    uploads: [],
    retries: 0,
    resolutions: 0,
    requests: [],
    unhandledApi: [],
    async handle(request, route) {
      const requestUrl = new URL(request.url());
      const path = requestUrl.pathname.replace(/^\/api/, "");
      const method = request.method();
      this.requests.push(`${method} ${path}`);
      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": origin,
            "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "access-control-allow-headers": "authorization,content-type,idempotency-key",
          },
        });
        return;
      }

      let result;
      if (method === "GET" && path === `/sesiones-captura/${sesion.id}`) {
        result = jsonResponse(sesion);
      } else if (method === "GET" && path === `/sesiones-captura/${sesion.id}/entradas`) {
        this.entriesRequests += 1;
        result = jsonResponse({
          orden_disponible: true,
          items: this.showAnimal ? [entrada(this.entriesValue)] : [],
        });
      } else if (method === "GET" && path === `/sesiones-captura/${sesion.id}/analisis-video`) {
        this.analysisRequests += 1;
        if (this.failFirstAnalysisRequest) {
          result = jsonResponse({ detail: "fallo de prueba" }, 503);
        } else {
          result = jsonResponse({ items: this.analysisItems });
        }
      } else if (method === "GET" && path === `/evaluaciones-cc/${entrada().id}/imagenes`) {
        result = jsonResponse([]);
      } else if (method === "GET" && path === "/lotes/") {
        result = jsonResponse([lote]);
      } else if (method === "GET" && path === "/animales/agrupados-por-lote") {
        result = jsonResponse(this.showAnimal ? [{ lote, animales: [animal] }] : []);
      } else if (method === "GET" && path === "/animales/") {
        result = jsonResponse(this.showAnimal ? [animal] : []);
      } else if (method === "POST" && path === `/sesiones-captura/${sesion.id}/analisis-video`) {
        const upload = {
          key: request.headers()["idempotency-key"],
          payload: request.postDataBuffer(),
        };
        this.uploads.push(upload);
        const expected = Buffer.from("synthetic-valid-video");
        if (!upload.payload?.includes(expected)) {
          result = jsonResponse({ detail: "El contenido no coincide con el envío pendiente." }, 409);
        } else {
          if (this.uploadGate) await this.uploadGate.promise;
          result = jsonResponse(analisisCompleto({ estado: "EN_COLA" }), 202);
        }
      } else if (method === "POST" && path.endsWith("/resolve")) {
        this.resolutions += 1;
        this.analysisItems = [];
        result = { status: 204, body: "" };
      } else if (method === "POST" && path.endsWith("/retry")) {
        this.retries += 1;
        result = jsonResponse({ detail: "reintento de prueba rechazado" }, 409);
      } else {
        this.unhandledApi.push(`${method} ${path}`);
        result = jsonResponse([], 200);
      }

      await route.fulfill({
        status: result.status,
        body: typeof result.body === "string" ? result.body : JSON.stringify(result.body),
        headers: {
          ...(result.headers ?? {}),
          "access-control-allow-origin": origin,
          "access-control-allow-credentials": "true",
        },
      });
    },
  };
}

async function openSessionPage(fixture) {
  const context = await browser.newContext();
  await context.addInitScript(({ accessToken, storedUser }) => {
    localStorage.setItem("auth.accessToken", accessToken);
    localStorage.setItem("auth.tokenType", "Bearer");
    localStorage.setItem("auth.user", JSON.stringify(storedUser));
  }, { accessToken: token, storedUser: usuario });
  await context.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.startsWith("/api/")) {
      await fixture.handle(route.request(), route);
    } else if (requestUrl.origin === origin) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/sesiones/${sesion.id}/cargar`);
  await page.getByRole("heading", { name: "Cargar video" }).waitFor();
  return { context, page, errors };
}

const restrictedJob = () => ({
  id: "analysis-revoked",
  sesion_id: sesion.id,
  estado: "ERROR",
  error_code: "acceso_revocado",
  limpieza: "RETENIDA",
  resultados_aplicados: false,
  acceso_restringido: true,
});
const restrictedAdmission = () => ({
  ...restrictedJob(),
  estado: "ENVIANDO",
  error_code: null,
  limpieza: "PENDIENTE",
});

test("la vista real recupera la clave del servidor y conserva el formulario durante las consultas", { timeout: 60000 }, async (t) => {
  const fixture = createFixture();
  const recoveryKey = "server-issued-key-after-session-storage-loss";
  fixture.analysisItems = [analisisCompleto({ recovery_key: recoveryKey })];
  fixture.uploadGate = (() => {
    let release;
    return {
      promise: new Promise((resolve) => { release = resolve; }),
      release: () => release(),
    };
  })();
  const { context, page, errors } = await openSessionPage(fixture);
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], "La aplicación no debe generar errores JavaScript en el navegador");
    assert.deepEqual(fixture.unhandledApi, [], "Todas las solicitudes API de la prueba deben estar interceptadas");
  });

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole("heading", { name: "Cargar video" }).waitFor();
  const videoInput = page.getByLabel("Archivo MP4 o MOV (máximo 50 MiB)");
  await videoInput.setInputFiles({
    name: "wrong.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("different synthetic bytes"),
  });
  await page.getByRole("button", { name: "Reintentar el mismo envío" }).click();
  await page.getByRole("alert").filter({ hasText: "El contenido no coincide con el envío pendiente." }).waitFor();
  assert.equal(fixture.uploads[0].key, recoveryKey);

  await videoInput.setInputFiles({
    name: "synthetic.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("synthetic-valid-video"),
  });
  const retryButton = page.getByRole("button", { name: "Reintentar el mismo envío" });
  await retryButton.waitFor();
  await retryButton.click();
  await page.waitForFunction(() => document.querySelector('[role="progressbar"][aria-label="Subiendo video"]'));
  assert.equal(fixture.uploads.length, 2);
  assert.deepEqual(fixture.uploads.map((upload) => upload.key), [recoveryKey, recoveryKey]);
  const progress = page.getByRole("progressbar", { name: "Subiendo video" });
  assert.equal(await progress.getAttribute("aria-valuetext"), "Progreso indeterminado");

  fixture.uploadGate.release();
  await page.getByText("Esperando procesamiento…").waitFor();

  const row = page.getByRole("button", { name: "Editar a BROWSER-01" });
  await row.click();
  await page.getByRole("heading", { name: "Registrar evaluación de CC de BROWSER-01" }).waitFor();
  await page.getByRole("button", { name: "Seleccionar valor de CC" }).click();
  await page.getByRole("menuitem", { name: "4" }).click();
  const observation = page.getByRole("textbox", { name: "Observación" });
  await observation.fill("nota escrita antes del refresco");

  const completedPoll = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/analisis-video") &&
    (await response.json()).items[0]?.estado === "COMPLETADO",
  );
  const refreshedEntries = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/entradas") &&
    (await response.json()).items[0]?.valor_cc === 5,
  );
  fixture.entriesValue = 5;
  fixture.analysisItems = [analisisCompleto({ estado: "COMPLETADO", aplicados_count: 1 })];
  await completedPoll;
  await refreshedEntries;

  assert.equal(await page.getByRole("heading", { name: "Registrar evaluación de CC de BROWSER-01" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Seleccionar valor de CC" }).innerText(), "4");
  assert.equal(await observation.inputValue(), "nota escrita antes del refresco");
  const uploadCountAfterAppliedResults = fixture.uploads.length;
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
  await videoInput.setInputFiles({
    name: "despues-de-resultados.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("synthetic-valid-video"),
  });
  assert.match(await videoInput.inputValue(), /despues-de-resultados\.mp4$/);
  const sendButton = page.getByRole("button", { name: "Enviar video", exact: true });
  assert.equal(await sendButton.isDisabled(), true);
  assert.equal(fixture.uploads.length, uploadCountAfterAppliedResults);
  assert.equal(await page.getByText("Se usa el orden guardado por el servidor", { exact: false }).count(), 0);
  assert.equal(await page.getByText("Ya hay resultados de video aplicados en esta sesión", { exact: false }).count(), 0);
});

test("el trabajo restringido se puede resolver sin exponer snapshot ni habilitar reintento", { timeout: 30000 }, async (t) => {
  const fixture = createFixture();
  fixture.showAnimal = false;
  fixture.analysisItems = [restrictedJob()];
  const { context, page, errors } = await openSessionPage(fixture);
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(fixture.unhandledApi, []);
  });
  await page.getByText("Este análisis conserva su estado, pero el acceso a sus datos fue revocado.", { exact: false }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Reintentar" }).count(), 0);
  assert.equal(await page.getByLabel("Archivo MP4 o MOV (máximo 50 MiB)").isDisabled(), true);
  const resolvedResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/resolve"),
  );
  const refreshedList = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/analisis-video") &&
    (await response.json()).items.length === 0,
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Resolver error" }).click();
  assert.equal((await resolvedResponse).status(), 204);
  assert.equal((await refreshedList).status(), 200);
  await page.getByText("Este análisis conserva su estado, pero el acceso a sus datos fue revocado.", { exact: false }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Resolver error" }).waitFor({ state: "hidden" });
  assert.equal(fixture.resolutions, 1);
  assert.equal(await page.getByText("acceso_revocado", { exact: false }).count(), 0);
});

test("la admisión incierta restringida se abandona explícitamente y libera controles", { timeout: 30000 }, async (t) => {
  const fixture = createFixture();
  fixture.analysisItems = [restrictedAdmission()];
  const { context, page, errors } = await openSessionPage(fixture);
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(fixture.unhandledApi, []);
  });

  const restrictedNotice = page.getByText(
    "Este análisis conserva su estado, pero el acceso a sus datos fue revocado.",
    { exact: false },
  );
  await restrictedNotice.waitFor();
  assert.equal(await page.getByLabel("Archivo MP4 o MOV (máximo 50 MiB)").isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Reintentar" }).count(), 0);

  const resolvedResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && response.url().endsWith("/resolve"),
  );
  const refreshedList = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/analisis-video") &&
    (await response.json()).items.length === 0,
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Resolver error" }).click();
  assert.equal((await resolvedResponse).status(), 204);
  assert.equal((await refreshedList).status(), 200);
  await restrictedNotice.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Resolver error" }).waitFor({ state: "hidden" });
  assert.equal(await page.getByLabel("Archivo MP4 o MOV (máximo 50 MiB)").isDisabled(), false);
  assert.equal(fixture.resolutions, 1);
});

test("una consulta sana limpia solo su alerta y no oculta un error de acción", { timeout: 30000 }, async (t) => {
  const fixture = createFixture();
  fixture.failFirstAnalysisRequest = true;
  fixture.analysisItems = [analisisCompleto({ estado: "ERROR", error_code: "analisis_ia_fallido", limpieza: "RETENIDA" })];
  const { context, page, errors } = await openSessionPage(fixture);
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(fixture.unhandledApi, []);
  });
  const pollAlert = page.getByRole("alert").filter({ hasText: "No se pudo recuperar el estado de los análisis de esta sesión." });
  await pollAlert.waitFor().catch(async () => {
    assert.fail(JSON.stringify({ text: await page.locator("body").innerText(), requests: fixture.requests }));
  });
  const healthyPoll = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/analisis-video") &&
    response.ok() &&
    (await response.json()).items.length > 0,
  );
  fixture.failFirstAnalysisRequest = false;
  await healthyPoll;
  await page.getByRole("button", { name: "Reintentar" }).waitFor();
  await pollAlert.waitFor({ state: "hidden", timeout: 7000 });

  await page.getByRole("button", { name: "Reintentar" }).click();
  const actionAlert = page.getByRole("alert").filter({ hasText: "reintento de prueba rechazado" });
  await actionAlert.waitFor();
  const healthyPollAfterAction = page.waitForResponse(async (response) =>
    response.request().method() === "GET" &&
    response.url().endsWith("/analisis-video") &&
    response.ok() &&
    (await response.json()).items.length > 0,
  );
  await healthyPollAfterAction;
  await actionAlert.waitFor({ state: "visible" });
  assert.equal(fixture.retries, 1);
});
