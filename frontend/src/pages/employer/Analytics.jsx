import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Analytics() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/analytics/job/${jobId}`).then(setData);
  }, [jobId]);

  if (!data) return <div className="max-w-4xl mx-auto px-6 py-12 text-ink-400">Loading…</div>;

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Analytics</h1>

      <section className="card p-6">
        <h2 className="text-xs font-semibold uppercase text-ink-400 mb-4">Job performance</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div><p className="text-2xl font-display font-semibold text-ink">{data.performance.views}</p><p className="text-xs text-ink-400">Views</p></div>
          <div><p className="text-2xl font-display font-semibold text-ink">{data.performance.applies}</p><p className="text-xs text-ink-400">Applications</p></div>
          <div><p className="text-2xl font-display font-semibold text-ink">{data.performance.shortlisted}</p><p className="text-xs text-ink-400">Shortlisted</p></div>
          <div><p className="text-2xl font-display font-semibold text-moss">{data.performance.hires}</p><p className="text-xs text-ink-400">Hires</p></div>
        </div>
        <p className="text-center text-sm text-ink-400 mt-3">Conversion rate: {data.performance.conversion_rate}%</p>
      </section>

      <section className="card p-6">
        <h2 className="text-xs font-semibold uppercase text-ink-400 mb-4">Source performance</h2>
        {Object.keys(data.source_performance).length === 0 ? (
          <p className="text-sm text-ink-400">No source data yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(data.source_performance).map(([source, count]) => (
              <div key={source} className="flex items-center gap-3">
                <span className="w-24 text-sm capitalize text-ink-600">{source}</span>
                <div className="flex-1 h-2 bg-ink-50 rounded-full overflow-hidden">
                  <div className="h-full bg-signal" style={{ width: `${(count / Math.max(...Object.values(data.source_performance))) * 100}%` }} />
                </div>
                <span className="text-sm font-mono text-ink-400">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-xs font-semibold uppercase text-ink-400 mb-4">Funnel analytics</h2>
        <div className="space-y-2">
          {data.funnel.map((f) => (
            <div key={f.stage} className="flex items-center gap-3">
              <span className="w-28 text-sm capitalize text-ink-600">{f.stage.replace('_', ' ')}</span>
              <div className="flex-1 h-2 bg-ink-50 rounded-full overflow-hidden">
                <div className="h-full bg-moss" style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
              </div>
              <span className="text-sm font-mono text-ink-400">{f.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 bg-signal-50 border-signal/20">
        <h2 className="text-xs font-semibold uppercase text-signal-600 mb-3">Insights & recommendations</h2>
        <ul className="space-y-1.5 text-sm text-ink-600">
          {data.insights.map((insight, i) => <li key={i}>• {insight}</li>)}
        </ul>
      </section>
    </div>
  );
}
