import { Bento } from "@/components/landing/bento";
import { ClosingCTA, Footer } from "@/components/landing/closing";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Marquee } from "@/components/landing/marquee";
import { LandingNav } from "@/components/landing/nav";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { VoiceCompare } from "@/components/landing/voice-compare";

export default function Home() {
  return (
    <div className="bg-candy relative overflow-x-clip">
      <SmoothScroll />
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <VoiceCompare />
        <Bento />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
