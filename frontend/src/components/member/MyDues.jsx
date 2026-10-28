import { useEffect, useState } from "react";
import { api, fmtMoney, MONTHS } from "@/lib/api";
import { useClub } from "@/context/ClubContext";
import { Speedometer } from "@/components/moto/Speedometer";

export const MyDues = () => {
  const { club } = useClub();
  const year = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  const [months, setMonths] = useState({});

  useEffect(() => {
    api.get(`/dues/me?year=${year}`).then((r) => setMonths(r.data.months));
  }, [year]);

  const paidCount = Object.keys(months).length;
  const currentPaid = !!months[String(curMonth)];

  return (
    <div className="card-metal p-6" data-testid="member-dues-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono-x text-[10px] uppercase tracking-[0.3em] text-zinc-500">Mensalidade {year}</div>
          <div className="font-display text-2xl font-black uppercase mt-1">{fmtMoney(club.monthly_fee)}<span className="text-sm text-zinc-500 font-medium normal-case"> /mês</span></div>
          <span data-testid="member-dues-current-status"
            className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full ${currentPaid ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            {MONTHS[curMonth - 1]}: {currentPaid ? "Em dia" : "Pendente"}
          </span>
        </div>
        <Speedometer value={paidCount} max={12} display={`${paidCount}/12`} size={120} testId="member-dues-gauge" />
      </div>
      <div className="mt-5 grid grid-cols-6 gap-2">
        {MONTHS.map((m, i) => {
          const paid = !!months[String(i + 1)];
          const future = i + 1 > curMonth;
          return (
            <div key={m} data-testid={`member-dues-month-${i + 1}`}
              className={`text-center rounded-md py-2 text-xs font-mono-x border ${paid ? "bg-green-500/15 border-green-500/40 text-green-300" : future ? "border-white/10 text-zinc-600" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {m}
            </div>
          );
        })}
      </div>
    </div>
  );
};
