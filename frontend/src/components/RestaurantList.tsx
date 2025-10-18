import React, { useEffect, useState } from 'react';
import api from '../api';

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  rating?: number | null;
};

interface RestaurantListProps {
  onSelect: (id: number) => void;
}

export default function RestaurantList({ onSelect }: RestaurantListProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<Restaurant[]>('/restaurants')
      .then((res) => {
        setRestaurants(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message ?? 'Failed to load restaurants');
        setRestaurants([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="restaurant-list card">
      <h2 className="section-title">Restaurants</h2>
      {loading && <div className="muted">Loading restaurants...</div>}
      {error && <div className="muted">Error: {error}</div>}
      <div className="list-grid" aria-live="polite">
        {restaurants.map((restaurant) => {
          const ratingLabel =
            restaurant.rating !== undefined && restaurant.rating !== null
              ? restaurant.rating.toFixed(1)
              : '—';

          return (
            <div
              key={restaurant.id}
              className="restaurant-card"
              role="button"
              tabIndex={0}
              onClick={() => onSelect(restaurant.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSelect(restaurant.id);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" aria-hidden>
                  {restaurant.name ? restaurant.name.charAt(0) : 'R'}
                </div>
                <div className="restaurant-info">
                  <h3 className="restaurant-name">{restaurant.name}</h3>
                  <div className="restaurant-meta">{restaurant.cuisine} • {ratingLabel}</div>
                </div>
              </div>
              <div className="restaurant-actions">
                <button
                  className="btn btn-primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(restaurant.id);
                  }}
                >
                  View Menu
                </button>
              </div>
            </div>
          );
        })}
        {!loading && !error && restaurants.length === 0 && (
          <div className="muted">No restaurants found.</div>
        )}
      </div>
    </div>
  );
}
