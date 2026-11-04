import { PublicNav } from "@/components/landing/PublicNav";
import { Hero } from "@/components/landing/Hero";
import { About, Contact, Footer, Gallery, Marquee, Partnerships } from "@/components/landing/Sections";

export default function Landing() {
  return (
    <div className="asphalt overflow-x-hidden" data-testid="landing-page">
      <PublicNav />
      <Hero />
      <Marquee />
      <About />
      <div className="tread" />
      <Gallery />
      <Partnerships />
      <Contact />
      <Footer />
    </div>
  );
}
