import { createBrowserRouter, Navigate } from 'react-router'
import { ExameFormPage } from '../features/exames/pages/ExameFormPage'
import { ExameListPage } from '../features/exames/pages/ExameListPage'
import { GrupoFormPage } from '../features/grupos/pages/GrupoFormPage'
import { GrupoListPage } from '../features/grupos/pages/GrupoListPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/exames" replace /> },
      { path: 'grupos', element: <GrupoListPage /> },
      { path: 'grupos/novo', element: <GrupoFormPage /> },
      { path: 'grupos/:id/editar', element: <GrupoFormPage /> },
      { path: 'exames', element: <ExameListPage /> },
      { path: 'exames/novo', element: <ExameFormPage /> },
      { path: 'exames/:id/editar', element: <ExameFormPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
