import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
//import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { SectionSeparator } from "@/components/landing/SectionSeparator";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      {/*<CategoryShowcase />*/}
      <SocialProof />
      <GuaranteeSection />
      <FinalCTA />
      <Footer />
      
      {/*<LiveActivityFeed />*/}
    </div>
  );
};

export default Index;
