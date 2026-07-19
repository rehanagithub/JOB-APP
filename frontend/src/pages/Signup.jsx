import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'employer' ? 'employer' : 'candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({ email, password, fullName, role });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="stage-num mx-auto">✓</div>
        <h1 className="font-display text-2xl font-semibold mt-4">Verify your email</h1>
        <p className="text-ink-400 mt-2 text-sm">
          We sent a confirmation link to <strong>{email}</strong>. Verify it, then log in to continue.
        </p>
        <Link to="/login" className="btn-primary inline-block mt-6">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">Create your account</h1>
      <p className="text-ink-400 text-sm mt-1">Step 1 of getting set up.</p>

      <div className="flex gap-2 mt-6 mb-6">
        <button
          type="button"
          onClick={() => setRole('candidate')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            role === 'candidate' ? 'bg-ink text-white border-ink' : 'border-ink-100 text-ink-600'
          }`}
        >
          I'm a candidate
        </button>
        <button
          type="button"
          onClick={() => setRole('employer')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${
            role === 'employer' ? 'bg-ink text-white border-ink' : 'border-ink-100 text-ink-600'
          }`}
        >
          I'm an employer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn-signal w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-ink-400 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-ink font-medium">Log in</Link>
      </p>
    </div>
  );
}
