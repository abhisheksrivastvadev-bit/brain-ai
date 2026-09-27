import React from 'react'
import { cn } from '../../../utils'
import './Card.css'

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  footer?: React.ReactNode
  glass?: boolean
  hoverable?: boolean
  glow?: boolean
  children?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  action,
  footer,
  glass = true,
  hoverable = false,
  glow = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'brain-card',
        glass && 'brain-card--glass',
        hoverable && 'brain-card--hoverable',
        glow && 'brain-card--glow',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="brain-card__header">
          <div>
            {title && <h3 className="brain-card__title">{title}</h3>}
            {description && <p className="brain-card__description">{description}</p>}
          </div>
          {action && <div className="brain-card__action">{action}</div>}
        </div>
      )}

      <div className="brain-card__body">{children}</div>

      {footer && <div className="brain-card__footer">{footer}</div>}
    </div>
  )
}

export default Card
