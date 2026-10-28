export const WheelLoader = ({ label = "Aquecendo o motor..." }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4" data-testid="wheel-loader">
    <svg viewBox="0 0 64 64" width="64" height="64" className="wheel-spin">
      <circle cx="32" cy="32" r="28" fill="none" stroke="#2a2d38" strokeWidth="7" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="var(--club-primary)" strokeWidth="2" strokeDasharray="6 6" />
      {[0, 45, 90, 135].map((a) => (
        <line key={a} x1="32" y1="8" x2="32" y2="56" stroke="#9ca3af" strokeWidth="1.2" transform={`rotate(${a} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="6" fill="var(--club-primary)" />
    </svg>
    <span className="font-mono-x text-xs uppercase tracking-[0.25em] text-zinc-400">{label}</span>
  </div>
);
