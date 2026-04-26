import { cn } from "@/lib/utils";

const PLUM = "#3D2B2B";

export type SkinTypeFilter =
  | "all"
  | "oily"
  | "dry"
  | "combination"
  | "sensitive"
  | "all-skin";

const CHIPS: Array<{ key: SkinTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "oily", label: "Oily" },
  { key: "dry", label: "Dry" },
  { key: "combination", label: "Combination" },
  { key: "sensitive", label: "Sensitive" },
  { key: "all-skin", label: "All-skin" },
];

interface Props {
  value: SkinTypeFilter;
  onChange: (val: SkinTypeFilter) => void;
}

export function SkinTypeChips({ value, onChange }: Props) {
  return (
    <div
      id="skin-filter"
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
    >
      {CHIPS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap"
            )}
            style={
              active
                ? {
                    background: "var(--vendor-primary)",
                    color: PLUM,
                    border: "1px solid var(--vendor-primary)",
                  }
                : {
                    background: "transparent",
                    color: PLUM,
                    border:
                      "1px solid color-mix(in srgb, var(--vendor-primary) 40%, transparent)",
                  }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default SkinTypeChips;
