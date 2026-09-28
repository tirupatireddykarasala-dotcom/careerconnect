import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/jobs/mine/').then(({ data }) => setJobs(data.results)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleActive = async (job) => {
    await api.patch(`/jobs/${job.id}/`, { is_active: !job.is_active });
    load();
  };

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    await api.delete(`/jobs/${job.id}/`);
    load();
  };

  return (
    <div className="container page">
      <div className="spread" style={{ marginBottom: 16 }}>
        <h1>My postings</h1>
        <Link to="/recruiter/jobs/new" className="btn btn-accent">Post a job</Link>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="card">
          <table>
            <thead><tr><th>Title</th><th>Location</th><th>Status</th><th>Applicants</th><th></th></tr></thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.location}</td>
                  <td>{job.is_active ? 'Open' : 'Closed'}</td>
                  <td><Link to={`/recruiter/jobs/${job.id}/applicants`}>View</Link></td>
                  <td className="row">
                    <Link to={`/recruiter/jobs/${job.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(job)}>
                      {job.is_active ? 'Close' : 'Reopen'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(job)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <div className="empty-state">You haven't posted any jobs yet.</div>}
        </div>
      )}
    </div>
  );
}
