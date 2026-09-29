import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  promedio: number | null;
  loading: boolean;
};

export function KpiPromedio({ promedio, loading }: Props) {
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
        Promedio de CC
      </Text>

      {loading ? (
        <Skeleton height="2rem" width="4rem" />
      ) : promedio === null ? (
        <Text fontSize="0.9rem" color="var(--text)">
          Sin evaluaciones
        </Text>
      ) : (
        <Text
          fontSize="2rem"
          fontWeight="800"
          lineHeight="1"
          color="var(--azul-acero)">
          {promedio.toFixed(2)}
        </Text>
      )}

      <Text fontSize="0.82rem" color="var(--text)" mt="1">
        promedio de calificación en esta sesión
      </Text>
    </Box>
  );
}
