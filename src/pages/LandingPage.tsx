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
    <div className="h-screen overflow-y-auto snap-y snap-mandatory">
      <div className="snap-start">
        <HeroSection />
      </div>
      <div className="snap-start">
        <ProblemSection />
      </div>
      <div className="snap-start">
        <HowItWorksSection />
      </div>
      <div className="snap-start">
        <CategoryShowcase />
      </div>
      <div className="snap-start">
        <GuaranteeSection />
      </div>
      <div className="snap-start">
        <SocialProof />
      </div>
      <div className="snap-start">
        <FinalCTA />
      </div>
      <div className="snap-start">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
