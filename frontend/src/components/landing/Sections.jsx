import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Mail, Phone, Instagram, MapPin, MessageCircle, CalendarClock } from "lucide-react";
import { api, fmtMoney } from "@/lib/api";
import { useClub } from "@/context/ClubContext";
import { Speedometer } from "@/components/moto/Speedometer";

const fade = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6 } };

export const Marquee = () => {
  const { club } = useClub();
  const words = ["Ride free", club.club_name, "Irmandade", "Estrada", "Liberdade", club.tagline];
  const row = [...words, ...words];
  return (
    <div className="border-y border-white/10 bg-brand/95 py-3 overflow-hidden -rotate-1 scale-105" data-testid="marquee-strip">
      <div className="marquee">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="font-display italic text-2xl font-black uppercase text-white px-6 whitespace-nowrap">{w} <span className="opacity-60">★</span></span>
        ))}
      </div>
    </div>
  );
};

export const About = () => {
  const { club } = useClub();
  const [stats, setStats] = useState({ members: 0, events_year: 0, upcoming: 0 });
  useEffect(() => {
    api.get("/public/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);
  return (
    <section id="sobre" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-2 gap-16 items-center">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Quem somos</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Mais que um club.<br />Uma <span className="text-brand">família</span> sobre rodas.</h2>
        <p className="mt-6 text-zinc-300 leading-relaxed whitespace-pre-line" data-testid="about-text">{club.about_text}</p>
        <div className="mt-8 flex flex-wrap gap-6 font-mono-x text-xs uppercase tracking-widest text-zinc-400">
          <span>Fundação: <b className="text-white">{club.founded_year}</b></span>
          <span>Mensalidade: <b className="text-white">{fmtMoney(club.monthly_fee)}</b></span>
        </div>
      </motion.div>
      <motion.div {...fade} className="card-metal p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-6 place-items-center">
        <Speedometer value={stats.members} max={Math.max(50, stats.members)} label="Membros ativos" testId="stat-members" size={150} />
        <Speedometer value={stats.events_year} max={Math.max(24, stats.events_year)} label="Rolês no ano" testId="stat-events-year" size={150} />
        <Speedometer value={stats.upcoming} max={Math.max(10, stats.upcoming)} label="Próximos" testId="stat-upcoming" size={150} />
      </motion.div>
    </section>
  );
};

export const EventsTeaser = () => (
  <section id="eventos" className="relative py-24 sm:py-32 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <motion.div {...fade} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Agenda</span>
          <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Eventos & Encontros</h2>
          <p className="mt-4 text-zinc-400 max-w-lg">Nossa agenda completa de rolês, viagens e encontros é exclusiva para membros.</p>
        </div>
        <Link to="/login" className="btn-rev px-7 py-3 text-sm self-start" data-testid="events-teaser-login-button">Entrar para ver a agenda</Link>
      </motion.div>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} {...fade} transition={{ duration: 0.6, delay: i * 0.12 }} className="card-metal hoverable p-6 relative overflow-hidden" data-testid={`event-teaser-card-${i}`}>
            <div className="blur-[6px] select-none pointer-events-none">
              <div className="flex gap-4 items-center">
                <div className="h-16 w-16 rounded-lg bg-brand/30" />
                <div className="space-y-2 flex-1"><div className="h-4 bg-white/20 rounded w-3/4" /><div className="h-3 bg-white/10 rounded w-1/2" /></div>
              </div>
              <div className="mt-6 h-3 bg-white/10 rounded" /><div className="mt-2 h-3 bg-white/10 rounded w-5/6" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0b0c10]/40">
              <Lock className="text-brand" /><span className="font-mono-x text-[11px] uppercase tracking-[0.25em] text-zinc-300">Exclusivo para membros</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export const Gallery = () => {
  const { club } = useClub();
  const imgs = (club.gallery || []).filter(Boolean);
  if (!imgs.length) return null;

  return (
    <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Galeria</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Na estrada</h2>
      </motion.div>
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 auto-rows-[260px] sm:auto-rows-[420px] gap-3 sm:gap-4">
        {imgs.slice(0, 6).map((src, i) => (
          <motion.div key={src + i} {...fade} transition={{ duration: 0.6, delay: i * 0.08 }} className={`group relative overflow-hidden rounded-xl border border-white/10 ${i % 2 ? "lg:translate-y-10" : ""}`} data-testid={`gallery-item-${i}`}>
            <img src={src} alt="" className="h-full w-full object-cover object-top grayscale-[60%] group-hover:grayscale-0 group-hover:scale-110 transition-[transform,filter] duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10]/80 to-transparent opacity-80 group-hover:opacity-30 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const ContactItem = ({ icon: Icon, label, value, href, testId }) =>
  value ? (
    <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="card-metal hoverable p-5 flex items-center gap-4" data-testid={testId}>
      <span className="h-11 w-11 rounded-full bg-brand/15 text-brand flex items-center justify-center"><Icon size={20} /></span>
      <span><span className="block font-mono-x text-[10px] uppercase tracking-[0.25em] text-zinc-500">{label}</span><span className="text-white break-all">{value}</span></span>
    </a>
  ) : null;

export const Contact = () => {
  const { club } = useClub();
  const wa = (club.whatsapp || "").replace(/\D/g, "");
  return (
    <section id="contato" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Contato</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Bora rodar com a gente?</h2>
        <p className="mt-5 text-zinc-400">Fale com a administração do club para conhecer os requisitos e participar de um encontro como convidada.</p>
      </motion.div>
      <div className="grid sm:grid-cols-2 gap-4">
        <ContactItem icon={Mail} label="E-mail" value={club.contact_email} href={`mailto:${club.contact_email}`} testId="contact-email" />
        <ContactItem icon={Phone} label="Telefone" value={club.contact_phone} href={`tel:${club.contact_phone}`} testId="contact-phone" />
        <ContactItem icon={MessageCircle} label="WhatsApp" value={club.whatsapp} href={`https://wa.me/${wa}`} testId="contact-whatsapp" />
        <ContactItem icon={Instagram} label="Instagram" value={club.instagram} href={`https://instagram.com/${(club.instagram || "").replace("@", "")}`} testId="contact-instagram" />
        <ContactItem icon={MapPin} label="Base" value={club.city} href="#contato" testId="contact-city" />
        <ContactItem icon={CalendarClock} label="Desde" value={club.founded_year} href="#sobre" testId="contact-founded" />
      </div>
    </section>
  );
};

export const Footer = () => {
  const { club } = useClub();
  return (
    <footer className="border-t border-white/10 mt-12">
      <div className="tread" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src={club.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <div className="font-display text-xl font-extrabold uppercase">{club.club_name}</div>
            <div className="text-xs text-zinc-500">© {new Date().getFullYear()} · Todos os direitos reservados</div>
          </div>
        </div>
        <Link to="/login" className="text-sm text-zinc-400 hover:text-brand transition-colors" data-testid="footer-login-link">Acesso de membros e administração</Link>
      </div>
    </footer>
  );
};
