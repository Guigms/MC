import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL
    ? `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}/api`
    : "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("mc_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export function errMsg(e) {
  const d = e?.response?.data?.detail;
  if (d == null) return e?.message || "Algo deu errado. Tente novamente.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return d.msg || String(d);
}

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const fmtMoney = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (s) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const dateParts = (s) => {
  const d = new Date(s);
  return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS[d.getMonth()] || "", year: d.getFullYear() };
};
