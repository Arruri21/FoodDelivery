import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import api from '../api'
import type { UserSession } from '../types'

interface AuthPanelProps {
  user: UserSession | null
  onAuthenticated: (session: UserSession) => void
  onLogout: () => void
}

type Mode = 'login' | 'signup'

type SignupRole = 'CUSTOMER' | 'AGENT'

const defaultSignupForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  role: 'CUSTOMER' as SignupRole,
}

const signupRoleOptions: Array<{ key: SignupRole; title: string; description: string }> = [
  {
    key: 'CUSTOMER',
    title: 'Customer',
    description: 'Order meals and track deliveries',
  },
  {
    key: 'AGENT',
    title: 'Delivery agent',
    description: 'Receive assignments and update status',
  },
]

const defaultLoginForm = {
  email: '',
  password: '',
}

export default function AuthPanel({ user, onAuthenticated, onLogout }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [loginForm, setLoginForm] = useState(defaultLoginForm)
  const [signupForm, setSignupForm] = useState(defaultSignupForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeFormLegend = useMemo(() => (mode === 'login' ? 'Welcome back' : 'Create account'), [mode])

  const changeMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { email, password } = loginForm
      const response = await api.post('/auth/login', { email, password })
      const { userId, roles } = response.data as { userId: number; roles: string[] | undefined }
      onAuthenticated({ userId, email, roles: Array.isArray(roles) ? roles : [] })
      setSuccess('Signed in successfully!')
    } catch (err: any) {
      const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to sign in'
      setError(apiMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.post('/auth/signup', signupForm)
      const msg = response.data?.message ?? 'Account created! Please sign in.'
      setSuccess(msg)
      setSignupForm(defaultSignupForm)
      setMode('login')
      setLoginForm({ email: signupForm.email, password: '' })
    } catch (err: any) {
      const apiMessage = err?.response?.data?.error ?? err?.message ?? 'Unable to sign up'
      setError(apiMessage)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="card auth-card">
        <div className="auth-head">
          <div>
            <p className="pill">Signed in</p>
            <h2 className="section-title">Welcome!</h2>
            <p className="muted">{user.email}</p>
          </div>
          <button className="btn btn-ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
        <div className="auth-roles" aria-live="polite">
          {user.roles.length > 0 ? user.roles.map((role) => <span key={role} className="role-chip">{role.replace('ROLE_', '')}</span>) : <span className="muted">No roles assigned</span>}
        </div>
        <p className="muted small-print">You can now explore menus, add dishes to your cart, and place orders.</p>
      </div>
    )
  }

  return (
    <div className="card auth-card">
      <div className="auth-toggle" role="tablist">
        <button
          className={mode === 'login' ? 'toggle active' : 'toggle'}
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => changeMode('login')}
        >
          Login
        </button>
        <button
          className={mode === 'signup' ? 'toggle active' : 'toggle'}
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => changeMode('signup')}
        >
          Sign up
        </button>
      </div>

      <h2 className="section-title" style={{ marginBottom: '8px' }}>{activeFormLegend}</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: '16px' }}>
        {mode === 'login' ? 'Sign in to place and review your orders.' : 'Create an account to start ordering your favourites.'}
      </p>

      {error && <div className="banner error" role="alert">{error}</div>}
      {success && <div className="banner success" role="status">{success}</div>}

      {mode === 'login' ? (
        <form className="form-grid" onSubmit={handleLogin}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              placeholder="Enter password"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      ) : (
        <form className="form-grid" onSubmit={handleSignup}>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              required
              value={signupForm.name}
              onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
              placeholder="Jane Doe"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={signupForm.email}
              onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              value={signupForm.password}
              onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              placeholder="Choose a password"
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              value={signupForm.phone}
              onChange={(event) => setSignupForm({ ...signupForm, phone: event.target.value })}
              placeholder="Optional"
            />
          </label>
          <label className="field">
            <span>Address</span>
            <textarea
              rows={3}
              value={signupForm.address}
              onChange={(event) => setSignupForm({ ...signupForm, address: event.target.value })}
              placeholder="Delivery address"
            />
          </label>
          <fieldset className="field role-field">
            <legend>Account type</legend>
            <div className="role-toggle">
              {signupRoleOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={signupForm.role === option.key ? 'role-option active' : 'role-option'}
                  onClick={() => setSignupForm({ ...signupForm, role: option.key })}
                  aria-pressed={signupForm.role === option.key}
                >
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
