import { useEffect, useState, useRef } from "react";

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      idRef.current++;
      const point = { x: e.clientX, y: e.clientY, id: idRef.current };
      setTrail(prev => [...prev.slice(-12), point]);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const checkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("a, button, [role='button'], input, textarea, select, [data-clickable]");
      setHovering(!!isInteractive);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", checkHover);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", checkHover);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // Clean old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => prev.slice(-8));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`*, *::before, *::after { cursor: none !important; }`}</style>

      {/* Trail particles */}
      {trail.map((point, i) => (
        <div
          key={point.id}
          className="pointer-events-none fixed z-[99998] rounded-full"
          style={{
            left: point.x - 3,
            top: point.y - 3,
            width: 6 + i * 0.5,
            height: 6 + i * 0.5,
            background: `radial-gradient(circle, hsl(220 90% 60% / ${0.1 + i * 0.04}), transparent)`,
            animation: "cursor-trail-fade 0.5s ease-out forwards",
          }}
        />
      ))}

      {/* Outer ring */}
      <div
        className="pointer-events-none fixed z-[99999] rounded-full border-2 transition-all duration-200 ease-out"
        style={{
          left: pos.x - (hovering ? 24 : 18),
          top: pos.y - (hovering ? 24 : 18),
          width: hovering ? 48 : 36,
          height: hovering ? 48 : 36,
          borderColor: clicking
            ? "hsl(220 90% 65%)"
            : hovering
            ? "hsl(25 85% 60%)"
            : "hsl(220 90% 55% / 0.5)",
          background: clicking
            ? "hsl(220 90% 55% / 0.1)"
            : hovering
            ? "hsl(25 85% 60% / 0.08)"
            : "transparent",
          transform: clicking ? "scale(0.85)" : "scale(1)",
          mixBlendMode: "difference" as const,
        }}
      />

      {/* Inner dot */}
      <div
        className="pointer-events-none fixed z-[99999] rounded-full transition-all duration-75"
        style={{
          left: pos.x - (clicking ? 5 : 4),
          top: pos.y - (clicking ? 5 : 4),
          width: clicking ? 10 : 8,
          height: clicking ? 10 : 8,
          background: hovering
            ? "hsl(25 85% 60%)"
            : "hsl(220 90% 55%)",
          boxShadow: `0 0 ${hovering ? 16 : 10}px ${hovering ? "hsl(25 85% 60% / 0.5)" : "hsl(220 90% 55% / 0.4)"}`,
        }}
      />

      <style>{`
        @keyframes cursor-trail-fade {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.2); }
        }
      `}</style>
    </>
  );
};
