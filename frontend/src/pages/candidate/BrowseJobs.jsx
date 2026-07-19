import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import JobCard from '../../components/JobCard';

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (location) params.set('location', location);
      if (jobType) params.set('job_type', jobType);
      const { jobs } = await api.get(`/jobs?${params.toString()}`);
      setJobs(jobs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadJobs(); }, []); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">Explore opportunities</h1>
      <p className="text-ink-400 text-sm mb-6">A personalized feed based on your filters.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); loadJobs(); }}
        className="flex flex-wrap gap-3 mb-8"
      >
        <input className="input flex-1 min-w-[180px]" placeholder="Search role, title…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="input flex-1 min-w-[160px]" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select className="input w-40" value={jobType} onChange={(e) => setJobType(e.target.value)}>
          <option value="">Any type</option>
          <option value="job">Job</option>
          <option value="internship">Internship</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      {loading ? (
        <p className="text-ink-400">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="text-ink-400">No jobs match your filters yet. Try widening your search.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
