// src/components/ui/skeleton.tsx

import * as React from "react";
import { cn } from "@/lib/utils"; // Assumindo que você tem um utility function 'cn' (como o de shadcn/ui)

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  );
}

export { Skeleton };