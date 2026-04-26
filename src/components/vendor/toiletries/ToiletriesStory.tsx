import type { VendorWithProducts } from "@/types/database";

const PLUM = "#3D2B2B";

interface Props {
  vendor: VendorWithProducts;
}

export function ToiletriesStory({ vendor }: Props) {
  const story =
    vendor.story ||
    "Curated by Lisa for the Tsavo block — only what we'd put on our own skin.";
  const neighbourCount = vendor.total_orders || 0;
  const showStat = neighbourCount >= 10;

  return (
    <section
      className="my-8 py-6"
      style={{
        borderTop:
          "1px solid color-mix(in srgb, var(--vendor-primary) 25%, transparent)",
        borderBottom:
          "1px solid color-mix(in srgb, var(--vendor-primary) 25%, transparent)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p
          className="italic max-w-2xl"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 400,
            color: PLUM,
            fontSize: "clamp(1rem, 1.6vw, 1.125rem)",
            lineHeight: 1.6,
          }}
        >
          {story}
        </p>
        {showStat && (
          <p
            className="text-sm whitespace-nowrap"
            style={{ color: PLUM, opacity: 0.7 }}
          >
            {neighbourCount} neighbours
          </p>
        )}
      </div>
    </section>
  );
}

export default ToiletriesStory;
