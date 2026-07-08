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
