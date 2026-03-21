import { z } from "zod";

// ── UUID Validation ───────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string | undefined | null): boolean {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function sanitizeUUID(value: string | undefined | null): string | null {
  if (!value || !isValidUUID(value)) return null;
  return value.toLowerCase();
}

// ── HTML Escaping (prevent XSS in dynamic HTML) ───────────────────
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str).replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// ── Text Sanitization ─────────────────────────────────────────────
/** Strip HTML tags and trim whitespace */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLength);
}

/** Sanitize for use as a slug */
export function sanitizeSlug(input: string, maxLength = 100): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}

// ── Number Validation ─────────────────────────────────────────────
export function sanitizePositiveNumber(value: string | number, fallback = 0): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num) || num < 0) return fallback;
  return num;
}

export function sanitizePositiveInt(value: string | number, fallback = 0): number {
  const num = typeof value === "string" ? parseInt(value, 10) : Math.floor(value);
  if (isNaN(num) || !isFinite(num) || num < 0) return fallback;
  return num;
}

// ── URL Validation ────────────────────────────────────────────────
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isValidUrl(trimmed)) return null;
  return trimmed;
}

// ── File Validation ───────────────────────────────────────────────
const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".msi", ".scr", ".pif", ".com",
  ".vbs", ".js", ".wsh", ".wsf", ".ps1", ".sh", ".bash",
  ".php", ".asp", ".aspx", ".jsp", ".py", ".rb", ".pl",
  ".svg", // SVG can contain scripts
];

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
];

const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedMimes?: string[];
  blockDangerousExtensions?: boolean;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 5,
    allowedMimes = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOC_MIMES],
    blockDangerousExtensions = true,
  } = options;

  // Check size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File exceeds ${maxSizeMB}MB limit` };
  }

  // Check dangerous extensions
  if (blockDangerousExtensions) {
    const fileName = file.name.toLowerCase();
    const hasDangerous = DANGEROUS_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (hasDangerous) {
      return { valid: false, error: "This file type is not allowed" };
    }

    // Block double extensions (e.g., image.jpg.exe)
    const parts = fileName.split(".");
    if (parts.length > 2) {
      const innerExt = "." + parts[parts.length - 2];
      if (DANGEROUS_EXTENSIONS.includes(innerExt)) {
        return { valid: false, error: "This file type is not allowed" };
      }
    }
  }

  // Check MIME type
  if (allowedMimes.length > 0 && !allowedMimes.some((mime) => {
    if (mime.endsWith("/*")) {
      return file.type.startsWith(mime.replace("/*", "/"));
    }
    return file.type === mime;
  })) {
    return { valid: false, error: `File type ${file.type || "unknown"} is not allowed` };
  }

  // Zero-byte check
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
}

export const ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_MIMES;
export const ALLOWED_DOCUMENT_TYPES = ALLOWED_DOC_MIMES;

// ── Zod Schemas for common inputs ─────────────────────────────────
export const uuidSchema = z.string().regex(UUID_REGEX, "Invalid ID format");

export const searchQuerySchema = z
  .string()
  .trim()
  .max(200, "Search query too long")
  .transform((s) => sanitizeText(s, 200));

export const reviewSchema = z.object({
  food_rating: z.number().int().min(1).max(5),
  delivery_rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().transform((s) => s ? sanitizeText(s, 1000) : undefined),
});

export const disputeSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(500),
  details: z.string().trim().max(2000).optional(),
});

export const estateSchema = z.object({
  estateName: z.string().trim().min(2, "Name too short").max(100, "Name too long"),
  estateType: z.string().min(1),
  totalUnits: z.number().int().min(1).max(100000),
  location: z.string().trim().min(2).max(200),
  address: z.string().trim().min(2).max(300),
  postalCode: z.string().trim().max(20).optional(),
  county: z.string().min(1),
  description: z.string().trim().max(2000).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  price: z.number().positive("Price must be positive").max(10_000_000),
  stock_quantity: z.number().int().min(0).max(1_000_000),
  low_stock_threshold: z.number().int().min(0).max(1_000_000),
  is_available: z.boolean(),
  image_url: z.string().url().nullable().optional(),
});

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(100, "Category name too long")
  .regex(/^[a-zA-Z0-9\s&\-,.']+$/, "Category name contains invalid characters");
