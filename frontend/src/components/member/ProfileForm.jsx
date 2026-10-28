import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const FIELDS = [["name", "Nome"], ["nickname", "Apelido / Vulgo"], ["phone", "Telefone"], ["motorcycle", "Moto"], ["blood_type", "Tipo sanguíneo"], ["birth_date", "Nascimento", "date"]];

export const ProfileForm = () => {
  const { user, setUser } = useAuth();
  const [f, setF] = useState(() => Object.fromEntries(FIELDS.map(([k]) => [k, user[k] || ""])));
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, ...(pw.new_password ? pw : {}) };
      const { data } = await api.put("/auth/profile", body);
      setUser(data);
      setPw({ current_password: "", new_password: "" });
      toast.success("Perfil atualizado");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="card-metal p-6 space-y-5" data-testid="profile-form">
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map(([k, l, t]) => (
          <div key={k} className="space-y-1.5">
            <Label>{l}</Label>
            <Input type={t || "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="bg-black/30" data-testid={`profile-${k}-input`} />
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-5 grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Senha atual</Label>
          <Input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className="bg-black/30" data-testid="profile-current-password-input" /></div>
        <div className="space-y-1.5"><Label>Nova senha</Label>
          <Input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className="bg-black/30" data-testid="profile-new-password-input" /></div>
      </div>
      <button disabled={busy} className="btn-rev px-8 py-2.5 text-sm disabled:opacity-60" data-testid="profile-save-button">{busy ? "Salvando..." : "Salvar perfil"}</button>
    </form>
  );
};
