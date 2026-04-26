import type { VendorWithProducts } from "@/types/database";

const BLACK = "#000000";

interface Props {
  vendor: VendorWithProducts;
}

export function MiniMartStory({ vendor }: Props) {
  const story =
    vendor.story ||
    "The mart on the corner — open early, restocked daily, and the only place that always has airtime.";
  const neighbourCount = vendor.total_orders || 0;
  const showStat = neighbourCount >= 10;

  return (
    <section
      className="my-6 py-5"
      style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
        <p
          className="max-w-2xl"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 400,
            color: BLACK,
            fontSize: "clamp(0.95rem, 1.6vw, 1.0625rem)",
            lineHeight: 1.55,
          }}
        >
          {story}
        </p>
        {showStat && (
          <p
            className="text-sm whitespace-nowrap"
            style={{
              color: BLACK,
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 700,
            }}
          >
            {neighbourCount} regulars
          </p>
        )}
      </div>
    </section>
  );
}

export default MiniMartStory;
