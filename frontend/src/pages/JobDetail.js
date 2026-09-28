import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/jobs/${id}/`).then(({ data }) => setJob(data));
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setError('');
    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('job', id);
      formData.append('resume', resumeFile);
      formData.append('cover_note', coverNote);
      await api.post('/applications/apply/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Application submitted! Track its status from "My Applications".');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (!job) return <div className="container page">Loading...</div>;

  const skills = (job.skills_required || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="container page">
      <div className="grid-2col">
        <div>
          <h1>{job.title}</h1>
          <p className="muted">{job.company_detail?.name} • {job.location} • {job.job_type?.replace('_', ' ')}</p>

          <div className="job-tags">{skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3>Job description</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
            {job.responsibilities && (
              <>
                <h3>Responsibilities</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{job.responsibilities}</p>
              </>
            )}
          </div>
        </div>

        <aside className="card" style={{ alignSelf: 'start' }}>
          <h3>Apply for this role</h3>
          {!job.is_active && <Alert>This job is closed and no longer accepting applications.</Alert>}
          {(!user || user.role === 'job_seeker') && job.is_active && (
            <>
              <Alert>{error}</Alert>
              <Alert type="success">{success}</Alert>
              {!success && (
                <form onSubmit={handleApply}>
                  <div className="field">
                    <label>Resume (PDF/DOC)</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} required />
                  </div>
                  <div className="field">
                    <label>Cover note (optional)</label>
                    <textarea rows={4} value={coverNote} onChange={(e) => setCoverNote(e.target.value)} />
                  </div>
                  <button className="btn btn-accent btn-block" disabled={applying}>
                    {applying ? 'Submitting...' : user ? 'Apply now' : 'Log in to apply'}
                  </button>
                </form>
              )}
            </>
          )}
          {user && user.role === 'recruiter' && <p className="muted small">Recruiters cannot apply to jobs.</p>}
        </aside>
      </div>
    </div>
  );
}
