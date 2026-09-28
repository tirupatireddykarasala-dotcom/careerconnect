import React from 'react';
import { Link } from 'react-router-dom';

/**
 * WHY salary IS FORMATTED HERE, NOT IN THE API:
 * The backend stores raw integers (salary_min/salary_max) so it can filter
 * numerically. Turning "600000" into "₹6.0L" is purely a display concern,
 * so it belongs in the component that renders it, not in the API response.
 */
function formatSalary(min, max) {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n}`);
  return `${fmt(min)} - ${fmt(max)} / year`;
}

export default function JobCard({ job, actions }) {
  const skills = (job.skills_required || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="card job-card">
      <div className="spread">
        <div>
          <h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3>
          <div className="company-line">
            {job.company_detail?.name || 'Company'} • {job.location}
          </div>
        </div>
        {!job.is_active && <span className="tag">Closed</span>}
      </div>

      <div className="job-tags">
        {skills.slice(0, 6).map((s) => <span key={s} className="tag">{s}</span>)}
      </div>

      <div className="spread">
        <span className="small muted">{formatSalary(job.salary_min, job.salary_max)}</span>
        <span className="small muted">{job.job_type?.replace('_', ' ')}</span>
      </div>

      {actions && <div className="row" style={{ marginTop: 14 }}>{actions}</div>}
    </div>
  );
}
