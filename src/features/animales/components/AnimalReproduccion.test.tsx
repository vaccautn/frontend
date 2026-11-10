import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderConApp } from "@/test/render";
import { getJson, postJson } from "@/services/httpClient";
import { getLotes } from "@/features/lotes/services/lotesService";
import { AnimalReproduccion } from "./AnimalReproduccion";

vi.mock("@/services/httpClient", () => ({ getJson: vi.fn(), postJson: vi.fn() }));
vi.mock("@/features/lotes/services/lotesService", () => ({ getLotes: vi.fn() }));

const resultado = {
  id: 5, servicio_id: 2, estado: "PRENADA", fecha_diagnostico: "2026-10-01",
  cria_id: null, cria_caravana: null,
};

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  vi.mocked(getLotes).mockResolvedValue([
    { id: 1, nombre: "Norte", activo: true, categoria: "TERNERA" },
  ]);
  vi.mocked(getJson).mockResolvedValue([resultado]);
});

it("muestra diagnósticos legibles y registra una cría normalizando la caravana", async () => {
  vi.mocked(postJson).mockResolvedValue({ cria_id: 9 });
  renderConApp(<AnimalReproduccion animalId={1} />);
  expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  expect(await screen.findByText("Preñada")).toBeInTheDocument();
  expect(screen.getByText("Diagnóstico · 01/10/2026")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Registrar nacimiento" }));
  fireEvent.change(screen.getByLabelText("Caravana de la cría"), { target: { value: "ab123 0009" } });
  fireEvent.change(screen.getByLabelText("Nuevo lote"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar nacimiento" }));
  await waitFor(() => expect(postJson).toHaveBeenCalledWith(
    "/resultados-servicio/5/cria",
    expect.objectContaining({ caravana: "AB1230009", lote_id: 1, categoria: "TERNERA" }),
    null,
  ));
});

it("permite reintentar cuando falla el historial", async () => {
  vi.mocked(getJson).mockRejectedValueOnce(new Error("offline"));
  renderConApp(<AnimalReproduccion animalId={1} />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("Preñada")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
