import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <section className="py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-600 mb-4">
          Jobs & internships, matched by fit
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink leading-[1.05] max-w-3xl mx-auto">
          The bridge between talent and the right opportunity.
        </h1>
        <p className="mt-6 text-lg text-ink-400 max-w-xl mx-auto">
          Post a role in minutes, or find one worth applying to. Fit-scored, tracked end to end.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/signup?role=candidate" className="btn-signal">I'm looking for work</Link>
          <Link to="/signup?role=employer" className="btn-primary">I'm hiring</Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6 pb-24">
        <div className="card p-8">
          <span className="stage-num">C</span>
          <h2 className="font-display text-2xl font-semibold mt-4 mb-2">For candidates</h2>
          <p className="text-ink-400 text-sm leading-relaxed">
            Build a profile once, apply everywhere, and track every application from "Applied" to "Hired"
            in one place.
          </p>
        </div>
        <div className="card p-8">
          <span className="stage-num">E</span>
          <h2 className="font-display text-2xl font-semibold mt-4 mb-2">For employers</h2>
          <p className="text-ink-400 text-sm leading-relaxed">
            Post a job, get fit-scored candidates automatically ranked, and move the right people
            through your pipeline faster.
          </p>
        </div>
      </section>
    </div>
  );
}
