import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import type { CategoriaAnimal } from "@/features/animales/types";

type Props = {
  caravanaInput: string;
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
};

const CAMPOS_VISIBLES_PANEL = ["caravana", "categoria"] as const;

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
