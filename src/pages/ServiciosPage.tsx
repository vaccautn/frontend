import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { IconCalendarHeart } from "@tabler/icons-react";
import { BotonAgregar } from "@/components/ui/BotonAgregar";
import { useServiciosFiltros } from "@/features/servicios/hooks/useServiciosFiltros";
import { useServiciosDashboard } from "@/features/servicios/hooks/useServiciosDashboard";
import { pendientesPorServicio } from "@/features/servicios/utils/servicioEstado";
import { ServiciosTimeline } from "@/features/servicios/components/timeline/ServiciosTimeline";
import { ServiciosListaPanel } from "@/features/servicios/components/list/ServiciosListaPanel";
import { ServicioResumenPanel } from "@/features/servicios/components/resumen/ServicioResumenPanel";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import "@/features/servicios/components/servicios.css";

type NavigationState = {
  refresh?: boolean;
  seleccionarId?: number | null;
  expandir?: boolean;
};

export function ServiciosPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { estado, fechaDesde, fechaHasta, setEstado, setFechaDesde, setFechaHasta } =
    useServiciosFiltros();
  const dashboard = useServiciosDashboard();
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [detalleExpandido, setDetalleExpandido] = useState(false);

  useEffect(() => {
    const state = location.state as NavigationState | null;
    if (state?.refresh) dashboard.refetch();
    if (state?.seleccionarId != null) {
      setSeleccionadoId(state.seleccionarId);
      setDetalleExpandido(!!state.expandir);
    }
    // dashboard.refetch es estable (useCallback sin dependencias)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Servicios sin cancelar: un servicio CANCELADO no existe para el usuario,
  // no se muestra ni en la línea de tiempo ni en la lista.
  const servicios = useMemo(
    () => dashboard.servicios.filter((s) => s.estado !== "CANCELADO"),
    [dashboard.servicios],
  );

  // Selección por defecto: el servicio en curso (el que empezó primero, si
  // hay más de uno) o, si no hay ninguno, el planificado más próximo.
  const servicioPorDefectoId = useMemo(() => {
    const masProximo = (candidatos: typeof servicios) =>
      candidatos.reduce((a, b) => (a.fecha_inicio <= b.fecha_inicio ? a : b)).id;

    const enCurso = servicios.filter((s) => s.estado === "EN_CURSO");
    if (enCurso.length > 0) return masProximo(enCurso);

    const planificados = servicios.filter((s) => s.estado === "PLANIFICADO");
    if (planificados.length > 0) return masProximo(planificados);

    return null;
  }, [servicios]);

  useEffect(() => {
    if (seleccionadoId !== null || servicioPorDefectoId === null) return;
    setSeleccionadoId(servicioPorDefectoId);
  }, [servicioPorDefectoId, seleccionadoId]);

  const pendientes = pendientesPorServicio(
    dashboard.servicios,
    dashboard.resultados,
    dashboard.animalActivoIds,
  );

  // Desde la lista: solo selecciona (el panel queda colapsado, para hojear
  // varios servicios rápido).
  const seleccionarDesdeLista = (id: number) => {
    setSeleccionadoId(id);
    setDetalleExpandido(false);
  };

  // Desde el timeline, desde "ver otro servicio" dentro del detalle
  // expandido (origen/reservicio), o al volver de /servicios/:id: seleccionar
  // y abrir directo el detalle completo.
  const seleccionarYExpandir = (id: number) => {
    setSeleccionadoId(id);
    setDetalleExpandido(true);
  };

  const onEliminado = () => {
    setSeleccionadoId(null);
    setDetalleExpandido(false);
    dashboard.refetch();
  };

  return (
    <section>
      <div className="section-header">
        <div className="titulo-con-accion">
          <h1>Servicios</h1>
          <BotonAgregar
            icono={<IconCalendarHeart size={22} stroke={1.75} />}
            label="Planificar servicio"
            onClick={() => navigate("/servicios/nuevo")}
          />
        </div>
      </div>

      {dashboard.error && <p className="status-message error">{dashboard.error}</p>}

      {!dashboard.loading && !dashboard.error && (
        <>
          {!detalleExpandido && (
            <ServiciosTimeline
              servicios={servicios}
              seleccionadoId={seleccionadoId}
              onSelect={seleccionarYExpandir}
            />
          )}

          <div
            className={`servicios-cuerpo${detalleExpandido ? " servicios-cuerpo--expandido" : ""}`}>
            {!detalleExpandido && (
              <ServiciosListaPanel
                servicios={servicios}
                resultados={dashboard.resultados}
                pendientesPorServicioId={pendientes}
                seleccionadoId={seleccionadoId}
                onSelect={seleccionarDesdeLista}
                estado={estado}
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                onEstadoChange={setEstado}
                onFechaDesdeChange={setFechaDesde}
                onFechaHastaChange={setFechaHasta}
              />
            )}
            <ServicioResumenPanel
              servicioId={seleccionadoId}
              expandido={detalleExpandido}
              onToggleExpandido={() => setDetalleExpandido((v) => !v)}
              onEliminado={onEliminado}
              onVerServicio={seleccionarYExpandir}
            />
          </div>
        </>
      )}

      {dashboard.loading && <p>Cargando...</p>}

      <Outlet />
    </section>
  );
}
