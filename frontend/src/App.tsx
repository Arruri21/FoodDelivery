import React, { useState } from 'react'
import './App.css'
import RestaurantList from './components/RestaurantList'
import Menu from './components/Menu'

function App() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)

  return (
    <div className="App root-grid">
      <header className="app-header">
        <div className="brand">
          <div className="logo-badge">FD</div>
          <div>
            <h1>Food Delivery App</h1>
            <p className="tag">Fast • Fresh • Friendly</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <RestaurantList onSelect={setSelectedRestaurant} />
        </aside>

        <section className="content">
          <Menu restaurantId={selectedRestaurant} />
        </section>
      </main>

      <footer className="app-footer">Made with ❤️ — Demo App</footer>
    </div>
  )
}

export default App
