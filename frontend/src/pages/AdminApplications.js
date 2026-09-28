import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => { api.get('/applications/admin/all/').then(({ data }) => setApplications(data.results)); }, []);

  return (
    <div className="container page">
      <h1>Manage applications</h1>
      <div className="card">
        <table>
          <thead><tr><th>Applicant</th><th>Job</th><th>Applied on</th><th>Status</th></tr></thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.applicant_username}</td>
                <td>#{a.job}</td>
                <td>{new Date(a.applied_at).toLocaleDateString()}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && <div className="empty-state">No applications on the platform yet.</div>}
      </div>
    </div>
  );
}
