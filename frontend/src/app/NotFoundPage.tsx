import { Link } from 'react-router'
import { Card } from '../shared/components/Card'
import { PageHeader } from '../shared/components/PageHeader'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página não encontrada." />
      <Card>
        <Link to="/exames">Ir para a lista de exames</Link>
      </Card>
    </>
  )
}
