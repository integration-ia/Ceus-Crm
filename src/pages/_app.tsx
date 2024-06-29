import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";

import { api } from "~/utils/api";

import { type ReactNode } from "react";
import "~/styles/globals.css";
import { Toaster } from "~/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    typeof document !== "undefined"
  ) {
    document.documentElement.classList.add("dark");
  } else {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
  }

  typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches }) => {
        if (matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
  const getLayout =
    (Component as unknown as { getLayout: (page: ReactNode) => ReactNode })
      .getLayout ?? ((page: unknown) => page);

  return (
    <SessionProvider session={session}>
      <main className={`font-sans ${inter.variable}`}>
        {getLayout(<Component {...pageProps} />)}
      </main>
      <Toaster />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
