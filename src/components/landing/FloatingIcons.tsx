import { motion } from "framer-motion";
import { Coffee, ShoppingBag, Car, UtensilsCrossed, Sparkles, Heart } from "lucide-react";

export const FloatingIcons = () => {
  const icons = [
    { Icon: Coffee, top: "20%", left: "10%", duration: 18 },
    { Icon: ShoppingBag, top: "60%", left: "15%", duration: 22 },
    { Icon: Car, top: "40%", left: "85%", duration: 20 },
    { Icon: UtensilsCrossed, top: "70%", left: "80%", duration: 24 },
    { Icon: Sparkles, top: "30%", left: "20%", duration: 16 },
    { Icon: Heart, top: "50%", left: "90%", duration: 26 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, top, left, duration }, index) => (
        <motion.div
          key={index}
          className="absolute opacity-[0.07]"
          style={{ top, left }}
          animate={{
            y: [0, -15, 5, -10, 0],
            x: [0, 8, -5, 10, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: index * 1.5,
          }}
        >
          <Icon className="w-16 h-16 text-primary" />
        </motion.div>
      ))}
    </div>
  );
};
