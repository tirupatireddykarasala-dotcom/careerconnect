import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);

  const load = () => api.get('/companies/').then(({ data }) => setCompanies(data.results));
  useEffect(() => { load(); }, []);

  const remove = async (c) => {
    if (!window.confirm(`Remove "${c.name}"? This also removes its job postings.`)) return;
    await api.delete(`/companies/admin/${c.id}/`);
    setCompanies((prev) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <div className="container page">
      <h1>Manage companies</h1>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Location</th><th>Registered by</th><th></th></tr></thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.location}</td>
                <td>{c.created_by_username}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && <div className="empty-state">No companies registered yet.</div>}
      </div>
    </div>
  );
}
