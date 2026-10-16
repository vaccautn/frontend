import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import type { DashboardAnimalData } from "@/features/animales/types";
import { KpiCriticos } from "./KpiCriticos";
import { KpiEvaluaciones } from "./KpiEvaluaciones";
import { AnimalEvolucion } from "./AnimalEvolucion";
import { DashboardHistograma } from "./DashboardHistograma";
import { HistorialCriticos } from "./HistorialCriticos";
import { nivelCC } from "@/features/animales/utils/ccColor";

type Props = {
  data: DashboardAnimalData | null;
  loading: boolean;
  error: string;
};

export function AnimalDashboard({ data, loading, error }: Props) {
  // El histograma agrega evaluaciones de distintos meses; se usa la fecha de
  // la evaluación más reciente como referencia para resolver el nivel de
  // alerta (mismo criterio "estado actual" que las tablas).
  const evolucion = data?.evolucion ?? [];
  const fechaReferencia =
    evolucion.length > 0
      ? evolucion[evolucion.length - 1].fecha
      : new Date().toISOString();

  // Críticas según el semáforo mes × CC (nivelCC), igual que los badges de
  // las tablas. `historial_peores` del backend usa el criterio viejo (CC 1
  // o 5), por eso no se usa.
  const criticas = evolucion
    .filter((punto) => nivelCC(punto.valor_cc, punto.fecha) === "critico")
    .reverse();

  return (
    <Box
      my="7"
      p="5"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="8px"
      bg="var(--panel)"
      display="flex"
      flexDirection="column"
      gap="5">
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.04em"
        color="var(--accent-strong)">
        Resumen del animal
      </Text>

      {error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <KpiCriticos
          count={criticas.length}
          loading={loading}
          label={{
            singular: "evaluación crítica",
            plural: "evaluaciones críticas",
          }}
        />
        <KpiEvaluaciones
          cantidad={data?.cantidad_evaluaciones ?? 0}
          loading={loading}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <AnimalEvolucion evolucion={data?.evolucion ?? []} loading={loading} />
        </Box>
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <DashboardHistograma
            histograma={data?.histograma ?? []}
            loading={loading}
            fecha={fechaReferencia}
          />
        </Box>
      </SimpleGrid>

      <HistorialCriticos historial={criticas} loading={loading} />
    </Box>
  );
}
