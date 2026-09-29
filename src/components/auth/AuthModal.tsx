import React, { useState, useEffect, useMemo } from 'react'
import {
  BrainIcon,
  CloseIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  CheckIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '../icons'
import { Input, Button, Loader } from '../ui'
import { authService } from '../../services'
import type { User } from '../../types'
import './AuthModal.css'

export type AuthModalMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: AuthModalMode
  onClose: () => void
  onSuccess: (user: User) => void
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  passwordConfirm?: string
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode)

  // Registration Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // Login Fields
  const [rememberMe, setRememberMe] = useState(true)

  // State Feedback
  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password inline sub-view
  const [isForgotView, setIsForgotView] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Adjust state during render when modal opens or initialMode changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode)

  if (isOpen !== prevIsOpen || (isOpen && initialMode !== prevInitialMode)) {
    setPrevIsOpen(isOpen)
    setPrevInitialMode(initialMode)
    if (isOpen) {
      setMode(initialMode)
      setErrors({})
      setGeneralError(null)
      setSuccessMsg(null)
      setIsForgotView(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Real-time password strength calculation for registration
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'empty' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    const labels = ['weak', 'weak', 'fair', 'good', 'strong'] as const
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
    }
  }, [password])

  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm

  if (!isOpen) return null

  const switchMode = (newMode: AuthModalMode) => {
    setMode(newMode)
    setErrors({})
    setGeneralError(null)
    setSuccessMsg(null)
    setIsForgotView(false)
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (mode === 'register') {
      if (!name.trim()) {
        newErrors.name = 'Full name is required.'
      } else if (name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters.'
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      newErrors.password = 'Password is required.'
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.'
    }

    if (mode === 'register') {
      if (!passwordConfirm) {
        newErrors.passwordConfirm = 'Please confirm your password.'
      } else if (password !== passwordConfirm) {
        newErrors.passwordConfirm = 'Passwords do not match.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validate()) return

    setIsLoading(true)
    try {
      if (mode === 'login') {
        const res = await authService.login({
          email: email.trim(),
          password,
          rememberMe,
        })
        if (res.success && res.user) {
          setSuccessMsg('Signed in successfully!')
          setTimeout(() => {
            onSuccess(res.user!)
            onClose()
          }, 600)
        } else {
          setGeneralError(res.error || 'Invalid credentials. Please verify your details.')
        }
      } else {
        const res = await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
          passwordConfirm,
          agreeTerms: true,
        })
        if (res.success && res.user) {
          setSuccessMsg('Account created successfully!')
          setTimeout(() => {
            onSuccess(res.user!)
            onClose()
          }, 600)
        } else {
          setGeneralError(res.error || 'Failed to create account. Please try again.')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.'
      setGeneralError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) return
    setForgotSent(true)
    setTimeout(() => {
      setForgotSent(false)
      setIsForgotView(false)
      setForgotEmail('')
    }, 2200)
  }

  return (
    <div className="brain-auth-modal-overlay" onClick={onClose}>
      <div
        className="brain-auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="brain-auth-modal-glow-line" />

        {/* Prominent Loading Overlay during Authentication API call */}
        {isLoading && (
          <div className="brain-auth-loading-overlay" aria-live="polite">
            <Loader
              variant="spinner"
              size="lg"
              color="purple"
              text={mode === 'register' ? 'Creating your account...' : 'Signing in to Brain AI...'}
              textPosition="bottom"
            />
          </div>
        )}

        {/* Modal Header */}
        <div className="brain-auth-modal-header">
          <div className="brain-auth-modal-brand-lockup">
            <div className="brain-auth-modal-logo">
              <BrainIcon size={22} />
            </div>
            <div>
              <h2 className="brain-auth-modal-title" id="auth-modal-title">
                {isForgotView
                  ? 'Reset Password'
                  : mode === 'login'
                  ? 'Sign In to Brain AI'
                  : 'Create Your Account'}
              </h2>
              <p className="brain-auth-modal-subtitle">
                {isForgotView
                  ? 'Enter your email to receive recovery instructions'
                  : mode === 'login'
                  ? 'Access your saved chats, documents, and settings'
                  : 'Get started with next-gen cognitive AI'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="brain-auth-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            id="btn-close-auth-modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Segmented Mode Switcher Tabs (Login vs Register) */}
        {!isForgotView && (
          <div className="brain-auth-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`brain-auth-modal-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              id="tab-auth-modal-login"
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`brain-auth-modal-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
              id="tab-auth-modal-register"
            >
              Register
            </button>
          </div>
        )}

        {/* Modal Body / Form */}
        <div className="brain-auth-modal-body">
          {/* General Error Banner */}
          {generalError && (
            <div className="brain-auth-alert-banner" role="alert">
              <AlertCircleIcon size={16} />
              <span>{generalError}</span>
            </div>
          )}

          {/* General Success Banner */}
          {successMsg && (
            <div className="brain-auth-success-banner" role="status">
              <CheckIcon size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {isForgotView ? (
            /* Forgot Password Sub-view */
            forgotSent ? (
              <div className="brain-auth-success-banner" style={{ margin: '1rem 0' }}>
                <CheckIcon size={18} />
                <span>Password reset token sent to {forgotEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  id="forgot-email-input"
                  label="Account Email"
                  type="email"
                  placeholder="abhishek@brain.ai"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onClear={() => setForgotEmail('')}
                  leftIcon={<MailIcon size={18} />}
                  isClearable
                  required
                  fullWidth
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsForgotView(false)}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!forgotEmail}
                  >
                    Send Recovery Link
                  </Button>
                </div>
              </form>
            )
          ) : (
            /* Main Form (Login / Register) */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }} noValidate>
              {/* 1. Full Name Field (Register ONLY) */}
              {mode === 'register' && (
                <Input
                  id="modal-register-name"
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Abhishek Srivastva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  onClear={() => {
                    setName('')
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  leftIcon={<UserIcon size={18} />}
                  isClearable
                  required
                  fullWidth
                  error={errors.name}
                  disabled={isLoading}
                  autoComplete="name"
                />
              )}

              {/* 2. Email Field (Both) */}
              <Input
                id="modal-auth-email"
                label={mode === 'register' ? 'Email Address' : 'Email Address'}
                type="email"
                placeholder={mode === 'register' ? 'name@company.com' : 'abhishek@brain.ai'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                onClear={() => {
                  setEmail('')
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                leftIcon={<MailIcon size={18} />}
                isClearable
                required
                fullWidth
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
              />

              {/* 3. Password Field (Both) */}
              <div>
                <Input
                  id="modal-auth-password"
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  onClear={() => {
                    setPassword('')
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  leftIcon={<LockIcon size={18} />}
                  isClearable
                  required
                  fullWidth
                  error={errors.password}
                  disabled={isLoading}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />

                {/* Password strength meter for registration */}
                {mode === 'register' && password.length > 0 && (
                  <div className="brain-modal-pwd-meter" style={{ marginTop: '6px' }}>
                    <div className="brain-modal-pwd-header">
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span className={`brain-meter-score brain-meter-score--${passwordStrength.label}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="brain-modal-pwd-bars">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`brain-modal-pwd-bar ${
                            passwordStrength.score >= step ? `active-${passwordStrength.label}` : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Confirm Password Field (Register ONLY) */}
              {mode === 'register' && (
                <div>
                  <Input
                    id="modal-register-password-confirm"
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter password"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value)
                      if (errors.passwordConfirm) {
                        setErrors((prev) => ({ ...prev, passwordConfirm: undefined }))
                      }
                    }}
                    onClear={() => {
                      setPasswordConfirm('')
                      if (errors.passwordConfirm) {
                        setErrors((prev) => ({ ...prev, passwordConfirm: undefined }))
                      }
                    }}
                    leftIcon={<LockIcon size={18} />}
                    isClearable
                    required
                    fullWidth
                    error={errors.passwordConfirm}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />

                  {passwordConfirm.length > 0 && (
                    <div
                      className={`brain-modal-pwd-match ${
                        passwordsMatch ? 'brain-modal-pwd-match--ok' : 'brain-modal-pwd-match--no'
                      }`}
                      style={{ marginTop: '4px' }}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckIcon size={13} />
                          <span>Passwords match</span>
                        </>
                      ) : passwordsMismatch ? (
                        <>
                          <AlertCircleIcon size={13} />
                          <span>Passwords do not match yet</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Login Extra Options (Remember Me & Forgot Password) */}
              {mode === 'login' && (
                <div className="brain-login-options-row" style={{ marginTop: '-2px' }}>
                  <label className="brain-remember-me" htmlFor="modal-login-remember">
                    <input
                      type="checkbox"
                      id="modal-login-remember"
                      className="brain-checkbox-input"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span style={{ fontSize: '0.8rem' }}>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="brain-forgot-btn"
                    onClick={() => {
                      setForgotEmail(email)
                      setIsForgotView(true)
                    }}
                    id="modal-btn-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant={mode === 'register' ? 'gradient' : 'primary'}
                size="md"
                fullWidth
                isLoading={isLoading}
                loadingText={mode === 'register' ? 'Creating account...' : 'Signing in...'}
                id={mode === 'register' ? 'btn-modal-submit-register' : 'btn-modal-submit-login'}
                leftIcon={mode === 'register' ? <SparklesIcon size={16} /> : undefined}
                rightIcon={mode === 'login' ? <ArrowRightIcon size={16} /> : undefined}
                style={{ marginTop: '4px' }}
              >
                {mode === 'register' ? 'Create Brain AI Account' : 'Sign In'}
              </Button>

              {/* Footer Switch Prompt */}
              <div className="brain-auth-modal-footer-switch">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="brain-auth-modal-switch-btn"
                      onClick={() => switchMode('register')}
                      id="modal-btn-switch-to-register"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="brain-auth-modal-switch-btn"
                      onClick={() => switchMode('login')}
                      id="modal-btn-switch-to-login"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
