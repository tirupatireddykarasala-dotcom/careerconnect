import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessagesLink from './MessagesLink';
import NotificationsLink from './NotificationsLink';

const ROLE_LABEL = { job_seeker: 'Job Seeker', recruiter: 'Recruiter', admin: 'Admin' };

const ROLE_HOME = { job_seeker: '/jobs', recruiter: '/recruiter/jobs', admin: '/admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);   // is the phone menu open?

  // Close the phone menu every time the page changes
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? ROLE_HOME[user.role] : '/'} className="navbar-brand">CareerConnect</Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>

        <div className={`navbar-links${open ? ' open' : ''}`}>
          {!user && (
            <>
              <NavLink to="/jobs">Browse Jobs</NavLink>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}

          {user && user.role === 'job_seeker' && (
            <>
              <NavLink to="/feed">Feed</NavLink>
              <NavLink to="/network">My Network</NavLink>
              <NavLink to="/search">Search</NavLink>
              <NavLink to="/jobs">Browse Jobs</NavLink>
              <MessagesLink />
              <NotificationsLink />
              <NavLink to="/saved-jobs">Saved</NavLink>
              <NavLink to="/applications">My Applications</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </>
          )}

          {user && user.role === 'recruiter' && (
            <>
              <NavLink to="/feed">Feed</NavLink>
              <NavLink to="/network">My Network</NavLink>
              <NavLink to="/search">Search</NavLink>
              <NavLink to="/recruiter/jobs" end>My Postings</NavLink>
              <NavLink to="/recruiter/jobs/new">Post a Job</NavLink>
              <MessagesLink />
              <NotificationsLink />
              <NavLink to="/recruiter/company">Company</NavLink>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/users">Users</NavLink>
              <NavLink to="/admin/jobs">Jobs</NavLink>
              <NavLink to="/admin/companies">Companies</NavLink>
              <NavLink to="/admin/applications">Applications</NavLink>
            </>
          )}

          {user && (
            <>
              <span className="navbar-role-tag">{ROLE_LABEL[user.role]}</span>
              <button type="button" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}