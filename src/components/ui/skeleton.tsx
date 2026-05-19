// ============================================================
// Skeleton Loader — Loading State Placeholder
// ============================================================

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

/** Pre-built skeleton for flight cards */
export function FlightCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-20" />
        <div className="space-y-1 text-right">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for booking cards */
export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-10 w-16" />
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
  );
}
