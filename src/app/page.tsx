import FAQs from "@/components/FaqSection";
import { FeatureSection } from "@/components/FeatureSection";
import { FeatureSectionTwo } from "@/components/FeatureSectionTwo";
import FooterSection from "@/components/FooterSection";
import { HeroSection } from "@/components/HeroSection";
import { Logos } from "@/components/Logos";
import PricingSection from "@/components/PricingSection";
import TestimonialSection from "@/components/TestimonialSection";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-stone-100">
      <HeroSection />
      <Logos />
      <FeatureSection />
      <FeatureSectionTwo />
      <TestimonialSection />
      <PricingSection />
      <FAQs />
      <FooterSection />
    </div>
  );
}
