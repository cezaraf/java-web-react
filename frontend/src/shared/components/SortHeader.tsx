import table from '../styles/table.module.css'

interface Props {
  field: string
  label: string
  /** Ordenação atual no formato `campo,asc|desc`. */
  sort: string
  onSort: (sort: string) => void
}

/** `<th>` ordenável: botão interno + `aria-sort`. Clicar alterna asc → desc; outra coluna começa em asc. */
export function SortHeader({ field, label, sort, onSort }: Props) {
  const [campo, direcao] = sort.split(',')
  const ativo = campo === field
  const desc = ativo && direcao === 'desc'
  return (
    <th scope="col" aria-sort={ativo ? (desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className={table.sort} onClick={() => onSort(`${field},${ativo && !desc ? 'desc' : 'asc'}`)}>
        {label}
        {ativo && <span aria-hidden="true">{desc ? '↓' : '↑'}</span>}
      </button>
    </th>
  )
}
