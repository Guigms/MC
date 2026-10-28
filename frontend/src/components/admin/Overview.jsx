import { useEffect, useState } from "react";
import { api, fmtMoney, MONTHS } from "@/lib/api";
import { Speedometer } from "@/components/moto/Speedometer";
import { EventCard } from "@/components/member/EventsList";

export const Overview = () => {
  const [o, setO] = useState(null);
  useEffect(() => {
    api.get("/admin/overview").then((r) => setO(r.data));
  }, []);
  if (!o) return null;
  const pct = o.active_members ? Math.round((o.paid_this_month / o.active_members) * 100) : 0;
  return (
    <div className="space-y-8" data-testid="admin-overview">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-metal p-5 flex justify-center"><Speedometer value={pct} max={100} display={`${pct}%`} label={`Em dia · ${MONTHS[o.month - 1]}`} size={150} testId="overview-paid-gauge" /></div>
        <Stat label="Membros ativos" value={o.active_members} testId="overview-active-members" />
        <Stat label={`Pendentes em ${MONTHS[o.month - 1]}`} value={o.unpaid_this_month} danger testId="overview-unpaid" />
        <Stat label={`Arrecadado ${o.year}`} value={fmtMoney(o.revenue_year)} sub={`Mês: ${fmtMoney(o.revenue_month)}`} testId="overview-revenue" />
      </div>
      <div>
        <h3 className="font-display text-2xl font-black uppercase mb-4">Próximos rolês</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {o.upcoming.length === 0 && <p className="text-zinc-500 text-sm">Nenhum evento futuro.</p>}
          {o.upcoming.map((e) => <EventCard key={e.id} ev={{ ...e, rsvp_count: (e.rsvps || []).length }} />)}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub, danger, testId }) => (
  <div className="card-metal hoverable p-6 flex flex-col justify-between" data-testid={testId}>
    <span className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</span>
    <span className={`font-display text-5xl font-black mt-4 ${danger ? "text-red-400" : "text-white"}`}>{value}</span>
    {sub && <span className="text-xs text-zinc-400 mt-1">{sub}</span>}
  </div>
);
