import { useEffect, useState, type KeyboardEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Table } from "@chakra-ui/react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import "./animales.css";
import { getAnimales } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import { BajaAnimalModal } from "./BajaAnimalModal";
import { AnimalDetailDrawer } from "./AnimalDetailDrawer";

const COLUMNAS = [
  "Caravana",
  "Raza",
  "Sexo",
  "Fecha de nacimiento",
  "Estado",
];

export function AnimalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const [animalParaBaja, setAnimalParaBaja] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnimales = () => {
    setLoading(true);
    setError("");
    getAnimales({ estado: "ACTIVO" })
      .then(setAnimales)
      .catch(() => setError("No se pudieron cargar los animales."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnimales();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchAnimales();
    }
  }, [location.state]);

  const abrirDetalle = (animal: Animal) => setAnimalSeleccionado(animal);

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    animal: Animal,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirDetalle(animal);
    }
  };

  return (
    <div>
      <h1>Animales</h1>
      <PrimaryButton label="Registrar animal" href="/animales/nuevo" />

      {loading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && (
        <Table.Root className="animales-table" interactive>
          <Table.Header>
            <Table.Row>
              {COLUMNAS.map((columna) => (
                <Table.ColumnHeader key={columna}>{columna}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {animales.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={COLUMNAS.length}>
                  No hay animales activos registrados.
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
                  onClick={() => abrirDetalle(animal)}
                  onKeyDown={(event) => handleRowKeyDown(event, animal)}>
                  <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                  <Table.Cell>{animal.raza}</Table.Cell>
                  <Table.Cell>{animal.sexo}</Table.Cell>
                  <Table.Cell>{animal.fecha_nacimiento ?? "—"}</Table.Cell>
                  <Table.Cell>{animal.estado}</Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}

      <Outlet />

      <AnimalDetailDrawer
        animal={animalSeleccionado}
        onClose={() => setAnimalSeleccionado(null)}
        onEditar={(animal) => {
          setAnimalSeleccionado(null);
          navigate(`/animales/${animal.id}/editar`);
        }}
        onEliminar={(animal) => {
          setAnimalSeleccionado(null);
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
