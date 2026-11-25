import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'Find the right job',
    text: 'Search real openings by location, skills and salary, save the ones you like, and track every application.',
  },
  {
    title: 'Hire with confidence',
    text: 'Post a role, review applicants, and move each one from first application to final decision.',
  },
  {
    title: 'Grow your network',
    text: 'Connect with people, share posts, and message your connections.',
  },
];

const HOME_FOR = { job_seeker: '/feed', recruiter: '/feed', admin: '/admin' };

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <section className="hero">
        <h1>Find talent. Find your next role.</h1>
        <p>
          CareerConnect brings job seekers and recruiters into one place — search real openings by
          location, skills and salary, or post a role and track applicants from first application to
          final decision.
        </p>

        <div className="hero-actions">
          {user ? (
            <>
              <Link to={HOME_FOR[user.role] || '/jobs'} className="btn btn-primary">Go to your feed</Link>
              <Link to="/jobs" className="btn btn-outline">Browse jobs</Link>
            </>
          ) : (
            <>
              <Link to="/jobs" className="btn btn-primary">Browse jobs</Link>
              <Link to="/register" className="btn btn-outline">Create an account</Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="card feature-card">
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}