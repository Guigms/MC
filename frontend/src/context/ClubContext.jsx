import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const ClubCtx = createContext(null);

const hexToRgb = (hex) => {
  const h = (hex || "#e85a9b").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const hexToHsl = (hex) => {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const applyTheme = (s) => {
  const root = document.documentElement.style;
  const [r, g, b] = hexToRgb(s.primary_color);
  root.setProperty("--club-primary", s.primary_color);
  root.setProperty("--club-accent", s.accent_color);
  root.setProperty("--club-glow", `rgba(${r}, ${g}, ${b}, 0.38)`);
  root.setProperty("--primary", hexToHsl(s.primary_color));
  root.setProperty("--ring", hexToHsl(s.primary_color));
  document.title = `${s.club_name} · ${s.tagline || "Moto Club"}`;
};

export const ClubProvider = ({ children }) => {
  const [club, setClub] = useState(null);

  const reload = useCallback(async () => {
    const { data } = await api.get("/settings");
    setClub(data);
    applyTheme(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <ClubCtx.Provider value={{ club, setClub, reload }}>{children}</ClubCtx.Provider>;
};

export const useClub = () => useContext(ClubCtx);
