import { Link } from "react-router-dom";
import "./primaryButton.css";

type BaseProps = {
  label: string;
  disabled?: boolean;
};

type AsButton = BaseProps & {
  onClick: () => void;
  href?: never;
};

type AsLink = BaseProps & {
  href: string;
  onClick?: never;
};

type PrimaryButtonProps = AsButton | AsLink;

/**
 * PrimaryButton
 *
 * Renderiza un button o un Link según los props que reciba.
 *
 * Como botón (ejecuta una acción):
 *   < PrimaryButton label="Registrar animal" onClick={handleClick} />
 *
 * Como link (navega a una ruta):
 *   < PrimaryButton label="Registrar animal" href="/rodeo/nuevo" />
 *
 * Deshabilitado (solo aplica cuando se usa como botón):
 *   < PrimaryButton label="Guardando..." onClick={handleClick} disabled />
 *
 * Nota: `href` y `onClick` son mutuamente excluyentes — TypeScript no permite pasar los dos a la vez.
 */

export function PrimaryButton({
  label,
  disabled,
  onClick,
  href,
}: PrimaryButtonProps) {
  if (href) {
    return (
      <Link to={href} className="primary-btn">
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="primary-btn"
      onClick={onClick}
      disabled={disabled}>
      {label}
    </button>
  );
}
