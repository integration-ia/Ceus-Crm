import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";

interface DomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

interface DomainConfigResponse {
  /** How we see the domain's configuration. - `CNAME`: Domain has a CNAME pointing to Vercel. - `A`: Domain's A record is resolving to Vercel. - `http`: Domain is resolving to Vercel but may be behind a Proxy. - `null`: Domain is not resolving to Vercel. */
  configuredBy?: ("CNAME" | "A" | "http") | null;
  /** Which challenge types the domain can use for issuing certs. */
  acceptedChallenges?: ("dns-01" | "http-01")[];
  /** Whether or not the domain is configured AND we can automatically generate a TLS certificate. */
  misconfigured: boolean;
  conflicts?: {
    name: string;
    type: string;
    value: string;
  }[];
}

interface DomainVerificationResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export const webDomainsRouter = createTRPCRouter({
  addWebDomainToOrganization: protectedProcedure
    .input(
      z
        .string()
        .min(1, "El nombre del dominio es requerido")
        .trim()
        .refine(
          (value) => {
            const domainRegex =
              /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
            return domainRegex.test(value);
          },
          {
            message: "Nombre de dominio inválido",
          },
        ),
    )
    .mutation(async ({ input, ctx }) => {
      const vercelProjectId = env.VERCEL_PROJECT_ID;
      const vercelAuthToken = env.VERCEL_AUTH_TOKEN;
      const vercelTeamId = env.VERCEL_TEAM_ID;
      const organizationId = ctx.session.user.organizationId;

      await ctx.db.$transaction(
        async (tx) => {
          const url = `https://api.vercel.com/v10/projects/${vercelProjectId}/domains?teamId=${vercelTeamId}`;

          console.info(
            `Registering domain ${input} to ceus-domains for organization with ID ${organizationId}`,
          );

          console.info(
            `Registering domain  ${input} to organization with ID ${organizationId} in the database`,
          );

          await tx.organization.update({
            where: {
              id: organizationId,
            },
            data: {
              customDomain: input,
            },
          });

          const addDomainResponse = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelAuthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: input,
              // Redirect www. to root domain
              ...(input.startsWith("www.") && {
                redirect: input.replace("www.", ""),
              }),
            }),
          });

          console.info(
            `Reading response from Vercel for domain ${input}, for organization with ID ${organizationId}`,
          );

          const responseData = await addDomainResponse.json();

          if (responseData.error?.code === "forbidden") {
            console.error(
              `Organization with ID ${organizationId} does not have permission to add a domain`,
            );

            throw new TRPCError({
              code: "FORBIDDEN",
              message: "No tienes permisos para agregar un dominio",
            });
          } else if (responseData.error?.code === "domain_taken") {
            console.error(
              `Domain ${input} cannot be added to organization with ID ${organizationId} because it's already in use by another organization`,
            );

            throw new TRPCError({
              code: "CONFLICT",
              message: "El dominio ya está en uso por otra empresa",
            });
          }

          console.info(
            `Domain ${input} has been added to organization with ID ${organizationId}. Domain registered in database successfully!`,
          );
        },
        {
          // 10 seconds
          maxWait: 10000,
          timeout: 10000,
        },
      );
    }),
  removeWebDomainFromOrganization: protectedProcedure.mutation(
    async ({ ctx }) => {
      const vercelProjectId = env.VERCEL_PROJECT_ID;
      const vercelAuthToken = env.VERCEL_AUTH_TOKEN;
      const vercelTeamId = env.VERCEL_TEAM_ID;
      const organizationId = ctx.session.user.organizationId;

      await ctx.db.$transaction(async (tx) => {
        console.info("Searching for organization with ID", organizationId);

        const organization = await tx.organization.findUniqueOrThrow({
          where: {
            id: organizationId,
          },
          select: {
            customDomain: true,
          },
        });

        console.info(
          "Organization found, deleting custom domain",
          organization.customDomain,
          "from the database",
        );

        await tx.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            customDomain: null,
          },
        });

        console.info("Custom domain deleted from the database successfully");

        console.info(
          "Deleting custom domain",
          organization.customDomain,
          "from Vercel",
        );

        const url = `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${organization.customDomain}?teamId=${vercelTeamId}`;

        await fetch(url, {
          headers: {
            Authorization: `Bearer ${vercelAuthToken}`,
          },
          method: "DELETE",
        });

        console.info(
          `Custom domain deleted from Vercel for organization with ID ${organizationId} successfully!`,
        );
      });
    },
  ),
  verifyDomainStatus: protectedProcedure.query(async ({ ctx }) => {
    const vercelProjectId = env.VERCEL_PROJECT_ID;
    const vercelAuthToken = env.VERCEL_AUTH_TOKEN;
    const vercelTeamId = env.VERCEL_TEAM_ID;
    const organizationId = ctx.session.user.organizationId;

    console.info(
      "Verifying status of custom web domain for organization with ID",
      organizationId,
    );

    const organization = await ctx.db.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
      select: {
        customDomain: true,
      },
    });

    const configRequestUrl = `https://api.vercel.com/v6/domains/${organization.customDomain}/config?teamId=${vercelTeamId}`;
    const domainRequestUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${organization.customDomain}?teamId=${vercelTeamId}`;

    const [configResponse, domainResponse] = await Promise.all([
      fetch(configRequestUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${vercelAuthToken}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(domainRequestUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${vercelAuthToken}`,
          "Content-Type": "application/json",
        },
      }),
    ]);

    const configJson = (await configResponse.json()) as DomainConfigResponse;
    const domainJson = (await domainResponse.json()) as DomainResponse;

    if (domainResponse.status !== 200) {
      console.error(
        "Domain not found in Vercel. Response object: ",
        domainJson,
      );

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "El dominio no se encuentra en Vercel",
      });
    }

    // verify domain
    let verificationResponse: DomainVerificationResponse | null = null;

    if (!domainJson.verified) {
      const verificationRes = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${organization.customDomain}/verify?teamId=${vercelTeamId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelAuthToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      verificationResponse = await verificationRes.json();
    }

    if (verificationResponse?.verified) {
      /**
       * Domain was just verified
       */
      return {
        conflicts: configJson.conflicts ?? [],
        configured: !configJson.misconfigured,
        ...verificationResponse,
      };
    }

    return {
      conflicts: configJson.conflicts ?? [],
      configured: !configJson.misconfigured,
      ...domainJson,
      ...(verificationResponse ? { verificationResponse } : {}),
    };
  }),
});
