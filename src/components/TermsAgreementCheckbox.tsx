import * as React from "react";
import { Check, ShieldCheck } from "lucide-react";
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
 *
 * Unchecked: amber dashed border, empty checkbox, "Tap to accept" CTA.
 * Checked:   solid green PANEL, white check in filled circle, "AGREED" label.
 *
 * The checked vs unchecked states differ in border style, background fill,
 * checkbox fill, icon visibility, label text AND label color — so the state
 * is obvious even with reduced color vision.
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
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "bg-background border-foreground/60 hover:border-primary",
          )}
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3.5} />}
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
        "w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200",
        "flex items-center gap-4 min-h-[80px] cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300",
        checked
          // CHECKED: bold solid green PANEL, white text — impossible to miss.
          ? "bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-500/30"
          // UNCHECKED: amber dashed border with subtle pulse.
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-500 border-dashed text-foreground hover:bg-amber-100 dark:hover:bg-amber-950/50 animate-pulse",
      )}
    >
      {/* Big visual checkbox / badge */}
      <div
        className={cn(
          "h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full border-2 flex items-center justify-center transition-all",
          checked
            ? "bg-white border-white text-emerald-600 scale-110"
            : "bg-white border-amber-600 text-transparent",
        )}
      >
        {checked ? (
          <Check className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={4} />
        ) : (
          <ShieldCheck className="h-6 w-6 text-amber-500" strokeWidth={2.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-1",
            checked ? "text-white" : "text-amber-700 dark:text-amber-400",
          )}
        >
          {checked ? "✓ AGREED — Terms accepted" : "👆 Tap here to accept"}
        </div>
        <div
          onClick={handleLabelClick}
          className={cn(
            "text-sm sm:text-base font-medium leading-snug",
            checked ? "text-white/95" : "text-foreground",
          )}
        >
          {children}
        </div>
        {checked && (
          <div className="mt-1 text-[11px] sm:text-xs text-white/85 font-medium">
            You can now place your order. Tap again to undo.
          </div>
        )}
      </div>
    </button>
  );
}
