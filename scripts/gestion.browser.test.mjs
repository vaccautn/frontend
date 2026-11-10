// Validación funcional contra scripts/preview_local.py. No toma capturas.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.PREVIEW_WEB ?? "http://127.0.0.1:5176";
const api = process.env.PREVIEW_API ?? "http://127.0.0.1:8026/api";
const login = await fetch(`${api}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "demo@vacca.test",
    password: "VaccaDemo2026!",
  }),
});
assert.equal(login.status, 200);
const auth = await login.json();
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const errores = [];
const fallosApi = [];
const vistas = [];
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      locale: "es-AR",
      isMobile: viewport.width < 500,
      hasTouch: viewport.width < 500,
    });
    await context.addInitScript((auth) => {
      localStorage.setItem("auth.accessToken", auth.access_token);
      localStorage.setItem("auth.user", JSON.stringify(auth.user));
      localStorage.setItem("auth.tokenType", "Bearer");
    }, auth);
    const page = await context.newPage();
    page.on("pageerror", (error) => errores.push(error.message));
    page.on("response", (response) => {
      if (response.url().startsWith(api) && response.status() >= 400)
        fallosApi.push(`${response.status()} ${response.url()}`);
    });
    for (const path of [
      "/landing",
      "/inicio",
      "/rodeo",
      "/rodeo/1",
      "/rodeo/importar",
      "/rodeo/carga-tabla",
      "/rodeo/nuevo",
      "/sesiones",
      "/sesiones/1",
      "/sesiones/2/cargar",
      "/servicios",
      "/actividad",
      "/campo",
      "/pagina-inexistente",
    ]) {
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      console.log(`${viewport.width}px ${path}`);
      await page.waitForFunction(() => document.body.innerText.length > 80 && !document.body.innerText.includes("Cargando pantalla…"));
      await page.waitForTimeout(600);
      assert.ok(
        (await page.locator("body").innerText()).length > 40,
        `Pantalla vacía: ${path}`,
      );
      assert.equal(
        await page
          .getByText("No pudimos abrir esta pantalla", { exact: true })
          .count(),
        0,
        `Error de render en ${path}`,
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      );
      assert.equal(
        overflow,
        false,
        `Desborde horizontal de página en ${path} (${viewport.width}px)`,
      );
      // Los módulos nuevos usan el tema y los controles del resto de VACCA.
      const estilos = await page.evaluate(() => {
        const cards = [...document.querySelectorAll(".gestion-card")];
        const botones = [...document.querySelectorAll(".gestion-page button, .gestion-filter button")];
        const radio = getComputedStyle(document.documentElement).getPropertyValue("--radius-lg").trim();
        return {
          cardsConTema: cards.every(card => {
            const estilo = getComputedStyle(card);
            return estilo.borderTopLeftRadius === radio && estilo.backgroundColor !== "rgba(0, 0, 0, 0)" && estilo.boxShadow !== "none";
          }),
          controlesConTema: botones.every(button => button.classList.contains("chakra-button")),
        };
      });
      assert.ok(estilos.cardsConTema, `Tarjetas fuera del tema en ${path}`);
      assert.ok(estilos.controlesConTema, `Botones fuera del tema en ${path}`);
      if (path === "/rodeo") {
        await page.getByRole("navigation", { name: "Paginación" }).waitFor();
        assert.ok(
          (await page.locator("tbody tr").count()) <= 50,
          "La tabla debe renderizar hasta 50 animales",
        );
      }
      vistas.push(`${viewport.width}px ${path}`);
    }
    // Filtros de evaluación y navegación entre páginas.
    await page.goto(`${base}/rodeo/1`);
    await page.getByRole("group", { name: "Filtrar evaluaciones" }).waitFor();
    await page
      .getByRole("group", { name: "Filtrar evaluaciones" })
      .locator("select")
      .selectOption("1");
    await page.waitForTimeout(300);
    assert.match(page.url(), /evalCC=1/);
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await page.waitForTimeout(200);
    assert.ok(!page.url().includes("evalCC="));
    await context.close();
  }
  assert.deepEqual(errores, [], "Errores de JavaScript en navegador");
  assert.deepEqual(fallosApi, [], "Fallos de API al navegar");
  console.log(
    JSON.stringify(
      {
        vistas: vistas.length,
        javascriptErrors: errores,
        apiErrors: fallosApi,
        capturas: false,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
