import { useState } from "react";
import { Badge } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { cambiarRolToro } from "../../services/serviciosService";
import type { EstadoServicio, ToroServicio } from "../../types";
import { ToroIcon } from "@/utils/icons";
import { ToroRolBadge } from "./ToroRolBadge";
import { ToroReemplazarDialog } from "./ToroReemplazarDialog";
import { ToroCambioLog } from "./ToroCambioLog";

type Props = {
  servicioId: number;
  estado: EstadoServicio;
  toros: ToroServicio[];
  loading: boolean;
  onChanged: (toros: ToroServicio[]) => void;
};

export function ServicioTorosTabla({ servicioId, estado, toros, loading, onChanged }: Props) {
  const [abierto, setAbierto] = useState(estado === "PLANIFICADO" || estado === "EN_CURSO");
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);
  const [reemplazarToroId, setReemplazarToroId] = useState<number | null>(null);

  const activos = toros.filter((t) => t.participacion.estado !== "BAJA");
  const repuestos = toros.filter((t) => t.participacion.estado === "REPUESTO");
  const toroAReemplazar = toros.find((t) => t.animal.id === reemplazarToroId) ?? null;

  const handleToggle = async (animalId: number, nuevoEstado: "EN_SERVICIO" | "REPUESTO") => {
    setCambiandoId(animalId);
    try {
      const actualizado = await cambiarRolToro(servicioId, animalId, { estado: nuevoEstado });
      onChanged(toros.map((t) => (t.animal.id === animalId ? actualizado : t)));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "No se pudo cambiar el rol del toro.")
          : "No se pudo cambiar el rol del toro.",
      );
    } finally {
      setCambiandoId(null);
    }
  };

  return (
    <div className="servicio-detail__lotes-grupo">
      <button
        type="button"
        className="servicio-detail__lotes-grupo-header servicio-detail__toros-toggle"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}>
        <h2 className="servicio-detail__lotes-grupo-titulo">
          <ToroIcon />
          Toros
        </h2>
        <span className="servicio-detail__toros-resumen">
          <Badge colorPalette="brand">
            {loading ? "…" : activos.length === 1 ? "1 toro" : `${activos.length} toros`}
          </Badge>
          <IconChevronDown
            size={16}
            stroke={1.75}
            className={`animal-page__details-toggle-icon${abierto ? " animal-page__details-toggle-icon--open" : ""}`}
          />
        </span>
      </button>

      {abierto && (
        <>
          {loading && <p className="servicio-detail__lotes-vacio">Cargando toros...</p>}
          {!loading && toros.length === 0 && (
            <p className="servicio-detail__lotes-vacio">No hay toros asociados a este servicio.</p>
          )}
          {!loading && toros.length > 0 && (
            <div className="toros-tabla">
              <div className="toros-tabla__header">
                <span>Caravana</span>
                <span>Raza</span>
                <span>Lote</span>
                <span>Rol</span>
              </div>
              {toros.map((t) => (
                <div key={t.animal.id} className="toros-tabla__fila" data-baja={t.participacion.estado === "BAJA"}>
                  <span className="toros-tabla__caravana">{t.animal.caravana ?? `#${t.animal.id}`}</span>
                  <span>{t.animal.raza}</span>
                  <span className="toros-tabla__lote">{t.lote?.nombre ?? "—"}</span>
                  <span className="toros-tabla__rol">
                    {estado === "PLANIFICADO" && t.participacion.estado !== "BAJA" ? (
                      <div className="toro-rol-toggle">
                        <button
                          type="button"
                          data-activo={t.participacion.estado === "EN_SERVICIO"}
                          disabled={cambiandoId === t.animal.id}
                          onClick={() => handleToggle(t.animal.id, "EN_SERVICIO")}>
                          En servicio
                        </button>
                        <button
                          type="button"
                          data-activo={t.participacion.estado === "REPUESTO"}
                          disabled={cambiandoId === t.animal.id}
                          onClick={() => handleToggle(t.animal.id, "REPUESTO")}>
                          Repuesto
                        </button>
                      </div>
                    ) : (
                      <>
                        <ToroRolBadge estado={t.participacion.estado} />
                        {estado === "EN_CURSO" &&
                          t.participacion.estado === "EN_SERVICIO" &&
                          repuestos.length > 0 && (
                            <button
                              type="button"
                              className="toros-tabla__reemplazar"
                              onClick={() => setReemplazarToroId(t.animal.id)}>
                              Reemplazar
                            </button>
                          )}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <ToroCambioLog toros={toros} />
        </>
      )}

      {toroAReemplazar && (
        <ToroReemplazarDialog
          servicioId={servicioId}
          toroBaja={toroAReemplazar}
          repuestos={repuestos}
          open
          onClose={() => setReemplazarToroId(null)}
          onReemplazado={onChanged}
        />
      )}
    </div>
  );
}
