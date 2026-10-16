import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/** El detalle de servicio ya no es una pantalla aparte: vive embebido en
 * ServiciosPage (ver ServicioResumenPanel / ServicioDetalleCompleto). Esta
 * ruta se mantiene solo por compatibilidad con links existentes
 * (CrearReservicioPage, ServicioNuevoPage navegan acá tras crear un
 * servicio) — redirige a /servicios con ese servicio preseleccionado y
 * expandido. `replace: true` para que "atrás" no quede pegado acá. */
export function ServicioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const seleccionarId = id ? Number(id) : null;
    navigate("/servicios", {
      replace: true,
      state: {
        seleccionarId: Number.isInteger(seleccionarId) ? seleccionarId : null,
        expandir: true,
      },
    });
  }, [id, navigate]);

  return null;
}
