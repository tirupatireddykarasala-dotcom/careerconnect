import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/auth/admin/dashboard/').then(({ data }) => setStats(data)); }, []);

  if (!stats) return <div className="container page">Loading...</div>;

  const cards = [
    { label: 'Job Seekers', value: stats.total_job_seekers },
    { label: 'Recruiters', value: stats.total_recruiters },
    { label: 'Companies', value: stats.total_companies },
    { label: 'Total Jobs', value: stats.total_jobs },
    { label: 'Active Jobs', value: stats.active_jobs },
    { label: 'Total Applications', value: stats.total_applications },
  ];

  return (
    <div className="container page">
      <h1>Admin dashboard</h1>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {cards.map((c) => (
          <div key={c.label} className="card stat-card">
            <div className="stat-number">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h2>Applications by status</h2>
      <div className="card">
        <table>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            {Object.entries(stats.applications_by_status).map(([status, n]) => (
              <tr key={status}><td style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</td><td>{n}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
