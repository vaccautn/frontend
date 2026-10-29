import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  NativeSelect,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import {
  IconChevronRight,
  IconClipboardCheck,
  IconEdit,
  IconRepeat,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  actualizarServicio,
  asociarLoteServicio,
  cargarResultadosServicio,
  desasociarLoteServicio,
  eliminarServicio,
} from "../../services/serviciosService";
import type { Animal } from "@/features/animales/types";
import type {
  EstadoServicio,
  ParticipanteServicio,
  ServicioLoteRead,
  ServicioLotesAgrupados,
  ServicioRead,
  ToroServicio,
} from "../../types";
import {
  ESTADO_RESULTADO_SERVICIO_LABELS,
  ESTADO_SERVICIO_LABELS,
  opcionesEstadoServicio,
  TIPO_PRENEZ_LABELS,
} from "../../constants";
import {
  validateServicioEditarForm,
  type ServicioEditarFieldErrors,
  type ServicioEditarValues,
} from "../../utils/serviciosValidation";
import {
  CATEGORIA_ANIMAL_LABELS,
  ESTADO_ANIMAL_LABELS,
} from "@/features/animales/constants";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { VacaIcon } from "@/utils/icons";
import { FechaInput } from "@/components/FechaInput";
import { Ficha, FichaFilas } from "@/components/ui/Ficha";
import { DiagnosticoControles } from "../DiagnosticoControles";
import { ServicioTorosTabla } from "../detail/ServicioTorosTabla";
import { ServicioPreservicioRecomendaciones } from "../detail/ServicioPreservicioRecomendaciones";
import { ServicioHistorialPorVaca } from "../detail/ServicioHistorialPorVaca";
import { esCargable, faltaTipo, type Diagnostico } from "../../utils/diagnostico";
import { localNaiveNow } from "@/utils/localDateTime";
import { toast } from "react-toastify";
import { useServicioDetalleExtra } from "../../hooks/useServicioDetalleExtra";

type Props = {
  servicioId: number;
  servicio: ServicioRead;
  lotes: ServicioLotesAgrupados | null;
  participantes: ParticipanteServicio[];
  toros: ToroServicio[];
  animalesPorLoteId: Map<number, Animal[]>;
  hayResultadosPendientes: boolean;
  /** Vuelve a pedir servicio/lotes/participantes/toros/animales al backend
   * (usado tras agregar/quitar un lote, que toca varios a la vez). */
  onRefetch: () => void;
  /** Actualiza puntualmente el servicio ya devuelto por el backend (editar,
   * cerrar) sin esperar un refetch completo. */
  onServicioActualizado: (servicio: ServicioRead) => void;
  /** Idem para participantes (cargar resultados de tacto). */
  onParticipantesActualizados: (participantes: ParticipanteServicio[]) => void;
  /** Idem para toros (cambio de rol / reemplazo, ya resuelto dentro de ServicioTorosTabla). */
  onTorosActualizados: (toros: ToroServicio[]) => void;
  /** El servicio se eliminó (pasó a CANCELADO): el panel vuelve a modo colapsado/sin selección. */
  onEliminado: () => void;
  /** Ver otro servicio relacionado (origen o un reservicio) sin navegar de página. */
  onVerServicio: (id: number) => void;
};

export function ServicioDetalleCompleto({
  servicioId,
  servicio,
  lotes,
  participantes,
  toros,
  animalesPorLoteId,
  hayResultadosPendientes,
  onRefetch,
  onServicioActualizado,
  onParticipantesActualizados,
  onTorosActualizados,
  onEliminado,
  onVerServicio,
}: Props) {
  const navigate = useNavigate();
  const extra = useServicioDetalleExtra(servicioId, servicio.servicio_origen_id);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<ServicioEditarValues | null>(null);
  const [editErrors, setEditErrors] = useState<ServicioEditarFieldErrors>({});
  const [editFormError, setEditFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [loteIdParaAgregar, setLoteIdParaAgregar] = useState("");
  const [isAgregandoLote, setIsAgregandoLote] = useState(false);
  const [loteIdQuitando, setLoteIdQuitando] = useState<number | null>(null);

  const [diagnosticos, setDiagnosticos] = useState<Map<number, Diagnostico> | null>(null);
  const [fechaDiagnostico, setFechaDiagnostico] = useState("");
  const [mostrarErroresResultados, setMostrarErroresResultados] = useState(false);
  const [resultadosError, setResultadosError] = useState("");
  const [isGuardandoResultados, setIsGuardandoResultados] = useState(false);

  const [isEliminarOpen, setIsEliminarOpen] = useState(false);
  const [isEliminando, setIsEliminando] = useState(false);
  const [isCerrando, setIsCerrando] = useState(false);

  const startEditing = () => {
    setEditValues({
      nombre: servicio.nombre,
      fecha_inicio: servicio.fecha_inicio,
      fecha_fin: servicio.fecha_fin ?? "",
      estado: servicio.estado,
      observaciones: servicio.observaciones,
    });
    setEditErrors({});
    setEditFormError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValues(null);
    setEditErrors({});
    setEditFormError("");
  };

  const setEditField = (field: keyof ServicioEditarValues, value: string) => {
    setEditValues((current) => (current ? { ...current, [field]: value } : current));
    setEditErrors((current) => ({ ...current, [field]: undefined }));
    setEditFormError("");
  };

  const updateEditField =
    (field: keyof ServicioEditarValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditField(field, event.target.value);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !editValues) return;

    const nextErrors = validateServicioEditarForm(editValues);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const actualizado = await actualizarServicio(servicio.id, {
        nombre: editValues.nombre.trim(),
        fecha_inicio: editValues.fecha_inicio,
        fecha_fin: editValues.fecha_fin,
        estado: editValues.estado as EstadoServicio,
        observaciones: editValues.observaciones.trim(),
      });
      onServicioActualizado(actualizado);
      toast.success("Servicio actualizado correctamente.");
      setIsEditing(false);
      setEditValues(null);
    } catch (error) {
      setEditFormError(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "Error al actualizar el servicio.")
          : "No se pudo actualizar el servicio. Probá nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const lotesAsociadosIds = new Set(
    [...(lotes?.vientres ?? []), ...(lotes?.toros ?? [])].map((l) => l.id),
  );
  const lotesDisponibles = extra.todosLosLotes.filter((l) => !lotesAsociadosIds.has(l.id));

  const handleAgregarLote = async () => {
    if (!loteIdParaAgregar) return;
    setIsAgregandoLote(true);
    try {
      await asociarLoteServicio(servicio.id, Number(loteIdParaAgregar));
      onRefetch();
      setLoteIdParaAgregar("");
      toast.success("Lote asociado al servicio.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo asociar el lote.",
      );
    } finally {
      setIsAgregandoLote(false);
    }
  };

  const handleQuitarLote = async (loteId: number) => {
    setLoteIdQuitando(loteId);
    try {
      await desasociarLoteServicio(servicio.id, loteId);
      onRefetch();
      toast.success("Lote desasociado del servicio.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo desasociar el lote.",
      );
    } finally {
      setLoteIdQuitando(null);
    }
  };

  const iniciarCargaResultados = () => {
    setDiagnosticos(
      new Map(
        participantes
          .filter((p) => esCargable(p.resultado.estado) && p.reservicio_id === null)
          .map((p) => [
            p.resultado.id,
            {
              estado: p.resultado.estado as Diagnostico["estado"],
              tipo: p.resultado.tipo_prenez ?? "",
            },
          ]),
      ),
    );
    setFechaDiagnostico(localNaiveNow().slice(0, 10));
    setMostrarErroresResultados(false);
    setResultadosError("");
  };

  const cancelarCargaResultados = () => {
    setDiagnosticos(null);
    setResultadosError("");
  };

  const actualizarDiagnostico = (resultadoId: number, cambio: Partial<Diagnostico>) => {
    setDiagnosticos((current) => {
      const actual = current?.get(resultadoId);
      if (!current || !actual) return current;
      const siguiente = { ...actual, ...cambio };
      if (siguiente.estado !== "PRENADA") siguiente.tipo = "";
      return new Map(current).set(resultadoId, siguiente);
    });
    setResultadosError("");
  };

  const handleGuardarResultados = async () => {
    if (!diagnosticos || isGuardandoResultados) return;
    setMostrarErroresResultados(true);

    if (!fechaDiagnostico) {
      setResultadosError("La fecha de diagnóstico es obligatoria.");
      return;
    }
    const sinTipo = [...diagnosticos.values()].filter(faltaTipo).length;
    if (sinTipo > 0) {
      setResultadosError(
        sinTipo === 1
          ? "Falta elegir el tipo de preñez de 1 vaca."
          : `Falta elegir el tipo de preñez de ${sinTipo} vacas.`,
      );
      return;
    }

    setIsGuardandoResultados(true);
    try {
      const actualizados = await cargarResultadosServicio(servicio.id, {
        fecha_diagnostico: fechaDiagnostico,
        resultados: [...diagnosticos.entries()].map(([resultadoId, { estado, tipo }]) => ({
          resultado_id: resultadoId,
          estado,
          ...(tipo ? { tipo_prenez: tipo } : {}),
        })),
      });
      onParticipantesActualizados(actualizados);
      setDiagnosticos(null);
      toast.success("Resultados guardados correctamente.");
    } catch (error) {
      setResultadosError(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "No se pudieron guardar los resultados.")
          : "No se pudieron guardar los resultados. Probá nuevamente.",
      );
    } finally {
      setIsGuardandoResultados(false);
    }
  };

  const handleEliminar = async () => {
    setIsEliminando(true);
    try {
      await eliminarServicio(servicio.id);
      toast.success("Servicio eliminado correctamente.");
      onEliminado();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo eliminar el servicio.",
      );
      setIsEliminando(false);
    }
  };

  const handleCerrarServicio = async () => {
    setIsCerrando(true);
    try {
      const actualizado = await actualizarServicio(servicio.id, { estado: "CERRADO" });
      onServicioActualizado(actualizado);
      toast.success("Servicio cerrado correctamente.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo cerrar el servicio.",
      );
    } finally {
      setIsCerrando(false);
    }
  };

  const puedeEliminar =
    servicio.estado === "PLANIFICADO" ||
    servicio.estado === "EN_CURSO" ||
    servicio.estado === "FINALIZADO";
  const puedeCerrar = servicio.estado === "FINALIZADO" && !hayResultadosPendientes;
  const puedeIniciarReservicio =
    servicio.estado === "FINALIZADO" &&
    servicio.servicio_origen_id === null &&
    participantes.some((p) => p.resultado.estado === "VACIA");

  return (
    <div className="servicio-detalle-completo">
      {extra.origen && (
        <p className="servicio-detalle-completo__origen">
          Reservicio de{" "}
          <button
            type="button"
            className="servicio-detail__link-btn"
            onClick={() => extra.origen && onVerServicio(extra.origen.id)}>
            {extra.origen.nombre || `Servicio #${extra.origen.id}`}
          </button>
        </p>
      )}

      <Ficha
        titulo="Ficha del servicio"
        abierta={isDetailsOpen}
        onAbiertaChange={(abierta) => {
          if (!abierta && isEditing) cancelEditing();
          setIsDetailsOpen(abierta);
        }}
        editando={isEditing}>
        {isEditing && editValues ? (
          <form onSubmit={handleSave} noValidate className="animal-edit-page__form">
            {editFormError && (
              <p
                className="status-message error animal-edit-page__field--full"
                role="alert">
                {editFormError}
              </p>
            )}

            <Field.Root invalid={!!editErrors.nombre}>
              <Field.Label>Nombre</Field.Label>
              <Input value={editValues.nombre} onChange={updateEditField("nombre")} />
              <Field.ErrorText>{editErrors.nombre}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!editErrors.estado}>
              <Field.Label>Estado</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={editValues.estado}
                  onChange={updateEditField("estado")}>
                  {opcionesEstadoServicio(servicio.estado).map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Field.ErrorText>{editErrors.estado}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!editErrors.fecha_inicio}>
              <Field.Label>Fecha de inicio</Field.Label>
              <FechaInput
                value={editValues.fecha_inicio}
                onChange={(value) => setEditField("fecha_inicio", value)}
              />
              <Field.ErrorText>{editErrors.fecha_inicio}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!editErrors.fecha_fin}>
              <Field.Label>Fecha de fin</Field.Label>
              <FechaInput
                value={editValues.fecha_fin}
                onChange={(value) => setEditField("fecha_fin", value)}
              />
              <Field.ErrorText>{editErrors.fecha_fin}</Field.ErrorText>
            </Field.Root>

            <Field.Root className="animal-edit-page__field--full">
              <Field.Label>Observaciones</Field.Label>
              <Textarea
                value={editValues.observaciones}
                onChange={updateEditField("observaciones")}
                rows={3}
              />
            </Field.Root>

            <div className="animal-edit-page__actions">
              <Button
                type="button"
                variant="outline"
                className="animal-form__cancel"
                onClick={cancelEditing}
                disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                colorPalette="brand"
                loading={isSaving}
                loadingText="Guardando...">
                Guardar cambios
              </Button>
            </div>
          </form>
        ) : (
          <>
            <FichaFilas
              filas={[
                { label: "Fecha de inicio", valor: formatFecha(servicio.fecha_inicio) },
                {
                  label: "Fecha de fin",
                  valor: servicio.fecha_fin ? formatFecha(servicio.fecha_fin) : null,
                },
                {
                  label: "Observaciones",
                  valor: servicio.observaciones,
                  vacio: "Sin observaciones",
                },
              ]}
            />
            <div className="ficha__acciones">
              <button type="button" className="animal-detail__action" onClick={startEditing}>
                <IconEdit size={16} stroke={1.5} />
                Editar
              </button>
              <span
                className={`animal-detail__action-tooltip-target${
                  puedeEliminar ? "" : " animal-detail__action-tooltip-target--disabled"
                }`}
                title={puedeEliminar ? undefined : "No se puede eliminar un servicio cerrado."}>
                <button
                  type="button"
                  className="animal-detail__action animal-detail__action--danger"
                  onClick={() => setIsEliminarOpen(true)}
                  disabled={!puedeEliminar}>
                  <IconTrash size={16} stroke={1.5} />
                  Eliminar
                </button>
              </span>
              {puedeCerrar && (
                <button
                  type="button"
                  className="animal-detail__action"
                  disabled={isCerrando}
                  onClick={handleCerrarServicio}>
                  Cerrar servicio
                </button>
              )}
              {puedeIniciarReservicio && (
                <button
                  type="button"
                  className="animal-detail__action"
                  onClick={() => navigate(`/servicios/${servicio.id}/reservicio`)}>
                  <IconRepeat size={16} stroke={1.5} />
                  Iniciar reservicio
                </button>
              )}
              {servicio.estado === "FINALIZADO" && hayResultadosPendientes && !diagnosticos && (
                <button
                  type="button"
                  className="animal-detail__action"
                  onClick={iniciarCargaResultados}>
                  <IconClipboardCheck size={16} stroke={1.5} />
                  Cargar resultados
                </button>
              )}
            </div>
          </>
        )}
      </Ficha>


      {(servicio.estado === "PLANIFICADO" || servicio.estado === "EN_CURSO") && (
        <ServicioPreservicioRecomendaciones key={servicio.id} servicioId={servicio.id} />
      )}

      {extra.reservicios.length > 0 && (
        <section className="animal-detail__section servicio-detail__reservicios">
          <div className="animal-detail__section-header">
            <h2>Reservicios</h2>
          </div>
          <ul className="servicio-detail__lotes-lista">
            {extra.reservicios.map((reservicio) => (
              <li key={reservicio.id}>
                <button
                  type="button"
                  className="servicio-detail__reservicio"
                  onClick={() => onVerServicio(reservicio.id)}>
                  <IconRepeat size={18} stroke={1.5} />
                  <span className="servicio-detail__reservicio-nombre">
                    {reservicio.nombre || `Servicio #${reservicio.id}`}
                  </span>
                  <span className="servicio-detail__lote-categoria">
                    {formatFecha(reservicio.fecha_inicio)} –{" "}
                    {reservicio.fecha_fin ? formatFecha(reservicio.fecha_fin) : "—"}
                  </span>
                  <span className={`servicio-badge servicio-badge--${reservicio.estado}`}>
                    {ESTADO_SERVICIO_LABELS[reservicio.estado] ?? reservicio.estado}
                  </span>
                  <IconChevronRight
                    size={18}
                    stroke={1.5}
                    className="servicio-detail__reservicio-flecha"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="animal-detail__section">
        <div className="animal-detail__section-header">
          <div>
            <span className="animal-detail__section-eyebrow">Lotes asociados</span>
            <h2>Vientres y toros</h2>
          </div>
          <Badge colorPalette="brand">
            {participantes.length === 1
              ? "1 vaca participante"
              : `${participantes.length} vacas participantes`}
          </Badge>
        </div>

        {isEditing && (
          <div className="servicio-detail__agregar-lote">
            <NativeSelect.Root size="sm" flex="1" minW="220px">
              <NativeSelect.Field
                value={loteIdParaAgregar}
                onChange={(event) => setLoteIdParaAgregar(event.target.value)}>
                <option value="">
                  {lotesDisponibles.length === 0
                    ? "No hay lotes disponibles para asociar"
                    : "Seleccioná un lote para agregar"}
                </option>
                {lotesDisponibles.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nombre} · {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Button
              colorPalette="brand"
              size="sm"
              disabled={!loteIdParaAgregar}
              loading={isAgregandoLote}
              onClick={handleAgregarLote}>
              Agregar
            </Button>
          </div>
        )}

        {diagnosticos && (
          <div className="servicio-resultados__barra">
            <div className="servicio-resultados__barra-datos">
              <label className="cargar-resultados__fecha">
                <span>Fecha de diagnóstico</span>
                <FechaInput
                  max={localNaiveNow().slice(0, 10)}
                  value={fechaDiagnostico}
                  onChange={(value) => {
                    setFechaDiagnostico(value);
                    setResultadosError("");
                  }}
                />
              </label>
              <ResumenDiagnosticos diagnosticos={diagnosticos} />
            </div>
            {resultadosError && (
              <p className="status-message error" role="alert">
                {resultadosError}
              </p>
            )}
            <div className="servicio-resultados__barra-acciones">
              <Button
                type="button"
                variant="outline"
                className="animal-form__cancel"
                size="sm"
                onClick={cancelarCargaResultados}
                disabled={isGuardandoResultados}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                size="sm"
                onClick={handleGuardarResultados}
                loading={isGuardandoResultados}
                loadingText="Guardando..."
                disabled={diagnosticos.size === 0}>
                Guardar resultados
              </Button>
            </div>
          </div>
        )}

        <div className="servicio-detail__lotes">
          <VientresGrupo
            lotes={lotes?.vientres ?? []}
            isEditing={isEditing}
            loteIdQuitando={loteIdQuitando}
            onQuitar={handleQuitarLote}
            esVistaPrevia={servicio.estado === "PLANIFICADO"}
            animalesPorLoteId={animalesPorLoteId}
            loadingVacas={false}
            participantes={participantes}
            reservicioPorId={new Map(extra.reservicios.map((r) => [r.id, r]))}
            diagnosticos={diagnosticos}
            mostrarErroresTipo={mostrarErroresResultados}
            onDiagnosticoChange={actualizarDiagnostico}
            onVerServicio={onVerServicio}
          />
          <ServicioTorosTabla
            servicioId={servicio.id}
            estado={servicio.estado}
            toros={toros}
            loading={false}
            onChanged={onTorosActualizados}
          />
        </div>
      </section>

      {(servicio.estado === "CERRADO" ||
        (servicio.estado === "FINALIZADO" && !hayResultadosPendientes)) &&
        participantes.length > 0 && <ServicioHistorialPorVaca participantes={participantes} />}

      <Dialog.Root
        open={isEliminarOpen}
        onOpenChange={(details) => !details.open && setIsEliminarOpen(false)}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Eliminar servicio</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Se eliminará el servicio "{servicio.nombre || `#${servicio.id}`}". Queda
                registrado como cancelado y no se puede deshacer.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setIsEliminarOpen(false)}
                  disabled={isEliminando}>
                  Cancelar
                </Button>
                <Button colorPalette="red" onClick={handleEliminar} loading={isEliminando}>
                  Eliminar
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}

type GrupoVientre = {
  key: string;
  lote: ServicioLoteRead | null;
  asociado: boolean;
  participantes: ParticipanteServicio[];
};

function agruparPorLoteDeParticipacion(
  lotes: ServicioLoteRead[],
  participantes: ParticipanteServicio[],
): GrupoVientre[] {
  const grupos = new Map<string, GrupoVientre>(
    lotes.map((lote) => [
      String(lote.id),
      { key: String(lote.id), lote, asociado: true, participantes: [] },
    ]),
  );
  for (const participante of participantes) {
    const lote = participante.lote_participacion;
    const key = lote ? String(lote.id) : "sin-lote";
    const grupo = grupos.get(key) ?? { key, lote, asociado: false, participantes: [] };
    grupo.participantes.push(participante);
    grupos.set(key, grupo);
  }
  return [...grupos.values()];
}

type VientresGrupoProps = {
  lotes: ServicioLotesAgrupados["vientres"];
  isEditing: boolean;
  loteIdQuitando: number | null;
  onQuitar: (loteId: number) => void;
  esVistaPrevia: boolean;
  animalesPorLoteId: Map<number, Animal[]>;
  loadingVacas: boolean;
  participantes: ParticipanteServicio[];
  reservicioPorId: Map<number, ServicioRead>;
  diagnosticos: Map<number, Diagnostico> | null;
  mostrarErroresTipo: boolean;
  onDiagnosticoChange: (resultadoId: number, cambio: Partial<Diagnostico>) => void;
  onVerServicio: (id: number) => void;
};

function VientresGrupo({
  lotes,
  isEditing,
  loteIdQuitando,
  onQuitar,
  esVistaPrevia,
  animalesPorLoteId,
  loadingVacas,
  participantes,
  reservicioPorId,
  diagnosticos,
  mostrarErroresTipo,
  onDiagnosticoChange,
  onVerServicio,
}: VientresGrupoProps) {
  const grupos = esVistaPrevia
    ? lotes.map((lote) => ({ key: String(lote.id), lote, asociado: true, participantes: [] }))
    : agruparPorLoteDeParticipacion(lotes, participantes);

  return (
    <div className="servicio-detail__lotes-grupo">
      <div className="servicio-detail__lotes-grupo-header">
        <h2 className="servicio-detail__lotes-grupo-titulo">
          <VacaIcon />
          Vientres
        </h2>
        <Badge colorPalette="brand">{lotes.length}</Badge>
      </div>
      {esVistaPrevia && lotes.length > 0 && (
        <p className="servicio-detail__vacas-vacio">
          Vista previa: las vacas participantes se fijan cuando empieza el servicio.
        </p>
      )}
      {grupos.length === 0 ? (
        <p className="servicio-detail__lotes-vacio">
          No hay lotes de vientres asociados a este servicio.
        </p>
      ) : (
        <ul className="servicio-detail__lotes-lista">
          {grupos.map((grupo) => (
            <li key={grupo.key} className="servicio-detail__vientre-lote">
              <div className="servicio-detail__lote-item">
                <span>{grupo.lote?.nombre ?? "Sin lote"}</span>
                {grupo.lote && (
                  <span className="servicio-detail__lote-categoria">
                    {grupo.asociado
                      ? (CATEGORIA_ANIMAL_LABELS[grupo.lote.categoria] ?? grupo.lote.categoria)
                      : "Ya no asociado"}
                  </span>
                )}
                {isEditing && grupo.lote && grupo.asociado && (
                  <button
                    type="button"
                    className="servicio-detail__lote-quitar"
                    aria-label={`Quitar ${grupo.lote.nombre} del servicio`}
                    disabled={loteIdQuitando === grupo.lote.id}
                    onClick={() => grupo.lote && onQuitar(grupo.lote.id)}>
                    <IconX size={14} stroke={2} />
                  </button>
                )}
              </div>

              {esVistaPrevia ? (
                <VacasVistaPrevia
                  vacas={grupo.lote ? (animalesPorLoteId.get(grupo.lote.id) ?? []) : []}
                  loading={loadingVacas}
                />
              ) : grupo.participantes.length === 0 ? (
                <p className="servicio-detail__vacas-vacio">
                  Este lote no aporta vacas al servicio.
                </p>
              ) : (
                <ul className="servicio-detail__vacas-lista">
                  {grupo.participantes.map((participante) => (
                    <VacaParticipante
                      key={participante.resultado.id}
                      participante={participante}
                      reservicio={
                        participante.reservicio_id !== null
                          ? reservicioPorId.get(participante.reservicio_id)
                          : undefined
                      }
                      diagnostico={diagnosticos?.get(participante.resultado.id)}
                      mostrarErrorTipo={
                        mostrarErroresTipo && faltaTipo(diagnosticos?.get(participante.resultado.id))
                      }
                      onDiagnosticoChange={(cambio) =>
                        onDiagnosticoChange(participante.resultado.id, cambio)
                      }
                      onVerServicio={onVerServicio}
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VacasVistaPrevia({ vacas, loading }: { vacas: Animal[]; loading: boolean }) {
  if (loading) {
    return <p className="servicio-detail__vacas-vacio">Cargando vacas...</p>;
  }
  if (vacas.length === 0) {
    return <p className="servicio-detail__vacas-vacio">Este lote no tiene animales.</p>;
  }
  return (
    <ul className="servicio-detail__vacas-lista">
      {vacas.map((vaca) => (
        <li key={vaca.id} className="servicio-detail__vaca-item">
          <span>{vaca.caravana ?? `#${vaca.id}`}</span>
        </li>
      ))}
    </ul>
  );
}

type VacaParticipanteProps = {
  participante: ParticipanteServicio;
  reservicio: ServicioRead | undefined;
  diagnostico: Diagnostico | undefined;
  mostrarErrorTipo: boolean;
  onDiagnosticoChange: (cambio: Partial<Diagnostico>) => void;
  onVerServicio: (id: number) => void;
};

function VacaParticipante({
  participante,
  reservicio,
  diagnostico,
  mostrarErrorTipo,
  onDiagnosticoChange,
  onVerServicio,
}: VacaParticipanteProps) {
  const { animal, resultado, lote_actual } = participante;
  const loteActualTexto = lote_actual ? `lote ${lote_actual.nombre}` : "sin lote";

  let motivoDeshabilitada: ReactNode = null;
  if (animal.estado !== "ACTIVO") {
    motivoDeshabilitada = ESTADO_ANIMAL_LABELS[animal.estado] ?? animal.estado;
  } else if (participante.reservicio_id !== null) {
    motivoDeshabilitada = (
      <>
        En reservicio{" "}
        <button
          type="button"
          className="servicio-detail__link-btn"
          onClick={() => onVerServicio(participante.reservicio_id as number)}>
          {reservicio?.nombre || `Servicio #${participante.reservicio_id}`}
        </button>{" "}
        ({loteActualTexto})
      </>
    );
  } else if (animal.lote_id !== resultado.lote_id) {
    motivoDeshabilitada = `Actualmente en ${loteActualTexto}`;
  }
  const caravana = animal.caravana ?? `#${animal.id}`;
  const deshabilitada = !!motivoDeshabilitada && !diagnostico;

  return (
    <li
      className={`servicio-detail__vaca-item${
        deshabilitada ? " servicio-detail__vaca-item--deshabilitada" : ""
      }`}
      aria-disabled={deshabilitada ? true : undefined}>
      <span>{caravana}</span>
      <span className="servicio-detail__vaca-acciones">
        {motivoDeshabilitada && (
          <span className="servicio-detail__vaca-motivo">{motivoDeshabilitada}</span>
        )}
        {diagnostico ? (
          <DiagnosticoControles
            resultadoId={resultado.id}
            caravana={caravana}
            diagnostico={diagnostico}
            mostrarErrorTipo={mostrarErrorTipo}
            onChange={onDiagnosticoChange}
          />
        ) : (
          <span className={`resultado-badge resultado-badge--${resultado.estado}`}>
            {ESTADO_RESULTADO_SERVICIO_LABELS[resultado.estado] ?? resultado.estado}
            {resultado.tipo_prenez && ` · ${TIPO_PRENEZ_LABELS[resultado.tipo_prenez]}`}
          </span>
        )}
      </span>
    </li>
  );
}

function ResumenDiagnosticos({ diagnosticos }: { diagnosticos: Map<number, Diagnostico> }) {
  const conteo = { PRENADA: 0, VACIA: 0, PENDIENTE: 0 };
  for (const { estado } of diagnosticos.values()) conteo[estado] += 1;
  return (
    <p className="cargar-resultados__resumen">
      {conteo.PRENADA} preñada{conteo.PRENADA === 1 ? "" : "s"} · {conteo.VACIA} vacía
      {conteo.VACIA === 1 ? "" : "s"} · {conteo.PENDIENTE} pendiente
      {conteo.PENDIENTE === 1 ? "" : "s"}
    </p>
  );
}
