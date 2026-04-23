import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { MetricsBar } from "@/components/landing/MetricsBar";
import { MoneyManagement } from "@/components/landing/MoneyManagement";
import { Spaces } from "@/components/landing/Spaces";
import { CardsShowcase } from "@/components/landing/CardsShowcase";
import { Reach } from "@/components/landing/Reach";
import { Security } from "@/components/landing/Security";
import { Business } from "@/components/landing/Business";
import { Stats } from "@/components/landing/Stats";
import { Testimonials } from "@/components/landing/Testimonials";
import { Plans } from "@/components/landing/Plans";
import { AppShowcase } from "@/components/landing/AppShowcase";
import { PressStrip } from "@/components/landing/PressStrip";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";

/**
 * Each section that should influence the navbar tint gets `data-nav-tint`.
 * The Navbar listens for intersections and swaps its colors accordingly.
 */
export default function LandingPage() {
  return (
    <main className="bg-white text-ink-900">
      <SmoothScroll />
      <Navbar />
      <Hero />
      <div data-nav-tint="light"><MetricsBar /></div>
      <div data-nav-tint="light"><MoneyManagement /></div>
      <div data-nav-tint="light"><Spaces /></div>
      <div data-nav-tint="light"><CardsShowcase /></div>
      <div data-nav-tint="light"><Reach /></div>
      <div data-nav-tint="dark"><Security /></div>
      <div data-nav-tint="light"><Business /></div>
      <div data-nav-tint="light"><Stats /></div>
      <div data-nav-tint="light"><PressStrip /></div>
      <div data-nav-tint="light"><Testimonials /></div>
      <div data-nav-tint="light"><Plans /></div>
      <div data-nav-tint="light"><AppShowcase /></div>
      <div data-nav-tint="light"><FAQ /></div>
      <div data-nav-tint="light"><CTA /></div>
      <div data-nav-tint="dark"><Footer /></div>
    </main>
  );
}
