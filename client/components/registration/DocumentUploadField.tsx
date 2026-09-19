import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { CheckCircle2, FileText, UploadCloud, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type AllowedDocumentType = "pdf" | "jpg" | "png";

export interface DocumentUploadFieldProps {
  docType: string;
  label: string;
  allowedTypes: AllowedDocumentType[];
  maxSizeMb?: number;
  selectedFile?: File;
  onFileSelected: (file: File) => void;
}

const mimeTypes: Record<AllowedDocumentType, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  png: ["image/png"],
};

const typeLabels: Record<AllowedDocumentType, string> = {
  pdf: "PDF",
  jpg: "JPG",
  png: "PNG",
};

export function DocumentUploadField({
  docType,
  label,
  allowedTypes,
  maxSizeMb = 5,
  selectedFile,
  onFileSelected,
}: DocumentUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | undefined>(selectedFile);
  const [error, setError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    setFile(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setProgress(0);
      return;
    }

    setProgress(15);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(current + 25, 100);
      });
    }, 80);

    return () => window.clearInterval(timer);
  }, [file]);

  const accept = allowedTypes
    .flatMap((type) => (type === "pdf" ? [".pdf", mimeTypes[type][0]] : [`.${type}`, mimeTypes[type][0]]))
    .join(",");
  const acceptedLabel = allowedTypes.map((type) => typeLabels[type]).join(", ");

  const selectFile = (candidate?: File) => {
    if (!candidate) return;

    if (candidate.size > maxSizeMb * 1024 * 1024) {
      setFile(undefined);
      setProgress(0);
      setError(`File exceeds ${maxSizeMb}MB limit`);
      return;
    }

    const extension = candidate.name.split(".").pop()?.toLowerCase();
    const isAllowed = allowedTypes.some(
      (type) =>
        extension === type ||
        (type === "jpg" && extension === "jpeg") ||
        mimeTypes[type].includes(candidate.type),
    );

    if (!isAllowed) {
      setFile(undefined);
      setProgress(0);
      setError(`Unsupported file format. Use ${acceptedLabel}.`);
      return;
    }

    setError(undefined);
    setFile(candidate);
    onFileSelected(candidate);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        id={docType}
        role="button"
        tabIndex={0}
        aria-controls={inputId}
        aria-describedby={`${inputId}-hint`}
        aria-label={`Upload ${label}`}
        className={`rounded-lg border-2 border-dashed p-4 transition ${
          isDragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-destructive/60"
              : "border-[#C7CBD1] hover:border-primary"
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept={accept}
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="flex items-center gap-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          ) : file ? (
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {file?.name ?? label}
            </p>
            <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
              Drop a file here or click to browse ({acceptedLabel}, max {maxSizeMb}MB)
            </p>
            {file && (
              <p className="mt-1 text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
          {file && progress === 100 && (
            <Badge
              variant="outline"
              className="gap-1 border-green-600 text-green-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Ready
            </Badge>
          )}
        </div>
        {file && progress < 100 && (
          <Progress
            value={progress}
            className="mt-3 h-2"
            aria-label={`Preparing ${label}`}
          />
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
