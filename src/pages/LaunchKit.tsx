import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MtaaLoopOrbit } from "@/components/MtaaLoopLogo";
import { FloatingIcons } from "@/components/landing/FloatingIcons";
import { PhoneMockup } from "@/components/launch-kit/PhoneMockup";
import { StickyShowcase } from "@/components/launch-kit/StickyShowcase";
import { SocialSnippetCard } from "@/components/launch-kit/SocialSnippetCard";
import {
  LogIn, Sparkles, Share2, ArrowRight,
  Home, Search, ShoppingCart, Video,
  Building2, Zap, Camera, Smartphone, Film, ImageIcon, Link2
} from "lucide-react";

// Reuse the same dreamy wave animations from HeroSection
const waveFromLeft = (delay: number) => ({
  initial: { x: -120, opacity: 0, scale: 0.95 } as const,
  whileInView: { x: 0, opacity: 1, scale: 1 } as const,
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 50, damping: 12, delay },
    opacity: { duration: 0.6, delay },
    scale: { duration: 0.5, delay: delay + 0.1 },
  },
});

const waveFromRight = (delay: number) => ({
  initial: { x: 120, opacity: 0, scale: 0.95 } as const,
  whileInView: { x: 0, opacity: 1, scale: 1 } as const,
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 50, damping: 12, delay },
    opacity: { duration: 0.6, delay },
    scale: { duration: 0.5, delay: delay + 0.1 },
  },
});

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

// ─── Phone screen placeholders ───
const DiscoverScreen = () => (
  <div className="w-full h-full bg-gradient-to-br from-amber-50 via-sky-50 to-rose-50 flex flex-col p-4 pt-8">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
        <Home className="w-3 h-3 text-primary" />
      </div>
      <span className="text-xs font-bold text-foreground">MtaaLoop</span>
    </div>
    <div className="w-full h-6 rounded-lg bg-gray-200/60 mb-3" />
    <div className="grid grid-cols-3 gap-1.5 mb-3">
      {["🍔", "💇", "🧹", "🛒", "💊", "🚗"].map((e, i) => (
        <div key={i} className="aspect-square rounded-xl bg-white/80 flex items-center justify-center text-lg shadow-sm">{e}</div>
      ))}
    </div>
    <div className="space-y-2 flex-1">
      {[1, 2].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-white/70 shadow-sm" />
      ))}
    </div>
  </div>
);

const BrowseScreen = () => (
  <div className="w-full h-full bg-white flex flex-col p-4 pt-8">
    <div className="text-xs font-bold text-foreground mb-3">Browse Vendors</div>
    <div className="space-y-2.5 flex-1">
      {[
        { name: "Mama's Kitchen", cat: "Food", color: "bg-orange-100" },
        { name: "Fresh Produce", cat: "Grocery", color: "bg-green-100" },
        { name: "Beauty by Jane", cat: "Beauty", color: "bg-pink-100" },
        { name: "Quick Fix", cat: "Repairs", color: "bg-blue-100" },
      ].map((v) => (
        <div key={v.name} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
          <div className={`w-8 h-8 rounded-lg ${v.color}`} />
          <div>
            <div className="text-[10px] font-bold text-foreground">{v.name}</div>
            <div className="text-[8px] text-muted-foreground">{v.cat}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrderScreen = () => (
  <div className="w-full h-full bg-white flex flex-col p-4 pt-8">
    <div className="text-xs font-bold text-foreground mb-3">Your Order</div>
    <div className="space-y-2 flex-1">
      <div className="flex justify-between items-center p-2 rounded-xl bg-gray-50">
        <span className="text-[10px] font-medium">Chapati × 3</span>
        <span className="text-[10px] font-bold text-primary">KSh 90</span>
      </div>
      <div className="flex justify-between items-center p-2 rounded-xl bg-gray-50">
        <span className="text-[10px] font-medium">Ugali + Fish</span>
        <span className="text-[10px] font-bold text-primary">KSh 250</span>
      </div>
      <div className="h-px bg-gray-200 my-1" />
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-bold">Total</span>
        <span className="text-xs font-black text-primary">KSh 340</span>
      </div>
    </div>
    <div className="mt-auto w-full py-2 rounded-xl bg-primary text-white text-center text-[10px] font-bold">
      Place Order
    </div>
  </div>
);

const ConnectScreen = () => (
  <div className="w-full h-full bg-[#1a1035] flex flex-col items-center justify-center p-4">
    <Video className="w-10 h-10 text-purple-400 mb-3" />
    <span className="text-xs font-bold text-white">MtaaLoop Connect</span>
    <span className="text-[9px] text-white/50 mt-1">Finding a neighbour...</span>
    <div className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center text-[10px] font-bold">
      Start Call
    </div>
  </div>
);

// ─── Main Page ───
const LaunchKit = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-rose-50">
      {/* ── SECTION 0: TOP BANNER ── */}
      <motion.div {...waveFromRight(0.1)} className="sticky top-0 z-50 mx-4 mt-4">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-3 px-6 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold tracking-wide text-sm md:text-base">
                🚀 MtaaLoop is Launching — Be the first vendor in your building
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="text-white hover:bg-white/20 border border-white/20 rounded-xl hidden sm:flex"
              >
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth/signup")}
                className="bg-white/20 text-white hover:bg-white/30 font-semibold border border-white/20 backdrop-blur-sm rounded-xl"
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 1: HERO POSTER ── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
        <FloatingIcons />

        <div className="container px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Badge */}
            <motion.div
              {...waveFromLeft(0.2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-sm font-semibold text-gray-700 shadow-sm"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Now Launching in Nairobi
            </motion.div>

            {/* Title */}
            <motion.h1
              {...waveFromRight(0.35)}
              className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95]"
            >
              <span className="block text-gray-900">Your Building.</span>
              <span className="block mt-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Your Launch.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...waveFromLeft(0.5)}
              className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
            >
              Every neighbour. Every vendor. Every building — connected through
              MtaaLoop. The hyperlocal marketplace launching across Nairobi.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...waveFromRight(0.65)}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth/signup")}
                className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                Claim Your Building — Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById("sticky-showcase");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-lg px-10 py-7 border-2 border-gray-300 text-gray-700 hover:border-gray-500 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                See How It Works <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 max-w-xl mx-auto">
              {[
                { value: "5–15min", label: "Delivery" },
                { value: "2,000+", label: "Residents" },
                { value: "40+", label: "Vendors" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  {...waveFromLeft(0.8 + i * 0.12)}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-sm"
                >
                  <div className="text-2xl md:text-3xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PHONE MOCKUP ROW ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-white/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeIn(0)} className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">App Preview</span>
            <h2 className="text-4xl md:text-6xl font-black mt-3">
              Built for your{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                building.
              </span>
            </h2>
          </motion.div>

          {/* Phone row */}
          <motion.div
            {...fadeIn(0.2)}
            className="flex flex-wrap justify-center items-end gap-4 md:gap-8"
          >
            <PhoneMockup label="Discover">
              <DiscoverScreen />
            </PhoneMockup>
            <PhoneMockup featured label="Browse">
              <BrowseScreen />
            </PhoneMockup>
            <PhoneMockup label="Order">
              <OrderScreen />
            </PhoneMockup>
            <PhoneMockup label="Connect">
              <ConnectScreen />
            </PhoneMockup>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              {
                emoji: "🏢",
                title: "Building-Level Discovery",
                desc: "Find vendors who share your lift",
              },
              {
                emoji: "⚡",
                title: "5–15 Minute Delivery",
                desc: "From your neighbour's door to yours",
              },
              {
                emoji: "📹",
                title: "MtaaLoop Connect",
                desc: "Live video chats with actual neighbours",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                {...fadeIn(0.3 + i * 0.1)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-sm text-center"
              >
                <span className="text-4xl">{card.emoji}</span>
                <h3 className="text-lg font-bold mt-3 text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: STICKY SCROLL SHOWCASE ── */}
      <div id="sticky-showcase">
        <StickyShowcase />
      </div>

      {/* ── SECTION 4: SOCIAL SNIPPETS GRID ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-amber-50 via-sky-50 to-rose-50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeIn(0)} className="text-center mb-4">
            <h2 className="text-4xl md:text-6xl font-black">
              Ready to{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                post.
              </span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Screenshot any card below. 1:1 ratio — Instagram, LinkedIn, Twitter, WhatsApp Status ready.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {(
              [
                "hero-dark",
                "stat-gradient",
                "feature-cream",
                "connect-dark",
                "vendor-white",
                "urgency-gradient",
              ] as const
            ).map((variant, i) => (
              <motion.div key={variant} {...fadeIn(0.1 + i * 0.08)}>
                <SocialSnippetCard variant={variant} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: INSTRUCTIONS ROW ── */}
      <section className="py-16 px-4 bg-white/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "📱", title: "Screenshot Phones", desc: "Capture the app previews above" },
              { emoji: "🎬", title: "Record with Loom", desc: "Screen-record the sticky scroll section" },
              { emoji: "📸", title: "Save Social Cards", desc: "Screenshot any 1:1 card above" },
              { emoji: "🔗", title: "Share the Page", desc: "Copy this link and send to anyone" },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                {...fadeIn(i * 0.1)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-sm text-center"
              >
                <span className="text-3xl">{card.emoji}</span>
                <h3 className="text-base font-bold mt-3 text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-amber-50 via-sky-50 to-rose-50">
        <motion.div {...fadeIn(0)} className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900">
            Ready to launch?
          </h2>
          <Button
            size="lg"
            onClick={() => navigate("/auth/signup")}
            className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            Claim Your Building — Free
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default LaunchKit;
