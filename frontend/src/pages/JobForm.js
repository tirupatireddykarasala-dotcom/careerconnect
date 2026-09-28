import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';

const EMPTY = {
  title: '', description: '', responsibilities: '', location: '', job_type: 'full_time',
  skills_required: '', salary_min: '', salary_max: '', company: '',
};

/**
 * One component handles BOTH "post a new job" (no :id in the URL) and
 * "edit an existing job" (:id present) — the fields and validation are
 * identical, so a single form avoids duplicating that logic across two files.
 */
export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: me } = await api.get('/auth/me/');
      const { data: companies } = await api.get('/companies/');
      const mine = companies.results.find((c) => c.created_by === me.id);
      setCompany(mine || null);

      if (isEdit) {
        const { data: job } = await api.get(`/jobs/${id}/`);
        setForm({ ...job, company: job.company });
      } else if (mine) {
        setForm((f) => ({ ...f, company: mine.id }));
      }
      setLoading(false);
    };
    load();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/jobs/${id}/`, form);
      } else {
        await api.post('/jobs/', form);
      }
      navigate('/recruiter/jobs');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container page">Loading...</div>;

  if (!company) {
    return (
      <div className="container page">
        <Alert>You need a company profile before posting a job.</Alert>
        <a href="/recruiter/company" className="btn btn-primary">Set up company profile</a>
      </div>
    );
  }

  return (
    <div className="container page" style={{ maxWidth: 640 }}>
      <h1>{isEdit ? 'Edit job' : 'Post a new job'}</h1>
      <div className="card">
        <Alert>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Job title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div className="field">
              <label>Job type</label>
              <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Skills required (comma-separated)</label>
            <input value={form.skills_required} onChange={(e) => setForm({ ...form, skills_required: e.target.value })} placeholder="Python, Django, MySQL" required />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Minimum salary (₹/yr)</label>
              <input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
            </div>
            <div className="field">
              <label>Maximum salary (₹/yr)</label>
              <input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="field">
            <label>Responsibilities (optional)</label>
            <textarea rows={4} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Post job'}</button>
        </form>
      </div>
    </div>
  );
}
