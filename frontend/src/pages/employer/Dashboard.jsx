import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/jobs/mine'), api.get('/nudges')])
      .then(([j, n]) => { setJobs(j.jobs); setNudges(n.nudges); })
      .finally(() => setLoading(false));
  }, []);

  async function duplicateJob(id) {
    await api.post(`/jobs/${id}/duplicate`);
    const { jobs } = await api.get('/jobs/mine');
    setJobs(jobs);
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-12 text-ink-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Your jobs</h1>
          <p className="text-ink-400 text-sm">Manage postings and review applicants.</p>
        </div>
        <Link to="/employer/post-job" className="btn-signal">+ Post a job</Link>
      </div>

      {nudges.length > 0 && (
        <div className="card p-4 mb-8 bg-signal-50 border-signal/20 space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-wide text-signal-600 mb-1">Nudges</p>
          {nudges.map((n, i) => <p key={i} className="text-sm text-ink-600">{n.message}</p>)}
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="text-ink-400">No jobs yet — post your first role to start attracting candidates.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">{job.title}</h3>
                  <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    job.status === 'live' ? 'bg-moss-50 text-moss' : 'bg-ink-50 text-ink-400'
                  }`}>{job.status}</span>
                </div>
                <p className="text-sm text-ink-400">{job.location || 'Remote'} · {job.views || 0} views</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/employer/jobs/${job.id}/applications`} className="btn-outline text-sm py-1.5 px-3">Applications</Link>
                <Link to={`/employer/jobs/${job.id}/analytics`} className="btn-outline text-sm py-1.5 px-3">Analytics</Link>
                <button onClick={() => duplicateJob(job.id)} className="btn-outline text-sm py-1.5 px-3">Duplicate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
