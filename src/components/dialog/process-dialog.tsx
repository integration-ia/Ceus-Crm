import React from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { LoadingSpinner } from "../ui/loading-spinner";

interface ProcessDialogProps extends React.PropsWithChildren {
  isOpen: boolean;
  processTitle: string;
  subtitle?: string;
  isProcessing: boolean;
}

const ProcessDialog = ({
  isOpen,
  processTitle,
  subtitle,
  isProcessing,
  children,
}: ProcessDialogProps) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        return;
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      {isProcessing ? (
        <DialogContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">{processTitle}</h1>
            <p>{subtitle ? subtitle : "Por favor espera un momento..."}</p>
            <LoadingSpinner className="mt-4 h-16 w-16" />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
};

export default ProcessDialog;
