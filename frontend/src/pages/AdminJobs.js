import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);

  const load = () => api.get('/jobs/admin/all/').then(({ data }) => setJobs(data.results));
  useEffect(() => { load(); }, []);

  const remove = async (job) => {
    if (!window.confirm(`Remove "${job.title}" from the platform?`)) return;
    await api.delete(`/jobs/admin/${job.id}/`);
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
  };

  return (
    <div className="container page">
      <h1>Manage jobs</h1>
      <div className="card">
        <table>
          <thead><tr><th>Title</th><th>Company</th><th>Recruiter</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.title}</td>
                <td>{j.company_detail?.name}</td>
                <td>{j.recruiter_username}</td>
                <td>{j.is_active ? 'Open' : 'Closed'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(j)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && <div className="empty-state">No jobs on the platform yet.</div>}
      </div>
    </div>
  );
}
