import { motion } from "framer-motion";

const R = 78;
const C = 2 * Math.PI * R;
const ARC = C * 0.75;

export const Speedometer = ({ value = 0, max = 100, label, display, testId, size = 180 }) => {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const angle = 135 + 270 * pct;
  const ticks = Array.from({ length: 11 }, (_, i) => 135 + i * 27);

  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10"
          strokeDasharray={`${ARC} ${C}`} transform="rotate(135 100 100)" strokeLinecap="round" />
        <motion.circle cx="100" cy="100" r={R} fill="none" stroke="var(--club-primary)" strokeWidth="10"
          strokeLinecap="round" transform="rotate(135 100 100)"
          initial={{ strokeDasharray: `0 ${C}` }}
          whileInView={{ strokeDasharray: `${ARC * pct} ${C}` }}
          viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 6px var(--club-glow))" }} />
        {ticks.map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const r1 = i % 5 === 0 ? 56 : 62;
          return (
            <line key={a} x1={100 + r1 * Math.cos(rad)} y1={100 + r1 * Math.sin(rad)}
              x2={100 + 67 * Math.cos(rad)} y2={100 + 67 * Math.sin(rad)}
              stroke={i % 5 === 0 ? "#fff" : "rgba(255,255,255,.35)"} strokeWidth={i % 5 === 0 ? 2.5 : 1.5} />
          );
        })}
        <motion.g initial={{ rotate: 135 }} whileInView={{ rotate: angle }} viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 40, damping: 9, delay: 0.2 }}
          style={{ originX: "100px", originY: "100px" }}>
          <line x1="100" y1="100" x2="158" y2="100" stroke="var(--club-accent)" strokeWidth="3.5" strokeLinecap="round" />
        </motion.g>
        <circle cx="100" cy="100" r="9" fill="#1a1d28" stroke="var(--club-primary)" strokeWidth="3" />
        <text x="100" y="150" textAnchor="middle" className="font-display" fontSize="30" fontWeight="800" fill="#fff">
          {display ?? value}
        </text>
      </svg>
      {label && <span className="-mt-3 text-[11px] font-mono-x uppercase tracking-[0.2em] text-zinc-400 text-center">{label}</span>}
    </div>
  );
};
