import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const STEPS = ['Job details', 'Screening questions', 'Preferences', 'Preview & publish'];

export default function PostJob() {
  const [step, setStep] = useState(0);
  const [companyId, setCompanyId] = useState(null);
  const [job, setJob] = useState(null);
  const [form, setForm] = useState({
    title: '', job_type: 'job', description: '', location: '', remote: false,
    salary_min: '', salary_max: '', key_skills: '',
  });
  const [questions, setQuestions] = useState([]);
  const [prefs, setPrefs] = useState({ experience_required: '', education_required: '', notice_period: '', languages: '' });
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/companies/mine').then(({ company }) => setCompanyId(company?.id));
  }, []);

  async function handleCreateOrUpdateDetails() {
    const payload = {
      ...form,
      key_skills: form.key_skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (!job) {
      const { job: created } = await api.post('/jobs', { company_id: companyId, ...payload });
      setJob(created);
    } else {
      const { job: updated } = await api.patch(`/jobs/${job.id}`, payload);
      setJob(updated);
    }
    setStep(1);
  }

  function addQuestion() {
    setQuestions([...questions, { question: '' }]);
  }

  async function saveQuestionsAndContinue() {
    await api.patch(`/jobs/${job.id}`, { screening_questions: questions.filter((q) => q.question) });
    setStep(2);
  }

  async function savePreferencesAndContinue() {
    await api.patch(`/jobs/${job.id}`, {
      experience_required: prefs.experience_required,
      education_required: prefs.education_required,
      notice_period: prefs.notice_period,
      languages: prefs.languages.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setStep(3);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.post(`/jobs/${job.id}/publish`);
      setPublished(true);
    } finally {
      setPublishing(false);
    }
  }

  if (!companyId) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-ink-400 mb-4">Set up your company profile before posting a job.</p>
        <button onClick={() => navigate('/employer/company-setup')} className="btn-primary">Set up company</button>
      </div>
    );
  }

  if (published) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="stage-num mx-auto bg-moss">✓</div>
        <h1 className="font-display text-2xl font-semibold mt-4">Job live!</h1>
        <p className="text-ink-400 mt-2 text-sm">Your job is now live on the platform.</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate('/employer/dashboard')} className="btn-primary">Go to dashboard</button>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/candidate/jobs/${job.id}`)}
            className="btn-outline"
          >
            Copy shareable link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">Post a job</h1>
      <div className="flex gap-2 mb-8 mt-4">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-signal' : 'bg-ink-100'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Job details</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, job_type: 'job' })} className={`flex-1 py-2 rounded-lg text-sm border ${form.job_type === 'job' ? 'bg-ink text-white border-ink' : 'border-ink-100'}`}>Job</button>
            <button type="button" onClick={() => setForm({ ...form, job_type: 'internship' })} className={`flex-1 py-2 rounded-lg text-sm border ${form.job_type === 'internship' ? 'bg-ink text-white border-ink' : 'border-ink-100'}`}>Internship</button>
          </div>
          <div>
            <label className="label">Job title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-ink-600">
              <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} /> Remote
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="number" placeholder="Salary min" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
            <input className="input" type="number" placeholder="Salary max" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
          </div>
          <input className="input" placeholder="Key skills (comma-separated)" value={form.key_skills} onChange={(e) => setForm({ ...form, key_skills: e.target.value })} />
          <button onClick={handleCreateOrUpdateDetails} className="btn-signal w-full" disabled={!form.title}>Continue</button>
        </div>
      )}

      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Screening questions (optional)</h2>
          <p className="text-sm text-ink-400">Add questions to better assess candidates.</p>
          {questions.map((q, i) => (
            <input key={i} className="input" placeholder={`Question ${i + 1}`} value={q.question}
              onChange={(e) => { const arr = [...questions]; arr[i].question = e.target.value; setQuestions(arr); }} />
          ))}
          <button type="button" onClick={addQuestion} className="text-sm text-signal-600 font-medium">+ Add question</button>
          <button onClick={saveQuestionsAndContinue} className="btn-signal w-full">Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Preferences</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Experience required (years)" value={prefs.experience_required} onChange={(e) => setPrefs({ ...prefs, experience_required: e.target.value })} />
            <input className="input" placeholder="Notice period" value={prefs.notice_period} onChange={(e) => setPrefs({ ...prefs, notice_period: e.target.value })} />
            <input className="input" placeholder="Education required" value={prefs.education_required} onChange={(e) => setPrefs({ ...prefs, education_required: e.target.value })} />
            <input className="input" placeholder="Languages (comma-separated)" value={prefs.languages} onChange={(e) => setPrefs({ ...prefs, languages: e.target.value })} />
          </div>
          <button onClick={savePreferencesAndContinue} className="btn-signal w-full">Continue</button>
        </div>
      )}

      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Preview</h2>
          <div className="border border-ink-50 rounded-lg p-4">
            <h3 className="font-display text-xl font-semibold">{form.title}</h3>
            <p className="text-sm text-ink-400">{form.location || 'Remote'} · {form.job_type}</p>
            <p className="text-sm mt-2 whitespace-pre-line">{form.description}</p>
          </div>
          <button onClick={handlePublish} className="btn-signal w-full" disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish job'}
          </button>
        </div>
      )}
    </div>
  );
}
