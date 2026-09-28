/**
 * components/ProtectedRoute.js
 *
 * WHY A WRAPPER COMPONENT: several pages need "must be logged in" and some
 * also need "must be this specific role" (e.g. only a recruiter may see
 * /recruiter/jobs/new). Rather than repeating that check inside every page
 * component, each protected route in App.js is simply wrapped once here.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container page">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
