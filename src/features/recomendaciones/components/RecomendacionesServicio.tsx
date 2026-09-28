import { useCallback, useEffect, useState } from "react";
import { Input } from "@chakra-ui/react";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { getRecomendacionesServicio } from "../services/recomendacionesService";
import type { RecomendacionesServicio as Datos } from "../types";
import { RecomendacionesPanel } from "./RecomendacionesPanel";

const DIAS_POR_DEFECTO = 30;

/** Preservicio de un servicio: última CC de cada vaca dentro de los últimos
 * N días (S20), editable por el productor. */
export function RecomendacionesServicio({ servicioId }: { servicioId: number }) {
  const [diasInput, setDiasInput] = useState(String(DIAS_POR_DEFECTO));
  const [dias, setDias] = useState(DIAS_POR_DEFECTO);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setError("");
    getRecomendacionesServicio(servicioId, dias)
      .then(setDatos)
      .catch(() => setError("No se pudieron cargar las recomendaciones."))
      .finally(() => setLoading(false));
  }, [servicioId, dias]);

  useEffect(() => {
    const timer = window.setTimeout(cargar, 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  const aplicarDias = () => {
    const valor = Number(diasInput);
    if (Number.isInteger(valor) && valor >= 1) setDias(valor);
    else setDiasInput(String(dias));
  };

  const controles = (
    <div className="recomendaciones__ventana">
      <label htmlFor={`dias-cc-${servicioId}`}>CC de los últimos</label>
      <Input
        id={`dias-cc-${servicioId}`}
        type="number"
        min={1}
        size="sm"
        width="5rem"
        value={diasInput}
        onChange={(event) => setDiasInput(event.target.value)}
        onBlur={aplicarDias}
        onKeyDown={(event) => {
          if (event.key === "Enter") aplicarDias();
        }}
      />
      <span>días</span>
      {datos && (
        <span className="recomendaciones__periodo">
          ({formatFecha(datos.desde)} al {formatFecha(datos.fecha_referencia)})
        </span>
      )}
    </div>
  );

  return (
    <RecomendacionesPanel
      vacas={datos?.vacas ?? []}
      loading={loading}
      error={error}
      mostrarSinCc
      controles={controles}
      onDecidido={cargar}
    />
  );
}
