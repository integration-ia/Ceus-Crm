import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Edit, Mail, Phone, Trash2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";
import { truncateText } from "~/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import DeleteConfirmationDialog from "../dialog/delete-confirmation-dialog";
import { useCallback, useState } from "react";
import ClientForm from "~/forms/client-form";
import { type RouterOutputs, api } from "~/utils/api";
import StandardDialog, {
  StandardDialogContent,
} from "../dialog/standard-dialog";

interface RecentPropertyCardProps {
  client: RouterOutputs["clients"]["list"][number];
}

const RecentClientCard = ({ client }: RecentPropertyCardProps) => {
  const { id: clientId, firstName, lastName, emails, phoneNumbers } = client;

  const email = emails.at(0)?.email;
  const phoneNumber = phoneNumbers.filter((p) => p.type === "MOBILE").at(0);

  const utils = api.useUtils();

  const deleteClientMutation = api.clients.deleteClient.useMutation();

  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    await deleteClientMutation.mutateAsync({
      clientId,
    });

    await utils.dashboard.getLatestData.invalidate();

    setDeleteDialogIsOpen(false);
  }, [clientId, deleteClientMutation, utils.dashboard]);

  return (
    <Card className="dark:bg-stone-800">
      <CardContent className="flex flex-col justify-between gap-4 p-2 sm:flex-row">
        <div className="flex flex-shrink-0 items-center">
          <div>
            <div className="h-[60px] w-[60px]">
              <AspectRatio ratio={1 / 1}>
                <Image
                  fill
                  alt="Foto del cliente"
                  src="/placeholder/avatar.jpg"
                  className="rounded-md"
                />
              </AspectRatio>
            </div>
          </div>

          <div className="ml-2 flex flex-col justify-center gap-0">
            <p className="text-md ml-1 mt-1 flex-grow">
              {truncateText(`${firstName} ${lastName}`, 72)}
            </p>
            <div className="flex flex-col gap-0 text-stone-600 dark:text-stone-500">
              <p className="ml-1 mt-1 flex-grow text-xs">
                {phoneNumber?.phoneNumber}
              </p>
              <p className="ml-1 mt-1 flex-grow text-xs">{email}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-start gap-1 sm:justify-end">
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
              description="Puedes editar la información de tu cliente aquí."
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
                  <ClientForm
                    clientToEdit={client}
                    onClientUpdated={() => {
                      setEditDialogIsOpen(false);
                      utils.dashboard.getLatestData
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
              title=" ¿Estás seguro que quieres eliminar este cliente?"
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
      </CardContent>
    </Card>
  );
};

export default RecentClientCard;
