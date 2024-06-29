import imageCompression from "browser-image-compression";
import { Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import UpdateOrganizationForm from "~/forms/update-organization-form";
import { type UploadedImageResponseBody } from "~/lib/types";
import {
  formatPhoneNumberWorkaround,
  getCloudflareImage,
  getCountryByCode,
} from "~/lib/utils";
import { api } from "~/utils/api";
import BusinessValuesMenu from "./menus/business-values-menu";
import WebsiteInformationMenu from "./menus/website-information-menu";
import WebsiteSocialMediaLinks from "./menus/website-social-media-links-menu";
import SeoConfigMenu from "./menus/seo-config-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { OrganizationWebsiteThemeEnum } from "@prisma/client";

const MyBusinessInfo = () => {
  const router = useRouter();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in").catch(console.error);
    },
  });

  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);

  const [logoConfirmationIsOpen, setLogoConfirmationIsOpen] = useState(false);

  const [logoChangeProcessing, setLogoChangeProcessing] = useState(false);

  const [logoImage, setLogoImage] = useState<File | null>(null);

  const utils = api.useUtils();

  const { data: organization, isLoading } =
    api.organizations.getDetails.useQuery(undefined, {
      enabled: !!session.data?.user.organizationId,
    });

  const [websiteTheme, setWebsiteTheme] =
    useState<OrganizationWebsiteThemeEnum>(
      organization?.websiteTheme ?? OrganizationWebsiteThemeEnum.VIXEN,
    );

  const generateSignedUrlsMutation =
    api.media.generateSignedUrlsForPhotos.useMutation();

  const changeThemeMutation =
    api.organizations.updateWebsiteTheme.useMutation();

  const updateLogoMutation = api.organizations.updateLogo.useMutation();

  const handleProfilePhotoChange = useCallback(async () => {
    if (!logoImage) {
      return;
    }

    try {
      setLogoChangeProcessing(true);

      const [url] = await generateSignedUrlsMutation.mutateAsync({
        filesCount: 1,
      });

      if (!url) {
        return;
      }

      const cloudflareFormData = new FormData();

      const compressedSourceFile = await imageCompression(logoImage, {
        maxSizeMB: 10,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      cloudflareFormData.append("file", compressedSourceFile);

      const response = await fetch(url, {
        method: "POST",
        body: cloudflareFormData,
      });

      const responseContent =
        (await response.json()) as UploadedImageResponseBody;

      await updateLogoMutation.mutateAsync(responseContent.result.id);
      await utils.organizations.getDetails.invalidate();

      setLogoChangeProcessing(false);
      setLogoConfirmationIsOpen(false);
    } catch (error) {
      console.error((error as Error).message);
      setLogoChangeProcessing(false);
    }
  }, [
    generateSignedUrlsMutation,
    logoImage,
    updateLogoMutation,
    utils.organizations.getDetails,
  ]);

  if (isLoading || !organization) {
    return (
      <Card className="w-full">
        <CardContent>
          <div className="mt-72 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Cargando</h1>
            <p>Por favor espera un momento...</p>
            <LoadingSpinner className="mt-4 h-16 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            Información básica
            <StandardDialog
              isOpen={editDialogIsOpen}
              onOpenChange={setEditDialogIsOpen}
              title="Editar empresa"
              updateProcessTitle="Actualizando empresa"
              updateConfirmationTitle="Empresa actualizada"
              updateConfirmationDescription="La empresa ha sido actualizado exitosamente."
              description="Puedes editar la información de tu empresa aquí."
              triggerComponent={
                <Button
                  size="icon"
                  variant="outline"
                  className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              }
            >
              <StandardDialogContent>
                <ScrollArea className="h-full">
                  <UpdateOrganizationForm
                    organizationToUpdate={organization}
                    onOrganizationUpdated={() => {
                      setEditDialogIsOpen(false);
                      utils.organizations.getDetails
                        .invalidate()
                        .catch((error) => console.error(error));
                    }}
                  />
                </ScrollArea>
              </StandardDialogContent>
            </StandardDialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-12 md:flex-row md:gap-4">
            <div className="flex flex-shrink-0 flex-col gap-4">
              <div className="flex gap-4">
                <h3 className="text-xl">
                  {organization?.name ?? "Nombre no definido"}
                </h3>
              </div>
              <p className="text-sm">
                Creada en:{" "}
                <strong className="font-semibold">
                  {organization?.createdAt
                    ? new Date(organization.createdAt).toLocaleDateString(
                        "es-MX",
                      )
                    : "No definido"}
                </strong>
              </p>
              <p className="text-sm">
                Dominio web auto generado:{" "}
                <strong className="font-semibold">
                  {organization?.generatedDomain}.ceuss.site
                </strong>
              </p>
              <p className="text-sm">
                Dirección:{" "}
                <strong className="font-semibold">
                  {organization?.address ?? "No definido"}
                </strong>
              </p>
              <p className="text-sm">
                País:{" "}
                <strong className="font-semibold">
                  {organization?.countryCode
                    ? getCountryByCode(organization.countryCode)?.name
                    : "No definido"}
                </strong>
              </p>
              <div>
                <h5>Correos electrónicos</h5>
                <div className="flex flex-col gap-2 py-2 pl-4">
                  {organization.emails.map((email) => (
                    <p className="text-sm font-semibold" key={email.id}>
                      {email.email}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h5>Números telefónicos</h5>
                <div className="flex flex-col gap-2 py-2 pl-4">
                  {organization?.phoneNumbers.map((phoneNumber) => (
                    <p className="text-sm font-semibold" key={phoneNumber.id}>
                      {formatPhoneNumberWorkaround(
                        phoneNumber.phoneNumber ?? "",
                      )}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h5>Plantilla de website</h5>
                <Select
                  disabled={changeThemeMutation.isPending}
                  onValueChange={(value) => {
                    setWebsiteTheme(value as OrganizationWebsiteThemeEnum);

                    changeThemeMutation
                      .mutateAsync({
                        theme: value as OrganizationWebsiteThemeEnum,
                      })
                      .catch(console.error);
                  }}
                  value={websiteTheme}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrganizationWebsiteThemeEnum.VIXEN}>
                      Plantilla 1 (Vixen)
                    </SelectItem>

                    <SelectItem value={OrganizationWebsiteThemeEnum.OCEAN}>
                      Plantilla 2 (Oceano)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex w-full flex-1 flex-col items-center gap-4 md:items-end">
              <div className="flex min-w-56 max-w-80 flex-col items-center gap-4">
                {organization?.logo ? (
                  <AspectRatio ratio={1} className="max-h-96 max-w-96">
                    <Image
                      fill
                      alt="Foto del usuario"
                      src={getCloudflareImage(organization.logo, "public")}
                      className="object-contain"
                    />
                  </AspectRatio>
                ) : (
                  <AspectRatio ratio={1} className="max-h-96 max-w-96">
                    <div className="flex h-full w-full items-center justify-center bg-stone-200">
                      <p className="text-sm text-muted-foreground">
                        No se ha seleccionado un logo
                      </p>
                    </div>
                  </AspectRatio>
                )}
                <div className="rounded-md px-4 py-2 transition-colors hover:bg-stone-800">
                  <Label htmlFor="picture">
                    {" "}
                    <Edit className="mb-1 mr-2 inline h-4 w-4" />
                    Cambiar logo
                  </Label>
                  <Input
                    id="picture"
                    accept="image/png, image/jpeg, image/webp"
                    type="file"
                    className="hidden"
                    onClick={(event) => {
                      event.currentTarget.value = "";
                    }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      setLogoImage(file);
                      setLogoConfirmationIsOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row">
        <WebsiteInformationMenu />
        <BusinessValuesMenu />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <WebsiteSocialMediaLinks />
        <SeoConfigMenu />
      </div>

      <Dialog
        open={logoConfirmationIsOpen}
        onOpenChange={(value) => {
          if (logoChangeProcessing) return;

          setLogoConfirmationIsOpen(value);
          setLogoImage(null);
        }}
      >
        {logoChangeProcessing ? (
          <DialogContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-3xl font-bold">Actualizando logo</h1>
              <p>Por favor espera un momento...</p>
              <LoadingSpinner className="mt-4 h-16 w-16" />
            </div>
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar logo de la empresa</DialogTitle>
              <DialogDescription>
                Confirma que quieres usar esta foto
              </DialogDescription>
            </DialogHeader>
            {logoImage ? (
              <div className="flex flex-col items-center gap-8 px-12">
                <AspectRatio ratio={1} className="w-full">
                  <Image
                    fill
                    alt="Foto del usuario"
                    src={URL.createObjectURL(logoImage)}
                    className="object-contain"
                  />
                </AspectRatio>
                <Button onClick={handleProfilePhotoChange}>
                  <Edit className="mr-2 h-4 w-4" /> Usar esta imagen como logo
                  de la empresa
                </Button>
              </div>
            ) : null}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default MyBusinessInfo;
