import { DatePicker, Portal, parseDate } from "@chakra-ui/react";
import { IconCalendar } from "@tabler/icons-react";

// Sin esto el calendario usa UTC: de noche en Argentina marca como "hoy" el
// día siguiente.
const ZONA_HORARIA_LOCAL = Intl.DateTimeFormat().resolvedOptions().timeZone;

type FechaInputProps = {
  /** Fecha en formato YYYY-MM-DD, o "" si no hay. */
  value: string;
  /** Fecha máxima permitida, en formato YYYY-MM-DD. */
  max?: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
  className?: string;
};

/** Selector de fecha con el calendario de la app (en vez del nativo del
 * navegador, que no respeta el idioma ni la paleta). */
export function FechaInput({
  value,
  max,
  onChange,
  id,
  "aria-label": ariaLabel,
  className,
}: FechaInputProps) {
  return (
    <DatePicker.Root
      locale="es-AR"
      timeZone={ZONA_HORARIA_LOCAL}
      startOfWeek={1}
      colorPalette="brand"
      value={value ? [parseDate(value)] : []}
      max={max ? parseDate(max) : undefined}
      onValueChange={(details) => onChange(details.value[0]?.toString() ?? "")}
      className={className}>
      <DatePicker.Control>
        <DatePicker.Input
          id={id}
          aria-label={ariaLabel}
          placeholder="dd/mm/aaaa"
          bg="var(--panel)"
        />
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger aria-label="Abrir calendario">
            <IconCalendar size={16} stroke={1.5} />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}
