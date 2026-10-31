import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import { AnimalesFiltros } from "./AnimalesFiltros";

function renderFiltro(onAltaChange = vi.fn(), alta = null as Parameters<typeof AnimalesFiltros>[0]["alta"]) {
  renderConApp(
    <AnimalesFiltros
      caravanaInput=""
      categoriaLote={null}
      onCaravanaChange={() => {}}
      onCategoriaLoteChange={() => {}}
      alta={alta}
      onAltaChange={onAltaChange}
      camposVisibles={["alta"]}
    />,
  );
  return onAltaChange;
}

describe("Filtro por fecha de alta", () => {
  it("elige un período predefinido", async () => {
    const onAltaChange = renderFiltro();
    await userEvent.click(screen.getByRole("button", { name: "Filtrar por fecha de alta" }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Últimos 7 días" }));
    expect(onAltaChange).toHaveBeenCalledWith({ tipo: "7dias" });
  });

  it("muestra el filtro elegido y permite volver a cualquier fecha", async () => {
    const onAltaChange = renderFiltro(vi.fn(), { tipo: "hoy" });
    const boton = screen.getByRole("button", { name: "Filtrar por fecha de alta" });
    expect(boton).toHaveTextContent("Alta: hoy");
    await userEvent.click(boton);
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Cualquier fecha de alta" }));
    expect(onAltaChange).toHaveBeenCalledWith(null);
  });

  it("'Elegir fechas…' abre el rango", async () => {
    renderFiltro();
    await userEvent.click(screen.getByRole("button", { name: "Filtrar por fecha de alta" }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Elegir fechas…" }));
    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveTextContent("Fecha de alta");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
  });
});
