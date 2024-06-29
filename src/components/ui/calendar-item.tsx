import { FlagTriangleLeft, Mail, PhoneCall, Users } from "lucide-react";
import { cn } from "~/lib/utils";
import { Checkbox } from "./checkbox";

type Props = {
  title: string;
  dueDate: Date;
  variant: "pending" | "overdue" | "completed";
  type: "phone" | "email" | "meet" | "other";
};

const getIconFromType = (type: Props["type"]) => {
  switch (type) {
    case "phone":
      return <PhoneCall className="h-5 w-5" />;
    case "email":
      return <Mail className="h-5 w-5" />;
    case "meet":
      return <Users className="h-5 w-5" />;
    case "other":
      return <FlagTriangleLeft className="h-5 w-5" />;
  }
};

const getOutlineColorFromVariant = (variant: Props["variant"]) => {
  switch (variant) {
    case "pending":
      return "border-yellow-600";
    case "overdue":
      return "border-red-600";
    case "completed":
      return "border-green-600";
  }
};

const CalendarItem = ({ title, dueDate, variant, type }: Props) => {
  return (
    <div
      className={cn(
        "flex justify-between rounded-sm border-2 px-4 py-4 dark:bg-stone-800",
        getOutlineColorFromVariant(variant),
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          className={cn(
            "h-7 w-7 rounded-3xl",
            getOutlineColorFromVariant(variant),
          )}
        />
        {getIconFromType(type)}
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <p className="ml-4 text-right text-sm">{title}</p>
        <div className="flex justify-end">
          <p className="text-xs text-stone-600 dark:text-stone-500">
            {dueDate.toDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalendarItem;
