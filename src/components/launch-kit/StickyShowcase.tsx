import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneMockup } from "./PhoneMockup";
import { MtaaLoopOrbit } from "@/components/MtaaLoopLogo";
import { Home, Search, Video, Store } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Claim",
    headline: "Claim your building for free",
    description: "Sign up in 30 seconds and put your building on the MtaaLoop map. You'll be the first to unlock hyperlocal commerce in your estate.",
    icon: Home,
    screenBg: "from-blue-50 to-indigo-50",
    screenTitle: "Welcome to MtaaLoop",
    screenSub: "Your building marketplace awaits",
  },
  {
    num: "02",
    title: "Discover",
    headline: "Find vendors in your building",
    description: "Browse food vendors, beauty services, repair technicians, and more — all operating from your own building or estate.",
    icon: Search,
    screenBg: "from-purple-50 to-pink-50",
    screenTitle: "Discover Vendors",
    screenSub: "40+ vendors near you",
  },
  {
    num: "03",
    title: "Connect",
    headline: "Video chat with actual neighbours",
    description: "MtaaLoop Connect lets you randomly match with people in your building for live video chats. Build community, not just transactions.",
    icon: Video,
    screenBg: "from-emerald-50 to-teal-50",
    screenTitle: "MtaaLoop Connect",
    screenSub: "Live with your neighbours",
  },
  {
    num: "04",
    title: "Sell",
    headline: "Become a vendor in 2 minutes",
    description: "List your products or services and start earning from every neighbour in your building. Zero setup fees, instant reach.",
    icon: Store,
    screenBg: "from-amber-50 to-orange-50",
    screenTitle: "Start Selling",
    screenSub: "Reach your whole building",
  },
];

export const StickyShowcase = () => {
  const [activeStep, setActiveStep] = useState(0);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    triggerRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(i);
        },
        { threshold: 0.6 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const step = steps[activeStep];

  return (
    <section className="relative bg-[#1a1035] text-white">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
          {/* Left */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <MtaaLoopOrbit size={40} />
              <span className="text-sm font-semibold text-white/60 tracking-widest uppercase">How It Works</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <span className="text-6xl font-black text-white/10">{step.num}</span>
                <h3 className="text-4xl md:text-5xl font-black leading-tight">{step.headline}</h3>
                <p className="text-lg text-white/60 max-w-md leading-relaxed">{step.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress pills */}
            <div className="flex gap-2 pt-4">
              {steps.map((s, i) => (
                <div
                  key={s.num}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeStep
                      ? "w-10 h-3 bg-primary"
                      : "w-3 h-3 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right — phone */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <PhoneMockup featured label={step.title}>
                  <div className={`w-full h-full bg-gradient-to-br ${step.screenBg} flex flex-col items-center justify-center p-6 text-center`}>
                    <step.icon className="w-12 h-12 text-primary mb-4" />
                    <h4 className="text-lg font-bold text-foreground">{step.screenTitle}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{step.screenSub}</p>
                  </div>
                </PhoneMockup>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scroll triggers */}
      <div className="relative z-10">
        {steps.map((_, i) => (
          <div
            key={i}
            ref={(el) => { triggerRefs.current[i] = el; }}
            className="h-screen"
          />
        ))}
      </div>
    </section>
  );
};
