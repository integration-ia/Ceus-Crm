import {
  BuiltAreaSizeUnitsEnum,
  ClientTypeEnum,
  ListingTypeEnum,
  PhysicalStatusEnum,
  PropertyTypeEnum,
  PublicationStatusEnum,
  RentTimeEnum,
  SubscriptionTierEnum,
  type UserPermission,
  UserPermissionTypeEnum,
  OrganizationSocialMediaPlatformEnum,
} from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { City, Country, State } from "country-state-city";
import Dinero from "dinero.js";
import localizedCountries from "i18n-iso-countries";
import spanishLocale from "i18n-iso-countries/langs/es.json";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { twMerge } from "tailwind-merge";
import { env } from "~/env";

localizedCountries.registerLocale(spanishLocale);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(input: string, numChars: number) {
  if (input.length > numChars) {
    return input.substring(0, numChars) + "…";
  } else {
    return input;
  }
}

export function formatCurrency(amountInCents: number | bigint) {
  if (typeof amountInCents === "bigint") {
    amountInCents = Number(amountInCents);
  }

  const amount = Dinero({ amount: amountInCents, currency: "USD" });

  const amountInCurrency = amount.toFormat("$0,0.00");

  return "USD" + amountInCurrency;
}

export function formatPropertyType(type: PropertyTypeEnum) {
  switch (type) {
    case PropertyTypeEnum.HOME:
      return { label: "Casa", value: type };
    case PropertyTypeEnum.APARTMENT:
      return { label: "Apartamento", value: type };
    case PropertyTypeEnum.LOCAL:
      return { label: "Local", value: type };
    case PropertyTypeEnum.OFFICE:
      return { label: "Oficina", value: type };
    case PropertyTypeEnum.WAREHOUSE:
      return { label: "Bodega", value: type };
    case PropertyTypeEnum.TERRAIN:
      return { label: "Terreno", value: type };
    case PropertyTypeEnum.LOT:
      return { label: "Lote", value: type };
    case PropertyTypeEnum.BUILDING:
      return { label: "Edificio", value: type };
    case PropertyTypeEnum.ESTATE:
      return { label: "Finca", value: type };
    case PropertyTypeEnum.CHALET:
      return { label: "Chalet", value: type };
    case PropertyTypeEnum.HOTEL:
      return { label: "Hotel", value: type };
    case PropertyTypeEnum.LODGING_HOUSE:
      return { label: "Hostal", value: type };
    case PropertyTypeEnum.PRIVATE_ROOM:
      return { label: "Habitación privada", value: type };
    case PropertyTypeEnum.ATTIC:
      return { label: "Ático", value: type };
    case PropertyTypeEnum.BUNGALOW:
      return { label: "Bungalow", value: type };
    case PropertyTypeEnum.BEACH_HOUSE:
      return { label: "Casa de playa", value: type };
    case PropertyTypeEnum.GARAGE:
      return { label: "Garaje", value: type };
    case PropertyTypeEnum.CABIN:
      return { label: "Cabaña", value: type };
    case PropertyTypeEnum.PENTHOUSE:
      return { label: "Penthouse", value: type };
    case PropertyTypeEnum.STUDIO:
      return { label: "Estudio", value: type };
    case PropertyTypeEnum.LOFT:
      return { label: "Loft", value: type };
    case PropertyTypeEnum.TOWNHOUSE:
      return { label: "Townhouse", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedPropertyTypes() {
  return Object.values(PropertyTypeEnum).map((type) => {
    return formatPropertyType(type);
  });
}

export function formatPublicationStatus(type: PublicationStatusEnum) {
  switch (type) {
    case PublicationStatusEnum.ACTIVE:
      return { label: "Activo", value: type };
    case PublicationStatusEnum.FEATURED:
      return { label: "Destacado", value: type };
    case PublicationStatusEnum.INACTIVE:
      return { label: "Inactivo", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedPublicationStatuses() {
  return Object.values(PublicationStatusEnum).map((type) => {
    return formatPublicationStatus(type);
  });
}

export function formatPhysicalStatus(type: PhysicalStatusEnum) {
  switch (type) {
    case PhysicalStatusEnum.IN_CONSTRUCTION:
      return { label: "En construcción", value: type };
    case PhysicalStatusEnum.NEW:
      return { label: "Nuevo", value: type };
    case PhysicalStatusEnum.IN_PROJECT:
      return { label: "En proyecto", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedPhysicalStatuses() {
  return Object.values(PhysicalStatusEnum).map((type) => {
    return formatPhysicalStatus(type);
  });
}

export function formatListingType(type: ListingTypeEnum) {
  switch (type) {
    case ListingTypeEnum.SALE:
      return { label: "Venta", value: type };
    case ListingTypeEnum.RENT:
      return { label: "Renta", value: type };
    case ListingTypeEnum.PERMUTATION_RENT:
      return { label: "Permutar - Renta", value: type };
    case ListingTypeEnum.PERMUTATION_SALE:
      return { label: "Permutar - Venta", value: type };
    case ListingTypeEnum.SALE_RENT:
      return { label: "Venta - Renta", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedListingTypes() {
  return Object.values(ListingTypeEnum).map((type) => {
    return formatListingType(type);
  });
}

export function formatRentTimes(type: RentTimeEnum) {
  switch (type) {
    case RentTimeEnum.MONTHLY:
      return { label: "Mensual", value: type };
    case RentTimeEnum.WEEKLY:
      return { label: "Semanal", value: type };
    case RentTimeEnum.YEARLY:
      return { label: "Anual", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedRentTimes() {
  return Object.values(RentTimeEnum).map((type) => {
    return formatRentTimes(type);
  });
}

export function formatBuiltAreaSizeUnits(type: BuiltAreaSizeUnitsEnum) {
  switch (type) {
    case BuiltAreaSizeUnitsEnum.SQUARE_METERS:
      return { label: "m²", value: type };
    case BuiltAreaSizeUnitsEnum.SQUARE_YARDS:
      return { label: "vr²", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedBuiltAreaSizeUnits() {
  return Object.values(BuiltAreaSizeUnitsEnum).map((type) => {
    return formatBuiltAreaSizeUnits(type);
  });
}

export function formatClientType(type: ClientTypeEnum) {
  switch (type) {
    case ClientTypeEnum.BUYER:
      return { label: "Cliente comprador", value: type };
    case ClientTypeEnum.OWNER:
      return { label: "Propietario", value: type };
    case ClientTypeEnum.RENTER:
      return { label: "Cliente alquiler", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function formatSubscriptionTiers(type: SubscriptionTierEnum) {
  switch (type) {
    case SubscriptionTierEnum.BASIC:
      return { label: "Básico", value: type };
    case SubscriptionTierEnum.PREMIUM:
      return { label: "Premium", value: type };
    default:
      return { label: "Desconocido", value: type };
  }
}

export function getFormattedClientTypes() {
  return Object.values(ClientTypeEnum).map((type) => {
    return formatClientType(type);
  });
}

export function formatSocialMediaPlatform(
  platform: OrganizationSocialMediaPlatformEnum,
) {
  switch (platform) {
    case OrganizationSocialMediaPlatformEnum.FACEBOOK:
      return { label: "Facebook", value: platform };
    case OrganizationSocialMediaPlatformEnum.INSTAGRAM:
      return { label: "Instagram", value: platform };
    case OrganizationSocialMediaPlatformEnum.X:
      return { label: "X", value: platform };
    case OrganizationSocialMediaPlatformEnum.TIK_TOK:
      return { label: "TikTok", value: platform };
    default:
      return { label: "Desconocido", value: platform };
  }
}

export function getFormattedSocialMediaPlatforms() {
  return Object.values(OrganizationSocialMediaPlatformEnum).map((type) => {
    return formatSocialMediaPlatform(type);
  });
}

export function getCountriesList() {
  return Country.getAllCountries()
    .map(({ isoCode, flag }) => ({
      isoCode,
      flag,
      name: localizedCountries.getName(isoCode, "es") ?? "Desconocido",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCountryByCode(countryCode: string) {
  const country = Country.getCountryByCode(countryCode);

  if (country) {
    return {
      isoCode: country.isoCode,
      flag: country.flag,
      name: localizedCountries.getName(country.isoCode, "es"),
    };
  }
}

export function getRegionByCode(regionCode: string, countryCode: string) {
  const region = State.getStateByCodeAndCountry(regionCode, countryCode);

  let name = region?.name;

  const words = region?.name.split(" ") ?? [];
  const lastWord = words[words.length - 1];
  if (
    lastWord === "Department" ||
    lastWord === "Province" ||
    lastWord === "Region" ||
    lastWord === "District"
  ) {
    name = words.slice(0, -1).join(" ");
  }

  if (region) {
    return {
      isoCode: region.isoCode,
      name,
    };
  }
}

export function getStatesOfCountry(countryCode: string) {
  return State.getStatesOfCountry(countryCode).map(({ name, isoCode }) => ({
    isoCode,
    name: sanitizeStateName(name),
  }));
}

export function getCitiesOfState(countryCode: string, stateCode: string) {
  return City.getCitiesOfState(countryCode, stateCode)
    .filter(({ name }) => !name.includes("Municipio de"))
    .map(({ name, latitude, longitude }) => ({ name, latitude, longitude }));
}

export function sanitizeStateName(input: string) {
  const words = input.split(" ");
  const lastWord = words[words.length - 1];
  if (
    lastWord === "Department" ||
    lastWord === "Province" ||
    lastWord === "Region" ||
    lastWord === "District"
  ) {
    return words.slice(0, -1).join(" ");
  } else {
    return input;
  }
}

export function convertDollarsToCents(dollars: number): number {
  return dollars * 100;
}

export function convertCentsToDollars(cents: number | bigint): number {
  if (typeof cents === "bigint") {
    cents = Number(cents);
  }

  return Dinero({ amount: cents, currency: "USD" }).toUnit();
}

export function truncateFileName(
  filename: string | undefined,
  lengthThreshold = 20,
): string {
  if (!filename) return "";

  const roughHalfOfString = 2.5;

  // just return the filename if it's length is less than the threshold (20 by default)
  if (filename.length < lengthThreshold) return filename;

  const sideLength = Math.floor(lengthThreshold / roughHalfOfString);
  const filenamePieces = filename.split(".");

  // capture the last element of the array (the extension) into a variable
  const extension = filenamePieces.pop();

  const filenameBeforeExtension = filenamePieces
    .slice(0, filenamePieces.length)
    .join(".");

  const firstLetters = filenameBeforeExtension.slice(
    0,
    Math.max(0, sideLength),
  );
  const lastLetters = filenameBeforeExtension.slice(
    Math.max(0, filenameBeforeExtension.length - sideLength),
  );

  return `${firstLetters}…${lastLetters}.${extension}`;
}

export function bytesToMegabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

const accountHash = env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH;

export function getCloudflareImage(
  imageId: string,
  imageVariant: "public" | "thumbnail" | "hero",
) {
  return `https://imagedelivery.net/${accountHash}/${imageId}/${imageVariant}`;
}

export function prefixZeroes(num: bigint, totalLength = 8): string {
  let numStr = num.toString();
  while (numStr.length < totalLength) {
    numStr = "0" + numStr;
  }
  return numStr;
}

export function generateUserPermissionsForAdmin() {
  return [
    {
      permission: UserPermissionTypeEnum.CAN_CREATE_PROPERTIES,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_CREATE_CLIENTS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.FULL_CLIENT_ACCESS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.FULL_PROPERTY_ACCESS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_SEE_GLOBAL_STATS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_EXPORT_CLIENTS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_DELETE_CLIENTS,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_DELETE_PROPERTIES,
      isEnabled: true,
    },
    {
      permission: UserPermissionTypeEnum.CAN_ASSIGN_PROPERTIES,
      isEnabled: true,
    },
  ];
}

export function getPermissionValuesForUser(permissionsArray: UserPermission[]) {
  const canCreateProperties = permissionsArray.at(0)?.isEnabled ?? false;
  const canCreateClients = permissionsArray.at(1)?.isEnabled ?? false;
  const fullClientAccess = permissionsArray.at(2)?.isEnabled ?? false;
  const fullPropertyAccess = permissionsArray.at(3)?.isEnabled ?? false;
  const canSeeGlobalStats = permissionsArray.at(4)?.isEnabled ?? false;
  const canExportClients = permissionsArray.at(5)?.isEnabled ?? false;
  const canDeleteClients = permissionsArray.at(6)?.isEnabled ?? false;
  const canDeleteProperties = permissionsArray.at(7)?.isEnabled ?? false;
  const canAssignProperties = permissionsArray.at(8)?.isEnabled ?? false;

  return {
    canCreateProperties,
    canCreateClients,
    fullClientAccess,
    fullPropertyAccess,
    canSeeGlobalStats,
    canExportClients,
    canDeleteClients,
    canDeleteProperties,
    canAssignProperties,
  };
}

export function formatPhoneNumberWorkaround(phoneNumber: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return formatPhoneNumberIntl(phoneNumber as any);
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function setPermissionValuesForNewUser(permissions: {
  canCreateProperties: boolean;
  canCreateClients: boolean;
  fullClientAccess: boolean;
  fullPropertyAccess: boolean;
  canSeeGlobalStats: boolean;
  canExportClients: boolean;
  canDeleteClients: boolean;
  canDeleteProperties: boolean;
  canAssignProperties: boolean;
}) {
  return [
    {
      permission: UserPermissionTypeEnum.CAN_CREATE_PROPERTIES,
      isEnabled: permissions.canCreateProperties,
    },
    {
      permission: UserPermissionTypeEnum.CAN_CREATE_CLIENTS,
      isEnabled: permissions.canCreateClients,
    },
    {
      permission: UserPermissionTypeEnum.FULL_CLIENT_ACCESS,
      isEnabled: permissions.fullClientAccess,
    },
    {
      permission: UserPermissionTypeEnum.FULL_PROPERTY_ACCESS,
      isEnabled: permissions.fullPropertyAccess,
    },
    {
      permission: UserPermissionTypeEnum.CAN_SEE_GLOBAL_STATS,
      isEnabled: permissions.canSeeGlobalStats,
    },
    {
      permission: UserPermissionTypeEnum.CAN_EXPORT_CLIENTS,
      isEnabled: permissions.canExportClients,
    },
    {
      permission: UserPermissionTypeEnum.CAN_DELETE_CLIENTS,
      isEnabled: permissions.canDeleteClients,
    },
    {
      permission: UserPermissionTypeEnum.CAN_DELETE_PROPERTIES,
      isEnabled: permissions.canDeleteProperties,
    },
    {
      permission: UserPermissionTypeEnum.CAN_ASSIGN_PROPERTIES,
      isEnabled: permissions.canAssignProperties,
    },
  ];
}
