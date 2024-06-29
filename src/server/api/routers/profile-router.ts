import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { hash } from "bcrypt";
import { env } from "~/env";

export const profileRouter = createTRPCRouter({
  updateProfilePhoto: protectedProcedure
    .input(z.string().min(1).trim())
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      console.info("Updating profile photo for user with ID", userId);
      console.info("Cloudflare ID for the image:", input);

      const user = await ctx.db.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
      });

      if (user.image) {
        // delete the previous logo from Cloudflare
        console.info("Deleting the previous profile photo from Cloudflare");

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1/${user.image}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            },
          },
        );

        if (!response.ok) {
          console.error(
            `Failed to delete the previous logo with ID ${user.image} from Cloudflare`,
          );
        } else {
          console.info(
            `Deleted the previous logo with ID ${user.image} from Cloudflare`,
          );
        }
      }

      await ctx.db.user.update({
        where: {
          id: userId,
        },
        data: {
          image: input,
        },
      });

      console.info(
        `Profile photo updated successfully for user with ID ${userId}!`,
      );
    }),
  setupProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "El nombre es requerido").trim(),
        lastName: z.string().min(1, "El apellido es requerido").trim(),
        email: z.string().min(1, "El correo es requerido").email().trim(),
        phoneNumber: z
          .string()
          .min(1, "El número de teléfono es requerido")
          .trim(),
        countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { firstName, lastName, email, phoneNumber, countryCode } = input;

      console.info(
        "Verifying the user's e-mail or phone doesn't clash with another user",
      );

      const existingUser = await ctx.db.user.findFirst({
        where: {
          id: {
            not: ctx.session.user.id,
          },
          OR: [{ email }, { phoneNumber }],
        },
      });

      if (existingUser) {
        console.info(
          "User with ID",
          existingUser.id,
          "already using the e-mail or phone",
        );

        throw new TRPCError({
          code: "CONFLICT",
          message: "El correo o teléfono ya está en uso por otro usuario",
        });
      }

      console.info("Setting up user profile");

      const user = await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          countryCode,
        },
      });

      console.info(`User with ID ${user.id} has been set up successfully!`);
    }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "El nombre es requerido").trim(),
        lastName: z.string().min(1, "El apellido es requerido").trim(),
        email: z.string().min(1, "El correo es requerido").email().trim(),
        phoneNumber: z
          .string()
          .min(1, "El número de teléfono es requerido")
          .trim(),
        password: z.string().trim(),
        countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { firstName, lastName, email, phoneNumber, password, countryCode } =
        input;

      console.info(
        "Verifying the user's e-mail or phone doesn't clash with another user",
      );

      const existingUser = await ctx.db.user.findFirst({
        where: {
          AND: [
            {
              NOT: { id: ctx.session.user.id },
            },
            {
              OR: [{ email }, { phoneNumber }],
            },
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "El correo o teléfono ya está en uso por otro usuario",
        });
      }

      console.info(
        "Updating user profile for user with ID",
        ctx.session.user.id,
      );

      const updatedUser = await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
          countryCode,
        },
      });

      console.info(
        `Profile data for user with ID ${updatedUser.id} has been updated!`,
      );

      if (password) {
        console.info(
          `User changed their password. Creating password hash for new user with ID ${updatedUser.id}`,
        );

        const passwordHash = await hash(password, 10);

        console.info(
          `Password hash created for user with ID ${updatedUser.id}`,
        );

        await ctx.db.user.update({
          where: {
            id: updatedUser.id,
          },
          data: {
            password: passwordHash,
          },
        });

        console.info(
          "Password has been updated for user with ID",
          updatedUser.id,
        );
      }

      console.info(`User with ID ${ctx.session.user.id} updated successfully!`);
    }),
});
