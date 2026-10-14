import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ApiError, MENSAGEM_FALHA_CARREGAR } from '../../../shared/api/http'
import { Card } from '../../../shared/components/Card'
import { ErrorState } from '../../../shared/components/ErrorState'
import { FormSkeleton } from '../../../shared/components/FormSkeleton'
import { PageHeader } from '../../../shared/components/PageHeader'
import { isoParaHoras } from '../../../shared/utils/duration'
import { listarGruposParaSelecao } from '../../grupos/api'
import { atualizarExame, buscarExame, criarExame } from '../api'
import { ExameForm } from '../components/ExameForm'
import type { Exame, ExameInput, GrupoResumo } from '../types'

type Estado =
  | { status: 'loading' }
  | { status: 'idle'; grupos: GrupoResumo[]; exame?: Exame }
  | { status: 'error'; error: unknown }

export function ExameFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>({ status: 'loading' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setEstado({ status: 'loading' })
    Promise.all([listarGruposParaSelecao(controller.signal), id ? buscarExame(Number(id), controller.signal) : undefined])
      .then(([grupos, exame]) => setEstado({ status: 'idle', grupos: grupos.content, exame }))
      .catch((error) => {
        if (!controller.signal.aborted) setEstado({ status: 'error', error })
      })
    return () => controller.abort()
  }, [id, tentativa])

  async function salvar(dados: ExameInput) {
    if (id) await atualizarExame(Number(id), dados)
    else await criarExame(dados)
    navigate('/exames', { state: { flash: 'Exame salvo com sucesso.' } })
  }

  const exame = estado.status === 'idle' ? estado.exame : undefined

  return (
    <>
      <PageHeader title={id ? 'Editar exame' : 'Novo exame'} />
      <Card narrow>
        {/* Grupos são carregados também na criação; o skeleton só aparece na edição. */}
        {estado.status === 'loading' && id && <FormSkeleton fields={4} />}
        {estado.status === 'error' &&
          (id && estado.error instanceof ApiError && (estado.error.status === 404 || estado.error.status === 400) ? (
            <ErrorState message="Registro não encontrado." backTo="/exames" />
          ) : (
            <ErrorState message={MENSAGEM_FALHA_CARREGAR} onRetry={() => setTentativa((t) => t + 1)} />
          ))}
        {estado.status === 'idle' && (
          <ExameForm
            grupos={estado.grupos}
            initial={
              exame && {
                codigo: exame.codigo,
                nome: exame.nome,
                horas: String(isoParaHoras(exame.tempoProcessamento)),
                grupoId: String(exame.grupo.id),
              }
            }
            onSubmit={salvar}
            onCancel={() => navigate('/exames')}
          />
        )}
      </Card>
    </>
  )
}
