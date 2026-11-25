import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

function clock(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function Messages() {
  const { username } = useParams();       // who I am chatting with (from the address bar)
  const navigate = useNavigate();
  const [convos, setConvos] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Left side: my connections with last message and unread count
  const loadConvos = useCallback(() => {
    return api.get('/auth/messages/')
      .then(({ data }) => setConvos(data))
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  // Right side: the chat with the selected person
  const loadThread = useCallback(() => {
    if (!username) return Promise.resolve();
    return api.get(`/auth/messages/${username}/`)
      .then(({ data }) => { setThread(data); setError(''); })
      .catch((err) => setError(extractErrorMessage(err)));
  }, [username]);

  // Refresh the left list every 8 seconds
  useEffect(() => {
    loadConvos();
    const t = setInterval(loadConvos, 8000);
    return () => clearInterval(t);
  }, [loadConvos]);

  // Refresh the open chat every 5 seconds
  useEffect(() => {
    setThread(null);
    loadThread().then(loadConvos);
    const t = setInterval(loadThread, 5000);
    return () => clearInterval(t);
  }, [loadThread, loadConvos]);

  // Scroll to the newest message
  const count = thread ? thread.messages.length : 0;
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [count]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/auth/messages/${username}/`, { content: text });
      setText('');
      await loadThread();
      loadConvos();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container page">
      <h1>Messages</h1>
      <Alert>{error}</Alert>

      <div className="grid-2col">
        {/* LEFT: people */}
        <div className="card" style={{ padding: 8, alignSelf: 'start' }}>
          {convos.length === 0 && (
            <p className="muted small" style={{ padding: 12 }}>
              No connections yet. Connect with people in <Link to="/network">My Network</Link>.
            </p>
          )}
          {convos.map((c) => (
            <div
              key={c.person.username}
              className="person-row"
              onClick={() => navigate(`/messages/${c.person.username}`)}
              style={{
                cursor: 'pointer',
                padding: 10,
                borderRadius: 8,
                background: c.person.username === username ? 'var(--paper-200)' : 'transparent',
              }}
            >
              <Avatar a={c.person} size={40} />
              <div className="person-info">
                <div className="person-name">{c.person.full_name}</div>
                <div className="person-headline" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.last_message || 'Say hello'}
                </div>
              </div>
              {c.unread > 0 && <span className="count-pill">{c.unread}</span>}
            </div>
          ))}
        </div>

        {/* RIGHT: the chat */}
        <div className="card">
          {!username && <div className="empty-state">Pick a person on the left to start chatting.</div>}

          {username && !thread && <p className="muted">Loading...</p>}

          {username && thread && (
            <>
              <div className="row" style={{ paddingBottom: 12, borderBottom: '1px solid var(--line-200)' }}>
                <Avatar a={thread.person} size={40} />
                <div>
                  <div className="person-name">{thread.person.full_name}</div>
                  <div className="person-headline">{thread.person.headline || `@${thread.person.username}`}</div>
                </div>
              </div>

              <div style={{ height: 380, overflowY: 'auto', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thread.messages.length === 0 && <p className="muted small">No messages yet. Write the first one.</p>}
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.mine ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      background: m.mine ? 'var(--ink-900)' : 'var(--paper-200)',
                      color: m.mine ? '#fff' : 'var(--text-900)',
                      padding: '8px 12px',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>{clock(m.created_at)}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="row">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a message..."
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--line-200)', borderRadius: 4 }}
                />
                <button className="btn btn-primary" disabled={sending || !text.trim()}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}