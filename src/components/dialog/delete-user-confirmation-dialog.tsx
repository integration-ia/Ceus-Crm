import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { toast } from "sonner";
import { api } from "~/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CircleX } from "lucide-react";

interface DeleteUserConfirmationDialogProps extends React.PropsWithChildren {
  isOpen: boolean;
  agentToDeleteId: string;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  deleteProcessTitle: string;
  deleteConfirmationTitle: string;
  deleteConfirmationDescription: string;
  description: string;
  onDelete: (targetUserId: string) => Promise<void>;
}

const DeleteUserConfirmationDialog = ({
  isOpen,
  onOpenChange,
  title,
  deleteProcessTitle,
  deleteConfirmationTitle,
  deleteConfirmationDescription,
  description,
  children,
  onDelete,
  agentToDeleteId,
}: DeleteUserConfirmationDialogProps) => {
  const [writtenConsent, setWrittenConsent] = React.useState<string>("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [targetAgentId, setTargetAgentId] = React.useState<string>("");
  const [targetAgentError, setTargetAgentError] = React.useState<string | null>(
    null,
  );

  const { data: agentsToMigrateTheDataTo, isLoading } =
    api.users.listAgentsForDeletion.useQuery({
      agentToDeleteId,
    });

  const onDeleteConfirmed = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!targetAgentId) {
        setTargetAgentError("Debes seleccionar un agente");
      }

      try {
        if (writtenConsent === "Eliminar" && agentToDeleteId) {
          setFormError(null);
          setIsProcessing(true);
          await onDelete(targetAgentId);
          setWrittenConsent("");
          setIsProcessing(false);
          toast(deleteConfirmationTitle, {
            description: deleteConfirmationDescription,
          });
        } else {
          setFormError('Debes escribir "Eliminar" para confirmar');
        }
      } catch (error) {
        console.error((error as Error).message);

        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [
      agentToDeleteId,
      deleteConfirmationDescription,
      deleteConfirmationTitle,
      onDelete,
      targetAgentId,
      writtenConsent,
    ],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(value) => {
        if (isProcessing) return;

        onOpenChange(value);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      {isProcessing ? (
        <DialogContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">{deleteProcessTitle}</h1>
            <p>Por favor espera un momento...</p>
            <LoadingSpinner className="mt-4 h-16 w-16" />
          </div>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <form onSubmit={onDeleteConfirmed}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="targetAgentId">
                    Migrar datos a otro agente
                  </Label>
                  <Select
                    disabled={isLoading}
                    name="targetAgentId"
                    value={targetAgentId}
                    onValueChange={(value) => {
                      setTargetAgentId(value);
                      setTargetAgentError(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona a un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentsToMigrateTheDataTo?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.firstName && agent.lastName
                            ? `${agent.firstName} ${agent.lastName}`
                            : "No definido"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {targetAgentError}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="writtenConsent">
                    Escribe &quot;Eliminar&quot; para confirmar
                  </Label>
                  <Input
                    name="writtenConsent"
                    autoComplete="off"
                    placeholder='Escribe "Eliminar" si realmente deseas eliminarlo'
                    value={writtenConsent}
                    onChange={(event) => {
                      setWrittenConsent(event.target.value);
                    }}
                  />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {formError}
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive">Eliminar</Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default DeleteUserConfirmationDialog;
