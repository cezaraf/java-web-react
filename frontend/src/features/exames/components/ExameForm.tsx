import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../shared/components/Button'
import { SelectField } from '../../../shared/components/SelectField'
import { TextField } from '../../../shared/components/TextField'
import form from '../../../shared/styles/form.module.css'
import { horasParaIso } from '../../../shared/utils/duration'
import { errosDoServidor, focarPrimeiroInvalido, validarFormulario, type ErrosCampo, type MensagensValidacao } from '../../../shared/utils/form'
import type { ExameInput, GrupoResumo } from '../types'

const HORAS_INVALIDAS = 'Informe um número inteiro de horas entre 1 e 8760.'

const MENSAGENS: MensagensValidacao = {
  codigo: { valueMissing: 'Informe o código.', tooLong: 'O código deve ter no máximo 10 caracteres.' },
  nome: { valueMissing: 'Informe o nome.', tooLong: 'O nome deve ter no máximo 100 caracteres.' },
  tempoProcessamento: {
    badInput: HORAS_INVALIDAS,
    valueMissing: 'Informe o tempo de processamento.',
    rangeUnderflow: HORAS_INVALIDAS,
    rangeOverflow: HORAS_INVALIDAS,
    stepMismatch: HORAS_INVALIDAS,
  },
  grupoId: { valueMissing: 'Selecione o grupo.' },
}
const CAMPOS = Object.keys(MENSAGENS)

const CONFLITOS: ErrosCampo = {
  codigo: 'Já existe um exame com este código.',
  nome: 'Já existe um exame com este nome.',
}

/** Valores como digitados nos controles; `horas` e `grupoId` viram número no envio. */
export interface ExameFormValues {
  codigo: string
  nome: string
  horas: string
  grupoId: string
}

interface Props {
  grupos: GrupoResumo[]
  initial?: ExameFormValues
  onSubmit: (dados: ExameInput) => Promise<void>
  onCancel: () => void
}

export function ExameForm({ grupos, initial, onSubmit, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [valores, setValores] = useState<ExameFormValues>(initial ?? { codigo: '', nome: '', horas: '', grupoId: '' })
  const [erros, setErros] = useState<ErrosCampo>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const semGrupos = grupos.length === 0

  function alterar(campo: keyof ExameFormValues, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErros((e) => ({ ...e, [campo === 'horas' ? 'tempoProcessamento' : campo]: '' }))
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
      await onSubmit({
        codigo: valores.codigo,
        nome: valores.nome,
        tempoProcessamento: horasParaIso(Number(valores.horas)),
        grupoId: Number(valores.grupoId),
      })
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
      {semGrupos && (
        <p className={form.notice}>
          Cadastre um grupo antes de cadastrar exames. <Link to="/grupos/novo">Cadastrar grupo</Link>
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
        maxLength={100}
        autoComplete="off"
        value={valores.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        error={erros.nome}
      />
      <TextField
        label="Tempo de processamento"
        name="tempoProcessamento"
        type="number"
        inputMode="numeric"
        required
        min={1}
        max={8760}
        step={1}
        suffix="horas"
        value={valores.horas}
        onChange={(e) => alterar('horas', e.target.value)}
        error={erros.tempoProcessamento}
      />
      <SelectField label="Grupo" name="grupoId" required value={valores.grupoId} onChange={(e) => alterar('grupoId', e.target.value)} error={erros.grupoId}>
        <option value="">Selecione um grupo</option>
        {grupos.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </SelectField>
      <div className={form.actions}>
        <Button type="submit" variant="primary" disabled={enviando || semGrupos}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}
