import { useEffect, useState, type ChangeEvent } from "react";
import { Button, Field, Input, Spinner } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { ApiError } from "@/services/httpClient";
import { normalizeBackendDetail } from "@/features/auth";
import {
  getConfiguracionCarga,
  updateConfiguracionCarga,
} from "../services/configuracionCargaService";

export function ConfiguracionCargaForm() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [umbralCcCritico, setUmbralCcCritico] = useState("");
  const [umbralSobrecargaPct, setUmbralSobrecargaPct] = useState("");
  const [umbralHolguraPct, setUmbralHolguraPct] = useState("");

  useEffect(() => {
    getConfiguracionCarga()
      .then((configuracion) => {
        setUmbralCcCritico(String(configuracion.umbral_cc_critico));
        setUmbralSobrecargaPct(String(configuracion.umbral_carga_sobrecarga_pct));
        setUmbralHolguraPct(String(configuracion.umbral_carga_holgura_pct));
      })
      .catch(() => toast.error("No se pudo cargar la configuración de carga animal."))
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateConfiguracionCarga({
        umbral_cc_critico: Number(umbralCcCritico),
        umbral_carga_sobrecarga_pct: Number(umbralSobrecargaPct),
        umbral_carga_holgura_pct: Number(umbralHolguraPct),
      });
      toast.success("Umbrales de carga animal actualizados.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudieron guardar los umbrales.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <Spinner size="sm" />;
  }

  return (
    <div className="configuracion-carga">
      <p className="configuracion-carga__descripcion">
        Definen cuándo un lote se marca como sobrecargado, al límite o subutilizado en el
        mapa de carga animal.
      </p>

      <Field.Root>
        <Field.Label>Condición corporal crítica (por debajo de esto, aliviar)</Field.Label>
        <Input
          type="number"
          step="0.1"
          value={umbralCcCritico}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setUmbralCcCritico(event.target.value)
          }
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Sobrecarga (% de la receptividad)</Field.Label>
        <Input
          type="number"
          step="1"
          value={umbralSobrecargaPct}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setUmbralSobrecargaPct(event.target.value)
          }
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Subutilizado (% de la receptividad)</Field.Label>
        <Input
          type="number"
          step="1"
          value={umbralHolguraPct}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setUmbralHolguraPct(event.target.value)
          }
        />
      </Field.Root>

      <Button
        colorPalette="brand"
        size="sm"
        onClick={handleGuardar}
        loading={guardando}
        loadingText="Guardando...">
        Guardar umbrales
      </Button>
    </div>
  );
}
