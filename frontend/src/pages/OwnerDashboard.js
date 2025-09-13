import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function OwnerDashboard() {
  const [storeInfo, setStoreInfo] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  async function load() {
    try {
      const res = await api.get('/stores');
      const myStore = res.data.find(s => s.ownerId === user?.id);
      if (!myStore) return setStoreInfo({ message: 'No store assigned' });

      const detail = await api.get(`/stores/${myStore.id}`);
      setStoreInfo({ store: myStore, ...detail.data });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(()=>{ load(); }, []);

  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h3>Owner Dashboard</h3>
      {storeInfo?.message && <div>{storeInfo.message}</div>}
      {storeInfo?.store && (
        <div>
          <h5>{storeInfo.store.name}</h5>
          <p>Average Rating: {storeInfo.average}</p>
          <h6>Ratings by users</h6>
          <ul>
            {storeInfo.ratings.map(r=> (
              <li key={r.id}>{r.User?.name} — {r.rating}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
