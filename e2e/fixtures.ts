import { test as base, expect, type APIRequestContext } from "@playwright/test";

export const API = "http://127.0.0.1:8010/api";

type Productor = {
  token: string;
  /** CUIG al azar para que las caravanas no choquen entre tests (son únicas en todo el sistema). */
  cuig: string;
  caravana: (numero: number) => string;
  api: <T>(metodo: "GET" | "POST", ruta: string, datos?: unknown) => Promise<T>;
};

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function cuigAlAzar() {
  const letra = () => LETRAS[Math.floor(Math.random() * LETRAS.length)];
  return `${letra()}${letra()}${Math.floor(100 + Math.random() * 900)}`;
}

async function crearProductor(request: APIRequestContext) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@vacca.test`;
  const password = "Prueba123";
  const registro = await request.post(`${API}/auth/register`, {
    data: { nombre: "Prueba", apellido: "E2E", email, password, confirmacion_password: password },
  });
  expect(registro.ok()).toBeTruthy();
  const login = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  return (await login.json()) as { access_token: string; token_type: string; user: unknown };
}

/** Cada test corre con un productor nuevo, ya logueado. */
export const test = base.extend<{ productor: Productor }>({
  // El segundo parámetro de un fixture suele llamarse `use`; con otro nombre no lo confunde la regla de hooks de React.
  productor: async ({ page, request }, entregar) => {
    const sesion = await crearProductor(request);
    await page.addInitScript((datos) => {
      localStorage.setItem("auth.accessToken", datos.access_token);
      localStorage.setItem("auth.tokenType", datos.token_type);
      localStorage.setItem("auth.user", JSON.stringify(datos.user));
    }, sesion);

    const cuig = cuigAlAzar();
    await entregar({
      token: sesion.access_token,
      cuig,
      caravana: (numero) => `${cuig}${String(numero).padStart(4, "0")}`,
      api: async (metodo, ruta, datos) => {
        const respuesta = await request.fetch(`${API}${ruta}`, {
          method: metodo,
          headers: { Authorization: `Bearer ${sesion.access_token}` },
          data: datos,
        });
        expect(respuesta.ok(), await respuesta.text()).toBeTruthy();
        return respuesta.json();
      },
    });
  },
});

export { expect };

/** Planilla CSV como la guarda Excel en español: ";" y BOM. */
export function planilla(filas: string[][]) {
  const encabezado = ["caravana", "categoria", "lote", "origen", "fecha_nacimiento", "raza"];
  const contenido = "﻿" + [encabezado, ...filas].map((fila) => fila.join(";")).join("\r\n");
  return { name: "animales.csv", mimeType: "text/csv", buffer: Buffer.from(contenido, "utf-8") };
}
