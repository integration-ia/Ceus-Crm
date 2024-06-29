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

interface DeleteConfirmationDialogProps extends React.PropsWithChildren {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  deleteProcessTitle: string;
  deleteConfirmationTitle: string;
  deleteConfirmationDescription: string;
  description: string;
  onDelete: () => Promise<void>;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onOpenChange,
  title,
  deleteProcessTitle,
  deleteConfirmationTitle,
  deleteConfirmationDescription,
  description,
  children,
  onDelete,
}: DeleteConfirmationDialogProps) => {
  const [writtenConsent, setWrittenConsent] = React.useState<string>("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

  const onDeleteConfirmed = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (writtenConsent === "Eliminar") {
        setFormError(null);
        setIsProcessing(true);
        await onDelete();
        setWrittenConsent("");
        setIsProcessing(false);
        toast(deleteConfirmationTitle, {
          description: deleteConfirmationDescription,
        });
      } else {
        setFormError('Debes escribir "Eliminar" para confirmar');
      }
    },
    [
      deleteConfirmationDescription,
      deleteConfirmationTitle,
      onDelete,
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

export default DeleteConfirmationDialog;
