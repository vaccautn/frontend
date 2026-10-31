import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import { PasosImportacion } from "./PasosImportacion";

describe("PasosImportacion", () => {
  it("al tocar un paso muestra su explicación", async () => {
    renderConApp(<PasosImportacion pasoActual={0} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Subí una planilla con tus animales");

    await userEvent.click(screen.getByRole("tab", { name: /Subí el archivo/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Aceptamos CSV y Excel");
    expect(screen.getByRole("tab", { name: /Subí el archivo/ })).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByRole("tab", { name: /Revisá e importá/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("descargá el Excel con los errores");
  });

  it("al avanzar, la explicación sigue al paso actual", () => {
    const { rerender } = renderConApp(<PasosImportacion pasoActual={0} />);
    rerender(<PasosImportacion pasoActual={2} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Te mostramos cómo interpretamos cada fila");
  });
});
