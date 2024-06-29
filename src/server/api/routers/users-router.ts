import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import mjml2html from "mjml";
import { userInvitationTemplate } from "~/email-templates/user-invitation/user-invitation";
import { sign } from "jsonwebtoken";
import {
  getPermissionValuesForUser,
  setPermissionValuesForNewUser,
} from "~/lib/utils";
import { sendEmail } from "../functions/sendEmail";

export const usersRouter = createTRPCRouter({
  listAgentsForDeletion: protectedProcedure
    .input(
      z.object({
        agentToDeleteId: z.string().cuid2(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = ctx.session.user;
      const organizationId = user.organizationId;

      if (!user.isAdmin) {
        console.info(
          "User is not admin and does not have permission to migrate data from one agent to another. Returning empty array of agents",
        );

        return [];
      }

      console.info("Fetching agents for organization", organizationId);

      const agents = await ctx.db.user.findMany({
        where: {
          organizationId,
          id: {
            not: input.agentToDeleteId,
          },
        },
      });

      console.info("Found agents for organization", agents.length);

      return agents;
    }),
  listAgents: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const organizationId = user.organizationId;

    if (!user.isAdmin && !user.canAssignProperties) {
      console.info(
        "User is not admin and does not have permission to assign agents to properties. Returning empty array of agents",
      );

      return [];
    }

    console.info("Fetching agents for organization", organizationId);

    const agents = await ctx.db.user.findMany({
      where: {
        organizationId,
        id: {
          not: user.id,
        },
      },
    });

    console.info("Found agents for organization", agents.length);

    return agents;
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const organizationId = user.organizationId;

    if (user.isAdmin) {
      console.info("User is admin. Fetching all organization users");

      const organizationUsers = await ctx.db.user.findMany({
        where: {
          organizationId,
        },
        include: {
          permissions: true,
        },
      });

      const organizationUsersWithPermissions = organizationUsers.map(
        (orgUser) => {
          const permissions = getPermissionValuesForUser(
            orgUser?.permissions ?? [],
          );

          return {
            ...orgUser,
            ...permissions,
          };
        },
      );

      console.info(
        "Found organization users",
        organizationUsersWithPermissions.length,
      );

      return organizationUsersWithPermissions;
    } else {
      console.info("User is not admin. Fetching only their user");

      const foundUser = await ctx.db.user.findFirstOrThrow({
        where: {
          id: user.id,
        },
        include: {
          permissions: true,
        },
      });

      const foundUserPermissions = getPermissionValuesForUser(
        foundUser.permissions,
      );

      const foundUserWithPermissions = {
        ...foundUser,
        ...foundUserPermissions,
      };

      return [foundUserWithPermissions];
    }
  }),
  createUser: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "El nombre es requerido").trim(),
        lastName: z.string().min(1, "El apellido es requerido").trim(),
        phoneNumber: z.string().min(1, "El teléfono es requerido").trim(),
        email: z.string().email().trim(),
        canCreateProperties: z.boolean(),
        canCreateClients: z.boolean(),
        fullClientAccess: z.boolean(),
        fullPropertyAccess: z.boolean(),
        canSeeGlobalStats: z.boolean(),
        canExportClients: z.boolean(),
        canDeleteClients: z.boolean(),
        canDeleteProperties: z.boolean(),
        canAssignProperties: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const organizationId = user.organizationId;

      const { firstName, lastName, phoneNumber, email, ...permissions } = input;

      if (!user.isAdmin) {
        console.error(
          `User with ID ${user.id} is not admin and attempted to create a new user`,
        );

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have to be an admin to create a new user",
        });
      }

      console.info("Fetching organization with ID", organizationId);

      const organization = await ctx.db.organization.findFirst({
        where: {
          id: organizationId,
        },
      });

      await ctx.db.$transaction(async (tx) => {
        console.info("Creating new user with e-mail", input.email);

        const createdUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            phoneNumber,
            email,
            subscriptionTier: user.subscriptionTier,
            organizationId,
            permissions: {
              createMany: {
                data: setPermissionValuesForNewUser(permissions),
              },
            },
          },
        });

        console.info("New user created", createdUser.id);

        console.info(
          "Creating password reset token for new user with ID",
          createdUser.id,
        );

        const resetToken = sign(
          { id: createdUser.id },
          env.RESET_PASSWORD_SECRET,
          {
            expiresIn: 24 * 60 * 60, // 24 hours
          },
        );

        console.info("Password reset token created", resetToken);

        const resetPasswordUrl = `${process.env.VERCEL_PROJECT_PRODUCTION_URL}/reset-password/${resetToken}`;

        try {
          console.info(
            "Sending invitation e-mail to newly created user with ID",
            createdUser.id,
          );

          await sendEmail(
            input.email,
            "Has sido invitado a unirte a la plataforma de administración de inmuebles de CEUS",
            mjml2html(
              userInvitationTemplate(
                createdUser.firstName ?? "No definido",
                organization?.name ?? "No definido",
                resetPasswordUrl,
              ),
            ).html,
          );

          console.info(
            `Invitation e-mail sent to user with e-mail ${input.email} and ID ${createdUser.id}`,
          );
        } catch (error) {
          console.error(
            `Could not send password reset email to newly created user user with email ${input.email} and ID ${createdUser.id}. Error: ${(error as Error).message}`,
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "No se pudo crear el usuario. Por favor, inténtalo de nuevo.",
          });
        }

        return createdUser;
      });
    }),
  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        firstName: z.string().min(1, "El nombre es requerido").trim(),
        lastName: z.string().min(1, "El apellido es requerido").trim(),
        phoneNumber: z.string().min(1, "El teléfono es requerido").trim(),
        email: z.string().email().trim(),
        canCreateProperties: z.boolean(),
        canCreateClients: z.boolean(),
        fullClientAccess: z.boolean(),
        fullPropertyAccess: z.boolean(),
        canSeeGlobalStats: z.boolean(),
        canExportClients: z.boolean(),
        canDeleteClients: z.boolean(),
        canDeleteProperties: z.boolean(),
        canAssignProperties: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      const { id, firstName, lastName, phoneNumber, email, ...permissions } =
        input;

      if (!user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have to be an admin to update a user",
        });
      }

      console.info("Updating user", input.id);

      const updatedUser = await ctx.db.user.update({
        where: {
          id,
        },
        data: {
          firstName,
          lastName,
          phoneNumber,
          email,
          permissions: {
            deleteMany: {},
            createMany: {
              data: setPermissionValuesForNewUser(permissions),
            },
          },
        },
      });

      console.info("User updated", updatedUser.id);

      return updatedUser;
    }),
  deleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid2(),
        targetUserId: z.string().cuid2(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.session.user;

      if (!user.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have to be an admin to delete a user",
        });
      }

      console.info(
        "Migrating data from user",
        input.userId,
        "to user",
        input.targetUserId,
      );

      console.info("Updating properties");

      await ctx.db.property.updateMany({
        where: {
          agentInChargeId: input.userId,
        },
        data: {
          agentInChargeId: input.targetUserId,
        },
      });

      console.info("Properties updated!");

      console.info("Updating property notes");

      await ctx.db.propertyNote.updateMany({
        where: {
          authorId: input.userId,
        },
        data: {
          authorId: input.targetUserId,
        },
      });

      console.info("Property notes updated!");

      console.info("Deleting user", input.userId);

      await ctx.db.user.delete({
        where: {
          id: input.userId,
        },
      });

      console.info("User deleted", input.userId);

      return true;
    }),
});
