import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { useRef, useState, useEffect } from "react";

const sections = [
  { id: "hero", Component: HeroSection },
  { id: "problem", Component: ProblemSection },
  { id: "how", Component: HowItWorksSection },
  { id: "categories", Component: CategoryShowcase },
  { id: "guarantee", Component: GuaranteeSection },
  { id: "social", Component: SocialProof },
  { id: "cta", Component: FinalCTA },
  { id: "footer", Component: Footer },
];

const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (index: number) => {
    containerRef.current?.scrollTo({
      left: index * (containerRef.current?.clientWidth || 0),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Horizontal snap container */}
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map(({ id, Component }) => (
          <div
            key={id}
            className="flex-shrink-0 w-screen h-screen snap-start snap-always"
          >
            <Component />
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollTo(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "bg-blue-500 scale-125 shadow-lg"
                : "bg-gray-400/50 hover:bg-gray-400"
            }`}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrow hints */}
      {activeIndex > 0 && (
        <button
          onClick={() => scrollTo(activeIndex - 1)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Previous section"
        >
          ←
        </button>
      )}
      {activeIndex < sections.length - 1 && (
        <button
          onClick={() => scrollTo(activeIndex + 1)}
          className="fixed right-16 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Next section"
        >
          →
        </button>
      )}
    </div>
  );
};

export default LandingPage;
