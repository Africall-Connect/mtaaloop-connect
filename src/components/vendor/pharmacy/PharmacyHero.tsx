import { ShieldCheck, Clock, UserRound, Upload, MessageCircle } from "lucide-react";
import { VendorWithProducts } from "@/types/database";
import { usePrescriptionUpload } from "./usePrescriptionUpload";

interface PharmacyHeroProps {
  vendor: VendorWithProducts;
}

/**
 * Parse vendor.open_hours and try to extract a closing time for "today".
 * Defensive: vendor_hours data is heterogeneous — fall back gracefully.
 */
function getOnDutyString(openHours: string | null | undefined): string {
  if (!openHours) return "On duty today";
  // Try to find a time that looks like "until 9pm" or "9:00 PM" or "21:00"
  const match = openHours.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/
  );
  if (match) return `On duty until ${match[1]}`;
  return "On duty today";
}

function buildWhatsAppLink(phone: string | null | undefined): string {
  const raw = (phone ?? "").replace(/\D/g, "");
  if (!raw) return "#";
  // Kenyan phone normalization: 07xx -> 2547xx
  let normalized = raw;
  if (normalized.startsWith("0")) normalized = "254" + normalized.slice(1);
  if (normalized.startsWith("7") || normalized.startsWith("1"))
    normalized = "254" + normalized;
  const message = encodeURIComponent(
    "Hi, I'd like to speak with a pharmacist about a health concern."
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export function PharmacyHero({ vendor }: PharmacyHeroProps) {
  const { inputRef, triggerPicker, handleChange } = usePrescriptionUpload(
    vendor.id
  );

  const onDuty = getOnDutyString(vendor.open_hours);
  const waLink = buildWhatsAppLink(
    vendor.business_phone || (vendor as { whatsapp_business?: string }).whatsapp_business
  );

  return (
    <section
      className="rounded-2xl border px-6 py-8 md:px-10 md:py-12 mb-6"
      style={{
        background: "var(--vendor-surface)",
        borderColor: "color-mix(in srgb, var(--vendor-primary) 15%, transparent)",
      }}
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.business_name}
                className="w-14 h-14 rounded-full object-cover border"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--vendor-primary) 20%, transparent)",
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "color-mix(in srgb, var(--vendor-primary) 10%, transparent)",
                  color: "var(--vendor-primary)",
                }}
              >
                <ShieldCheck className="h-7 w-7" />
              </div>
            )}
            <div>
              <h1
                className="text-2xl md:text-4xl font-semibold tracking-tight"
                style={{
                  fontFamily: "var(--vendor-font-display)",
                  color: "var(--vendor-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {vendor.business_name}
              </h1>
              {vendor.tagline && (
                <p
                  className="text-sm md:text-base mt-1"
                  style={{ color: "var(--vendor-primary)", opacity: 0.6 }}
                >
                  {vendor.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              Licensed pharmacy
            </TrustPill>
            <TrustPill icon={<Clock className="h-3.5 w-3.5" />}>
              {vendor.delivery_time || "Within the hour"}
            </TrustPill>
            <TrustPill icon={<UserRound className="h-3.5 w-3.5" />}>
              {onDuty}
            </TrustPill>
          </div>
        </div>

        {/* RIGHT — CTAs */}
        <div className="flex flex-col gap-3 md:min-w-[260px]">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--vendor-primary)" }}
          >
            <MessageCircle className="h-4 w-4" />
            Talk to a pharmacist
          </a>
          <button
            type="button"
            onClick={triggerPicker}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-medium border bg-transparent transition-colors"
            style={{
              borderColor:
                "color-mix(in srgb, var(--vendor-primary) 30%, transparent)",
              color: "var(--vendor-primary)",
            }}
          >
            <Upload className="h-4 w-4" />
            Upload prescription
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
    </section>
  );
}

function TrustPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
      style={{
        borderColor:
          "color-mix(in srgb, var(--vendor-primary) 20%, transparent)",
        color: "var(--vendor-primary)",
        background:
          "color-mix(in srgb, var(--vendor-primary) 4%, transparent)",
      }}
    >
      <span style={{ color: "var(--vendor-accent)" }}>{icon}</span>
      {children}
    </span>
  );
}
