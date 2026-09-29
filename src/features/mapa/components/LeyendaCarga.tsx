import { ESTADOS_LEYENDA, colorPorEstadoLote, labelPorEstadoLote } from "../utils/estadoLoteColor";

export function LeyendaCarga() {
  return (
    <ul className="mapa-leyenda">
      {ESTADOS_LEYENDA.map((estado) => (
        <li key={estado} className="mapa-leyenda__item">
          <span
            className="mapa-leyenda__color"
            style={{ backgroundColor: colorPorEstadoLote(estado) }}
          />
          {labelPorEstadoLote(estado)}
        </li>
      ))}
    </ul>
  );
}
