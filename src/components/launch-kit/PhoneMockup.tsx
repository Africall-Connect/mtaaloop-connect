import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  featured?: boolean;
  label?: string;
  className?: string;
}

export const PhoneMockup = ({ children, featured = false, label, className }: PhoneMockupProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "relative rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden shadow-2xl transition-all duration-500",
          featured
            ? "w-[220px] h-[450px] md:w-[260px] md:h-[530px] shadow-[0_20px_60px_-10px_hsl(var(--primary)/0.4)]"
            : "w-[180px] h-[370px] md:w-[210px] md:h-[430px]"
        )}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-gray-900 rounded-b-2xl z-20" />
        {/* Screen content */}
        <div className="w-full h-full overflow-hidden bg-background rounded-[2rem]">
          {children}
        </div>
      </div>
      {label && (
        <span className={cn(
          "text-sm font-semibold tracking-wide",
          featured ? "text-primary" : "text-muted-foreground"
        )}>
          {label}
        </span>
      )}
    </div>
  );
};
