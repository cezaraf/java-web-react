import { http } from '../../shared/api/http'
import type { Page } from '../../shared/api/types'
import type { Grupo, GrupoInput } from './types'

export type ListarGruposParams = { q?: string; page?: number; size?: number; sort?: string }

export const listarGrupos = (params: ListarGruposParams, signal?: AbortSignal) => http.get<Page<Grupo>>('/api/grupos', params, signal)

/** Opções dos selects de grupo. Limite consciente de 100 grupos. */
export const listarGruposParaSelecao = (signal?: AbortSignal) => listarGrupos({ size: 100, sort: 'nome,asc' }, signal)

export const buscarGrupo = (id: number, signal?: AbortSignal) => http.get<Grupo>(`/api/grupos/${id}`, undefined, signal)

export const criarGrupo = (dados: GrupoInput) => http.post<Grupo>('/api/grupos', dados)

export const atualizarGrupo = (id: number, dados: GrupoInput) => http.put<Grupo>(`/api/grupos/${id}`, dados)

export const excluirGrupo = (id: number) => http.delete(`/api/grupos/${id}`)
