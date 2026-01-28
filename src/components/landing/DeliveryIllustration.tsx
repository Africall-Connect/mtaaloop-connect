import { motion } from "framer-motion";

export const DeliveryIllustration = () => {
  return (
    <motion.div
      className="relative w-64 h-64"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-300 rounded-full"
        style={{ x: "-50%", y: "-50%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full"
        style={{ x: "-50%", y: "-150%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-800 rounded-full"
        style={{ x: "-100%", y: "-150%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-800 rounded-full"
        style={{ x: "0%", y: "-150%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-12 h-3 bg-gray-800 rounded-full"
        style={{ x: "-50%", y: "-100%" }}
        animate={{
          scaleY: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />
    </motion.div>
  );
};
