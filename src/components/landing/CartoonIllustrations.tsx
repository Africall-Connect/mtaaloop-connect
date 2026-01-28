import { motion } from "framer-motion";

export const CartoonIllustrations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <motion.div
        className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-blue-200 rounded-full opacity-50"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-blue-300 rounded-full opacity-50"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -10, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute top-[20%] right-[10%] w-[150px] h-[150px] bg-pink-300 rounded-2xl opacity-50"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};
