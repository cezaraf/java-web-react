import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

interface Props {
  open: boolean
  title: string
  message: string
  /** Erro exibido dentro do dialog. */
  error?: string | null
  /** Quando `false`, oculta "Excluir" e "Cancelar" vira "Fechar" (ex.: 409). */
  confirmable?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, error, confirmable = true, busy = false, onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      if (openerRef.current?.isConnected) openerRef.current.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button ref={cancelRef} onClick={onClose} disabled={busy}>
          {confirmable ? 'Cancelar' : 'Fechar'}
        </Button>
        {confirmable && (
          <Button variant="primary" onClick={onConfirm} disabled={busy}>
            Excluir
          </Button>
        )}
      </div>
    </dialog>
  )
}
