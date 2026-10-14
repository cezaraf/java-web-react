import { Button, ButtonLink } from '../../../shared/components/Button'
import { SortHeader } from '../../../shared/components/SortHeader'
import table from '../../../shared/styles/table.module.css'
import { isoParaHoras } from '../../../shared/utils/duration'
import type { Exame } from '../types'

interface Props {
  exames: Exame[]
  sort: string
  onSort: (sort: string) => void
  onExcluir: (exame: Exame) => void
}

export function ExameTable({ exames, sort, onSort, onExcluir }: Props) {
  return (
    <table className={table.table}>
      <caption className="visually-hidden">Exames</caption>
      <thead>
        <tr>
          <SortHeader field="codigo" label="Código" sort={sort} onSort={onSort} />
          <SortHeader field="nome" label="Nome" sort={sort} onSort={onSort} />
          <SortHeader field="tempoProcessamento" label="Tempo de processamento" sort={sort} onSort={onSort} />
          <SortHeader field="grupo.nome" label="Grupo" sort={sort} onSort={onSort} />
          <th scope="col" className={table.actionsHead}>
            Ações
          </th>
        </tr>
      </thead>
      <tbody>
        {exames.map((exame) => (
          <tr key={exame.id}>
            <td data-label="Código" className={table.mono}>
              {exame.codigo}
            </td>
            <td data-label="Nome">{exame.nome}</td>
            <td data-label="Tempo de processamento" className={table.mono}>
              {isoParaHoras(exame.tempoProcessamento)} h
            </td>
            <td data-label="Grupo">
              <span className={table.badge}>{exame.grupo.nome}</span>
            </td>
            <td className={table.actions}>
              <div className={table.actionButtons}>
                <ButtonLink to={`/exames/${exame.id}/editar`}>
                  Editar<span className="visually-hidden"> {exame.nome}</span>
                </ButtonLink>
                <Button onClick={() => onExcluir(exame)}>
                  Excluir<span className="visually-hidden"> {exame.nome}</span>
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
