import React, { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';
import ConnectButton from '../components/ConnectButton';

function Avatar({ a, size = 46 }) {
  if (a.photo) {
    return (
      <img
        src={a.photo}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return <div className="avatar" style={{ width: size, height: size }}>{a.full_name.charAt(0)}</div>;
}

const ROLE_LABEL = { job_seeker: 'Job Seeker', recruiter: 'Recruiter' };

export default function People() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Wait 0.4 seconds after the person stops typing, then ask Django
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setResults([]);
      setSearched(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api.get('/auth/people/', { params: { q: text } })
        .then(({ data }) => { setResults(data); setSearched(true); setError(''); })
        .catch((err) => setError(extractErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <h1>Find people</h1>
      <Alert>{error}</Alert>

      <div className="field">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, skill, headline or location..."
        />
        <p className="field-hint">Type at least 2 letters. Try a name, "React" or "Hyderabad".</p>
      </div>

      <div className="card">
        {q.trim().length < 2 && <p className="muted small">Start typing to search.</p>}
        {loading && <p className="muted small">Searching...</p>}
        {!loading && searched && results.length === 0 && (
          <p className="muted small">No people found for "{q.trim()}".</p>
        )}

        {results.map((p) => (
          <div key={p.username} className="person-row">
            <Avatar a={p} />
            <div className="person-info">
              <div className="person-name">{p.full_name}</div>
              <div className="person-headline">
                {p.headline || ROLE_LABEL[p.role] || p.role} · @{p.username}
              </div>
            </div>
            <div className="person-actions">
              <ConnectButton username={p.username} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}