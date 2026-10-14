import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GrupoListPage } from './GrupoListPage'

function respostaJson(corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('GrupoListPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('exibe ErrorState em falha de rede e recarrega ao clicar "Tentar novamente"', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        respostaJson({
          content: [{ id: 1, codigo: 'HEM', nome: 'Hematologia' }],
          page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const router = createMemoryRouter([{ path: '/grupos', element: <GrupoListPage /> }], { initialEntries: ['/grupos'] })
    render(<RouterProvider router={router} />)

    expect(
      await screen.findByText('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('cell', { name: 'Hematologia' })).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 · 1 registro')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/grupos?page=0&sort=nome%2Casc')
  })
})
