import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-secondary/80", className)} />
  );
}

/** Pre-composed skeleton that matches the Dashboard layout */
export function DashboardSkeleton() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        {/* Balance */}
        <div className="mt-12 space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-14 w-64" />
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background p-6 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-3 w-36" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border/30">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/30 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pre-composed skeleton for the Reports page */
export function ReportsSkeleton() {
  return (
    <div className="w-full">
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-background p-6 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-36" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-3 w-40" />
            <div className="border border-border/50 rounded-lg p-8 space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
