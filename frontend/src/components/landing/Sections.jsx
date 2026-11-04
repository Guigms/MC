import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Handshake, Mail, Phone, Instagram, MapPin, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
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
  const aboutParagraphs = (club.about_text || "").split(/\n\s*\n/);
  useEffect(() => {
    api.get("/public/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);
  return (
    <section id="sobre" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-2 gap-16 items-center">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Nossa história e propósito</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Mais que um grupo.<br />Uma <span className="text-brand">família</span> sobre rodas.</h2>
        <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed" data-testid="about-text">
          {aboutParagraphs.map((paragraph, index) => {
            const parts = paragraph.split(/\*\*(.*?)\*\*/g);
            return (
              <p key={index}>
                {parts.map((part, partIndex) =>
                  partIndex % 2 === 1
                    ? <strong key={partIndex} className="text-white">{part}</strong>
                    : part
                )}
              </p>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap gap-6 font-mono-x text-xs uppercase tracking-widest text-zinc-400">
          <span>Nosso propósito: <b className="text-white">irmandade, liberdade e estrada</b></span>
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

const getVideoSource = (src) => {
  let url;
  try {
    url = new URL(src, window.location.origin);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) return null;

  const youtubeId =
    url.hostname === "youtu.be"
      ? url.pathname.slice(1)
      : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
        ? url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.startsWith("/embed/")
            ? url.pathname.split("/")[2]
            : null
        : null;

  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return { type: "embed", src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
  }

  const vimeoId = url.hostname === "vimeo.com" && url.pathname.match(/^\/(\d+)$/)?.[1];
  if (vimeoId) return { type: "embed", src: `https://player.vimeo.com/video/${vimeoId}` };

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { type: "video", src: url.href };
  }

  return null;
};

export const Gallery = () => {
  const { club } = useClub();
  const media = (club.gallery || []).filter(Boolean);

  return (
    <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Nossas histórias</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Na estrada, juntas</h2>
        <p className="mt-4 max-w-2xl text-zinc-400"><b className="text-white">Nossos rolês:</b> passeios, viagens e encontros registrados em fotos e vídeos. Momentos e caminhos que compartilhamos.</p>
      </motion.div>
      {media.length > 0 && (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[260px] sm:auto-rows-[340px] gap-3 sm:gap-4">
        {media.slice(0, 9).map((src, i) => {
          const video = getVideoSource(src);
          return (
          <motion.div key={src + i} {...fade} transition={{ duration: 0.6, delay: i * 0.08 }} className={`group relative overflow-hidden rounded-xl border border-white/10 ${i % 2 ? "lg:translate-y-10" : ""}`} data-testid={`gallery-item-${i}`}>
            {video?.type === "embed" ? (
              <iframe
                src={video.src}
                title={`Vídeo das histórias do club ${i + 1}`}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                data-testid={`gallery-video-${i}`}
              />
            ) : video?.type === "video" ? (
              <video src={video.src} controls preload="metadata" className="h-full w-full object-cover" data-testid={`gallery-video-${i}`} />
            ) : (
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top grayscale-[60%] group-hover:grayscale-0 group-hover:scale-110 transition-[transform,filter] duration-700" />
            )}
            {video ? null : <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0b0c10]/80 to-transparent opacity-80 group-hover:opacity-30 transition-opacity duration-500" />}
          </motion.div>
          );
        })}
        </div>
      )}
    </section>
  );
};

export const Partnerships = () => (
  <section id="parcerias" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
    <motion.div {...fade} className="card-metal p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="max-w-2xl">
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Parcerias</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Empresas que apoiam o movimento</h2>
        <p className="mt-4 text-zinc-400">Valorizamos quem fortalece a irmandade, a liberdade e a presença das mulheres na estrada. Quer apoiar o club e construir essa parceria com a gente?</p>
      </div>
      <a href="#contato" className="btn-rev inline-flex items-center justify-center gap-2 px-7 py-3 text-sm shrink-0" data-testid="partnership-contact-link">
        <Handshake size={17} /> Seja uma parceira
      </a>
    </motion.div>
  </section>
);

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
        <p className="mt-5 text-zinc-400">Preencha a ficha de inscrição. A administração analisa e entra em contato com você.</p>
        <Link to="/inscricao" className="btn-rev inline-block px-8 py-3 mt-8 text-sm" data-testid="contact-join-button">Preencher ficha de inscrição</Link>
      </motion.div>
      <div className="grid sm:grid-cols-2 gap-4">
        <ContactItem icon={Mail} label="E-mail" value={club.contact_email} href={`mailto:${club.contact_email}`} testId="contact-email" />
        <ContactItem icon={Phone} label="Telefone" value={club.contact_phone} href={`tel:${club.contact_phone}`} testId="contact-phone" />
        <ContactItem icon={MessageCircle} label="WhatsApp" value={club.whatsapp} href={`https://wa.me/${wa}`} testId="contact-whatsapp" />
        <ContactItem icon={Instagram} label="Instagram" value={club.instagram} href={`https://instagram.com/${(club.instagram || "").replace("@", "")}`} testId="contact-instagram" />
        <ContactItem icon={MapPin} label="Base" value={club.city} href="#contato" testId="contact-city" />
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
