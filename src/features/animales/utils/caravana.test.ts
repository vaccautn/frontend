import { describe, expect, it } from "vitest";
import { esCaravanaValida, normalizarCaravana } from "./caravana";
import { sexoDeCategoria } from "../constants";

describe("caravana", () => {
  it("normaliza a mayúsculas y sin espacios", () => {
    expect(normalizarCaravana(" ab123 0001 ")).toBe("AB1230001");
  });

  it.each(["AB1230001", "032000123456789"])("acepta %s", (caravana) => {
    expect(esCaravanaValida(caravana)).toBe(true);
  });

  it.each(["C001", "V-00001", "AB12300011", "A1230001", "AB123-0001", "0320001234567"])(
    "rechaza %s",
    (caravana) => {
      expect(esCaravanaValida(caravana)).toBe(false);
    },
  );
});

describe("sexoDeCategoria", () => {
  it.each([
    ["TORO", "MACHO"],
    ["TERNERO", "MACHO"],
    ["NOVILLITO", "MACHO"],
    ["TERNERA", "HEMBRA"],
    ["VACA_SECA", "HEMBRA"],
    ["", ""],
  ])("%s → %s", (categoria, sexo) => {
    expect(sexoDeCategoria(categoria)).toBe(sexo);
  });
});
