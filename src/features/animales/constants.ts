export const RAZAS = [
  "Angus",
  "Hereford",
  "Brangus",
  "Brahman",
  "Limousin",
  "Simmental",
  "Shorthorn",
  "Charolais",
  "Criolla",
  "Otro",
] as const;

export const SEXOS = [
  { value: "MACHO", label: "Macho", symbol: "♂" },
  { value: "HEMBRA", label: "Hembra", symbol: "♀" },
] as const;

export const CATEGORIAS_ANIMAL = [
  { value: "TERNERA", label: "Ternera" },
  { value: "VAQUILLA", label: "Vaquilla" },
  { value: "VACA_SECA", label: "Vaca seca" },
  { value: "VACA_LACTANDO", label: "Vaca en lactancia" },
  { value: "TERNERO", label: "Ternero" },
  { value: "NOVILLITO", label: "Novillito" },
  { value: "NOVILLO", label: "Novillo" },
  { value: "TORITO", label: "Torito" },
  { value: "TORO", label: "Toro" },
] as const;

export const CATEGORIA_ANIMAL_LABELS: Record<string, string> =
  Object.fromEntries(CATEGORIAS_ANIMAL.map(({ value, label }) => [value, label]));

export const ESTADOS_FILTRO = [
  { value: "ACTIVO", label: "Activo" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "MUERTO", label: "Muerto" },
] as const;

export const DEFAULT_CC_SCALE = {
  min: 1,
  max: 5,
  step: 1,
} as const;
