import { LandingNav } from "@/components/landing/landing-nav";
import HeroSection from "@/components/landing/hero-section";
import PainPointSection from "@/components/landing/pain-point-section";
import FeaturesSection from "@/components/landing/features-section";
import ScreenshotSection from "@/components/landing/screenshot-section";
import ReviewsSection from "@/components/landing/reviews-section";
import CtaSection from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <PainPointSection />
      <FeaturesSection />
      <ScreenshotSection />
      <ReviewsSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
