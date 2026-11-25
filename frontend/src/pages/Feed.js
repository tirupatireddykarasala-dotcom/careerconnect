import React, { useCallback, useEffect, useState } from 'react';
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

// Comments under one post
function Comments({ postId, onAdded }) {
  const [list, setList] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/auth/posts/${postId}/comments/`)
      .then(({ data }) => setList(data))
      .catch((err) => setError(extractErrorMessage(err)));
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/auth/posts/${postId}/comments/`, { content: text });
      setText('');
      load();
      onAdded();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--line-200)', paddingTop: 12 }}>
      <Alert>{error}</Alert>
      {list.map((c) => (
        <div key={c.id} className="row" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
          <Avatar a={c.author} size={32} />
          <div style={{ background: 'var(--paper-200)', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
            <div className="person-name small">{c.author.full_name} <span className="muted">· {timeAgo(c.created_at)}</span></div>
            <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
          </div>
        </div>
      ))}
      <form onSubmit={send} className="row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line-200)', borderRadius: 4 }}
        />
        <button className="btn btn-primary btn-sm" disabled={busy}>Comment</button>
      </form>
    </div>
  );
}

function PostCard({ post, onDelete }) {
  const [p, setP] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');

  const like = async () => {
    try {
      const { data } = await api.post(`/auth/posts/${p.id}/like/`);
      setP({ ...p, liked_by_me: data.liked, like_count: data.like_count });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar a={p.author} />
        <div className="person-info">
          <div className="person-name">{p.author.full_name}</div>
          <div className="person-headline">
            {p.author.headline || (p.author.role === 'recruiter' ? 'Recruiter' : 'Job Seeker')} · {timeAgo(p.created_at)}
          </div>
        </div>
        {p.is_mine && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onDelete(p.id)}>Delete</button>
        )}
      </div>

      <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0' }}>{p.content}</p>
      <Alert>{error}</Alert>

      <div className="row small muted" style={{ marginBottom: 8 }}>
        <span>{p.like_count} likes</span>
        <span>{p.comment_count} comments</span>
      </div>

      <div className="row">
        <button type="button" className={`btn btn-sm ${p.liked_by_me ? 'btn-accent' : 'btn-outline'}`} onClick={like}>
          {p.liked_by_me ? 'Liked' : 'Like'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowComments(!showComments)}>
          Comment
        </button>
      </div>

      {showComments && (
        <Comments postId={p.id} onAdded={() => setP({ ...p, comment_count: p.comment_count + 1 })} />
      )}
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api.get('/auth/posts/')
      .then(({ data }) => setPosts(data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError('');
    try {
      await api.post('/auth/posts/', { content: text });
      setText('');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/auth/posts/${id}/`);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="container page" style={{ maxWidth: 680 }}>
      <h1>Feed</h1>
      <Alert>{error}</Alert>

      <form onSubmit={publish} className="card" style={{ marginBottom: 24 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with your network..."
          />
        </div>
        <button className="btn btn-primary btn-sm" disabled={posting || !text.trim()}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {!loading && posts.length === 0 && (
        <div className="empty-state">No posts yet. Write the first one, or connect with more people.</div>
      )}
      {posts.map((p) => <PostCard key={p.id} post={p} onDelete={remove} />)}
    </div>
  );
}