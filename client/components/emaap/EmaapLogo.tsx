import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmaapLogo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          isLight ? "bg-white text-primary" : "bg-primary text-white",
        )}
      >
        <Scale className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-lg font-extrabold tracking-tight",
            isLight ? "text-white" : "text-foreground",
          )}
        >
          DigiMaap
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider",
            isLight ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Legal Metrology, Govt. of India
        </span>
      </div>
      <span
        className={cn(
          "ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border",
          isLight
            ? "border-white/40 text-white/80"
            : "border-primary/30 text-primary",
        )}
        aria-hidden
        title="Government of India emblem"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <line
                key={i}
                x1="12"
                y1="12"
                x2="12"
                y2="4.2"
                stroke="currentColor"
                strokeWidth="0.6"
                transform={`rotate(${angle} 12 12)`}
              />
            );
          })}
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}
