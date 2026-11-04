import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const ClubCtx = createContext(null);

const DEFAULT_CLUB = {
  club_name: "Biker Girls 85",
  tagline: "Moto Grupo",
  hero_title: "Mulheres, motores e estrada ",
  hero_subtitle: "Um moto grupo feito de irmandade, liberdade e quilômetros compartilhados.",
  about_text: "Somos um motogrupo feminino movido pela paixão por motos, pela liberdade e pela força da união.\n\nMais do que rolês, construímos amizades, compartilhamos experiências e vivemos histórias incríveis sobre duas rodas.\n\nAqui, cada encontro vira uma lembrança e cada quilômetro fortalece nossa irmandade.\n\n**Não é só sobre motos. É sobre tudo que vivemos juntas!**",
  logo_url: "/logo.png",
  hero_image: "https://images.unsplash.com/photo-1681335056244-9dd3d5de8b60?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
  primary_color: "#e85a9b",
  accent_color: "#ff2a85",
  monthly_fee: 30,
  city: "Fortaleza - CE",
  contact_email: "[contato@seuclub.com]",
  contact_phone: "85999588651",
  instagram: "",
  whatsapp: "",
  gallery: ["/gallery/foto1.png", "/gallery/foto2.png", "/gallery/foto3.png", "/gallery/foto4.png"],
};

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
  document.title = `${s.club_name} · ${s.tagline || "Moto Grupo"}`;
};

export const ClubProvider = ({ children }) => {
  const [club, setClub] = useState(null);

  const reload = useCallback(async () => {
    let data;
    try {
      ({ data } = await api.get("/settings"));
    } catch (error) {
      console.error("Não foi possível carregar as configurações do clube pela API.", error);
      data = DEFAULT_CLUB;
    }
    try {
      const { data: heroImage } = await api.get("/settings/hero-image");
      if (heroImage.hero_image) {
        data = { ...data, hero_image: heroImage.hero_image };
      }
    } catch (error) {
      console.error("Não foi possível carregar a imagem de fundo do clube.", error);
    }
    try {
      const { data: gallery } = await api.get("/settings/gallery");
      if (Array.isArray(gallery.gallery)) {
        data = { ...data, gallery: gallery.gallery };
      }
    } catch (error) {
      console.error("Não foi possível carregar a galeria do clube.", error);
    }
    setClub(data);
    applyTheme(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <ClubCtx.Provider value={{ club, setClub, reload }}>{children}</ClubCtx.Provider>;
};

export const useClub = () => useContext(ClubCtx);
