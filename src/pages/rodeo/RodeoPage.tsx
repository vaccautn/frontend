import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import "./rodeo.css";
import { getAnimales } from "@/features/rodeo/services/rodeoService";
import type { Animal } from "@/features/rodeo/types";
import { BajaAnimalModal } from "./BajaAnimalModal";

export function RodeoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [animales, setAnimales] = useState<Animal[]>([]);
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

  return (
    <div>
      <h1>Rodeo</h1>
      <PrimaryButton label="Registrar animal" href="/rodeo/nuevo" />

      {loading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && (
        <table className="rodeo-table">
          <thead>
            <tr>
              <th>Caravana</th>
              <th>Raza</th>
              <th>Sexo</th>
              <th>Fecha de nacimiento</th>
              <th>Estado</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {animales.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay animales activos registrados.</td>
              </tr>
            ) : (
              animales.map((animal) => (
                <tr key={animal.id}>
                  <td>{animal.caravana ?? "—"}</td>
                  <td>{animal.raza}</td>
                  <td>{animal.sexo}</td>
                  <td>{animal.fecha_nacimiento ?? "—"}</td>
                  <td>{animal.estado}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/rodeo/${animal.id}/editar`)}>
                      Editar
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-action table-action--danger"
                      onClick={() => setAnimalParaBaja(animal)}>
                      <span aria-hidden="true" className="table-action__icon">
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M12 4v11" />
                          <path d="m7 10 5 5 5-5" />
                          <path d="M5 20h14" />
                        </svg>
                      </span>
                      Dar de baja
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Outlet />

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
