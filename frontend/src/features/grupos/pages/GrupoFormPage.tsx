import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ApiError, MENSAGEM_FALHA_CARREGAR } from '../../../shared/api/http'
import { Card } from '../../../shared/components/Card'
import { ErrorState } from '../../../shared/components/ErrorState'
import { FormSkeleton } from '../../../shared/components/FormSkeleton'
import { PageHeader } from '../../../shared/components/PageHeader'
import { atualizarGrupo, buscarGrupo, criarGrupo } from '../api'
import { GrupoForm } from '../components/GrupoForm'
import type { Grupo, GrupoInput } from '../types'

type Estado = { status: 'loading' } | { status: 'idle'; grupo?: Grupo } | { status: 'error'; error: unknown }

export function GrupoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>(id ? { status: 'loading' } : { status: 'idle' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setEstado({ status: 'loading' })
    buscarGrupo(Number(id), controller.signal)
      .then((grupo) => setEstado({ status: 'idle', grupo }))
      .catch((error) => {
        if (!controller.signal.aborted) setEstado({ status: 'error', error })
      })
    return () => controller.abort()
  }, [id, tentativa])

  async function salvar(dados: GrupoInput) {
    if (id) await atualizarGrupo(Number(id), dados)
    else await criarGrupo(dados)
    navigate('/grupos', { state: { flash: 'Grupo salvo com sucesso.' } })
  }

  return (
    <>
      <PageHeader title={id ? 'Editar grupo' : 'Novo grupo'} />
      <Card narrow>
        {estado.status === 'loading' && <FormSkeleton fields={2} />}
        {estado.status === 'error' &&
          (estado.error instanceof ApiError && (estado.error.status === 404 || estado.error.status === 400) ? (
            <ErrorState message="Registro não encontrado." backTo="/grupos" />
          ) : (
            <ErrorState message={MENSAGEM_FALHA_CARREGAR} onRetry={() => setTentativa((t) => t + 1)} />
          ))}
        {estado.status === 'idle' && (
          <GrupoForm
            initial={estado.grupo && { codigo: estado.grupo.codigo, nome: estado.grupo.nome }}
            onSubmit={salvar}
            onCancel={() => navigate('/grupos')}
          />
        )}
      </Card>
    </>
  )
}
