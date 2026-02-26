import { motion } from "framer-motion";
import { CustomerIllustration } from "./CustomerIllustration";
import { VendorIllustration } from "./VendorIllustration";
import { DeliveryIllustration } from "./DeliveryIllustration";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 140 : -140, opacity: 0, scale: 0.9 },
  whileInView: { x: 0, opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 40, damping: 12, delay },
    opacity: { duration: 0.6, delay },
    scale: { type: "spring" as const, stiffness: 60, damping: 14, delay: delay + 0.08 },
  },
});

export const HowItWorksSection = () => {
  const steps = [
    {
      illustration: <CustomerIllustration />,
      title: "Claim Your Kingdom",
      description: "Pick your apartment complex. Instantly unlock a private marketplace that belongs to your building alone. No outsiders. No noise.",
      badge: "Step 1",
    },
    {
      illustration: <VendorIllustration />,
      title: "Uncover What's Hidden",
      description: "The best biryani in the city? Two floors up. That incredible juice bar? Right downstairs. Discover vendors you walk past every single day.",
      badge: "Step 2",
    },
    {
      illustration: <DeliveryIllustration />,
      title: "Blink. It's There.",
      description: "5 minutes. Not a promise — it's physics. When your vendor shares your staircase, delivery is a doorbell, not a wait.",
      badge: "Step 3",
    }
  ];

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.div {...waveIn(true, 0)} className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">How It Works</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Three Steps. That's It.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              {...waveIn(index % 2 === 0, 0.15 + index * 0.18)}
              className="text-center group"
            >
              <div className="relative mb-6">
                <div className="flex items-center justify-center">{step.illustration}</div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-2xl font-black mb-3 text-gray-900">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
