const PRODUCTS = [
  { title: 'Courses', desc: 'Upskill with online courses.' },
  { title: 'Resume Builder', desc: 'Create a professional resume.' },
  { title: 'Mock Interviews', desc: 'Practice & improve your interview skills.' },
  { title: 'Career Guidance', desc: 'Get career advice from experts.' },
  { title: 'Refer & Earn', desc: 'Refer friends and earn rewards.' },
];

export default function ExploreProducts() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink mb-1">Grow your career</h1>
      <p className="text-ink-400 text-sm mb-8">More tools to help you land the right role.</p>
      <div className="grid sm:grid-cols-2 gap-5">
        {PRODUCTS.map((p) => (
          <div key={p.title} className="card p-5">
            <h3 className="font-semibold text-ink">{p.title}</h3>
            <p className="text-sm text-ink-400 mt-1">{p.desc}</p>
            <button className="text-sm text-signal-600 font-medium mt-3">Coming soon →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
