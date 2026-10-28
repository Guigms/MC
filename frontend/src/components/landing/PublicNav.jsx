import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClub } from "@/context/ClubContext";

const links = [["sobre", "Sobre"], ["eventos", "Eventos"], ["galeria", "Galeria"], ["contato", "Contato"]];

export const PublicNav = () => {
  const { club } = useClub();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

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
        <Link to={user ? (user.role === "admin" ? "/admin" : "/membro") : "/login"} className="btn-rev px-5 py-2 text-sm" data-testid="public-nav-member-button">
          {user ? "Minha área" : "Área do Membro"}
        </Link>
      </div>
    </header>
  );
};
