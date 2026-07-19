import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function CompanySetup() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', industry: '', size: '', website: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/companies/mine').then(({ company }) => {
      if (company) { setCompany(company); setForm(company); }
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { company } = await api.post('/companies', form);
      setCompany(company);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setSaving(true);
    try {
      const { company: updated } = await api.post(`/companies/${company.id}/verify`);
      setCompany(updated);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="max-w-xl mx-auto px-6 py-12 text-ink-400">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">Set up your company</h1>
      <p className="text-ink-400 text-sm mt-1 mb-8">Step 1 — this powers your public job listings.</p>

      {!company ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Company name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Industry</label>
              <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <label className="label">Company size</label>
              <input className="input" placeholder="e.g. 11-50" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" placeholder="https://…" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-signal w-full" disabled={saving}>{saving ? 'Saving…' : 'Continue'}</button>
        </form>
      ) : (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">{company.name}</h2>
          <p className="text-sm text-ink-400">{company.industry} · {company.size} employees</p>
          {company.domain_verified ? (
            <div className="flex items-center gap-2 text-moss">
              <span className="stage-num bg-moss">✓</span>
              <span className="font-medium">Account ready — you're all set to post jobs and hire top talent!</span>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-400 mb-3">Verify your company to unlock full visibility for your jobs.</p>
              <button onClick={handleVerify} className="btn-primary" disabled={saving}>
                {saving ? 'Verifying…' : 'Verify company'}
              </button>
            </div>
          )}
          <button onClick={() => navigate('/employer/dashboard')} className="btn-outline w-full">Go to dashboard</button>
        </div>
      )}
    </div>
  );
}
