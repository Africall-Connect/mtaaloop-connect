import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TermsAgreementCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  /** "compact" = inline small. "card" = large prominent agreement button (Checkout). */
  variant?: "compact" | "card";
  id?: string;
}

/**
 * Large, unmistakable agreement control.
 * The entire box is a button — tapping anywhere toggles agreement.
 * Unchecked: bold dashed amber border + "Tap to agree" hint.
 * Checked:   solid green border + filled checkmark badge.
 */
export function TermsAgreementCheckbox({
  checked,
  onCheckedChange,
  children,
  variant = "compact",
  id,
}: TermsAgreementCheckboxProps) {
  const reactId = React.useId();
  const inputId = id ?? `terms-${reactId}`;

  const toggle = () => onCheckedChange(!checked);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  // Stop link clicks from toggling the checkbox
  const handleLabelClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) e.stopPropagation();
  };

  if (variant === "compact") {
    return (
      <div
        id={inputId}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex items-start gap-3 cursor-pointer select-none min-h-[44px] py-1"
      >
        <div
          className={cn(
            "mt-0.5 h-6 w-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors",
            checked
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-foreground/60 hover:border-primary",
          )}
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </div>
        <div onClick={handleLabelClick} className="text-sm leading-relaxed text-foreground flex-1">
          {children}
        </div>
      </div>
    );
  }

  // === CARD variant: big, obvious tappable agreement panel ===
  return (
    <button
      type="button"
      id={inputId}
      role="checkbox"
      aria-checked={checked}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full text-left rounded-xl border-2 p-4 sm:p-5 transition-all duration-200",
        "flex items-start gap-4 min-h-[72px] cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        checked
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-500 border-dashed hover:bg-amber-100 dark:hover:bg-amber-950/50 animate-pulse-slow",
      )}
    >
      {/* Big visual checkbox */}
      <div
        className={cn(
          "h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all",
          checked
            ? "bg-emerald-500 border-emerald-500 text-white scale-100"
            : "bg-white border-amber-600 text-transparent",
        )}
      >
        <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3.5} />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-xs font-bold uppercase tracking-wider mb-1",
            checked ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400",
          )}
        >
          {checked ? "✓ Agreed" : "👆 Tap here to agree"}
        </div>
        <div
          onClick={handleLabelClick}
          className="text-sm sm:text-base font-medium leading-relaxed text-foreground"
        >
          {children}
        </div>
      </div>
    </button>
  );
}
