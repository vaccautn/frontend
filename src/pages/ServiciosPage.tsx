import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Table } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { getServicios } from "@/features/servicios/services/serviciosService";
import type { ServicioRead } from "@/features/servicios/types";
import { useServiciosFiltros } from "@/features/servicios/hooks/useServiciosFiltros";
import { ServiciosFiltros } from "@/features/servicios/components/ServiciosFiltros";
import { ESTADO_SERVICIO_LABELS } from "@/features/servicios/constants";
import { ServiciosDashboard } from "@/features/servicios/components/dashboard/ServiciosDashboard";
import { useServiciosDashboard } from "@/features/servicios/hooks/useServiciosDashboard";
import { pendientesPorServicio } from "@/features/servicios/utils/servicioEstado";
import { formatFecha } from "@/features/animales/utils/formatDate";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import "@/features/servicios/components/servicios.css";

export function ServiciosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [servicios, setServicios] = useState<ServicioRead[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");

  const {
    estado,
    fechaDesde,
    fechaHasta,
    setEstado,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
    params,
  } = useServiciosFiltros();
  const dashboard = useServiciosDashboard();
  // Sale de los datos del dashboard (servicios sin filtrar), así un filtro
  // que deja afuera a los reservicios no cambia los indicadores.
  const pendientes = pendientesPorServicio(
    dashboard.servicios,
    dashboard.resultados,
    dashboard.animalActivoIds,
  );

  const fetchServicios = useCallback(() => {
    setRefetching(true);
    setError("");
    getServicios(params)
      .then(setServicios)
      .catch(() => setError("No se pudieron cargar los servicios."))
      .finally(() => {
        setRefetching(false);
        setInitialLoading(false);
      });
  }, [params]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchServicios();
      dashboard.refetch();
    }
    // dashboard.refetch es estable (useCallback sin dependencias)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, fetchServicios]);

  // Para mostrar "Reservicio de <original>". Si un filtro deja afuera al
  // servicio original, la etiqueta queda solo como "Reservicio".
  const nombreServicioPorId = new Map(
    servicios.map((s) => [s.id, s.nombre || `Servicio #${s.id}`]),
  );

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    servicio: ServicioRead,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/servicios/${servicio.id}`);
    }
  };

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Servicios</h1>
        </div>
        <Button colorPalette="brand" onClick={() => navigate("/servicios/nuevo")}>
          <IconPlus size={18} stroke={1.5} />
          Agregar servicio
        </Button>
      </div>

      <ServiciosDashboard data={dashboard} />

      <ServiciosFiltros
        estado={estado}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onEstadoChange={setEstado}
        onFechaDesdeChange={setFechaDesde}
        onFechaHastaChange={setFechaHasta}
        onClear={clearFilters}
      />

      {initialLoading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!initialLoading && !error && (
        <div
          className="animales-table__wrapper servicios-table__wrapper"
          style={{
            opacity: refetching ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}>
          <Table.Root className="animales-table" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                <Table.ColumnHeader>Período</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
                <Table.ColumnHeader>Pendientes</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {servicios.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    No se encontraron servicios con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                servicios.map((servicio) => (
                  <Table.Row
                    key={servicio.id}
                    className="animales-table__row"
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver detalle del servicio ${servicio.nombre || `#${servicio.id}`}`}
                    onClick={() => navigate(`/servicios/${servicio.id}`)}
                    onKeyDown={(event) => handleRowKeyDown(event, servicio)}>
                    <Table.Cell>
                      {servicio.nombre || `Servicio #${servicio.id}`}
                      {servicio.servicio_origen_id !== null && (
                        <span className="servicios-table__reservicio">
                          {nombreServicioPorId.has(servicio.servicio_origen_id)
                            ? `Reservicio de ${nombreServicioPorId.get(servicio.servicio_origen_id)}`
                            : "Reservicio"}
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="servicios-table__periodo">
                      {formatFecha(servicio.fecha_inicio)} –{" "}
                      {servicio.fecha_fin ? formatFecha(servicio.fecha_fin) : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className={`servicio-badge servicio-badge--${servicio.estado}`}>
                        {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="servicios-table__pendientes">
                        {pendientes.get(servicio.id)?.resultados && (
                          <span className="servicio-alerta">
                            Resultados por cargar
                          </span>
                        )}
                        {pendientes.get(servicio.id)?.reservicio && (
                          <span className="servicio-alerta servicio-alerta--reservicio">
                            Reservicio por iniciar
                          </span>
                        )}
                        {!pendientes.get(servicio.id)?.resultados &&
                          !pendientes.get(servicio.id)?.reservicio && (
                            <span className="servicios-table__sin-pendientes">
                              —
                            </span>
                          )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
      )}

      <Outlet />
    </section>
  );
}
