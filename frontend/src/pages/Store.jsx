import { PublicNav } from "@/components/landing/PublicNav";
import { Footer, Store as StoreSection } from "@/components/landing/Sections";

export default function Store() {
  return (
    <div className="asphalt min-h-screen overflow-x-hidden" data-testid="store-page">
      <PublicNav />
      <main>
        <StoreSection />
      </main>
      <Footer />
    </div>
  );
}
