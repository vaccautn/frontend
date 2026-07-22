import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  evaluados: number;
  total: number;
  loading: boolean;
};

export function KpiEvaluadosSesion({ evaluados, total, loading }: Props) {
  const pct = total > 0 ? Math.round((evaluados / total) * 100) : 0;

  return (
    <Box
      p="4"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="8px"
      bg="var(--bg)"
      display="flex"
      flexDirection="column"
      gap="1"
      overflow="hidden">
      <Text
        fontSize="0.72rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.04em"
        color="var(--text)"
        mb="1">
        Cobertura de la sesión
      </Text>

      {loading ? (
        <Skeleton height="2rem" width="4rem" />
      ) : total === 0 ? (
        <Text fontSize="0.9rem" color="var(--text)">
          Sin animales activos
        </Text>
      ) : (
        <Text
          fontSize="2rem"
          fontWeight="800"
          lineHeight="1"
          color="var(--verde-confirmacion)">
          {pct}%
        </Text>
      )}

      {!loading && total > 0 && (
        <>
          <Text fontSize="0.82rem" color="var(--text)" mt="1">
            En esta sesión se han evaluado {evaluados} animales
          </Text>
          <Text fontSize="0.78rem" color="var(--text)">
            {pct}% del total del rodeo ({total} animales activos)
          </Text>
        </>
      )}

      <Box mt="3" h="5px" borderRadius="2px" bg="var(--verde-pastel)" overflow="hidden">
        <Box
          h="100%"
          borderRadius="2px"
          bg="var(--verde-vacca)"
          w={`${pct}%`}
          transition="width 0.4s ease"
        />
      </Box>
    </Box>
  );
}
