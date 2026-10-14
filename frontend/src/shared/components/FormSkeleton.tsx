import form from '../styles/form.module.css'
import styles from './FormSkeleton.module.css'

/** Blocos com a altura exata do formulário final: label + controle de 48px por campo e botões de 44px. */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div className={form.form} aria-busy="true">
      <span className="visually-hidden">Carregando…</span>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className={styles.field}>
          <span className={styles.label} />
          <span className={styles.control} />
        </div>
      ))}
      <div className={form.actions}>
        <span className={styles.button} />
        <span className={styles.button} />
      </div>
    </div>
  )
}
