import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { type PropsWithChildren } from "react";
import Navbar from "~/components/navbar/navbar";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

const CmsLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  if (!session.data && session.status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-100 dark:bg-stone-950">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/assets/ceus-logo-hires-solid.webp"
            alt="CEUS logo"
            width={211}
            height={300}
            className="invert dark:invert-0"
          />
          <div className="flex items-center space-x-2">
            <p className="text-lg font-medium">Cargando...</p>
          </div>
          <LoadingSpinner className="mt-4 h-12 w-12" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        urlList={[
          { to: "/dashboard", label: "Escritorio", canAccess: true },
          { to: "/my-properties", label: "Mis inmuebles", canAccess: true },
          {
            to: "/clients",
            label: "Clientes",
            canAccess: session.data?.user?.fullClientAccess ?? false,
          },
          { to: "/calendar", label: "Agenda", canAccess: true },
          { to: "/users", label: "Usuarios", canAccess: true },
          { to: "/my-business", label: "Mi empresa", canAccess: true },
        ]}
      />
      <main className="flex flex-col gap-4 p-4 md:p-6">{children}</main>
    </>
  );
};

export default CmsLayout;
