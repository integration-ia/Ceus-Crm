import Image from "next/image";
import { useRouter } from "next/router";
import { useState, type ReactNode } from "react";
import CmsLayout from "~/components/layout/cms-layout";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import Note from "~/components/ui/note";
import {
  formatBuiltAreaSizeUnits,
  formatCurrency,
  formatListingType,
  formatPropertyType,
  getCloudflareImage,
  getCountryByCode,
  getRegionByCode,
  prefixZeroes,
} from "~/lib/utils";
import { api } from "~/utils/api";
import ReactPlayer from "react-player/youtube";
import { Button } from "~/components/ui/button";
import { NotebookPen, PlusCircle } from "lucide-react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import PropertyNoteForm from "~/forms/property-note-form";
import { ScrollArea } from "~/components/ui/scroll-area";
import Empty from "~/components/ui/empty";

const PropertyDetailsPage = () => {
  const router = useRouter();
  const propertyId = router.query.propertyId as string;
  const utils = api.useUtils();
  const [createDialogIsOpen, setCreateDialogIsOpen] = useState(false);

  const { data: propertyData, isLoading } =
    api.properties.getDetails.useQuery(propertyId);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Cargando los datos del inmueble</h1>
        <p>Por favor espera un momento...</p>
        <LoadingSpinner className="mt-4 h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-9 md:flex-row md:items-start">
      <div className="grid flex-1 items-start gap-4 md:gap-10">
        <div className="grid gap-4">
          <h1 className="text-3xl font-bold lg:text-4xl">
            {propertyData?.title}
          </h1>
          <div className="flex gap-4">
            {propertyData?.salePriceCents ? (
              <div className="text-xl">
                <p>
                  Precio de venta:{" "}
                  <strong className="font-bold">
                    {formatCurrency(propertyData?.salePriceCents)}
                  </strong>
                </p>
              </div>
            ) : null}
            {propertyData?.rentPriceCents ? (
              <div className="text-xl">
                <p>
                  Precio de renta:{" "}
                  <strong className="font-bold">
                    {formatCurrency(propertyData?.rentPriceCents)}
                  </strong>
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col">
            <h2 className="text-md font-bold">
              Código de inmueble:{" "}
              {prefixZeroes(BigInt(propertyData?.crmCode ?? 0))}
            </h2>
            <h2 className="text-md font-bold">
              Tipo de negocio:{" "}
              {propertyData?.listingType
                ? formatListingType(propertyData?.listingType).label
                : "No definido"}
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Agente a cargo:{" "}
                <span className="font-normal">
                  {" "}
                  {propertyData?.agentInCharge.firstName &&
                  propertyData?.agentInCharge.lastName
                    ? `${propertyData?.agentInCharge.firstName} ${propertyData?.agentInCharge.lastName}`
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Tipo de inmueble:{" "}
                <span className="font-normal">
                  {" "}
                  {propertyData?.propertyType
                    ? formatPropertyType(propertyData?.propertyType).label
                    : "No definido"}
                </span>
              </p>
            </div>
            {propertyData?.rentTime ? (
              <div className="flex items-center gap-0.5">
                <p className="text-sm font-semibold text-muted-foreground">
                  Tiempo de alquiler:{" "}
                  <span className="font-normal">
                    {" "}
                    {propertyData?.rentTime
                      ? propertyData?.rentTime
                      : "No definido"}
                  </span>
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Año de construcción:{" "}
                <span className="font-normal">
                  {propertyData?.constructionYear ?? "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Dirección:{" "}
                <span className="font-normal">
                  {propertyData?.address
                    ? propertyData?.address
                    : "No definida"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                País:{" "}
                <span className="font-normal">
                  {" "}
                  {propertyData?.countryCode
                    ? getCountryByCode(propertyData?.countryCode)?.name
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Departamento o estado:{" "}
                <span className="font-normal">
                  {" "}
                  {propertyData?.regionCode
                    ? getRegionByCode(
                        propertyData?.regionCode,
                        propertyData?.countryCode,
                      )?.name
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Ciudad:{" "}
                <span className="font-normal">
                  {propertyData?.cityName
                    ? propertyData?.cityName
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Habitaciones:{" "}
                <span className="font-normal">
                  {propertyData?.bedrooms
                    ? propertyData?.bedrooms
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Baños:{" "}
                <span className="font-normal">
                  {propertyData?.bathrooms
                    ? propertyData?.bathrooms
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Nivel:{" "}
                <span className="font-normal">
                  {propertyData?.floorNumber
                    ? propertyData?.floorNumber
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Garages:{" "}
                <span className="font-normal">
                  {propertyData?.parkingSpaces
                    ? propertyData?.parkingSpaces
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Área construida:{" "}
                <span className="font-normal">
                  {propertyData?.builtAreaSize
                    ? `${propertyData?.builtAreaSize} ${formatBuiltAreaSizeUnits(propertyData?.builtAreaSizeUnit).label}`
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Área total / Terreno:{" "}
                <span className="font-normal">
                  {propertyData?.totalAreaSize
                    ? `${propertyData?.builtAreaSize} ${formatBuiltAreaSizeUnits(propertyData?.builtAreaSizeUnit).label}`
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                IUSI:{" "}
                <span className="font-normal">
                  {propertyData?.uniqueTaxForPropertyCents
                    ? formatCurrency(propertyData?.uniqueTaxForPropertyCents)
                    : "No definido"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <p className="text-sm font-semibold text-muted-foreground">
                Porcentaje de comisión:{" "}
                <span className="font-normal">
                  {propertyData?.serviceFeePercentage
                    ? `${propertyData?.serviceFeePercentage.toFixed(2)}%`
                    : "No definido"}
                </span>
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Descripción</h4>
            <p className="whitespace-pre-line text-sm">
              {propertyData?.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <h3 className="text-2xl font-semibold">Notas</h3>
            <StandardDialog
              isOpen={createDialogIsOpen}
              onOpenChange={setCreateDialogIsOpen}
              title="Crear nota"
              updateProcessTitle="Creando nota"
              updateConfirmationTitle="Nota creada"
              updateConfirmationDescription="Se ha creado una nueva nota exitosamente."
              description="Puedes crear una nueva nota aquí."
              triggerComponent={
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear nota
                </Button>
              }
            >
              <StandardDialogContent>
                <ScrollArea className="h-full">
                  <PropertyNoteForm
                    propertyId={propertyId}
                    onPropertyNoteCreated={() => {
                      utils.properties.getDetails
                        .invalidate(propertyId)
                        .catch(console.error);

                      setCreateDialogIsOpen(false);
                    }}
                  />
                </ScrollArea>
              </StandardDialogContent>
            </StandardDialog>
          </div>
          <div className="flex flex-col gap-4">
            {propertyData?.propertyNotes.length &&
            propertyData?.propertyNotes.length > 0 ? (
              propertyData?.propertyNotes.map((note) => (
                <Note key={note.id} note={note} />
              ))
            ) : (
              <div className="flex h-full items-center">
                <Empty
                  title="No hay notas para este inmueble"
                  description='No has escrito ninguna nota para este inmueble. Haz clic en el botón de "Crear nota" para agregar una.'
                  icon={<NotebookPen />}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="w-full  px-12 md:pl-0 md:pr-8">
          <h3 className="mb-4 text-2xl">Fotos</h3>
          {propertyData?.propertyPhotos.length &&
          propertyData?.propertyPhotos.length > 0 ? (
            <Carousel>
              <CarouselContent>
                {propertyData?.propertyPhotos.map((photo) => (
                  <CarouselItem key={photo.id}>
                    <div className="p-1">
                      <AspectRatio ratio={16 / 9} key={photo.cloudflareId}>
                        <Image
                          src={getCloudflareImage(photo.cloudflareId, "public")}
                          alt={"Property photo"}
                          fill
                          className="object-cover"
                        />
                      </AspectRatio>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <AspectRatio ratio={16 / 9}>
              <div className="flex h-full w-full items-center justify-center bg-stone-200">
                <p className="text-sm text-muted-foreground">
                  No hay fotos disponibles
                </p>
              </div>
            </AspectRatio>
          )}
        </div>
        {propertyData?.propertyVideos.length &&
        propertyData?.propertyVideos.length > 0 ? (
          <div>
            <h3 className="mb-4 text-2xl">Videos</h3>
            <div className="flex flex-col gap-4">
              {propertyData?.propertyVideos.map((video) => (
                <ReactPlayer url={video.videoUrl} key={video.id} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

PropertyDetailsPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default PropertyDetailsPage;
