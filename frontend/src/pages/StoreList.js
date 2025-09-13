import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StoreCard from '../components/StoreCard';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [qName, setQName] = useState('');
  const [qAddr, setQAddr] = useState('');

  async function fetchStores() {
    try {
      const res = await api.get('/stores', { params: { name: qName, address: qAddr } });
      setStores(res.data);
    } catch (err) {
      alert('Load error');
    }
  }

  useEffect(() => { fetchStores(); }, []);

  return (
    <div>
      <h3>Stores</h3>
      <div className="row mb-3">
        <div className="col-md-4"><input className="form-control" placeholder="Search name" value={qName} onChange={e=>setQName(e.target.value)} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Search address" value={qAddr} onChange={e=>setQAddr(e.target.value)} /></div>
        <div className="col-md-4"><button className="btn btn-secondary" onClick={fetchStores}>Search</button></div>
      </div>

      {stores.map(s => <StoreCard key={s.id} store={s} refresh={fetchStores} />)}
    </div>
  );
}
