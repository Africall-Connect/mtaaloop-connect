import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const CartoonIllustrations = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Parallax layers — slower = deeper background feel
  const y1 = useTransform(scrollY, [0, 2000], [0, -120]); // slowest
  const y2 = useTransform(scrollY, [0, 2000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 2000], [0, -80]);
  const y4 = useTransform(scrollY, [0, 2000], [0, -300]); // fastest parallax
  const y5 = useTransform(scrollY, [0, 2000], [0, -160]);

  const rotate1 = useTransform(scrollY, [0, 2000], [0, 25]);
  const rotate2 = useTransform(scrollY, [0, 2000], [0, -15]);
  const scale1 = useTransform(scrollY, [0, 1000], [1, 1.15]);
  const scale2 = useTransform(scrollY, [0, 1500], [1, 0.85]);

  return (
    <div ref={ref} className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      {/* Deep background layer — very slow */}
      <motion.div
        className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full opacity-40"
        style={{
          y: y1,
          rotate: rotate1,
          scale: scale1,
          background: "radial-gradient(circle, hsl(220 70% 85%) 0%, hsl(220 60% 90% / 0.3) 100%)",
        }}
        animate={{ x: [0, 60, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Mid-deep layer */}
      <motion.div
        className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] rounded-full opacity-35"
        style={{
          y: y2,
          scale: scale2,
          background: "radial-gradient(circle, hsl(210 65% 80%) 0%, hsl(220 50% 85% / 0.2) 100%)",
        }}
        animate={{ x: [0, -50, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Mid layer — medium speed */}
      <motion.div
        className="absolute top-[20%] right-[10%] w-[150px] h-[150px] rounded-2xl opacity-30"
        style={{
          y: y3,
          rotate: rotate2,
          background: "radial-gradient(circle, hsl(340 60% 85%) 0%, hsl(340 50% 90% / 0.2) 100%)",
        }}
        animate={{ x: [0, 40, -20, 0], rotate: [0, 15, -10, 0] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Closer layer — faster parallax */}
      <motion.div
        className="absolute bottom-[30%] left-[5%] w-[120px] h-[120px] rounded-full opacity-25"
        style={{
          y: y4,
          background: "radial-gradient(circle, hsl(45 70% 85%) 0%, hsl(45 60% 90% / 0.2) 100%)",
        }}
        animate={{ x: [0, 35, -15, 0] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Foreground accent — moves most */}
      <motion.div
        className="absolute top-[60%] right-[20%] w-[80px] h-[80px] rounded-full opacity-20"
        style={{
          y: y5,
          background: "radial-gradient(circle, hsl(260 50% 85%) 0%, hsl(260 40% 90% / 0.2) 100%)",
        }}
        animate={{ x: [0, -25, 40, 0] }}
        transition={{ duration: 17, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Extra depth orbs */}
      <motion.div
        className="absolute top-[40%] left-[40%] w-[60px] h-[60px] rounded-full opacity-15"
        style={{
          y: useTransform(scrollY, [0, 2000], [0, -250]),
          background: "radial-gradient(circle, hsl(180 50% 80%) 0%, transparent 100%)",
        }}
        animate={{ x: [0, 20, -30, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <motion.div
        className="absolute top-[10%] left-[60%] w-[100px] h-[100px] rounded-full opacity-20"
        style={{
          y: useTransform(scrollY, [0, 2000], [0, -180]),
          background: "radial-gradient(circle, hsl(220 80% 88%) 0%, transparent 100%)",
        }}
        animate={{ x: [0, -40, 20, 0] }}
        transition={{ duration: 19, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </div>
  );
};
