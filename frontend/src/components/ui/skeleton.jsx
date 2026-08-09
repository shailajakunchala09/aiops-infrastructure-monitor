import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-white/5", className)}
      {...props}
    />
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="glass rounded-xl p-5">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonPanel({ height = 220 }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="p-5" style={{ height }}>
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
