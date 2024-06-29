import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { hash } from "bcrypt";
import { TRPCError } from "@trpc/server";
import mjml2Html from "mjml";
import { passwordResetEmailTemplate } from "~/email-templates/password-reset/password-reset";
import { sign, verify } from "jsonwebtoken";
import { env } from "~/env";
import { generateUserPermissionsForAdmin } from "~/lib/utils";
import { sendEmail } from "../functions/sendEmail";

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email().min(1, "Email is required"),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;

      console.info(`Checking if user with email ${input.email} already exists`);

      const existingUser = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (existingUser) {
        console.error(`User with email ${input.email} already exists`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya existe una cuenta con este correo electrónico",
        });
      }

      console.info(
        "No user found with this email, proceeding to create a new organization",
      );

      const newOrganization = await prisma.organization.create({
        data: {
          organizationAboutInfo: {
            create: {
              aboutText: "",
              missionText: "",
              visionText: "",
            },
          },
          seoConfiguration: {
            create: {
              title: "",
              description: "",
              keywords: "",
            },
          },
        },
      });

      console.info(
        `Creating password hash for new user with email ${input.email}`,
      );

      const passwordHash = await hash(input.password, 10);

      console.info(`Password hash created for user with email ${input.email}`);

      const newUser = await prisma.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          isAdmin: true, // the first user is always an admin
          organization: {
            connect: {
              id: newOrganization.id,
            },
          },
          countryCode: "GT",
          subscriptionTier: "PREMIUM",
          permissions: {
            createMany: {
              data: generateUserPermissionsForAdmin(),
            },
          },
        },
      });

      console.info(`User with email ${newUser.email} created successfully`);
    }),
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email().min(1, "Email is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;

      const user = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (!user) {
        console.error(`User with email ${input.email} not found`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No existe un usuario con este correo electrónico",
        });
      }

      console.info(
        `Sending password reset email to user with email ${input.email}`,
      );

      const resetToken = sign({ id: user.id }, env.RESET_PASSWORD_SECRET, {
        expiresIn: 8 * 60 * 60, // 8 hours
      });

      const resetPasswordUrl = `${process.env.VERCEL_PROJECT_PRODUCTION_URL}/reset-password/${resetToken}`;

      console.info("Generated URL for password reset: ", resetPasswordUrl);

      try {
        await sendEmail(
          input.email,
          "CEUS - Solicitud de cambio de contraseña",
          mjml2Html(passwordResetEmailTemplate(resetPasswordUrl)).html,
        );

        console.info(
          `Password reset email sent to user with email ${input.email}`,
        );
      } catch (error) {
        console.error(
          `Could not send password reset email to user with email ${input.email}. Error: ${(error as Error).message}`,
        );
      }
    }),
  confirmNewPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(1, "New password is required"),
        newPasswordConfirmation: z
          .string()
          .min(1, "New password confirmation is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;

      const { id } = verify(input.token, env.RESET_PASSWORD_SECRET) as {
        id: string;
      };

      console.info(`Verifying user with id ${id}`);

      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        console.error(`User with id ${id} not found`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (input.newPassword !== input.newPasswordConfirmation) {
        console.error("Passwords do not match");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Las contraseñas no coinciden",
        });
      }

      console.info(`Creating new password hash for user with id ${id}`);
      const passwordHash = await hash(input.newPassword, 10);

      console.info(`Updating password for user with id ${id}`);
      await prisma.user.update({
        where: {
          id,
        },
        data: {
          password: passwordHash,
        },
      });

      console.info(`Password updated for user with id ${id}`);
    }),
});
