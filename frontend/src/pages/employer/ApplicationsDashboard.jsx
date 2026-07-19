import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

const STAGES = ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'hired'];

export default function ApplicationsDashboard() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState([]);
  const [stageFilter, setStageFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.set('stage', stageFilter);
      if (minScore) params.set('min_score', minScore);
      params.set('sort', 'score');
      const { applications } = await api.get(`/applications/job/${jobId}?${params.toString()}`);
      setApplications(applications);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [stageFilter, minScore]); // eslint-disable-line

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function bulkMove(stage) {
    if (selected.length === 0) return;
    await api.post('/applications/bulk-stage', { application_ids: selected, stage });
    setSelected([]);
    load();
  }

  async function moveStage(id, stage) {
    await api.patch(`/applications/${id}/stage`, { stage });
    load();
  }

  async function openCandidate(app) {
    setExpanded(app.id === expanded ? null : app.id);
    setNotes(app.recruiter_notes || '');
    if (app.id !== expanded) {
      const { messages } = await api.get(`/applications/${app.id}/messages`);
      setMessages(messages);
    }
  }

  async function saveEvaluation(id) {
    await api.patch(`/applications/${id}/evaluate`, { recruiter_notes: notes });
    load();
  }

  async function sendMessage(id) {
    if (!messageBody.trim()) return;
    await api.post(`/applications/${id}/messages`, { body: messageBody });
    const { messages } = await api.get(`/applications/${id}/messages`);
    setMessages(messages);
    setMessageBody('');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">Applications</h1>
      <p className="text-ink-400 text-sm mb-6">Filter, score, and move candidates through your pipeline.</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="input w-44" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input className="input w-40" type="number" placeholder="Min AI score" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        {selected.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <span className="text-sm text-ink-400 self-center">{selected.length} selected</span>
            <button onClick={() => bulkMove('shortlisted')} className="btn-outline text-sm py-1.5 px-3">Shortlist</button>
            <button onClick={() => bulkMove('rejected')} className="btn-outline text-sm py-1.5 px-3">Reject</button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-ink-400">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-ink-400">No applications match these filters.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="card p-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggleSelect(app.id)} />
                <div className="flex-1 cursor-pointer" onClick={() => openCandidate(app)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{app.profiles?.full_name || 'Candidate'}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      app.ai_score >= 75 ? 'bg-moss-50 text-moss' : app.ai_score >= 50 ? 'bg-signal-50 text-signal-600' : 'bg-red-50 text-red-500'
                    }`}>
                      Fit: {app.ai_score}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ink-50 text-ink-400 capitalize">{app.stage.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-ink-400">{app.profiles?.location} · {(app.profiles?.skills || []).slice(0, 5).join(', ')}</p>
                </div>
                <select
                  className="input w-auto text-sm py-1.5"
                  value={app.stage}
                  onChange={(e) => moveStage(app.id, e.target.value)}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>

              {expanded === app.id && (
                <div className="mt-4 pt-4 border-t border-ink-50 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-ink-400 mb-2">Fit breakdown</h4>
                    <ul className="text-sm space-y-1 text-ink-600">
                      <li>Skills match: {app.ai_score_breakdown?.skills_match}/50</li>
                      <li>Experience match: {app.ai_score_breakdown?.experience_match}/30</li>
                      <li>Education match: {app.ai_score_breakdown?.education_match}/20</li>
                      <li className="text-ink-400 italic">{app.ai_score_breakdown?.notes}</li>
                    </ul>
                    <h4 className="text-xs font-semibold uppercase text-ink-400 mt-4 mb-2">Recruiter notes</h4>
                    <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <button onClick={() => saveEvaluation(app.id)} className="btn-outline text-sm py-1.5 px-3 mt-2">Save notes</button>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-ink-400 mb-2">Message candidate</h4>
                    <div className="border border-ink-50 rounded-lg p-3 h-32 overflow-y-auto text-sm space-y-2 bg-ink-50/40">
                      {messages.length === 0 ? <p className="text-ink-400">No messages yet.</p> : messages.map((m) => (
                        <p key={m.id}><strong>{m.sender_id === app.candidate_id ? 'Candidate' : 'You'}:</strong> {m.body}</p>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input className="input" placeholder="Type a message…" value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
                      <button onClick={() => sendMessage(app.id)} className="btn-primary text-sm py-1.5 px-3">Send</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
