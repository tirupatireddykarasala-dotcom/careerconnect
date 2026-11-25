import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';

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

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the list, then mark everything as read (unread ones stay highlighted on this visit)
  useEffect(() => {
    api.get('/auth/notifications/')
      .then(({ data }) => {
        setItems(data);
        return api.post('/auth/notifications/read-all/');
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <h1>Notifications</h1>
      <Alert>{error}</Alert>

      <div className="card">
        {loading && <p className="muted small">Loading...</p>}
        {!loading && items.length === 0 && <p className="muted small">Nothing new yet.</p>}

        {items.map((n) => (
          <Link
            key={n.id}
            to={n.link}
            className="person-row"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              padding: 12,
              borderRadius: 8,
              background: n.is_read ? 'transparent' : 'var(--warn-100)',
            }}
          >
            <Avatar a={n.actor} size={44} />
            <div className="person-info">
              <div>
                <span className="person-name">{n.actor.full_name}</span> {n.text}
              </div>
              <div className="person-headline">{timeAgo(n.created_at)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}