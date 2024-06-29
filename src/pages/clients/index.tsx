import { DialogDescription } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Mail,
  Phone,
  PlusCircle,
  Trash2,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import DeleteConfirmationDialog from "~/components/dialog/delete-confirmation-dialog";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import CmsLayout from "~/components/layout/cms-layout";
import TableSkeleton from "~/components/skeleton/table-skeleton";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import Greeter from "~/components/ui/greeter";
import PageContainer from "~/components/ui/page-container";
import ClientForm from "~/forms/client-form";
import {
  formatClientType,
  formatPhoneNumberWorkaround,
  getCountryByCode,
} from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

const columns: ColumnDef<RouterOutputs["clients"]["list"][number]>[] = [
  {
    accessorKey: "firstName",
    header: "Nombre",
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.id}`}
        className="text-blue-500 underline"
      >
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  {
    accessorKey: "countryCode",
    header: "País",
    cell: ({ row }) => getCountryByCode(row.original.countryCode)?.name,
  },
  {
    accessorKey: "phoneNumbers",
    header: "Teléfono",
    cell: ({ row }) =>
      row.original.phoneNumbers.at(0)?.phoneNumber
        ? formatPhoneNumberWorkaround(
            // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
            row.original.phoneNumbers.at(0)?.phoneNumber as string,
          )
        : "No definido",
  },
  {
    accessorKey: "emails",
    header: "Correo",
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    cell: ({ row }) => row.original.emails.at(0)?.email || "No definido",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => formatClientType(row.original.type).label,
  },
  {
    accessorKey: "createdByUser",
    header: "Creado por",
    cell: ({ row }) =>
      row.original.createdByUser.firstName &&
      row.original.createdByUser.lastName
        ? `${row.original.createdByUser.firstName} ${row.original.createdByUser.lastName}`
        : "No definido",
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
      const deleteClientMutation = api.clients.deleteClient.useMutation();
      const utils = api.useUtils();

      const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
      const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);

      const handleDelete = useCallback(async () => {
        await deleteClientMutation.mutateAsync({
          clientId: row.original.id,
        });

        await utils.clients.list.invalidate();

        setDeleteDialogIsOpen(false);
      }, [deleteClientMutation, row.original.id, utils.clients.list]);

      const email = row.original.emails.at(0)?.email;
      const phoneNumber = row.original.phoneNumbers
        .filter((p) => p.type === "MOBILE")
        .at(0);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex w-full justify-end gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={!email}
              className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
              onClick={() => {
                window.open(`mailto:${email}`, "_blank");
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={!phoneNumber?.usesWhatsApp || !phoneNumber?.phoneNumber}
              className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
              onClick={() => {
                window.open(
                  `https://wa.me/${phoneNumber?.phoneNumber}`,
                  "_blank",
                );
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <StandardDialog
              isOpen={editDialogIsOpen}
              onOpenChange={setEditDialogIsOpen}
              title="Editar cliente"
              updateProcessTitle="Actualizando cliente"
              updateConfirmationTitle="Cliente actualizado"
              updateConfirmationDescription="El cliente ha sido actualizado exitosamente."
              description="Puedes actualizar la información del cliente aquí"
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
                <ScrollArea>
                  <ClientForm
                    clientToEdit={row.original}
                    onClientUpdated={() => {
                      setEditDialogIsOpen(false);
                      utils.clients.list
                        .invalidate()
                        .catch((error) => console.error(error));
                    }}
                  />
                </ScrollArea>
              </StandardDialogContent>
            </StandardDialog>
            <DeleteConfirmationDialog
              isOpen={deleteDialogIsOpen}
              onOpenChange={setDeleteDialogIsOpen}
              title="¿Estás seguro que quieres eliminar este cliente?"
              deleteProcessTitle="Eliminando cliente"
              deleteConfirmationTitle="Cliente eliminado"
              deleteConfirmationDescription="El cliente ha sido eliminado exitosamente."
              description="Una vez lo hayas eliminado ya no será accesible ni estarán sus inmuebles en el sistema"
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
      );
    },
  },
];

const ClientsPage = () => {
  const { data, isLoading } = api.clients.list.useQuery();
  const utils = api.useUtils();
  const [createClientDialogIsOpen, setCreateClientDialogIsOpen] =
    useState(false);

  if (isLoading || !data) {
    return <TableSkeleton />;
  }

  return (
    <PageContainer>
      <Greeter
        title="Clientes"
        subtitle="Administra clientes y su información de contacto"
      >
        <Dialog
          open={createClientDialogIsOpen}
          onOpenChange={(open) => {
            setCreateClientDialogIsOpen(open);
          }}
        >
          <DialogTrigger>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-10/12 max-w-[740px] md:w-2/4">
            <DialogHeader>
              <DialogTitle>Agregar cliente</DialogTitle>
              <DialogDescription>
                Crea un nuevo cliente e ingresa su información de contacto.
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              onClientCreated={() => {
                setCreateClientDialogIsOpen(false);
                utils.clients.list.invalidate().catch(console.error);
              }}
            />
          </DialogContent>
        </Dialog>
      </Greeter>
      <DataTable
        columns={columns}
        data={data}
        emptyStateIcon={<UserRoundX />}
      />
    </PageContainer>
  );
};

ClientsPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default ClientsPage;
