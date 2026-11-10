import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getAnimalesLote } from "../services/mapaService";
import type { AnimalLoteDetalle } from "../types";
import { useAnimalesLote } from "./useAnimalesLote";

vi.mock("../services/mapaService", () => ({ getAnimalesLote: vi.fn() }));

it("descarta respuestas del lote anterior y limpia al quitar la selección", async () => {
  let resolverPrimero!: (value: AnimalLoteDetalle[]) => void;
  vi.mocked(getAnimalesLote)
    .mockImplementationOnce(() => new Promise((resolve) => { resolverPrimero = resolve; }))
    .mockResolvedValueOnce([]);
  const { result, rerender } = renderHook(({ id }) => useAnimalesLote(id), {
    initialProps: { id: 1 as number | null },
  });
  rerender({ id: 2 });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    resolverPrimero([{ id: 99 } as AnimalLoteDetalle]);
  });
  expect(result.current.animales).toEqual([]);
  rerender({ id: null });
  expect(result.current).toEqual({ animales: [], loading: false });
});
