import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

/**
 * WHY FILTERS ARE APPLIED VIA A "Search" BUTTON, NOT ON EVERY KEYSTROKE:
 * Firing a network request per keystroke is wasteful and can show flickering
 * results while the user is still typing. Collecting filters into local
 * state and only hitting the API on submit keeps the search feel deliberate
 * and predictable.
 */
export default function JobList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ title: '', location: '', skills: '', min_salary: '', job_type: '' });
  const [savingId, setSavingId] = useState(null);

  const fetchJobs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/', { params });
      setJobs(data.results);
      setCount(data.count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    fetchJobs(params);
  };

  const handleSaveToggle = async (job) => {
    setSavingId(job.id);
    try {
      if (job.is_saved) {
        const { data } = await api.get('/jobs/saved/');
        const saved = data.results.find((s) => s.job === job.id);
        if (saved) await api.delete(`/jobs/saved/${saved.id}/`);
      } else {
        await api.post('/jobs/saved/', { job: job.id });
      }
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_saved: !j.is_saved } : j)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container page">
      <h1>Find your next role</h1>
      <div className="grid-2col">
        <aside className="card" style={{ alignSelf: 'start' }}>
          <h3>Filter</h3>
          <form onSubmit={handleSearch} className="stack">
            <div className="field">
              <label>Job title</label>
              <input value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} placeholder="e.g. Backend Developer" />
            </div>
            <div className="field">
              <label>Location</label>
              <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="e.g. Hyderabad" />
            </div>
            <div className="field">
              <label>Skills</label>
              <input value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} placeholder="e.g. React" />
            </div>
            <div className="field">
              <label>Minimum salary (₹/yr)</label>
              <input type="number" value={filters.min_salary} onChange={(e) => setFilters({ ...filters, min_salary: e.target.value })} placeholder="e.g. 600000" />
            </div>
            <div className="field">
              <label>Job type</label>
              <select value={filters.job_type} onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}>
                <option value="">Any</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block">Search</button>
          </form>
        </aside>

        <div>
          <p className="muted small" style={{ marginBottom: 12 }}>{loading ? 'Searching...' : `${count} job${count === 1 ? '' : 's'} found`}</p>
          <div className="stack">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                actions={user?.role === 'job_seeker' ? (
                  <button className="btn btn-outline btn-sm" disabled={savingId === job.id} onClick={() => handleSaveToggle(job)}>
                    {job.is_saved ? 'Unsave' : 'Save'}
                  </button>
                ) : null}
              />
            ))}
            {!loading && jobs.length === 0 && <div className="empty-state card">No jobs match your search yet. Try widening your filters.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
