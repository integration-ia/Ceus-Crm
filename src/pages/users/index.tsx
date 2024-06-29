import { DialogDescription } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, PlusCircle, Trash2, UserRoundX } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactNode } from "react";
import DeleteUserConfirmationDialog from "~/components/dialog/delete-user-confirmation-dialog";
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
import UserForm from "~/forms/user-form";
import { formatPhoneNumberWorkaround } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

const columns: ColumnDef<RouterOutputs["users"]["list"][number]>[] = [
  {
    accessorKey: "firstName",
    header: "Nombre",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    accessorKey: "phoneNumber",
    header: "Teléfono",
    cell: ({ row }) =>
      row.original.phoneNumber
        ? formatPhoneNumberWorkaround(row.original.phoneNumber)
        : "No definido",
  },
  {
    accessorKey: "email",
    header: "Correo",
    cell: ({ row }) => row.original.email ?? "No definido",
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
      const router = useRouter();
      const session = useSession({
        required: true,
        onUnauthenticated() {
          router.replace("/sign-in").catch(console.error);
        },
      });

      const deleteUserMutation = api.users.deleteUser.useMutation();
      const utils = api.useUtils();

      const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
      const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);

      const handleDelete = useCallback(
        async (targetUserId: string) => {
          await deleteUserMutation.mutateAsync({
            userId: row.original.id,
            targetUserId,
          });

          await utils.users.list.invalidate();

          setDeleteDialogIsOpen(false);
        },
        [deleteUserMutation, row.original.id, utils.users.list],
      );

      if (session.data?.user.id === row.original.id) {
        return null;
      }

      return (
        <div className="flex flex-col gap-3">
          <div className="flex w-full justify-end gap-2">
            {session.data?.user.isAdmin ? (
              <StandardDialog
                isOpen={editDialogIsOpen}
                onOpenChange={setEditDialogIsOpen}
                title="Editar usuario"
                updateProcessTitle="Actualizando usuario"
                updateConfirmationTitle="Usuario actualizado"
                updateConfirmationDescription="El usuario ha sido actualizado exitosamente."
                description="Puedes actualizar la información del usuario aquí"
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
                    <UserForm
                      userToEdit={row.original}
                      onUserUpdated={() => {
                        setEditDialogIsOpen(false);
                        utils.users.list
                          .invalidate()
                          .catch((error) => console.error(error));
                      }}
                    />
                  </ScrollArea>
                </StandardDialogContent>
              </StandardDialog>
            ) : null}
            {session.data?.user.isAdmin ? (
              <DeleteUserConfirmationDialog
                isOpen={deleteDialogIsOpen}
                onOpenChange={setDeleteDialogIsOpen}
                agentToDeleteId={row.original.id}
                title="¿Estás seguro que quieres eliminar a este usuario?"
                deleteProcessTitle="Eliminando usuario"
                deleteConfirmationTitle="Usuario eliminado"
                deleteConfirmationDescription="El usuario ha sido eliminado exitosamente."
                description="Una vez lo hayas eliminado ya no tendra una cuenta en el sistema. Todos sus datos deben ser migrados a otro usuario."
                onDelete={handleDelete}
              >
                <Button
                  size="icon"
                  variant="outline"
                  className="dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteUserConfirmationDialog>
            ) : null}
          </div>
        </div>
      );
    },
  },
];

const UsersPage = () => {
  const router = useRouter();
  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  const { data, isLoading } = api.users.list.useQuery();
  const utils = api.useUtils();
  const [createUserDialogIsOpen, setCreateUserDialogIsOpen] = useState(false);

  if (isLoading || !data) {
    return <TableSkeleton />;
  }

  return (
    <PageContainer>
      <Greeter
        title="Usuarios"
        subtitle="Administra a los usuarios de tu empresa"
      >
        {session.data?.user.isAdmin ? (
          <Dialog
            open={createUserDialogIsOpen}
            onOpenChange={(open) => {
              setCreateUserDialogIsOpen(open);
            }}
          >
            <DialogTrigger>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="w-10/12 max-w-[740px] md:w-2/4">
              <DialogHeader>
                <DialogTitle>Agregar usuario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo cliente e ingresa su información de contacto.
                </DialogDescription>
              </DialogHeader>
              <UserForm
                onUserCreated={() => {
                  setCreateUserDialogIsOpen(false);
                  utils.users.list.invalidate().catch(console.error);
                }}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </Greeter>
      <DataTable
        columns={columns}
        data={data}
        emptyStateIcon={<UserRoundX />}
      />
    </PageContainer>
  );
};

UsersPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default UsersPage;
