import React, { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';

/**
 * WHY THIS PAGE LOOKS UP "does my company already exist" BEFORE SHOWING A FORM:
 * The backend rule is one company per recruiter (via RecruiterCompany), and a
 * recruiter must have a company before posting jobs (see jobs/views.py
 * perform_create). Rather than trying create first and reacting to a 400, we
 * search /api/companies/ for one this recruiter created and switch straight
 * to edit mode if it's there.
 */
export default function RecruiterCompany() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', website: '', location: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me/').then(({ data: me }) =>
      api.get('/companies/').then(({ data }) => {
        const mine = data.results.find((c) => c.created_by === me.id);
        if (mine) { setCompany(mine); setForm(mine); }
      })
    ).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const { data } = company
        ? await api.patch(`/companies/${company.id}/`, form)
        : await api.post('/companies/', form);
      setCompany(data);
      setSuccess('Company profile saved.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container page">Loading...</div>;

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1>Company profile</h1>
      <p className="muted small">You need a company profile before you can post jobs.</p>
      <div className="card">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Company name</label>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Website</label>
            <input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="field">
            <label>About the company</label>
            <textarea rows={4} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : company ? 'Update company' : 'Create company'}</button>
        </form>
      </div>
    </div>
  );
}
