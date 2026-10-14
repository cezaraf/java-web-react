import table from '../styles/table.module.css'
import styles from './TableSkeleton.module.css'

const LINHAS = 5

/** Mesma estrutura da tabela final (cabeçalho, 5 linhas de 56px; lista empilhada abaixo de 640px). */
export function TableSkeleton({ columns, caption }: { columns: string[]; caption: string }) {
  const dados = columns.slice(0, -1)
  return (
    <div aria-busy="true">
      <table className={table.table}>
        <caption className="visually-hidden">{caption} — carregando…</caption>
        <thead>
          <tr>
            {dados.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
            <th scope="col" className={table.actionsHead}>
              {columns.at(-1)}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: LINHAS }, (_, i) => (
            <tr key={i}>
              {dados.map((c) => (
                <td key={c}>
                  <span className={styles.skeleton} />
                </td>
              ))}
              <td className={table.actions}>
                <span className={styles.skeletonActions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
