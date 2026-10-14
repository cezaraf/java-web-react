import { Link } from 'react-router'
import { Button } from './Button'
import styles from './ErrorState.module.css'

interface Props {
  message: string
  onRetry?: () => void
  /** Rota da lista para o link "Voltar para a lista" (ex.: 404 na edição). */
  backTo?: string
}

export function ErrorState({ message, onRetry, backTo }: Props) {
  return (
    <div className={styles.state} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
      {backTo && <Link to={backTo}>Voltar para a lista</Link>}
    </div>
  )
}
