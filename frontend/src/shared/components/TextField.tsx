import { useId, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  suffix?: string
}

export function TextField({ label, error, suffix, id, ...props }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-erro`
  const suffixId = `${inputId}-sufixo`
  const describedBy = [suffix && suffixId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input {...props} id={inputId} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
        {suffix && (
          <span id={suffixId} className={styles.suffix}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
