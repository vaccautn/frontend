import { Box, SimpleGrid, Skeleton, Text } from "@chakra-ui/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  vacas: number;
  toros: number;
  /** null: todavía no corresponde mostrar la efectividad (servicio en curso o
   * resultados sin cargar). */
  terneros: number | null;
  loading: boolean;
};

// Hex constants — resolved values of the VACCA palette from index.css.
// Recharts SVG attribute props (fill) do not reliably resolve CSS variables.
const COLOR_VACAS = "#c97a94"; // --rosa-hembra
const COLOR_TOROS = "#3e5c76"; // --azul-acero

const tituloProps = {
  fontSize: "0.72rem",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--text)",
  mb: "1",
} as const;

const panelProps = {
  p: "4",
  border: "1px solid",
  borderColor: "var(--border)",
  borderRadius: "8px",
  bg: "var(--bg)",
} as const;

export function ServicioDashboard({ vacas, toros, terneros, loading }: Props) {
  const composicion = [
    { nombre: "Vacas", cantidad: vacas, color: COLOR_VACAS },
    { nombre: "Toros", cantidad: toros, color: COLOR_TOROS },
  ];
  const efectividad =
    terneros !== null && vacas > 0 ? Math.round((terneros / vacas) * 100) : null;

  return (
    <Box
      mb="7"
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
        Dashboard del servicio
      </Text>

      <SimpleGrid columns={{ base: 1, md: efectividad !== null ? 2 : 1 }} gap="4">
        <Box {...panelProps}>
          <Text {...tituloProps}>Composición del servicio</Text>
          {loading ? (
            <Skeleton height="160px" />
          ) : vacas + toros === 0 ? (
            <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
              Sin animales en el servicio
            </Text>
          ) : (
            <Box display="flex" alignItems="center" gap="4" flexWrap="wrap">
              <Box flex="0 0 160px" h="160px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicion}
                      dataKey="cantidad"
                      nameKey="nombre"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="none">
                      {composicion.map((item) => (
                        <Cell key={item.nombre} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}`, name]}
                      contentStyle={{
                        background: "var(--panel)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box display="flex" flexDirection="column" gap="2">
                {composicion.map((item) => (
                  <Box key={item.nombre} display="flex" alignItems="center" gap="2">
                    <Box w="10px" h="10px" borderRadius="2px" bg={item.color} />
                    <Text fontSize="0.9rem" color="var(--text-h)">
                      {item.nombre}: <strong>{item.cantidad}</strong>
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {efectividad !== null && (
          <Box {...panelProps} display="flex" flexDirection="column" gap="1">
            <Text {...tituloProps}>Terneros por vaca</Text>
            <Text
              fontSize="2rem"
              fontWeight="800"
              lineHeight="1"
              color="var(--verde-confirmacion)">
              {efectividad}%
            </Text>
            <Text fontSize="0.82rem" color="var(--text)" mt="1">
              {terneros} {terneros === 1 ? "ternero" : "terneros"} de {vacas}{" "}
              {vacas === 1 ? "vaca" : "vacas"}
            </Text>
            <Box
              mt="3"
              h="5px"
              borderRadius="2px"
              bg="var(--verde-pastel)"
              overflow="hidden">
              <Box
                h="100%"
                borderRadius="2px"
                bg="var(--verde-vacca)"
                w={`${Math.min(efectividad, 100)}%`}
                transition="width 0.4s ease"
              />
            </Box>
          </Box>
        )}
      </SimpleGrid>
    </Box>
  );
}
