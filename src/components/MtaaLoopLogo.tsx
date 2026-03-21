import { useEffect, useState } from "react";

const PURPLE = "hsl(var(--primary))";
const NAVY = "hsl(var(--foreground))";
const AMBER = "hsl(var(--accent))";
const LIGHT = "hsl(var(--primary-glow))";

// ── Variant 1: Orbit spin
export function MtaaLoopOrbit({ size = 120 }: { size?: number }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => { setDeg(d => (d + 0.6) % 360); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const sat = {
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.42}
        fill="none" stroke={LIGHT} strokeWidth="1.5"
        style={{ transform: `rotate(-20deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.42}
        fill="none" stroke={PURPLE} strokeWidth="1" strokeDasharray="4 4"
        style={{ transform: `rotate(70deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={size * 0.18} fill={PURPLE} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.13}
        fontWeight="700" fill="#fff" fontFamily="Georgia,serif">ML</text>
      <circle cx={sat.x} cy={sat.y} r={size * 0.07} fill={AMBER} />
    </svg>
  );
}

// ── Variant 2: Pin pulse
export function MtaaLoopPin({ size = 120 }: { size?: number }) {
  const [scale, setScale] = useState(1);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setScale(s => {
        const next = s + dir * 0.015;
        if (next >= 1.12) setDir(-1);
        if (next <= 0.92) setDir(1);
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [dir]);
  const cx = size / 2, r = size * 0.32;
  const cy = size * 0.42;
  const pinBot = (y: number) => y + r + size * 0.18;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g style={{ transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy + r * 0.5}px`, transition: "transform 0.05s" }}>
        <circle cx={cx} cy={cy} r={r} fill={PURPLE} />
        <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r={r * 0.13} fill="#fff" />
        <polygon
          points={`${cx},${pinBot(cy)} ${cx - r * 0.38},${cy + r * 0.7} ${cx + r * 0.38},${cy + r * 0.7}`}
          fill={PURPLE}
        />
      </g>
      <ellipse cx={cx} cy={size * 0.9} rx={size * 0.18} ry={size * 0.04}
        fill={NAVY} opacity="0.15"
        style={{ transform: `scaleX(${0.7 + (scale - 0.92) * 1.2})`, transformOrigin: `${cx}px ${size * 0.9}px` }}
      />
      <circle cx={cx + r * 0.55} cy={cy - r * 0.55} r={size * 0.06} fill={AMBER}
        style={{ transform: `scale(${1.4 - scale * 0.35})`, transformOrigin: `${cx + r * 0.55}px ${cy - r * 0.55}px` }}
      />
    </svg>
  );
}

// ── Variant 3: Network connect
export function MtaaLoopNetwork({ size = 120 }: { size?: number }) {
  const [active, setActive] = useState(0);
  const nodes = [
    { x: size * 0.18, y: size * 0.5 },
    { x: size * 0.5, y: size * 0.18 },
    { x: size * 0.82, y: size * 0.5 },
    { x: size * 0.5, y: size * 0.82 },
    { x: size * 0.5, y: size * 0.5 },
  ];
  const edges: [number, number][] = [[0,4],[1,4],[2,4],[3,4],[0,1],[1,2],[2,3],[3,0]];
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % nodes.length), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke={active === a || active === b ? PURPLE : LIGHT}
          strokeWidth={active === a || active === b ? 2 : 1}
          style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y}
          r={i === 4 ? size * 0.1 : size * 0.07}
          fill={active === i ? AMBER : i === 4 ? PURPLE : NAVY}
          style={{ transition: "fill 0.3s" }}
        />
      ))}
    </svg>
  );
}

// ── Variant 4: M icon write-on
export function MtaaLoopM({ size = 120 }: { size?: number }) {
  const [offset, setOffset] = useState(300);
  useEffect(() => {
    let v = 300;
    const id = setInterval(() => {
      v = Math.max(0, v - 4);
      setOffset(v);
      if (v === 0) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size * 0.08} y={size * 0.08} width={size * 0.84} height={size * 0.84}
        rx={size * 0.18} fill={PURPLE} />
      <path
        d={`M${size*0.22},${size*0.72} L${size*0.22},${size*0.28} L${size*0.5},${size*0.58} L${size*0.78},${size*0.28} L${size*0.78},${size*0.72}`}
        fill="none" stroke="#fff" strokeWidth={size * 0.065}
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="300" strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.02s" }}
      />
      <path
        d={`M${size*0.28},${size*0.82} Q${size*0.5},${size*0.94} ${size*0.72},${size*0.82}`}
        fill="none" stroke={AMBER} strokeWidth={size * 0.04}
        strokeLinecap="round"
        strokeDasharray="120" strokeDashoffset={Math.max(0, offset - 100)}
      />
    </svg>
  );
}

// ── Variant 5: Wordmark type-on
export function MtaaLoopWordmark({ height = 72 }: { height?: number }) {
  const full = "MtaaLoop";
  const [shown, setShown] = useState(0);
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    if (shown < full.length) {
      const id = setTimeout(() => setShown(s => s + 1), 80);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(id);
  }, [shown]);
  const part1 = full.slice(0, Math.min(shown, 4));
  const part2 = shown > 4 ? full.slice(4, shown) : "";
  return (
    <svg width={height * 3.2} height={height} viewBox={`0 0 ${height * 3.2} ${height}`}>
      <text y={height * 0.72} fontFamily="Georgia,serif" fontWeight="700"
        fontSize={height * 0.62} fill={NAVY} letterSpacing="-1">
        {part1}
      </text>
      <text x={height * 1.58} y={height * 0.72} fontFamily="Georgia,serif" fontWeight="700"
        fontSize={height * 0.62} fill={PURPLE} letterSpacing="-1">
        {part2}
        {shown < full.length && cursor ? "|" : ""}
      </text>
      {shown >= full.length && (
        <text x={0} y={height * 0.98} fontFamily="system-ui,sans-serif"
          fontSize={height * 0.18} fill={AMBER} letterSpacing="2">
          YOUR NEIGHBORHOOD CONNECTED
        </text>
      )}
    </svg>
  );
}
