const PEZUNA_IZQ =
  "M43 8 C35 9.5 22 22 17.5 40 C13.5 56 16 74 26 83 C32 88.5 42 89 47 84.5 C49.6 82 49.4 74 48.2 66 C46.8 56 44.6 50 44.8 40 C45 30 46.5 18 43 8 Z";
const PEZUNA_DER =
  "M57 8 C65 9.5 78 22 82.5 40 C86.5 56 84 74 74 83 C68 88.5 58 89 53 84.5 C50.4 82 50.6 74 51.8 66 C53.2 56 55.4 50 55.2 40 C55 30 53.5 18 57 8 Z";
const CONTORNO_IZQ = "M42 19 C32.5 24 25 38 23.8 52 C22.8 66 28 76 38 79.5";
const CONTORNO_DER = "M58 19 C67.5 24 75 38 76.2 52 C77.2 66 72 76 62 79.5";

type Variante = "color" | "mono";

const RELLENOS: Record<Variante, [string, string]> = {
  color: ["var(--verde-bosque)", "var(--verde-vacca)"],
  mono: ["currentColor", "currentColor"],
};

const CONTORNOS: Record<Variante, string | null> = {
  color: "rgba(255, 255, 255, 0.35)",
  mono: null,
};

type Props = {
  size?: number;
  /** color: sobre fondo claro · mono: un solo color (currentColor), como
   * ícono de navegación. */
  variante?: Variante;
  className?: string;
};

/** Isotipo de VACCA: la pisada bovina. Desde 56px suma el contorno interior
 * de cada pezuña; más chico no se distingue. */
export function VaccaIsotipo({ size = 32, variante = "color", className }: Props) {
  const [izq, der] = RELLENOS[variante];
  const contorno = size >= 56 ? CONTORNOS[variante] : null;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true">
      <path d={PEZUNA_IZQ} fill={izq} />
      <path d={PEZUNA_DER} fill={der} />
      {contorno && (
        <g fill="none" stroke={contorno} strokeWidth="2.2" strokeLinecap="round">
          <path d={CONTORNO_IZQ} />
          <path d={CONTORNO_DER} />
        </g>
      )}
    </svg>
  );
}
