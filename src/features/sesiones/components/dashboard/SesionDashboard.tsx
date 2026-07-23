import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { KpiCriticos } from "@/features/animales/components/dashboard/KpiCriticos";
import { DashboardHistograma } from "@/features/animales/components/dashboard/DashboardHistograma";
import { KpiEvaluadosSesion } from "./KpiEvaluadosSesion";
import { KpiPromedio } from "./KpiPromedio";
import type { DashboardSesionData } from "@/features/sesiones/types";

type Props = {
  data: DashboardSesionData | null;
  loading: boolean;
  error: string;
};

export function SesionDashboard({ data, loading, error }: Props) {
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
        Dashboard de la sesión
      </Text>

      {error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <KpiEvaluadosSesion
          evaluados={data?.animales_evaluados ?? 0}
          total={data?.total_animales ?? 0}
          loading={loading}
        />
        <KpiCriticos count={data?.alertas.length ?? 0} loading={loading} />
        <KpiPromedio promedio={data?.promedio ?? null} loading={loading} />
      </SimpleGrid>

      <Box
        p="3"
        border="1px solid"
        borderColor="var(--border)"
        borderRadius="8px"
        bg="var(--bg)">
        <DashboardHistograma histograma={data?.histograma ?? []} loading={loading} />
      </Box>
    </Box>
  );
}
