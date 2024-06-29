import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const MyBusinessMenuSkeleton = () => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-8 w-full rounded-md" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="mb-3 h-4 w-10/12" />
          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <Skeleton className="h-4 w-8/12" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="mb-3 h-4 w-full" />

          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <Skeleton className="h-4 w-8/12" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="mb-3 h-4 w-full" />
          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <Skeleton className="h-4 w-8/12" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBusinessMenuSkeleton;
