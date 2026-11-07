/** Formato acordado para la identificación en VACCA: dos letras ASCII,
 * tres dígitos y cuatro caracteres alfanuméricos ASCII, o quince dígitos.
 * El servidor vuelve a validar y guarda en mayúsculas y sin espacios. */

export const MENSAJE_FORMATO_CARAVANA =
  "La caravana debe tener el formato de SENASA: CUIG y número de animal (ej.: AB123 0001) o los 15 dígitos de la identificación electrónica.";

const PATRON_CUIG = /^[A-Z]{2}[0-9]{3}[A-Z0-9]{4}$/;
const PATRON_ELECTRONICA = /^[0-9]{15}$/;

export function normalizarCaravana(valor: string): string {
  return valor.replace(/\s+/g, "").toUpperCase();
}

/** Recibe la caravana ya normalizada. */
export function esCaravanaValida(caravana: string): boolean {
  return PATRON_CUIG.test(caravana) || PATRON_ELECTRONICA.test(caravana);
}
