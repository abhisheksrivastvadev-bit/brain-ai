import React, { useState } from 'react'
import { AuthLayout } from './AuthLayout'
import { Input, Button } from '../../components/ui'
import {
  MailIcon,
  LockIcon,
  CheckIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  KeyIcon,
  CloseIcon,
} from '../../components/icons'
import { authService } from '../../services'
import type { AppScreen, User } from '../../types'
import './LoginPage.css'

interface LoginPageProps {
  onNavigate: (screen: AppScreen) => void
  onAuthSuccess: (user: User) => void
  isDark: boolean
  onToggleTheme: () => void
}

interface FormErrors {
  email?: string
  password?: string
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onAuthSuccess,
  isDark,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
        rememberMe,
      })

      if (response.success && response.user) {
        setSuccessMsg(response.message || 'Signed in successfully! Loading workspace...')
        setTimeout(() => {
          onAuthSuccess(response.user!)
        }, 700)
      } else {
        setGeneralError(response.error || 'Invalid credentials. Please verify your details.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign in.'
      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      return
    }
    setForgotSent(true)
    setTimeout(() => {
      setForgotSent(false)
      setForgotModalOpen(false)
      setForgotEmail('')
    }, 2500)
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Brain AI workspace and resume where you left off"
      currentScreen="login"
      onNavigate={onNavigate}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <form onSubmit={handleSubmit} className="brain-login-form" noValidate id="form-login">
        {/* Banner Alert for Error */}
        {generalError && (
          <div className="brain-auth-alert-banner" role="alert" id="login-alert-error">
            <AlertCircleIcon size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Banner Alert for Success */}
        {successMsg && (
          <div className="brain-auth-success-banner" role="status" id="login-alert-success">
            <CheckIcon size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Email Field */}
        <Input
          id="login-input-email"
          label="Email Address"
          type="email"
          placeholder="abhishek@brain.ai"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          leftIcon={<MailIcon size={18} />}
          isClearable
          required
          fullWidth
          error={errors.email}
          autoComplete="email"
          disabled={isLoading}
        />

        {/* 2. Password Field */}
        <Input
          id="login-input-password"
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
          }}
          leftIcon={<LockIcon size={18} />}
          required
          fullWidth
          error={errors.password}
          autoComplete="current-password"
          disabled={isLoading}
        />

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="brain-login-options-row">
          <label className="brain-remember-me" htmlFor="login-remember-checkbox">
            <input
              type="checkbox"
              id="login-remember-checkbox"
              className="brain-checkbox-input"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>Remember me for 30 days</span>
          </label>

          <button
            type="button"
            className="brain-forgot-btn"
            id="btn-forgot-password"
            onClick={() => {
              setForgotEmail(email)
              setForgotModalOpen(true)
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Authenticating..."
          id="btn-submit-login"
          rightIcon={<ArrowRightIcon size={18} />}
        >
          Sign In to Brain AI
        </Button>

        {/* Switch to Register Link */}
        <div className="brain-auth-switch-prompt">
          Don't have an account?{' '}
          <button
            type="button"
            className="brain-auth-switch-btn"
            id="btn-switch-to-register"
            onClick={() => onNavigate('register')}
          >
            Create an account
          </button>
        </div>
      </form>

      {/* Forgot Password Interactive Modal */}
      {forgotModalOpen && (
        <div className="brain-forgot-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div
            className="brain-forgot-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="forgot-modal-title"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: 'var(--color-primary-400)' }}>
                  <KeyIcon size={20} />
                </div>
                <h3 id="forgot-modal-title" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                className="brain-input-action-btn"
                onClick={() => setForgotModalOpen(false)}
                aria-label="Close modal"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {forgotSent ? (
              <div className="brain-auth-success-banner" style={{ margin: '0.5rem 0' }}>
                <CheckIcon size={18} />
                <span>Password reset link sent to {forgotEmail}! Check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Enter your verified account email address and we'll send you an encrypted token to reset your password.
                </p>

                <Input
                  label="Account Email"
                  type="email"
                  placeholder="abhishek@brain.ai"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  leftIcon={<MailIcon size={18} />}
                  required
                  fullWidth
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForgotModalOpen(false)}
                  >
                    Cancel
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
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

export default LoginPage
