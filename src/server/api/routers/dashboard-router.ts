import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  getLatestData: protectedProcedure.query(async ({ ctx }) => {
    const prisma = ctx.db;
    const userId = ctx.session.user.id;

    const hasFullPropertyAccess = ctx.session.user.fullPropertyAccess;
    const hasFullClientAccess = ctx.session.user.fullClientAccess;

    const isAdmin = ctx.session.user.isAdmin;

    const hasPropertyPermissions = hasFullPropertyAccess || isAdmin;
    const hasClientPermissions = hasFullClientAccess || isAdmin;

    console.info("Fetching properties for dashboard", { userId });

    const properties = await prisma.property.findMany({
      where: hasPropertyPermissions
        ? {
            organizationId: ctx.session.user.organizationId,
          }
        : {
            agentInChargeId: userId,
            organizationId: ctx.session.user.organizationId,
          },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        propertyPhotos: {
          orderBy: {
            isCoverPhoto: "desc",
          },
        },
        owner: {
          include: {
            emails: true,
            phoneNumbers: true,
          },
        },
        propertyVideos: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      take: 15,
    });

    const salePropertiesCount = await prisma.property.count({
      where: {
        organizationId: ctx.session.user.organizationId,
        OR: [
          {
            listingType: "PERMUTATION_SALE",
          },
          {
            listingType: "SALE",
          },
          {
            listingType: "SALE_RENT",
          },
        ],
      },
    });

    const rentPropertiesCount = await prisma.property.count({
      where: {
        organizationId: ctx.session.user.organizationId,
        OR: [
          {
            listingType: "PERMUTATION_RENT",
          },
          {
            listingType: "RENT",
          },
          {
            listingType: "SALE_RENT",
          },
        ],
      },
    });

    const clientsCount = await prisma.client.count({
      where: {
        organizationId: ctx.session.user.organizationId,
      },
    });

    console.info("Fetched clients count", clientsCount);

    const propertyViewsCount = await prisma.property.aggregate({
      where: {
        organizationId: ctx.session.user.organizationId,
      },
      _sum: {
        clicks: true,
      },
    });

    const propertyViewsCountPreviousMonth = await prisma.property.aggregate({
      where: {
        organizationId: ctx.session.user.organizationId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth()),
        },
      },
      _sum: {
        clicks: true,
      },
    });

    const propertyViewsPercentDifference = propertyViewsCountPreviousMonth._sum
      .clicks
      ? (((propertyViewsCount._sum.clicks ?? 0) -
          (propertyViewsCountPreviousMonth._sum.clicks ?? 0)) /
          (propertyViewsCountPreviousMonth._sum.clicks ?? 0)) *
        100
      : 100;

    console.log("Fetched click count for properties", propertyViewsCount);

    console.info("Fetched properties for dashboard", properties.length);

    const clients = await prisma.client.findMany({
      where: hasClientPermissions
        ? {
            organizationId: ctx.session.user.organizationId,
          }
        : {
            organizationId: ctx.session.user.organizationId,
            createdByUserId: ctx.session.user.id,
          },
      include: {
        emails: true,
        phoneNumbers: true,
        createdByUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    });

    // TODO: fetch recent calendar tasks

    return {
      properties,
      clients,
      salePropertiesCount,
      rentPropertiesCount,
      clientsCount,
      propertyViewsCount,
      propertyViewsPercentDifference,
    };
  }),
});
