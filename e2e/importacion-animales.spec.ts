import { readFile } from "node:fs/promises";
import { expect, planilla, test } from "./fixtures";

type Animal = { caravana: string; sexo: string; categoria: string; raza: string; lote_id: number };
type Lote = { id: number; nombre: string; categoria: string };

test.describe("Importar animales desde planilla", () => {
  test.beforeEach(async ({ productor }) => {
    await productor.api("POST", "/lotes/", { nombre: "Lote Norte", usuario_administrador_id: 0 });
  });

  test("importa una planilla válida, con valores para interpretar", async ({ page, productor }) => {
    const cuigMinuscula = productor.cuig.toLowerCase();
    await page.goto("/rodeo");
    await page.getByRole("button", { name: "Agregar animales" }).first().click();
    await page.getByRole("menuitem", { name: /Importar desde archivo/ }).click();
    await expect(page.getByRole("heading", { name: "Importar animales" })).toBeVisible();

    // Los pasos explican cada etapa al tocarlos.
    await page.getByRole("tab", { name: /Revisá e importá/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText("Excel con los errores");

    await page.getByLabel("Elegir planilla").setInputFiles(
      planilla([
        [productor.caravana(1), "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "Brangus"],
        [`${cuigMinuscula} 0002`, "vaca_sec", "lote norte", "compra", "01/03/2021", "angus"],
        [productor.caravana(3), "Toro", "Lote Norte", "Compra", "10/10/2019", "Herefor"],
      ]),
    );

    await expect(page.getByText("Vista previa")).toBeVisible();
    await expect(page.getByText("escrito «Herefor»")).toBeVisible();
    await expect(page.getByText("Necesitamos tu confirmación")).toHaveCount(0);

    await page.getByRole("button", { name: "Importar 3 animales" }).click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toContainText("Se dan de alta 3 animales nuevos");
    await dialogo.getByRole("button", { name: "Importar 3 animales" }).click();

    await expect(page.getByText("¡Listo! Importamos todos los animales")).toBeVisible();

    const animales = await productor.api<Animal[]>("GET", "/animales/");
    const porCaravana = Object.fromEntries(animales.map((a) => [a.caravana, a]));
    expect(Object.keys(porCaravana).sort()).toEqual(
      [productor.caravana(1), productor.caravana(2), productor.caravana(3)].sort(),
    );
    expect(porCaravana[productor.caravana(2)]).toMatchObject({ categoria: "VACA_SECA", raza: "Angus", sexo: "HEMBRA" });
    expect(porCaravana[productor.caravana(3)]).toMatchObject({ sexo: "MACHO", raza: "Hereford" });

    await page.getByRole("button", { name: "Ir al rodeo" }).click();
    await expect(page).toHaveURL(/\/rodeo$/);
  });

  test("resuelve dudas, carga en parte, devuelve el Excel con errores y se completa al volver a subirlo", async ({
    page,
    productor,
  }) => {
    const lotes = await productor.api<Lote[]>("GET", "/lotes/");
    await productor.api("POST", "/animales/registrar-animal", {
      caravana: productor.caravana(10),
      categoria: "VACA_SECA",
      raza: "Angus",
      fecha_nacimiento: "2018-05-05",
      lote_id: lotes[0].id,
    });

    await page.goto("/rodeo/importar");
    await page.getByLabel("Elegir planilla").setInputFiles(
      planilla([
        [productor.caravana(11), "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "rangus"],
        [productor.caravana(12), "Vaquilla", "Potrero 5", "Compra", "01/09/2024", "Angus"],
        ["V-1", "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "Angus"],
        [productor.caravana(13), "Toro", "Lote Norte", "Compra", "10/10/2019", "Angus"],
        [productor.caravana(13), "Torito", "Lote Norte", "Compra", "10/10/2024", "Angus"],
        [productor.caravana(10), "Vaca en lactancia", "Lote Norte", "", "", ""],
        [productor.caravana(14), "Ternero", "Lote Norte", "Compra", "31/02/2023", "Angus"],
      ]),
    );

    await expect(page.getByText("Necesitamos tu confirmación")).toBeVisible();
    await page.getByRole("radio", { name: "Brangus", exact: true }).click();
    await page.getByRole("radio", { name: /crear el lote «Potrero 5»/ }).click();
    await page.getByRole("radio", { name: "Conservar la fila 6" }).click();
    await page.getByRole("radio", { name: /Sí, actualizar el animal/ }).click();
    await expect(page.getByText("Ya decidiste todo. Podés importar.")).toBeVisible();

    await page.getByRole("button", { name: "Importar 4 animales" }).click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toContainText("Se dan de alta 3 animales nuevos");
    await expect(dialogo).toContainText("Se actualizan 1 animal");
    await expect(dialogo).toContainText("«Potrero 5»");
    await expect(dialogo).toContainText("Se descartan 1 fila repetida");
    await dialogo.getByRole("button", { name: "Importar 4 animales" }).click();

    await expect(page.getByText(/Importamos 4 animales, pero 2 filas no se pudieron cargar/)).toBeVisible();

    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: /Descargar Excel con errores/ }).click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toBe("animales-con-errores.xlsx");
    const animales = await productor.api<Animal[]>("GET", "/animales/");
    const actualizado = animales.find((a) => a.caravana === productor.caravana(10));
    expect(actualizado).toMatchObject({ categoria: "VACA_LACTANDO", raza: "Angus" });
    expect(animales.find((a) => a.caravana === productor.caravana(13))).toMatchObject({ categoria: "TORITO" });
    const potrero = (await productor.api<Lote[]>("GET", "/lotes/")).find((l) => l.nombre === "Potrero 5");
    expect(potrero?.categoria).toBe("VAQUILLA");

    // El Excel de errores se puede volver a subir tal cual: trae solo las filas que fallaron.
    const rutaErrores = (await archivo.path())!;
    await page.getByRole("button", { name: "Subir archivo corregido" }).click();
    await page.getByLabel("Elegir planilla").setInputFiles({
      name: "animales-con-errores.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: await readFile(rutaErrores),
    });
    const tabla = page.locator(".importar__tabla");
    await expect(tabla.getByText("V-1")).toBeVisible();
    await expect(tabla.getByText(/el día 31 no existe/)).toBeVisible();
    await expect(tabla.locator("tbody tr")).toHaveCount(2);

    // El productor corrige el archivo y lo vuelve a subir.
    await page.getByRole("button", { name: "Quitar archivo" }).click();
    await page.getByLabel("Elegir planilla").setInputFiles(
      planilla([
        [productor.caravana(15), "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "Angus"],
        [productor.caravana(14), "Ternero", "Lote Norte", "Compra", "28/02/2023", "Angus"],
      ]),
    );
    await page.getByRole("button", { name: "Importar 2 animales" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Importar 2 animales" }).click();
    await expect(page.getByText("¡Listo! Importamos todos los animales")).toBeVisible();
    // El existente (10), los tres de la primera carga (11, 12, 13) y los dos corregidos (14, 15).
    expect(await productor.api<Animal[]>("GET", "/animales/")).toHaveLength(6);
  });

  test("avisa las columnas que faltan y ofrece la plantilla", async ({ page }) => {
    await page.goto("/rodeo/importar");
    await page.getByLabel("Elegir planilla").setInputFiles({
      name: "viejo.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("caravana;sexo;categoria\nAB1230001;HEMBRA;Vaca seca\n"),
    });

    await expect(page.getByText("Faltan 4 columnas")).toBeVisible();
    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar plantilla" }).click();
    const plantilla = await readFile((await (await descarga).path())!, "utf-8");
    expect(plantilla.split("\r\n")[0]).toBe("﻿caravana;categoria;lote;origen;fecha_nacimiento;raza");
  });
});
