import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";

interface CloudflareImagesResponse {
  result: {
    id: string;
    uploadURL: string;
  };
  result_info: unknown;
  success: boolean;
  errors: Record<string, unknown>[];
  messages: string[];
}

interface BatchTokenResponse {
  result: {
    token: string;
  };
  success: boolean;
  errors: Record<string, unknown>[];
  messages: string[];
}

export const mediaRouter = createTRPCRouter({
  generateBatchToken: protectedProcedure.mutation(async () => {
    console.info("Generating token for batch upload");

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1/batch_token`,
      {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
      },
    );

    const parsedResponse = (await response.json()) as BatchTokenResponse;

    console.info("Generated token for batch upload", parsedResponse);

    return parsedResponse.result.token;
  }),
  generateSignedUrlsForPhotos: protectedProcedure
    .input(
      z.object({
        filesCount: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const formData = new FormData();

      formData.append("metadata", '{"key":"value"}');
      formData.append("requireSignedURLs", "false");

      const apiToken = env.CLOUDFLARE_API_TOKEN;

      if (!apiToken) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Missing Cloudflare API token",
        });
      }

      const cloudFlareOneTimeUrlResponses = await Promise.all(
        Array.from({ length: input.filesCount }).map(() =>
          fetch(
            `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v2/direct_upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiToken}`,
              },
              body: formData,
            },
          ),
        ),
      );

      if (cloudFlareOneTimeUrlResponses.some((response) => !response.ok)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      } else {
        const responses = (await Promise.all(
          cloudFlareOneTimeUrlResponses.map((response) => response.json()),
        )) as CloudflareImagesResponse[];

        if (responses.some((response) => !response.success)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        } else {
          return responses.map((response) => response.result.uploadURL);
        }
      }
    }),
  addPropertyPhoto: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().cuid2(),
        photo: z.object({
          cloudFlareId: z.string().min(1),
          uploadedAt: z.date(),
          isCoverPhoto: z.boolean(),
          filename: z.string().min(1),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.info("Adding property photo", input);

      await ctx.db.propertyPhoto.create({
        data: {
          cloudflareId: input.photo.cloudFlareId,
          createdAt: input.photo.uploadedAt,
          propertyId: input.propertyId,
          isCoverPhoto: input.photo.isCoverPhoto,
          filename: input.photo.filename,
        },
      });

      console.info(
        `Photo added successfully for property with ID ${input.propertyId}!`,
      );
    }),
});
