import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { api, dateParts, errMsg, fmtDate } from "@/lib/api";

const TypeBadge = ({ type }) => (
  <span className={`font-mono-x text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${type === "encontro" ? "border-sky-400/40 text-sky-300" : "border-brand-50 text-brand"}`}>{type}</span>
);

export const EventCard = ({ ev, onRsvp, i = 0 }) => {
  const d = dateParts(ev.date);
  const past = new Date(ev.date) < new Date();
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
      className={`card-metal hoverable p-5 flex gap-5 ${past ? "opacity-60" : ""}`} data-testid={`event-card-${ev.id}`}>
      <div className="shrink-0 w-16 text-center rounded-lg bg-brand/15 border border-brand-30 py-2">
        <div className="font-display text-3xl font-black leading-none">{d.day}</div>
        <div className="font-mono-x text-[10px] uppercase tracking-widest text-brand">{d.month}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2"><TypeBadge type={ev.type} />{past && <span className="text-[10px] uppercase text-zinc-500 font-mono-x">encerrado</span>}</div>
        <h3 className="font-display text-xl font-bold uppercase mt-1.5 leading-tight">{ev.title}</h3>
        <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>{fmtDate(ev.date)}</span>
          {ev.location && <span className="flex items-center gap-1"><MapPin size={12} />{ev.location}</span>}
          <span className="flex items-center gap-1"><Users size={12} />{ev.rsvp_count} confirmados</span>
        </div>
        {ev.description && <p className="text-sm text-zinc-300 mt-2 line-clamp-3">{ev.description}</p>}
        {onRsvp && !past && (
          <button onClick={() => onRsvp(ev)} data-testid={`event-rsvp-button-${ev.id}`}
            className={`mt-3 px-4 py-1.5 text-xs flex items-center gap-1.5 ${ev.going ? "btn-rev" : "btn-ghost-metal"}`}>
            {ev.going ? <><Check size={14} /> Vou!</> : "Confirmar presença"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const EventsList = () => {
  const [events, setEvents] = useState([]);
  const load = () => api.get("/events").then((r) => setEvents(r.data));

  useEffect(() => {
    load();
  }, []);

  const rsvp = async (ev) => {
    try {
      const { data } = await api.post(`/events/${ev.id}/rsvp`);
      toast.success(data.going ? "Presença confirmada. Nos vemos na estrada!" : "Presença cancelada");
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();

  return (
    <div className="space-y-4" data-testid="member-events-list">
      {upcoming.length === 0 && <p className="text-zinc-500 text-sm" data-testid="no-events">Nenhum evento agendado ainda.</p>}
      {upcoming.map((ev, i) => <EventCard key={ev.id} ev={ev} onRsvp={rsvp} i={i} />)}
      {past.length > 0 && <h4 className="font-mono-x text-xs uppercase tracking-[0.25em] text-zinc-500 pt-4">Já rodamos</h4>}
      {past.slice(0, 5).map((ev) => <EventCard key={ev.id} ev={ev} />)}
    </div>
  );
};
