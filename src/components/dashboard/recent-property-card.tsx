import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { formatCurrency, prefixZeroes, truncateText } from "~/lib/utils";
import DeleteConfirmationDialog from "../dialog/delete-confirmation-dialog";
import { Button } from "../ui/button";
import { useCallback, useState } from "react";
import FullScreenDialog, {
  FullScreenDialogContent,
} from "../dialog/full-screen-dialog";
import { ScrollArea } from "../ui/scroll-area";
import { APIProvider } from "@vis.gl/react-google-maps";
import PropertyForm from "~/forms/property-form/property-form";
import { api, type RouterOutputs } from "~/utils/api";
import { env } from "~/env";
import Link from "next/link";

interface RecentPropertyCardProps {
  property: RouterOutputs["dashboard"]["getLatestData"]["properties"][number];
  coverPhoto: string | null;
}

const RecentPropertyCard = ({
  property,
  coverPhoto,
}: RecentPropertyCardProps) => {
  const deletePropertyMutation = api.properties.deleteProperty.useMutation();
  const utils = api.useUtils();

  const {
    id: propertyId,
    title,
    salePriceCents,
    rentPriceCents,
    description,
    crmCode,
  } = property;

  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    await deletePropertyMutation.mutateAsync(propertyId);
    await utils.dashboard.invalidate();
    setDeleteDialogIsOpen(false);
  }, [deletePropertyMutation, propertyId, utils.dashboard]);

  return (
    <Card className="dark:bg-stone-800">
      <CardTitle className="my-3 ml-3 text-xs text-muted-foreground">
        Codigo de inmueble: {prefixZeroes(crmCode)}
      </CardTitle>
      <CardContent className="p-0">
        <div className="flex flex-col justify-between gap-4 p-2 md:flex-row">
          <div className="flex gap-2">
            <div className="flex flex-shrink-0 items-center">
              <div className="h-[60px] w-[60px]">
                <AspectRatio ratio={1 / 1}>
                  <Image
                    fill
                    alt="Foto de la propiedad"
                    src={coverPhoto ?? "/placeholder/house.webp"}
                    className="rounded-md"
                  />
                </AspectRatio>
              </div>
            </div>

            <div>
              <Link
                href={`/my-properties/${propertyId}`}
                className="ml-1 mt-1 block flex-grow text-sm font-semibold hover:underline"
              >
                {truncateText(title, 72)}
              </Link>
              <Link
                href={`/my-properties/${propertyId}`}
                className="ml-1 block text-xs text-muted-foreground"
              >
                {truncateText(description, 145)}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 md:flex-col">
            <div className="flex w-full gap-1 md:justify-end">
              <FullScreenDialog
                isOpen={editDialogIsOpen}
                onOpenChange={setEditDialogIsOpen}
                title="Editar inmueble"
                updateProcessTitle="Actualizando inmueble"
                updateConfirmationTitle="Inmueble actualizado"
                updateConfirmationDescription="El inmueble ha sido actualizado exitosamente."
                description="Puedes editar la información de tu inmueble aquí."
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
                <FullScreenDialogContent>
                  <ScrollArea className="h-full">
                    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                      <PropertyForm
                        propertyToEdit={property}
                        onPropertyUpdated={() => {
                          setEditDialogIsOpen(false);
                          utils.dashboard.getLatestData
                            .invalidate()
                            .catch(console.error);
                        }}
                      />
                    </APIProvider>
                  </ScrollArea>
                </FullScreenDialogContent>
              </FullScreenDialog>

              <DeleteConfirmationDialog
                isOpen={deleteDialogIsOpen}
                onOpenChange={setDeleteDialogIsOpen}
                title=" ¿Estás seguro que quieres eliminar este inmueble?"
                deleteProcessTitle="Eliminando inmueble"
                deleteConfirmationTitle="Inmueble eliminado"
                deleteConfirmationDescription="El inmueble ha sido eliminado exitosamente."
                description="Una vez lo hayas eliminado ya no será accesible desde la página de tu empresa."
                onDelete={handleDelete}
              >
                <Button
                  size="icon"
                  variant="outline"
                  className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteConfirmationDialog>
            </div>
          </div>
        </div>
        <div className="mb-1 ml-2 flex justify-start gap-1">
          {salePriceCents !== null && salePriceCents ? (
            <p className="text-xs md:text-sm">
              Precio de venta:{" "}
              <span className="font-semibold">
                {formatCurrency(salePriceCents)}
              </span>
            </p>
          ) : null}
          {salePriceCents && rentPriceCents ? (
            <p className="text-xs md:text-sm">•</p>
          ) : null}
          {rentPriceCents !== null && rentPriceCents ? (
            <p className="text-xs md:text-sm">
              Precio de renta:{" "}
              <span className="font-semibold">
                {formatCurrency(rentPriceCents)}
              </span>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPropertyCard;
