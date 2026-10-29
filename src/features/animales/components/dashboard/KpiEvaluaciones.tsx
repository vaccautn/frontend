import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  cantidad: number;
  loading: boolean;
};

export function KpiEvaluaciones({ cantidad, loading }: Props) {
  return (
    <Box
      className="animal-dashboard__tarjeta"
      p="4"
      borderRadius="var(--radius-md)"
      bg="var(--tile-bg)"
      boxShadow="var(--shadow-tile)"
      display="flex"
      flexDirection="column"
      gap="1">
      <Text
        fontSize="0.72rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.04em"
        color="var(--text)"
        mb="1">
        Total de evaluaciones
      </Text>

      {loading ? (
        <Skeleton height="2rem" width="4rem" />
      ) : (
        <Text fontSize="2rem" fontWeight="800" lineHeight="1" color="var(--marron-cuero)">
          {cantidad}
        </Text>
      )}

      <Text fontSize="0.82rem" color="var(--text)" mt="1">
        {cantidad === 1 ? "evaluación confirmada" : "evaluaciones confirmadas"}
      </Text>
    </Box>
  );
}
