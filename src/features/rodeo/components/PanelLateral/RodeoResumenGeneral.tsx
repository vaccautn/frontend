type Props = {
  totalLotes: number;
};

/** Cabecera del panel sin lote elegido. Las estadísticas del rodeo están en
 * Inicio. */
export function RodeoResumenGeneral({ totalLotes }: Props) {
  return (
    <div className="rodeo-panel__resumen">
      <div className="rodeo-panel__resumen-titulo">Rodeo completo</div>
      <div className="rodeo-panel__resumen-subtitulo">
        {totalLotes} {totalLotes === 1 ? "lote" : "lotes"} · elegí uno en el mapa para filtrar
      </div>
    </div>
  );
}
