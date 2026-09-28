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
    }
  }, [location.state, fetchServicios]);

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

      <ServiciosDashboard />

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
          className="animales-table__wrapper"
          style={{
            opacity: refetching ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}>
          <Table.Root className="animales-table" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                <Table.ColumnHeader>Inicio</Table.ColumnHeader>
                <Table.ColumnHeader>Fin</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
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
                    <Table.Cell>{servicio.nombre || `Servicio #${servicio.id}`}</Table.Cell>
                    <Table.Cell>{formatFecha(servicio.fecha_inicio)}</Table.Cell>
                    <Table.Cell>
                      {servicio.fecha_fin ? formatFecha(servicio.fecha_fin) : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className={`servicio-badge servicio-badge--${servicio.estado}`}>
                        {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
                      </span>
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
