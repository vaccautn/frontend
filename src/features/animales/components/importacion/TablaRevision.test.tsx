import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import type { FilaAnalizada } from "@/features/animales/types/importacion";
import { TablaRevision } from "./TablaRevision";

describe("revisión de archivos grandes", () => {
  it("permite llegar a la última fila y sólo dibuja 50 por página", async () => {
    const filas: FilaAnalizada[] = Array.from({ length: 501 }, (_, index) => ({
      numero: index + 2,
      celdas: [],
      valores: {
        caravana: `AB123${String(index + 1).padStart(4, "0")}`,
        categoria: "TORO",
        lote: "Norte",
        origen: "COMPRA",
        fecha_nacimiento: null,
        raza: "Angus",
      },
      sexo: "MACHO",
      estado: index === 500 ? "ERROR" : "LISTA",
      inferencias: [],
      consultas: [],
      errores:
        index === 500
          ? [{ campo: "caravana", mensaje: "Revisar identificación" }]
          : [],
    }));
    renderConApp(<TablaRevision filas={filas} />);
    const tabla = screen.getByRole("table");
    expect(within(tabla).getAllByRole("row")).toHaveLength(51);
    for (let pagina = 0; pagina < 10; pagina++)
      fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("AB1230501")).toBeInTheDocument();
    expect(within(tabla).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Con errores/ }));
    // Vuelve a la primera página y, al quedar una sola, el paginador se oculta.
    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();
  });
});
