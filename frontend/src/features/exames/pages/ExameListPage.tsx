import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { ApiError, isFalhaDeConexao, MENSAGEM_FALHA_CARREGAR } from '../../../shared/api/http'
import type { Page } from '../../../shared/api/types'
import { Button, ButtonLink } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { FlashMessage } from '../../../shared/components/FlashMessage'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchInput } from '../../../shared/components/SearchInput'
import { TableSkeleton } from '../../../shared/components/TableSkeleton'
import list from '../../../shared/styles/list.module.css'
import { SelectField } from '../../../shared/components/SelectField'
import { listarGruposParaSelecao } from '../../grupos/api'
import { excluirExame, listarExames } from '../api'
import { ExameTable } from '../components/ExameTable'
import type { Exame, GrupoResumo } from '../types'

const SORT_PADRAO = 'nome,asc'

type Estado = { status: 'loading' } | { status: 'success'; dados: Page<Exame> } | { status: 'error'; error: unknown }
type Exclusao = { exame: Exame; erro: string | null; bloqueada: boolean; ocupada: boolean }

export function ExameListPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Math.max(Number(params.get('page')) || 0, 0)
  const sort = params.get('sort') ?? SORT_PADRAO
  const grupoId = params.get('grupoId') ?? ''
  const filtrando = Boolean(q.trim() || grupoId)

  const [estado, setEstado] = useState<Estado>({ status: 'loading' })
  const [recarga, setRecarga] = useState(0)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const fecharFlash = useCallback(() => setFlash(null), [])
  const [grupos, setGrupos] = useState<GrupoResumo[]>([])

  // Opções do filtro; se falhar, fica só "Todos os grupos" até o próximo "Tentar novamente".
  useEffect(() => {
    const controller = new AbortController()
    listarGruposParaSelecao(controller.signal)
      .then((dados) => setGrupos(dados.content))
      .catch(() => {})
    return () => controller.abort()
  }, [recarga])

  const atualizarUrl = useCallback(
    (mudancas: Record<string, string | null>) =>
      setParams((atual) => {
        const proximo = new URLSearchParams(atual)
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor) proximo.set(chave, valor)
          else proximo.delete(chave)
        }
        return proximo
      }),
    [setParams],
  )

  const buscar = useCallback((valor: string) => atualizarUrl({ q: valor || null, page: null }), [atualizarUrl])

  // Mensagem de sucesso vinda do formulário (navigate state); limpa o state para não reaparecer no "voltar".
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const mensagem = (location.state as { flash?: string } | null)?.flash
    if (mensagem) {
      setFlash(mensagem)
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    const controller = new AbortController()
    setEstado({ status: 'loading' })
    listarExames({ q, grupoId, page, sort }, controller.signal)
      .then((dados) => {
        // Página além do fim (ex.: excluiu o último item da página): vai para a última página existente.
        if (dados.content.length === 0 && page > 0 && dados.page.totalPages > 0) {
          atualizarUrl({ page: String(dados.page.totalPages - 1) })
        } else {
          setEstado({ status: 'success', dados })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setEstado({ status: 'error', error })
      })
    return () => controller.abort()
  }, [q, grupoId, page, sort, recarga, atualizarUrl])

  async function confirmarExclusao() {
    if (!exclusao) return
    setExclusao({ ...exclusao, ocupada: true, erro: null })
    try {
      await excluirExame(exclusao.exame.id)
      setExclusao(null)
      setFlash('Exame excluído com sucesso.')
      setRecarga((r) => r + 1)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setExclusao(null)
        setFlash('O registro já havia sido excluído.')
        setRecarga((r) => r + 1)
      } else {
        setExclusao({ ...exclusao, ocupada: false, erro: 'Não foi possível excluir. Tente novamente.' })
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Exames"
        action={
          <ButtonLink to="/exames/novo" variant="primary">
            Novo exame
          </ButtonLink>
        }
      />
      <FlashMessage message={flash} onClose={fecharFlash} />
      <div className={list.toolbar}>
        <SearchInput value={q} onChange={buscar} />
        <SelectField label="Filtrar por grupo" hideLabel value={grupoId} onChange={(e) => atualizarUrl({ grupoId: e.target.value || null, page: null })}>
          <option value="">Todos os grupos</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </SelectField>
      </div>
      <Card>
        {estado.status === 'loading' && <TableSkeleton columns={['Código', 'Nome', 'Tempo de processamento', 'Grupo', 'Ações']} caption="Exames" />}
        {estado.status === 'error' && (
          <ErrorState
            message={isFalhaDeConexao(estado.error) ? MENSAGEM_FALHA_CARREGAR : ((estado.error as ApiError).problem?.detail ?? MENSAGEM_FALHA_CARREGAR)}
            onRetry={() => setRecarga((r) => r + 1)}
          />
        )}
        {estado.status === 'success' &&
          (estado.dados.content.length === 0 ? (
            filtrando ? (
              <EmptyState
                message={q.trim() ? `Nenhum resultado para “${q}”.` : 'Nenhum resultado para o grupo selecionado.'}
                action={<Button onClick={() => atualizarUrl({ q: null, grupoId: null, page: null })}>Limpar busca</Button>}
              />
            ) : (
              <EmptyState
                message="Nenhum exame cadastrado."
                action={
                  <ButtonLink to="/exames/novo" variant="primary">
                    Novo exame
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              <ExameTable
                exames={estado.dados.content}
                sort={sort}
                onSort={(novo) => atualizarUrl({ sort: novo, page: null })}
                onExcluir={(exame) => setExclusao({ exame, erro: null, bloqueada: false, ocupada: false })}
              />
              <Pagination
                page={estado.dados.page.number}
                totalPages={estado.dados.page.totalPages}
                totalElements={estado.dados.page.totalElements}
                onChange={(p) => atualizarUrl({ page: p > 0 ? String(p) : null })}
              />
            </>
          ))}
      </Card>
      <ConfirmDialog
        open={exclusao !== null}
        title="Excluir exame"
        message={exclusao ? `Deseja excluir o exame “${exclusao.exame.nome}”?` : ''}
        error={exclusao?.erro}
        confirmable={!exclusao?.bloqueada}
        busy={exclusao?.ocupada}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </>
  )
}
