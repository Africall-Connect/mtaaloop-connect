// No className prop by design — that's what caused the original bug.
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TermsAgreementCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  /** "compact" = inline. "card" = padded bordered box (Checkout). */
  variant?: "compact" | "card";
  id?: string;
}

export function TermsAgreementCheckbox({
  checked,
  onCheckedChange,
  children,
  variant = "compact",
  id,
}: TermsAgreementCheckboxProps) {
  const reactId = React.useId();
  const inputId = id ?? `terms-${reactId}`;

  // Make the entire row clickable so users can tap anywhere — much easier on mobile.
  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't double-toggle when clicking the actual checkbox or a link inside the label
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[role="checkbox"]')) return;
    onCheckedChange(!checked);
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none",
        variant === "card" &&
          "px-4 py-4 border-2 border-primary/60 bg-primary/5 rounded-lg shadow-sm hover:bg-primary/10 transition-colors min-h-[56px]",
      )}
    >
      <Checkbox
        id={inputId}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
      />
      <Label
        htmlFor={inputId}
        className={cn(
          "cursor-pointer leading-relaxed text-foreground flex-1",
          variant === "card" ? "text-base font-medium" : "text-sm",
        )}
      >
        {children}
      </Label>
    </div>
  );
}
