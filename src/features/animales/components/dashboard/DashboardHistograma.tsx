import { Box, Text } from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { HistogramaBin } from "@/features/animales/types";

type Props = {
  histograma: HistogramaBin[];
  loading: boolean;
};

// Hex constants — resolved values of the VACCA palette from index.css.
// Recharts SVG attribute props (fill) do not reliably resolve CSS variables.
const CC_COLORS: Record<number, string> = {
  1: "#c94c4c", // --rojo-alerta
  2: "#c08b3e", // --ocre-campo
  3: "#4a9163", // --verde-confirmacion
  4: "#e0a83e", // --ambar-aviso
  5: "#c94c4c", // --rojo-alerta
};

export function DashboardHistograma({ histograma, loading }: Props) {
  const allZero = histograma.every((b) => b.cantidad === 0);

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Distribución por calificación
      </Text>

      {allZero || loading ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          {loading ? "Cargando..." : "Sin evaluaciones para mostrar"}
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={histograma} barCategoryGap="24%">
            <XAxis
              dataKey="valor_cc"
              tick={{ fontSize: 12, fill: "#59645c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#59645c" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              formatter={(value) => [`${value} animal(es)`, "Cantidad"]}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
              {histograma.map((entry) => (
                <Cell
                  key={entry.valor_cc}
                  fill={CC_COLORS[entry.valor_cc] ?? "#b8c4cc"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
