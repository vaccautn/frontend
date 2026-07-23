import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import type { DashboardAnimalData } from "@/features/animales/types";
import { KpiCriticos } from "./KpiCriticos";
import { KpiEvaluaciones } from "./KpiEvaluaciones";
import { AnimalEvolucion } from "./AnimalEvolucion";
import { DashboardHistograma } from "./DashboardHistograma";
import { HistorialCriticos } from "./HistorialCriticos";

type Props = {
  data: DashboardAnimalData | null;
  loading: boolean;
  error: string;
};

export function AnimalDashboard({ data, loading, error }: Props) {
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
          count={data?.historial_peores.length ?? 0}
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
          <DashboardHistograma histograma={data?.histograma ?? []} loading={loading} />
        </Box>
      </SimpleGrid>

      <HistorialCriticos historial={data?.historial_peores ?? []} loading={loading} />
    </Box>
  );
}
