import { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ResultadoServicioRead, ServicioRead } from "@/features/servicios/types";

type Props = {
  resultados: ResultadoServicioRead[];
  servicios: ServicioRead[];
  loading: boolean;
};

// Hex constants — resolved values de la paleta VACCA (ver index.css). Los
// props SVG de recharts no resuelven variables CSS de forma confiable.
const COLORES = [
  "#4a7856", // --verde-vacca
  "#c08b3e", // --ocre-campo
  "#3e5c76", // --azul-acero
  "#c97a94", // --rosa-hembra
  "#e0a83e", // --ambar-aviso
  "#8a5a2b", // --marron-cuero
];
const GRID_COLOR = "#dfe4dc"; // --border
const TICK_COLOR = "#59645c"; // --text

function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "short",
    year: "2-digit",
  });
}

export function TimelineNacimientos({ resultados, servicios, loading }: Props) {
  const { data, series } = useMemo(() => {
    // La fuente es el resultado de la vaca (ResultadoServicio en PARIDA), no
    // el animal cría: la mayoría de los partos se marcan desde "Agregar
    // resultado" sin dar de alta todavía a la cría con su propia caravana
    // (eso es justamente lo que cuenta "Terneros pendientes de registro"),
    // así que basarse en animales con origen=SERVICIO deja la mayoría afuera.
    const paridas = resultados.filter((r) => r.estado === "PARIDA");

    const servicioNombrePorId = new Map(
      servicios.map((s) => [s.id, s.nombre || `Servicio #${s.id}`]),
    );

    const servicioIds = [...new Set(paridas.map((r) => r.servicio_id))];
    const series = servicioIds.map((id, i) => ({
      key: `s${id}`,
      nombre: servicioNombrePorId.get(id) ?? `Servicio #${id}`,
      color: COLORES[i % COLORES.length],
    }));

    const periodoDe = (r: ResultadoServicioRead) =>
      (r.fecha_diagnostico ?? r.creado_en).slice(0, 7);

    const periodos = [...new Set(paridas.map(periodoDe))].sort();

    const data = periodos.map((periodo) => {
      const fila: Record<string, string | number> = { periodo };
      for (const id of servicioIds) {
        fila[`s${id}`] = paridas.filter(
          (r) => r.servicio_id === id && periodoDe(r) === periodo,
        ).length;
      }
      return fila;
    });

    return { data, series };
  }, [resultados, servicios]);

  return (
    <Box>
      <Text
        fontSize="0.78rem"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.03em"
        color="var(--text)"
        mb="3">
        Terneros nacidos por servicio
      </Text>

      {loading ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          Cargando...
        </Text>
      ) : data.length === 0 ? (
        <Text fontSize="0.88rem" color="var(--text)" textAlign="center" py="6">
          Todavía no hay resultados PARIDA registrados en ningún servicio.
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="periodo"
              tickFormatter={formatPeriodo}
              tick={{ fontSize: 11, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              labelFormatter={(v: string) => formatPeriodo(v)}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map(({ key, nombre, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={nombre}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
