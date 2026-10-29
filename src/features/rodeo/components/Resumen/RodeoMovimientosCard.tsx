import { Box, IconButton, Text } from "@chakra-ui/react";
import { IconRefresh } from "@tabler/icons-react";
import type { Movimiento } from "@/features/mapa/types";

type Props = {
  movimientos: Movimiento[];
  loading: boolean;
  onRefrescar: () => void;
};

export function RodeoMovimientosCard({ movimientos, loading, onRefrescar }: Props) {
  return (
    <Box className="rodeo-dashboard-full__card">
      <div className="rodeo-dashboard-full__card-titulo">
        <Text
          fontSize="0.78rem"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.03em"
          color="var(--text)">
          Movimientos recomendados
        </Text>
        <IconButton
          size="2xs"
          variant="ghost"
          aria-label="Recalcular recomendaciones"
          title="Recalcular"
          onClick={onRefrescar}
          loading={loading}>
          <IconRefresh size={14} stroke={1.75} />
        </IconButton>
      </div>

      {loading && <p className="status-message">Calculando...</p>}

      {!loading && movimientos.length === 0 && (
        <p className="status-message">No hay lotes que necesiten aliviarse por ahora.</p>
      )}

      {!loading && movimientos.length > 0 && (
        <ul className="mapa-recomendaciones__lista">
          {movimientos.map((movimiento, indice) => (
            <li key={indice} className="mapa-recomendaciones__item">
              <span>
                <strong>{movimiento.origen_nombre}</strong> → <strong>{movimiento.destino_nombre}</strong>
              </span>
              <span className="mapa-recomendaciones__motivo">{movimiento.motivo}</span>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
