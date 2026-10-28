import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/moto/AppHeader";
import { MemberCard } from "@/components/member/MemberCard";
import { MyDues } from "@/components/member/MyDues";
import { EventsList } from "@/components/member/EventsList";
import { ProfileForm } from "@/components/member/ProfileForm";
import { useAuth } from "@/context/AuthContext";

export default function MemberArea() {
  const { user } = useAuth();
  return (
    <div className="asphalt min-h-screen" data-testid="member-area-page">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Área do membro</span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase mt-2 leading-none" data-testid="member-welcome">E aí, {user.nickname || user.name.split(" ")[0]}!</h1>
        </motion.div>
        <div className="mt-10 grid lg:grid-cols-[380px_1fr] gap-8">
          <div className="space-y-6">
            <MemberCard user={user} />
            <MyDues />
          </div>
          <Tabs defaultValue="eventos">
            <TabsList className="bg-white/5">
              <TabsTrigger value="eventos" data-testid="member-tab-events">Eventos & Encontros</TabsTrigger>
              <TabsTrigger value="perfil" data-testid="member-tab-profile">Meu perfil</TabsTrigger>
            </TabsList>
            <TabsContent value="eventos" className="mt-6"><EventsList /></TabsContent>
            <TabsContent value="perfil" className="mt-6"><ProfileForm /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
