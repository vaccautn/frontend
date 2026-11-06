import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom no entiende algunas reglas de CSS que genera Chakra (p. ej. @layer) y
// lo avisa en cada render: es ruido, no un error de la app.
const errorOriginal = console.error;
console.error = (...args: unknown[]) => {
  if (String(args[0]).includes("Could not parse CSS stylesheet")) return;
  errorOriginal(...args);
};

// jsdom no implementa estas APIs que usan Chakra (Ark UI) y los diálogos.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
