import { useEffect, useRef, useCallback } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  age: number;
  hue: number;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  vx: number;
  vy: number;
  hue: number;
  size: number;
}

export const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const cursor = useRef({ x: -100, y: -100 });
  const trail = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const clicking = useRef(false);
  const hovering = useRef(false);
  const hue = useRef(220);
  const rafId = useRef(0);
  const lastMouse = useRef({ x: 0, y: 0 });

  const isTouchDevice = useRef(
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smooth follow — fast response
    const ease = hovering.current ? 0.45 : 0.35;
    cursor.current.x += (mouse.current.x - cursor.current.x) * ease;
    cursor.current.y += (mouse.current.y - cursor.current.y) * ease;

    // Shift hue
    hue.current = (hue.current + 0.25) % 360;

    // Speed check for trail
    const dx = mouse.current.x - lastMouse.current.x;
    const dy = mouse.current.y - lastMouse.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    lastMouse.current = { ...mouse.current };

    // Add trail particles based on speed
    if (speed > 1) {
      const count = Math.min(Math.floor(speed / 4), 3);
      for (let i = 0; i < count; i++) {
        trail.current.push({
          x: cursor.current.x + (Math.random() - 0.5) * 6,
          y: cursor.current.y + (Math.random() - 0.5) * 6,
          age: 0,
          vx: (Math.random() - 0.5) * 1.5 - dx * 0.05,
          vy: (Math.random() - 0.5) * 1.5 - dy * 0.05,
          hue: (hue.current + Math.random() * 60) % 360,
          size: Math.random() * 2 + 1.5,
        });
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ===== RIPPLES =====
    ripples.current.forEach((r) => {
      r.age += 1;
      r.radius += (r.maxRadius - r.radius) * 0.08;
      const life = 1 - r.age / 50;
      if (life <= 0) return;

      // Outer ring
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue}, 85%, 65%, ${life * 0.6})`;
      ctx.lineWidth = 2 * life;
      ctx.stroke();

      // Inner soft fill
      const rGrad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
      rGrad.addColorStop(0, `hsla(${r.hue}, 90%, 70%, ${life * 0.15})`);
      rGrad.addColorStop(1, `hsla(${r.hue}, 85%, 60%, 0)`);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.fillStyle = rGrad;
      ctx.fill();
    });
    ripples.current = ripples.current.filter((r) => r.age < 50);

    // ===== TRAIL PARTICLES =====
    trail.current.forEach((p) => {
      p.age += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      const life = 1 - p.age / 45;
      if (life <= 0) return;

      const s = p.size * life;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${life * 0.08})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${life * 0.7})`;
      ctx.fill();
    });
    trail.current = trail.current.filter((p) => p.age < 45);

    const cx = cursor.current.x;
    const cy = cursor.current.y;

    // ===== OUTER ORBITAL RING =====
    const ringSize = hovering.current ? 30 : 22;
    const ringAlpha = clicking.current ? 0.9 : 0.35;
    const ringHue = hovering.current ? 25 : hue.current;

    // Dashed orbit
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, ringSize + (clicking.current ? -5 : 0), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${ringHue}, 80%, 60%, ${ringAlpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // ===== SPINNING ARCS =====
    const time = Date.now() * 0.003;
    for (let i = 0; i < 4; i++) {
      const angle = time + (i * Math.PI * 2) / 4;
      const arcSize = hovering.current ? 24 : 16;
      ctx.beginPath();
      ctx.arc(cx, cy, arcSize, angle, angle + 0.6);
      ctx.strokeStyle = `hsla(${(hue.current + i * 30) % 360}, 90%, 68%, 0.6)`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // ===== CROSSHAIR LINES =====
    const chLen = hovering.current ? 8 : 5;
    const chGap = hovering.current ? 14 : 10;
    ctx.strokeStyle = `hsla(${hue.current}, 70%, 65%, 0.3)`;
    ctx.lineWidth = 1;
    for (let a = 0; a < 4; a++) {
      const ang = (a * Math.PI) / 2 + time * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * chGap, cy + Math.sin(ang) * chGap);
      ctx.lineTo(cx + Math.cos(ang) * (chGap + chLen), cy + Math.sin(ang) * (chGap + chLen));
      ctx.stroke();
    }

    // ===== CENTER DOT =====
    const dotSize = clicking.current ? 6 : 3.5;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotSize * 4);
    gradient.addColorStop(0, `hsla(${hue.current}, 100%, 80%, 1)`);
    gradient.addColorStop(0.3, `hsla(${hue.current}, 90%, 65%, 0.4)`);
    gradient.addColorStop(1, `hsla(${hue.current}, 80%, 55%, 0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, dotSize * 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue.current}, 95%, 85%, 1)`;
    ctx.shadowColor = `hsla(${hue.current}, 100%, 70%, 0.8)`;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

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
    const down = (e: MouseEvent) => {
      clicking.current = true;
      // Spawn ripple + burst particles
      ripples.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: 50 + Math.random() * 30,
        age: 0,
        hue: hue.current,
      });
      // Burst particles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
        const spd = 2 + Math.random() * 3;
        trail.current.push({
          x: e.clientX,
          y: e.clientY,
          age: 0,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          hue: (hue.current + i * 10) % 360,
          size: 2 + Math.random() * 2,
        });
      }
    };
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
      />
    </>
  );
};
