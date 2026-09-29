import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@chakra-ui/react";
import { IconUpload } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { parseKml, parseKmz } from "../utils/kmzParser";
import type { CapaKmz } from "../types";

type Props = {
  onCargado: (capa: CapaKmz) => void;
};

export function KmzUploader({ onCargado }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCargando(true);
    try {
      // Google Earth exporta tanto .kml (XML plano) como .kmz (ese mismo XML
      // comprimido en un ZIP): se soportan los dos formatos.
      const capa = file.name.toLowerCase().endsWith(".kml")
        ? await parseKml(await file.text())
        : await parseKmz(await file.arrayBuffer());
      onCargado(capa);
      toast.success("Mapa del campo cargado.");
    } catch {
      toast.error(
        "No se pudo leer el archivo. Verificá que sea un KML o KMZ exportado de Google Earth.",
      );
    } finally {
      setCargando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        // Solo ".kmz"/".kml" hace que algunos selectores de archivos de Windows no
        // muestren el archivo si no tiene asociado ninguno de estos MIME types
        // exactos; se suman como alternativas para que el selector no lo oculte.
        accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz,application/zip"
        hidden
        onChange={handleChange}
      />
      <Button
        variant="outline"
        colorPalette="brand"
        loading={cargando}
        loadingText="Leyendo..."
        onClick={() => inputRef.current?.click()}>
        <IconUpload size={18} stroke={1.5} />
        Cargar mapa del campo (KML o KMZ)
      </Button>
    </>
  );
}
