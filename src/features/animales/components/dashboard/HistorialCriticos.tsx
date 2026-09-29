import { Box, Text, Skeleton, VStack } from "@chakra-ui/react";
import type { EvaluacionPunto } from "@/features/animales/types";
import { formatFechaDeTimestamp } from "@/features/animales/utils/formatDate";

type Props = {
  historial: EvaluacionPunto[];
  loading: boolean;
};

const MAX_ITEMS = 10;

export function HistorialCriticos({ historial, loading }: Props) {
  const visible = historial.slice(0, MAX_ITEMS);

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Historial de calificaciones críticas
      </Text>

      {loading ? (
        <VStack gap="1" align="stretch">
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
        </VStack>
      ) : visible.length === 0 ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          Sin calificaciones críticas registradas.
        </Text>
      ) : (
        <>
          <VStack gap="1" align="stretch">
            {visible.map((punto) => (
              <Box
                key={punto.evaluacion_id}
                display="flex"
                alignItems="center"
                gap="3"
                px="3"
                py="2"
                border="1px solid"
                borderColor="var(--border)"
                borderRadius="6px"
                bg="var(--bg)">
                <Box
                  w="4px"
                  h="full"
                  bg="var(--rojo-alerta)"
                  borderRadius="2px"
                />
                <Text
                  fontWeight="600"
                  color="var(--rojo-alerta)"
                  flex="1">
                  CC {punto.valor_cc}
                </Text>
                <Text fontSize="0.82rem" color="var(--text)">
                  {formatFechaDeTimestamp(punto.fecha)}
                </Text>
              </Box>
            ))}
          </VStack>

          {historial.length > MAX_ITEMS && (
            <Text fontSize="0.78rem" color="var(--text)" mt="2">
              Mostrando las 10 más recientes
            </Text>
          )}
        </>
      )}
    </Box>
  );
}
