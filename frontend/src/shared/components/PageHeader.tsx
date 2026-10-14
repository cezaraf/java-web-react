import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className={styles.header}>
      <h1>{title}</h1>
      {action}
    </div>
  )
}
