import React from 'react'
import { cn } from '../../../utils'
import { Loader } from '../Loader'
import './Button.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'gradient'

export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonShape = 'rounded' | 'pill' | 'square'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'rounded',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading
    const loaderSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'
    const loaderColor =
      variant === 'secondary' || variant === 'ghost' || variant === 'outline'
        ? 'current'
        : 'white'

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          'brain-btn',
          `brain-btn--${variant}`,
          `brain-btn--${size}`,
          `brain-btn--shape-${shape}`,
          fullWidth && 'brain-btn--full',
          isLoading && 'brain-btn--loading',
          Boolean(loadingText) && 'brain-btn--with-loading-text',
          isDisabled && 'brain-btn--disabled',
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="brain-btn__loader-wrapper">
            <Loader
              variant="spinner"
              size={loaderSize}
              color={loaderColor}
              aria-hidden="true"
            />
            {loadingText && (
              <span className="brain-btn__loading-text">{loadingText}</span>
            )}
          </span>
        )}

        <span className="brain-btn__content">
          {leftIcon && <span className="brain-btn__icon brain-btn__icon--left">{leftIcon}</span>}
          {children && <span className="brain-btn__text">{children}</span>}
          {rightIcon && <span className="brain-btn__icon brain-btn__icon--right">{rightIcon}</span>}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
