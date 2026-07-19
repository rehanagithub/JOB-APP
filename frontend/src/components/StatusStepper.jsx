const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
];

export default function StatusStepper({ stage }) {
  if (stage === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-500">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Not selected this time
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="flex items-center w-full overflow-x-auto py-1">
      {STAGES.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 min-w-[80px]">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className={`w-3 h-3 rounded-full ${
                i <= currentIdx ? 'bg-moss' : 'bg-ink-100'
              }`}
            />
            <span
              className={`text-[11px] whitespace-nowrap ${
                i <= currentIdx ? 'text-ink font-medium' : 'text-ink-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 ${i < currentIdx ? 'bg-moss' : 'bg-ink-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
