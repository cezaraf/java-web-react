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
import { excluirGrupo, listarGrupos } from '../api'
import { GrupoTable } from '../components/GrupoTable'
import type { Grupo } from '../types'

const SORT_PADRAO = 'nome,asc'

type Estado = { status: 'loading' } | { status: 'success'; dados: Page<Grupo> } | { status: 'error'; error: unknown }
type Exclusao = { grupo: Grupo; erro: string | null; bloqueada: boolean; ocupada: boolean }

export function GrupoListPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Math.max(Number(params.get('page')) || 0, 0)
  const sort = params.get('sort') ?? SORT_PADRAO

  const [estado, setEstado] = useState<Estado>({ status: 'loading' })
  const [recarga, setRecarga] = useState(0)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const fecharFlash = useCallback(() => setFlash(null), [])

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
    listarGrupos({ q, page, sort }, controller.signal)
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
  }, [q, page, sort, recarga, atualizarUrl])

  async function confirmarExclusao() {
    if (!exclusao) return
    setExclusao({ ...exclusao, ocupada: true, erro: null })
    try {
      await excluirGrupo(exclusao.grupo.id)
      setExclusao(null)
      setFlash('Grupo excluído com sucesso.')
      setRecarga((r) => r + 1)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setExclusao(null)
        setFlash('O registro já havia sido excluído.')
        setRecarga((r) => r + 1)
      } else if (error instanceof ApiError && error.status === 409) {
        setExclusao({ ...exclusao, ocupada: false, bloqueada: true, erro: error.problem?.detail ?? 'Este grupo não pode ser excluído.' })
      } else {
        setExclusao({ ...exclusao, ocupada: false, erro: 'Não foi possível excluir. Tente novamente.' })
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Grupos de exames"
        action={
          <ButtonLink to="/grupos/novo" variant="primary">
            Novo grupo
          </ButtonLink>
        }
      />
      <FlashMessage message={flash} onClose={fecharFlash} />
      <div className={list.toolbar}>
        <SearchInput value={q} onChange={buscar} />
      </div>
      <Card>
        {estado.status === 'loading' && <TableSkeleton columns={['Código', 'Nome', 'Ações']} caption="Grupos de exames" />}
        {estado.status === 'error' && (
          <ErrorState
            message={isFalhaDeConexao(estado.error) ? MENSAGEM_FALHA_CARREGAR : ((estado.error as ApiError).problem?.detail ?? MENSAGEM_FALHA_CARREGAR)}
            onRetry={() => setRecarga((r) => r + 1)}
          />
        )}
        {estado.status === 'success' &&
          (estado.dados.content.length === 0 ? (
            q.trim() ? (
              <EmptyState message={`Nenhum resultado para “${q}”.`} action={<Button onClick={() => atualizarUrl({ q: null, page: null })}>Limpar busca</Button>} />
            ) : (
              <EmptyState
                message="Nenhum grupo cadastrado."
                action={
                  <ButtonLink to="/grupos/novo" variant="primary">
                    Novo grupo
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              <GrupoTable
                grupos={estado.dados.content}
                sort={sort}
                onSort={(novo) => atualizarUrl({ sort: novo, page: null })}
                onExcluir={(grupo) => setExclusao({ grupo, erro: null, bloqueada: false, ocupada: false })}
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
        title="Excluir grupo"
        message={exclusao ? `Deseja excluir o grupo “${exclusao.grupo.nome}”?` : ''}
        error={exclusao?.erro}
        confirmable={!exclusao?.bloqueada}
        busy={exclusao?.ocupada}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </>
  )
}
