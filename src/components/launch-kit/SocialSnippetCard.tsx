import { MtaaLoopOrbit } from "@/components/MtaaLoopLogo";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "hero-dark" | "stat-gradient" | "feature-cream" | "connect-dark" | "vendor-white" | "urgency-gradient";

const HeroDark = () => (
  <div className="w-full h-full bg-[#1a1035] relative overflow-hidden flex flex-col justify-between p-6">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.3),transparent_70%)]" />
    <div className="relative z-10">
      <MtaaLoopOrbit size={36} />
    </div>
    <div className="relative z-10 space-y-2">
      <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">Your Building.</h3>
      <h3 className="text-3xl md:text-4xl font-black leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        Your Marketplace.
      </h3>
    </div>
    <p className="relative z-10 text-xs text-white/50 font-medium">Launching in Nairobi · mtaaloop.com</p>
  </div>
);

const StatGradient = () => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-6 text-center relative">
    <span className="text-6xl md:text-7xl font-black text-white">2,000+</span>
    <span className="text-white/80 font-semibold mt-2 text-sm">Residents Already Signed Up</span>
    <div className="w-12 h-px bg-white/30 my-4" />
    <p className="text-xs text-white/60">Join the building revolution. MtaaLoop.</p>
    <div className="absolute bottom-4 right-4 opacity-30">
      <MtaaLoopOrbit size={28} />
    </div>
  </div>
);

const FeatureCream = () => (
  <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
    <MtaaLoopOrbit size={32} />
    <span className="text-5xl mt-4">🏢</span>
    <h3 className="text-xl font-black text-gray-900 mt-3">Your Building. Your Marketplace.</h3>
    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
      From your neighbour's kitchen to your door in 5–15 minutes.
    </p>
    <span className="mt-4 inline-block px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold">
      Now Live in Nairobi
    </span>
  </div>
);

const ConnectDark = () => (
  <div className="w-full h-full bg-[#1a1035] flex flex-col items-center justify-center p-6 text-center">
    <span className="text-5xl">📹</span>
    <h3 className="text-2xl font-black text-white mt-4">Meet Your Neighbours. For Real.</h3>
    <p className="text-sm text-white/60 mt-2 leading-relaxed">
      MtaaLoop Connect — live video chats with people in your building.
    </p>
    <button className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg">
      Try It Now
    </button>
  </div>
);

const VendorWhite = () => (
  <div className="w-full h-full bg-white border border-purple-200/50 flex flex-col items-center justify-center p-6 text-center shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]">
    <span className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">40+</span>
    <span className="text-sm text-gray-500 font-semibold mt-1">Vendors Already Earning</span>
    <div className="w-10 h-px bg-gray-200 my-4" />
    <h4 className="text-lg font-bold text-gray-900">Are you a vendor?</h4>
    <p className="text-xs text-gray-500 mt-1">List your products and reach every neighbour in your building.</p>
    <button className="mt-4 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold">
      Become a Vendor →
    </button>
    <div className="mt-4 opacity-40">
      <MtaaLoopOrbit size={24} />
    </div>
  </div>
);

const UrgencyGradient = () => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-6 text-center relative">
    <span className="text-sm text-white/80 font-semibold">🚀 Limited Buildings Available</span>
    <h3 className="text-2xl md:text-3xl font-black text-white mt-4 leading-tight">
      Claim Your Building Before Someone Else Does.
    </h3>
    <button className="mt-6 px-6 py-2.5 rounded-full bg-white text-gray-900 text-sm font-bold shadow-lg">
      Claim Free →
    </button>
    <div className="absolute bottom-4 right-4 opacity-20">
      <MtaaLoopOrbit size={28} />
    </div>
  </div>
);

const variantMap: Record<Variant, React.FC> = {
  "hero-dark": HeroDark,
  "stat-gradient": StatGradient,
  "feature-cream": FeatureCream,
  "connect-dark": ConnectDark,
  "vendor-white": VendorWhite,
  "urgency-gradient": UrgencyGradient,
};

interface SocialSnippetCardProps {
  variant: Variant;
  className?: string;
}

export const SocialSnippetCard = ({ variant, className }: SocialSnippetCardProps) => {
  const Component = variantMap[variant];
  return (
    <div className={cn("group relative aspect-square rounded-2xl overflow-hidden shadow-lg", className)}>
      <Component />
      {/* Copy hint on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-gray-900 text-sm font-semibold shadow-lg">
          <Copy className="w-4 h-4" /> Screenshot to Save
        </span>
      </div>
    </div>
  );
};
