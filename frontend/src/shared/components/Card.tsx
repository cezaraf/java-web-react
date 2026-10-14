import type { ReactNode } from 'react'
import styles from './Card.module.css'

export function Card({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={narrow ? `${styles.card} ${styles.narrow}` : styles.card}>{children}</div>
}
