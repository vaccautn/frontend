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
import { nivelCC, type NivelCC } from "@/features/animales/utils/ccColor";

type Props = {
  histograma: HistogramaBin[];
  loading: boolean;
  // Fecha de referencia para resolver el nivel de alerta (mes-dependiente),
  // igual que en las tablas — ver ccColor.ts.
  fecha: string;
};

// Hex constants — resolved values of the VACCA palette from index.css
// (--danger / --warning / --success). Recharts SVG fill props do not
// reliably resolve CSS variables, así que se repiten los mismos valores
// que usan los badges de nivel en las tablas.
const NIVEL_COLORS: Record<NivelCC, string> = {
  critico: "#c94c4c", // --rojo-alerta / --danger
  atencion: "#e0a83e", // --ambar-aviso / --warning
  normal: "#4a9163", // --verde-confirmacion / --success
};

export function DashboardHistograma({ histograma, loading, fecha }: Props) {
  const allZero = histograma.every((b) => b.cantidad === 0);
  const maxCantidad = Math.max(...histograma.map((b) => b.cantidad), 0);
  const yTicks = Array.from({ length: maxCantidad + 1 }, (_, i) => i);

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
              domain={[0, maxCantidad]}
              ticks={yTicks}
              tick={{ fontSize: 12, fill: "#59645c" }}
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
