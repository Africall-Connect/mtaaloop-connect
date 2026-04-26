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

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        variant === "card" &&
          "px-3 py-3 border border-primary/30 bg-card rounded-lg shadow-sm md:px-4 md:py-4",
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
          "cursor-pointer leading-relaxed text-foreground",
          variant === "card" ? "text-base font-medium" : "text-sm",
        )}
      >
        {children}
      </Label>
    </div>
  );
}
