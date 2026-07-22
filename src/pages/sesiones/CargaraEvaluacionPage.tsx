import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Table } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { getSesion } from "@/features/sesiones/services/sesionesService";
import { getEvaluacionesCc } from "@/features/animales/services/animalesService";
import { getAnimalesAgrupadosPorLote } from "@/features/animales/services/animalesService";
import { RegistrarEvaluacionCCDialog } from "@/pages/animales/RegistrarEvaluacionCCDialog"; // ajustar ruta real
import { useSesionDashboard } from "@/features/sesiones/hooks/useSesionDashboard";
import { SesionDashboard } from "@/features/sesiones/components/dashboard/SesionDashboard";
import type { SesionCaptura } from "@/features/sesiones/types";
import type { Animal, AnimalLoteGroup } from "@/features/animales/types";

export function CargarEvaluacionesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sesionId = Number(id);

  const [sesion, setSesion] = useState<SesionCaptura | null>(null);
  const [grupos, setGrupos] = useState<AnimalLoteGroup[]>([]);
  const [evaluacionesCount, setEvaluacionesCount] = useState(0);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useSesionDashboard(sesionId);

  const refreshCount = useCallback(() => {
    getEvaluacionesCc({ sesionId })
      .then((evals) => setEvaluacionesCount(evals.length))
      .catch(() => {});
  }, [sesionId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSesion(sesionId),
      getAnimalesAgrupadosPorLote({ estado: "ACTIVO" }),
    ])
      .then(([sesionData, gruposData]) => {
        setSesion(sesionData);
        setGrupos(gruposData);
      })
      .catch(() => toast.error("No se pudo cargar la sesión."))
      .finally(() => setLoading(false));
    refreshCount();
  }, [sesionId, refreshCount]);

  if (loading) return <p>Cargando...</p>;
  if (!sesion) return <p>Sesión no encontrada.</p>;

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Cargando evaluaciones — Sesión #{sesion.id}</h1>
          <p>{evaluacionesCount} evaluación(es) registradas en esta sesión.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/sesiones")}>
          Finalizar carga
        </Button>
      </div>

      <SesionDashboard
        data={dashboardData}
        loading={dashboardLoading}
        error={dashboardError}
      />

      <Table.Root className="animales-table" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Caravana</Table.ColumnHeader>
            <Table.ColumnHeader>Raza</Table.ColumnHeader>
            <Table.ColumnHeader>Lote</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {grupos.flatMap((grupo) =>
            grupo.animales.map((animal) => (
              <Table.Row
                key={animal.id}
                className="animales-table__row"
                onClick={() => setAnimalSeleccionado(animal)}>
                <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                <Table.Cell>{animal.raza}</Table.Cell>
                <Table.Cell>{grupo.lote?.nombre ?? "Sin lote"}</Table.Cell>
              </Table.Row>
            )),
          )}
        </Table.Body>
      </Table.Root>

      <RegistrarEvaluacionCCDialog
        animal={animalSeleccionado}
        open={!!animalSeleccionado}
        sesionId={sesionId}
        onClose={() => setAnimalSeleccionado(null)}
        onSuccess={async () => {
          refreshCount();
          refetchDashboard();
        }}
      />
    </section>
  );
}
