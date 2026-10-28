import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg } from "@/lib/api";

const EMPTY = { name: "", email: "", password: "", role: "member", nickname: "", phone: "", motorcycle: "", blood_type: "", birth_date: "", active: true };
const TEXT = [["name", "Nome *"], ["email", "E-mail *", "email"], ["nickname", "Apelido"], ["phone", "Telefone"], ["motorcycle", "Moto"], ["blood_type", "Tipo sanguíneo"], ["birth_date", "Nascimento", "date"]];

const MemberDialog = ({ open, onClose, initial, onSaved }) => {
  const [f, setF] = useState(EMPTY);
  useEffect(() => {
    setF(initial ? { ...EMPTY, ...initial, password: "" } : EMPTY);
  }, [initial, open]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (initial) await api.put(`/members/${initial.id}`, f);
      else await api.post("/members", f);
      toast.success(initial ? "Membro atualizado" : "Membro cadastrado");
      onSaved();
      onClose();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-[#12141c] border-white/10 max-h-[90vh] overflow-y-auto" data-testid="member-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{initial ? "Editar membro" : "Novo membro"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          {TEXT.map(([k, l, t]) => (
            <div key={k} className="space-y-1.5"><Label>{l}</Label>
              <Input type={t || "text"} required={l.includes("*")} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="bg-black/30" data-testid={`member-form-${k}`} /></div>
          ))}
          <div className="space-y-1.5"><Label>{initial ? "Nova senha (opcional)" : "Senha *"}</Label>
            <Input type="text" required={!initial} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="bg-black/30" data-testid="member-form-password" /></div>
          <div className="space-y-1.5"><Label>Perfil de acesso</Label>
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
              <SelectTrigger className="bg-black/30" data-testid="member-form-role"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="member">Membro</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent>
            </Select></div>
          <div className="flex items-center gap-3 pt-6"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} data-testid="member-form-active" /><Label>Conta ativa</Label></div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost-metal px-6 py-2 text-sm" data-testid="member-form-cancel">Cancelar</button>
            <button className="btn-rev px-6 py-2 text-sm" data-testid="member-form-submit">Salvar</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const MembersAdmin = () => {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [q, setQ] = useState("");
  const load = () => api.get("/members").then((r) => setList(r.data));
  useEffect(() => {
    load();
  }, []);

  const remove = async () => {
    try { await api.delete(`/members/${del.id}`); toast.success("Membro excluído"); load(); } catch (e) { toast.error(errMsg(e)); }
    setDel(null);
  };

  const shown = list.filter((m) => `${m.name} ${m.email} ${m.nickname}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5" data-testid="admin-members">
      <div className="flex flex-wrap gap-3 justify-between">
        <Input placeholder="Buscar por nome, e-mail ou apelido..." value={q} onChange={(e) => setQ(e.target.value)} className="w-72 bg-black/30" data-testid="members-search-input" />
        <button onClick={() => { setEdit(null); setOpen(true); }} className="btn-rev px-5 py-2 text-sm flex items-center gap-2" data-testid="members-add-button"><Plus size={16} /> Novo membro</button>
      </div>
      <div className="card-metal overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="border-b border-white/10 text-zinc-400 text-left">
            {["Nome", "Contato", "Moto", "Perfil", "Status", ""].map((h) => <th key={h} className="p-3 font-mono-x text-[10px] uppercase tracking-widest">{h}</th>)}
          </tr></thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`member-row-${m.id}`}>
                <td className="p-3"><div className="font-medium">{m.name}</div>{m.nickname && <div className="text-xs text-brand">"{m.nickname}"</div>}</td>
                <td className="p-3 text-zinc-400"><div>{m.email}</div><div className="text-xs">{m.phone}</div></td>
                <td className="p-3 text-zinc-300">{m.motorcycle || "—"}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-brand/20 text-brand" : "bg-white/10 text-zinc-300"}`}>{m.role === "admin" ? "Admin" : "Membro"}</span></td>
                <td className="p-3"><span className={`text-xs ${m.active ? "text-green-400" : "text-zinc-500"}`}>{m.active ? "Ativo" : "Inativo"}</span></td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEdit(m); setOpen(true); }} className="p-2 text-zinc-400 hover:text-white transition-colors" data-testid={`member-edit-${m.id}`}><Pencil size={16} /></button>
                  <button onClick={() => setDel(m)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" data-testid={`member-delete-${m.id}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MemberDialog open={open} onClose={() => setOpen(false)} initial={edit} onSaved={load} />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent className="bg-[#12141c] border-white/10">
          <AlertDialogHeader><AlertDialogTitle>Excluir {del?.name}?</AlertDialogTitle>
            <AlertDialogDescription>O histórico de mensalidades deste membro também será apagado. Para manter o histórico, apenas desative a conta.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel data-testid="member-delete-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700" data-testid="member-delete-confirm">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
