import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPanel from '../components/AuthPanel'
import { useAppContext } from '../context/AppContext'

export default function AuthPage() {
  const { user, authenticate, logout, isAdmin, isDriver } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const nextPath = isAdmin ? '/admin' : isDriver ? '/driver' : '/restaurants'
      navigate(nextPath, { replace: true })
    }
  }, [user, isAdmin, isDriver, navigate])

  return (
    <div className="page-center">
      <div className="auth-layout">
        <div className="auth-panel-column">
          <AuthPanel
            user={user}
            onAuthenticated={(session) => {
              authenticate(session)
              const nextPath = session.roles?.includes('ROLE_ADMIN')
                ? '/admin'
                : session.roles?.includes('ROLE_DRIVER')
                  ? '/driver'
                  : '/restaurants'
              navigate(nextPath, { replace: true })
            }}
            onLogout={() => {
              logout()
            }}
          />
        </div>
        {/* <aside className="auth-hero-card">
          <div className="auth-hero-media">
            <img src={heroArt} alt="Illustration of the Foodito experience" />
          </div>
          <div className="auth-hero-copy">
            <span className="pill hero-pill">Foodito</span>
            <h2>Delivering joy in minutes</h2>
            <p>Discover local favourites, delight customers, or hit the road as a Foodito courier.</p>
          </div>
        </aside> */}
      </div>
    </div>
  )
}
