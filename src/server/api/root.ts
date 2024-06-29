import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth-router";
import { propertiesRouter } from "./routers/properties-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { mediaRouter } from "./routers/media-router";
import { clientsRouter } from "./routers/clients-router";
import { usersRouter } from "./routers/users-router";
import { profileRouter } from "./routers/profile-router";
import { propertyNotesRouter } from "./routers/property-notes-router";
import { clientNotesRouter } from "./routers/client-notes-router";
import { organizationsRouter } from "./routers/organizations-router";
import { webDomainsRouter } from "./routers/web-domains-router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  properties: propertiesRouter,
  clients: clientsRouter,
  dashboard: dashboardRouter,
  media: mediaRouter,
  users: usersRouter,
  profiles: profileRouter,
  propertyNotes: propertyNotesRouter,
  clientNotes: clientNotesRouter,
  organizations: organizationsRouter,
  webDomains: webDomainsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
