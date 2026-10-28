import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, dateParts, errMsg, fmtDate } from "@/lib/api";

const EMPTY = { title: "", type: "evento", date: "", location: "", description: "", image_url: "" };

const EventDialog = ({ open, onClose, initial, onSaved }) => {
  const [f, setF] = useState(EMPTY);
  useEffect(() => {
    setF(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [initial, open]);

  const save = async (e) => {
    e.preventDefault();
    const body = { title: f.title, type: f.type, date: f.date, location: f.location, description: f.description, image_url: f.image_url };
    try {
      if (initial) await api.put(`/events/${initial.id}`, body);
      else await api.post("/events", body);
      toast.success(initial ? "Evento atualizado" : "Evento criado");
      onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-[#12141c] border-white/10" data-testid="event-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{initial ? "Editar" : "Novo"} evento / encontro</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5"><Label>Título *</Label>
            <Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="bg-black/30" data-testid="event-form-title" /></div>
          <div className="space-y-1.5"><Label>Tipo</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
              <SelectTrigger className="bg-black/30" data-testid="event-form-type"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="evento">Evento</SelectItem><SelectItem value="encontro">Encontro</SelectItem></SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Data e hora *</Label>
            <Input required type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="bg-black/30" data-testid="event-form-date" /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Local / ponto de encontro</Label>
            <Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className="bg-black/30" data-testid="event-form-location" /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Descrição / roteiro</Label>
            <Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="bg-black/30" data-testid="event-form-description" /></div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost-metal px-6 py-2 text-sm" data-testid="event-form-cancel">Cancelar</button>
            <button className="btn-rev px-6 py-2 text-sm" data-testid="event-form-submit">Salvar</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EventsAdmin = () => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState({});
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);
  const load = () => api.get("/events").then((r) => setEvents([...r.data].reverse()));

  useEffect(() => {
    load();
    api.get("/members").then((r) => setMembers(Object.fromEntries(r.data.map((m) => [m.id, m.nickname || m.name]))));
  }, []);

  const remove = async (ev) => {
    if (!window.confirm(`Excluir "${ev.title}"?`)) return;
    try { await api.delete(`/events/${ev.id}`); toast.success("Evento excluído"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-5" data-testid="admin-events">
      <div className="flex justify-between items-center">
        <p className="text-sm text-zinc-400">{events.length} eventos e encontros cadastrados</p>
        <button onClick={() => { setEdit(null); setOpen(true); }} className="btn-rev px-5 py-2 text-sm flex items-center gap-2" data-testid="events-add-button"><Plus size={16} /> Novo evento</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {events.map((ev) => {
          const d = dateParts(ev.date);
          return (
            <div key={ev.id} className="card-metal hoverable p-5 flex gap-4" data-testid={`admin-event-${ev.id}`}>
              <div className="shrink-0 w-14 text-center rounded-lg bg-brand/15 py-2 h-fit">
                <div className="font-display text-2xl font-black leading-none">{d.day}</div>
                <div className="font-mono-x text-[10px] uppercase text-brand">{d.month} {String(d.year).slice(2)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono-x text-[10px] uppercase tracking-widest text-brand">{ev.type}</span>
                <h3 className="font-display text-lg font-bold uppercase leading-tight">{ev.title}</h3>
                <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
                  <div>{fmtDate(ev.date)}</div>
                  {ev.location && <div className="flex items-center gap-1"><MapPin size={12} />{ev.location}</div>}
                  <div className="flex items-start gap-1"><Users size={12} className="mt-0.5" />{ev.rsvp_count} confirmados{ev.rsvps?.length ? `: ${ev.rsvps.map((id) => members[id]).filter(Boolean).join(", ")}` : ""}</div>
                  {ev.created_by && <div className="text-zinc-500">Criado por {ev.created_by}</div>}
                </div>
              </div>
              <div className="flex flex-col">
                <button onClick={() => { setEdit(ev); setOpen(true); }} className="p-2 text-zinc-400 hover:text-white transition-colors" data-testid={`admin-event-edit-${ev.id}`}><Pencil size={16} /></button>
                <button onClick={() => remove(ev)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" data-testid={`admin-event-delete-${ev.id}`}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <EventDialog open={open} onClose={() => setOpen(false)} initial={edit} onSaved={load} />
    </div>
  );
};
