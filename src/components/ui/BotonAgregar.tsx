import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import "./boton-agregar.css";

type Props = ComponentProps<"button"> & {
  /** Ícono de la sección (vaca, libreta, calendario…). */
  icono: ReactNode;
  /** Texto para lectores de pantalla y para el tooltip. */
  label: string;
  loading?: boolean;
};

/** CTA circular de agregar: el ícono de la sección con un "+" que muerde el
 * borde. Acepta las props de un <button>, así sirve como trigger de un menú. */
export function BotonAgregar({
  icono,
  label,
  loading = false,
  className = "",
  disabled,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={`boton-agregar ${className}`}
      aria-label={label}
      title={label}
      aria-busy={loading}
      disabled={disabled || loading}
      {...props}>
      {loading ? <Spinner size="sm" /> : icono}
      <span className="boton-agregar__mas" aria-hidden="true">
        <IconPlus size={11} stroke={3.5} />
      </span>
    </button>
  );
}
