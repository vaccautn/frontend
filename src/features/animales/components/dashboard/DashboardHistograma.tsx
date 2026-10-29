import { Box, Text } from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { HistogramaBin } from "@/features/animales/types";
import { NIVEL_CC_HEX, nivelCC } from "@/features/animales/utils/ccColor";
import { CHART_TOOLTIP_STYLE } from "./chartTooltip";

type Props = {
  histograma: HistogramaBin[];
  loading: boolean;
  // Fecha de referencia para resolver el nivel de alerta (mes-dependiente),
  // igual que en las tablas — ver ccColor.ts.
  fecha: string;
};

const NIVEL_COLORS = NIVEL_CC_HEX;

const GRID_COLOR = "#dfe4dc"; // --border
const TICK_COLOR = "#59645c"; // --text

export function DashboardHistograma({ histograma, loading, fecha }: Props) {
  const allZero = histograma.every((b) => b.cantidad === 0);
  const maxCantidad = Math.max(...histograma.map((b) => b.cantidad), 0);
  // Ticks enteros (no tiene sentido mostrar "2.5 animales"); con pocos
  // animales se muestra cada entero, con muchos se agrupa de a varios para
  // no saturar el eje.
  const pasoTicks = maxCantidad <= 8 ? 1 : Math.ceil(maxCantidad / 6);
  const yTicks = Array.from(
    { length: Math.floor(maxCantidad / pasoTicks) + 1 },
    (_, i) => i * pasoTicks,
  );

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="1">
        Distribución por calificación
      </Text>
      <Text fontSize="0.74rem" color="var(--text)" mb="2">
        Cantidad de animales evaluados por condición corporal (CC)
      </Text>

      {allZero || loading ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          {loading ? "Cargando..." : "Sin evaluaciones para mostrar"}
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <BarChart
            data={histograma}
            barCategoryGap="24%"
            margin={{ top: 20, right: 20, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="valor_cc"
              tickFormatter={(value) => `CC ${value}`}
              interval={0}
              tick={{ fontSize: 12, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, maxCantidad]}
              ticks={yTicks}
              interval={0}
              tick={{ fontSize: 12, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              formatter={(value) => [`${value} animal(es)`, "Cantidad"]}
              labelFormatter={(value) => `CC ${value}`}
              contentStyle={CHART_TOOLTIP_STYLE}
            />
            <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
              {histograma.map((entry) => (
                <Cell
                  key={entry.valor_cc}
                  fill={NIVEL_COLORS[nivelCC(entry.valor_cc, fecha)]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
