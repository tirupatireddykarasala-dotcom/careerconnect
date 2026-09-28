import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { job_seeker: 'Job Seeker', recruiter: 'Recruiter', admin: 'Admin' };

const ROLE_HOME = { job_seeker: '/jobs', recruiter: '/recruiter/jobs', admin: '/admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={user ? ROLE_HOME[user.role] : '/'} className="navbar-brand">CareerConnect</Link>
        <div className="navbar-links">
          {!user && (
            <>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}

          {user && user.role === 'job_seeker' && (
            <>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/saved-jobs">Saved</Link>
              <Link to="/applications">My Applications</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}

          {user && user.role === 'recruiter' && (
            <>
              <Link to="/recruiter/jobs">My Postings</Link>
              <Link to="/recruiter/jobs/new">Post a Job</Link>
              <Link to="/recruiter/company">Company</Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/jobs">Jobs</Link>
              <Link to="/admin/companies">Companies</Link>
              <Link to="/admin/applications">Applications</Link>
            </>
          )}

          {user && (
            <>
              <span className="navbar-role-tag">{ROLE_LABEL[user.role]}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
