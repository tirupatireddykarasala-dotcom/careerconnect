import React, { useCallback, useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from './Alert';

const EMPTY = { school: '', degree: '', field_of_study: '', start_year: '', end_year: '' };

export default function EducationSection() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Ask Django for my list of schools
  const load = useCallback(() => {
    return api
      .get('/auth/educations/')
      .then(({ data }) => setItems(Array.isArray(data) ? data : data.results || []))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/auth/educations/', { ...form, end_year: form.end_year || null });
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
    if (!window.confirm('Delete this education?')) return;
    try {
      await api.delete(`/auth/educations/${id}/`);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="card">
      <div className="section-head">
        <h3>Education</h3>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <Alert>{error}</Alert>

      {showForm && (
        <form onSubmit={add} style={{ marginBottom: 16 }}>
          <div className="field">
            <label>School / College</label>
            <input required value={form.school} onChange={set('school')} placeholder="JNTU Hyderabad" />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Degree</label>
              <input required value={form.degree} onChange={set('degree')} placeholder="B.Tech" />
            </div>
            <div className="field">
              <label>Field of study</label>
              <input value={form.field_of_study} onChange={set('field_of_study')} placeholder="Computer Science" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Start year</label>
              <input required type="number" min="1950" max="2100" value={form.start_year} onChange={set('start_year')} placeholder="2020" />
            </div>
            <div className="field">
              <label>End year</label>
              <input type="number" min="1950" max="2100" value={form.end_year} onChange={set('end_year')} placeholder="2024" />
              <p className="field-hint">Leave empty if you are still studying.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save education'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && <p className="muted small">No education added yet.</p>}

      {items.map((x) => (
        <div key={x.id} className="person-row">
          <div className="person-info">
            <div className="person-name">{x.school}</div>
            <div className="person-headline">
              {x.degree}{x.field_of_study ? `, ${x.field_of_study}` : ''}
            </div>
            <div className="person-headline">{x.start_year} – {x.end_year || 'Present'}</div>
          </div>
          <div className="person-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(x.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}