import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import cuid2 from "@paralleldrive/cuid2";
import { env } from "~/env";
import {
  OrganizationSocialMediaPlatformEnum,
  OrganizationWebsiteThemeEnum,
} from "@prisma/client";

export const organizationsRouter = createTRPCRouter({
  setupOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido").trim(),
        phoneNumber: z
          .string()
          .min(1, "El número de teléfono es requerido")
          .trim(),
        email: z.string().min(1, "El correo es requerido").email().trim(),
        countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info("Setting up organization with name", input.name);

      console.info(
        `Generating slug for organization with ID ${organizationId} and name ${input.name}`,
      );

      let slug = input.name
        .normalize("NFD") // normalize the string
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .toLowerCase() // convert to lower case
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/[^\w\-]+/g, ""); // remove all non-word chars

      console.info(
        `Generated slug for organization with ID ${organizationId}: ${slug}`,
      );

      const existingOrganization = await ctx.db.organization.findFirst({
        where: {
          id: {
            not: organizationId,
          },
          OR: [
            {
              emails: {
                some: {
                  email: input.email,
                },
              },
            },
            {
              generatedDomain: slug,
            },
          ],
        },
        include: {
          emails: true,
        },
      });

      if (existingOrganization) {
        if (existingOrganization.emails.some((e) => e.email === input.email)) {
          console.error(
            `Organization with e-mail ${input.email} already exists. Cannot set up a new organization with this e-mail`,
          );

          throw new Error(
            "Ya existe una empresa usando este correo electrónico",
          );
        }

        if (existingOrganization.generatedDomain === slug) {
          console.info(
            `Organization with slug ${slug} already exists. Generating new slug instead`,
          );

          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

          console.info(
            `New slug generated for organization with ID ${organizationId}: ${slug}`,
          );
        }
      }

      console.info(`Setting up organization with name ${input.name}`);

      await ctx.db.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          name: input.name,
          countryCode: input.countryCode,
          generatedDomain: slug,
          emails: {
            create: {
              email: input.email,
            },
          },
          phoneNumbers: {
            create: {
              phoneNumber: input.phoneNumber,
              type: "MOBILE",
            },
          },
        },
      });

      console.info(
        `Organization of name ${input.name} with ID ${organizationId} has been set up successfully!`,
      );
    }),
  updateOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).trim(),
        address: z.string().trim().optional(),
        countryCode: z.string().min(1).length(2).trim(),
        emails: z.array(
          z.object({
            id: z.string().cuid2().optional(),
            email: z.string().min(1).email().trim(),
          }),
        ),
        phoneNumbers: z.array(
          z.object({
            id: z.string().cuid2().optional(),
            phoneNumber: z.string().min(1).trim(),
          }),
        ),
        deletedEmails: z.array(z.string().cuid2()),
        deletedPhoneNumbers: z.array(z.string().cuid2()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info("Updating organization with ID", organizationId);

      await ctx.db.$transaction(async (tx) => {
        console.info("Deleting emails with IDs", input.deletedEmails);
        await tx.organizationEmail.deleteMany({
          where: {
            id: {
              in: input.deletedEmails,
            },
          },
        });

        console.info(
          "Deleting phone numbers with IDs",
          input.deletedPhoneNumbers,
        );
        await tx.organizationPhone.deleteMany({
          where: {
            id: {
              in: input.deletedPhoneNumbers,
            },
          },
        });

        console.info("Updating organization with ID", organizationId);
        await tx.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            name: input.name,
            countryCode: input.countryCode,
            address: input.address,
            emails: {
              upsert: input.emails.map((email) => ({
                where: {
                  id: email.id ?? cuid2.createId(),
                },
                update: {
                  email: email.email,
                },
                create: {
                  email: email.email,
                },
              })),
            },
            phoneNumbers: {
              upsert: input.phoneNumbers.map((phoneNumber) => ({
                where: {
                  id: phoneNumber.id ?? cuid2.createId(),
                },
                update: {
                  phoneNumber: phoneNumber.phoneNumber,
                },
                create: {
                  phoneNumber: phoneNumber.phoneNumber,
                  type: "MOBILE",
                },
              })),
            },
          },
        });

        console.info(
          `Organization with ID ${organizationId} has been updated successfully!`,
        );
      });
    }),
  updateWebsiteData: protectedProcedure
    .input(
      z.object({
        aboutUs: z.string().trim().optional(),
        mission: z.string().trim().optional(),
        vision: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info(
        "Updating website data for organization with ID",
        organizationId,
      );

      const aboutInfo = await ctx.db.organizationAboutInfo.findFirst({
        where: {
          organizationId,
        },
      });

      if (!aboutInfo) {
        console.info(
          `Creating new website data for organization with ID ${organizationId}`,
        );

        await ctx.db.organizationAboutInfo.create({
          data: {
            aboutText: input.aboutUs ?? "",
            missionText: input.mission ?? "",
            visionText: input.vision ?? "",
            organizationId,
          },
        });

        console.info(
          `Website data created successfully for organization with ID ${organizationId}!`,
        );

        return;
      } else {
        console.info(
          `Updating existing website data for organization with ID ${organizationId}`,
        );

        await ctx.db.organizationAboutInfo.update({
          where: {
            id: aboutInfo.id,
          },
          data: {
            aboutText: input.aboutUs,
            missionText: input.mission,
            visionText: input.vision,
          },
        });

        console.info(
          `Website data updated successfully for organization with ID ${organizationId}!`,
        );
      }
    }),
  updateValues: protectedProcedure
    .input(
      z.object({
        values: z
          .array(
            z.object({
              id: z.string().cuid2().optional(),
              title: z.string().min(1).trim(),
              value: z.string().min(1).trim(),
            }),
          )
          .max(4),
        deletedValues: z.array(z.string().cuid2()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info(
        "Updating organization values for organization with ID",
        organizationId,
      );

      console.info("Deleting values with IDs", input.deletedValues);
      await ctx.db.organizationValues.deleteMany({
        where: {
          id: {
            in: input.deletedValues,
          },
        },
      });

      console.info(
        "Updating organization values for organization with ID",
        organizationId,
      );

      await Promise.all(
        input.values.map(async (value) => {
          await ctx.db.organizationValues.upsert({
            where: {
              id: value.id ?? cuid2.createId(),
            },
            update: {
              title: value.title,
              value: value.value,
            },
            create: {
              title: value.title,
              value: value.value,
              organizationId,
            },
          });
        }),
      );

      console.info(
        `Organization values updated successfully for organization with ID ${organizationId}!`,
      );
    }),
  updateSocialMediaLinks: protectedProcedure
    .input(
      z.object({
        values: z
          .array(
            z.object({
              id: z.string().cuid2().optional(),
              platform: z
                .nativeEnum(OrganizationSocialMediaPlatformEnum)
                .or(z.literal(""))
                .refine((value) => value.trim() !== "", {
                  message: "La plataforma es requerida",
                }),
              link: z
                .string()
                .min(1)
                .trim()
                .url({ message: "Invalid URL" })
                .refine(
                  (value) => {
                    // check if the URL is a valid Facebook, Twitter, Instagram or TikTok URL
                    if (
                      value.includes("facebook") ||
                      value.includes("x.com") ||
                      value.includes("twitter") ||
                      value.includes("instagram") ||
                      value.includes("tiktok")
                    ) {
                      return true;
                    }
                  },
                  {
                    message:
                      "El enlace debe ser de Facebook, X, Instagram o TikTok",
                  },
                ),
            }),
          )
          .max(4),
        deletedValues: z.array(z.string().cuid2()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info(
        "Updating social media links for organization with ID",
        organizationId,
      );

      console.info("Deleting social media links with IDs", input.deletedValues);
      await ctx.db.organizationSocialMediaLink.deleteMany({
        where: {
          id: {
            in: input.deletedValues,
          },
        },
      });

      console.info(
        "Updating social media links for organization with ID",
        organizationId,
      );

      await Promise.all(
        input.values.map(async (value) => {
          console.info(
            `Updating social media link ${value.link} for platform ${value.platform}`,
          );

          await ctx.db.organizationSocialMediaLink.upsert({
            where: {
              id: value.id ?? cuid2.createId(),
            },
            update: {
              platform: value.platform !== "" ? value.platform : undefined,
              link: value.link,
            },
            create: {
              platform: value.platform !== "" ? value.platform : "FACEBOOK",
              link: value.link,
              organizationId,
            },
          });

          console.info(
            `Social media link ${value.link} updated successfully for platform ${value.platform}!`,
          );
        }),
      );

      console.info(
        `Social media links updated successfully for organization with ID ${organizationId}!`,
      );
    }),
  getSeoConfig: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.user.organizationId;

    console.info(
      "Fetching SEO configuration for organization with ID",
      organizationId,
    );

    const seoConfig = await ctx.db.organizationSEOConfiguration.findFirst({
      where: {
        organizationId,
      },
    });

    if (seoConfig) {
      console.info(
        `SEO configuration found for organization with ID ${organizationId}:`,
        seoConfig.title,
        seoConfig.description,
      );

      return seoConfig;
    } else {
      console.info(
        `SEO configuration not found for organization with ID ${organizationId}`,
      );
      return {
        title: "",
        description: "",
      };
    }
  }),
  updateSeoConfig: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1, "El título es requerido")
          .max(60, "El título no puede tener más de 60 caracteres"),
        description: z
          .string()
          .min(1, "La descripción es requerida")
          .max(200, "La descripción no puede tener más de 200 caracteres"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info(
        "Updating SEO configuration for organization with ID",
        organizationId,
      );

      const seoConfig = await ctx.db.organizationSEOConfiguration.findFirst({
        where: {
          organizationId,
        },
      });

      if (!seoConfig) {
        console.info(
          `Creating new SEO configuration for organization with ID ${organizationId}`,
        );

        await ctx.db.organizationSEOConfiguration.create({
          data: {
            title: input.title,
            description: input.description,
            organizationId,
          },
        });

        console.info(
          `SEO configuration created successfully for organization with ID ${organizationId}!`,
        );

        return;
      } else {
        console.info(
          `Updating existing SEO configuration for organization with ID ${organizationId}`,
        );

        await ctx.db.organizationSEOConfiguration.update({
          where: {
            id: seoConfig.id,
          },
          data: {
            title: input.title,
            description: input.description,
          },
        });

        console.info(
          `SEO configuration updated successfully for organization with ID ${organizationId}!`,
        );
      }
    }),
  updateWebsiteTheme: protectedProcedure
    .input(
      z.object({
        theme: z.nativeEnum(OrganizationWebsiteThemeEnum),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info(
        "Updating website theme for organization with ID",
        organizationId,
      );

      await ctx.db.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          websiteTheme: input.theme,
        },
      });

      console.info(
        `Website theme updated successfully for organization with ID ${organizationId}!`,
      );
    }),
  getDetails: protectedProcedure.query(async ({ input, ctx }) => {
    const id = ctx.session.user.organizationId;

    console.info("Fetching organization details for organization with ID", id);

    const organization = await ctx.db.organization.findUnique({
      where: {
        id,
      },
      include: {
        phoneNumbers: true,
        emails: true,
        organizationAboutInfo: true,
        organizationValues: true,
        socialMediaLinks: true,
      },
    });

    if (organization) {
      console.info(
        `Organization with ID ${input} found:`,
        organization.id,
        organization.name,
      );

      return organization;
    } else {
      console.info(`Organization with ID ${input} not found`);
      return null;
    }
  }),
  getDomain: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.user.organizationId;

    console.info(
      "Fetching custom web domain for organization with ID",
      organizationId,
    );

    console.info(
      "Fetching custom web domain for organization with ID",
      organizationId,
    );

    const organization = await ctx.db.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    if (organization) {
      console.info(
        `Organization with ID ${organizationId} found:`,
        organization.id,
        organization.name,
      );

      return organization.customDomain;
    } else {
      console.info(
        `Organization custom domain ${organizationId} not found. No custom domain has been set for this organization`,
      );
      return null;
    }
  }),
  updateLogo: protectedProcedure
    .input(z.string().min(1).trim())
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.session.user.organizationId;

      console.info("Updating logo for organization with ID", organizationId);
      console.info("Cloudflare ID for the image:", input);

      console.info("Getting ID of the previous logo from the database");
      const organization = await ctx.db.organization.findUniqueOrThrow({
        where: {
          id: organizationId,
        },
        select: {
          logo: true,
        },
      });

      if (organization.logo) {
        // delete the previous logo from Cloudflare
        console.info("Deleting the previous logo from Cloudflare");

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1/${organization.logo}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            },
          },
        );

        if (!response.ok) {
          console.error(
            `Failed to delete the previous logo with ID ${organization.logo} from Cloudflare`,
          );
        } else {
          console.info(
            `Deleted the previous logo with ID ${organization.logo} from Cloudflare`,
          );
        }
      }

      await ctx.db.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          logo: input,
        },
      });

      console.info(
        `Logo image updated successfully for organization with ID ${organizationId}!`,
      );
    }),
});
