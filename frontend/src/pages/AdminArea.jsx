import { motion } from "framer-motion";
import { Gauge, Wallet, Users, CalendarDays, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/moto/AppHeader";
import { Overview } from "@/components/admin/Overview";
import { DuesMatrix } from "@/components/admin/DuesMatrix";
import { MembersAdmin } from "@/components/admin/MembersAdmin";
import { EventsAdmin } from "@/components/admin/EventsAdmin";
import { ClubSettings } from "@/components/admin/ClubSettings";

const TABS = [
  ["overview", "Visão geral", Gauge, Overview],
  ["dues", "Mensalidades", Wallet, DuesMatrix],
  ["members", "Membros", Users, MembersAdmin],
  ["events", "Eventos", CalendarDays, EventsAdmin],
  ["settings", "Personalização", Palette, ClubSettings],
];

export default function AdminArea() {
  return (
    <div className="asphalt min-h-screen" data-testid="admin-area-page">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Painel do administrador</span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase mt-2 leading-none">Box de comando</h1>
        </motion.div>
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="bg-white/5 h-auto flex-wrap justify-start">
            {TABS.map(([v, l, Icon]) => (
              <TabsTrigger key={v} value={v} className="gap-2 data-[state=active]:text-[var(--club-primary)]" data-testid={`admin-tab-${v}`}><Icon size={15} />{l}</TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(([v, , , C]) => (
            <TabsContent key={v} value={v} className="mt-8"><C /></TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
