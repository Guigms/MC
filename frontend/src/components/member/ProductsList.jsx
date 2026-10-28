import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg, fmtMoney } from "@/lib/api";

const ProductCard = ({ p, onSaved, i }) => {
  const r = p.my_response;
  const [size, setSize] = useState(r?.size || "");
  const [qty, setQty] = useState(r?.quantity || 1);
  const expired = p.deadline && p.deadline < new Date().toISOString().slice(0, 10);

  const send = async (want) => {
    if (want && p.sizes?.length && !size) { toast.error("Escolha um tamanho"); return; }
    try {
      await api.post(`/products/${p.id}/response`, { want, size: want ? size : "", quantity: want ? qty : 0 });
      toast.success(want ? `Anotado: ${qty}x ${p.name}${size ? ` (${size})` : ""}` : "Anotado: você não vai querer");
      onSaved();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card-metal hoverable overflow-hidden" data-testid={`product-card-${p.id}`}>
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="aspect-square sm:aspect-auto bg-black/40 flex items-center justify-center">
          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <ShoppingBag className="text-zinc-600" size={40} />}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-bold uppercase leading-tight">{p.name}</h3>
            <span className="text-brand font-semibold whitespace-nowrap">{fmtMoney(p.price)}</span>
          </div>
          {p.description && <p className="text-sm text-zinc-400 mt-1">{p.description}</p>}
          {p.deadline && <p className="text-xs text-zinc-500 mt-1">Responder até {new Date(p.deadline + "T12:00").toLocaleDateString("pt-BR")}</p>}
          {r && (
            <p className={`text-xs mt-2 font-semibold ${r.want ? "text-green-400" : "text-zinc-400"}`} data-testid={`product-my-response-${p.id}`}>
              Sua resposta: {r.want ? `Quero · ${r.quantity}x${r.size ? ` · ${r.size}` : ""}` : "Não quero"}
            </p>
          )}
          {expired ? <p className="text-xs text-red-400 mt-3">Prazo encerrado.</p> : (
            <div className="mt-4 space-y-3">
              {p.sizes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} data-testid={`product-size-${p.id}-${s}`}
                      className={`min-w-10 px-3 py-1 text-xs ${size === s ? "btn-rev" : "btn-ghost-metal"}`}>{s}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-white/15">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-zinc-300 hover:text-white" data-testid={`product-qty-minus-${p.id}`}><Minus size={14} /></button>
                  <span className="w-8 text-center font-display text-lg font-bold" data-testid={`product-qty-${p.id}`}>{qty}</span>
                  <button onClick={() => setQty(Math.min(50, qty + 1))} className="p-2 text-zinc-300 hover:text-white" data-testid={`product-qty-plus-${p.id}`}><Plus size={14} /></button>
                </div>
                <button onClick={() => send(true)} className="btn-rev px-5 py-2 text-xs" data-testid={`product-want-${p.id}`}>Quero</button>
                <button onClick={() => send(false)} className="btn-ghost-metal px-5 py-2 text-xs" data-testid={`product-dont-want-${p.id}`}>Não quero</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ProductsList = () => {
  const [list, setList] = useState(null);
  const load = () => api.get("/products").then((r) => setList(r.data.filter((p) => p.active)));
  useEffect(() => {
    load();
  }, []);
  if (!list) return null;
  return (
    <div className="space-y-4" data-testid="member-products-list">
      {list.length === 0 && <p className="text-zinc-500 text-sm" data-testid="member-products-empty">Nenhum produto do club disponível no momento.</p>}
      {list.map((p, i) => <ProductCard key={p.id} p={p} onSaved={load} i={i} />)}
    </div>
  );
};
