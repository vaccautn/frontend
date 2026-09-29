import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  count: number;
  loading: boolean;
  label?: { singular: string; plural: string };
};

const defaultLabel = {
  singular: "animal en estado crítico",
  plural: "animales en estado crítico",
};

export function KpiCriticos({ count, loading, label }: Props) {
  const resolvedLabel = label ?? defaultLabel;

  return (
    <Box
      p="4"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="8px"
      bg="var(--bg)"
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
        Condición crítica
      </Text>

      {loading ? (
        <Skeleton height="2rem" width="4rem" />
      ) : (
        <Text
          fontSize="2rem"
          fontWeight="800"
          lineHeight="1"
          color={count > 0 ? "var(--rojo-alerta)" : "var(--text-h)"}>
          {count}
        </Text>
      )}

      <Text fontSize="0.82rem" color="var(--text)" mt="1">
        {count === 1 ? resolvedLabel.singular : resolvedLabel.plural}
      </Text>
    </Box>
  );
}
