import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useClub } from "@/context/ClubContext";
import { errMsg } from "@/lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const { club } = useClub();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/membro"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const u = await login(email, password);
      nav(u.role === "admin" ? "/admin" : "/membro");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="asphalt min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden border-r border-white/10">
        <div className="headlight" />
        <div className="road" />
        <motion.img initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 45 }}
          src={club.logo_url} alt={club.club_name} className="relative w-[26rem] rounded-[2rem] border border-white/10 shadow-2xl" />
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.form initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-md card-metal p-8 sm:p-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors" data-testid="login-back-link"><ArrowLeft size={16} /> Voltar ao club</Link>
          <img src={club.logo_url} alt="" className="lg:hidden h-20 w-20 rounded-full mt-6 object-cover" />
          <h1 className="font-display text-4xl font-black uppercase mt-6 leading-none">Ligue o motor</h1>
          <p className="text-zinc-400 mt-2 text-sm">Acesso exclusivo para membros e administração do {club.club_name}.</p>
          <div className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-black/30" data-testid="login-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-black/30" data-testid="login-password-input" />
            </div>
            {error && <p className="text-sm text-red-400" data-testid="login-error">{error}</p>}
            <button disabled={busy} className="btn-rev w-full h-12 flex items-center justify-center gap-2 disabled:opacity-60" data-testid="login-submit-button">
              <KeyRound size={18} /> {busy ? "Acelerando..." : "Entrar"}
            </button>
            <p className="text-xs text-zinc-500 text-center">Ainda não tem acesso? Fale com a administração do club.</p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
