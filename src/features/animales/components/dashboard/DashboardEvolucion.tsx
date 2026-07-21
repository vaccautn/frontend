import { Box, Text } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { EvolucionPunto } from "@/features/animales/types";

type Props = {
  evolucion: EvolucionPunto[];
  loading: boolean;
};

// Hex constants — resolved values of the VACCA palette from index.css.
// Recharts SVG attribute props do not reliably resolve CSS variables.
const LINE_COLOR = "#4a7856"; // --verde-vacca
const DOT_COLOR = "#2e5339"; // --verde-bosque
const REF_COLOR = "#4a9163"; // --verde-confirmacion
const GRID_COLOR = "#dfe4dc"; // --border
const TICK_COLOR = "#59645c"; // --text

export function DashboardEvolucion({ evolucion, loading }: Props) {
  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Evolución del promedio de CC
      </Text>

      {evolucion.length === 0 || loading ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          {loading ? "Cargando..." : "Sin historial de evaluaciones disponible"}
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={evolucion}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 11, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={20}
            />
            <ReferenceLine
              y={3}
              stroke={REF_COLOR}
              strokeDasharray="4 2"
              strokeOpacity={0.55}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(2), "Promedio CC"]}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="promedio"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              dot={{ r: 4, fill: DOT_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
