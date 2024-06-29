import { NotebookPen, PlusCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useState, type ReactNode } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import CmsLayout from "~/components/layout/cms-layout";
import { Button } from "~/components/ui/button";
import ClientNote from "~/components/ui/client-note";
import Empty from "~/components/ui/empty";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import ClientNoteForm from "~/forms/client-note-form";
import {
  formatClientType,
  formatPhoneNumberWorkaround,
  getCountryByCode,
} from "~/lib/utils";
import { api } from "~/utils/api";

const ClientDetailsPage = () => {
  const router = useRouter();
  const clientId = router.query.clientId as string;
  const utils = api.useUtils();

  const [createDialogIsOpen, setCreateDialogIsOpen] = useState(false);

  const { data: clientData, isLoading } =
    api.clients.getDetails.useQuery(clientId);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Cargando los datos del cliente</h1>
        <p>Por favor espera un momento...</p>
        <LoadingSpinner className="mt-4 h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-9 md:flex-row">
      <div className="grid flex-1 items-start gap-4 md:gap-10">
        <div className="grid gap-4">
          <h1 className="text-3xl font-bold lg:text-4xl">
            {clientData?.firstName} {clientData?.lastName}
          </h1>
          <div className="flex gap-4">
            {clientData?.createdByUser ? (
              <div className="text-md">
                <p>
                  Creado por:{" "}
                  <strong className="font-bold">
                    {clientData?.createdByUser.firstName &&
                    clientData?.createdByUser.lastName
                      ? `${clientData?.createdByUser.firstName} ${clientData?.createdByUser.lastName}`
                      : "No definido"}
                  </strong>
                </p>
              </div>
            ) : null}
            {clientData?.countryCode ? (
              <div className="text-md">
                <p>
                  País:{" "}
                  <strong className="font-bold">
                    {getCountryByCode(clientData?.countryCode)?.name}
                  </strong>
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-semibold">Tipo de cliente:</span>{" "}
              {clientData?.type
                ? formatClientType(clientData?.type).label
                : "No definido"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Teléfono: </span>
              {clientData?.phoneNumbers.filter((p) => p.type === "MOBILE").at(0)
                ?.phoneNumber
                ? formatPhoneNumberWorkaround(
                    clientData?.phoneNumbers
                      .filter((p) => p.type === "MOBILE")
                      .at(0)?.phoneNumber ?? "",
                  )
                : "No definido"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Teléfono fijo: </span>
              {clientData?.phoneNumbers.filter((p) => p.type === "HOME").at(0)
                ?.phoneNumber
                ? formatPhoneNumberWorkaround(
                    clientData?.phoneNumbers
                      .filter((p) => p.type === "HOME")
                      .at(0)?.phoneNumber ?? "",
                  )
                : "No definido"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Correo: </span>
              {clientData?.emails.at(0)?.email
                ? clientData?.emails.at(0)?.email
                : "No definido"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Creado en: </span>
              {clientData?.createdAt
                ? clientData?.createdAt.toLocaleDateString("es-MX")
                : "No definido"}
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
                  <ClientNoteForm
                    clientId={clientId}
                    onClientNoteCreated={() => {
                      utils.clients.getDetails
                        .invalidate(clientId)
                        .catch(console.error);

                      setCreateDialogIsOpen(false);
                    }}
                  />
                </ScrollArea>
              </StandardDialogContent>
            </StandardDialog>
          </div>
          <div className="flex flex-col gap-4">
            {clientData?.clientNotes.length &&
            clientData?.clientNotes.length > 0 ? (
              clientData?.clientNotes.map((note) => (
                <ClientNote key={note.id} note={note} />
              ))
            ) : (
              <div className="flex h-full items-center">
                <Empty
                  title="No hay notas para este cliente"
                  description='No has escrito ninguna nota para este cliente. Haz clic en el botón de "Crear nota" para agregar una.'
                  icon={<NotebookPen />}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4"></div>
    </div>
  );
};

ClientDetailsPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default ClientDetailsPage;
