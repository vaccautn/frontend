type Props = {
  distribucion: Record<string, number>;
};

export function SesionCCHistograma({ distribucion }: Props) {
  const valores = Object.keys(distribucion)
    .map(Number)
    .sort((a, b) => a - b);

  if (valores.length === 0) {
    return <span className="sesiones-histograma__empty">—</span>;
  }

  const maxCount = Math.max(...valores.map((v) => distribucion[String(v)]));

  return (
    <div
      className="sesiones-histograma"
      title="Distribución de valores de CC evaluados">
      {valores.map((valor) => {
        const count = distribucion[String(valor)];
        const alturaPct = Math.max((count / maxCount) * 100, 12);
        return (
          <div key={valor} className="sesiones-histograma__barra-wrapper">
            <div
              className="sesiones-histograma__barra"
              style={{ height: `${alturaPct}%` }}
              aria-label={`CC ${valor}: ${count} evaluación(es)`}
            />
            <span className="sesiones-histograma__label">{valor}</span>
          </div>
        );
      })}
    </div>
  );
}
