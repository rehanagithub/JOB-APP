import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function CandidateProfile() {
  const { profile, reloadProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: '', location: '', skills: '', resume_url: '',
    education: [{ school: '', degree: '', year: '' }],
    experience: [],
    preferences: { role: '', location: '', salary: '', internship_type: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        location: profile.location || '',
        skills: (profile.skills || []).join(', '),
        resume_url: profile.resume_url || '',
        education: profile.education?.length ? profile.education : [{ school: '', degree: '', year: '' }],
        experience: profile.experience || [],
        preferences: profile.preferences || { role: '', location: '', salary: '', internship_type: '' },
      });
    }
  }, [profile]);

  function updateEducation(i, key, value) {
    const edu = [...form.education];
    edu[i] = { ...edu[i], [key]: value };
    setForm({ ...form, education: edu });
  }

  function addExperience() {
    setForm({ ...form, experience: [...form.experience, { company: '', title: '', years: '' }] });
  }
  function updateExperience(i, key, value) {
    const exp = [...form.experience];
    exp[i] = { ...exp[i], [key]: value };
    setForm({ ...form, experience: exp });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/profiles/me', {
        full_name: form.full_name,
        location: form.location,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        resume_url: form.resume_url,
        education: form.education,
        experience: form.experience,
        preferences: form.preferences,
      });
      await reloadProfile();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-semibold text-ink">Your profile</h1>
        {profile && (
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-moss-50 text-moss">
            {profile.profile_complete_pct}% complete
          </span>
        )}
      </div>
      <p className="text-ink-400 text-sm mb-8">Better matches and recommendations come from a complete profile.</p>

      <form onSubmit={handleSave} className="space-y-8">
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">1</span>Basic information</h2>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">2</span>Education</h2>
          {form.education.map((edu, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input className="input" placeholder="School / College" value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} />
              <input className="input" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
              <input className="input" placeholder="Year" value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} />
            </div>
          ))}
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">3</span>Experience</h2>
            <button type="button" onClick={addExperience} className="text-sm text-signal-600 font-medium">+ Add</button>
          </div>
          {form.experience.length === 0 && <p className="text-sm text-ink-400">No experience added — that's fine for internships/entry-level roles.</p>}
          {form.experience.map((exp, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input className="input" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
              <input className="input" placeholder="Title" value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} />
              <input className="input" type="number" placeholder="Years" value={exp.years} onChange={(e) => updateExperience(i, 'years', e.target.value)} />
            </div>
          ))}
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">4</span>Skills</h2>
          <input className="input" placeholder="e.g. React, Python, SQL (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">5</span>Resume</h2>
          <input className="input" placeholder="Link to your resume (PDF URL)" value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} />
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2"><span className="stage-num">6</span>Preferences</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Preferred role" value={form.preferences.role} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, role: e.target.value } })} />
            <input className="input" placeholder="Preferred location" value={form.preferences.location} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, location: e.target.value } })} />
            <input className="input" placeholder="Expected salary" value={form.preferences.salary} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, salary: e.target.value } })} />
            <select className="input" value={form.preferences.internship_type} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, internship_type: e.target.value } })}>
              <option value="">Job or internship?</option>
              <option value="job">Full-time job</option>
              <option value="internship">Internship</option>
              <option value="both">Both</option>
            </select>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button className="btn-signal" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
          {saved && <span className="text-sm text-moss font-medium">Saved — get better matches now.</span>}
        </div>
      </form>
    </div>
  );
}
