import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { usePrescriptionUpload } from "./usePrescriptionUpload";

interface Props {
  vendorId: string;
}

/**
 * Bottom sticky bar prompting prescription upload. Hides on mobile when
 * scrolling down, reappears on scroll up. Always visible on desktop.
 */
export function PharmacyStickyUploadBar({ vendorId }: Props) {
  const { inputRef, triggerPicker, handleChange } =
    usePrescriptionUpload(vendorId);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      // Only auto-hide on mobile widths
      if (window.innerWidth >= 768) {
        setHidden(false);
        return;
      }
      const y = window.scrollY;
      if (y > lastY && y > 80) setHidden(true);
      else if (y < lastY) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-sm transition-transform duration-300 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
      style={{
        background:
          "color-mix(in srgb, var(--vendor-primary) 8%, var(--vendor-surface))",
        borderColor:
          "color-mix(in srgb, var(--vendor-primary) 20%, transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 md:gap-6">
        <p
          className="flex-1 text-xs md:text-sm leading-snug"
          style={{ color: "var(--vendor-primary)" }}
        >
          Have a prescription? Upload it and a pharmacist will fulfil your order.
        </p>
        <button
          type="button"
          onClick={triggerPicker}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: "var(--vendor-primary)" }}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
