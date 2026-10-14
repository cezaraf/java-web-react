import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import form from '../../../shared/styles/form.module.css'
import { errosDoServidor, focarPrimeiroInvalido, validarFormulario, type ErrosCampo, type MensagensValidacao } from '../../../shared/utils/form'
import type { GrupoInput } from '../types'

const MENSAGENS: MensagensValidacao = {
  codigo: { valueMissing: 'Informe o código.', tooLong: 'O código deve ter no máximo 10 caracteres.' },
  nome: { valueMissing: 'Informe o nome.', tooLong: 'O nome deve ter no máximo 50 caracteres.' },
}
const CAMPOS = Object.keys(MENSAGENS)

const CONFLITOS: ErrosCampo = {
  codigo: 'Já existe um grupo com este código.',
  nome: 'Já existe um grupo com este nome.',
}

interface Props {
  initial?: GrupoInput
  /** Rejeita com `ApiError` para exibir erros de campo/banner; o formulário mantém os dados digitados. */
  onSubmit: (dados: GrupoInput) => Promise<void>
  onCancel: () => void
}

export function GrupoForm({ initial, onSubmit, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [valores, setValores] = useState<GrupoInput>(initial ?? { codigo: '', nome: '' })
  const [erros, setErros] = useState<ErrosCampo>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function alterar(campo: keyof GrupoInput, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: '' }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBanner(null)
    const errosCliente = validarFormulario(event.currentTarget, MENSAGENS)
    if (Object.keys(errosCliente).length) {
      setErros(errosCliente)
      focarPrimeiroInvalido(formRef.current, CAMPOS, errosCliente)
      return
    }
    setEnviando(true)
    try {
      await onSubmit(valores)
    } catch (error) {
      const { campos, banner } = errosDoServidor(error, CONFLITOS)
      setErros(campos)
      setBanner(banner)
      focarPrimeiroInvalido(formRef.current, CAMPOS, campos)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form ref={formRef} className={form.form} noValidate onSubmit={handleSubmit} aria-busy={enviando}>
      {banner && (
        <p role="alert" className={form.banner}>
          {banner}
        </p>
      )}
      <TextField
        label="Código"
        name="codigo"
        required
        maxLength={10}
        autoComplete="off"
        value={valores.codigo}
        onChange={(e) => alterar('codigo', e.target.value.toUpperCase())}
        error={erros.codigo}
      />
      <TextField
        label="Nome"
        name="nome"
        required
        maxLength={50}
        autoComplete="off"
        value={valores.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        error={erros.nome}
      />
      <div className={form.actions}>
        <Button type="submit" variant="primary" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}
