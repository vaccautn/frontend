import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";
import { system } from "@/lib/chakra/theme";

/** Renderiza con el tema de Chakra y un router en memoria, como en la app. */
export function renderConApp(ui: ReactElement, { ruta = "/" } = {}) {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </ChakraProvider>,
  );
}
