import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Table } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import "./animales.css";
import { getAnimales } from "@/features/animales/services/animalesService";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { Animal } from "@/features/animales/types";
import type { LoteOption } from "@/features/lotes/types";
import { useAnimalesFiltros } from "@/features/animales/hooks/useAnimalesFiltros";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { AnimalesDashboard } from "@/features/animales/components/dashboard/AnimalesDashboard";
import { AnimalesFiltros } from "./AnimalesFiltros";

const COLUMNAS = [
  "Caravana",
  "Raza",
  "Sexo",
  "Fecha de nacimiento",
  "Lote",
  "Estado",
];

export function AnimalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");

  const {
    caravanaInput,
    sexo,
    raza,
    estado,
    loteId,
    setCaravanaInput,
    setSexo,
    setRaza,
    setEstado,
    setLoteId,
    params,
  } = useAnimalesFiltros();

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .finally(() => setLoadingLotes(false));
  }, []);

  const loteNombrePorId = useMemo(() => {
    const map = new Map<number, string>();
    lotes.forEach((lote) => map.set(lote.id, lote.nombre));
    return map;
  }, [lotes]);

  const fetchAnimales = useCallback(() => {
    setRefetching(true);
    setError("");
    getAnimales(params)
      .then(setAnimales)
      .catch(() => setError("No se pudieron cargar los animales."))
      .finally(() => {
        setRefetching(false);
        setInitialLoading(false);
      });
  }, [params]);

  useEffect(() => {
    fetchAnimales();
  }, [fetchAnimales]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchAnimales();
    }
  }, [location.state, fetchAnimales]);

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    animal: Animal,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/animales/${animal.id}`);
    }
  };

  const lotesRepresentados = useMemo(() => {
    const ids = new Set(animales.map((a) => a.lote_id ?? "sin-lote"));
    return ids.size;
  }, [animales]);

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Gestión de animales</h1>
        </div>
        <Button
          colorPalette="brand"
          onClick={() => navigate("/animales/nuevo")}>
          <IconPlus size={18} stroke={1.5} />
          Agregar animal
        </Button>
      </div>

      <AnimalesDashboard />

      <AnimalesFiltros
        caravanaInput={caravanaInput}
        sexo={sexo}
        raza={raza}
        estado={estado}
        loteId={loteId}
        lotes={lotes}
        loadingLotes={loadingLotes}
        onCaravanaChange={setCaravanaInput}
        onSexoChange={setSexo}
        onRazaChange={setRaza}
        onEstadoChange={setEstado}
        onLoteChange={setLoteId}
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
          <div className="animales-table__summary">
            <div>
              <span className="animales-table__summary-label">
                Lotes representados
              </span>
              <strong>{lotesRepresentados}</strong>
            </div>
            <div>
              <span className="animales-table__summary-label">
                Animales listados
              </span>
              <strong>{animales.length}</strong>
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
            <Table.Body>
              {animales.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={COLUMNAS.length}>
                    No se encontraron animales con los filtros aplicados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                animales.map((animal) => (
                  <Table.Row
                    key={animal.id}
                    className="animales-table__row"
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver detalle de ${animal.caravana ?? `animal #${animal.id}`}`}
                    onClick={() => navigate(`/animales/${animal.id}`)}
                    onKeyDown={(event) => handleRowKeyDown(event, animal)}>
                    <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                    <Table.Cell>{animal.raza}</Table.Cell>
                    <Table.Cell>{animal.sexo}</Table.Cell>
                    <Table.Cell>
                      {animal.fecha_nacimiento
                        ? formatFecha(animal.fecha_nacimiento)
                        : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      {animal.lote_id !== null
                        ? (loteNombrePorId.get(animal.lote_id) ?? "—")
                        : "Sin lote"}
                    </Table.Cell>
                    <Table.Cell>{animal.estado}</Table.Cell>
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
