import React from "react";
import { cn } from "~/lib/utils";

const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={cn("flex flex-col gap-8", className)}>
      {children}
    </div>
  );
});

PageContainer.displayName = "PageContainer";

export default PageContainer;
