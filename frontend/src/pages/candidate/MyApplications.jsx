import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import StatusStepper from '../../components/StatusStepper';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/mine').then(({ applications }) => setApplications(applications)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-12 text-ink-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">My applications</h1>
      <p className="text-ink-400 text-sm mb-8">Track every application in one place.</p>

      {applications.length === 0 ? (
        <p className="text-ink-400">No applications yet — go find something worth applying to.</p>
      ) : (
        <div className="space-y-5">
          {applications.map((app) => (
            <div key={app.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-ink">{app.jobs?.title}</h3>
                  <p className="text-sm text-ink-400">{app.jobs?.companies?.name} · {app.jobs?.location}</p>
                </div>
                <span className="text-xs font-mono text-ink-400">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
              <StatusStepper stage={app.stage} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
