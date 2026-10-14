import { Button } from './Button'
import styles from './Pagination.module.css'

interface Props {
  page: number
  totalPages: number
  totalElements: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalElements, onChange }: Props) {
  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <Button disabled={page <= 0} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <Button disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Próxima
      </Button>
      <p className={styles.status}>
        Página {page + 1} de {Math.max(totalPages, 1)} · {totalElements} {totalElements === 1 ? 'registro' : 'registros'}
      </p>
    </nav>
  )
}
