import { IconX } from "@tabler/icons-react";
import { colorPorEstadoLote, labelPorEstadoLote } from "../utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "../types";

type Props = {
  lote: LotePotreroPropiedades;
  onCerrar: () => void;
};

function formatearNumero(valor: number | null, decimales = 1): string {
  return valor === null ? "—" : valor.toFixed(decimales);
}

export function LoteDetallePanel({ lote, onCerrar }: Props) {
  return (
    <div className="mapa-detalle">
      <div className="mapa-detalle__header">
        <span
          className="mapa-detalle__estado"
          style={{ backgroundColor: colorPorEstadoLote(lote.estado) }}>
          {labelPorEstadoLote(lote.estado)}
        </span>
        <h3>{lote.nombre}</h3>
        <button
          type="button"
          className="mapa-detalle__cerrar"
          aria-label="Cerrar detalle"
          onClick={onCerrar}>
          <IconX size={16} stroke={1.75} />
        </button>
      </div>

      <dl className="mapa-detalle__lista">
        <div>
          <dt>Superficie</dt>
          <dd>{formatearNumero(lote.superficie_ha)} ha</dd>
        </div>
        <div>
          <dt>Receptividad</dt>
          <dd>{formatearNumero(lote.receptividad_ev_ha)} EV/ha</dd>
        </div>
        <div>
          <dt>Animales</dt>
          <dd>{lote.cantidad_animales}</dd>
        </div>
        <div>
          <dt>Carga actual</dt>
          <dd>{formatearNumero(lote.carga_animales_ha, 2)} cab/ha</dd>
        </div>
        <div>
          <dt>CC promedio</dt>
          <dd>{formatearNumero(lote.cc_promedio, 2)}</dd>
        </div>
      </dl>
    </div>
  );
}
