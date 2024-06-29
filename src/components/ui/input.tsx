import React from "react";
import { cn } from "~/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, iconLeft, iconRight, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {iconLeft && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 transform">
            {iconLeft}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            iconLeft ? "pl-8" : "",
            iconRight ? "pr-8" : "",
            className,
          )}
          ref={ref}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 transform">
            {iconRight}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
