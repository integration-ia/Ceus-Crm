import { Edit, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "../dialog/standard-dialog";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { ScrollArea } from "./scroll-area";
import { type ClientNote as ClientNoteType, type User } from "@prisma/client";
import { api } from "~/utils/api";
import DeleteConfirmationDialog from "../dialog/delete-confirmation-dialog";
import { useSession } from "next-auth/react";
import ClientNoteForm from "~/forms/client-note-form";

interface ClientNoteProps {
  note: ClientNoteType & { author: User };
}

const ClientNote = ({ note }: ClientNoteProps) => {
  const { createdAt, content, author } = note;
  const session = useSession();

  const user = session.data?.user;

  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);

  const utils = api.useUtils();

  const deleteNoteMutation = api.clientNotes.deleteNote.useMutation();

  const handleDelete = useCallback(async () => {
    await deleteNoteMutation.mutateAsync(note.id);
    await utils.clients.getDetails.invalidate(note.clientId);

    setDeleteDialogIsOpen(false);
  }, [deleteNoteMutation, note.clientId, note.id, utils.clients.getDetails]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p>
            Nota del{" "}
            {createdAt.toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex gap-3">
            {user?.id === note.authorId ? (
              <StandardDialog
                isOpen={editDialogIsOpen}
                onOpenChange={setEditDialogIsOpen}
                title="Editar nota"
                updateProcessTitle="Actualizando nota"
                updateConfirmationTitle="Nota actualizada"
                updateConfirmationDescription="La nota de este inmueble ha sido actualizado exitosamente."
                description="Puedes editar la información de tu nota aquí."
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
                    <ClientNoteForm
                      clientNoteToUpdate={note}
                      onClientNoteUpdated={() => {
                        utils.clients.getDetails
                          .invalidate(note.clientId)
                          .catch(console.error);

                        setEditDialogIsOpen(false);
                      }}
                    />
                  </ScrollArea>
                </StandardDialogContent>
              </StandardDialog>
            ) : null}

            {user?.id === note.authorId ? (
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
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="whitespace-pre-line">{content}</p>
        </div>
      </CardContent>
      <CardFooter>
        - Escrita por {author.firstName} {author.lastName}
      </CardFooter>
    </Card>
  );
};

export default ClientNote;
