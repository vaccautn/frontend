import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  total: number;
  evaluados: number;
  loading: boolean;
};

export function KpiEvaluados({ total, evaluados, loading }: Props) {
  const pct = total > 0 ? Math.round((evaluados / total) * 100) : 0;

  return (
    <Box
      p="4"
      borderRadius="var(--radius-md)"
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
        Animales evaluados
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

      {!loading && (
        <Text fontSize="0.82rem" color="var(--text)" mt="1">
          {evaluados} de {total} animales activos
        </Text>
      )}

      <Box mt="3" h="5px" borderRadius="full" bg="var(--verde-pastel)" overflow="hidden">
        <Box
          h="100%"
          borderRadius="full"
          bg="var(--verde-vacca)"
          w={`${pct}%`}
          transition="width 0.4s ease"
        />
      </Box>
    </Box>
  );
}
