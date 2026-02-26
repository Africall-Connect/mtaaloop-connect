import { useEffect, useRef, useCallback } from "react";

export const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const cursor = useRef({ x: -100, y: -100 });
  const trail = useRef<{ x: number; y: number; age: number; vx: number; vy: number }[]>([]);
  const clicking = useRef(false);
  const hovering = useRef(false);
  const hue = useRef(220);
  const rafId = useRef(0);

  const isTouchDevice = useRef(
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smooth follow
    const ease = 0.15;
    cursor.current.x += (mouse.current.x - cursor.current.x) * ease;
    cursor.current.y += (mouse.current.y - cursor.current.y) * ease;

    // Shift hue slowly
    hue.current = (hue.current + 0.3) % 360;

    // Add trail particle
    const dx = mouse.current.x - cursor.current.x;
    const dy = mouse.current.y - cursor.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 1.5) {
      trail.current.push({
        x: cursor.current.x,
        y: cursor.current.y,
        age: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trail
    trail.current.forEach((p, i) => {
      p.age += 1;
      p.x += p.vx * 0.5;
      p.y += p.vy * 0.5;
      const life = 1 - p.age / 40;
      if (life <= 0) return;

      const size = life * (clicking.current ? 5 : 3.5);
      const particleHue = (hue.current + i * 8) % 360;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${particleHue}, 80%, 65%, ${life * 0.6})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${particleHue}, 90%, 70%, ${life * 0.1})`;
      ctx.fill();
    });

    // Remove dead particles
    trail.current = trail.current.filter(p => p.age < 40);

    const cx = cursor.current.x;
    const cy = cursor.current.y;

    // Outer ring — magnetic field effect
    const ringSize = hovering.current ? 28 : 20;
    const ringAlpha = clicking.current ? 0.8 : 0.4;
    const ringHue = hovering.current ? 25 : hue.current;

    ctx.beginPath();
    ctx.arc(cx, cy, ringSize + (clicking.current ? -4 : 0), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${ringHue}, 85%, 60%, ${ringAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner spinning arcs
    const time = Date.now() * 0.003;
    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2) / 3;
      const arcSize = hovering.current ? 22 : 15;
      ctx.beginPath();
      ctx.arc(cx, cy, arcSize, angle, angle + 0.8);
      ctx.strokeStyle = `hsla(${(hue.current + i * 40) % 360}, 90%, 65%, 0.5)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Center dot
    const dotSize = clicking.current ? 5 : 3;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotSize * 3);
    gradient.addColorStop(0, `hsla(${hue.current}, 90%, 70%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue.current}, 85%, 60%, 0.3)`);
    gradient.addColorStop(1, `hsla(${hue.current}, 80%, 55%, 0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, dotSize * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue.current}, 90%, 80%, 1)`;
    ctx.fill();

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isTouchDevice.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const down = () => { clicking.current = true; };
    const up = () => { clicking.current = false; };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hovering.current = !!t.closest("a, button, [role='button'], input, textarea, select, label, [data-clickable]");
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  if (isTouchDevice.current) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          *, *::before, *::after { cursor: none !important; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[99999]"
        style={{ mixBlendMode: "screen" }}
      />
    </>
  );
};
