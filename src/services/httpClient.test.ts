import { describe, expect, it } from "vitest";
import { ApiError } from "./httpClient";

describe("errores de validación", () => {
  it("muestra los mensajes 422 en lugar de perder el motivo del rechazo", () => {
    const error = new ApiError(422, [
      { msg: "Value error, Caravana inválida", loc: ["body", "caravana"] },
      { msg: "Lote obligatorio" },
    ]);
    expect(error.message).toBe("Caravana inválida · Lote obligatorio");
    expect(error.status).toBe(422);
    expect(error.data).toBeUndefined();
  });
});
