import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";

type EntranceStyle = "wave-left" | "wave-right" | "spiral" | "drop" | "flip" | "zoom-rotate" | "diagonal" | "elastic";

const entranceStyles: EntranceStyle[] = [
  "wave-left", "wave-right", "spiral", "drop", "flip", "zoom-rotate", "diagonal", "elastic"
];

function getEntrance(style: EntranceStyle, index: number) {
  const delay = index * 0.07;
  const sp = { type: "spring" as const };
  switch (style) {
    case "wave-left":
      return {
        initial: { x: -120, opacity: 0, rotateY: 25 },
        animate: { x: 0, opacity: 1, rotateY: 0 },
        transition: { ...sp, stiffness: 60, damping: 14, delay },
      };
    case "wave-right":
      return {
        initial: { x: 120, opacity: 0, rotateY: -25 },
        animate: { x: 0, opacity: 1, rotateY: 0 },
        transition: { ...sp, stiffness: 60, damping: 14, delay },
      };
    case "spiral":
      return {
        initial: { scale: 0.3, opacity: 0, rotate: 180 + index * 30 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        transition: { ...sp, stiffness: 80, damping: 12, delay },
      };
    case "drop":
      return {
        initial: { y: -200, opacity: 0, scale: 0.5 },
        animate: { y: 0, opacity: 1, scale: 1 },
        transition: { ...sp, stiffness: 100, damping: 15, delay: delay + index * 0.04 },
      };
    case "flip":
      return {
        initial: { rotateX: 90, opacity: 0, y: 40 },
        animate: { rotateX: 0, opacity: 1, y: 0 },
        transition: { ...sp, stiffness: 70, damping: 16, delay },
      };
    case "zoom-rotate":
      return {
        initial: { scale: 0, opacity: 0, rotate: -90 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        transition: { ...sp, stiffness: 90, damping: 13, delay },
      };
    case "diagonal":
      return {
        initial: { x: index % 2 === 0 ? -80 : 80, y: 80, opacity: 0 },
        animate: { x: 0, y: 0, opacity: 1 },
        transition: { ...sp, stiffness: 65, damping: 14, delay },
      };
    case "elastic":
      return {
        initial: { scaleX: 0, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: { ...sp, stiffness: 120, damping: 10, delay },
      };
  }
}

interface ScrollAnimatedGridProps {
  children: React.ReactNode[];
  className?: string;
}

export const ScrollAnimatedGrid = ({ children, className }: ScrollAnimatedGridProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const style = useMemo(() => {
    return entranceStyles[Math.floor(Math.random() * entranceStyles.length)];
  }, []);

  return (
    <div ref={ref} className={className} style={{ perspective: 800 }}>
      {children.map((child, i) => {
        const { initial, animate, transition } = getEntrance(style, i);
        return (
          <motion.div
            key={i}
            initial={initial}
            animate={isInView ? animate : initial}
            transition={transition}
            style={{ transformOrigin: "center center" }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
};

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "random";
}

export const ScrollAnimatedSection = ({ children, className, direction = "random" }: ScrollAnimatedSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const dir = useMemo(() => {
    if (direction === "random") return Math.random() > 0.5 ? "left" : "right";
    return direction;
  }, [direction]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        x: dir === "left" ? -100 : 100,
        opacity: 0,
        rotateZ: dir === "left" ? -3 : 3,
      }}
      animate={
        isInView
          ? { x: 0, opacity: 1, rotateZ: 0 }
          : undefined
      }
      transition={{
        type: "spring" as const,
        stiffness: 50,
        damping: 15,
      }}
    >
      {children}
    </motion.div>
  );
};
