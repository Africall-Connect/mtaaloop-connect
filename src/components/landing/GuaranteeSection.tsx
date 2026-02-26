import { Rocket, Heart, Shield, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 120 : -120, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 45, damping: 13, delay },
    opacity: { duration: 0.5, delay },
  },
});

export const GuaranteeSection = () => {
  const promises = [
    { icon: Rocket, title: "Ridiculously Fast", description: "Your vendor is upstairs. 5-15 minutes isn't a target — it's gravity.", gradient: "from-blue-500 to-cyan-400" },
    { icon: Heart, title: "People, Not Algorithms", description: "Every order strengthens your building's micro-economy. You're funding your neighbor's dream.", gradient: "from-pink-500 to-rose-400" },
    { icon: Shield, title: "M-PESA Locked Tight", description: "Military-grade security on every shilling. Verified, encrypted, instant.", gradient: "from-emerald-500 to-teal-400" },
    { icon: RefreshCw, title: "Yours & Yours Only", description: "A private marketplace that belongs exclusively to your apartment complex. No outsiders.", gradient: "from-purple-500 to-indigo-400" },
  ];

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.div {...waveIn(false, 0)} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-4">Our Promises</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Built on Trust. Backed by Neighbors.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              {...waveIn(index % 2 === 1, 0.12 + index * 0.12)}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="group relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white/60 shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${promise.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <promise.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">{promise.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{promise.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
