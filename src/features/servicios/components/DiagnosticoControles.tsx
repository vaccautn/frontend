import { NativeSelect } from "@chakra-ui/react";
import { TIPOS_PRENEZ } from "@/features/servicios/constants";
import type {
  EstadoResultadoCargable,
  TipoPrenez,
} from "@/features/servicios/types";
import type { Diagnostico } from "@/features/servicios/utils/diagnostico";

const OPCIONES_DIAGNOSTICO: { value: EstadoResultadoCargable; label: string }[] =
  [
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "PRENADA", label: "Preñada" },
    { value: "VACIA", label: "Vacía" },
  ];

type Props = {
  resultadoId: number;
  caravana: string;
  diagnostico: Diagnostico;
  mostrarErrorTipo: boolean;
  onChange: (cambio: Partial<Diagnostico>) => void;
};

/** Pendiente / Preñada / Vacía y, si está preñada, el tipo de preñez. El
 * lugar del tipo queda reservado siempre para que las opciones no se muevan
 * al elegir "Preñada". */
export function DiagnosticoControles({
  resultadoId,
  caravana,
  diagnostico,
  mostrarErrorTipo,
  onChange,
}: Props) {
  return (
    <div className="diagnostico">
      <div
        className="diagnostico__opciones"
        role="radiogroup"
        aria-label={`Diagnóstico de la vaca ${caravana}`}>
        {OPCIONES_DIAGNOSTICO.map(({ value, label }) => (
          <label
            key={value}
            className={`diagnostico__opcion${
              diagnostico.estado === value
                ? ` diagnostico__opcion--activa diagnostico__opcion--${value}`
                : ""
            }`}>
            <input
              type="radio"
              name={`diagnostico-${resultadoId}`}
              value={value}
              checked={diagnostico.estado === value}
              onChange={() => onChange({ estado: value })}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="diagnostico__tipo">
        {diagnostico.estado === "PRENADA" && (
          <NativeSelect.Root size="sm" invalid={mostrarErrorTipo}>
            <NativeSelect.Field
              aria-label={`Tipo de preñez de la vaca ${caravana}`}
              title={mostrarErrorTipo ? "Elegí el tipo de preñez." : undefined}
              bg="var(--panel)"
              value={diagnostico.tipo}
              onChange={(event) =>
                onChange({ tipo: event.target.value as TipoPrenez | "" })
              }>
              <option value="">Tipo de preñez</option>
              {TIPOS_PRENEZ.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}
      </div>
    </div>
  );
}
