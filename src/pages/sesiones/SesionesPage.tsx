import { useCallback, useEffect, useState } from "react";
import { Table, Button } from "@chakra-ui/react";
import { getSesionesConResumen } from "@/features/sesiones/services/sesionesService";
import type { SesionCaptura } from "@/features/sesiones/types";
import { SesionCCHistograma } from "./SesionCCHistograma";
import "@/pages/animales/animales.css";
import "./sesiones.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconPlus } from "@tabler/icons-react";
import { crearSesion } from "@/features/sesiones/services/sesionesService";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const ESTADO_LABELS: Record<string, string> = {
  ABIERTA: "Abierta",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

export function SesionesPage() {
  const [sesiones, setSesiones] = useState<SesionCaptura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleIniciarSesion = async () => {
    setIsStarting(true);
    try {
      const nuevaSesion = await crearSesion();
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch {
      toast.error("No se pudo iniciar la sesión de evaluación.");
    } finally {
      setIsStarting(false);
    }
  };

  const fetchSesiones = useCallback(() => {
    setLoading(true);
    setError("");
    getSesionesConResumen()
      .then(setSesiones)
      .catch(() => setError("No se pudieron cargar las sesiones."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Sesiones de evaluación</h1>
        </div>
        <Button
          colorPalette="brand"
          onClick={handleIniciarSesion}
          loading={isStarting}>
          <IconPlus size={18} stroke={1.5} />
          Iniciar sesión de evaluación
        </Button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && (
        <div className="animales-table__wrapper">
          <Table.Root className="animales-table" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
                <Table.ColumnHeader>Evaluaciones</Table.ColumnHeader>
                <Table.ColumnHeader>Mediana CC</Table.ColumnHeader>
                <Table.ColumnHeader>Rango</Table.ColumnHeader>
                <Table.ColumnHeader>Distribución</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sesiones.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    No se encontraron sesiones registradas.
                  </Table.Cell>
                </Table.Row>
              ) : (
                sesiones.map((sesion) => (
                  <Table.Row key={sesion.id} className="animales-table__row">
                    <Table.Cell>
                      {DATE_TIME_FORMATTER.format(
                        new Date(sesion.fecha_inicio),
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {ESTADO_LABELS[sesion.estado] ?? sesion.estado}
                    </Table.Cell>
                    <Table.Cell>{sesion.evaluaciones_count}</Table.Cell>
                    <Table.Cell>{sesion.valor_cc_mediana ?? "—"}</Table.Cell>
                    <Table.Cell>
                      {sesion.valor_cc_min !== null &&
                      sesion.valor_cc_max !== null
                        ? `${sesion.valor_cc_min} – ${sesion.valor_cc_max}`
                        : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <SesionCCHistograma distribucion={sesion.distribucion} />
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
      )}
    </section>
  );
}
