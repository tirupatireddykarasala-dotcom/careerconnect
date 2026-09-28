import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import SavedJobs from './pages/SavedJobs';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';

import RecruiterCompany from './pages/RecruiterCompany';
import RecruiterJobs from './pages/RecruiterJobs';
import JobForm from './pages/JobForm';
import Applicants from './pages/Applicants';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminJobs from './pages/AdminJobs';
import AdminCompanies from './pages/AdminCompanies';
import AdminApplications from './pages/AdminApplications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          {/* Job seeker */}
          <Route path="/saved-jobs" element={<ProtectedRoute allowedRoles={['job_seeker']}><SavedJobs /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute allowedRoles={['job_seeker']}><MyApplications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['job_seeker']}><Profile /></ProtectedRoute>} />

          {/* Recruiter */}
          <Route path="/recruiter/company" element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterCompany /></ProtectedRoute>} />
          <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterJobs /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/new" element={<ProtectedRoute allowedRoles={['recruiter']}><JobForm /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute allowedRoles={['recruiter']}><JobForm /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:jobId/applicants" element={<ProtectedRoute allowedRoles={['recruiter']}><Applicants /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={['admin']}><AdminJobs /></ProtectedRoute>} />
          <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompanies /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><AdminApplications /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
