import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;

    if (
      isAuth &&
      (!token?.firstName || !token?.lastName || !token?.organizationName) &&
      req.nextUrl.pathname !== "/welcome"
    ) {
      return NextResponse.redirect(new URL(`/welcome`, req.url));
    } else if (
      isAuth &&
      (!token?.firstName || !token?.lastName || !token?.organizationName) &&
      req.nextUrl.pathname === "/welcome"
    ) {
      return null;
    }

    if (req.nextUrl.pathname === "/" && isAuth) {
      return NextResponse.redirect(new URL(`/dashboard`, req.url));
    } else if (req.nextUrl.pathname === "/" && !isAuth) {
      return NextResponse.redirect(new URL(`/sign-in`, req.url));
    }

    const isAuthPage =
      req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/register") ||
      req.nextUrl.pathname.startsWith("/reset-password") ||
      req.nextUrl.pathname.startsWith("/welcome");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/sign-in?callbackUrl=${encodeURIComponent(from)}`, req.url),
      );
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/sign-in",
    "/register",
    "/",
    "/dashboard",
    "/reset-password/:resetToken*",
    "/welcome",
  ],
};
