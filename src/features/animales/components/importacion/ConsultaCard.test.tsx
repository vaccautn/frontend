import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import type { ConsultaImportacion } from "@/features/animales/types/importacion";
import { ConsultaCard } from "./ConsultaCard";

const loteNuevo: ConsultaImportacion = {
  clave: "lote:potrero5",
  tipo: "LOTE_NUEVO",
  campo: "lote",
  valor: "Potrero 5",
  mensaje: "No tenés ningún lote llamado «Potrero 5». ¿Es un lote nuevo o te equivocaste de nombre?",
  opciones: [
    { valor: "__CREAR__", etiqueta: "Es nuevo: crear el lote «Potrero 5»" },
    { valor: "Lote Norte", etiqueta: "Usar el lote «Lote Norte»" },
    { valor: "__NO_IMPORTAR__", etiqueta: "No importar: lo corrijo en el archivo" },
  ],
  filas: [2, 3],
  lote_id: null,
  animal_existente: null,
};

describe("ConsultaCard", () => {
  it("muestra la pregunta, las filas y queda pendiente hasta decidir", () => {
    renderConApp(<ConsultaCard consulta={loteNuevo} decision={undefined} filas={new Map()} onCambiar={() => {}} />);
    expect(screen.getByText(loteNuevo.mensaje)).toBeInTheDocument();
    expect(screen.getByText(/2 filas: 2, 3/)).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("elegir una opción avisa la decisión", async () => {
    const onCambiar = vi.fn();
    renderConApp(<ConsultaCard consulta={loteNuevo} decision={undefined} filas={new Map()} onCambiar={onCambiar} />);
    await userEvent.click(screen.getByRole("radio", { name: /crear el lote/ }));
    expect(onCambiar).toHaveBeenCalledWith({ opcion: "__CREAR__" });
  });

  it("al crear un lote pide su categoría, con la opción de no saberla", async () => {
    const onCambiar = vi.fn();
    renderConApp(
      <ConsultaCard
        consulta={loteNuevo}
        decision={{ opcion: "__CREAR__" }}
        filas={new Map()}
        onCambiar={onCambiar}
      />,
    );
    expect(screen.getByText("Decidido")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: /Categoría del lote/ });
    expect(select).toHaveDisplayValue(/No sé/);
    await userEvent.selectOptions(select, "VAQUILLA");
    expect(onCambiar).toHaveBeenCalledWith({ opcion: "__CREAR__", categoriaLote: "VAQUILLA" });
  });

  it("permite decidir una fila puntual", async () => {
    const onCambiar = vi.fn();
    renderConApp(
      <ConsultaCard consulta={loteNuevo} decision={{ opcion: "__CREAR__" }} filas={new Map()} onCambiar={onCambiar} />,
    );
    await userEvent.click(screen.getByText("Decidir fila por fila"));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Opción para la fila 3" }), "Lote Norte");
    expect(onCambiar).toHaveBeenCalledWith({ opcion: "__CREAR__", porFila: { 3: "Lote Norte" } });
  });
});
