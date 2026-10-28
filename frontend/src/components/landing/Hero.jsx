import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useClub } from "@/context/ClubContext";

export const Hero = () => {
  const { club } = useClub();
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden flex items-center pt-16">
      <div className="absolute inset-0 bg-cover bg-center opacity-25 scale-105" style={{ backgroundImage: `url(${club.hero_image})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c10]/40 via-[#0b0c10]/70 to-[#0b0c10]" />
      <div className="absolute inset-0 speed-lines" />
      <div className="headlight" />
      <div className="road" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center pb-24">
        <div>
          <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 font-mono-x text-xs uppercase tracking-[0.3em] text-brand border border-brand-40 rounded-full px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" /> {club.tagline} · {club.city}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
            className="font-display italic text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.9] mt-6" data-testid="hero-title">
            <span className="chrome-text">{club.hero_title}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed">{club.hero_subtitle}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-10 flex flex-wrap gap-4">
            <a href="#contato" className="btn-rev px-8 py-3.5 text-base" data-testid="hero-join-button">Quero fazer parte</a>
            <Link to="/login" className="btn-ghost-metal px-8 py-3.5 text-base" data-testid="hero-member-button">Já sou membro</Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 120, rotate: 4 }} animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 50, damping: 12 }} className="relative justify-self-center">
          <div className="absolute -inset-6 rounded-full blur-3xl opacity-60" style={{ background: "radial-gradient(circle, var(--club-glow), transparent 70%)" }} />
          <motion.img src={club.logo_url} alt={club.club_name} data-testid="hero-logo"
            animate={{ y: [0, -6, 0, -3, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="relative w-64 sm:w-80 lg:w-[26rem] rounded-[2rem] shadow-2xl border border-white/10" />
        </motion.div>
      </div>

      <a href="#sobre" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-zinc-400 hover:text-white transition-colors" data-testid="hero-scroll-down">
        <ChevronDown className="animate-bounce" />
      </a>
    </section>
  );
};
