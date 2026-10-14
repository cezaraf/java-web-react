import { useEffect, useId, useState } from 'react'
import styles from './SearchInput.module.css'

const DEBOUNCE_MS = 300

/** Campo de busca com debounce; `value` vem da URL e `onChange` só dispara após 300 ms sem digitação. */
export function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId()
  const [texto, setTexto] = useState(value)
  const [valorAnterior, setValorAnterior] = useState(value)

  // URL mudou por fora (ex.: "Limpar busca", voltar): sincroniza o campo.
  if (value !== valorAnterior) {
    setValorAnterior(value)
    setTexto(value)
  }

  useEffect(() => {
    if (texto === value) return
    const timer = setTimeout(() => onChange(texto), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [texto, value, onChange])

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className="visually-hidden">
        Buscar por código ou nome
      </label>
      <input
        id={id}
        type="search"
        className={styles.input}
        placeholder="Buscar por código ou nome"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
    </div>
  )
}
