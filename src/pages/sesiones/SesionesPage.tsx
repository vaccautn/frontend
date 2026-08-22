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
import "@/pages/animales/animales.css";
import "./sesiones.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { SesionesFiltros } from "./SesionesFiltros";
import { formatEventDateTime, localNaiveNow } from "@/utils/localDateTime";
import { ApiError } from "@/services/httpClient";

const PAGE_SIZE = 20;

const CC_VALORES = ["1", "2", "3", "4", "5"] as const;

const ESTADO_LABELS: Record<string, string> = {
  ABIERTA: "Abierta",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

export function SesionesPage() {
  const [sesiones, setSesiones] = useState<SesionCapturaConResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [sesionAbierta, setSesionAbierta] = useState<number | null>(null);
  const [sesionAEliminar, setSesionAEliminar] = useState<SesionCapturaConResumen | null>(null);
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

  const confirmarEliminacion = async () => {
    if (!sesionAEliminar) return;
    try {
      await eliminarSesion(sesionAEliminar.id);
      toast.success("Sesion descartada correctamente.");
      setSesionAEliminar(null);
      fetchSesiones();
    } catch {
      toast.error("No se pudo eliminar la sesion.");
    }
  };

  const abrirDetalle = (sesion: SesionCapturaConResumen) => {
    if (sesion.estado === "CERRADA") {
      navigate(`/sesiones/${sesion.id}`);
    }
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    sesion: SesionCapturaConResumen,
  ) => {
    if (
      sesion.estado === "CERRADA" &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      abrirDetalle(sesion);
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
                <Table.ColumnHeader>Acciones</Table.ColumnHeader>
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
                  <Table.Cell colSpan={6 + CC_VALORES.length}>
                    No se encontraron sesiones con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                sesiones.map((sesion) => (
                  <Table.Row
                    key={sesion.id}
                    className={`animales-table__row sesiones-table__row${
                      sesion.estado === "CERRADA"
                        ? " sesiones-table__row--interactive"
                        : " sesiones-table__row--static"
                    }`}
                    tabIndex={sesion.estado === "CERRADA" ? 0 : undefined}
                    role={sesion.estado === "CERRADA" ? "link" : undefined}
                    aria-label={
                      sesion.estado === "CERRADA"
                        ? `Ver evaluaciones de la sesión ${sesion.id}`
                        : undefined
                    }
                    onClick={() => abrirDetalle(sesion)}
                    onKeyDown={(event) => handleRowKeyDown(event, sesion)}>
                    <Table.Cell>
                      {formatEventDateTime(sesion.fecha_inicio)}
                    </Table.Cell>
                    <Table.Cell>
                      {sesion.estado === "ABIERTA" && (
                        <Button size="xs" onClick={(event) => { event.stopPropagation(); navigate(`/sesiones/${sesion.id}/cargar`); }}>
                          <IconPencil size={15} /> Editar
                        </Button>
                      )}
                      {sesion.estado !== "CANCELADA" && (
                        <Button size="xs" colorPalette="red" onClick={(event) => { event.stopPropagation(); setSesionAEliminar(sesion); }}>
                          <IconTrash size={15} /> Eliminar
                        </Button>
                      )}
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
      <Dialog.Root open={sesionAbierta !== null} onOpenChange={(details) => !details.open && setSesionAbierta(null)}>
        <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Header><Dialog.Title>Hay una sesion abierta</Dialog.Title></Dialog.Header><Dialog.Body>Queres continuar editandola o descartarla para iniciar una nueva?</Dialog.Body><Dialog.Footer><Button onClick={() => sesionAbierta !== null && navigate(`/sesiones/${sesionAbierta}/cargar`)}>Continuar editando</Button><Button colorPalette="red" onClick={descartarEIniciar}>Descartar e iniciar nueva</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal>
      </Dialog.Root>
      <Dialog.Root open={sesionAEliminar !== null} onOpenChange={(details) => !details.open && setSesionAEliminar(null)}>
        <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Header><Dialog.Title>Eliminar sesion</Dialog.Title></Dialog.Header><Dialog.Body>Se descartaran todas las evaluaciones de esta sesion.</Dialog.Body><Dialog.Footer><Button onClick={() => setSesionAEliminar(null)}>Cancelar</Button><Button colorPalette="red" onClick={confirmarEliminacion}>Eliminar</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal>
      </Dialog.Root>
    </section>
  );
}
