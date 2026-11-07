import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import { ConfirmacionDialog } from "./ConfirmacionDialog";

describe("confirmación con componentes de la aplicación", () => {
  it("expone el título, permite cancelar y bloquea acciones durante el envío", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderConApp(
      <ConfirmacionDialog
        open
        titulo="Confirmar movimiento"
        onClose={onClose}
        onConfirm={onConfirm}
      >
        Dos lotes de origen
      </ConfirmacionDialog>,
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Confirmar movimiento",
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it("bloquea acciones durante el envío", async () => {
    renderConApp(
      <ConfirmacionDialog
        open
        pendiente
        titulo="Confirmar movimiento"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      >
        Dos lotes de origen
      </ConfirmacionDialog>,
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Confirmar movimiento",
    });
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    ).toBeDisabled();
  });
});
