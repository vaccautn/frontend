import { useState } from "react";
import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useAnimalesDashboard } from "@/features/animales/hooks/useAnimalesDashboard";
import { KpiCriticos } from "./KpiCriticos";
import { KpiEvaluados } from "./KpiEvaluados";
import { DashboardHistograma } from "./DashboardHistograma";
import { DashboardEvolucion } from "./DashboardEvolucion";
import { DashboardLoteFiltro } from "./DashboardLoteFiltro";

export function AnimalesDashboard() {
  const [loteId, setLoteId] = useState<number | null>(null);
  const { data, loading, error } = useAnimalesDashboard(loteId);

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
      {/* Header: title + lote filter */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap="4">
        <Text
          fontSize="0.78rem"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.04em"
          color="var(--accent-strong)">
          Dashboard del rodeo
        </Text>
        <DashboardLoteFiltro loteId={loteId} onChange={setLoteId} />
      </Box>

      {error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      {/* KPI cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <KpiCriticos count={data?.alertas.length ?? 0} loading={loading} />
        <KpiEvaluados
          total={data?.total_animales_activos ?? 0}
          evaluados={data?.total_animales_evaluados ?? 0}
          loading={loading}
        />
      </SimpleGrid>

      {/* Charts */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <DashboardHistograma histograma={data?.histograma ?? []} loading={loading} />
        </Box>
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <DashboardEvolucion evolucion={data?.evolucion ?? []} loading={loading} />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
