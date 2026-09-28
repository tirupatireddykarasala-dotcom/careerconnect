import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const STATUS_FLOW = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];
const STATUS_LABEL = {
  applied: 'Applied', under_review: 'Under Review', shortlisted: 'Shortlisted',
  interview: 'Interview', selected: 'Selected', rejected: 'Rejected',
};

export default function Applicants() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/applications/job/${jobId}/applicants/`).then(({ data }) => setApplicants(data.results)).finally(() => setLoading(false));
  };
  useEffect(load, [jobId]);

  const changeStatus = async (appId, status) => {
    await api.patch(`/applications/${appId}/status/`, { status });
    setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
  };

  const downloadResume = async (appId, username) => {
    const response = await api.get(`/applications/${appId}/resume/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${username}_resume`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="container page">
      <h1>Applicants</h1>
      {loading ? <p>Loading...</p> : (
        <div className="stack">
          {applicants.map((a) => (
            <div key={a.id} className="card">
              <div className="spread">
                <div>
                  <h3>{a.applicant_username}</h3>
                  <p className="small muted">{a.applicant_email} • {a.applicant_experience} yrs experience</p>
                  {a.applicant_skills && <p className="small muted">Skills: {a.applicant_skills}</p>}
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.cover_note && <p className="small" style={{ marginTop: 10 }}>"{a.cover_note}"</p>}
              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn btn-outline btn-sm" onClick={() => downloadResume(a.id, a.applicant_username)}>Download resume</button>
                <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)} style={{ maxWidth: 180 }}>
                  {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
          ))}
          {applicants.length === 0 && <div className="empty-state card">No applicants yet for this job.</div>}
        </div>
      )}
    </div>
  );
}
