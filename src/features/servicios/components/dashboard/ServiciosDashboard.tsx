import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useServiciosDashboard } from "@/features/servicios/hooks/useServiciosDashboard";
import { ServiciosCalendario } from "./ServiciosCalendario";
import { HistorialResultados } from "./HistorialResultados";
import { LotesEnServicio } from "./LotesEnServicio";
import { TimelineNacimientos } from "./TimelineNacimientos";

export function ServiciosDashboard() {
  const {
    servicios,
    resultados,
    lotesEnServicio,
    crias,
    animalCaravanaPorId,
    loading,
    error,
  } = useServiciosDashboard();

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

      <Box
        p="3"
        border="1px solid"
        borderColor="var(--border)"
        borderRadius="8px"
        bg="var(--bg)">
        <TimelineNacimientos crias={crias} servicios={servicios} loading={loading} />
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <HistorialResultados
            resultados={resultados}
            servicios={servicios}
            animalCaravanaPorId={animalCaravanaPorId}
            loading={loading}
          />
        </Box>
        <Box
          p="3"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="8px"
          bg="var(--bg)">
          <LotesEnServicio lotesEnServicio={lotesEnServicio} loading={loading} />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
