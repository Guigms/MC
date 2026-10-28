import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { applyTheme, useClub } from "@/context/ClubContext";

const TEXT = [["club_name", "Nome do club"], ["tagline", "Subtítulo (ex: Moto Club)"], ["hero_title", "Título principal"], ["city", "Cidade / base"], ["founded_year", "Ano de fundação"], ["contact_email", "E-mail de contato"], ["contact_phone", "Telefone"], ["whatsapp", "WhatsApp (com DDD)"], ["instagram", "Instagram (@usuario)"], ["hero_image", "URL da imagem de fundo"]];

const resizeImage = (file) => new Promise((res) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, 600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = img.width * s; c.height = img.height * s;
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    res(c.toDataURL("image/png"));
  };
  img.src = URL.createObjectURL(file);
});

export const ClubSettings = () => {
  const { club, setClub } = useClub();
  const [f, setF] = useState(club);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    applyTheme(f);
  }, [f]);
  const clubRef = useRef(club);
  clubRef.current = club;
  useEffect(() => () => applyTheme(clubRef.current), []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (file) setF({ ...f, logo_url: await resizeImage(file) });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/settings", { ...f, monthly_fee: Number(f.monthly_fee) });
      setClub(data);
      toast.success("Personalização salva");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="grid lg:grid-cols-[1fr_340px] gap-8" data-testid="admin-club-settings">
      <div className="card-metal p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {TEXT.map(([k, l]) => (
            <div key={k} className="space-y-1.5"><Label>{l}</Label>
              <Input value={f[k] || ""} onChange={set(k)} className="bg-black/30" data-testid={`settings-${k}`} /></div>
          ))}
          <div className="space-y-1.5"><Label>Mensalidade (R$)</Label>
            <Input type="number" step="0.01" min="0" value={f.monthly_fee} onChange={set("monthly_fee")} className="bg-black/30" data-testid="settings-monthly_fee" /></div>
        </div>
        <div className="space-y-1.5"><Label>Frase de apresentação</Label>
          <Textarea rows={2} value={f.hero_subtitle} onChange={set("hero_subtitle")} className="bg-black/30" data-testid="settings-hero_subtitle" /></div>
        <div className="space-y-1.5"><Label>Sobre o club</Label>
          <Textarea rows={5} value={f.about_text} onChange={set("about_text")} className="bg-black/30" data-testid="settings-about_text" /></div>
        <div className="space-y-1.5"><Label>Galeria (uma URL de imagem por linha)</Label>
          <Textarea rows={4} value={(f.gallery || []).join("\n")} onChange={(e) => setF({ ...f, gallery: e.target.value.split("\n") })} className="bg-black/30 font-mono-x text-xs" data-testid="settings-gallery" /></div>
      </div>

      <div className="space-y-6">
        <div className="card-metal p-6 space-y-4 lg:sticky lg:top-24">
          <span className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-zinc-500">Identidade visual · prévia ao vivo</span>
          <div className="flex justify-center">
            <img src={f.logo_url} alt="logo" className="h-40 w-40 rounded-2xl object-cover border border-white/10 shadow-[0_0_40px_var(--club-glow)]" data-testid="settings-logo-preview" />
          </div>
          <label className="btn-ghost-metal cursor-pointer flex items-center justify-center gap-2 py-2 text-sm" data-testid="settings-logo-upload-label">
            <Upload size={15} /> Enviar nova logo
            <input type="file" accept="image/*" onChange={onLogo} className="hidden" data-testid="settings-logo-upload" />
          </label>
          <Input value={f.logo_url?.startsWith("data:") ? "" : f.logo_url} placeholder="ou cole a URL da logo" onChange={set("logo_url")} className="bg-black/30" data-testid="settings-logo_url" />
          <div className="grid grid-cols-2 gap-4">
            {[["primary_color", "Cor principal"], ["accent_color", "Cor de destaque"]].map(([k, l]) => (
              <div key={k} className="space-y-1.5"><Label>{l}</Label>
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 p-1.5">
                  <input type="color" value={f[k]} onChange={set(k)} className="h-8 w-10 rounded bg-transparent cursor-pointer" data-testid={`settings-${k}`} />
                  <span className="font-mono-x text-xs">{f[k]}</span>
                </div></div>
            ))}
          </div>
          <div className="font-display text-2xl font-black uppercase text-center" style={{ color: f.primary_color }}>{f.club_name}</div>
          <button disabled={busy} className="btn-rev w-full py-3 text-sm disabled:opacity-60" data-testid="settings-save-button">{busy ? "Salvando..." : "Salvar personalização"}</button>
        </div>
      </div>
    </form>
  );
};
