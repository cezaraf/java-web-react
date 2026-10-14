import { http } from '../../shared/api/http'
import type { Page } from '../../shared/api/types'
import type { Exame, ExameInput } from './types'

export type ListarExamesParams = { q?: string; grupoId?: string; page?: number; size?: number; sort?: string }

export const listarExames = (params: ListarExamesParams, signal?: AbortSignal) => http.get<Page<Exame>>('/api/exames', params, signal)

export const buscarExame = (id: number, signal?: AbortSignal) => http.get<Exame>(`/api/exames/${id}`, undefined, signal)

export const criarExame = (dados: ExameInput) => http.post<Exame>('/api/exames', dados)

export const atualizarExame = (id: number, dados: ExameInput) => http.put<Exame>(`/api/exames/${id}`, dados)

export const excluirExame = (id: number) => http.delete(`/api/exames/${id}`)
