import React, { useCallback, useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';

const ROLE_LABEL = { job_seeker: 'Job Seeker', recruiter: 'Recruiter' };

// One person row: avatar + name + small line + buttons
function PersonRow({ p, children }) {
  return (
    <div className="person-row">
      <div className="avatar">{p.full_name.charAt(0)}</div>
      <div className="person-info">
        <div className="person-name">{p.full_name}</div>
        <div className="person-headline">
          {p.headline || ROLE_LABEL[p.role] || p.role} · @{p.username}
        </div>
      </div>
      <div className="person-actions">{children}</div>
    </div>
  );
}

export default function Network() {
  const [received, setReceived] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  // Ask Django for both lists
  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.get('/auth/connections/pending/'),
        api.get('/auth/connections/'),
      ]);
      setReceived(r.data);
      setConnections(c.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Do one action, then reload both lists so the page shows the truth
  const run = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const accept = (id) => run(id, () => api.post(`/auth/connections/${id}/accept/`));
  const remove = (id) => run(id, () => api.delete(`/auth/connections/${id}/`));

  if (loading) return <div className="container page">Loading...</div>;

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <h1>My Network</h1>
      <Alert>{error}</Alert>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-head">
          <h3>Requests for you</h3>
          <span className="count-pill">{received.length}</span>
        </div>
        {received.length === 0 && <p className="muted small">No pending requests.</p>}
        {received.map((p) => (
          <PersonRow key={p.id} p={p}>
            <button type="button" className="btn btn-primary btn-sm" disabled={busyId === p.id} onClick={() => accept(p.id)}>
              Accept
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busyId === p.id} onClick={() => remove(p.id)}>
              Decline
            </button>
          </PersonRow>
        ))}
      </div>

      <div className="card">
        <div className="section-head">
          <h3>Your connections</h3>
          <span className="count-pill count-pill-quiet">{connections.length}</span>
        </div>
        {connections.length === 0 && <p className="muted small">No connections yet.</p>}
        {connections.map((p) => (
          <PersonRow key={p.id} p={p}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={busyId === p.id}
              onClick={() => window.confirm('Remove this connection?') && remove(p.id)}
            >
              Remove
            </button>
          </PersonRow>
        ))}
      </div>
    </div>
  );
}