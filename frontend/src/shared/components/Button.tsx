import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary'

function classes(variant: Variant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ')
}

export function Button({ variant = 'secondary', className, ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button type="button" {...props} className={classes(variant, className)} />
}

export function ButtonLink({ variant = 'secondary', className, ...props }: LinkProps & { variant?: Variant }) {
  return <Link {...props} className={classes(variant, className)} />
}
