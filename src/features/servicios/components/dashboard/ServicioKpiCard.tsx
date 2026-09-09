import { Box, Text, Skeleton } from "@chakra-ui/react";

type Props = {
  label: string;
  count: number;
  suffix: { singular: string; plural: string };
  loading: boolean;
  highlight?: boolean;
};

export function ServicioKpiCard({
  label,
  count,
  suffix,
  loading,
  highlight,
}: Props) {
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
        {label}
      </Text>

      {loading ? (
        <Skeleton height="2rem" width="4rem" />
      ) : (
        <Text
          fontSize="2rem"
          fontWeight="800"
          lineHeight="1"
          color={highlight && count > 0 ? "var(--accent-strong)" : "var(--text-h)"}>
          {count}
        </Text>
      )}

      <Text fontSize="0.82rem" color="var(--text)" mt="1">
        {count === 1 ? suffix.singular : suffix.plural}
      </Text>
    </Box>
  );
}
