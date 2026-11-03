
import { useEffect, useState } from "react";
import { api, fmtMoney, MONTHS } from "@/lib/api";
import { useClub } from "@/context/ClubContext";
import { Speedometer } from "@/components/moto/Speedometer";

export const MyDues = () => {
  const { club } = useClub();

  const now = new Date();
  const year = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const [months, setMonths] = useState({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get(
          `/dues/me?year=${year}`
        );

        const data = response?.data?.months;

        if (active) {
          setMonths(
            data &&
            typeof data === "object" &&
            !Array.isArray(data)
              ? data
              : {}
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar mensalidades:",
          error
        );

        if (active) {
          setMonths({});
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [year]);

  // Garante que months sempre seja um objeto válido
  const safeMonths =
    months &&
    typeof months === "object" &&
    !Array.isArray(months)
      ? months
      : {};

  // Quantidade de mensalidades pagas
  const paidCount = Object.keys(safeMonths).length;

  // Verifica se a mensalidade do mês atual foi paga
  const currentPaid = !!safeMonths[String(curMonth)];

  return (
    <div
      className="card-metal p-6"
      data-testid="member-dues-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono-x text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Mensalidade {year}
          </div>

          <div className="font-display text-2xl font-black uppercase mt-1">
            {fmtMoney(club?.monthly_fee ?? 0)}

            <span className="text-sm text-zinc-500 font-medium normal-case">
              {" "}/mês
            </span>
          </div>

          <span
            data-testid="member-dues-current-status"
            className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full ${
              currentPaid
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {MONTHS[curMonth - 1]}:{" "}
            {currentPaid ? "Em dia" : "Pendente"}
          </span>
        </div>

        <Speedometer
          value={paidCount}
          max={12}
          display={`${paidCount}/12`}
          size={120}
          testId="member-dues-gauge"
        />
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2">
        {MONTHS.map((month, index) => {
          const monthNumber = index + 1;

          const paid = !!safeMonths[String(monthNumber)];

          const future = monthNumber > curMonth;

          return (
            <div
              key={month}
              data-testid={`member-dues-month-${monthNumber}`}
              className={`text-center rounded-md py-2 text-xs font-mono-x border ${
                paid
                  ? "bg-green-500/15 border-green-500/40 text-green-300"
                  : future
                  ? "border-white/10 text-zinc-600"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {month}
            </div>
          );
        })}
      </div>
    </div>
  );
};
