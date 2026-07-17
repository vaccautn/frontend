import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Table } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";
import "./animales.css";
import { getAnimales } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import { useAnimalesFiltros } from "@/features/animales/hooks/useAnimalesFiltros";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { AnimalesFiltros } from "./AnimalesFiltros";

const COLUMNAS = ["Caravana", "Raza", "Sexo", "Fecha de nacimiento", "Estado"];

export function AnimalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    getAnimales(params)
      .then(setAnimales)
      .catch(() => setError("No se pudieron cargar los animales."))
      .finally(() => setLoading(false));
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

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Gestión del rodeo</h1>
          <p>
            Consultá todos los animales registrados, buscá por caravana o filtrá
            por sus características, agregá nuevos animales y editá su
            información para mantener los registros siempre actualizados.
          </p>
        </div>
        <Button colorPalette="brand" onClick={() => navigate("/animales/nuevo")}>
          <IconPlus size={18} stroke={1.5} />
          Agregar animal
        </Button>
      </div>

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
