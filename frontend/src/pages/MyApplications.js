import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

/**
 * WHY THE STATUS FILTER IS CLIENT-SIDE HERE (not another API call):
 * A single job seeker's application list is small enough (dozens, not
 * thousands) that re-filtering an already-fetched array is instant and
 * avoids a round trip every time they change the dropdown.
 */
export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/mine/').then(({ data }) => setApplications(data.results)).finally(() => setLoading(false));
  }, []);

  const visible = statusFilter ? applications.filter((a) => a.status === statusFilter) : applications;

  return (
    <div className="container page">
      <div className="spread" style={{ marginBottom: 16 }}>
        <h1>My applications</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="applied">Applied</option>
          <option value="under_review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Job</th><th>Company</th><th>Applied on</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visible.map((app) => (
                <tr key={app.id}>
                  <td><Link to={`/jobs/${app.job}`}>{app.job_detail.title}</Link></td>
                  <td>{app.job_detail.company_detail?.name}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="empty-state">No applications to show.</div>}
        </div>
      )}
    </div>
  );
}
