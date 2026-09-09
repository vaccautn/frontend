import { Box, Text, Skeleton, VStack } from "@chakra-ui/react";
import type { ResultadoServicioRead, ServicioRead } from "@/features/servicios/types";
import { ESTADO_RESULTADO_SERVICIO_LABELS } from "@/features/servicios/constants";
import { formatFecha } from "@/features/animales/utils/formatDate";

type Props = {
  resultados: ResultadoServicioRead[];
  servicios: ServicioRead[];
  animalCaravanaPorId: Map<number, string>;
  loading: boolean;
};

const MAX_ITEMS = 10;

export function HistorialResultados({
  resultados,
  servicios,
  animalCaravanaPorId,
  loading,
}: Props) {
  const servicioNombrePorId = new Map(
    servicios.map((s) => [s.id, s.nombre || `Servicio #${s.id}`]),
  );

  const ordenados = [...resultados].sort((a, b) => {
    const fechaA = a.fecha_diagnostico ?? a.creado_en;
    const fechaB = b.fecha_diagnostico ?? b.creado_en;
    return fechaB.localeCompare(fechaA);
  });
  const visibles = ordenados.slice(0, MAX_ITEMS);

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Historial de resultados
      </Text>

      {loading ? (
        <VStack gap="1" align="stretch">
          <Skeleton height="2.2rem" />
          <Skeleton height="2.2rem" />
          <Skeleton height="2.2rem" />
        </VStack>
      ) : visibles.length === 0 ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          Todavía no hay resultados de servicio registrados.
        </Text>
      ) : (
        <>
          <VStack gap="1" align="stretch">
            {visibles.map((resultado) => (
              <Box
                key={resultado.id}
                display="flex"
                alignItems="center"
                gap="3"
                px="3"
                py="2"
                border="1px solid"
                borderColor="var(--border)"
                borderRadius="6px"
                bg="var(--panel)"
                flexWrap="wrap">
                <Text fontWeight="600" color="var(--text-h)" flex="1" minW="8rem">
                  {animalCaravanaPorId.get(resultado.animal_id) ??
                    `Animal #${resultado.animal_id}`}
                </Text>
                <Text fontSize="0.82rem" color="var(--text)" flex="1" minW="8rem">
                  {servicioNombrePorId.get(resultado.servicio_id) ??
                    `Servicio #${resultado.servicio_id}`}
                </Text>
                <span
                  className={`resultado-badge resultado-badge--${resultado.estado}`}>
                  {ESTADO_RESULTADO_SERVICIO_LABELS[resultado.estado] ??
                    resultado.estado}
                </span>
                <Text fontSize="0.82rem" color="var(--text)">
                  {resultado.fecha_diagnostico
                    ? formatFecha(resultado.fecha_diagnostico)
                    : "Sin diagnóstico"}
                </Text>
              </Box>
            ))}
          </VStack>

          {ordenados.length > MAX_ITEMS && (
            <Text fontSize="0.78rem" color="var(--text)" mt="2">
              Mostrando los {MAX_ITEMS} más recientes de {ordenados.length}
            </Text>
          )}
        </>
      )}
    </Box>
  );
}
