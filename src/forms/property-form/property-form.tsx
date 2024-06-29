import { zodResolver } from "@hookform/resolvers/zod";
import { createId } from "@paralleldrive/cuid2";
import {
  BuiltAreaSizeUnitsEnum,
  ListingTypeEnum,
  PhysicalStatusEnum,
  PropertyTypeEnum,
  PublicationStatusEnum,
  type RentTimeEnum,
} from "@prisma/client";
import { CircleCheck, CircleX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import ProcessDialog from "~/components/dialog/process-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { type UploadedImageResponseBody } from "~/lib/types";
import { convertCentsToDollars, getCloudflareImage } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";
import GeneralSection from "./general-section";
import MediaSection from "./media-section";
import OwnerSection from "./owner-section";
import imageCompression from "browser-image-compression";
import { propertyFormSchema } from "./schema";

interface PropertyFormProps {
  propertyToEdit?: RouterOutputs["dashboard"]["getLatestData"]["properties"][number];
  onPropertyUpdated?: () => void;
}

const PropertyForm = ({
  propertyToEdit,
  onPropertyUpdated,
}: PropertyFormProps) => {
  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    mode: "onSubmit",
    defaultValues: {
      id: propertyToEdit?.id ?? null,
      title: propertyToEdit?.title ?? "",
      address: propertyToEdit?.address ?? "",
      bathrooms: propertyToEdit?.bathrooms.toString() ?? "0",
      bedrooms: propertyToEdit?.bedrooms.toString() ?? "0",
      parkingSpaces: propertyToEdit?.parkingSpaces.toString() ?? "0",
      floorNumber: propertyToEdit?.floorNumber.toString() ?? "0",
      builtAreaSize: propertyToEdit?.builtAreaSize ?? 0,
      builtAreaSizeUnit:
        propertyToEdit?.builtAreaSizeUnit ??
        BuiltAreaSizeUnitsEnum.SQUARE_METERS,
      totalAreaSize: propertyToEdit?.totalAreaSize ?? 0,
      totalAreaSizeUnit:
        propertyToEdit?.totalAreaSizeUnit ??
        BuiltAreaSizeUnitsEnum.SQUARE_YARDS,
      agentInChargeId: propertyToEdit?.agentInChargeId ?? "",
      countryCode: propertyToEdit?.countryCode ?? "",
      notes: "",
      physicalStatus: propertyToEdit?.physicalStatus ?? PhysicalStatusEnum.NEW,
      propertyType: propertyToEdit?.propertyType ?? PropertyTypeEnum.HOME,
      publicationStatus:
        propertyToEdit?.publicationStatus ?? PublicationStatusEnum.ACTIVE,
      listingType: propertyToEdit?.listingType ?? ListingTypeEnum.SALE,
      description: propertyToEdit?.description ?? "",
      ownerEmailId: propertyToEdit?.owner?.emails.at(0)?.id,
      receivesEmail:
        propertyToEdit?.owner?.emails.at(0)?.receivesEmail ?? false,
      constructionYear: propertyToEdit?.constructionYear?.toString() ?? "",
      shareWithCEUS: false,
      regionCode: propertyToEdit?.regionCode ?? "",
      cityName: propertyToEdit?.cityName ?? "",
      zone: propertyToEdit?.zone ?? "",
      addressLatitude: propertyToEdit?.addressLatitude ?? null,
      addressLongitude: propertyToEdit?.addressLongitude ?? null,
      rentTime: propertyToEdit?.rentTime ?? undefined,
      serviceFeePercentage: propertyToEdit?.serviceFeePercentage ?? "",
      salePriceDollars: propertyToEdit?.salePriceCents
        ? (convertCentsToDollars(propertyToEdit?.salePriceCents).toFixed(
            2,
          ) as unknown as number)
        : "",
      rentPriceDollars: propertyToEdit?.rentPriceCents
        ? (convertCentsToDollars(propertyToEdit?.rentPriceCents).toFixed(
            2,
          ) as unknown as number)
        : "",
      uniqueTaxForPropertyDollars: propertyToEdit?.uniqueTaxForPropertyCents
        ? (convertCentsToDollars(
            propertyToEdit?.uniqueTaxForPropertyCents,
          ).toFixed(2) as unknown as number)
        : "",
      ownerId: propertyToEdit?.owner?.id ?? "",
      ownerFirstName: propertyToEdit?.owner?.firstName ?? "",
      ownerLastName: propertyToEdit?.owner?.lastName ?? "",
      ownerEmail: propertyToEdit?.owner?.emails.at(0)?.email ?? "",
      ownerPhoneId: propertyToEdit?.owner?.phoneNumbers
        .filter((p) => p.type === "MOBILE")
        .at(0)?.id,
      ownerPhone:
        propertyToEdit?.owner?.phoneNumbers
          .filter((p) => p.type === "MOBILE")
          .at(0)?.phoneNumber ?? "",
      ownerPhoneHomeId: propertyToEdit?.owner?.phoneNumbers
        .filter((p) => p.type === "HOME")
        .at(0)?.id,
      ownerPhoneHome:
        propertyToEdit?.owner?.phoneNumbers
          .filter((p) => p.type === "HOME")
          .at(0)?.phoneNumber ?? "",
      media:
        propertyToEdit?.propertyPhotos.map((photo) => ({
          ...photo,
          sourceFile: getCloudflareImage(photo.cloudflareId, "public"),
          tempId: createId(),
        })) ?? [],
      videoLinks:
        propertyToEdit?.propertyVideos?.map((video) => ({
          id: video.id,
          url: video.videoUrl,
          platform: video.platform,
        })) ?? [],
    },
  });

  const utils = api.useUtils();

  const { remove: removePhoto } = useFieldArray({
    control: form.control,
    name: "media",
  });

  const { remove: removeVideoLink } = useFieldArray({
    control: form.control,
    name: "videoLinks",
  });

  // horrible hack that seems to work
  const [formIsSubmittedHack, setFormIsSubmittedHack] = useState(false);

  const [processSubtitle, setProcessSubtitle] = useState("");

  useEffect(() => {
    if (formIsSubmittedHack) {
      form.reset();
      setFormIsSubmittedHack(false);
    }
  }, [form, formIsSubmittedHack]);

  const createPropertyMutation = api.properties.createProperty.useMutation();
  const updatePropertyMutation = api.properties.updateProperty.useMutation();

  const batchUploadTokenMutation = api.media.generateBatchToken.useMutation();
  const addPropertyPhotoMutation = api.media.addPropertyPhoto.useMutation();

  const uploadPropertyPhoto = async (
    numberOfTries: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourceFile: any,
    batchToken: string,
  ) => {
    try {
      const cloudflareFormData = new FormData();

      if (!sourceFile)
        throw new Error("No se encontró una imagen para publicar");

      const url = `https://batch.imagedelivery.net/images/v1`;

      cloudflareFormData.append("file", sourceFile);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${batchToken}`,
        },
        body: cloudflareFormData,
      });

      const responseContent =
        (await response.json()) as UploadedImageResponseBody;

      if (!responseContent.result.id) {
        throw new Error("Error uploading photo");
      }

      return responseContent.result;
    } catch (error) {
      if (numberOfTries < 3) {
        await uploadPropertyPhoto(numberOfTries + 1, sourceFile, batchToken);
      } else {
        console.error("Error uploading photo");
      }
    }
  };

  const uploadPhotos = useCallback(
    async (
      propertyId: string,
      batchToken: string,
      propertyPhotos: {
        isCoverPhoto: boolean;
        filename: string;
        id?: string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceFile?: any;
        size?: number | null | undefined;
        tempId?: string | undefined;
      }[],
    ) => {
      const maxPhotosToUpload = propertyPhotos.length;
      let uploadedPhotos = 0;
      let errors = 0;

      const compressedPhotos = await Promise.all(
        propertyPhotos.map(async (photo) => {
          if (!photo.sourceFile)
            throw new Error("No se encontró una imagen para publicar");

          const compressedPhoto = await imageCompression(photo.sourceFile, {
            maxSizeMB: 10,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });

          return {
            ...photo,
            sourceFile: compressedPhoto,
          };
        }),
      );

      for (const { sourceFile, filename, isCoverPhoto } of compressedPhotos) {
        const responseContent = await uploadPropertyPhoto(
          0,
          sourceFile,
          batchToken,
        );

        uploadedPhotos++;

        if (responseContent?.id) {
          await addPropertyPhotoMutation.mutateAsync({
            propertyId,
            photo: {
              cloudFlareId: responseContent.id,
              filename,
              uploadedAt: new Date(responseContent.uploaded),
              isCoverPhoto,
            },
          });

          setProcessSubtitle(
            `Subiendo fotos (${uploadedPhotos}/${maxPhotosToUpload})`,
          );
        } else {
          console.error("Error uploading photo");
          errors++;
        }
      }

      if (errors > 0) {
        toast("Error", {
          description: "Algunas fotos no pudieron ser subidas por un error",
          icon: <CircleX />,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addPropertyPhotoMutation, setProcessSubtitle, processSubtitle],
  );

  const createProperty = useCallback(
    async (formData: z.infer<typeof propertyFormSchema>) => {
      try {
        const newPropertyId = await createPropertyMutation.mutateAsync({
          ...formData,
          bathrooms: Number(formData.bathrooms),
          bedrooms: Number(formData.bedrooms),
          parkingSpaces: Number(formData.parkingSpaces),
          floorNumber: Number(formData.floorNumber),
          constructionYear: formData.constructionYear
            ? Number(formData.constructionYear)
            : null,
          zone: formData.zone as number,
          addressLatitude: formData.addressLatitude ?? undefined,
          addressLongitude: formData.addressLongitude ?? undefined,
          rentPriceDollars: formData.rentPriceDollars as number,
          salePriceDollars: formData.salePriceDollars as number,
          rentTime: formData.rentTime as RentTimeEnum,
          serviceFeePercentage: formData.serviceFeePercentage as number,
          uniqueTaxForPropertyDollars:
            formData.uniqueTaxForPropertyDollars as number,
        });

        if (formData.media.length > 0) {
          const batchUploadToken = await batchUploadTokenMutation.mutateAsync();

          const mediaWithUrls = formData.media.map((photo) => ({
            ...photo,
          }));

          await uploadPhotos(newPropertyId, batchUploadToken, mediaWithUrls);
        }

        toast("Inmueble creado", {
          description: "Se ha creado el inmueble exitosamente",
          icon: <CircleCheck />,
        });

        form.reset();

        form.watch("media").forEach((_, index) => removePhoto(index));
        form.watch("videoLinks").forEach((_, index) => removeVideoLink(index));
        setFormIsSubmittedHack(true);
      } catch (error) {
        console.error((error as Error).message);
        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [
      batchUploadTokenMutation,
      createPropertyMutation,
      form,
      removePhoto,
      removeVideoLink,
      uploadPhotos,
    ],
  );

  const updateProperty = useCallback(
    async (formData: z.infer<typeof propertyFormSchema>) => {
      try {
        if (!formData.id) return;

        // check what photos were deleted
        const deletedPhotos =
          propertyToEdit?.propertyPhotos.filter(
            (photo) =>
              !formData.media.some((newPhoto) => newPhoto.id === photo.id),
          ) ?? [];

        // check what photos were added
        const addedPhotos =
          formData.media.filter(
            (newPhoto) => newPhoto.tempId && !newPhoto.id,
          ) ?? [];

        // check what photos were updated
        const updatedPhotos =
          formData.media.filter((newPhoto) =>
            propertyToEdit?.propertyPhotos.some(
              (photo) => photo.id === newPhoto.id,
            ),
          ) ?? [];

        // check what videos were deleted
        const deletedVideos =
          propertyToEdit?.propertyVideos?.filter(
            (video) =>
              !formData.videoLinks.some((newVideo) => newVideo.id === video.id),
          ) ?? [];

        // check what videos were added
        const addedVideos =
          formData.videoLinks.filter((newVideo) => !newVideo.id) ?? [];

        // check what videos were updated
        const updatedVideos =
          formData.videoLinks.filter((newVideo) =>
            propertyToEdit?.propertyVideos?.some(
              (video) => video.id === newVideo.id,
            ),
          ) ?? [];

        const videoLinks = [
          ...addedVideos.map((v) => ({
            id: v.id,
            platform: v.platform,
            url: v.url,
            isDeleted: false,
          })),
          ...updatedVideos.map((v) => ({
            id: v.id,
            platform: v.platform,
            url: v.url,
            isDeleted: undefined,
          })),
          ...deletedVideos.map((v) => ({
            id: v.id,
            platform: v.platform,
            url: v.videoUrl,
            isDeleted: true,
          })),
        ];

        const photos = [
          ...updatedPhotos.map((p) => ({
            id: p.id,
            isCoverPhoto: p.isCoverPhoto,
            isDeleted: undefined,
          })),
          ...deletedPhotos.map((p) => ({
            id: p.id,
            isCoverPhoto: p.isCoverPhoto,
            isDeleted: true,
          })),
        ];

        const updatedPropertyId = await updatePropertyMutation.mutateAsync({
          ...formData,
          id: formData.id,
          ownerId: formData.ownerId,
          videoLinks,
          media: photos,
          constructionYear: formData.constructionYear
            ? Number(formData.constructionYear)
            : null,
          zone: formData.zone as number,
          addressLatitude: formData.addressLatitude!,
          addressLongitude: formData.addressLongitude!,
          rentPriceDollars: formData.rentPriceDollars as number,
          salePriceDollars: formData.salePriceDollars as number,
          rentTime: formData.rentTime as RentTimeEnum,
          serviceFeePercentage: formData.serviceFeePercentage as number,
          uniqueTaxForPropertyDollars:
            formData.uniqueTaxForPropertyDollars as number,
          bathrooms: Number(formData.bathrooms),
          bedrooms: Number(formData.bedrooms),
          parkingSpaces: Number(formData.parkingSpaces),
          floorNumber: Number(formData.floorNumber),
        });

        if (addedPhotos.length > 0) {
          const batchUploadToken = await batchUploadTokenMutation.mutateAsync();

          const mediaWithUrls = addedPhotos.map((photo) => ({
            ...photo,
          }));

          await uploadPhotos(
            updatedPropertyId,
            batchUploadToken,
            mediaWithUrls,
          );

          setProcessSubtitle("Subiendo fotos");
        }

        toast("Inmueble actualizado", {
          description: "Se ha actualizado el inmueble correctamente",
          icon: <CircleCheck />,
        });

        onPropertyUpdated?.();
      } catch (error) {
        console.error((error as Error).message);
      }
    },
    [
      batchUploadTokenMutation,
      onPropertyUpdated,
      propertyToEdit?.propertyPhotos,
      propertyToEdit?.propertyVideos,
      updatePropertyMutation,
      uploadPhotos,
    ],
  );

  const onSubmit = useCallback(
    async (formData: z.infer<typeof propertyFormSchema>) => {
      if (propertyToEdit) {
        await updateProperty(formData);
        await utils.clients.listOwners.invalidate();
      } else {
        await createProperty(formData);
        await utils.clients.listOwners.invalidate();
      }
    },
    [createProperty, propertyToEdit, updateProperty, utils.clients.listOwners],
  );

  return (
    <>
      <Form {...form}>
        <FormProvider {...form}>
          <form
            onKeyDown={(e) => {
              const key = e.key;
              if (
                key === "Enter" &&
                (e.target as HTMLElement).tagName !== "TEXTAREA"
              ) {
                e.preventDefault();
              }
            }}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <Card>
                  <CardHeader className="p-7 md:p-6">
                    <CardTitle>Datos generales</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-7 md:p-6">
                    <GeneralSection propertyToEdit={propertyToEdit} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <Card>
                  <CardHeader className="p-7 md:p-6">
                    <CardTitle>Datos del propietario</CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4 p-7 md:p-6">
                    <OwnerSection />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-7 md:p-6">
                    <CardTitle>Fotos</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-7 md:p-6">
                    <MediaSection propertyToEdit={propertyToEdit} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </FormProvider>
      </Form>
      <ProcessDialog
        isOpen={form.formState.isSubmitting}
        isProcessing={form.formState.isSubmitting}
        processTitle={
          propertyToEdit ? "Actualizando inmueble" : "Creando inmueble"
        }
        subtitle={processSubtitle}
      />
    </>
  );
};

export default PropertyForm;
