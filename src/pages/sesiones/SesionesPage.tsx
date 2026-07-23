import { useCallback, useEffect, useRef, useState } from "react";
import { Table, Button, Spinner } from "@chakra-ui/react";
import {
  crearSesion,
  getSesionesConResumen,
} from "@/features/sesiones/services/sesionesService";
import type { SesionCaptura } from "@/features/sesiones/types";
import { useSesionesFiltros } from "@/features/sesiones/hooks/useSesionesFiltros";
import "@/pages/animales/animales.css";
import "./sesiones.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconPlus } from "@tabler/icons-react";
import { SesionesFiltros } from "./SesionesFiltros";

const PAGE_SIZE = 20;

const CC_VALORES = ["1", "2", "3", "4", "5"] as const;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const {
    estado,
    fechaDesde,
    fechaHasta,
    params,
    setEstado,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
  } = useSesionesFiltros();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  const handleIniciarSesion = async () => {
    setIsStarting(true);
    try {
      const nuevaSesion = await crearSesion();
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch {
      toast.error("No se pudo iniciar la sesion de evaluacion.");
    } finally {
      setIsStarting(false);
    }
  };

  const fetchSesiones = useCallback(() => {
    setLoading(true);
    setError("");
    getSesionesConResumen({ ...params, limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        setSesiones(res.items);
        setHasMore(res.has_more);
        setNextOffset(res.next_offset);
      })
      .catch(() => setError("No se pudieron cargar las sesiones."))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchSesiones();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchSesiones]);

  const cargarMas = useCallback(() => {
    if (loadingMoreRef.current || !hasMore || nextOffset === null) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    getSesionesConResumen({ ...params, limit: PAGE_SIZE, offset: nextOffset })
      .then((res) => {
        setSesiones((prev) => [...prev, ...res.items]);
        setHasMore(res.has_more);
        setNextOffset(res.next_offset);
      })
      .catch(() => toast.error("No se pudieron cargar mas sesiones."))
      .finally(() => {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      });
  }, [hasMore, nextOffset, params]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cargarMas();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cargarMas]);

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Sesiones de evaluacion</h1>
        </div>
        <Button
          colorPalette="brand"
          onClick={handleIniciarSesion}
          loading={isStarting}>
          <IconPlus size={18} stroke={1.5} />
          Iniciar sesion de evaluacion
        </Button>
      </div>

      <SesionesFiltros
        estado={estado}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onEstadoChange={setEstado}
        onFechaDesdeChange={setFechaDesde}
        onFechaHastaChange={setFechaHasta}
        onClear={clearFilters}
      />

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
                <Table.ColumnHeader>Moda CC</Table.ColumnHeader>
                <Table.ColumnHeader>Rango</Table.ColumnHeader>
                {CC_VALORES.map((v) => (
                  <Table.ColumnHeader
                    key={v}
                    className="sesiones-table__cc-header">
                    CC {v}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sesiones.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5 + CC_VALORES.length}>
                    No se encontraron sesiones con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                sesiones.map((sesion) => (
                  <Table.Row key={sesion.id} className="animales-table__row">
                    <Table.Cell>
                      {DATE_TIME_FORMATTER.format(new Date(sesion.fecha_inicio))}
                    </Table.Cell>
                    <Table.Cell>
                      {ESTADO_LABELS[sesion.estado] ?? sesion.estado}
                    </Table.Cell>
                    <Table.Cell>{sesion.evaluaciones_count}</Table.Cell>
                    <Table.Cell>{sesion.valor_cc_moda ?? "-"}</Table.Cell>
                    <Table.Cell>
                      {sesion.valor_cc_min !== null &&
                      sesion.valor_cc_max !== null
                        ? `${sesion.valor_cc_min} - ${sesion.valor_cc_max}`
                        : "-"}
                    </Table.Cell>
                    {CC_VALORES.map((v) => (
                      <Table.Cell key={v} className="sesiones-table__cc-cell">
                        {sesion.distribucion[v] ?? 0}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>

          {hasMore && (
            <div ref={sentinelRef} className="sesiones-table__sentinel">
              {loadingMore && <Spinner size="sm" />}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
