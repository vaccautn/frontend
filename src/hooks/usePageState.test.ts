import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePageState } from "./usePageState";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  localStorage.setItem("auth.user", JSON.stringify({ id: 1 }));
});

describe("usePageState", () => {
  it("restaura cada campo sin copiar los filtros del anterior", () => {
    sessionStorage.setItem("vacca.campoActivo", "1");
    const { result, rerender } = renderHook(() => usePageState("pagina", 0));
    act(() => result.current[1](3));
    sessionStorage.setItem("vacca.campoActivo", "2");
    rerender();
    expect(result.current[0]).toBe(0);
    expect(sessionStorage.getItem("vacca.ui.1.2.pagina")).toBe("0");
    act(() => result.current[1]((value) => value + 1));
    sessionStorage.setItem("vacca.campoActivo", "1");
    rerender();
    expect(result.current[0]).toBe(3);
    expect(sessionStorage.getItem("vacca.ui.1.2.pagina")).toBe("1");
  });

  it("aísla usuarios y el rodeo conjunto", () => {
    const { result, rerender } = renderHook(() => usePageState("filtro", ""));
    act(() => result.current[1]("vacas"));
    localStorage.setItem("auth.user", JSON.stringify({ id: 2 }));
    rerender();
    expect(result.current[0]).toBe("");
    sessionStorage.setItem("vacca.campoActivo", "1");
    rerender();
    act(() => result.current[1]("toros"));
    sessionStorage.removeItem("vacca.campoActivo");
    localStorage.setItem("auth.user", JSON.stringify({ id: 1 }));
    rerender();
    expect(result.current[0]).toBe("vacas");
  });

  it("recupera el valor inicial cuando el almacenamiento está corrupto", () => {
    sessionStorage.setItem("vacca.ui.1.todos.pagina", "invalid json");
    const { result } = renderHook(() => usePageState("pagina", 0));
    expect(result.current[0]).toBe(0);
  });

  it("mantiene estable el setter mientras no cambia el campo", () => {
    const { result, rerender } = renderHook(() => usePageState("pagina", 0));
    const setter = result.current[1];
    rerender();
    expect(result.current[1]).toBe(setter);
  });
});
