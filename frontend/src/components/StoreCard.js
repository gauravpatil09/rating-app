import React, { useState } from 'react';
import api from '../services/api';

export default function StoreCard({ store, refresh }) {
  const [rating, setRating] = useState(store.userRating || 0);

  async function submitRating() {
    if (!rating || rating < 1 || rating > 5) return alert('Choose 1-5');
    try {
      await api.post(`/stores/${store.id}/rating`, { rating });
      alert('Rating submitted');
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5>{store.name}</h5>
        <p>{store.address}</p>
        <p><strong>Overall:</strong> {store.overallRating ?? '0'}</p>
        <p><strong>Your rating:</strong> {store.userRating ?? 'Not rated'}</p>
        <div className="d-flex align-items-center gap-2">
          <select className="form-select w-auto" value={rating} onChange={e => setRating(Number(e.target.value))}>
            <option value={0}>Rate</option>
            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button className="btn btn-primary" onClick={submitRating}>Submit</button>
        </div>
      </div>
    </div>
  );
}
