import React from "react";
import { cn } from "~/lib/utils";

interface GreeterProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle: string;
}

const Greeter = React.forwardRef<HTMLDivElement, GreeterProps>(
  ({ children, className, title, subtitle }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-col justify-between gap-8 md:flex-row md:gap-0",
          className,
        )}
        ref={ref}
      >
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="flex gap-4 align-middle">{children}</div>
      </div>
    );
  },
);

Greeter.displayName = "Greeter";

export default Greeter;
