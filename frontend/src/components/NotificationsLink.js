import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// The "Notifications" link in the top bar, with a small number for unread ones
export default function NotificationsLink() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get('/auth/notifications/unread-count/')
        .then(({ data }) => { if (alive) setUnread(data.unread); })
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <Link to="/notifications">
      Notifications{unread > 0 && <span className="count-pill" style={{ marginLeft: 6 }}>{unread}</span>}
    </Link>
  );
}