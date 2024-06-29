import React from "react";
import { Skeleton } from "../ui/skeleton";

const TableSkeleton = () => {
  return (
    <table className="w-full">
      <thead>
        <tr className="flex items-center space-x-4">
          <th>
            <Skeleton className="h-4 w-1/4" />
          </th>
          <th>
            <Skeleton className="h-4 w-1/4" />
          </th>
          <th>
            <Skeleton className="h-4 w-1/4" />
          </th>
          <th>
            <Skeleton className="h-4 w-1/4" />
          </th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="flex items-center space-x-4">
            <td>
              <Skeleton className="h-4 w-1/4" />
            </td>
            <td>
              <Skeleton className="h-4 w-1/4" />
            </td>
            <td>
              <Skeleton className="h-4 w-1/4" />
            </td>
            <td>
              <Skeleton className="h-4 w-1/4" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableSkeleton;
