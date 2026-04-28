import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface LiquorAgeGateProps {
  vendorId: string;
}

/**
 * Self-attested 18+ gate for liquor archetype storefronts.
 * - Per-vendor session storage key
 * - Not dismissible by Esc, outside-click, or URL params
 * - "No" routes back to /home
 */
export function LiquorAgeGate({ vendorId }: LiquorAgeGateProps) {
  const navigate = useNavigate();
  const storageKey = `liquor_age_verified_${vendorId}`;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });

  // Block scroll while modal is open and trap Escape
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  if (!open) return null;

  const accept = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const decline = () => {
    navigate("/home");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="liquor-age-gate-title"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 md:p-10 text-center"
        style={{
          background: "var(--vendor-surface)",
          borderColor: "color-mix(in srgb, var(--vendor-accent) 35%, transparent)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
        }}
      >
        <h2
          id="liquor-age-gate-title"
          className="text-3xl md:text-4xl mb-4 leading-tight"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 500,
            color: "#F5E6D3",
            letterSpacing: "-0.01em",
          }}
        >
          Are you 18 or older?
        </h2>
        <p
          className="text-sm md:text-base mb-8"
          style={{ color: "#F5E6D3", opacity: 0.8 }}
        >
          By Kenyan law, you must be 18+ to view or purchase alcohol.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={accept}
            className="w-full rounded-lg py-3 px-6 text-base font-medium transition-colors duration-300"
            style={{
              background: "var(--vendor-primary)",
              color: "#F5E6D3",
            }}
          >
            Yes, I'm 18+
          </button>
          <button
            onClick={decline}
            className="w-full rounded-lg py-3 px-6 text-base font-medium border transition-colors duration-300"
            style={{
              background: "transparent",
              color: "var(--vendor-accent)",
              borderColor: "var(--vendor-accent)",
            }}
          >
            No, take me back
          </button>
        </div>

        <p
          className="text-xs mt-6"
          style={{ color: "#F5E6D3", opacity: 0.6 }}
        >
          We do not sell to minors. ID may be required on delivery.
        </p>
      </div>
    </div>
  );
}

export default LiquorAgeGate;
