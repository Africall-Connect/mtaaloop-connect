import { useMemo } from "react";

const FLOWERS = ["🌸", "🌺", "🌷", "🌹", "🌻", "💐", "🪷", "🌼"];

interface Petal {
  emoji: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  swayAmount: number;
}

const FloatingFlowers = ({ count = 18 }: { count?: number }) => {
  const petals = useMemo<Petal[]>(() => {
    return Array.from({ length: count }, () => ({
      emoji: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      left: `${Math.random() * 100}%`,
      size: 16 + Math.random() * 20,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 12,
      opacity: 0.35 + Math.random() * 0.35,
      swayAmount: 20 + Math.random() * 40,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute animate-[float-down_var(--dur)_ease-in-out_infinite]"
          style={{
            left: p.left,
            top: "-40px",
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--sway": `${p.swayAmount}px`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};

export default FloatingFlowers;
