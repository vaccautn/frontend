import { useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import { useServiciosFiltros } from "@/features/servicios/hooks/useServiciosFiltros";
import { useServiciosDashboard } from "@/features/servicios/hooks/useServiciosDashboard";
import { pendientesPorServicio } from "@/features/servicios/utils/servicioEstado";
import { ServiciosTimeline } from "@/features/servicios/components/timeline/ServiciosTimeline";
import { ServiciosListaPanel } from "@/features/servicios/components/list/ServiciosListaPanel";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import "@/features/servicios/components/servicios.css";

export function ServiciosPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { estado, fechaDesde, fechaHasta, setEstado, setFechaDesde, setFechaHasta } =
    useServiciosFiltros();
  const dashboard = useServiciosDashboard();

  useEffect(() => {
    if (location.state?.refresh) dashboard.refetch();
    // dashboard.refetch es estable (useCallback sin dependencias)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Servicios sin cancelar: un servicio CANCELADO no existe para el usuario,
  // no se muestra ni en la línea de tiempo ni en la lista.
  const servicios = useMemo(
    () => dashboard.servicios.filter((s) => s.estado !== "CANCELADO"),
    [dashboard.servicios],
  );

  const pendientes = pendientesPorServicio(
    dashboard.servicios,
    dashboard.resultados,
    dashboard.animalActivoIds,
  );

  const irAlDetalle = (id: number) => navigate(`/servicios/${id}`);

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Servicios</h1>
        </div>
        <Button colorPalette="brand" onClick={() => navigate("/servicios/nuevo")}>
          <IconPlus size={18} stroke={1.5} />
          Planificar servicio
        </Button>
      </div>

      {dashboard.error && <p className="status-message error">{dashboard.error}</p>}

      {!dashboard.loading && !dashboard.error && (
        <>
          <ServiciosTimeline servicios={servicios} seleccionadoId={null} onSelect={irAlDetalle} />

          <ServiciosListaPanel
            servicios={servicios}
            resultados={dashboard.resultados}
            pendientesPorServicioId={pendientes}
            seleccionadoId={null}
            onSelect={irAlDetalle}
            estado={estado}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onEstadoChange={setEstado}
            onFechaDesdeChange={setFechaDesde}
            onFechaHastaChange={setFechaHasta}
          />
        </>
      )}

      {dashboard.loading && <p>Cargando...</p>}

      <Outlet />
    </section>
  );
}
