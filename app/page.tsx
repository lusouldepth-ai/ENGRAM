import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-braun-bg selection:bg-braun-accent selection:text-white">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
