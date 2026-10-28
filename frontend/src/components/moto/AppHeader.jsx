import { Link, NavLink } from "react-router-dom";
import { LogOut, Shield, User, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useClub } from "@/context/ClubContext";

const linkCls = ({ isActive }) =>
  `exhaust flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-brand" : "text-zinc-300 hover:text-white"}`;

export const AppHeader = () => {
  const { user, logout } = useAuth();
  const { club } = useClub();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0c10]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 min-w-0" data-testid="header-home-link">
          <img src={club?.logo_url} alt="logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--club-primary)]" />
          <span className="font-display text-xl font-extrabold uppercase tracking-wide truncate hidden sm:block">{club?.club_name}</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls} data-testid="nav-club-page"><Home size={16} /><span className="hidden md:inline">Club</span></NavLink>
          <NavLink to="/membro" className={linkCls} data-testid="nav-member-area"><User size={16} /><span className="hidden md:inline">Minha área</span></NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkCls} data-testid="nav-admin-area"><Shield size={16} /><span className="hidden md:inline">Admin</span></NavLink>
          )}
          <button onClick={logout} className="ml-2 btn-ghost-metal flex items-center gap-2 px-3 py-1.5 text-sm" data-testid="logout-button">
            <LogOut size={15} /><span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
