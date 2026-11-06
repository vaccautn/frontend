import { describe, expect, it } from "vitest";
import {
  initialRodeoEditarValues,
  initialRodeoNuevoValues,
  validateRodeoEditarForm,
  validateRodeoNuevoForm,
} from "./animalesValidation";

const nuevo = {
  ...initialRodeoNuevoValues,
  caravana: "ab123 0001",
  raza: "Angus",
  categoria: "VACA_SECA",
  fecha_nacimiento: "2020-01-01",
  lote_id: "1",
};

describe("validateRodeoNuevoForm", () => {
  it("no pide el sexo: sale de la categoría", () => {
    expect(validateRodeoNuevoForm(nuevo)).toEqual({});
  });

  it("exige el formato SENASA de la caravana", () => {
    expect(validateRodeoNuevoForm({ ...nuevo, caravana: "V-1" }).caravana).toMatch(/SENASA/);
  });

  it("exige la categoría", () => {
    expect(validateRodeoNuevoForm({ ...nuevo, categoria: "" }).categoria).toBeDefined();
  });
});

describe("validateRodeoEditarForm", () => {
  const editar = {
    ...initialRodeoEditarValues,
    caravana: "V-00001",
    raza: "Angus",
    categoria: "TORO",
    fecha_nacimiento: "2020-01-01",
    estado: "ACTIVO",
    lote_id: "1",
  };

  it("deja editar un animal con caravana anterior al formato si no la cambia", () => {
    expect(validateRodeoEditarForm(editar, "V-00001")).toEqual({});
  });

  it("exige el formato si la caravana cambia", () => {
    expect(validateRodeoEditarForm({ ...editar, caravana: "V-00002" }, "V-00001").caravana).toMatch(
      /SENASA/,
    );
    expect(validateRodeoEditarForm({ ...editar, caravana: "ab123 0002" }, "V-00001")).toEqual({});
  });
});
