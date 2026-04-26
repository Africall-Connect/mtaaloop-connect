# Add QR Code to Polished MtaaLoop PDF

## Goal
Generate a new version of the polished overview PDF (`MtaaLoop_Overview_v3.pdf`) that includes a crisp, scannable QR code linking to the MtaaLoop site, and verify it renders clearly in both the PDF and image QA exports.

## QR Code Target
- **URL encoded:** `https://mtaaloop.lovable.app` (the published site, which serves as the contact/landing page)
- If you'd prefer a different URL (e.g. a `/contact` route, WhatsApp link, or custom domain), let me know before I run — otherwise I'll use the published URL above.

## Implementation Steps

1. **Install dependencies** (in the sandbox, not the project)
   - `qrcode[pil]` for QR generation
   - Reuse existing `reportlab` and `Pillow` already used by the v2 script

2. **Generate the QR asset**
   - Use `qrcode.QRCode` with:
     - `error_correction=ERROR_CORRECT_H` (30% redundancy → still scans if a logo overlay is added later)
     - `box_size=20`, `border=2` (high resolution PNG so it stays sharp at any print size)
     - Brand colors: deep navy foreground (`#0F172A`) on white background for maximum scanner contrast (avoids the brand blue, which can reduce contrast on some scanners)
   - Save to `/tmp/mtaaloop_qr.png` at ~1000×1000 px

3. **Update the PDF builder script** (`/tmp/build_mtaaloop_pdf.py` → v3)
   - Add a new "Connect With Us" panel on the final page (Who We Serve / Contact page) containing:
     - The QR code image (~1.6 inch / ~115 pt square — large enough to scan from a phone camera held ~20 cm away)
     - Caption: **"Scan to visit MtaaLoop"**
     - Sub-caption with the plain URL underneath so it works even if the QR fails to scan
   - Place it in a two-column layout next to the Royal Suburbs flagship callout so it doesn't push other content off the page
   - Render the QR via `reportlab.platypus.Image` with explicit `width`/`height` in points (no auto-scaling, which can blur edges)

4. **Output**
   - Write final PDF to `/mnt/documents/MtaaLoop_Overview_v3.pdf`
   - Emit a `<lov-artifact>` tag for download

## QA Plan (mandatory)
1. Convert every page to JPEG with `pdftoppm -jpeg -r 150 output.pdf page`
2. Inspect each page image with `code--view`, specifically checking the QR page for:
   - QR is sharp (no blurry/anti-aliased edges from over-scaling)
   - Strong black/white contrast, no color tinting that would defeat scanners
   - Quiet zone (white border) preserved around the QR
   - QR not overlapping any text, callout box, or page edge
   - Caption + fallback URL visible directly beneath
3. Re-check every other page to confirm the layout change didn't push content, break the cover, or shift the footer
4. If the QR looks soft in the JPEG, regenerate at higher `box_size` and re-embed at the same point dimensions, then re-QA
5. Summarize QA findings (issues found + fixes, or explicit "no issues found") in the final reply

## Deliverable
- `MtaaLoop_Overview_v3.pdf` in `/mnt/documents/`, surfaced via `<lov-artifact>` so you can preview and download it directly.
