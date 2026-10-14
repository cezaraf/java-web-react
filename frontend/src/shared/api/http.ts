import type { ProblemDetail } from './types'

/** Erro de chamada à API. `status` 0 indica falha de rede. */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetail | null

  constructor(status: number, problem: ProblemDetail | null) {
    super(problem?.detail ?? `Erro HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

export const MENSAGEM_FALHA_CARREGAR = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.'

/** Falha de rede ou erro do servidor (5xx): o usuário só pode tentar de novo. */
export function isFalhaDeConexao(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status === 0 || error.status >= 500
}

type Query = Record<string, string | number | undefined>

async function request<T>(method: string, path: string, options: { query?: Query; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(options.query ?? {})) {
    if (valor !== undefined && valor !== '') params.set(chave, String(valor))
  }
  const url = params.size ? `${path}?${params}` : path

  let response: Response
  try {
    response = await fetch(url, {
      method,
      signal: options.signal,
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(0, null)
  }

  if (response.status === 204) return undefined as T

  // O proxy do Vite responde 5xx com corpo não-JSON quando o backend está fora do ar.
  const corpo: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, corpo && typeof corpo === 'object' ? (corpo as ProblemDetail) : null)
  }
  return corpo as T
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  delete: (path: string) => request<void>('DELETE', path),
}
