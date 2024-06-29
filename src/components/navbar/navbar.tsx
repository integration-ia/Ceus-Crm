import { AvatarFallback } from "@radix-ui/react-avatar";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { cn, getCloudflareImage } from "~/lib/utils";
import { Avatar, AvatarImage } from "../ui/avatar";
import BoringAvatar from "boring-avatars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

type NavbarProps = {
  urlList: {
    to: string;
    label: string;
    canAccess: boolean;
  }[];
};

const Navbar = ({ urlList }: NavbarProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  const user = session.data?.user;

  if (!user) {
    return null;
  }

  return (
    <nav className="dark:border-gray-850 sticky top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-stone-50 px-4 dark:border-stone-900 dark:bg-stone-950 md:px-6">
      <div className="mr-4 hidden items-center md:mr-8 md:flex">
        <Link
          className="flex items-center text-lg font-bold tracking-tighter md:text-base"
          href="/"
        >
          <Image
            src="/assets/ceus-logo-dark.webp"
            alt="Image"
            width="133"
            height="44"
            className="invert dark:invert-0"
          />
          <span className="sr-only">CEUS CRM</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="hidden space-x-4 md:flex">
          {urlList.map((url) => (
            <Link
              key={url.to}
              href={url.to}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                currentPath === url.to
                  ? "border-b-2 border-yellow-400 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {url.label}
            </Link>
          ))}
        </nav>
      </div>
      <Sheet open={isNavbarOpen} onOpenChange={setIsNavbarOpen}>
        <SheetTrigger asChild>
          <div className="flex w-full justify-between md:hidden">
            <Image
              src="/assets/ceus-icon-dark.webp"
              alt="Image"
              width="32"
              height="36"
              className="invert dark:invert-0"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent side="right">
          <nav className="flex h-full flex-col justify-between gap-6 text-lg font-medium">
            <div className="flex items-center justify-between gap-4 pt-4">
              <Link
                href="/"
                onClick={() => setIsNavbarOpen(false)}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Image
                  src="/assets/ceus-logo-dark.webp"
                  alt="Image"
                  width="151"
                  height="50"
                  className="invert dark:invert-0"
                />
                <span className="sr-only">CEUS Web</span>
              </Link>
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <Avatar>
                    <AvatarImage
                      src={getCloudflareImage(user.picture, "thumbnail")}
                      alt="@shadcn"
                    />
                    <AvatarFallback>
                      {user.firstName?.at(0) ?? "" + user.lastName?.at(0) ?? ""}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <BoringAvatar
                    size={44}
                    name={user.email ?? "Not defined"}
                    variant="beam"
                    colors={["#FACC15", "#FDE68A", "#FBBF24", "#CA8A04"]}
                  />
                )}
                <p className="text-xs">{user.name ?? "Not defined"}</p>
              </div>
            </div>
            <div className="flex flex-grow flex-col gap-6">
              {urlList.map((url) => (
                <Link
                  key={url.to}
                  href={url.to}
                  onClick={() => setIsNavbarOpen(false)}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    currentPath === url.to
                      ? "border-b-2 border-yellow-400 pb-1 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {url.label}
                </Link>
              ))}
              <Link
                href={"/my-account"}
                onClick={() => setIsNavbarOpen(false)}
                className={cn(
                  "transition-colors hover:text-foreground",
                  currentPath === "/my-account"
                    ? "border-b-2 border-yellow-400 pb-1 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                Configuración
              </Link>
            </div>

            <Button
              variant="outline"
              onClick={() => signOut()}
              className="text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
            >
              Cerrar sesión
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="ml-auto hidden items-center space-x-4 md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              {user.picture ? (
                <Avatar>
                  <AvatarImage
                    src={getCloudflareImage(user.picture, "thumbnail")}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CP</AvatarFallback>
                </Avatar>
              ) : (
                <BoringAvatar
                  size={44}
                  name={user.email ?? "Not defined"}
                  variant="beam"
                  colors={["#FACC15", "#FDE68A", "#FBBF24", "#CA8A04"]}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push("/my-account").catch(console.error);
              }}
            >
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={() => signOut()}
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
