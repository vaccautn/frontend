// Medición reproducible contra la demo aislada, sin capturas ni cambios de datos.
import assert from "node:assert/strict";
const base = process.env.PREVIEW_API ?? "http://127.0.0.1:8026/api";
const login = await fetch(`${base}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "demo@vacca.test",
    password: "VaccaDemo2026!",
  }),
});
assert.equal(login.status, 200);
const { access_token } = await login.json();
const resultado = [];
for (const path of [
  "/animales/pagina?limit=50",
  "/lotes/mapa",
  "/animales/dashboard",
  "/sesiones-captura/?estado=CERRADA&limit=1",
]) {
  const tiempos = [];
  let bytes = 0;
  for (let i = 0; i < 3; i++) {
    const inicio = performance.now();
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    assert.equal(response.status, 200, path);
    const text = await response.text();
    bytes = Buffer.byteLength(text);
    const data = JSON.parse(text);
    if (path.startsWith("/animales/pagina")) {
      assert.ok(data.total >= 3125);
      assert.equal(data.items.length, 50);
    }
    if (path.startsWith("/sesiones")) assert.equal(data.items.length, 1);
    tiempos.push(Math.round(performance.now() - inicio));
  }
  resultado.push({
    endpoint: path,
    medianaMs: tiempos.sort((a, b) => a - b)[1],
    bytes,
  });
}
console.log(JSON.stringify(resultado, null, 2));
