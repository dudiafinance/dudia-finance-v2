import { Skeleton } from "@/components/ui/skeleton";

export function CreditCardSkeleton() {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8">
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border/50 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                  <Skeleton className="h-1 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-px flex-1" />
          </div>

          <div className="bg-background rounded-lg border border-border/50 p-6 shadow-precision">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <Skeleton className="h-8 w-64 rounded-md" />
              <div className="flex gap-3">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-36 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-48 mx-auto rounded-md" />
          </div>

          <div className="bg-background rounded-lg border border-border/50 overflow-hidden shadow-precision">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="divide-y divide-border/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
