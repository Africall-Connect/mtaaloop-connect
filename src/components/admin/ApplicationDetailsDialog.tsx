import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

interface ApplicationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** The full row from the database (vendor_profiles, rider_profiles, estates, etc.) */
  data: Record<string, any> | null;
  /** Optional file/document URL fields to render as clickable links */
  documentFields?: string[];
}

const HIDDEN_KEYS = new Set([
  "id",
  "user_id",
  "created_at",
  "updated_at",
  "estates",
  "vendor_profiles",
]);

const formatLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
  }
  // Try to detect URLs
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
        Open <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  // Detect ISO dates
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export function ApplicationDetailsDialog({
  open,
  onOpenChange,
  title,
  data,
  documentFields = [],
}: ApplicationDetailsDialogProps) {
  if (!data) return null;

  const downloadJson = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${data.id?.slice(0, 8) || "details"}.json`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) {
      toast.error("Download failed");
    }
  };

  // Build entries list — meta fields first, hidden fields excluded
  const entries = Object.entries(data).filter(
    ([key, value]) => !HIDDEN_KEYS.has(key) && value !== undefined
  );

  // Find any document URL fields
  const documentLinks = documentFields
    .map((field) => ({ field, url: data[field] }))
    .filter((d) => d.url && typeof d.url === "string");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Meta strip */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {data.id && <span>ID: <span className="font-mono">{String(data.id).slice(0, 8)}</span></span>}
            {data.created_at && <span>· Submitted: {new Date(data.created_at).toLocaleString()}</span>}
          </div>

          {/* Document links (if any) */}
          {documentLinks.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Uploaded Documents</div>
              <div className="flex flex-wrap gap-2">
                {documentLinks.map(({ field, url }) => (
                  <a
                    key={field}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline px-3 py-1.5 bg-background rounded-md border"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {formatLabel(field)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Field table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {entries.map(([key, value], i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-3 py-2 font-medium text-muted-foreground w-1/3 align-top">
                      {formatLabel(key)}
                    </td>
                    <td className="px-3 py-2 break-words align-top">{formatValue(key, value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={downloadJson}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
