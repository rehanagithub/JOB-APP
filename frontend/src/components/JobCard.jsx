import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  return (
    <Link to={`/candidate/jobs/${job.id}`} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-ink leading-snug">{job.title}</h3>
          <p className="text-sm text-ink-400">{job.companies?.name || 'Company'}</p>
        </div>
        <span className="text-[11px] font-mono uppercase px-2 py-1 rounded-full bg-signal-50 text-signal-600">
          {job.job_type}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {(job.key_skills || []).slice(0, 4).map((s) => (
          <span key={s} className="px-2 py-1 rounded-md bg-ink-50 text-ink-600">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-ink-400 pt-1 border-t border-ink-50">
        <span>{job.remote ? 'Remote' : job.location || 'Location N/A'}</span>
        {job.salary_max && <span className="font-mono text-ink-600">up to ₹{job.salary_max}</span>}
      </div>
    </Link>
  );
}
