import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');

  const load = (params = {}) => api.get('/auth/admin/users/', { params }).then(({ data }) => setUsers(data.results));
  useEffect(() => { load(); }, []);

  const handleFilter = (role) => {
    setRoleFilter(role);
    load(role ? { role } : {});
  };

  const toggleActive = async (u) => {
    await api.patch(`/auth/admin/users/${u.id}/toggle-active/`);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active_account: !x.is_active_account } : x)));
  };

  return (
    <div className="container page">
      <div className="spread" style={{ marginBottom: 16 }}>
        <h1>Manage users</h1>
        <select value={roleFilter} onChange={(e) => handleFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All roles</option>
          <option value="job_seeker">Job Seekers</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</td>
                <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                <td>{u.is_active_account ? 'Active' : 'Suspended'}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                    {u.is_active_account ? 'Suspend' : 'Reinstate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="empty-state">No users found.</div>}
      </div>
    </div>
  );
}
