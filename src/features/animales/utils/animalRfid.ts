export function getAnimalRfidLabel(animalRfid: string | null): string {
  return animalRfid?.trim() || "Sin RFID";
}
