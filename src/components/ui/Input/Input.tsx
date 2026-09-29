import React, { useState, useId } from 'react'
import { cn } from '../../../utils'
import { EyeIcon, EyeOffIcon, CloseIcon, AlertCircleIcon } from '../../icons'
import './Input.css'

export type InputVariant = 'outlined' | 'filled' | 'underlined'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  variant?: InputVariant
  size?: InputSize
  error?: string | boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isClearable?: boolean
  onClear?: () => void
  fullWidth?: boolean
  wrapperClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      type = 'text',
      variant = 'outlined',
      size = 'md',
      error,
      helperText,
      leftIcon,
      rightIcon,
      isClearable = false,
      onClear,
      fullWidth = false,
      disabled = false,
      required = false,
      value,
      defaultValue,
      onChange,
      className = '',
      wrapperClassName = '',
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || `brain-input-${generatedId}`
    const innerRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current!)

    const isPasswordType = type === 'password'
    const [showPassword, setShowPassword] = useState(false)
    const [internalValue, setInternalValue] = useState<string>(
      (value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : '') || ''
    )

    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value) : internalValue
    const hasValue = Boolean(currentValue && currentValue.length > 0)

    // Keep internal value in sync with external controlled value
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (!isControlled) {
        setInternalValue('')
      }
      onClear?.()

      const inputEl = innerRef.current || (document.getElementById(inputId) as HTMLInputElement | null)
      if (inputEl) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set

        if (nativeSetter) {
          nativeSetter.call(inputEl, '')
        } else {
          inputEl.value = ''
        }

        const inputEvent = new Event('input', { bubbles: true })
        inputEl.dispatchEvent(inputEvent)

        const changeEvent = new Event('change', { bubbles: true })
        inputEl.dispatchEvent(changeEvent)

        inputEl.focus()
      }
    }

    const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type
    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined

    return (
      <div
        className={cn(
          'brain-input-wrapper',
          fullWidth && 'brain-input-wrapper--full',
          wrapperClassName
        )}
      >
        {label && (
          <label htmlFor={inputId} className="brain-input-label">
            {label}
            {required && <span className="brain-input-required">*</span>}
          </label>
        )}

        <div
          className={cn(
            'brain-input-container',
            `brain-input-container--${variant}`,
            `brain-input-container--${size}`,
            hasError && 'brain-input-container--error',
            disabled && 'brain-input-container--disabled'
          )}
        >
          {leftIcon && (
            <span className="brain-input-icon brain-input-icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={innerRef}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            required={required}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn('brain-input', className)}
            {...props}
          />

          <div className="brain-input-actions">
            {isClearable && hasValue && !disabled && (
              <button
                type="button"
                className="brain-input-action-btn brain-input-action-btn--clear"
                onClick={handleClear}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                aria-label="Clear input"
                title="Clear"
              >
                <CloseIcon size={14} />
              </button>
            )}

            {isPasswordType && !disabled && (
              <button
                type="button"
                className="brain-input-action-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            )}

            {rightIcon && !isPasswordType && (
              <span className="brain-input-icon brain-input-icon--right" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </div>
        </div>

        {(errorMessage || helperText) && (
          <div className="brain-input-footer">
            {errorMessage ? (
              <span id={`${inputId}-error`} className="brain-input-error-msg" role="alert">
                <AlertCircleIcon size={14} />
                {errorMessage}
              </span>
            ) : (
              <span id={`${inputId}-helper`} className="brain-input-helper">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
