import { useId, type SelectHTMLAttributes } from 'react'
import styles from './SelectField.module.css'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  /** Label só para leitores de tela (ex.: filtro na barra de ferramentas). */
  hideLabel?: boolean
}

export function SelectField({ label, error, hideLabel = false, id, children, ...props }: Props) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-erro`

  return (
    <div className={styles.field}>
      <label htmlFor={selectId} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <select {...props} id={selectId} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
        {children}
      </select>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
