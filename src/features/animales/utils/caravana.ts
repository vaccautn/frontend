/** Caravana: identificación oficial SENASA, única de por vida.
 * Refleja app/services/caravana.py del backend, que es quien valida en última
 * instancia: CUIG (2 letras y 3 números) + número de animal (4 números), p. ej.
 * "AB123 0001", o los 15 dígitos de la identificación electrónica. Se guarda en
 * mayúsculas y sin espacios. */

export const MENSAJE_FORMATO_CARAVANA =
  "La caravana debe tener el formato de SENASA: CUIG y número de animal (ej.: AB123 0001) o los 15 dígitos de la identificación electrónica.";

const PATRON_CUIG = /^[A-Z]{2}\d{3}\d{4}$/;
const PATRON_ELECTRONICA = /^\d{15}$/;

export function normalizarCaravana(valor: string): string {
  return valor.replace(/\s+/g, "").toUpperCase();
}

/** Recibe la caravana ya normalizada. */
export function esCaravanaValida(caravana: string): boolean {
  return PATRON_CUIG.test(caravana) || PATRON_ELECTRONICA.test(caravana);
}
