import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Table, Button, Dialog, Portal, Spinner } from "@chakra-ui/react";
import {
  crearSesion,
  eliminarSesion,
  getSesionesConResumen,
} from "@/features/sesiones/services/sesionesService";
import type { SesionCapturaConResumen } from "@/features/sesiones/types";
import { useSesionesFiltros } from "@/features/sesiones/hooks/useSesionesFiltros";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconPlus } from "@tabler/icons-react";
import { SesionesFiltros } from "../features/sesiones/components/SesionesFiltros";
import { formatEventDateTime, localNaiveNow } from "@/utils/localDateTime";
import { ApiError } from "@/services/httpClient";

const PAGE_SIZE = 20;

export function SesionesPage() {
  const [sesiones, setSesiones] = useState<SesionCapturaConResumen[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [sesionAbierta, setSesionAbierta] = useState<number | null>(null);
  const { fechaDesde, fechaHasta, params, setFechaDesde, setFechaHasta, clearFilters } =
    useSesionesFiltros();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  const handleIniciarSesion = async () => {
    setIsStarting(true);
    try {
      const nuevaSesion = await crearSesion({ fecha_inicio: localNaiveNow() });
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.data?.sesion_id) {
        setSesionAbierta(error.data.sesion_id);
      } else {
      toast.error("No se pudo iniciar la sesion de evaluacion.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  const descartarEIniciar = async () => {
    if (sesionAbierta === null) return;
    setIsStarting(true);
    try {
      await eliminarSesion(sesionAbierta);
      const nuevaSesion = await crearSesion({ fecha_inicio: localNaiveNow() });
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch {
      toast.error("No se pudo descartar la sesion abierta.");
    } finally {
      setIsStarting(false);
      setSesionAbierta(null);
    }
  };

  const esFilaNavegable = (sesion: SesionCapturaConResumen) =>
    sesion.estado === "ABIERTA" || sesion.estado === "CERRADA";

  const abrirDetalle = (sesion: SesionCapturaConResumen) => {
    if (sesion.estado === "CERRADA") {
      navigate(`/sesiones/${sesion.id}`);
    } else if (sesion.estado === "ABIERTA") {
      navigate(`/sesiones/${sesion.id}/cargar`);
    }
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    sesion: SesionCapturaConResumen,
  ) => {
    if (esFilaNavegable(sesion) && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      abrirDetalle(sesion);
    }
  };

  const fetchSesiones = useCallback(() => {
    setRefetching(true);
    setError("");
    getSesionesConResumen({ ...params, limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        setSesiones(res.items);
        setHasMore(res.has_more);
        setNextOffset(res.next_offset);
      })
      .catch(() => setError("No se pudieron cargar las sesiones."))
      .finally(() => {
        setRefetching(false);
        setInitialLoading(false);
      });
  }, [params]);

  useEffect(() => {
    fetchSesiones();
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
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
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
                <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                <Table.ColumnHeader>Evaluaciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sesiones.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={2}>
                    No se encontraron sesiones con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                sesiones.map((sesion) => {
                  const navegable = esFilaNavegable(sesion);
                  return (
                    <Table.Row
                      key={sesion.id}
                      className={`animales-table__row sesiones-table__row${
                        navegable ? " sesiones-table__row--interactive" : " sesiones-table__row--static"
                      }`}
                      tabIndex={navegable ? 0 : undefined}
                      role={navegable ? "link" : undefined}
                      aria-label={
                        navegable
                          ? sesion.estado === "CERRADA"
                            ? `Ver evaluaciones de la sesión ${sesion.id}`
                            : `Continuar cargando la sesión ${sesion.id}`
                          : undefined
                      }
                      onClick={() => abrirDetalle(sesion)}
                      onKeyDown={(event) => handleRowKeyDown(event, sesion)}>
                      <Table.Cell>
                        {formatEventDateTime(sesion.fecha_inicio)}
                      </Table.Cell>
                      <Table.Cell>{sesion.evaluaciones_count}</Table.Cell>
                    </Table.Row>
                  );
                })
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
      <Dialog.Root open={sesionAbierta !== null} onOpenChange={(details) => !details.open && setSesionAbierta(null)}>
        <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Header><Dialog.Title>Hay una sesion abierta</Dialog.Title></Dialog.Header><Dialog.Body>Queres continuar editandola o descartarla para iniciar una nueva?</Dialog.Body><Dialog.Footer><Button onClick={() => sesionAbierta !== null && navigate(`/sesiones/${sesionAbierta}/cargar`)}>Continuar editando</Button><Button colorPalette="red" onClick={descartarEIniciar}>Descartar e iniciar nueva</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal>
      </Dialog.Root>
    </section>
  );
}
