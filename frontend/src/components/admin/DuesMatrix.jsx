
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

  const curMonth =
    year === now.getFullYear()
      ? now.getMonth() + 1
      : 12;

  // Normaliza os dados recebidos da API
  const normalizeRows = (data) => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((row) => ({
      ...row,
      name: row?.name ?? "",
      email: row?.email ?? "",
      active: row?.active ?? false,
      joined_year: Number(row?.joined_year),
      joined_month: Number(row?.joined_month),
      months:
        row?.months &&
        typeof row.months === "object" &&
        !Array.isArray(row.months)
          ? row.months
          : {},
    }));
  };

  // Carrega os dados da matriz
  const load = useCallback(async () => {
    try {
      const response = await api.get(`/dues?year=${year}`);

      const data = response?.data?.rows;

      setRows(normalizeRows(data));
    } catch (error) {
      toast.error(errMsg(error));

      setRows([]);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  // Alterna entre pago e pendente
  const toggle = async (row, month) => {
    const months =
      row?.months && typeof row.months === "object"
        ? row.months
        : {};

    const paid = !months[String(month)];

    setRows((currentRows) =>
      currentRows.map((r) => {
        if (r.id !== row.id) {
          return r;
        }

        const currentMonths =
          r.months &&
          typeof r.months === "object"
            ? r.months
            : {};

        const updatedMonths = paid
          ? {
              ...currentMonths,
              [String(month)]: {
                amount: club?.monthly_fee ?? 0,
              },
            }
          : Object.fromEntries(
              Object.entries(currentMonths).filter(
                ([key]) => key !== String(month)
              )
            );

        return {
          ...r,
          months: updatedMonths,
        };
      })
    );

    try {
      await api.post("/dues/toggle", {
        user_id: row.id,
        year,
        month,
        paid,
      });

      toast.success(
        `${row.name}: ${MONTHS[month - 1]}/${year} ${
          paid ? "pago" : "pendente"
        }`
      );
    } catch (error) {
      toast.error(errMsg(error));

      load();
    }
  };

  // Garante que rows sempre seja um array
  const safeRows = Array.isArray(rows) ? rows : [];
  const isEligible = (row, month) =>
    year > row.joined_year ||
    (year === row.joined_year && month >= row.joined_month);

  // Filtra os membros
  const visible = safeRows
    .filter((r) => r?.active)
    .filter(
      (r) =>
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.email.toLowerCase().includes(q.toLowerCase())
    )
    .filter(
      (r) =>
        !onlyPending ||
        (isEligible(r, curMonth) && !r.months[String(curMonth)])
    );

  // Calcula o total pago no ano
  const totalPaid = safeRows.reduce((sum, row) => {
    const months =
      row?.months &&
      typeof row.months === "object"
        ? row.months
        : {};

    const paidTotal = Object.values(months).reduce(
      (acc, payment) =>
        acc + (Number(payment?.amount) || 0),
      0
    );

    return sum + paidTotal;
  }, 0);

  return (
    <div
      className="space-y-5"
      data-testid="admin-dues-matrix"
    >
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(year - 1)}
            className="btn-ghost-metal p-2"
            data-testid="dues-prev-year"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            className="font-display text-3xl font-black w-24 text-center"
            data-testid="dues-year"
          >
            {year}
          </span>

          <button
            onClick={() => setYear(year + 1)}
            className="btn-ghost-metal p-2"
            data-testid="dues-next-year"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar membro..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-56 bg-black/30"
            data-testid="dues-search-input"
          />

          <button
            onClick={() => setOnlyPending(!onlyPending)}
            className={`px-4 py-2 text-xs ${
              onlyPending ? "btn-rev" : "btn-ghost-metal"
            }`}
            data-testid="dues-filter-pending"
          >
            Pendentes em {MONTHS[curMonth - 1]}
          </button>

          <span className="text-sm text-zinc-400">
            Total {year}:{" "}
            <b
              className="text-white"
              data-testid="dues-total"
            >
              {fmtMoney(totalPaid)}
            </b>
          </span>
        </div>
      </div>

      <div className="card-metal overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-white/10 text-zinc-400">
              <th className="text-left p-3 font-mono-x text-[10px] uppercase tracking-widest sticky left-0 bg-[#12141c]">
                Membro
              </th>

              {MONTHS.map((month) => (
                <th
                  key={month}
                  className="p-2 font-mono-x text-[10px] uppercase tracking-widest"
                >
                  {month}
                </th>
              ))}

              <th className="p-3 font-mono-x text-[10px] uppercase tracking-widest">
                Pagos
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/[0.02]"
                data-testid={`dues-row-${r.id}`}
              >
                <td className="p-3 sticky left-0 bg-[#12141c]">
                  <div className="font-medium text-white">
                    {r.name}
                  </div>

                  <div className="text-xs text-zinc-500">
                    {r.email}
                  </div>
                </td>

                {MONTHS.map((month, index) => {
                  const monthNumber = index + 1;

                  const paid = !!r.months[String(monthNumber)];
                  const eligible = isEligible(r, monthNumber);

                  const late =
                    eligible &&
                    !paid &&
                    (year < now.getFullYear() ||
                      (year === now.getFullYear() &&
                        monthNumber <= now.getMonth() + 1));

                  return (
                    <td
                      key={month}
                      className="p-1.5 text-center"
                    >
                      <button
                        disabled={!eligible}
                        onClick={() =>
                          toggle(r, monthNumber)
                        }
                        title={
                          !eligible
                            ? "Não se aplica: anterior à entrada do membro"
                            : paid
                            ? "Marcar como pendente"
                            : "Marcar como pago"
                        }
                        data-testid={`dues-cell-${r.id}-${monthNumber}`}
                        className={`dues-cell h-9 w-9 rounded-md inline-flex items-center justify-center border ${
                          !eligible
                            ? "border-transparent text-zinc-700 cursor-not-allowed"
                            : paid
                            ? "bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_12px_rgba(34,197,94,.25)]"
                            : late
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "border-white/10 text-zinc-600"
                        }`}
                      >
                        {paid ? (
                          <Check size={15} />
                        ) : late ? (
                          <X size={14} />
                        ) : (
                          eligible ? "·" : "—"
                        )}
                      </button>
                    </td>
                  );
                })}

                <td className="p-3 text-center font-display text-lg font-bold">
                  {Object.keys(r.months).length}
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={14}
                  className="p-6 text-center text-zinc-500"
                >
                  Nenhum membro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Clique em um mês para alternar entre pago e pendente.
        Valor registrado:{" "}
        {fmtMoney(club?.monthly_fee ?? 0)}
        {" "}(configurável em Personalização).
      </p>
    </div>
  );
};
