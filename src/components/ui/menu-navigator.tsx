import Link from "next/link";
import { cn } from "~/lib/utils";

interface MenuNavigatorProps {
  title: string;
  items: {
    label: string;
    onClick: () => void;
    isActive?: boolean;
  }[];
}

const MenuNavigator = ({ title, items }: MenuNavigatorProps) => {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg  p-4 md:min-h-[calc(100vh_-_theme(spacing.16))] md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
      </div>
      <nav className="grid gap-4 text-sm text-muted-foreground">
        {items.map(({ label, isActive, onClick }) => (
          <Link
            key={label}
            href="#"
            className={cn(
              "max-w-36 border-b-2 border-transparent pb-1 font-semibold",
              isActive ? "border-yellow-400 text-foreground" : "",
            )}
            onClick={onClick}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default MenuNavigator;
