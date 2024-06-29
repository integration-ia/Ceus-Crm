import { type SubscriptionTierEnum } from "@prisma/client";
import React from "react";
import { Badge } from "./badge";
import { cn, formatSubscriptionTiers } from "~/lib/utils";

interface SubscriptionBadgeProps
  extends Partial<Pick<HTMLDivElement, "className">> {
  subscription: SubscriptionTierEnum;
}

const SubscriptionBadge = ({
  subscription,
  className,
}: SubscriptionBadgeProps) => {
  // use a gradient gold
  return (
    <Badge
      className={cn(
        "border-yellow-700 bg-gradient-to-r from-yellow-200 to-yellow-600 text-black",
        className,
      )}
    >
      {formatSubscriptionTiers(subscription).label}
    </Badge>
  );
};

export default SubscriptionBadge;
