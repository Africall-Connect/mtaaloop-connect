import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { GuaranteeSection } from "@/components/landing/GuaranteeSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { useRef, useState, useEffect, useCallback } from "react";

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

  // Track active section on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      setActiveIndex(Math.round(scrollLeft / width));
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Convert vertical scroll (mouse wheel) into horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();
    // Use deltaY (vertical scroll) to scroll horizontally
    container.scrollBy({
      left: e.deltaY !== 0 ? e.deltaY : e.deltaX,
      behavior: "auto",
    });
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map(({ id, Component }) => (
          <div key={id} className="flex-shrink-0 w-screen h-screen snap-start snap-always">
            <Component />
          </div>
        ))}
      </div>

      {/* Dot indicators (no click, just visual) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-8 h-3 bg-blue-500"
                : "w-3 h-3 bg-gray-400/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
