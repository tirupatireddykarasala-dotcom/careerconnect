import React, { useCallback, useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from './Alert';

const EMPTY = { title: '', company: '', location: '', start_date: '', end_date: '', description: '' };

function formatMonth(d) {
  if (!d) return 'Present';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ExperienceSection() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Ask Django for my list of jobs
  const load = useCallback(() => {
    return api
      .get('/auth/experiences/')
      .then(({ data }) => setItems(Array.isArray(data) ? data : data.results || []))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/auth/experiences/', { ...form, end_date: form.end_date || null });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this experience?')) return;
    try {
      await api.delete(`/auth/experiences/${id}/`);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="card">
      <div className="section-head">
        <h3>Experience</h3>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <Alert>{error}</Alert>

      {showForm && (
        <form onSubmit={add} style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div className="field">
              <label>Job title</label>
              <input required value={form.title} onChange={set('title')} placeholder="Frontend Developer" />
            </div>
            <div className="field">
              <label>Company</label>
              <input required value={form.company} onChange={set('company')} placeholder="ABC Technologies" />
            </div>
          </div>
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={set('location')} placeholder="Hyderabad" />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Start date</label>
              <input required type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={form.end_date} onChange={set('end_date')} />
              <p className="field-hint">Leave empty if you still work here.</p>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={set('description')} />
          </div>
          <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save experience'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && <p className="muted small">No experience added yet.</p>}

      {items.map((x) => (
        <div key={x.id} className="person-row">
          <div className="person-info">
            <div className="person-name">{x.title}</div>
            <div className="person-headline">
              {x.company}{x.location ? ` · ${x.location}` : ''}
            </div>
            <div className="person-headline">{formatMonth(x.start_date)} – {formatMonth(x.end_date)}</div>
            {x.description && <p className="small" style={{ margin: '6px 0 0' }}>{x.description}</p>}
          </div>
          <div className="person-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(x.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}