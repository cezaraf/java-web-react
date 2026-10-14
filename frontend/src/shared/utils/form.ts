import { ApiError, isFalhaDeConexao } from '../api/http'

export const MENSAGEM_FALHA_SALVAR = 'Não foi possível salvar. Tente novamente.'

/** Mensagens pt-BR por campo e por tipo de falha da validação nativa (`ValidityState`). A ordem define o foco. */
export type MensagensValidacao = Record<string, Partial<Record<keyof ValidityState, string>>>

export type ErrosCampo = Record<string, string>

/** Lê `validity` dos controles (form com `noValidate`) e devolve as mensagens próprias. */
export function validarFormulario(form: HTMLFormElement, mensagens: MensagensValidacao): ErrosCampo {
  const erros: ErrosCampo = {}
  for (const [campo, porTipo] of Object.entries(mensagens)) {
    const el = form.elements.namedItem(campo) as HTMLInputElement | HTMLSelectElement | null
    if (!el || el.validity.valid) continue
    const tipo = (Object.keys(porTipo) as (keyof ValidityState)[]).find((t) => el.validity[t])
    erros[campo] = (tipo && porTipo[tipo]) || 'Valor inválido.'
  }
  return erros
}

/** Traduz o erro da API em erros por campo (400 `errors[]`, 409 `field`) ou em banner. */
export function errosDoServidor(error: unknown, conflitos: ErrosCampo): { campos: ErrosCampo; banner: string | null } {
  if (error instanceof ApiError && !isFalhaDeConexao(error)) {
    const problem = error.problem
    if (error.status === 400 && problem?.errors?.length) {
      return { campos: Object.fromEntries(problem.errors.map((e) => [e.field, e.message])), banner: null }
    }
    if (error.status === 409 && problem?.field && conflitos[problem.field]) {
      return { campos: { [problem.field]: conflitos[problem.field] }, banner: null }
    }
    return { campos: {}, banner: problem?.detail ?? MENSAGEM_FALHA_SALVAR }
  }
  return { campos: {}, banner: MENSAGEM_FALHA_SALVAR }
}

export function focarPrimeiroInvalido(form: HTMLFormElement | null, ordem: string[], erros: ErrosCampo) {
  const campo = ordem.find((c) => erros[c])
  if (campo) (form?.elements.namedItem(campo) as HTMLElement | null)?.focus()
}
