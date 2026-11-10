import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PREVIEW_WEB ?? "http://127.0.0.1:5180";
const salida = new URL("../.local/landing/", import.meta.url);
await mkdir(salida, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const errores = [];
const imagenesRotas = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 844 : 1000 },
      reducedMotion: "reduce",
      locale: "es-AR",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errores.push(error.message));
    page.on("response", (response) => {
      if (response.url().includes("/landing/") && response.status() >= 400)
        imagenesRotas.push(response.url());
    });
    await page.goto(`${base}/landing`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.title.includes("VACCA"));
    assert.match(await page.title(), /VACCA/);
    assert.equal(await page.locator("h1").count(), 1);
    for (const anchor of await page
      .locator('nav[aria-label="Secciones"] a')
      .all()) {
      const href = await anchor.getAttribute("href");
      assert.equal(await page.locator(href).count(), 1);
    }
    const grupo = page.getByRole("group", {
      name: "Elegir pantalla de la aplicación",
    });
    const botones = await grupo.getByRole("button").all();
    assert.equal(botones.length, 10);
    for (const boton of botones) {
      await boton.click();
      await page
        .locator("#landing-pantalla img:not([alt=''])")
        .evaluate(async (image) => {
          await image.decode();
        });
      assert.equal(await boton.getAttribute("aria-pressed"), "true");
    }
    await grupo.getByRole("button", { name: "Animal", exact: true }).click();
    await page
      .getByRole("button", { name: "Ampliar captura de Animal" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Animal · VACCA" });
    await dialog.waitFor();
    await dialog.locator("img").evaluate(async (image) => {
      await image.decode();
    });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page
      .getByRole("group", { name: "Elegir pantalla de la aplicación" })
      .getByRole("button", { name: "Inicio", exact: true })
      .click();
    await page.locator(".landing-mobile").scrollIntoViewIfNeeded();
    await page.locator(".landing-phones img").evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()));
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Desborde a ${width}px`,
    );
    await page
      .getByText("Ver las etapas del proyecto", { exact: false })
      .click();
    assert.equal(
      await page.locator(".landing-evolution details").getAttribute("open"),
      "",
    );
    await page
      .getByText("Ver las etapas del proyecto", { exact: false })
      .click();
    await page.evaluate(() => scrollTo(0, 0));
    if ([390, 1440].includes(width)) {
      await page.screenshot({
        path: new URL(`landing-${width}.jpg`, salida).pathname.replace(
          /^\/([A-Za-z]:)/,
          "$1",
        ),
        type: "jpeg",
        quality: 90,
        fullPage: true,
        animations: "disabled",
      });
      await page.screenshot({
        path: new URL(`portada-${width}.jpg`, salida).pathname.replace(
          /^\/([A-Za-z]:)/,
          "$1",
        ),
        type: "jpeg",
        quality: 90,
        animations: "disabled",
      });
    }
    await page.getByRole("link", { name: "Ingresar", exact: true }).click();
    await page.waitForURL("**/login");
    console.log(
      `${width}px: galería, imágenes, ampliación, enlaces y layout ok`,
    );
    await context.close();
  }
  const login = await fetch("http://127.0.0.1:8026/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@vacca.test",
      password: "VaccaDemo2026!",
    }),
  });
  assert.equal(login.status, 200);
  const auth = await login.json();
  const context = await browser.newContext();
  await context.addInitScript((a) => {
    localStorage.setItem("auth.accessToken", a.access_token);
    localStorage.setItem("auth.user", JSON.stringify(a.user));
  }, auth);
  const page = await context.newPage();
  await page.goto(`${base}/landing`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Ir a la app", exact: true }).click();
  await page.waitForURL("**/inicio");
  await context.close();
  console.log("acceso con sesión: ok");
  assert.deepEqual(errores, []);
  assert.deepEqual(imagenesRotas, []);
} finally {
  await browser.close();
}
