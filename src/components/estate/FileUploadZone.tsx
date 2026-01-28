import { useCallback, useState } from "react";
import { Upload, X, File, Image as ImageIcon, FileText, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

interface FileUploadZoneProps {
  acceptedFileTypes?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  title: string;
  description: string;
  required?: boolean;
  onFilesChange: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
}

export function FileUploadZone({
  acceptedFileTypes = "image/*,.pdf,.doc,.docx",
  maxFiles = 5,
  maxSizeMB = 5,
  title,
  description,
  required = false,
  onFilesChange,
  existingFiles = [],
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      const validFiles = fileArray.filter((file) => {
        if (file.size > maxSizeBytes) {
          toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
          return false;
        }
        return true;
      });

      if (files.length + validFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const processedFiles: UploadedFile[] = validFiles.map((file) => {
        const fileObj: UploadedFile = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          type: file.type,
        };

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileObj.preview = e.target?.result as string;
            setFiles((prev) => [...prev]);
          };
          reader.readAsDataURL(file);
        }

        return fileObj;
      });

      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, maxFiles, maxSizeMB, onFilesChange]
  );

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {title}
            {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {files.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {files.length} / {maxFiles}
          </Badge>
        )}
      </div>

      <Card
        className={`border-2 border-dashed transition-all ${
          isDragOver
            ? "border-primary bg-primary/5"
            : files.length > 0
            ? "border-green-500 bg-green-500/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {files.length > 0 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>
          <p className="text-sm font-medium mb-2">
            {files.length > 0 ? "Upload more files" : "Drop files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {acceptedFileTypes.split(",").join(", ")} (max {maxSizeMB}MB each)
          </p>
          <input
            type="file"
            id={`file-upload-${title}`}
            className="hidden"
            accept={acceptedFileTypes}
            multiple={maxFiles > 1}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-upload-${title}`)?.click()}
            disabled={files.length >= maxFiles}
          >
            Choose Files
          </Button>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="grid gap-3">
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-start gap-3">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
