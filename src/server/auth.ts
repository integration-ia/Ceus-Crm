import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "~/server/db";
import { compare } from "bcrypt";
import { env } from "~/env";
import { type SubscriptionTierEnum } from "@prisma/client";
import { getPermissionValuesForUser } from "~/lib/utils";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      name: string | undefined;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phoneNumber: string | null;
      subscriptionTier: SubscriptionTierEnum;
      countryCode: string | null;
      createdAt: Date;
      picture: string | null;
      organizationId: string;
      isAdmin: boolean;
      canCreateProperties: boolean;
      canCreateClients: boolean;
      fullClientAccess: boolean;
      fullPropertyAccess: boolean;
      canSeeGlobalStats: boolean;
      canExportClients: boolean;
      canDeleteClients: boolean;
      canDeleteProperties: boolean;
      canAssignProperties: boolean;
      organizationName: string | null;
      organizationDomain: string | null;
      organizationGeneratedDomain: string | null;
      // ...other properties
      // role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    phoneNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    subscriptionTier: SubscriptionTierEnum;
    countryCode: string | null;
    createdAt: Date;
    image: string | null;
    organizationId: string;
    isAdmin: boolean;
    canCreateProperties: boolean;
    canCreateClients: boolean;
    fullClientAccess: boolean;
    fullPropertyAccess: boolean;
    canSeeGlobalStats: boolean;
    canExportClients: boolean;
    canDeleteClients: boolean;
    canDeleteProperties: boolean;
    canAssignProperties: boolean;
    organizationName: string | null;
    organizationDomain: string | null;
    organizationGeneratedDomain: string | null;
    // ...other properties
    // role: UserRole;
  }

  interface JWT {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    phoneNumber: string | null;
    name: string | undefined;
    firstName: string | null;
    lastName: string | null;
    subscriptionTier: SubscriptionTierEnum;
    picture: string | null;
    sub: string;
    countryCode: string | null;
    createdAt: Date;
    organizationId: string;
    isAdmin: boolean;
    canCreateProperties: boolean;
    canCreateClients: boolean;
    fullClientAccess: boolean;
    fullPropertyAccess: boolean;
    canSeeGlobalStats: boolean;
    canExportClients: boolean;
    canDeleteClients: boolean;
    canDeleteProperties: boolean;
    canAssignProperties: boolean;
    organizationName: string | null;
    organizationDomain: string | null;
    organizationGeneratedDomain: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  pages: {
    signIn: "/sign-in",
    newUser: "/register",
    error: "/sign-in",
  },
  callbacks: {
    jwt: async ({ token, user: userToken }) => {
      if (token?.id) {
        console.info("Refreshing JWT token with user data from the database");

        if (!token?.firstName || !token?.lastName || !token?.organizationName) {
          const user = await db.user.findUnique({
            where: { id: token.id },
            include: {
              permissions: true,
              organization: {
                select: {
                  name: true,
                  customDomain: true,
                  generatedDomain: true,
                },
              },
            },
          });

          const permissions = getPermissionValuesForUser(
            user?.permissions ?? [],
          );

          if (user) {
            token.id = user.id;
            token.email = user.email;
            token.phoneNumber = user.phoneNumber;
            token.name =
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : undefined;
            token.firstName = user.firstName;
            token.lastName = user.lastName;
            token.subscriptionTier = user.subscriptionTier;
            token.countryCode = user.countryCode;
            token.createdAt = user.createdAt;
            token.picture = user.image;
            token.organizationId = user.organizationId;
            token.isAdmin = user.isAdmin;
            token.canCreateProperties = permissions.canCreateProperties;
            token.canCreateClients = permissions.canCreateClients;
            token.fullClientAccess = permissions.fullClientAccess;
            token.fullPropertyAccess = permissions.fullPropertyAccess;
            token.canSeeGlobalStats = permissions.canSeeGlobalStats;
            token.canExportClients = permissions.canExportClients;
            token.canDeleteClients = permissions.canDeleteClients;
            token.canDeleteProperties = permissions.canDeleteProperties;
            token.canAssignProperties = permissions.canAssignProperties;
            token.organizationName = user?.organization.name;
            token.organizationDomain = user?.organization.customDomain;
            token.organizationGeneratedDomain =
              user?.organization.generatedDomain;
          }

          return token;
        }
      }

      if (userToken) {
        token.id = userToken.id;
        token.email = userToken.email;
        token.phoneNumber = userToken.phoneNumber;
        token.name = userToken.name ?? undefined;
        token.firstName = userToken.firstName;
        token.lastName = userToken.lastName;
        token.subscriptionTier = userToken.subscriptionTier;
        token.countryCode = userToken.countryCode;
        token.createdAt = userToken.createdAt;
        token.picture = userToken.image;
        token.organizationId = userToken.organizationId;
        token.isAdmin = userToken.isAdmin;
        token.canCreateProperties = userToken.canCreateProperties;
        token.canCreateClients = userToken.canCreateClients;
        token.fullClientAccess = userToken.fullClientAccess;
        token.fullPropertyAccess = userToken.fullPropertyAccess;
        token.canSeeGlobalStats = userToken.canSeeGlobalStats;
        token.canExportClients = userToken.canExportClients;
        token.canDeleteClients = userToken.canDeleteClients;
        token.canDeleteProperties = userToken.canDeleteProperties;
        token.canAssignProperties = userToken.canAssignProperties;
        token.organizationName = userToken.organizationName;
      }

      return token;
    },
    session: async ({ session, token }) => {
      console.info("Checking if the user is still in the database");
      const userInDb = await db.user.findUnique({
        where: { id: token.id },
        include: {
          permissions: true,
          organization: {
            select: {
              name: true,
              generatedDomain: true,
              customDomain: true,
            },
          },
        },
      });

      if (!userInDb) {
        console.error(
          "User not found in database. It might have been deleted.",
        );

        throw new Error("Forbidden");
      } else {
        console.info("User found in database", userInDb.id);
      }

      const permissions = getPermissionValuesForUser(
        userInDb?.permissions ?? [],
      );

      session.user.id = userInDb.id;
      session.user.name =
        userInDb.firstName && userInDb.lastName
          ? `${userInDb.firstName} ${userInDb.lastName}`
          : undefined;
      session.user.firstName = userInDb.firstName;
      session.user.lastName = userInDb.lastName;
      session.user.email = userInDb.email;
      session.user.phoneNumber = userInDb.phoneNumber;
      session.user.subscriptionTier = userInDb.subscriptionTier;
      session.user.countryCode = userInDb.countryCode;
      session.user.createdAt = userInDb.createdAt;
      session.user.picture = userInDb.image;
      session.user.organizationId = userInDb.organizationId;
      session.user.isAdmin = userInDb.isAdmin;
      session.user.canCreateProperties = permissions.canCreateProperties;
      session.user.canCreateClients = permissions.canCreateClients;
      session.user.fullClientAccess = permissions.fullClientAccess;
      session.user.fullPropertyAccess = permissions.fullPropertyAccess;
      session.user.canSeeGlobalStats = permissions.canSeeGlobalStats;
      session.user.canExportClients = permissions.canExportClients;
      session.user.canDeleteClients = permissions.canDeleteClients;
      session.user.canDeleteProperties = permissions.canDeleteProperties;
      session.user.canAssignProperties = permissions.canAssignProperties;
      session.user.organizationName = userInDb.organization?.name;
      session.user.organizationDomain = userInDb.organization?.customDomain;
      session.user.organizationGeneratedDomain =
        userInDb.organization?.generatedDomain;

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: {
          label: "Correo electrónico",
          type: "email",
          placeholder: "correo@example.com",
        },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const user = await db.user.findFirst({
          where: { email: credentials?.email },
          include: {
            permissions: true,
            organization: {
              select: {
                name: true,
                customDomain: true,
                generatedDomain: true,
              },
            },
          },
        });

        const permissions = getPermissionValuesForUser(user?.permissions ?? []);

        console.info("Found existing user", user);

        if (credentials?.password && user?.password) {
          console.info(
            `Comparing passwords for user with e-mail: ${user.email}`,
          );
          const passwordsMatch = await compare(
            credentials.password,
            user.password,
          );

          passwordsMatch
            ? console.info(
                `Passwords match for user with e-mail: ${user.email}`,
              )
            : console.error(
                `Passwords do not match for user with e-mail: ${user.email}`,
              );

          return passwordsMatch
            ? {
                ...user,
                ...permissions,
                organizationName: user?.organization?.name,
                organizationDomain: user?.organization?.customDomain,
                organizationGeneratedDomain:
                  user?.organization?.generatedDomain,
              }
            : null;
        } else {
          console.error("User not found or password not entered", user);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === "development",
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
