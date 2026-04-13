import { Skeleton } from "@/components/ui/skeleton";

export function TransactionSkeleton() {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="px-6 py-8 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 border border-border/50 rounded-lg overflow-hidden mt-8">
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="bg-background p-5 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-xl rounded-md" />
          <Skeleton className="h-8 w-full md:w-auto rounded-md" />
        </div>

        <div className="space-y-10">
          {[1, 2, 3].map((group) => (
            <section key={group}>
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-px flex-1" />
              </div>
              <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/50">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-8 w-8 rounded shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-3.5 w-20 ml-auto" />
                      <Skeleton className="h-2 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
