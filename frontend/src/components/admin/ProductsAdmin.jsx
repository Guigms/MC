import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api, errMsg, fmtMoney } from "@/lib/api";
import { resizeImage } from "@/components/admin/ClubSettings";

const EMPTY = { name: "", description: "", image_url: "", price: "", sizes: "P, M, G, GG", deadline: "", active: true };

const ProductDialog = ({ open, onClose, initial, onSaved }) => {
  const [f, setF] = useState(EMPTY);
  useEffect(() => {
    setF(initial ? { ...EMPTY, ...initial, sizes: (initial.sizes || []).join(", ") } : EMPTY);
  }, [initial, open]);

  const save = async (e) => {
    e.preventDefault();
    const body = { ...f, price: Number(f.price || 0), sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean) };
    delete body.id; delete body.created_at; delete body.my_response;
    try {
      if (initial) await api.put(`/products/${initial.id}`, body);
      else await api.post("/products", body);
      toast.success(initial ? "Produto atualizado" : "Produto publicado para os membros");
      onSaved(); onClose();
    } catch (err) { toast.error(errMsg(err)); }
  };

  const onImg = async (e) => {
    const file = e.target.files?.[0];
    if (file) setF({ ...f, image_url: await resizeImage(file, 900, "image/jpeg") });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-[#12141c] border-white/10 max-h-[90vh] overflow-y-auto" data-testid="product-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{initial ? "Editar" : "Novo"} produto</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5"><Label>Nome *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="bg-black/30" data-testid="product-form-name" /></div>
          <div className="space-y-1.5"><Label>Preço (R$)</Label>
            <Input type="number" min="0" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className="bg-black/30" data-testid="product-form-price" /></div>
          <div className="space-y-1.5"><Label>Prazo para responder</Label>
            <Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} className="bg-black/30" data-testid="product-form-deadline" /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Tamanhos (separados por vírgula, deixe vazio se for tamanho único)</Label>
            <Input value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} className="bg-black/30" data-testid="product-form-sizes" /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Descrição</Label>
            <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="bg-black/30" data-testid="product-form-description" /></div>
          <div className="sm:col-span-2 flex items-center gap-4">
            {f.image_url && <img src={f.image_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-white/10" />}
            <label className="btn-ghost-metal cursor-pointer flex items-center gap-2 px-4 py-2 text-sm" data-testid="product-form-image-label">
              <Upload size={15} /> {f.image_url ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/*" onChange={onImg} className="hidden" data-testid="product-form-image" />
            </label>
          </div>
          <div className="flex items-center gap-3"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} data-testid="product-form-active" /><Label>Visível para membros</Label></div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost-metal px-6 py-2 text-sm" data-testid="product-form-cancel">Cancelar</button>
            <button className="btn-rev px-6 py-2 text-sm" data-testid="product-form-submit">Salvar</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResponsesDialog = ({ product, onClose }) => {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (product) api.get(`/products/${product.id}/responses`).then((r) => setD(r.data));
    else setD(null);
  }, [product]);
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-[#12141c] border-white/10 max-h-[90vh] overflow-y-auto" data-testid="product-responses-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{product?.name}: respostas</DialogTitle></DialogHeader>
        {d && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[["Querem", d.yes, "text-green-400"], ["Não querem", d.no, "text-red-400"], ["Unidades", d.total, "text-brand"]].map(([l, v, c]) => (
                <div key={l} className="card-metal p-4 text-center"><div className={`font-display text-4xl font-black ${c}`} data-testid={`product-responses-${l}`}>{v}</div><div className="font-mono-x text-[10px] uppercase tracking-widest text-zinc-500">{l}</div></div>
              ))}
            </div>
            {Object.keys(d.by_size).length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="product-responses-by-size">
                {Object.entries(d.by_size).map(([s, q]) => <span key={s} className="bg-brand/15 text-brand rounded-full px-3 py-1 text-sm font-semibold">{s}: {q}</span>)}
              </div>
            )}
            <table className="w-full text-sm">
              <thead><tr className="text-left text-zinc-500 border-b border-white/10">{["Membro", "Resposta", "Tamanho", "Qtd"].map((h) => <th key={h} className="p-2 font-mono-x text-[10px] uppercase tracking-widest">{h}</th>)}</tr></thead>
              <tbody>
                {d.items.map((i) => (
                  <tr key={i.email} className="border-b border-white/5">
                    <td className="p-2">{i.name}</td>
                    <td className={`p-2 ${i.want ? "text-green-400" : "text-red-400"}`}>{i.want ? "Quero" : "Não quero"}</td>
                    <td className="p-2">{i.size || "—"}</td><td className="p-2">{i.quantity || "—"}</td>
                  </tr>
                ))}
                {d.items.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-zinc-500">Ninguém respondeu ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const ProductsAdmin = () => {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);
  const [resp, setResp] = useState(null);
  const load = () => api.get("/products").then((r) => setList(r.data));
  useEffect(() => {
    load();
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Excluir "${p.name}" e todas as respostas?`)) return;
    try { await api.delete(`/products/${p.id}`); toast.success("Produto excluído"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-5" data-testid="admin-products">
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-zinc-400">Publique blusas, patches e acessórios para os membros dizerem se querem.</p>
        <button onClick={() => { setEdit(null); setOpen(true); }} className="btn-rev px-5 py-2 text-sm flex items-center gap-2 whitespace-nowrap" data-testid="products-add-button"><Plus size={16} /> Novo produto</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.length === 0 && <p className="text-zinc-500 text-sm" data-testid="products-empty">Nenhum produto cadastrado.</p>}
        {list.map((p) => (
          <div key={p.id} className="card-metal hoverable overflow-hidden flex flex-col" data-testid={`admin-product-${p.id}`}>
            <div className="aspect-[4/3] bg-black/40 relative">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
              {!p.active && <span className="absolute top-3 left-3 text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">Oculto</span>}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-display text-xl font-bold uppercase">{p.name}</h3>
              <div className="text-brand font-semibold">{fmtMoney(p.price)}</div>
              <div className="text-xs text-zinc-500 mt-1">{p.sizes?.length ? `Tamanhos: ${p.sizes.join(", ")}` : "Tamanho único"}{p.deadline ? ` · até ${new Date(p.deadline + "T12:00").toLocaleDateString("pt-BR")}` : ""}</div>
              <div className="mt-auto pt-4 flex items-center gap-2">
                <button onClick={() => setResp(p)} className="btn-ghost-metal px-4 py-1.5 text-xs flex items-center gap-1.5 flex-1 justify-center" data-testid={`admin-product-responses-${p.id}`}><ClipboardList size={14} /> Ver respostas</button>
                <button onClick={() => { setEdit(p); setOpen(true); }} className="p-2 text-zinc-400 hover:text-white transition-colors" data-testid={`admin-product-edit-${p.id}`}><Pencil size={16} /></button>
                <button onClick={() => remove(p)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" data-testid={`admin-product-delete-${p.id}`}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ProductDialog open={open} onClose={() => setOpen(false)} initial={edit} onSaved={load} />
      <ResponsesDialog product={resp} onClose={() => setResp(null)} />
    </div>
  );
};
