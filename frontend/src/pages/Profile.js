import React, { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../api/axios';
import Alert from '../components/Alert';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile/jobseeker/').then(({ data }) => setProfile(data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const formData = new FormData();
      ['full_name', 'bio', 'skills', 'location', 'experience_years'].forEach((f) => formData.append(f, profile[f] ?? ''));
      if (resumeFile) formData.append('resume', resumeFile);
      const { data } = await api.patch('/auth/profile/jobseeker/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(data);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="container page">Loading...</div>;

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1>My profile</h1>
      <div className="card">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
        <form onSubmit={handleSave}>
          <div className="field">
            <label>Full name</label>
            <input value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={profile.location || ''} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
          </div>
          <div className="field">
            <label>Skills (comma-separated)</label>
            <input value={profile.skills || ''} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="Python, React, SQL" />
          </div>
          <div className="field">
            <label>Years of experience</label>
            <input type="number" min="0" value={profile.experience_years ?? 0} onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} />
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea rows={4} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </div>
          <div className="field">
            <label>Resume</label>
            {profile.resume && <p className="small"><a href={profile.resume} target="_blank" rel="noreferrer">View current resume</a></p>}
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} />
            <p className="field-hint">Uploading a new resume here updates your default — applications keep the copy you submitted with them.</p>
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      </div>
    </div>
  );
}
