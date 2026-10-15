import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import type { CategoriaAnimal } from "@/features/animales/types";

type Props = {
  caravanaInput: string;
  sexo: "MACHO" | "HEMBRA" | null;
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
};

const CAMPOS_VISIBLES_PANEL = ["caravana", "sexo", "categoria"] as const;

export function RodeoFiltrosPanel(props: Props) {
  return (
    <div className="rodeo-panel__filtros">
      <AnimalesFiltros
        {...props}
        camposVisibles={[...CAMPOS_VISIBLES_PANEL]}
      />
    </div>
  );
}
