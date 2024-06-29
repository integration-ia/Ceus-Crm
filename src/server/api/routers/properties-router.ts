import {
  BuiltAreaSizeUnitsEnum,
  ClientTypeEnum,
  ListingTypeEnum,
  PhoneTypeEnum,
  PhysicalStatusEnum,
  PropertyTypeEnum,
  PublicationStatusEnum,
  RentTimeEnum,
  VideoPlatformEnum,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import mjml2html from "mjml";
import { z } from "zod";
import { shareWithCeusTemplate } from "~/email-templates/share-with-ceus/share-with-ceus";
import { convertDollarsToCents } from "~/lib/utils";
import { sendEmail } from "../functions/sendEmail";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const propertiesRouter = createTRPCRouter({
  listProperties: protectedProcedure.query(async ({ ctx }) => {
    const prisma = ctx.db;
    const userId = ctx.session.user.id;

    const isAdmin = ctx.session.user.isAdmin;
    const fullPropertyAccess = ctx.session.user.fullPropertyAccess;

    const hasPermission = isAdmin || fullPropertyAccess;

    console.info("Listing properties for user", userId);
    const properties = await prisma.property.findMany({
      where: hasPermission
        ? {
            organizationId: ctx.session.user.organizationId,
          }
        : {
            agentInChargeId: userId,
            organizationId: ctx.session.user.organizationId,
          },
      include: {
        owner: {
          include: {
            emails: true,
            phoneNumbers: true,
          },
        },
        agentInCharge: true,
        propertyPhotos: {
          orderBy: {
            isCoverPhoto: "desc",
          },
        },
        propertyVideos: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.info(`${properties.length} properties found`);

    return properties;
  }),
  getDetails: protectedProcedure
    .input(z.string().cuid2())
    .query(async ({ input, ctx }) => {
      const prisma = ctx.db;
      const userId = ctx.session.user.id;

      const isAdmin = ctx.session.user.isAdmin;
      const fullPropertyAccess = ctx.session.user.fullPropertyAccess;

      const hasPermission = isAdmin || fullPropertyAccess;

      console.info("Getting details for property", {
        propertyId: input,
        userId,
      });

      const property = await prisma.property.findFirst({
        where: hasPermission
          ? { id: input }
          : {
              id: input,
              agentInChargeId: userId,
            },
        include: {
          owner: {
            include: {
              emails: true,
              phoneNumbers: true,
            },
          },
          agentInCharge: true,
          propertyPhotos: {
            orderBy: {
              isCoverPhoto: "desc",
            },
          },
          propertyVideos: {
            orderBy: {
              createdAt: "desc",
            },
          },
          propertyNotes: {
            include: {
              author: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!property) {
        console.error("Property not found or user is not the agent in charge");
        throw new Error("Property not found");
      }

      console.info("Property found", property);

      return property;
    }),
  createProperty: protectedProcedure
    .input(
      z
        .object({
          title: z
            .string()
            .min(1, "Title is required for a new property")
            .trim(),
          shareWithCEUS: z.boolean(),
          propertyType: z.nativeEnum(PropertyTypeEnum),
          publicationStatus: z.nativeEnum(PublicationStatusEnum),
          constructionYear: z.number().or(z.literal("")).optional().nullish(),
          physicalStatus: z.nativeEnum(PhysicalStatusEnum),
          agentInChargeId: z.string().cuid2(),
          listingType: z.nativeEnum(ListingTypeEnum),
          countryCode: z.string().length(2).min(1).trim(),
          regionCode: z.union([
            z.string().min(1).trim().optional(),
            z.literal(""),
          ]),
          cityName: z.union([
            z.string().min(1).trim().optional(),
            z.literal(""),
          ]),
          zone: z.number().int().min(0, "Invalid zone number").optional(),
          address: z.string().min(1).trim(),
          addressLatitude: z.number().optional().nullable(),
          addressLongitude: z.number().optional().nullable(),
          rentPriceDollars: z.number().min(0).optional(),
          rentTime: z.nativeEnum(RentTimeEnum).optional(),
          salePriceDollars: z.number().min(0).optional(),
          serviceFeePercentage: z.number().min(0).max(100).optional(),
          uniqueTaxForPropertyDollars: z.number().min(0).optional().nullable(),
          bathrooms: z.number().int().min(0).max(10),
          bedrooms: z.number().int().min(0).max(15),
          parkingSpaces: z.number().int().min(0).max(20),
          floorNumber: z.number().int().min(0).max(25),
          builtAreaSize: z.number().min(0).optional(),
          builtAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
          totalAreaSize: z.number().min(0).optional(),
          totalAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
          description: z.string().min(20).trim(),
          notes: z.string().trim().optional(),
          ownerId: z.union([
            z.literal("new"),
            z.literal(""),
            z.string().cuid2().optional().nullish(),
          ]),
          ownerFirstName: z.string().min(1).trim(),
          ownerLastName: z.string().min(1).trim(),
          ownerEmail: z
            .union([
              z.literal(""),
              z.string().email("El email ingresado es inválido"),
            ])
            .optional()
            .nullish(),
          ownerPhone: z.string().optional().nullish(),
          ownerPhoneHome: z.string().optional().nullish(),
          receivesEmail: z.boolean(),
          videoLinks: z.array(
            z.object({
              url: z
                .string()
                .url("Invalid URL format")
                .trim()
                .refine(
                  (url) =>
                    url.includes("youtube.com") || url.includes("youtu.be"),
                  { message: "Video URL must be from YouTube" },
                ),
              platform: z.nativeEnum(VideoPlatformEnum),
            }),
          ),
        })
        .superRefine((data, context) => {
          if (
            data.constructionYear &&
            typeof data.constructionYear === "number"
          ) {
            if (
              data.constructionYear < 1900 ||
              data.constructionYear > new Date().getFullYear()
            ) {
              context.addIssue({
                code: "custom",
                path: ["constructionYear"],
                message:
                  "El año de construcción debe estar entre 1900 y el año actual",
              });
            }
          }
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;
      const userId = ctx.session.user.id;

      if (!ctx.session.user.organizationId) {
        console.error("User does not belong to an organization");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not belong to an organization",
        });
      }

      const {
        ownerId,
        ownerFirstName,
        ownerLastName,
        ownerEmail,
        ownerPhone,
        ownerPhoneHome,
        notes,
        receivesEmail,
        address,
        addressLatitude,
        addressLongitude,
        agentInChargeId,
        bathrooms,
        bedrooms,
        builtAreaSize,
        builtAreaSizeUnit,
        countryCode,
        description,
        floorNumber,
        listingType,
        parkingSpaces,
        physicalStatus,
        propertyType,
        publicationStatus,
        rentPriceDollars,
        rentTime,
        salePriceDollars,
        serviceFeePercentage,
        title,
        shareWithCEUS,
        totalAreaSize,
        totalAreaSizeUnit,
        uniqueTaxForPropertyDollars,
        zone,
        regionCode,
        constructionYear,
        cityName,
        videoLinks,
      } = input;

      console.info("Creating new property with title", title);

      let slug = title
        .normalize("NFD") // normalize the string
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .toLowerCase() // convert to lower case
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/[^\w\-]+/g, "") // remove all non-word chars
        .replace(/\-\-+/g, "-") // replace multiple hyphens with a single hyphen
        .replace(/^-+/, "") // trim hyphen from start of text
        .replace(/-+$/, ""); // trim hyphen from end of text
      const propertyExists = await prisma.property.findFirst({
        where: {
          slug,
        },
      });

      console.info("Generated slug for property", slug);

      if (propertyExists) {
        // generate a new slug with random number
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        console.info(
          "Property with slug already exists, generated a new slug instead",
          slug,
        );
      }

      const phoneNumbersToEnter = [] as {
        phoneNumber: string;
        type: PhoneTypeEnum;
        usesWhatsApp: boolean;
      }[];

      if (ownerPhone && !ownerId) {
        console.info("Owner phone number provided", ownerPhone);
        phoneNumbersToEnter.push({
          phoneNumber: ownerPhone,
          type: PhoneTypeEnum.MOBILE,
          usesWhatsApp: false,
        });
      }

      if (ownerPhoneHome && !ownerId) {
        console.info("Owner home phone number provided", ownerPhoneHome);
        phoneNumbersToEnter.push({
          phoneNumber: ownerPhoneHome,
          type: PhoneTypeEnum.HOME,
          usesWhatsApp: false,
        });
      }

      if (ownerId) {
        console.info("Owner ID provided, using existing owner");
      } else {
        console.info("Creating new owner in database");
      }

      console.info("Checking if owner details are not duplicated");
      if (!ownerId || ownerId === "new") {
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
                        phoneNumber: ownerPhone ?? "",
                      },
                    },
                  },
                  {
                    phoneNumbers: {
                      some: {
                        phoneNumber: ownerPhoneHome ?? "",
                      },
                    },
                  },
                  {
                    emails: ownerEmail
                      ? {
                          some: {
                            email: ownerEmail,
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
      }

      console.info("Creating new property in database");

      const newProperty = await prisma.property.create({
        data: {
          title,
          propertyType,
          organizationId: ctx.session.user.organizationId,
          publicationStatus,
          constructionYear:
            typeof constructionYear === "number" ? constructionYear : null,
          physicalStatus,
          listingType,
          countryCode,
          regionCode,
          cityName,
          zone,
          address,
          addressLatitude,
          addressLongitude,
          rentPriceCents: convertDollarsToCents(rentPriceDollars ?? 0),
          rentTime,
          salePriceCents: convertDollarsToCents(salePriceDollars ?? 0),
          serviceFeePercentage,
          uniqueTaxForPropertyCents: convertDollarsToCents(
            uniqueTaxForPropertyDollars ?? 0,
          ),
          bathrooms,
          bedrooms,
          parkingSpaces,
          floorNumber,
          builtAreaSize,
          builtAreaSizeUnit,
          totalAreaSize,
          totalAreaSizeUnit,
          description,
          slug,
          agentInChargeId,
          ownerId: ownerId && ownerId !== "new" ? ownerId : undefined,
        },
      });

      if (!ownerId || ownerId === "new") {
        console.info("Creating new owner in database");

        const owner = await prisma.client.create({
          data: {
            firstName: ownerFirstName,
            lastName: ownerLastName,
            type: ClientTypeEnum.OWNER,
            organizationId: ctx.session.user.organizationId,
            createdByUserId: userId,
            countryCode: "GT",
            emails: {
              createMany: {
                data: ownerEmail
                  ? [
                      {
                        email: ownerEmail,
                        receivesEmail: receivesEmail,
                      },
                    ]
                  : [],
              },
            },
            phoneNumbers: {
              createMany: {
                data: phoneNumbersToEnter,
              },
            },
            properties: {
              connect: {
                id: newProperty.id,
              },
            },
          },
        });

        console.info("Owner created successfully!", owner);
      }

      console.info("New property created", newProperty);

      if (notes) {
        console.info("User provided notes for property, creating notes entry");
        await prisma.propertyNote.create({
          data: {
            authorId: userId,
            propertyId: newProperty.id,
            content: notes,
          },
        });

        console.info("Notes created successfully!");
      }

      if (videoLinks.length > 0) {
        console.info(
          "User provided video URLs for the property, creating entries",
        );

        await prisma.propertyVideo.createMany({
          data: videoLinks.map((link) => ({
            propertyId: newProperty.id,
            videoUrl: link.url,
            platform: link.platform,
          })),
        });

        console.info("Video URLs created successfully!");
      }

      if (shareWithCEUS) {
        console.info("User wants to share property with CEUS, sending e-mail");

        try {
          await sendEmail(
            "ceus@ceus.site",
            "CEUS - Un usuario ha compartido un inmueble contigo",
            mjml2html(
              shareWithCeusTemplate(
                newProperty.crmCode ?? 0,
                ctx.session.user.name ?? "No definido",
                ctx.session.user.email ?? "No definido",
                ctx.session.user.phoneNumber ?? "No definido",
                ctx.session.user.organizationName ?? "No definido",
              ),
            ).html,
          );

          console.info(`Email sent to Luis successfully!`);
        } catch (error) {
          console.error(
            `Could not send property share email to Luis. Error: ${(error as Error).message}. Property ID: ${newProperty.id}, property CRM code: ${newProperty.crmCode}`,
          );
        }
      }

      console.info("Property created successfully!");
      return newProperty.id;
    }),
  updateProperty: protectedProcedure
    .input(
      z
        .object({
          id: z.string().cuid2(),
          title: z
            .string()
            .min(1, "Title is required for a new property")
            .trim(),
          propertyType: z.nativeEnum(PropertyTypeEnum),
          publicationStatus: z.nativeEnum(PublicationStatusEnum),
          constructionYear: z.number().or(z.literal("")).optional().nullish(),
          physicalStatus: z.nativeEnum(PhysicalStatusEnum),
          agentInChargeId: z.string().cuid2(),
          listingType: z.nativeEnum(ListingTypeEnum),
          countryCode: z.string().length(2).min(1).trim(),
          regionCode: z.union([
            z.string().min(1).trim().optional(),
            z.literal(""),
          ]),
          cityName: z.union([
            z.string().min(1).trim().optional(),
            z.literal(""),
          ]),
          zone: z.number().int().min(0, "Invalid zone number").optional(),
          address: z.string().min(1).trim(),
          addressLatitude: z.number().optional().nullable(),
          addressLongitude: z.number().optional().nullable(),
          rentPriceDollars: z.number().min(0).optional(),
          rentTime: z.nativeEnum(RentTimeEnum).optional(),
          salePriceDollars: z.number().min(0).optional(),
          serviceFeePercentage: z.number().min(0).max(100).optional(),
          uniqueTaxForPropertyDollars: z.number().min(0).optional().nullable(),
          bathrooms: z.number().int().min(0).max(10),
          bedrooms: z.number().int().min(0).max(15),
          parkingSpaces: z.number().int().min(0).max(20),
          floorNumber: z.number().int().min(0).max(25),
          builtAreaSize: z.number().min(0).optional(),
          builtAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
          totalAreaSize: z.number().min(0).optional(),
          totalAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
          description: z.string().min(20).trim(),
          ownerId: z.union([
            z.literal("new"),
            z.literal(""),
            z.string().cuid2().optional().nullish(),
          ]),
          ownerFirstName: z.string().min(1).trim(),
          ownerLastName: z.string().min(1).trim(),
          ownerEmail: z
            .union([
              z.literal(""),
              z.string().email("El email ingresado es inválido"),
            ])
            .optional()
            .nullish(),
          ownerPhoneId: z.string().cuid2().optional(),
          ownerPhone: z.string().optional().nullish(),
          ownerPhoneHomeId: z.string().cuid2().optional(),
          ownerPhoneHome: z.string().optional().nullish(),
          receivesEmail: z.boolean(),
          media: z.array(
            z.object({
              id: z.string().cuid2().optional(),
              isCoverPhoto: z.boolean(),
              isDeleted: z.boolean().optional(),
            }),
          ),
          videoLinks: z.array(
            z.object({
              id: z.string().cuid2().optional(),
              url: z
                .string()
                .url("Invalid URL format")
                .trim()
                .refine(
                  (url) =>
                    url.includes("youtube.com") || url.includes("youtu.be"),
                  { message: "Video URL must be from YouTube" },
                ),
              isDeleted: z.boolean().optional(),
              platform: z.nativeEnum(VideoPlatformEnum),
            }),
          ),
        })
        .superRefine((data, context) => {
          if (
            data.constructionYear &&
            typeof data.constructionYear === "number"
          ) {
            if (
              data.constructionYear < 1900 ||
              data.constructionYear > new Date().getFullYear()
            ) {
              context.addIssue({
                code: "custom",
                path: ["constructionYear"],
                message:
                  "El año de construcción debe estar entre 1900 y el año actual",
              });
            }
          }
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;

      const {
        id,
        ownerId,
        ownerFirstName,
        ownerLastName,
        ownerEmail,
        ownerPhoneId,
        ownerPhone,
        ownerPhoneHomeId,
        ownerPhoneHome,
        receivesEmail,
        address,
        addressLatitude,
        addressLongitude,
        agentInChargeId,
        bathrooms,
        bedrooms,
        builtAreaSize,
        builtAreaSizeUnit,
        countryCode,
        description,
        floorNumber,
        listingType,
        parkingSpaces,
        physicalStatus,
        propertyType,
        publicationStatus,
        rentPriceDollars,
        rentTime,
        salePriceDollars,
        serviceFeePercentage,
        title,
        totalAreaSize,
        totalAreaSizeUnit,
        uniqueTaxForPropertyDollars,
        zone,
        regionCode,
        constructionYear,
        cityName,
        videoLinks,
      } = input;

      console.info("Updating property with ID", id);

      let slug = title
        .normalize("NFD") // normalize the string
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .toLowerCase() // convert to lower case
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/[^\w\-]+/g, "") // remove all non-word chars
        .replace(/\-\-+/g, "-") // replace multiple hyphens with a single hyphen
        .replace(/^-+/, "") // trim hyphen from start of text
        .replace(/-+$/, ""); // trim hyphen from end of text
      const propertyExists = await prisma.property.findFirst({
        where: {
          slug,
        },
      });

      console.info("Generated slug for property", slug);

      if (propertyExists) {
        // generate a new slug with random number
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        console.info(
          "Property with slug already exists, generated a new slug instead",
          slug,
        );
      }

      const phoneNumbersToEnter = [] as {
        phoneNumber: string;
        type: PhoneTypeEnum;
        usesWhatsApp: boolean;
      }[];

      if (ownerPhone && !ownerPhoneId) {
        console.info("Owner phone number provided", ownerPhone);
        phoneNumbersToEnter.push({
          phoneNumber: ownerPhone,
          type: PhoneTypeEnum.MOBILE,
          usesWhatsApp: true,
        });
      }

      if (ownerPhoneHome && !ownerPhoneHomeId) {
        console.info("Owner home phone number provided", ownerPhoneHome);
        phoneNumbersToEnter.push({
          phoneNumber: ownerPhoneHome,
          type: PhoneTypeEnum.HOME,
          usesWhatsApp: false,
        });
      }

      console.info("Updating property with ID", id, "in database");
      const updatedProperty = await prisma.property.update({
        where: {
          id,
        },
        data: {
          title,
          propertyType,
          publicationStatus,
          constructionYear:
            typeof constructionYear === "number" ? constructionYear : null,
          physicalStatus,
          listingType,
          countryCode,
          regionCode,
          cityName,
          zone,
          address,
          addressLatitude,
          addressLongitude,
          rentPriceCents: convertDollarsToCents(rentPriceDollars ?? 0),
          rentTime,
          salePriceCents: convertDollarsToCents(salePriceDollars ?? 0),
          serviceFeePercentage,
          uniqueTaxForPropertyCents: convertDollarsToCents(
            uniqueTaxForPropertyDollars ?? 0,
          ),
          bathrooms,
          bedrooms,
          parkingSpaces,
          floorNumber,
          builtAreaSize,
          builtAreaSizeUnit,
          totalAreaSize,
          totalAreaSizeUnit,
          description,
          slug,
          agentInCharge: {
            connect: {
              id: agentInChargeId,
            },
          },
        },
      });

      if (!ownerId || ownerId === "new") {
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
                        phoneNumber: ownerPhone ?? "",
                      },
                    },
                  },
                  {
                    phoneNumbers: {
                      some: {
                        phoneNumber: ownerPhoneHome ?? "",
                      },
                    },
                  },
                  {
                    emails: ownerEmail
                      ? {
                          some: {
                            email: ownerEmail,
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
        } else {
          console.info("Client does not exist, creating new client");

          const newClient = await prisma.client.create({
            data: {
              firstName: ownerFirstName,
              lastName: ownerLastName,
              type: ClientTypeEnum.OWNER,
              organizationId: ctx.session.user.organizationId,
              createdByUserId: ctx.session.user.id,
              countryCode: "GT",
              emails: {
                createMany: {
                  data: ownerEmail
                    ? [
                        {
                          email: ownerEmail,
                          receivesEmail: receivesEmail,
                        },
                      ]
                    : [],
                },
              },
              phoneNumbers: {
                createMany: {
                  data: phoneNumbersToEnter,
                },
              },
              properties: {
                connect: {
                  id: updatedProperty.id,
                },
              },
            },
          });

          console.info("Client created successfully!", newClient);
        }
      } else {
        console.info("Owner ID provided, using existing owner");

        await prisma.property.update({
          where: {
            id: updatedProperty.id,
          },
          data: {
            ownerId: ownerId,
          },
        });
      }

      if (
        phoneNumbersToEnter.length > 0 &&
        ownerId === "new" &&
        updatedProperty.ownerId
      ) {
        console.info(
          "User provided phone numbers, updating (or creating) in database",
        );

        await Promise.all(
          phoneNumbersToEnter.map(async (phone) => {
            const createdPhone = await prisma.clientPhone.create({
              data: {
                phoneNumber: phone.phoneNumber,
                type: phone.type,
                clientId: updatedProperty.ownerId!,
                usesWhatsApp: false,
              },
            });

            return createdPhone;
          }),
        );

        console.info("Phone numbers updated successfully!");
      }

      if (videoLinks.length > 0) {
        // delete videos
        const videosToDelete = videoLinks.filter((link) => link.isDeleted);
        if (videosToDelete.length > 0) {
          console.info(
            "User wants to delete some videos, deleting from database",
          );
          await prisma.propertyVideo.deleteMany({
            where: {
              propertyId: id,
              videoUrl: {
                in: videosToDelete.map((link) => link.url),
              },
            },
          });

          console.info("Videos deleted successfully!");
        }

        // add new videos
        const videosToAdd = videoLinks.filter(
          (link) => !link.isDeleted && !link.id,
        );
        if (videosToAdd.length > 0) {
          console.info("User wants to add new videos, adding to database");
          await prisma.propertyVideo.createMany({
            data: videosToAdd.map((link) => ({
              propertyId: id,
              videoUrl: link.url,
              platform: link.platform,
            })),
          });

          console.info("Videos added successfully!");
        }

        // update existing videos
        const updatedVideos = videoLinks.filter(
          (link) => link.isDeleted === undefined,
        );

        if (updatedVideos.length > 0) {
          console.info(
            "User wants to update existing videos, updating in database",
          );

          await Promise.all(
            updatedVideos.map((link) =>
              prisma.propertyVideo.update({
                where: {
                  id: link.id,
                },
                data: {
                  platform: link.platform,
                  videoUrl: link.url,
                },
              }),
            ),
          );

          console.info("Videos updated successfully!");
        }
      }

      if (input.media.length > 0) {
        // delete photos
        const photosToDelete = input.media.filter((photo) => photo.isDeleted);
        if (photosToDelete.length > 0) {
          console.info(
            "User wants to delete some photos, deleting from database",
          );
          await prisma.propertyPhoto.deleteMany({
            where: {
              propertyId: id,
              id: {
                in: photosToDelete.map((photo) => photo.id) as string[],
              },
            },
          });

          console.info("Photos deleted successfully!");
        }

        // update photos
        const updatedPhotos = input.media.filter(
          (photo) => photo.isDeleted === undefined,
        );

        if (updatedPhotos.length > 0) {
          console.info(
            "User wants to update some photos, updating in database",
          );

          await Promise.all(
            updatedPhotos.map((photo) =>
              prisma.propertyPhoto.update({
                where: {
                  id: photo.id,
                },
                data: {
                  isCoverPhoto: photo.isCoverPhoto,
                },
              }),
            ),
          );

          console.info("Photos updated successfully!");
        }
      }

      console.info("Property updated successfully!", updatedProperty);

      return updatedProperty.id;
    }),
  deleteProperty: protectedProcedure
    .input(z.string().cuid2())
    .mutation(async ({ input, ctx }) => {
      const prisma = ctx.db;
      const userId = ctx.session.user.id;

      const canDeleteProperties = ctx.session.user.canDeleteProperties;
      const hasPermission = ctx.session.user.isAdmin || canDeleteProperties;

      console.info("Deleting property", { propertyId: input, userId });

      const property = await prisma.property.findFirst({
        where: hasPermission
          ? {
              id: input,
              organizationId: ctx.session.user.organizationId,
            }
          : {
              id: input,
              agentInChargeId: userId,
            },
      });

      if (!property) {
        console.error("Property not found or user is not the agent in charge");
        throw new Error("Property not found");
      }

      console.info("Property found, deleting it from database");
      await prisma.property.delete({
        where: {
          id: input,
        },
      });

      console.info("Property deleted successfully!");
    }),
});
