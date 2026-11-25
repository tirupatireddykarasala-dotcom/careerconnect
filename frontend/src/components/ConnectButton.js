import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../api/axios';

export default function ConnectButton({ username }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api
      .get(`/auth/connections/status/${username}/`)
      .then(({ data }) => setState(data))
      .catch(() => setState({ status: 'error' }));
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const connect = () => run(() => api.post('/auth/connections/request/', { username }));
  const remove = () => run(() => api.delete(`/auth/connections/${state.id}/`));

  if (!state || state.status === 'self' || state.status === 'error') return null;

  return (
    <>
      {state.status === 'none' && (
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={connect}>
          Connect
        </button>
      )}

      {state.status === 'pending_sent' && (
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={remove}>
          Pending (click to cancel)
        </button>
      )}

      {state.status === 'pending_received' && (
        <Link to="/network" className="btn btn-accent btn-sm">Respond</Link>
      )}

      {state.status === 'connected' && (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={busy}
          onClick={() => window.confirm('Remove this connection?') && remove()}
        >
          Connected
        </button>
      )}

      {error && <span className="field-error">{error}</span>}
    </>
  );
}