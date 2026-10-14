/** Converte horas inteiras para ISO-8601 (`48` → `"PT48H"`). */
export function horasParaIso(horas: number): string {
  return `PT${horas}H`
}

/** Converte ISO-8601 em horas inteiras (`"PT48H"` → `48`). Aceita apenas o formato `PT{n}H` emitido pela API. */
export function isoParaHoras(iso: string): number {
  const match = /^PT(\d+)H$/.exec(iso)
  if (!match) throw new Error(`Duração não suportada: ${iso}`)
  return Number(match[1])
}
