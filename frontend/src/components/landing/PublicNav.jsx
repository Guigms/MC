import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClub } from "@/context/ClubContext";

const links = [["sobre", "Sobre"], ["eventos", "Eventos"], ["galeria", "Galeria"], ["contato", "Contato"]];

export const PublicNav = () => {
  const { club } = useClub();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color] duration-300 border-b ${scrolled ? "bg-[#0b0c10]/85 backdrop-blur-xl border-white/10" : "bg-transparent border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3" data-testid="public-nav-logo">
          <img src={club.logo_url} alt="logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--club-primary)]" />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide hidden sm:block">{club.club_name}</span>
        </a>
        <nav className="hidden md:flex items-center gap-2">
          {links.map(([id, l]) => (
            <a key={id} href={`#${id}`} className="exhaust px-3 py-2 text-sm text-zinc-300 hover:text-white transition-colors" data-testid={`public-nav-${id}`}>{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to={user ? (user.role === "admin" ? "/admin" : "/membro") : "/login"} className="btn-rev px-5 py-2 text-sm" data-testid="public-nav-member-button">
            {user ? "Minha área" : "Área do Membro"}
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-zinc-200" data-testid="public-nav-mobile-toggle">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden bg-[#0b0c10]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex flex-col" data-testid="public-nav-mobile-menu">
          {links.map(([id, l]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="py-3 font-display text-xl uppercase font-bold text-zinc-200 border-b border-white/5" data-testid={`public-nav-mobile-${id}`}>{l}</a>
          ))}
        </nav>
      )}
    </header>
  );
};
