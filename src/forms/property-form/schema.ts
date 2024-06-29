import {
  BuiltAreaSizeUnitsEnum,
  ListingTypeEnum,
  PhysicalStatusEnum,
  PropertyTypeEnum,
  PublicationStatusEnum,
  RentTimeEnum,
  VideoPlatformEnum,
} from "@prisma/client";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

export const propertyFormSchema = z
  .object({
    id: z.string().cuid2().nullable(),
    title: z.string().min(1, "La publicación necesita un titulo").trim(),
    shareWithCEUS: z.boolean(),
    propertyType: z.nativeEnum(PropertyTypeEnum),
    publicationStatus: z.nativeEnum(PublicationStatusEnum),
    constructionYear: z.union([
      z
        .string()
        .transform((val) => Number(val))
        .pipe(z.number().optional().nullish().or(z.literal("")))
        .optional()
        .nullish(),
      z
        .string()
        .regex(/^\d{4}$/)
        .optional()
        .nullish(),
    ]),
    physicalStatus: z.nativeEnum(PhysicalStatusEnum),
    agentInChargeId: z.string().cuid2("El agente es requerido").trim(),
    listingType: z.nativeEnum(ListingTypeEnum),
    countryCode: z.string().min(1, "El país es requerido").trim(),
    regionCode: z.union([z.string().min(1).trim().optional(), z.literal("")]),
    cityName: z.union([z.string().min(1).trim().optional(), z.literal("")]),
    zone: z.union([
      z.coerce
        .number()
        .int()
        .min(0, "Zona inválida")
        .max(99, "Zona inválida")
        .optional(),
      z.literal(""),
    ]),
    address: z.string().min(1, "La dirección es requerida").trim(),
    addressLatitude: z.number().optional().nullish(),
    addressLongitude: z.number().optional().nullish(),
    rentPriceDollars: z.union([
      z
        .string()
        .transform((val) => Number(`${val}`.replaceAll(",", "")))
        .pipe(z.number().min(0, "No puede ser menos que USD$0.00"))
        .optional()
        .nullish(),
      z.literal(""),
    ]),
    rentTime: z.union([z.nativeEnum(RentTimeEnum).optional(), z.literal("")]),
    salePriceDollars: z.union([
      z
        .string()
        .transform((val) => Number(`${val}`.replaceAll(",", "")))
        .pipe(z.number().min(0, "No puede ser menos que USD$0.00"))
        .optional()
        .nullish(),
      z.literal(""),
    ]),
    serviceFeePercentage: z.union([
      z.coerce
        .number()
        .min(0, "No puede ser menos del 0%")
        .max(100, "No puede ser más del 100%")
        .optional()
        .nullish(),
      z.literal(""),
    ]),
    uniqueTaxForPropertyDollars: z.union([
      z
        .string()
        .transform((val) => Number(`${val}`.replaceAll(",", "")))
        .pipe(z.number().min(0, "No puede ser menos que USD$0.00"))
        .optional()
        .nullish(),
      z.literal(""),
    ]),
    bathrooms: z.union([
      z.string().transform((value) => Number(value)),
      z.string().regex(/^\d+$/, "Proporcione un número válido"),
    ]),
    bedrooms: z.union([
      z.string().transform((value) => Number(value)),
      z.string().regex(/^\d+$/, "Proporcione un número válido"),
    ]),
    parkingSpaces: z.union([
      z.string().transform((value) => Number(value)),
      z.string().regex(/^\d+$/, "Proporcione un número válido"),
    ]),
    floorNumber: z.union([
      z.string().transform((value) => Number(value)),
      z.string().regex(/^\d+$/, "Proporcione un número válido"),
    ]),
    builtAreaSize: z.coerce
      .number({
        invalid_type_error: "El área construida debe ser un número",
      })
      .min(0),
    builtAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
    totalAreaSize: z.coerce
      .number({
        invalid_type_error: "El área total debe ser un número",
      })
      .min(0),
    totalAreaSizeUnit: z.nativeEnum(BuiltAreaSizeUnitsEnum),
    description: z
      .string()
      .min(20, "Se necesita una descripción de al menos 20 caracteres")
      .trim(),
    notes: z.string().trim().optional(),
    ownerId: z.union([
      z.literal("new"),
      z.literal(""),
      z.string().cuid2().optional().nullish(),
    ]),
    ownerFirstName: z
      .string()
      .min(1, "El nombre del propietario es requerido")
      .trim(),
    ownerLastName: z
      .string()
      .min(1, "El apellido del propietario es requerido")
      .trim(),
    ownerEmailId: z.string().cuid2().optional(),
    ownerEmail: z
      .union([
        z.literal(""),
        z.string().email("El email ingresado es inválido"),
      ])
      .optional()
      .nullish(),
    receivesEmail: z.boolean(),
    ownerPhoneId: z.string().cuid2().optional(),
    ownerPhone: z
      .string()
      .trim()
      .refine(isValidPhoneNumber, { message: "Número de teléfono es inválido" })
      .or(z.literal(""))
      .nullish(),
    ownerPhoneHomeId: z.string().cuid2().optional(),
    ownerPhoneHome: z
      .string()
      .trim()
      .refine(isValidPhoneNumber, { message: "Número de teléfono es inválido" })
      .or(z.literal(""))
      .nullish(),
    media: z.array(
      z.object({
        id: z.string().cuid2().optional(),
        filename: z
          .string()
          .min(1, "La foto necesita tener un nombre de archivo")
          .trim(),
        isCoverPhoto: z.boolean(),
        sourceFile: z.custom(),
        size: z.number().optional().nullish(),
        tempId: z.string().cuid2().optional(),
      }),
    ),
    videoLinks: z.array(
      z.object({
        id: z.string().cuid2().optional(),
        url: z
          .string()
          .url("El enlace de video es inválido")
          .trim()
          .refine(
            (url) => url.includes("youtube.com") || url.includes("youtu.be"),
            { message: "El enlace debe ser de YouTube" },
          ),
        platform: z.nativeEnum(VideoPlatformEnum),
      }),
    ),
  })
  .superRefine((data, context) => {
    if (
      data.listingType === ListingTypeEnum.SALE ||
      data.listingType === ListingTypeEnum.PERMUTATION_SALE
    ) {
      // sale price is required
      if (!data.salePriceDollars) {
        context.addIssue({
          code: "custom",
          path: ["salePriceDollars"],
          message: "El precio de venta es requerido",
        });
        return;
      }
    } else if (
      data.listingType === ListingTypeEnum.RENT ||
      data.listingType === ListingTypeEnum.PERMUTATION_RENT
    ) {
      // rent price is required
      if (!data.rentPriceDollars) {
        context.addIssue({
          code: "custom",
          path: ["rentPriceDollars"],
          message: "El precio de renta es requerido",
        });
        return;
      }
    }

    if (data.media.length > 0) {
      // check there is only one cover photo
      const coverPhotos = data.media.filter((m) => m.isCoverPhoto);

      if (coverPhotos.length > 1) {
        context.addIssue({
          code: "custom",
          path: ["media"],
          message: "Solo puede haber una foto de portada",
        });
      }
    }

    if (
      data.constructionYear &&
      data.constructionYear !== "" &&
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
  });
