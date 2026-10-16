import JSZip from "jszip";
import type { CapaKmz, GroundOverlay } from "../types";

/**
 * Descomprime un KMZ (ZIP con un .kml adentro) y devuelve el texto del KML más los
 * GroundOverlay que tenga (imágenes georreferenciadas por una LatLonBox), ya que
 * `ol/format/KML` ignora los GroundOverlay por completo.
 */
export async function parseKmz(buffer: ArrayBuffer): Promise<CapaKmz> {
  const zip = await JSZip.loadAsync(buffer);
  const kmlEntryName = Object.keys(zip.files).find((name) =>
    name.toLowerCase().endsWith(".kml"),
  );
  if (!kmlEntryName) {
    throw new Error("El archivo no contiene un .kml adentro (¿es realmente un KMZ?)");
  }

  const kml = await zip.file(kmlEntryName)!.async("text");
  const groundOverlays = await extraerGroundOverlays(kml, zip, kmlEntryName);

  return { kml, groundOverlays };
}

/**
 * Google Earth también puede exportar un .kml plano (XML sin comprimir, sin ZIP). No
 * hay ZIP del que resolver imágenes relativas de los GroundOverlay: si el href no es
 * una URL absoluta, se usa tal cual (ver resolverHrefImagen).
 */
export async function parseKml(kml: string): Promise<CapaKmz> {
  const groundOverlays = await extraerGroundOverlays(kml, null, "");
  return { kml, groundOverlays };
}

async function extraerGroundOverlays(
  kml: string,
  zip: JSZip | null,
  kmlEntryName: string,
): Promise<GroundOverlay[]> {
  const doc = new DOMParser().parseFromString(kml, "application/xml");
  const overlays: GroundOverlay[] = [];

  for (const nodo of Array.from(doc.getElementsByTagName("GroundOverlay"))) {
    const href = nodo.getElementsByTagName("href")[0]?.textContent?.trim();
    const latLonBox = nodo.getElementsByTagName("LatLonBox")[0];
    if (!href || !latLonBox) continue;

    const north = Number(latLonBox.getElementsByTagName("north")[0]?.textContent);
    const south = Number(latLonBox.getElementsByTagName("south")[0]?.textContent);
    const east = Number(latLonBox.getElementsByTagName("east")[0]?.textContent);
    const west = Number(latLonBox.getElementsByTagName("west")[0]?.textContent);
    const rotation = Number(latLonBox.getElementsByTagName("rotation")[0]?.textContent ?? "0");
    if ([north, south, east, west].some((valor) => Number.isNaN(valor))) continue;

    const resolvedHref = await resolverHrefImagen(href, zip, kmlEntryName);
    overlays.push({ href: resolvedHref, north, south, east, west, rotation });
  }

  return overlays;
}

async function resolverHrefImagen(
  href: string,
  zip: JSZip | null,
  kmlEntryName: string,
): Promise<string> {
  if (!zip || /^https?:\/\//i.test(href)) return href;

  const baseDir = kmlEntryName.includes("/")
    ? kmlEntryName.slice(0, kmlEntryName.lastIndexOf("/") + 1)
    : "";
  const candidatos = [`${baseDir}${href}`, href.replace(/^\.\//, "")];

  for (const ruta of candidatos) {
    const entry = zip.file(ruta);
    if (entry) {
      const blob = await entry.async("blob");
      return URL.createObjectURL(blob);
    }
  }
  // No se encontró la imagen dentro del zip: se devuelve tal cual, probablemente
  // falle al cargar, pero no debería romper el resto del mapa.
  return href;
}
