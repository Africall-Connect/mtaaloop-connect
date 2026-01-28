import { motion } from "framer-motion";

export const VendorIllustration = () => {
  return (
    <motion.div
      className="relative w-64 h-64"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 w-32 h-40 bg-blue-300 rounded-t-full"
        style={{ x: "-50%", y: "-50%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full"
        style={{ x: "-100%", y: "-100%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full"
        style={{ x: "0%", y: "-100%" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-16 h-4 bg-gray-800 rounded-full"
        style={{ x: "-50%", y: "-20%" }}
        animate={{
          scaleY: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.5,
        }}
      />
    </motion.div>
  );
};
