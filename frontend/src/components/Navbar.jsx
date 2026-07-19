import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const dashboardPath = profile?.role === 'employer' ? '/employer/dashboard' : '/candidate/jobs';

  return (
    <nav className="border-b border-ink-50 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          Bridge<span className="text-signal">.</span>
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <Link to={dashboardPath} className="text-sm font-medium text-ink-600 hover:text-ink">
              Dashboard
            </Link>
            <span className="text-xs px-2 py-1 rounded-full bg-ink-50 text-ink-400 font-mono uppercase">
              {profile?.role}
            </span>
            <button onClick={handleSignOut} className="btn-outline text-sm py-1.5 px-3.5">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-600 hover:text-ink">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary text-sm py-1.5 px-3.5">
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
