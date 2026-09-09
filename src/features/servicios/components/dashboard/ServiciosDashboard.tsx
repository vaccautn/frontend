import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useServiciosDashboard } from "@/features/servicios/hooks/useServiciosDashboard";
import { ServicioKpiCard } from "./ServicioKpiCard";
import { ServiciosCalendario } from "./ServiciosCalendario";
import { HistorialResultados } from "./HistorialResultados";
import { LotesEnServicio } from "./LotesEnServicio";

export function ServiciosDashboard() {
  const {
    servicios,
    resultados,
    lotesEnServicio,
    animalCaravanaPorId,
    loading,
    error,
  } = useServiciosDashboard();

  const enCurso = servicios.filter((s) => s.estado === "EN_CURSO").length;
  const pendientes = resultados.filter((r) => r.estado === "PENDIENTE").length;

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

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <ServicioKpiCard
          label="Servicios en curso"
          count={enCurso}
          suffix={{ singular: "servicio en curso", plural: "servicios en curso" }}
          loading={loading}
          highlight
        />
        <ServicioKpiCard
          label="Lotes en servicio"
          count={lotesEnServicio.length}
          suffix={{ singular: "lote en servicio", plural: "lotes en servicio" }}
          loading={loading}
        />
        <ServicioKpiCard
          label="Resultados pendientes"
          count={pendientes}
          suffix={{ singular: "diagnóstico pendiente", plural: "diagnósticos pendientes" }}
          loading={loading}
        />
      </SimpleGrid>

      <Box
        p="3"
        border="1px solid"
        borderColor="var(--border)"
        borderRadius="8px"
        bg="var(--bg)">
        <ServiciosCalendario servicios={servicios} loading={loading} />
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
