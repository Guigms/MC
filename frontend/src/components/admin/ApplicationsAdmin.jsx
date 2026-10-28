import { useEffect, useState } from "react";
import { Check, X, Trash2, Copy, Instagram, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { STYLES } from "@/pages/Join";

const STATUS = { pending: ["Em análise", "bg-amber-500/15 text-amber-300"], approved: ["Aprovada", "bg-green-500/15 text-green-400"], rejected: ["Recusada", "bg-red-500/15 text-red-400"] };
const yn = (v) => (v ? "Sim" : "Não");

const Row = ({ k, v }) => (
  <div><div className="font-mono-x text-[10px] uppercase tracking-widest text-zinc-500">{k}</div><div className="text-sm text-white break-words">{v || "—"}</div></div>
);

const Detail = ({ a, onClose, onDone }) => {
  const [note, setNote] = useState("");
  const [cred, setCred] = useState(null);
  useEffect(() => {
    setNote(""); setCred(null);
  }, [a]);
  if (!a) return null;

  const approve = async () => {
    try { const { data } = await api.post(`/applications/${a.id}/approve`); setCred(data); toast.success("Inscrição aprovada e conta criada"); onDone(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const reject = async () => {
    try { await api.post(`/applications/${a.id}/reject`, { note }); toast.success("Inscrição recusada"); onDone(); onClose(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const copy = () => { navigator.clipboard?.writeText(`Login: ${cred.email}\nSenha provisória: ${cred.temp_password}`); toast.success("Copiado"); };
  const styles = (a.styles || []).map((s) => STYLES.find(([v]) => v === s)?.[1]).join(", ");

  return (
    <Dialog open={!!a} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-[#12141c] border-white/10 max-h-[90vh] overflow-y-auto" data-testid="application-dialog">
        <DialogHeader><DialogTitle className="font-display text-3xl uppercase">{a.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Row k="E-mail" v={a.email} /><Row k="WhatsApp" v={a.whatsapp} /><Row k="Instagram" v={a.instagram} />
          <Row k="Idade" v={a.age} /><Row k="Altura" v={a.height} /><Row k="Cidade" v={a.city} />
          <Row k="Profissão" v={a.profession} /><Row k="Moto própria" v={yn(a.has_motorcycle)} /><Row k="Modelo" v={a.motorcycle_model} />
          <Row k="Pilota há" v={a.riding_since} /><Row k="Frequência" v={a.frequency} /><Row k="Outro grupo" v={yn(a.other_group)} />
          <Row k="Prefere" v={styles} /><Row k="Participa de eventos" v={yn(a.commit_events)} /><Row k="CNH A válida" v={yn(a.has_cnh_a)} />
        </div>
        <div className="card-metal p-4 mt-2"><div className="font-mono-x text-[10px] uppercase tracking-widest text-brand mb-1">Por que quer entrar</div><p className="text-sm text-zinc-200 whitespace-pre-line" data-testid="application-reason">{a.reason}</p></div>
        {a.note && <p className="text-sm text-zinc-400">Observação: {a.note}</p>}
        {cred && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4" data-testid="application-credentials">
            <p className="text-sm text-green-300 font-semibold">Conta criada! Envie estes dados para a nova membro:</p>
            <p className="font-mono-x text-sm mt-2">Login: {cred.email}</p>
            <p className="font-mono-x text-sm">Senha provisória: <b data-testid="application-temp-password">{cred.temp_password}</b></p>
            <button onClick={copy} className="btn-ghost-metal px-4 py-1.5 text-xs mt-3 flex items-center gap-2" data-testid="application-copy-credentials"><Copy size={13} /> Copiar</button>
          </div>
        )}
        {a.status === "pending" && !cred && (
          <div className="space-y-3">
            <Textarea placeholder="Observação (opcional, para recusa)" value={note} onChange={(e) => setNote(e.target.value)} className="bg-black/30" data-testid="application-note" />
            <div className="flex flex-wrap gap-3 justify-end">
              <button onClick={reject} className="btn-ghost-metal px-6 py-2 text-sm flex items-center gap-2 hover:!text-red-400 hover:!border-red-400" data-testid="application-reject-button"><X size={15} /> Recusar</button>
              <button onClick={approve} className="btn-rev px-6 py-2 text-sm flex items-center gap-2" data-testid="application-approve-button"><Check size={15} /> Aprovar e criar conta</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const ApplicationsAdmin = () => {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [open, setOpen] = useState(null);
  const load = () => api.get("/applications").then((r) => setList(r.data));
  useEffect(() => {
    load();
  }, []);

  const remove = async (a) => {
    if (!window.confirm(`Excluir a inscrição de ${a.name}?`)) return;
    try { await api.delete(`/applications/${a.id}`); toast.success("Inscrição excluída"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  const shown = list.filter((a) => filter === "all" || a.status === filter);
  const count = (s) => list.filter((a) => a.status === s).length;

  return (
    <div className="space-y-5" data-testid="admin-applications">
      <div className="flex flex-wrap gap-2">
        {[["pending", `Em análise (${count("pending")})`], ["approved", `Aprovadas (${count("approved")})`], ["rejected", `Recusadas (${count("rejected")})`], ["all", "Todas"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-1.5 text-xs ${filter === v ? "btn-rev" : "btn-ghost-metal"}`} data-testid={`applications-filter-${v}`}>{l}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {shown.length === 0 && <p className="text-zinc-500 text-sm" data-testid="applications-empty">Nenhuma inscrição aqui.</p>}
        {shown.map((a) => {
          const [label, cls] = STATUS[a.status];
          return (
            <div key={a.id} className="card-metal hoverable p-5 cursor-pointer" onClick={() => setOpen(a)} data-testid={`application-card-${a.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-bold uppercase leading-tight truncate">{a.name}</h3>
                  <p className="text-xs text-zinc-400">{a.city} · {a.age ? `${a.age} anos` : "idade n/i"} · {a.motorcycle_model || "sem moto informada"}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
              </div>
              <p className="text-sm text-zinc-300 mt-3 line-clamp-2">{a.reason}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <span className="flex gap-3">
                  <span className="flex items-center gap-1"><MessageCircle size={12} />{a.whatsapp}</span>
                  {a.instagram && <span className="flex items-center gap-1"><Instagram size={12} />{a.instagram}</span>}
                </span>
                <button onClick={(e) => { e.stopPropagation(); remove(a); }} className="p-1.5 hover:text-red-400 transition-colors" data-testid={`application-delete-${a.id}`}><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <Detail a={open} onClose={() => setOpen(null)} onDone={load} />
    </div>
  );
};
