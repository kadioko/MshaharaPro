import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <path
        d="M19 14h20l8 8v28H19V14Z"
        className="fill-primary-foreground/95"
      />
      <path d="M39 14v9h8" className="stroke-primary stroke-[3] stroke-linejoin-round" />
      <path
        d="M26 30h14M26 38h11"
        className="stroke-primary stroke-[3] stroke-linecap-round"
      />
      <path
        d="M44 34c3.8 1.4 6.4 2.2 8 2.4-.2 7.6-2.8 12.4-8 15-5.2-2.6-7.8-7.4-8-15 1.6-.2 4.2-1 8-2.4Z"
        className="fill-background stroke-primary stroke-[2.5] stroke-linejoin-round"
      />
      <path
        d="m40.5 43.2 2.4 2.4 5-6"
        className="stroke-primary stroke-[3] stroke-linecap-round stroke-linejoin-round"
      />
    </svg>
  );
}

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      {!compact ? (
        <div className="leading-none">
          <p className="font-semibold tracking-tight">MshaharaPro</p>
          <p className="mt-1 text-xs text-muted-foreground">Payroll. Compliance. Records.</p>
        </div>
      ) : null}
    </div>
  );
}
