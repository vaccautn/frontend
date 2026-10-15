import { Box, Text } from "@chakra-ui/react";
import type { UseServiciosDashboardResult } from "@/features/servicios/hooks/useServiciosDashboard";
import { ServiciosCalendario } from "./ServiciosCalendario";

export function ServiciosDashboard({
  data,
}: {
  data: UseServiciosDashboardResult;
}) {
  const { servicios, loading, error } = data;

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
        Dashboard de servicios
      </Text>

      {error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      <Box
        p="3"
        border="1px solid"
        borderColor="var(--border)"
        borderRadius="8px"
        bg="var(--bg)">
        <ServiciosCalendario servicios={servicios} loading={loading} />
      </Box>

    </Box>
  );
}
