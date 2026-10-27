import { useEffect, useState } from "react";
import { Portal, Spinner } from "@chakra-ui/react";
import { IconPhoto, IconX } from "@tabler/icons-react";
import { getImagenesEvaluacion } from "@/features/animales/services/animalesService";

type Props = {
  evaluacionId: number | null;
  /** Para el texto alternativo y el aria-label. */
  caravana: string;
  /** Si es true, clickear la foto la abre en pantalla completa. */
  ampliable?: boolean;
  className?: string;
};

/** Primera foto de una evaluación, ocupando todo su contenedor. Sin foto
 * muestra un ícono. */
export function EvaluacionFoto({
  evaluacionId,
  caravana,
  ampliable = false,
  className = "",
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(evaluacionId !== null);
  const [ampliada, setAmpliada] = useState(false);

  useEffect(() => {
    if (evaluacionId === null) return;
    let isMounted = true;
    getImagenesEvaluacion(evaluacionId)
      .then((imagenes) => {
        if (isMounted) setUrl(imagenes[0]?.url ?? null);
      })
      .catch(() => {
        if (isMounted) setUrl(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [evaluacionId]);

  useEffect(() => {
    if (!ampliada) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAmpliada(false);
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [ampliada]);

  const clases = `evaluacion-foto ${className}`;

  if (loading || !url) {
    return (
      <div className={clases}>
        {loading ? <Spinner size="sm" /> : <IconPhoto size={24} stroke={1.5} />}
      </div>
    );
  }

  if (!ampliable) {
    return (
      <div className={clases}>
        <img src={url} alt={`Foto de ${caravana}`} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${clases} evaluacion-foto--ampliable`}
        aria-label={`Ver foto de ${caravana} en pantalla completa`}
        onClick={(event) => {
          event.stopPropagation();
          setAmpliada(true);
        }}>
        <img src={url} alt="" />
      </button>
      {ampliada && (
        <Portal>
          <div
            className="animal-imagenes__lightbox"
            onClick={() => setAmpliada(false)}>
            <button
              type="button"
              className="animal-imagenes__lightbox-close"
              aria-label="Cerrar"
              onClick={(event) => {
                event.stopPropagation();
                setAmpliada(false);
              }}>
              <IconX size={20} stroke={1.75} />
            </button>
            <img
              src={url}
              alt={`Evaluación de ${caravana} en pantalla completa`}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Portal>
      )}
    </>
  );
}
