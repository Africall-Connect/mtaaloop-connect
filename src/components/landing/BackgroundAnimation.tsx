import { motion } from "framer-motion";

export const BackgroundAnimation = () => {
  const circles = Array.from({ length: 10 });

  const circleVariants = {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: (i: number) => ({
      scale: [0, 1, 0],
      opacity: [0, 0.3, 0],
      x: Math.random() * 100 - 50 + "vw",
      y: Math.random() * 100 - 50 + "vh",
      transition: {
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        delay: i * 1.5,
      },
    }),
  };

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {circles.map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={circleVariants}
          initial="initial"
          animate="animate"
          className="absolute rounded-full bg-gradient-to-br from-primary/20 to-red-50/20"
          style={{
            width: Math.random() * 200 + 100,
            height: Math.random() * 200 + 100,
          }}
        />
      ))}
    </div>
  );
};
