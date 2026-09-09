import { useNavigate } from "react-router-dom";
import { Box, Text, Skeleton, VStack } from "@chakra-ui/react";
import type { LoteEnServicio } from "@/features/servicios/types";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";

type Props = {
  lotesEnServicio: LoteEnServicio[];
  loading: boolean;
};

export function LotesEnServicio({ lotesEnServicio, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Lotes en servicio
      </Text>

      {loading ? (
        <VStack gap="1" align="stretch">
          <Skeleton height="2.2rem" />
          <Skeleton height="2.2rem" />
        </VStack>
      ) : lotesEnServicio.length === 0 ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          Ningún lote está en un servicio EN_CURSO ahora mismo.
        </Text>
      ) : (
        <VStack gap="1" align="stretch">
          {lotesEnServicio.map(({ lote, servicio, rol }) => (
            <Box
              key={`${servicio.id}-${lote.id}`}
              display="flex"
              alignItems="center"
              gap="3"
              px="3"
              py="2"
              border="1px solid"
              borderColor="var(--border)"
              borderRadius="6px"
              bg="var(--panel)"
              cursor="pointer"
              flexWrap="wrap"
              onClick={() => navigate(`/servicios/${servicio.id}`)}>
              <Text fontWeight="600" color="var(--text-h)" flex="1" minW="8rem">
                {lote.nombre}
              </Text>
              <Text fontSize="0.82rem" color="var(--text)">
                {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria} ·{" "}
                {rol === "vientre" ? "Vientre" : "Toro"}
              </Text>
              <Text fontSize="0.82rem" color="var(--accent-strong)" flex="1" minW="8rem" textAlign="right">
                {servicio.nombre || `Servicio #${servicio.id}`}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
