import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { api, errMsg, fmtMoney, MONTHS } from "@/lib/api";
import { useClub } from "@/context/ClubContext";

export const DuesMatrix = () => {
  const { club } = useClub();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const curMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;

  const load = useCallback(() => api.get(`/dues?year=${year}`).then((r) => setRows(r.data.rows)), [year]);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (row, m) => {
    const paid = !row.months[String(m)];
    setRows((rs) => rs.map((r) => (r.id !== row.id ? r : { ...r, months: paid ? { ...r.months, [m]: { amount: club.monthly_fee } } : Object.fromEntries(Object.entries(r.months).filter(([k]) => k !== String(m))) })));
    try {
      await api.post("/dues/toggle", { user_id: row.id, year, month: m, paid });
      toast.success(`${row.name}: ${MONTHS[m - 1]}/${year} ${paid ? "pago" : "pendente"}`);
    } catch (e) { toast.error(errMsg(e)); load(); }
  };

  const visible = rows
    .filter((r) => r.active)
    .filter((r) => r.name?.toLowerCase().includes(q.toLowerCase()) || r.email.includes(q.toLowerCase()))
    .filter((r) => !onlyPending || !r.months[String(curMonth)]);
  const totalPaid = rows.reduce((s, r) => s + Object.values(r.months).reduce((a, p) => a + (p.amount || 0), 0), 0);

  return (
    <div className="space-y-5" data-testid="admin-dues-matrix">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(year - 1)} className="btn-ghost-metal p-2" data-testid="dues-prev-year"><ChevronLeft size={16} /></button>
          <span className="font-display text-3xl font-black w-24 text-center" data-testid="dues-year">{year}</span>
          <button onClick={() => setYear(year + 1)} className="btn-ghost-metal p-2" data-testid="dues-next-year"><ChevronRight size={16} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar membro..." value={q} onChange={(e) => setQ(e.target.value)} className="w-56 bg-black/30" data-testid="dues-search-input" />
          <button onClick={() => setOnlyPending(!onlyPending)} className={`px-4 py-2 text-xs ${onlyPending ? "btn-rev" : "btn-ghost-metal"}`} data-testid="dues-filter-pending">
            Pendentes em {MONTHS[curMonth - 1]}
          </button>
          <span className="text-sm text-zinc-400">Total {year}: <b className="text-white" data-testid="dues-total">{fmtMoney(totalPaid)}</b></span>
        </div>
      </div>
      <div className="card-metal overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-white/10 text-zinc-400">
              <th className="text-left p-3 font-mono-x text-[10px] uppercase tracking-widest sticky left-0 bg-[#12141c]">Membro</th>
              {MONTHS.map((m) => <th key={m} className="p-2 font-mono-x text-[10px] uppercase tracking-widest">{m}</th>)}
              <th className="p-3 font-mono-x text-[10px] uppercase tracking-widest">Pagos</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`dues-row-${r.id}`}>
                <td className="p-3 sticky left-0 bg-[#12141c]"><div className="font-medium text-white">{r.name}</div><div className="text-xs text-zinc-500">{r.email}</div></td>
                {MONTHS.map((m, i) => {
                  const paid = !!r.months[String(i + 1)];
                  const late = !paid && i + 1 <= curMonth;
                  return (
                    <td key={m} className="p-1.5 text-center">
                      <button onClick={() => toggle(r, i + 1)} title={paid ? "Marcar como pendente" : "Marcar como pago"} data-testid={`dues-cell-${r.id}-${i + 1}`}
                        className={`dues-cell h-9 w-9 rounded-md inline-flex items-center justify-center border ${paid ? "bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_12px_rgba(34,197,94,.25)]" : late ? "bg-red-500/10 border-red-500/30 text-red-400" : "border-white/10 text-zinc-600"}`}>
                        {paid ? <Check size={15} /> : late ? <X size={14} /> : "·"}
                      </button>
                    </td>
                  );
                })}
                <td className="p-3 text-center font-display text-lg font-bold">{Object.keys(r.months).length}</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={14} className="p-6 text-center text-zinc-500">Nenhum membro encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Clique em um mês para alternar entre pago e pendente. Valor registrado: {fmtMoney(club.monthly_fee)} (configurável em Personalização).</p>
    </div>
  );
};
