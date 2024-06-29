import { SiFacebook, SiX } from "@icons-pack/react-simple-icons";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useCallback, useState, type ReactNode } from "react";
import CmsLayout from "~/components/layout/cms-layout";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import Greeter from "~/components/ui/greeter";
import PageContainer from "~/components/ui/page-container";
import { api, type RouterOutputs } from "~/utils/api";
import { Building2, PlusCircle } from "lucide-react";

import { Edit, Link as LinkIcon, Mail, Trash2 } from "lucide-react";
import TableSkeleton from "~/components/skeleton/table-skeleton";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import {
  formatCurrency,
  formatPropertyType,
  formatPublicationStatus,
  getCloudflareImage,
  prefixZeroes,
} from "~/lib/utils";
import FullScreenDialog, {
  FullScreenDialogContent,
} from "~/components/dialog/full-screen-dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { APIProvider } from "@vis.gl/react-google-maps";
import PropertyForm from "~/forms/property-form/property-form";
import DeleteConfirmationDialog from "~/components/dialog/delete-confirmation-dialog";
import { env } from "~/env";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Case from "case";
import copy from "copy-text-to-clipboard";
import { toast } from "sonner";

const columns: ColumnDef<
  RouterOutputs["properties"]["listProperties"][number]
>[] = [
  {
    accessorKey: "propertyPhotos",
    header: "",
    cell: ({ row }) => {
      const coverPhoto = row.original.propertyPhotos.at(0);

      return (
        <div className="w-[150px]">
          <AspectRatio ratio={16 / 10}>
            <Image
              fill
              alt="Foto de la propiedad"
              src={
                coverPhoto?.cloudflareId
                  ? getCloudflareImage(coverPhoto.cloudflareId, "thumbnail")
                  : "/placeholder/house.webp"
              }
              className="rounded-md object-cover"
            />
          </AspectRatio>
        </div>
      );
    },
  },
  {
    accessorKey: "crmCode",
    header: "Código",
    cell: ({ row }) => (
      <Link
        href={`/my-properties/${row.original.id}`}
        className="text-blue-500 underline"
      >
        {prefixZeroes(row.original.crmCode)}
      </Link>
    ),
  },
  {
    accessorKey: "publicationStatus",
    header: "Estado",
    cell: ({ row }) =>
      formatPublicationStatus(row.original.publicationStatus).label,
  },
  {
    accessorKey: "title",
    header: "Título",
  },
  {
    accessorKey: "address",
    header: "Dirección",
  },
  {
    accessorKey: "salePriceCents",
    header: "Precio de venta",
    cell: ({ row }) =>
      row.original.salePriceCents
        ? `${formatCurrency(row.original.salePriceCents)}`
        : "No disponible",
  },
  {
    accessorKey: "rentPriceCents",
    header: "Precio de renta",
    cell: ({ row }) =>
      row.original.rentPriceCents
        ? `${formatCurrency(row.original.rentPriceCents)}`
        : "No disponible",
  },
  {
    accessorKey: "propertyType",
    header: "Tipo",
    cell: ({ row }) => formatPropertyType(row.original.propertyType).label,
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("es-MX"),
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const { original: property } = row;
      const session = useSession();

      const deletePropertyMutation =
        api.properties.deleteProperty.useMutation();
      const utils = api.useUtils();

      const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);
      const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);

      const handleDelete = useCallback(async () => {
        await deletePropertyMutation.mutateAsync(property.id);
        await utils.properties.listProperties.invalidate();
        setDeleteDialogIsOpen(false);
      }, [
        deletePropertyMutation,
        property.id,
        utils.properties.listProperties,
      ]);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex w-full justify-end gap-2">
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
                        utils.properties.listProperties
                          .invalidate()
                          .catch((error) => console.error(error));
                      }}
                    />
                  </APIProvider>
                </ScrollArea>
              </FullScreenDialogContent>
            </FullScreenDialog>
            <DeleteConfirmationDialog
              isOpen={deleteDialogIsOpen}
              onOpenChange={setDeleteDialogIsOpen}
              title="¿Estás seguro que quieres eliminar este inmueble?"
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
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Compartir:</p>
            <div className="flex gap-2 sm:justify-end">
              <Button
                size="icon"
                variant="outline"
                className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                onClick={() => {
                  window.open(
                    `https://facebook.com/sharer/sharer.php?u=${session.data?.user.organizationDomain ?? `${session?.data?.user.organizationGeneratedDomain}.ceuss.site`}/properties/${row.original.slug}&hashtag=%23${Case.kebab(session.data?.user.organizationName ?? "")}`,
                    "_blank",
                  );
                }}
              >
                <SiFacebook className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                onClick={() => {
                  window.open(
                    `https://x.com/intent/tweet?url=${session.data?.user.organizationDomain ?? `${session?.data?.user.organizationGeneratedDomain}.ceuss.site`}/properties/${row.original.slug}&text=${row.original.title}&hashtags=${Case.camel(session.data?.user.organizationName ?? "")}`,
                    "_blank",
                  );
                }}
              >
                <SiX className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                onClick={() => {
                  window.open(
                    `mailto:?subject=Inmueble: ${row.original.title}&body=Dale un vistazo al inmueble: ${session.data?.user.organizationDomain ?? `${session?.data?.user.organizationGeneratedDomain}.ceuss.site`}/properties/${row.original.slug}`,
                    "_blank",
                  );
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                onClick={() => {
                  copy(
                    `https://${session.data?.user.organizationDomain ?? `${session?.data?.user.organizationGeneratedDomain}.ceuss.site`}/properties/${row.original.slug}`,
                  );
                  toast.success("Enlace copiado a tu dispositivo.");
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    },
  },
];

const MyPropertiesPage = () => {
  const { data, isLoading } = api.properties.listProperties.useQuery();
  const router = useRouter();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  if (isLoading || !data) {
    return <TableSkeleton />;
  }

  return (
    <PageContainer>
      <Greeter
        title="Mis inmuebles"
        subtitle="Administra tus inmuebles y sus estados"
      >
        {session.data?.user.canCreateProperties ? (
          <Button type="button" onClick={() => router.push("/add-property")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar inmueble
          </Button>
        ) : null}
      </Greeter>
      <DataTable columns={columns} data={data} emptyStateIcon={<Building2 />} />
    </PageContainer>
  );
};

MyPropertiesPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default MyPropertiesPage;
