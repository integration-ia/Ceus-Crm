import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface DashboardStatProps {
  title: string;
  value: number;
  percentage?: number;
}

const DashboardStat = ({ title, value, percentage }: DashboardStatProps) => {
  return (
    <Card className="bg-stone-50 lg:w-full">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      {percentage && value ? (
        <CardContent>
          <div
            className={cn(
              "text-xs font-bold text-muted-foreground",
              percentage >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {(percentage >= 0 ? "+" : "") + percentage.toFixed(2)}% comparado al
            mes anterior
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default DashboardStat;
