import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/http'
import { GrupoForm } from './GrupoForm'

describe('GrupoForm', () => {
  it('exibe sob o campo o erro de duplicidade vindo de um 409', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(409, { status: 409, detail: 'Já existe um grupo com este código.', field: 'codigo' }),
    )
    render(<GrupoForm onSubmit={onSubmit} onCancel={() => {}} />)

    await userEvent.type(screen.getByLabelText('Código'), 'hem')
    await userEvent.type(screen.getByLabelText('Nome'), 'Hematologia')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).toHaveBeenCalledWith({ codigo: 'HEM', nome: 'Hematologia' })
    const codigo = screen.getByLabelText('Código')
    expect(await screen.findByText('Já existe um grupo com este código.')).toBeInTheDocument()
    expect(codigo).toHaveAttribute('aria-invalid', 'true')
    expect(codigo).toHaveAccessibleDescription('Já existe um grupo com este código.')
    expect(codigo).toHaveFocus()
    expect(screen.getByLabelText('Nome')).toHaveValue('Hematologia')
  })

  it('bloqueia no cliente o envio com código vazio', async () => {
    const onSubmit = vi.fn()
    render(<GrupoForm onSubmit={onSubmit} onCancel={() => {}} />)

    await userEvent.type(screen.getByLabelText('Nome'), 'Hematologia')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o código.')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveAttribute('aria-invalid', 'true')
  })

  it('mostra banner e mantém os dados em falha de rede', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(0, null))
    render(<GrupoForm onSubmit={onSubmit} onCancel={() => {}} />)

    await userEvent.type(screen.getByLabelText('Código'), 'HEM')
    await userEvent.type(screen.getByLabelText('Nome'), 'Hematologia')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar. Tente novamente.')
    expect(screen.getByLabelText('Código')).toHaveValue('HEM')
  })
})
