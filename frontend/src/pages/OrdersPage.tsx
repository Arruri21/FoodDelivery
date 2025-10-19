import { Navigate, useNavigate } from 'react-router-dom'
import OrderHistory from '../components/OrderHistory'
import { useAppContext } from '../context/AppContext'

export default function OrdersPage() {
  const { user, historyRefreshKey } = useAppContext()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="flow">
      <div className="card">
        <div className="menu-summary-head">
          <div>
            <h2 className="section-title">Order status</h2>
            <p className="muted">Track every order, cancel pending ones, and monitor each status update in real time.</p>
          </div>
          <div className="menu-summary-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/restaurants')}>
              Browse restaurants
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/menu')}>
              View menu
            </button>
          </div>
        </div>
      </div>
      <OrderHistory userId={user.userId} refreshKey={historyRefreshKey} />
    </div>
  )
}
