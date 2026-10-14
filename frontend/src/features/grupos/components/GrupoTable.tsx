import { Button, ButtonLink } from '../../../shared/components/Button'
import { SortHeader } from '../../../shared/components/SortHeader'
import table from '../../../shared/styles/table.module.css'
import type { Grupo } from '../types'

interface Props {
  grupos: Grupo[]
  sort: string
  onSort: (sort: string) => void
  onExcluir: (grupo: Grupo) => void
}

export function GrupoTable({ grupos, sort, onSort, onExcluir }: Props) {
  return (
    <table className={table.table}>
      <caption className="visually-hidden">Grupos de exames</caption>
      <thead>
        <tr>
          <SortHeader field="codigo" label="Código" sort={sort} onSort={onSort} />
          <SortHeader field="nome" label="Nome" sort={sort} onSort={onSort} />
          <th scope="col" className={table.actionsHead}>
            Ações
          </th>
        </tr>
      </thead>
      <tbody>
        {grupos.map((grupo) => (
          <tr key={grupo.id}>
            <td data-label="Código" className={table.mono}>
              {grupo.codigo}
            </td>
            <td data-label="Nome">{grupo.nome}</td>
            <td className={table.actions}>
              <div className={table.actionButtons}>
                <ButtonLink to={`/grupos/${grupo.id}/editar`}>
                  Editar<span className="visually-hidden"> {grupo.nome}</span>
                </ButtonLink>
                <Button onClick={() => onExcluir(grupo)}>
                  Excluir<span className="visually-hidden"> {grupo.nome}</span>
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
