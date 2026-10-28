import { PublicNav } from "@/components/landing/PublicNav";
import { Hero } from "@/components/landing/Hero";
import { About, Contact, EventsTeaser, Footer, Gallery, Marquee } from "@/components/landing/Sections";

export default function Landing() {
  return (
    <div className="asphalt overflow-x-hidden" data-testid="landing-page">
      <PublicNav />
      <Hero />
      <Marquee />
      <About />
      <div className="tread" />
      <EventsTeaser />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
}
