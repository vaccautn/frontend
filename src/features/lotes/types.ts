import type { CategoriaAnimal } from "@/features/animales/types";

export type LoteOption = {
  id: number;
  nombre: string;
  categoria: CategoriaAnimal;
  activo: boolean;
};
