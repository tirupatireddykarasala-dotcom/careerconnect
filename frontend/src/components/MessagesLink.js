import React, { useEffect, useState } from 'react';
import { NavLink as Link } from 'react-router-dom';
import api from '../api/axios';

// The "Messages" link in the top bar, with a small number for unread messages
export default function MessagesLink() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/auth/messages/unread-count/')
        .then(({ data }) => { if (alive) setUnread(data.unread); })
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <Link to="/messages">
      Messages{unread > 0 && <span className="count-pill" style={{ marginLeft: 6 }}>{unread}</span>}
    </Link>
  );
}