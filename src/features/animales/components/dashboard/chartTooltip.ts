/** Estilo del tooltip de los gráficos de Recharts: misma tarjeta flotante
 * que los menús (radio md, sombra pop, sin borde). */
export const CHART_TOOLTIP_STYLE = {
  background: "var(--panel)",
  border: "none",
  borderRadius: 12,
  boxShadow: "var(--shadow-pop)",
  fontSize: 13,
  padding: "8px 12px",
} as const;
