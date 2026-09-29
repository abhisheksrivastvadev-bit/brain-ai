import React, { useState, useMemo } from 'react'
import { AuthLayout } from './AuthLayout'
import { Input, Button } from '../../components/ui'
import {
  UserIcon,
  MailIcon,
  LockIcon,
  CheckIcon,
  AlertCircleIcon,
  SparklesIcon,
} from '../../components/icons'
import { authService } from '../../services'
import type { AppScreen, User } from '../../types'
import './RegisterPage.css'

interface RegisterPageProps {
  onNavigate: (screen: AppScreen) => void
  onAuthSuccess: (user: User) => void
  isDark: boolean
  onToggleTheme: () => void
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  passwordConfirm?: string
  terms?: string
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onAuthSuccess,
  isDark,
  onToggleTheme,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Real-time password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'empty', criteria: { length: false, upper: false, number: false, symbol: false } }
    const length = password.length >= 8
    const upper = /[A-Z]/.test(password)
    const number = /[0-9]/.test(password)
    const symbol = /[^A-Za-z0-9]/.test(password)

    let score = 0
    if (password.length >= 6) score += 1
    if (length) score += 1
    if (upper && number) score += 1
    if (symbol) score += 1

    const labels = ['weak', 'weak', 'fair', 'good', 'strong'] as const
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      criteria: { length, upper, number, symbol },
    }
  }, [password])

  // Password match verification
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Full name is required.'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.'
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      newErrors.password = 'Password is required.'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password.'
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match.'
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must accept the terms of service.'
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
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
        agreeTerms,
      })

      if (response.success && response.user) {
        setSuccessMsg('Account created successfully! Initializing workspace...')
        setTimeout(() => {
          onAuthSuccess(response.user!)
        }, 800)
      } else {
        setGeneralError(response.error || 'Failed to create account. Please try again.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setGeneralError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Brain AI and harness next-gen cognitive intelligence"
      currentScreen="register"
      onNavigate={onNavigate}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <form onSubmit={handleSubmit} className="brain-register-form" noValidate id="form-register">
        {/* Banner Alert for General Error */}
        {generalError && (
          <div className="brain-auth-alert-banner" role="alert" id="register-alert-error">
            <AlertCircleIcon size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Banner Alert for Success */}
        {successMsg && (
          <div className="brain-auth-success-banner" role="status" id="register-alert-success">
            <CheckIcon size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Name Field */}
        <Input
          id="register-input-name"
          label="Full Name"
          type="text"
          placeholder="e.g. Abhishek Srivastva"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
          }}
          leftIcon={<UserIcon size={18} />}
          isClearable
          required
          fullWidth
          error={errors.name}
          autoComplete="name"
          disabled={isLoading}
        />

        {/* 2. Email Field */}
        <Input
          id="register-input-email"
          label="Work or Personal Email"
          type="email"
          placeholder="name@company.com"
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

        {/* 3. Password Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Input
            id="register-input-password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            leftIcon={<LockIcon size={18} />}
            required
            fullWidth
            error={errors.password}
            autoComplete="new-password"
            disabled={isLoading}
          />

          {/* Interactive Live Password Strength Meter */}
          {password.length > 0 && (
            <div className="brain-password-meter" id="password-strength-meter">
              <div className="brain-meter-header">
                <span className="brain-meter-label">Password strength:</span>
                <span className={`brain-meter-score brain-meter-score--${passwordStrength.label}`}>
                  {passwordStrength.label}
                </span>
              </div>

              <div className="brain-meter-bars">
                {[1, 2, 3, 4].map((step) => {
                  const isActive = passwordStrength.score >= step
                  return (
                    <div
                      key={step}
                      className={`brain-meter-segment ${
                        isActive ? `active-${passwordStrength.label}` : ''
                      }`}
                    />
                  )
                })}
              </div>

              <div className="brain-password-criteria">
                <span
                  className={`brain-criterion-pill ${
                    passwordStrength.criteria.length ? 'brain-criterion-pill--met' : ''
                  }`}
                >
                  <CheckIcon size={12} /> 8+ chars
                </span>
                <span
                  className={`brain-criterion-pill ${
                    passwordStrength.criteria.upper ? 'brain-criterion-pill--met' : ''
                  }`}
                >
                  <CheckIcon size={12} /> Uppercase
                </span>
                <span
                  className={`brain-criterion-pill ${
                    passwordStrength.criteria.number ? 'brain-criterion-pill--met' : ''
                  }`}
                >
                  <CheckIcon size={12} /> Number
                </span>
                <span
                  className={`brain-criterion-pill ${
                    passwordStrength.criteria.symbol ? 'brain-criterion-pill--met' : ''
                  }`}
                >
                  <CheckIcon size={12} /> Symbol
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Password Confirm Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Input
            id="register-input-password-confirm"
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value)
              if (errors.passwordConfirm) setErrors((prev) => ({ ...prev, passwordConfirm: undefined }))
            }}
            leftIcon={<LockIcon size={18} />}
            required
            fullWidth
            error={errors.passwordConfirm}
            autoComplete="new-password"
            disabled={isLoading}
          />

          {/* Real-time Match Indicator */}
          {passwordConfirm.length > 0 && (
            <div
              className={`brain-password-match-status ${
                passwordsMatch
                  ? 'brain-password-match-status--match'
                  : 'brain-password-match-status--mismatch'
              }`}
              id="password-match-indicator"
            >
              {passwordsMatch ? (
                <>
                  <CheckIcon size={14} />
                  <span>Passwords match perfectly</span>
                </>
              ) : passwordsMismatch ? (
                <>
                  <AlertCircleIcon size={14} />
                  <span>Passwords do not match yet</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Terms of Service Checkbox */}
        <div>
          <label className="brain-terms-row" htmlFor="register-terms-checkbox">
            <input
              type="checkbox"
              id="register-terms-checkbox"
              className="brain-checkbox-input"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked)
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }))
              }}
              disabled={isLoading}
            />
            <span>
              I agree to the{' '}
              <a href="#terms" className="brain-terms-link" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>{' '}
              and acknowledge the{' '}
              <a href="#privacy" className="brain-terms-link" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.terms && (
            <span className="brain-input-error-msg" style={{ marginTop: '4px', fontSize: '0.78rem' }}>
              <AlertCircleIcon size={14} />
              {errors.terms}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
          id="btn-submit-register"
          leftIcon={<SparklesIcon size={18} />}
        >
          Create Brain AI Account
        </Button>

        {/* Switch to Login Link */}
        <div className="brain-auth-switch-prompt">
          Already have an account?{' '}
          <button
            type="button"
            className="brain-auth-switch-btn"
            id="btn-switch-to-login"
            onClick={() => onNavigate('login')}
          >
            Sign In
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
