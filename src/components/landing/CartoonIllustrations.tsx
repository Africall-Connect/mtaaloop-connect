import { motion } from "framer-motion";

export const CartoonIllustrations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <motion.div
        className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-blue-200 rounded-full opacity-50"
        animate={{
          x: [0, 60, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-blue-300 rounded-full opacity-50"
        animate={{
          x: [0, -50, 30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[20%] right-[10%] w-[150px] h-[150px] bg-pink-300 rounded-2xl opacity-40"
        animate={{
          x: [0, 40, -20, 0],
          rotate: [0, 15, -10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[30%] left-[5%] w-[120px] h-[120px] bg-yellow-200 rounded-full opacity-35"
        animate={{
          x: [0, 35, -15, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[60%] right-[20%] w-[80px] h-[80px] bg-purple-200 rounded-full opacity-30"
        animate={{
          x: [0, -25, 40, 0],
        }}
        transition={{
          duration: 17,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
