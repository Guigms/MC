import { motion } from "framer-motion";
import { useClub } from "@/context/ClubContext";

export const MemberCard = ({ user }) => {
  const { club } = useClub();
  const since = user.joined_at ? new Date(user.joined_at).getFullYear() : "—";
  return (
    <motion.div initial={{ rotateY: -25, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.8 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-white/15 shadow-2xl"
      style={{ background: "linear-gradient(135deg, #1a1d28 0%, #0b0c10 60%), #0b0c10" }} data-testid="member-id-card">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: "var(--club-glow)" }} />
      <div className="absolute inset-0 speed-lines" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="font-mono-x text-[10px] uppercase tracking-[0.3em] text-brand">Carteira de membro</div>
          <div className="font-display text-2xl font-black uppercase mt-1 leading-none">{club.club_name}</div>
        </div>
        <img src={club.logo_url} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--club-primary)]" />
      </div>
      <div className="relative mt-8">
        <div className="font-display text-3xl font-extrabold uppercase leading-none" data-testid="member-card-name">{user.name}</div>
        {user.nickname && <div className="text-brand font-mono-x text-sm mt-1">"{user.nickname}"</div>}
      </div>
      <div className="relative mt-6 grid grid-cols-3 gap-3 text-xs">
        {[["Moto", user.motorcycle || "—"], ["Tipo sang.", user.blood_type || "—"], ["Desde", since]].map(([k, v]) => (
          <div key={k}><div className="font-mono-x text-[9px] uppercase tracking-widest text-zinc-500">{k}</div><div className="text-white truncate">{v}</div></div>
        ))}
      </div>
      <div className="relative mt-6 inline-block bg-white text-black font-mono-x font-semibold tracking-[0.3em] px-3 py-1 rounded border-2 border-zinc-400" data-testid="member-card-plate">
        {user.id.slice(-7).toUpperCase()}
      </div>
    </motion.div>
  );
};
