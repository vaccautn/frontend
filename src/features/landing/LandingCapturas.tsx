import { VaccaIsotipo } from "@/components/ui/VaccaIsotipo";
import { useState } from "react";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { IconArrowsMaximize, IconX } from "@tabler/icons-react";

const pantallas = [
  {
    id: "inicio",
    nombre: "Inicio",
    titulo: "El rodeo, de un vistazo",
    texto:
      "Indicadores de condición corporal, evolución y acceso a la última sesión de evaluación.",
    alt: "Tablero de inicio de VACCA con indicadores del rodeo y gráficos de condición corporal.",
  },
  {
    id: "rodeo",
    nombre: "Rodeo",
    titulo: "Cada animal en su lugar",
    texto:
      "Buscá por caravana, filtrá por lote y consultá los animales sin perder el contexto del campo.",
    alt: "Listado paginado de animales de VACCA junto al mapa de lotes.",
  },
  {
    id: "mapa",
    nombre: "Mapa",
    titulo: "Una mirada sobre el campo",
    texto:
      "Ubicá los lotes y consultá sus animales desde el mapa. Los polígonos de esta captura pertenecen a un campo de demostración.",
    alt: "Mapa de VACCA con ocho potreros de demostración y un panel lateral de animales.",
  },
  {
    id: "animal",
    nombre: "Animal",
    titulo: "Una historia por caravana",
    texto:
      "Reuní fotos, evaluaciones, servicios y crías en la ficha de cada animal.",
    alt: "Ficha de un animal de demostración con foto de su evaluación e historial reproductivo.",
  },
  {
    id: "sesion",
    nombre: "Evaluaciones",
    titulo: "De la jornada al seguimiento",
    texto:
      "Cargá las evaluaciones una por una o subí el video de la manga, y revisá el resumen de cada sesión.",
    alt: "Detalle de una sesión de evaluación de condición corporal en VACCA.",
  },
  {
    id: "servicios",
    nombre: "Servicios",
    titulo: "Seguí el ciclo reproductivo",
    texto:
      "Recorré los servicios en una línea de tiempo, filtralos por fecha y consultá resultados, participantes y nacimientos.",
    alt: "Vista de servicios de VACCA con línea de tiempo y resumen del servicio seleccionado.",
  },
  {
    id: "importacion",
    nombre: "Importación",
    titulo: "De la planilla al rodeo",
    texto:
      "Prepará un CSV o Excel, revisá cómo se interpreta y resolvé las dudas antes de importar.",
    alt: "Pantalla de importación con pasos, plantilla y explicación de las seis columnas del archivo.",
  },
  {
    id: "carga-tabla",
    nombre: "Carga en tabla",
    titulo: "Cargá varios animales juntos",
    texto:
      "Completá caravana y lote en una tabla. La carga queda registrada como una tanda.",
    alt: "Tabla de alta de animales con campos para caravana, lote y categoría.",
  },
  {
    id: "historial",
    nombre: "Historial",
    titulo: "Sabé quién cargó qué",
    texto:
      "Altas, importaciones y movimientos quedan registrados con su responsable y el resultado de cada tanda.",
    alt: "Historial de actividad de VACCA con responsables y tandas de carga.",
  },
  {
    id: "campo",
    nombre: "Campo",
    titulo: "Un campo, un equipo",
    texto:
      "Accedé a tus campos y sumá colaboradores que trabajan sobre el mismo rodeo, desde las evaluaciones hasta los videos.",
    alt: "Administración del campo de demostración y acceso a sus colaboradores.",
  },
];

export function LandingCapturas() {
  const [seleccionada, setSeleccionada] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const pantalla = pantallas[seleccionada];
  return (
    <>
      <div
        className="landing-capture-options"
        role="group"
        aria-label="Elegir pantalla de la aplicación"
      >
        {pantallas.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={index === seleccionada}
            aria-controls="landing-pantalla"
            onClick={() => setSeleccionada(index)}
          >
            {item.nombre}
          </button>
        ))}
      </div>
      <div
        className="landing-product-frame"
        id="landing-pantalla"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="landing-frame-bar">
          <span className="landing-frame-brand">
            <VaccaIsotipo size={18} /> VACCA <span>/ {pantalla.nombre}</span>
          </span>
          <button
            type="button"
            onClick={() => setAmpliada(true)}
            aria-label={`Ampliar captura de ${pantalla.nombre}`}
          >
            <IconArrowsMaximize size={16} /> Ampliar
          </button>
        </div>
        <button
          type="button"
          className="landing-capture-trigger"
          onClick={() => setAmpliada(true)}
          aria-label={`Ver ${pantalla.nombre} en pantalla completa`}
        >
          <img
            key={pantalla.id}
            src={`/landing/${pantalla.id}.jpg`}
            alt={pantalla.alt}
            width={1440}
            height={960}
            loading="lazy"
            decoding="async"
          />
        </button>
        <div className="landing-capture-caption">
          <h3>{pantalla.titulo}</h3>
          <p>{pantalla.texto}</p>
        </div>
      </div>
      <p className="landing-demo-note">
        Capturas reales de la aplicación. Los animales, lotes y registros son
        datos de demostración.
      </p>
      <Dialog.Root
        open={ampliada}
        onOpenChange={(event) => setAmpliada(event.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="landing-lightbox">
              <Dialog.Header>
                <Dialog.Title>{pantalla.nombre} · VACCA</Dialog.Title>
                <Button
                  variant="ghost"
                  aria-label="Cerrar captura"
                  onClick={() => setAmpliada(false)}
                >
                  <IconX size={20} />
                </Button>
              </Dialog.Header>
              <Dialog.Body>
                <img
                  src={`/landing/${pantalla.id}.jpg`}
                  alt={pantalla.alt}
                  width={1440}
                  height={960}
                />
                <Dialog.Description>
                  {pantalla.texto} Datos de demostración.
                </Dialog.Description>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
