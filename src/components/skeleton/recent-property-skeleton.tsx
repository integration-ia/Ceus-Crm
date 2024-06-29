import React from "react";
import { Skeleton } from "../ui/skeleton";

const RecentPropertySkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
      <div className="flex w-full flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
};

export default RecentPropertySkeleton;
