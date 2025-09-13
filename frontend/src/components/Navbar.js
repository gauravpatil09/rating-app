import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">RatingApp</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link className="nav-link" to="/stores">Stores</Link></li>
            {user && user.role === 'admin' && <li className="nav-item"><Link className="nav-link" to="/admin">Admin</Link></li>}
            {user && user.role === 'owner' && <li className="nav-item"><Link className="nav-link" to="/owner">Owner</Link></li>}
          </ul>
          <ul className="navbar-nav ms-auto">
            {!user && <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>}
            {!user && <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>}
            {user && (
              <>
                <li className="nav-item nav-link">{user.name}</li>
                <li className="nav-item"><button className="btn btn-sm btn-outline-secondary" onClick={logout}>Logout</button></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
