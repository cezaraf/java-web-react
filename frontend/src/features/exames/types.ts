export interface GrupoResumo {
  id: number
  codigo: string
  nome: string
}

export interface Exame {
  id: number
  codigo: string
  nome: string
  /** ISO-8601, ex.: `"PT48H"`. */
  tempoProcessamento: string
  grupo: GrupoResumo
}

export interface ExameInput {
  codigo: string
  nome: string
  tempoProcessamento: string
  grupoId: number
}
