import { describe, expect, it } from "vitest";
import { etiquetaFiltroAlta, rangoDeAlta } from "./filtroAlta";

// 31/10/2026 a las 11:00 en hora local.
const AHORA = new Date(2026, 9, 31, 11, 0);
const local = (anio: number, mes: number, dia: number) => new Date(anio, mes - 1, dia).toISOString();

describe("rangoDeAlta", () => {
  it("sin filtro no manda límites", () => {
    expect(rangoDeAlta(null, AHORA)).toEqual({});
  });

  it("los presets empiezan a la medianoche local y no tienen fin", () => {
    expect(rangoDeAlta({ tipo: "hoy" }, AHORA)).toEqual({ alta_desde: local(2026, 10, 31) });
    expect(rangoDeAlta({ tipo: "7dias" }, AHORA)).toEqual({ alta_desde: local(2026, 10, 25) });
    expect(rangoDeAlta({ tipo: "30dias" }, AHORA)).toEqual({ alta_desde: local(2026, 10, 2) });
    expect(rangoDeAlta({ tipo: "anio" }, AHORA)).toEqual({ alta_desde: local(2026, 1, 1) });
  });

  it("el rango incluye el día 'hasta' entero", () => {
    expect(rangoDeAlta({ tipo: "rango", desde: "2026-10-01", hasta: "2026-10-31" }, AHORA)).toEqual({
      alta_desde: local(2026, 10, 1),
      alta_hasta: local(2026, 11, 1),
    });
  });

  it("el rango puede tener un solo extremo", () => {
    expect(rangoDeAlta({ tipo: "rango", desde: "", hasta: "2026-10-15" }, AHORA)).toEqual({
      alta_hasta: local(2026, 10, 16),
    });
  });
});

describe("etiquetaFiltroAlta", () => {
  it.each([
    [null, "Fecha de alta"],
    [{ tipo: "hoy" } as const, "Alta: hoy"],
    [{ tipo: "7dias" } as const, "Alta: últimos 7 días"],
    [{ tipo: "rango", desde: "2026-10-01", hasta: "2026-10-31" } as const, "Alta: 01/10/2026 – 31/10/2026"],
    [{ tipo: "rango", desde: "2026-10-31", hasta: "2026-10-31" } as const, "Alta: 31/10/2026"],
    [{ tipo: "rango", desde: "2026-10-01", hasta: "" } as const, "Alta desde 01/10/2026"],
  ])("%o → %s", (filtro, etiqueta) => {
    expect(etiquetaFiltroAlta(filtro)).toBe(etiqueta);
  });
});
