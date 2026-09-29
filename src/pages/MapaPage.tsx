import { MapaLotes } from "@/features/mapa/components/MapaLotes";

export function MapaPage() {
  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Mapa del campo</h1>
        </div>
      </div>

      <MapaLotes />
    </section>
  );
}
