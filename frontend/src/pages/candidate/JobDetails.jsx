import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function JobDetails() {
  const { id } = useParams();
  const { session } = useAuth();
  const [job, setJob] = useState(null);
  const [answers, setAnswers] = useState({});
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ job }) => setJob(job));
  }, [id]);

  async function handleApply(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/applications', { job_id: id, answers, source: 'direct' });
      setApplied(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    await api.post(`/saved-jobs/${id}`);
    setSaved(true);
  }

  if (!job) return <div className="max-w-3xl mx-auto px-6 py-12 text-ink-400">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{job.title}</h1>
          <p className="text-ink-400">{job.companies?.name} · {job.remote ? 'Remote' : job.location}</p>
        </div>
        <span className="text-xs font-mono uppercase px-2 py-1 rounded-full bg-signal-50 text-signal-600 h-fit">{job.job_type}</span>
      </div>

      <div className="flex flex-wrap gap-2 my-4">
        {(job.key_skills || []).map((s) => <span key={s} className="px-2.5 py-1 text-xs rounded-md bg-ink-50 text-ink-600">{s}</span>)}
      </div>

      <div className="card p-6 space-y-3 text-sm">
        <p className="whitespace-pre-line text-ink-600">{job.description || 'No description provided.'}</p>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-50 text-ink-400">
          <p><strong className="text-ink-600">Experience:</strong> {job.experience_required || 'Not specified'}</p>
          <p><strong className="text-ink-600">Education:</strong> {job.education_required || 'Not specified'}</p>
          <p><strong className="text-ink-600">Salary:</strong> {job.salary_min ? `₹${job.salary_min} – ₹${job.salary_max}` : 'Not disclosed'}</p>
          <p><strong className="text-ink-600">Notice period:</strong> {job.notice_period || 'Not specified'}</p>
        </div>
      </div>

      {!session ? (
        <p className="mt-6 text-ink-400 text-sm">Log in as a candidate to apply.</p>
      ) : applied ? (
          <div className="mt-6 card p-6 text-center bg-moss-50 border-moss/20">
          <p className="font-semibold text-moss">Application submitted!</p>
          <p className="text-sm text-ink-400 mt-1">You'll be notified about updates in your applications tab.</p>
        </div>
      ) : (
        <form onSubmit={handleApply} className="mt-6 card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Apply for this role</h2>
          {(job.screening_questions || []).map((q, i) => (
            <div key={i}>
              <label className="label">{q.question}</label>
              <input className="input" onChange={(e) => setAnswers({ ...answers, [q.question]: e.target.value })} />
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-signal" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'}</button>
            <button type="button" onClick={handleSave} className="btn-outline">{saved ? 'Saved ✓' : 'Save for later'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
