import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <CategoryShowcase />
      <GuaranteeSection />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
