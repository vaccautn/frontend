import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Table } from "@chakra-ui/react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import "./animales.css";
import {
  getAnimalesAgrupadosPorLote,
  getEvaluacionesCc,
} from "@/features/animales/services/animalesService";
import type {
  Animal,
  AnimalLoteGroup,
  EvaluacionCC,
} from "@/features/animales/types";
import { useAnimalesFiltros } from "@/features/animales/hooks/useAnimalesFiltros";
import { BajaAnimalModal } from "./BajaAnimalModal";
import { AnimalDetailDrawer } from "./AnimalDetailDrawer";
import { AnimalesFiltros } from "./AnimalesFiltros";

const COLUMNAS = [
  "Caravana",
  "Raza",
  "Sexo",
  "Fecha de nacimiento",
  "Estado",
];

function getTituloGrupo(grupo: AnimalLoteGroup) {
  return grupo.lote?.nombre ?? "Sin lote";
}

export function AnimalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [grupos, setGrupos] = useState<AnimalLoteGroup[]>([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const [evaluacionesAnimal, setEvaluacionesAnimal] = useState<EvaluacionCC[]>([]);
  const [evaluacionesLoading, setEvaluacionesLoading] = useState(false);
  const [evaluacionesError, setEvaluacionesError] = useState("");
  const [animalParaBaja, setAnimalParaBaja] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestEvaluacionesRequestId = useRef(0);
  const selectedAnimalIdRef = useRef<number | null>(null);

  const {
    caravanaInput,
    sexo,
    raza,
    estado,
    setCaravanaInput,
    setSexo,
    setRaza,
    setEstado,
    params,
  } = useAnimalesFiltros();

  const fetchAnimales = useCallback(() => {
    setLoading(true);
    setError("");
    getAnimalesAgrupadosPorLote(params)
      .then(setGrupos)
      .catch(() => setError("No se pudieron cargar los animales."))
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAnimales();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAnimales]);

  useEffect(() => {
    if (location.state?.refresh) {
      const timer = window.setTimeout(() => {
        fetchAnimales();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [location.state, fetchAnimales]);

  const fetchEvaluacionesAnimal = useCallback(async (animalId: number) => {
    const requestId = ++latestEvaluacionesRequestId.current;
    setEvaluacionesLoading(true);
    setEvaluacionesError("");

    try {
      const history = await getEvaluacionesCc(animalId);

      if (
        latestEvaluacionesRequestId.current !== requestId ||
        selectedAnimalIdRef.current !== animalId
      ) {
        return;
      }

      setEvaluacionesAnimal(history);
    } catch {
      if (
        latestEvaluacionesRequestId.current !== requestId ||
        selectedAnimalIdRef.current !== animalId
      ) {
        return;
      }

      setEvaluacionesError("No se pudo cargar el historial de evaluaciones.");
    } finally {
      if (latestEvaluacionesRequestId.current === requestId) {
        setEvaluacionesLoading(false);
      }
    }
  }, []);

  const abrirDetalle = (animal: Animal) => {
    selectedAnimalIdRef.current = animal.id;
    setAnimalSeleccionado(animal);
    void fetchEvaluacionesAnimal(animal.id);
  };

  const cerrarDetalle = () => {
    latestEvaluacionesRequestId.current += 1;
    selectedAnimalIdRef.current = null;
    setAnimalSeleccionado(null);
    setEvaluacionesAnimal([]);
    setEvaluacionesError("");
    setEvaluacionesLoading(false);
  };

  const refreshEvaluacionesSeleccionadas = useCallback(() => {
    if (!animalSeleccionado) return Promise.resolve();

    return fetchEvaluacionesAnimal(animalSeleccionado.id);
  }, [animalSeleccionado, fetchEvaluacionesAnimal]);

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    animal: Animal,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirDetalle(animal);
    }
  };

  const totalAnimales = grupos.reduce(
    (acumulado, grupo) => acumulado + grupo.animales.length,
    0,
  );

  return (
    <div>
      <h1>Animales</h1>
      <PrimaryButton label="Registrar animal" href="/animales/nuevo" />

      <AnimalesFiltros
        caravanaInput={caravanaInput}
        sexo={sexo}
        raza={raza}
        estado={estado}
        onCaravanaChange={setCaravanaInput}
        onSexoChange={setSexo}
        onRazaChange={setRaza}
        onEstadoChange={setEstado}
      />

      {loading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && (
        <div className="animales-table__wrapper">
          <div className="animales-table__summary">
            <div>
              <span className="animales-table__summary-label">Lotes visibles</span>
              <strong>{grupos.length}</strong>
            </div>
            <div>
              <span className="animales-table__summary-label">Animales listados</span>
              <strong>{totalAnimales}</strong>
            </div>
          </div>

          <Table.Root className="animales-table" interactive>
            <Table.Header>
              <Table.Row>
                {COLUMNAS.map((columna) => (
                  <Table.ColumnHeader key={columna}>
                    {columna}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            {grupos.length === 0 ? (
              <Table.Body>
                <Table.Row>
                  <Table.Cell colSpan={COLUMNAS.length}>
                    No se encontraron animales con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ) : (
              grupos.map((grupo) => (
                <Table.Body key={grupo.lote?.id ?? "sin-lote"}>
                  <Table.Row className="animales-table__group-row">
                    <Table.Cell colSpan={COLUMNAS.length}>
                      <div className="animales-table__group-header">
                        <div>
                          <p className="animales-table__group-eyebrow">Lote</p>
                          <strong>{getTituloGrupo(grupo)}</strong>
                        </div>
                        <span className="animales-table__group-count">
                          {grupo.animales.length} animal
                          {grupo.animales.length === 1 ? "" : "es"}
                        </span>
                      </div>
                    </Table.Cell>
                  </Table.Row>

                  {grupo.animales.map((animal) => (
                    <Table.Row
                      key={animal.id}
                      className="animales-table__row"
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver detalle de ${animal.caravana ?? `animal #${animal.id}`}`}
                      onClick={() => abrirDetalle(animal)}
                      onKeyDown={(event) => handleRowKeyDown(event, animal)}>
                      <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                      <Table.Cell>{animal.raza}</Table.Cell>
                      <Table.Cell>{animal.sexo}</Table.Cell>
                      <Table.Cell>{animal.fecha_nacimiento ?? "—"}</Table.Cell>
                      <Table.Cell>{animal.estado}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              ))
            )}
          </Table.Root>
        </div>
      )}

      <Outlet />

      <AnimalDetailDrawer
        animal={animalSeleccionado}
        evaluaciones={evaluacionesAnimal}
        historyLoading={evaluacionesLoading}
        historyError={evaluacionesError}
        onClose={cerrarDetalle}
        onRefreshHistory={refreshEvaluacionesSeleccionadas}
        onEditar={(animal) => {
          cerrarDetalle();
          navigate(`/animales/${animal.id}/editar`);
        }}
        onEliminar={(animal) => {
          cerrarDetalle();
          setAnimalParaBaja(animal);
        }}
      />

      {animalParaBaja && (
        <BajaAnimalModal
          animal={animalParaBaja}
          onClose={() => setAnimalParaBaja(null)}
          onSuccess={fetchAnimales}
        />
      )}
    </div>
  );
}
