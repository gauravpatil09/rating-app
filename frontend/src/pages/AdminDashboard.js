
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [counts, setCounts] = useState(null);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);

  // create forms state
  const [newUser, setNewUser] = useState({ name:'', email:'', address:'', password:'', role:'user' });
  const [newStore, setNewStore] = useState({ name:'', email:'', address:'', ownerId:'' });

  useEffect(() => {
    loadCounts();
    loadStores();
    loadUsers();
  }, []);

  async function loadCounts() {
    try {
      const res = await api.get('/admin/dashboard');
      setCounts(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStores() {
    try {
      const res = await api.get('/admin/stores');
      setStores(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadUsers() {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setNewUser({ name:'', email:'', address:'', password:'', role:'user' });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete('/admin/users/' + id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  async function createStore(e) {
    e.preventDefault();
    try {
      const payload = { ...newStore };
      if (!payload.ownerId) delete payload.ownerId;
      await api.post('/admin/stores', payload);
      setNewStore({ name:'', email:'', address:'', ownerId:'' });
      loadStores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  async function deleteStore(id) {
    if (!window.confirm('Delete this store?')) return;
    try {
      await api.delete('/admin/stores/' + id);
      loadStores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  // reset password flow: request token then set new password
  async function resetUserPasswordByEmail(email) {
    try {
      const res = await api.post('/auth/reset-request', { email });
      const token = res.data.token;
      const pwd = window.prompt('Enter new password for ' + email);
      if (!pwd) return alert('Cancelled');
      await api.post('/auth/reset', { token, password: pwd });
      alert('Password updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  async function resetStoreOwnerPassword(storeId) {
    try {
      const res = await api.post('/auth/reset-request', { storeId });
      const token = res.data.token;
      const pwd = window.prompt('Enter new password for store owner (store id ' + storeId + ')');
      if (!pwd) return alert('Cancelled');
      await api.post('/auth/reset', { token, password: pwd });
      alert('Password updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="container mt-3">
      <h3>Admin Dashboard</h3>
      {counts && <div>
        <p>Users: {counts.users} | Stores: {counts.stores} | Ratings: {counts.ratings}</p>
      </div>}

      <div className="row">
        <div className="col-md-6">
          <h5>Create User</h5>
          <form onSubmit={createUser}>
            <input className="form-control mb-2" placeholder="Name" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} />
            <input className="form-control mb-2" placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} />
            <input className="form-control mb-2" placeholder="Address" value={newUser.address} onChange={e=>setNewUser({...newUser,address:e.target.value})} />
            <input className="form-control mb-2" placeholder="Password" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} />
            <select className="form-control mb-2" value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>
              <option value="user">user</option>
              <option value="owner">owner</option>
              <option value="admin">admin</option>
            </select>
            <button className="btn btn-success">Create User</button>
          </form>
        </div>

        <div className="col-md-6">
          <h5>Create Store</h5>
          <form onSubmit={createStore}>
            <input className="form-control mb-2" placeholder="Store name" value={newStore.name} onChange={e=>setNewStore({...newStore,name:e.target.value})} />
            <input className="form-control mb-2" placeholder="Email" value={newStore.email} onChange={e=>setNewStore({...newStore,email:e.target.value})} />
            <input className="form-control mb-2" placeholder="Address" value={newStore.address} onChange={e=>setNewStore({...newStore,address:e.target.value})} />
            <input className="form-control mb-2" placeholder="Owner ID (optional)" value={newStore.ownerId} onChange={e=>setNewStore({...newStore,ownerId:e.target.value})} />
            <button className="btn btn-success">Create Store</button>
          </form>
        </div>
      </div>

      <h5 className="mt-4">Stores</h5>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Address</th><th>Rating</th><th>Actions</th></tr></thead>
        <tbody>
          {stores.map(s=> <tr key={s.id}>
            <td>{s.name}</td><td>{s.email}</td><td>{s.address}</td><td>{s.rating}</td>
            <td>
              <button className="btn btn-sm btn-danger me-2" onClick={()=>deleteStore(s.id)}>Delete</button>
              <button className="btn btn-sm btn-secondary" onClick={()=>resetStoreOwnerPassword(s.id)}>Reset Owner Password</button>
            </td>
          </tr>)}
        </tbody>
      </table>

      <h5>Users</h5>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Rating</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u=> <tr key={u.id}>
            <td>{u.name}</td><td>{u.email}</td><td>{u.address}</td><td>{u.role}</td><td>{u.rating}</td>
            <td>
              <button className="btn btn-sm btn-danger me-2" onClick={()=>deleteUser(u.id)}>Delete</button>
              <button className="btn btn-sm btn-secondary" onClick={()=>resetUserPasswordByEmail(u.email)}>Reset Password</button>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
