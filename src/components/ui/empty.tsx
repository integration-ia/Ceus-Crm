import React from "react";
import { cn } from "~/lib/utils";

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactElement;
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ title, description, icon, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-6 p-8 md:p-12",
          className,
        )}
      >
        {React.cloneElement(icon, {
          className: "h-24 w-24 text-gray-400 dark:text-gray-500",
        })}
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    );
  },
);

Empty.displayName = "Empty";

export default Empty;
