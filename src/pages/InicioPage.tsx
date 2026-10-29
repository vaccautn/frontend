import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@chakra-ui/react";
import { IconArrowRight } from "@tabler/icons-react";
import { getStoredUser } from "@/features/auth";
import { useMapaLotes } from "@/features/mapa/hooks/useMapaLotes";
import { useRecomendaciones } from "@/features/mapa/hooks/useRecomendaciones";
import { useAnimalesDashboard } from "@/features/animales/hooks/useAnimalesDashboard";
import { useVacasPrenadas } from "@/features/animales/hooks/useVacasPrenadas";
import { DashboardHistograma } from "@/features/animales/components/dashboard/DashboardHistograma";
import { DashboardEvolucion } from "@/features/animales/components/dashboard/DashboardEvolucion";
import { RodeoLoteSelector } from "@/features/rodeo/components/DashboardCompleto/RodeoLoteSelector";
import { RodeoResumenCompacto } from "@/features/rodeo/components/Resumen/RodeoResumenCompacto";
import { RodeoMovimientosCard } from "@/features/rodeo/components/Resumen/RodeoMovimientosCard";
import { SesionDashboard } from "@/features/sesiones/components/dashboard/SesionDashboard";
import { useSesionDashboard } from "@/features/sesiones/hooks/useSesionDashboard";
import { getTodasLasSesionesConResumen } from "@/features/sesiones/services/sesionesService";
import type { SesionCapturaConResumen } from "@/features/sesiones/types";
import { getRecomendacionesSesion } from "@/features/recomendaciones/services/recomendacionesService";
import type { AptitudVaca } from "@/features/recomendaciones/types";
import { formatEventDate } from "@/utils/localDateTime";
import "@/features/rodeo/rodeo.css";
import "@/features/sesiones/components/sesiones.css";
import "./inicio.css";

/** Inicio: las estadísticas generales del rodeo y las de la última sesión
 * de evaluación cerrada. */
export function InicioPage() {
  const user = getStoredUser();
  const navigate = useNavigate();

  const { features } = useMapaLotes();
  const {
    movimientos,
    loading: cargandoMovimientos,
    refetch: refetchMovimientos,
  } = useRecomendaciones();

  const [loteId, setLoteId] = useState<number | null>(null);
  const lotes = useMemo(() => features.map((f) => f.properties), [features]);
  const lote = lotes.find((l) => l.id === loteId) ?? null;
  const totalHa = lotes.reduce((suma, l) => suma + (l.superficie_ha ?? 0), 0);
  const totalAnimales = lotes.reduce((suma, l) => suma + l.cantidad_animales, 0);

  const { data: dashboard, loading: loadingDashboard } =
    useAnimalesDashboard(loteId);
  const { count: vacasPrenadas, loading: loadingVacasPrenadas } =
    useVacasPrenadas(loteId);

  // El histograma agrega evaluaciones de cualquier mes; el semáforo se
  // resuelve con el mes de la evaluación más reciente.
  const evolucion = dashboard?.evolucion ?? [];
  const fechaReferencia =
    evolucion.length > 0
      ? `${evolucion[evolucion.length - 1].periodo}-01`
      : new Date().toISOString();

  const [ultimaSesion, setUltimaSesion] =
    useState<SesionCapturaConResumen | null>(null);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [errorSesiones, setErrorSesiones] = useState("");
  useEffect(() => {
    getTodasLasSesionesConResumen({ estado: "CERRADA" })
      .then((sesiones) =>
        setUltimaSesion(
          [...sesiones].sort((a, b) =>
            b.fecha_inicio.localeCompare(a.fecha_inicio),
          )[0] ?? null,
        ),
      )
      .catch(() => setErrorSesiones("No se pudo cargar la última sesión."))
      .finally(() => setCargandoSesiones(false));
  }, []);

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="inicio">
      <header className="inicio__header">
        <span className="inicio__fecha">{hoy}</span>
        <h1>{user ? `Hola, ${user.nombre}` : "Inicio"}</h1>
      </header>

      <section className="inicio__seccion" aria-labelledby="inicio-rodeo">
        <div className="inicio__seccion-header">
          <h2 id="inicio-rodeo">Rodeo</h2>
          <RodeoLoteSelector
            lotes={lotes}
            loteSeleccionadoId={loteId}
            totalAnimales={totalAnimales}
            onSelect={setLoteId}
          />
        </div>

        <div className="inicio__rodeo">
          <RodeoResumenCompacto
            lote={lote}
            totalLotes={lotes.length}
            totalHa={totalHa}
            dashboard={dashboard}
            loadingDashboard={loadingDashboard}
            vacasPrenadas={vacasPrenadas}
            loadingVacasPrenadas={loadingVacasPrenadas}
          />
          <RodeoMovimientosCard
            movimientos={movimientos}
            loading={cargandoMovimientos}
            onRefrescar={refetchMovimientos}
          />
          <Box className="rodeo-dashboard-full__card">
            <DashboardHistograma
              histograma={dashboard?.histograma ?? []}
              loading={loadingDashboard}
              fecha={fechaReferencia}
            />
          </Box>
          <Box className="rodeo-dashboard-full__card">
            <DashboardEvolucion evolucion={evolucion} loading={loadingDashboard} />
          </Box>
        </div>
      </section>

      <section className="inicio__seccion" aria-labelledby="inicio-sesion">
        <div className="inicio__seccion-header">
          <div>
            <h2 id="inicio-sesion">Última sesión de evaluación</h2>
            {ultimaSesion && (
              <p className="inicio__seccion-meta">
                {formatEventDate(ultimaSesion.fecha_inicio)} ·{" "}
                {ultimaSesion.evaluaciones_count}{" "}
                {ultimaSesion.evaluaciones_count === 1
                  ? "evaluación"
                  : "evaluaciones"}
              </p>
            )}
          </div>
          {ultimaSesion && (
            <Button
              variant="outline"
              bg="var(--panel)"
              onClick={() => navigate(`/sesiones?sesion=${ultimaSesion.id}`)}>
              Ver sesión
              <IconArrowRight size={16} stroke={1.75} />
            </Button>
          )}
        </div>

        {cargandoSesiones && <p className="inicio__vacio">Cargando…</p>}
        {errorSesiones && <p className="status-message error">{errorSesiones}</p>}
        {!cargandoSesiones && !errorSesiones && !ultimaSesion && (
          <p className="inicio__vacio">Todavía no hay sesiones cerradas.</p>
        )}
        {ultimaSesion && <UltimaSesionDashboard sesion={ultimaSesion} />}
      </section>
    </section>
  );
}

/** Mismo dashboard que el detalle de la sesión, con las vacas que todavía
 * tienen una recomendación pendiente. */
function UltimaSesionDashboard({ sesion }: { sesion: SesionCapturaConResumen }) {
  const dashboard = useSesionDashboard(sesion.id);
  const [pendientes, setPendientes] = useState<AptitudVaca[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(true);

  useEffect(() => {
    getRecomendacionesSesion(sesion.id)
      .then((vacas) =>
        setPendientes(
          vacas.filter((vaca) =>
            vaca.recomendaciones.some((r) => r.estado === "PENDIENTE"),
          ),
        ),
      )
      .catch(() => setPendientes([]))
      .finally(() => setCargandoPendientes(false));
  }, [sesion.id]);

  return (
    <SesionDashboard
      data={dashboard.data}
      loading={dashboard.loading}
      error={dashboard.error}
      fecha={sesion.fecha_inicio}
      requierenMedida={pendientes}
      requierenMedidaLoading={cargandoPendientes}
    />
  );
}
