import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { ServicioRead } from "@/features/servicios/types";
import { ESTADO_SERVICIO_LABELS } from "@/features/servicios/constants";
import { formatFecha } from "@/features/animales/utils/formatDate";

type Props = {
  servicios: ServicioRead[];
  loading: boolean;
};

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];
const MES_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseFechaSolo(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function servicioActivoEn(servicio: ServicioRead, day: Date): boolean {
  const inicio = parseFechaSolo(servicio.fecha_inicio);
  if (day < inicio) return false;
  if (!servicio.fecha_fin) return true;
  const fin = parseFechaSolo(servicio.fecha_fin);
  return day <= fin;
}

export function ServiciosCalendario({ servicios, loading }: Props) {
  const navigate = useNavigate();
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [mesActual, setMesActual] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(hoy);

  const celdas = useMemo(() => {
    const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const inicioGrilla = new Date(primerDiaMes);
    inicioGrilla.setDate(inicioGrilla.getDate() - primerDiaMes.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const dia = new Date(inicioGrilla);
      dia.setDate(inicioGrilla.getDate() + i);
      return dia;
    });
  }, [mesActual]);

  const serviciosPorDia = useMemo(() => {
    const map = new Map<string, ServicioRead[]>();
    for (const celda of celdas) {
      const activos = servicios.filter((s) => servicioActivoEn(s, celda));
      if (activos.length > 0) map.set(toDateKey(celda), activos);
    }
    return map;
  }, [celdas, servicios]);

  const serviciosDelDiaSeleccionado =
    serviciosPorDia.get(toDateKey(diaSeleccionado)) ?? [];

  const irMesAnterior = () =>
    setMesActual((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const irMesSiguiente = () =>
    setMesActual((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  const irHoy = () => {
    setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setDiaSeleccionado(hoy);
  };

  return (
    <Box display="flex" flexWrap="wrap" gap="6" alignItems="flex-start">
      <div className="servicios-calendario__mes">
        <Box display="flex" alignItems="center" justifyContent="space-between" mb="3">
          <Text
            fontSize="0.85rem"
            fontWeight="700"
            color="var(--text-h)"
            textTransform="capitalize">
            {MES_FORMATTER.format(mesActual)}
          </Text>
          <Box display="flex" alignItems="center" gap="1">
            <button
              type="button"
              className="sesiones-filtros__clear servicios-calendario__hoy"
              onClick={irHoy}>
              Hoy
            </button>
            <IconButton
              aria-label="Mes anterior"
              variant="outline"
              colorPalette="brand"
              size="xs"
              onClick={irMesAnterior}>
              <IconChevronLeft size={14} stroke={1.75} />
            </IconButton>
            <IconButton
              aria-label="Mes siguiente"
              variant="outline"
              colorPalette="brand"
              size="xs"
              onClick={irMesSiguiente}>
              <IconChevronRight size={14} stroke={1.75} />
            </IconButton>
          </Box>
        </Box>

        <div className="servicios-calendario__grid">
          {DIAS_SEMANA.map((dia, i) => (
            <div key={`${dia}-${i}`} className="servicios-calendario__weekday">
              {dia}
            </div>
          ))}

          {celdas.map((celda) => {
            const key = toDateKey(celda);
            const activos = serviciosPorDia.get(key) ?? [];
            const esDelMes = celda.getMonth() === mesActual.getMonth();
            const esHoy = toDateKey(celda) === toDateKey(hoy);
            const esSeleccionado = toDateKey(celda) === toDateKey(diaSeleccionado);

            return (
              <button
                key={key}
                type="button"
                className={`servicios-calendario__dia${
                  esDelMes ? "" : " servicios-calendario__dia--fuera-de-mes"
                }${esHoy ? " servicios-calendario__dia--hoy" : ""}${
                  esSeleccionado ? " servicios-calendario__dia--seleccionado" : ""
                }`}
                onClick={() => setDiaSeleccionado(celda)}>
                <span>{celda.getDate()}</span>
                {activos.length > 0 && (
                  <span className="servicios-calendario__dots">
                    {activos.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className={`servicios-calendario__dot servicios-calendario__dot--${s.estado}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="servicios-calendario__seleccion">
        <Text fontSize="0.85rem" fontWeight="700" color="var(--text-h)" mb="2">
          {formatFecha(toDateKey(diaSeleccionado))}
        </Text>

        {loading ? (
          <Text fontSize="0.85rem" color="var(--text)">
            Cargando...
          </Text>
        ) : serviciosDelDiaSeleccionado.length === 0 ? (
          <Text fontSize="0.85rem" color="var(--text)" opacity={0.7}>
            No hay servicios activos este día.
          </Text>
        ) : (
          <ul className="servicio-detail__lotes-lista">
            {serviciosDelDiaSeleccionado.map((servicio) => (
              <li
                key={servicio.id}
                className="servicio-detail__lote-item servicios-calendario__servicio-item"
                onClick={() => navigate(`/servicios/${servicio.id}`)}
                role="button"
                tabIndex={0}>
                <span>{servicio.nombre || `Servicio #${servicio.id}`}</span>
                <span
                  className={`servicio-badge servicio-badge--${servicio.estado}`}>
                  {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Box>
  );
}
