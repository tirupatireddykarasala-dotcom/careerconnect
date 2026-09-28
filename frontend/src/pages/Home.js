import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container page">
      <h1>Find talent. Find your next role.</h1>
      <p className="muted" style={{ maxWidth: 560, marginBottom: 24 }}>
        CareerConnect brings job seekers and recruiters into one place — search
        real openings by location, skills and salary, or post a role and
        track applicants from first application to final decision.
      </p>
      <div className="row">
        <Link to="/jobs" className="btn btn-primary">Browse jobs</Link>
        <Link to="/register" className="btn btn-outline">Create an account</Link>
      </div>
    </div>
  );
}
