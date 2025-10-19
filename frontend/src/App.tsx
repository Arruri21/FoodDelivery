import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import { AppProvider, useAppContext } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import RestaurantsPage from './pages/RestaurantsPage'
import MenuPage from './pages/MenuPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DriverDashboardPage from './pages/DriverDashboardPage'


// function AdminDashboardPage() {
//   return (
//     <div>
//       <h2>Admin Dashboard</h2>
//       <p>Placeholder admin console</p>
//     </div>
//   )
// }

const steps = [
  { path: '/restaurants', label: 'Restaurants' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/orders', label: 'Order status' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAppContext()

  const path = location.pathname
  const canonicalPath = path.startsWith('/menu') ? '/restaurants' : path
  const resolvedIndex = steps.findIndex((step) => canonicalPath.startsWith(step.path))
  const stepIndex = resolvedIndex === -1 ? 0 : resolvedIndex

  return (
    <div className="App root-grid">
      <header className="app-header">
        <div className="brand">
          <div className="logo-badge">FD</div>
          <div>
            <h1>Foodito</h1>
            <p className="tag">Fast · Fresh · Friendly</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="stepper" role="list">
            {steps.map((step, index) => {
              const status = index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'todo'
              return (
                <button
                  key={step.path}
                  type="button"
                  className={`step ${status}`}
                  role="listitem"
                  onClick={() => navigate(step.path)}
                >
                  <span className="step-index">{index + 1}</span>
                  {step.label}
                </button>
              )
            })}
          </div>
          {user && (
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/orders')}
            >
              My orders
            </button>
          )}
          {user && (
            <div className="user-chip">
              <span>{user.email}</span>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout()
                  navigate('/auth', { replace: true })
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-stage">
        <Outlet />
      </main>

      <footer className="app-footer">Made with ❤️ — Demo App</footer>
    </div>
  )
}

function AdminLayout() {
  const { user, logout } = useAppContext()
  const navigate = useNavigate()

  return (
    <div className="App admin-shell root-grid">
      <header className="admin-header">
        <div className="brand">
          <div className="logo-badge">FD</div>
          <div>
            <h1>Foodito Admin</h1>
            <p className="tag">Operational control center</p>
          </div>
        </div>
        {user && (
          <div className="user-chip">
            <span>{user.email}</span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout()
                navigate('/auth', { replace: true })
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
      <footer className="app-footer">Made with ❤️ — Admin Console</footer>
    </div>
  )
}

function RequireCustomer() {
  const { user, isAdmin, isDriver } = useAppContext()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (isDriver) {
    return <Navigate to="/driver" replace />
  }

  return <Outlet />
}

function RequireAdmin() {
  const { user, isAdmin } = useAppContext()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to="/restaurants" replace />
  }

  return <Outlet />
}

function RequireDriver() {
  const { user, isDriver } = useAppContext()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (!isDriver) {
    return <Navigate to="/restaurants" replace />
  }

  return <Outlet />
}

function DriverLayout() {
  const { user, logout } = useAppContext()
  const navigate = useNavigate()

  return (
    <div className="App admin-shell root-grid">
      <header className="admin-header">
        <div className="brand">
          <div className="logo-badge">FD</div>
          <div>
            <h1>Foodito Driver</h1>
            <p className="tag">Deliver with confidence</p>
          </div>
        </div>
        {user && (
          <div className="user-chip">
            <span>{user.email}</span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout()
                navigate('/auth', { replace: true })
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
      <footer className="app-footer">Made with ❤️ — Driver Console</footer>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="auth" element={<AuthPage />} />

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          <Route element={<RequireDriver />}>
            <Route path="driver" element={<DriverLayout />}>
              <Route index element={<DriverDashboardPage />} />
              <Route path="*" element={<Navigate to="/driver" replace />} />
            </Route>
          </Route>

          <Route element={<RequireCustomer />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="restaurants" replace />} />
              <Route path="restaurants" element={<RestaurantsPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="*" element={<Navigate to="restaurants" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
