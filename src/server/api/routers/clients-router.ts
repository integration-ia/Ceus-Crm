import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ClientTypeEnum, PhoneTypeEnum } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const clientsRouter = createTRPCRouter({
  getDetails: protectedProcedure
    .input(z.string().cuid2())
    .query(async ({ input, ctx }) => {
      console.info("Getting client details", input);

      const client = await ctx.db.client.findUnique({
        where: {
          id: input,
        },
        include: {
          emails: true,
          phoneNumbers: true,
          createdByUser: true,
          clientNotes: {
            include: {
              author: true,
            },
          },
        },
      });

      if (!client) {
        console.error("Client not found", input);

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente no encontrado",
        });
      }

      console.info("Client found!", client.id);

      return client;
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    console.info("Listing clients");

    const isAdmin = ctx.session.user.isAdmin;
    const hasFullClientAccess = ctx.session.user.fullClientAccess;

    const clients = await ctx.db.client.findMany({
      where:
        isAdmin || hasFullClientAccess
          ? {
              organizationId: ctx.session.user.organizationId,
            }
          : {
              organizationId: ctx.session.user.organizationId,
              createdByUserId: ctx.session.user.id,
            },
      include: {
        emails: {
          take: 1,
        },
        createdByUser: true,
        phoneNumbers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.info("Found clients!", clients.length);

    return clients;
  }),
  listOwners: protectedProcedure.query(async ({ ctx }) => {
    console.info("Listing owners");

    const owners = await ctx.db.client.findMany({
      where: {
        type: "OWNER",
        organizationId: ctx.session.user.organizationId,
      },
      include: {
        emails: {
          take: 1,
        },
        phoneNumbers: {
          take: 2,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.info("Found owners!", owners.length);

    return owners;
  }),
  createClient: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required").trim(),
        lastName: z.string().min(1, "Last name is required").trim(),
        phoneNumber: z.string().min(1, "Phone number is required").trim(),
        phoneNumberHome: z
          .string()
          .min(1, "El número de teléfono es requerido")
          .trim()
          .optional()
          .nullish()
          .or(z.literal("")),
        usesWhatsApp: z.boolean(),
        countryCode: z.string().min(1, "El país es requerido").trim(),
        email: z.string().email().trim().optional().nullish().or(z.literal("")),
        address: z.string().trim().optional().nullish(),
        type: z.nativeEnum(ClientTypeEnum),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.info("Creating client", input.firstName, input.lastName);

      const { phoneNumber, phoneNumberHome, usesWhatsApp, email, ...rest } =
        input;

      const existingClient = await ctx.db.client.findFirst({
        where: {
          AND: [
            {
              organizationId: ctx.session.user.organizationId,
            },
            {
              OR: [
                {
                  phoneNumbers: {
                    some: {
                      phoneNumber,
                    },
                  },
                },
                {
                  phoneNumbers: {
                    some: {
                      phoneNumber: phoneNumberHome ?? "",
                    },
                  },
                },
                {
                  emails: email
                    ? {
                        some: {
                          email: email,
                        },
                      }
                    : undefined,
                },
              ],
            },
          ],
        },
      });

      if (existingClient) {
        console.error("Client already exists", existingClient.id);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya existe un cliente con este número de teléfono o email",
        });
      }

      const phoneNumbersToCreate = [];

      if (phoneNumber) {
        phoneNumbersToCreate.push({
          phoneNumber,
          usesWhatsApp,
          type: PhoneTypeEnum.MOBILE,
        });
      }

      if (phoneNumberHome) {
        phoneNumbersToCreate.push({
          phoneNumber: phoneNumberHome,
          type: PhoneTypeEnum.HOME,
          usesWhatsApp: false,
        });
      }

      const client = await ctx.db.client.create({
        data: {
          ...rest,
          organizationId: ctx.session.user.organizationId,
          createdByUserId: ctx.session.user.id,
          phoneNumbers: {
            create: phoneNumbersToCreate,
          },
        },
      });

      if (email) {
        console.info("Client includes email, creating email", email);

        await ctx.db.clientEmail.create({
          data: {
            email,
            client: {
              connect: {
                id: client.id,
              },
            },
          },
        });

        console.info("Email for client created successfully!", email);
      }

      console.info("Client created", client.id);

      return client.id;
    }),
  updateClient: protectedProcedure
    .input(
      z.object({
        clientId: z.string().cuid2(),
        firstName: z.string().min(1, "First name is required").trim(),
        lastName: z.string().min(1, "Last name is required").trim(),
        phoneNumber: z.string().min(1, "Phone number is required").trim(),
        phoneNumberHome: z
          .string()
          .min(1, "El número de teléfono es requerido")
          .trim()
          .optional()
          .nullish()
          .or(z.literal("")),
        usesWhatsApp: z.boolean(),
        countryCode: z.string().min(1, "El país es requerido").trim(),
        email: z.string().email().trim().optional().nullish().or(z.literal("")),
        address: z.string().trim().optional().nullish(),
        type: z.nativeEnum(ClientTypeEnum),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.info("Updating client", input.clientId);

      const {
        clientId,
        phoneNumber,
        phoneNumberHome,
        email,
        usesWhatsApp,
        ...rest
      } = input;

      const existingClient = await ctx.db.client.findFirst({
        where: {
          AND: [
            {
              organizationId: ctx.session.user.organizationId,
              id: {
                not: clientId,
              },
            },
            {
              OR: [
                {
                  phoneNumbers: {
                    some: {
                      phoneNumber,
                    },
                  },
                },
                {
                  phoneNumbers: {
                    some: {
                      phoneNumber: phoneNumberHome ?? "",
                    },
                  },
                },
                {
                  emails: email
                    ? {
                        some: {
                          email: email,
                        },
                      }
                    : undefined,
                },
              ],
            },
          ],
        },
      });

      if (existingClient) {
        console.error("Client already exists", existingClient.id);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ya existe un cliente con este número de teléfono o email",
        });
      }

      const client = await ctx.db.client.update({
        where: {
          id: clientId,
        },
        data: {
          ...rest,
        },
      });

      console.info("Client updated", clientId);

      console.info("Updating phone number", phoneNumber);

      const existingPhoneNumbers = await ctx.db.clientPhone.findMany({
        where: {
          clientId,
        },
      });

      const existingPhoneNumber = existingPhoneNumbers.find(
        (p) => p.type === "MOBILE",
      );

      const existingPhoneNumberHome = existingPhoneNumbers.find(
        (p) => p.type === "HOME",
      );

      if (existingPhoneNumber) {
        console.info("Found existing phone number", existingPhoneNumber.id);

        await ctx.db.clientPhone.update({
          where: {
            id: existingPhoneNumber.id,
            type: "MOBILE",
          },
          data: {
            phoneNumber,
            usesWhatsApp,
          },
        });

        console.info("Phone number updated", phoneNumber);
      } else if (!existingPhoneNumber && phoneNumber) {
        console.info("Creating new phone number", phoneNumber);

        await ctx.db.clientPhone.create({
          data: {
            phoneNumber,
            usesWhatsApp,
            type: "MOBILE",
            client: {
              connect: {
                id: clientId,
              },
            },
          },
        });

        console.info("Phone number created", phoneNumber);
      }

      if (existingPhoneNumberHome && phoneNumberHome) {
        console.info("Found existing phone number", existingPhoneNumberHome.id);

        await ctx.db.clientPhone.update({
          where: {
            id: existingPhoneNumberHome.id,
            type: "HOME",
          },
          data: {
            phoneNumber: phoneNumberHome,
            usesWhatsApp: false,
          },
        });

        console.info("Phone number updated", phoneNumberHome);
      } else if (!existingPhoneNumberHome && phoneNumberHome) {
        console.info("Creating new home phone number", phoneNumberHome);

        await ctx.db.clientPhone.create({
          data: {
            phoneNumber: phoneNumberHome,
            usesWhatsApp: false,
            type: "HOME",
            client: {
              connect: {
                id: clientId,
              },
            },
          },
        });

        console.info("Home phone number created", phoneNumberHome);
      }

      if (typeof email !== "undefined" && email !== null && email !== "") {
        console.info("Updating email", email);

        const existingEmail = await ctx.db.clientEmail.findFirst({
          where: {
            clientId,
          },
        });

        if (existingEmail) {
          console.info("Found existing email", existingEmail.id);

          await ctx.db.clientEmail.update({
            where: {
              id: existingEmail.id,
            },
            data: {
              email: email,
            },
          });
        } else {
          console.info(
            `Client with ID ${clientId} had no e-mail. Creating new email`,
            email,
          );

          await ctx.db.clientEmail.create({
            data: {
              email,
              client: {
                connect: {
                  id: clientId,
                },
              },
            },
          });
        }

        console.info("Email updated", email);
      }

      console.info("Client updated!", clientId);

      return client.id;
    }),
  deleteClient: protectedProcedure
    .input(
      z.object({
        clientId: z.string().cuid2(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.info("Deleting client", input.clientId);

      await ctx.db.client.delete({
        where: {
          id: input.clientId,
        },
      });

      console.info("Client deleted!", input.clientId);

      return true;
    }),
});
