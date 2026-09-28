import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';

export default function SavedJobs() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/jobs/saved/').then(({ data }) => setSaved(data.results)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (savedId) => {
    await api.delete(`/jobs/saved/${savedId}/`);
    setSaved((prev) => prev.filter((s) => s.id !== savedId));
  };

  return (
    <div className="container page">
      <h1>Saved jobs</h1>
      {loading ? <p>Loading...</p> : (
        <div className="stack">
          {saved.map((s) => (
            <JobCard
              key={s.id}
              job={s.job_detail}
              actions={<button className="btn btn-outline btn-sm" onClick={() => handleRemove(s.id)}>Remove</button>}
            />
          ))}
          {saved.length === 0 && <div className="empty-state card">You haven't saved any jobs yet.</div>}
        </div>
      )}
    </div>
  );
}
