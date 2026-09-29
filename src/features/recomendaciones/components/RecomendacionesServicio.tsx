import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconAlertTriangle } from "@tabler/icons-react";
import { getRecomendacionesServicio } from "../services/recomendacionesService";
import type { AptitudVaca } from "../types";
import "./recomendaciones.css";

/** Ventana de CC que se mira para el preservicio (S20). */
const DIAS = 30;

/** Aviso en el detalle del servicio: vacas con recomendaciones pendientes.
 * Las recomendaciones se deciden desde la sesión donde se evaluó cada vaca.
 * Si no hay pendientes (o falla la consulta) no muestra nada. */
export function RecomendacionesServicio({ servicioId }: { servicioId: number }) {
  const [conPendientes, setConPendientes] = useState<AptitudVaca[]>([]);

  useEffect(() => {
    let cancelled = false;
    getRecomendacionesServicio(servicioId, DIAS)
      .then((datos) => {
        if (cancelled) return;
        setConPendientes(
          datos.vacas.filter((vaca) =>
            vaca.recomendaciones.some((r) => r.estado === "PENDIENTE"),
          ),
        );
      })
      .catch(() => {
        /* el aviso es informativo: si falla, no se muestra */
      });
    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  if (conPendientes.length === 0) return null;

  const cantidad = conPendientes.length;
  return (
    <div className="recomendaciones__alerta" role="status">
      <IconAlertTriangle size={20} stroke={1.75} />
      <div>
        <strong>
          {cantidad === 1
            ? "1 vaca con recomendación pendiente"
            : `${cantidad} vacas con recomendación pendiente`}
        </strong>
        <p>
          Revisalas desde la sesión donde se evaluaron:{" "}
          {conPendientes.map((vaca, i) => (
            <span key={vaca.animal.id}>
              {i > 0 && ", "}
              {vaca.evaluacion ? (
                <Link
                  to={`/sesiones/${vaca.evaluacion.sesion_id}`}
                  className="recomendaciones__alerta-link">
                  {vaca.animal.caravana ?? `#${vaca.animal.id}`}
                </Link>
              ) : (
                (vaca.animal.caravana ?? `#${vaca.animal.id}`)
              )}
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  );
}
