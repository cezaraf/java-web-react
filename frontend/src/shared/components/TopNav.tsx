import { NavLink } from 'react-router'
import styles from './TopNav.module.css'

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link
}

export function TopNav() {
  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.brand}>Neovita Exames</span>
        <nav aria-label="Principal">
          <ul className={styles.links}>
            <li>
              <NavLink to="/exames" className={linkClass}>
                Exames
              </NavLink>
            </li>
            <li>
              <NavLink to="/grupos" className={linkClass}>
                Grupos
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
