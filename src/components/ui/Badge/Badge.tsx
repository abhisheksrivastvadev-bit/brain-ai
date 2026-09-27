import React from 'react'
import { cn } from '../../../utils'
import './Badge.css'

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'brain-badge',
        `brain-badge--${variant}`,
        `brain-badge--${size}`,
        className
      )}
      {...props}
    >
      {dot && <span className="brain-badge-dot" />}
      {children}
    </span>
  )
}

export default Badge
