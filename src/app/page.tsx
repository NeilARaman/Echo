import FAQs from "@/components/FaqSection";
import { FeatureSection } from "@/components/FeatureSection";
import { FeatureSectionTwo } from "@/components/FeatureSectionTwo";
import { HeroSection } from "@/components/HeroSection";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-stone-100">
      <HeroSection />
      <FeatureSection />
      <FeatureSectionTwo />
      <FAQs />
    </div>
  );
}
