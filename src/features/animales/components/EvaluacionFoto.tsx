import { useEffect, useState } from "react";
import { Portal, Spinner } from "@chakra-ui/react";
import { IconX } from "@tabler/icons-react";
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
 * muestra la silueta de una vaca. */
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
        {loading ? <Spinner size="sm" /> : <VacaGenerica caravana={caravana} />}
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

// Silueta de vaca de perfil (dibujada a ~470px de ancho y escalada).
const SILUETA_VACA =
  "M80 200 C80 186 86 176 100 175 C140 172 190 179 240 184 C290 189 350 178 398 168 C410 165 425 160 436 156 C450 152 462 158 472 168 C488 184 505 202 512 214 C515 222 511 231 502 233 C490 236 474 234 462 230 C450 226 440 232 428 240 C412 252 398 270 384 284 C374 294 368 306 364 318 C360 340 356 362 358 384 C359 396 362 404 366 410 L352 412 C346 400 344 388 344 372 C342 356 340 342 336 332 C337 350 338 366 338 378 C339 392 341 402 344 410 L330 412 C326 400 325 388 325 376 C324 360 322 344 318 328 C300 324 260 322 225 320 C205 319 188 320 172 322 C165 330 158 334 150 333 L149 339 L145 339 L145 333 C138 333 132 331 128 328 C128 345 126 360 122 372 C121 385 128 398 134 408 L121 411 C114 400 108 388 106 376 C104 390 103 400 106 409 L93 411 C89 398 87 384 86 370 C84 350 82 330 80 300 C80 260 79 225 80 200 Z";

/** Ilustración para evaluaciones sin foto: silueta de vaca en verde vacca
 * sobre verde muy claro. La vaca entra entera en cualquier proporción
 * (tarjeta ancha o avatar chico); el fondo lo pone el CSS. */
function VacaGenerica({ caravana }: { caravana: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      preserveAspectRatio="xMidYMid meet"
      className="evaluacion-foto__ilustracion"
      role="img"
      aria-label={`${caravana}, sin foto`}>
      <g transform="translate(7.3 -9) scale(0.26)" fill="var(--verde-vacca)">
        <path d={SILUETA_VACA} />
        <path d="M438 160 C428 152 418 150 410 154 C418 162 428 165 440 164 Z" />
        <path d="M446 154 C448 145 456 140 466 140 C460 145 456 150 455 157 Z" />
        <path d="M440 154 C440 147 444 143 450 141 C447 146 446 150 447 157 Z" />
        <path d="M70 318 C62 326 56 340 54 352 C62 348 70 340 74 330 Z" />
        <path
          d="M84 184 C76 220 74 262 74 300 C74 310 73 318 71 324"
          fill="none"
          stroke="var(--verde-vacca)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
