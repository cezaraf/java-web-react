import { useEffect } from 'react'
import { Button } from './Button'
import styles from './FlashMessage.module.css'

const DURACAO_MS = 5000

/** Região `role="status"` sempre presente para que leitores de tela anunciem a mensagem ao aparecer. */
export function FlashMessage({ message, onClose }: { message: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, DURACAO_MS)
    return () => clearTimeout(timer)
  }, [message, onClose])

  return (
    <div role="status">
      {message && (
        <div className={styles.flash}>
          <p>{message}</p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      )}
    </div>
  )
}
