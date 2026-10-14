import { Outlet } from 'react-router'
import { TopNav } from '../shared/components/TopNav'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <>
      <TopNav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
