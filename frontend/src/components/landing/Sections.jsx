import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Handshake, Mail, Phone, Instagram, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useClub } from "@/context/ClubContext";
import { Speedometer } from "@/components/moto/Speedometer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";

const fade = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6 } };

const partnerExamples = [
  { name: "SGroup Nacional", logo: "/partners/s-group.jpeg", whatsapp: "85992772059" },
  { name: "Star Motos Car", logo: "/partners/star-motos-car.png", whatsapp: "8533937457" },
  { name: "Torquato Pneus", logo: "/partners/torquato-pneus.png", whatsapp: "85986056620" },
];

const memberBusinessExamples = [
  { name: "Studio Anny Martins", logo: "/businesses/studio-anny-martins.jpeg", whatsapp: "85989923059" },
  { name: "Panos de Prato e Tapetes de Retalhos", logo: "/businesses/panos-e-tapetes.jpeg", whatsapp: "85987804931" },
  { name: "Priscila Pontes · Video Maker", logo: "/businesses/priscila-pontes.jpeg", whatsapp: "85999588651" },
  { name: "Ateliê Laços da Lary", logo: "/businesses/atelie-lacos-da-lary.jpeg", whatsapp: "85992337984" },
  { name: "Driely Costa · Salão de Beleza", logo: "/businesses/driely-costa.jpeg", whatsapp: "8598384401" },
  { name: "Beach Park Suites", logo: "/businesses/beach-park-suites.jpeg", whatsapp: "85991116903" },
  { name: "Amanda Chaves · Personal Trainer", logo: "/businesses/amanda-chaves-personal-trainer.jpeg", whatsapp: "85989906754" },
  { name: "Decore com Criatividade", logo: "/businesses/decore-com-criatividade.jpeg", whatsapp: "85991928371" },
  { name: "Control Z 3D", logo: "/businesses/control-z-3d.jpeg", whatsapp: "85998363348" },
];

const clubRidePhotos = [
  { src: "/gallery/motoclube-1.png", alt: "Integrante do motoclube em sua motocicleta durante um passeio noturno" },
  { src: "/gallery/motoclube-2.png", alt: "Integrante do motoclube pilotando na estrada" },
  { src: "/gallery/motoclube-3.jpeg", alt: "Integrante do motoclube em sua motocicleta" },
  { src: "/gallery/motoclube-4.jpeg", alt: "Integrantes do motoclube reunidas em um passeio de estrada" },
  { src: "/gallery/motoclube-5.jpeg", alt: "Integrante do motoclube pilotando sua motocicleta" },
  { src: "/gallery/passeio-estrada-1.jpeg", alt: "Integrantes do motoclube em passeio por uma estrada" },
  { src: "/gallery/passeio-estrada-2.jpeg", alt: "Grupo de motociclistas reunido durante um passeio" },
];

const whatsappUrl = (club, message, contactPhone) => {
  const phone = (contactPhone || club.whatsapp || "").replace(/\D/g, "");
  const internationalPhone = phone && !phone.startsWith("55") ? `55${phone}` : phone;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
};

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
    api.get("/public/stats").then((r) => setStats(r.data)).catch((error) => {
      console.error("Não foi possível carregar os contadores públicos.", error);
    });
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

export const Leadership = () => (
  <section id="diretoria" className="max-w-7xl mx-auto px-4 sm:px-6 py-24" data-testid="leadership-section">
    <motion.div {...fade}>
      <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Quem conduz nossa irmandade</span>
      <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Nossa diretoria</h2>
      <p className="mt-4 max-w-2xl text-zinc-400">Mulheres que representam, cuidam e fortalecem o caminho do Biker Girls.</p>
    </motion.div>
    <div className="mt-10 grid lg:grid-cols-3 gap-5">
      <motion.article {...fade} className="card-metal hoverable overflow-hidden" data-testid="leadership-president">
        <img src="/diretoria/priscila-pontes.jpeg" alt="Priscila Pontes, presidente do Biker Girls" loading="lazy" className="w-full aspect-[4/5] object-cover object-top" />
        <div className="p-5">
          <span className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-brand">Presidente</span>
          <h3 className="font-display text-2xl font-bold uppercase mt-1">Priscila Pontes</h3>
        </div>
      </motion.article>
      <motion.article {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="card-metal hoverable overflow-hidden lg:col-span-2" data-testid="leadership-directors">
        <img src="/diretoria/diretoras.jpeg" alt="Diretoras do Biker Girls ao lado da presidente Priscila Pontes" loading="lazy" className="w-full aspect-[4/5] sm:aspect-[3/2] object-cover object-center" />
        <div className="p-5">
          <span className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-brand">Diretoria</span>
          <h3 className="font-display text-2xl font-bold uppercase mt-1">As diretoras</h3>
          <p className="text-sm text-zinc-400 mt-2">Juntas, trabalhando pelo presente e pelo futuro do nosso motogrupo.</p>
        </div>
      </motion.article>
    </div>
  </section>
);

const StoreProduct = ({ product, onAdd }) => {
  const [size, setSize] = useState("");
  const [amount, setAmount] = useState(1);

  const add = () => {
    if (product.sizes?.length > 0 && !size) {
      toast.error("Escolha um tamanho antes de adicionar.");
      return;
    }
    onAdd({ product, size, quantity: amount });
    setAmount(1);
  };

  return (
    <motion.article {...fade} className="card-metal hoverable overflow-hidden flex flex-col" data-testid={`store-product-${product.id}`}>
      <div className="aspect-[4/3] bg-black/40 flex items-center justify-center">
        {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <ShoppingBag className="text-zinc-600" size={44} />}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold uppercase leading-tight">{product.name}</h3>
          <span className="text-brand font-semibold whitespace-nowrap">{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>
        {product.description && <p className="text-sm text-zinc-400 mt-2">{product.description}</p>}
        {product.sizes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} className={`min-w-10 px-3 py-1 text-xs ${size === item ? "btn-rev" : "btn-ghost-metal"}`} data-testid={`store-size-${product.id}-${item}`}>{item}</button>)}
          </div>
        )}
        <div className="mt-auto pt-5 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/15">
            <button onClick={() => setAmount(Math.max(1, amount - 1))} className="p-2 text-zinc-300 hover:text-white" aria-label="Diminuir quantidade"><Minus size={14} /></button>
            <span className="w-7 text-center font-display font-bold">{amount}</span>
            <button onClick={() => setAmount(Math.min(50, amount + 1))} className="p-2 text-zinc-300 hover:text-white" aria-label="Aumentar quantidade"><Plus size={14} /></button>
          </div>
          <button onClick={add} className="btn-rev px-4 py-2 text-xs flex-1" data-testid={`store-add-${product.id}`}>Adicionar</button>
        </div>
      </div>
    </motion.article>
  );
};

export const Store = () => {
  const { club } = useClub();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    api.get("/products")
      .then(({ data }) => setProducts(data.filter((product) => product.active)))
      .catch(() => toast.error("Não foi possível carregar a loja agora."));
  }, []);

  const addToCart = ({ product, size, quantity }) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.product.id === product.id && item.size === size);
      if (index < 0) return [...current, { product, size, quantity }];
      return current.map((item, itemIndex) => itemIndex === index
        ? { ...item, quantity: Math.min(50, item.quantity + quantity) }
        : item);
    });
    toast.success(`${product.name} adicionado ao carrinho.`);
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const checkout = () => {
    const phone = (club.whatsapp || club.contact_phone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("O WhatsApp da loja ainda não foi configurado.");
      return;
    }
    const internationalPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const lines = cart.map((item) => `- ${item.quantity}x ${item.product.name}${item.size ? ` (${item.size})` : ""}`);
    const message = `Olá! Gostaria de fazer um pedido na Loja Biker Girls:\n${lines.join("\n")}\n\nTotal estimado: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="loja" className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen" data-testid="store-section">
      <motion.div {...fade} className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Loja Biker Girls</span>
          <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Vista a irmandade</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">Escolha seus produtos, monte o pedido e finalize direto pelo WhatsApp.</p>
        </div>
        {cart.length > 0 && <div className="card-metal p-4 sm:min-w-72" data-testid="store-cart">
          <div className="flex items-center justify-between gap-4">
            <span className="font-display uppercase font-bold">Seu pedido</span>
            <span className="text-brand font-semibold">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            {cart.map((item) => <div key={`${item.product.id}-${item.size}`} className="flex items-center justify-between gap-3">
              <span>{item.quantity}x {item.product.name}{item.size ? ` · ${item.size}` : ""}</span>
              <button onClick={() => setCart((current) => current.filter((entry) => entry !== item))} className="text-zinc-500 hover:text-red-400" aria-label={`Remover ${item.product.name}`}><Trash2 size={14} /></button>
            </div>)}
          </div>
          <button onClick={checkout} className="btn-rev w-full py-2.5 mt-4 text-sm flex items-center justify-center gap-2" data-testid="store-checkout"><MessageCircle size={16} /> Finalizar no WhatsApp</button>
        </div>}
      </motion.div>
      {products.length > 0 ? <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{products.map((product) => <StoreProduct key={product.id} product={product} onAdd={addToCart} />)}</div> : <p className="mt-10 text-zinc-500 text-sm">Novidades em breve. Acompanhe a loja!</p>}
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
  const media = [
    ...clubRidePhotos,
    ...(club.gallery || [])
      .filter((src) => src && !clubRidePhotos.some((photo) => photo.src === src))
      .map((src) => ({ src, alt: "Registro do motoclube" })),
  ].slice(0, 9);

  return (
    <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Nossas histórias</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Na estrada, juntas</h2>
        <p className="mt-4 max-w-2xl text-zinc-400"><b className="text-white">Nossos rolês:</b> passeios, viagens e encontros registrados em fotos e vídeos. Momentos e caminhos que compartilhamos.</p>
      </motion.div>
      {media.length > 0 && (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[260px] sm:auto-rows-[340px] gap-3 sm:gap-4">
        {media.map(({ src, alt }, i) => {
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
              <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover object-top grayscale-[60%] group-hover:grayscale-0 group-hover:scale-110 transition-[transform,filter] duration-700" />
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

export const Partnerships = () => {
  const { club } = useClub();
  return (
    <section id="parcerias" className="max-w-7xl mx-auto px-4 sm:px-6 py-24" data-testid="partners-section">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Quem fortalece o movimento</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Nossas parceiras</h2>
        <p className="mt-4 max-w-2xl text-zinc-400">Empresas que apoiam a irmandade, a liberdade e a presença das mulheres na estrada.</p>
      </motion.div>
      <Carousel opts={{ align: "start", loop: true }} className="mt-10 px-12" data-testid="partners-carousel">
        <CarouselContent>
          {partnerExamples.map((partner, index) => (
            <CarouselItem key={partner.name} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
              <a
                href={whatsappUrl(club, `Olá! Gostaria de saber mais sobre a parceria com ${partner.name}.`, partner.whatsapp)}
                target="_blank"
                rel="noreferrer"
                aria-label={`Falar no WhatsApp sobre ${partner.name}`}
                className="card-metal hoverable min-h-48 p-6 flex flex-col items-center justify-center gap-4 text-center"
                data-testid={`partner-card-${index + 1}`}
              >
                <img src={partner.logo} alt={`Logo de ${partner.name}`} loading="lazy" className="h-28 w-full object-contain" />
                <h3 className="font-display text-xl font-bold uppercase text-white">{partner.name}</h3>
                <span className="inline-flex items-center gap-2 text-sm text-brand"><MessageCircle size={16} /> Falar no WhatsApp</span>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label="Parceira anterior" className="left-0 border-white/10 bg-[#12141c] text-white hover:bg-brand" />
        <CarouselNext aria-label="Próxima parceira" className="right-0 border-white/10 bg-[#12141c] text-white hover:bg-brand" />
      </Carousel>
      <motion.div {...fade} className="card-metal mt-12 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Parcerias</span>
          <h3 className="font-display text-2xl sm:text-3xl font-black uppercase mt-3 leading-none">Quer apoiar o movimento?</h3>
          <p className="mt-4 text-zinc-400">Vamos construir uma parceria com a gente.</p>
        </div>
        <a href="#contato" className="btn-rev inline-flex items-center justify-center gap-2 px-7 py-3 text-sm shrink-0" data-testid="partnership-contact-link">
          <Handshake size={17} /> Seja uma parceira
        </a>
      </motion.div>
    </section>
  );
};

export const MemberBusinesses = () => {
  const { club } = useClub();
  return (
    <section id="negocios-das-integrantes" className="max-w-7xl mx-auto px-4 sm:px-6 py-24" data-testid="member-businesses-section">
      <motion.div {...fade}>
        <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Empreendedorismo e irmandade</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black uppercase mt-3 leading-none">Negócios das integrantes</h2>
        <p className="mt-4 max-w-2xl text-zinc-400">Conheça e fortaleça os empreendimentos das mulheres que fazem parte do nosso grupo.</p>
      </motion.div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberBusinessExamples.map((business, index) => (
          <motion.a
            key={business.name}
            {...fade}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            href={whatsappUrl(club, `Olá! Vi ${business.name} na página do motoclube e gostaria de saber mais sobre o empreendimento.`, business.whatsapp)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Falar no WhatsApp sobre ${business.name}`}
            className="card-metal hoverable p-6"
            data-testid={`member-business-card-${index + 1}`}
          >
            <img src={business.logo} alt={`Logo de ${business.name}`} loading="lazy" className="h-44 w-full rounded-lg bg-white object-contain p-2" />
            <h3 className="font-display text-xl font-bold uppercase text-white mt-5">{business.name}</h3>
            <span className="mt-4 inline-flex items-center gap-2 text-sm text-brand"><MessageCircle size={16} /> Falar no WhatsApp</span>
          </motion.a>
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
