import React from "react";
import { getChildrenSubcomponents } from "~/lib/get-children-subcomponents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { LoadingSpinner } from "../ui/loading-spinner";
import { cn } from "~/lib/utils";

interface FullScreenDialogProps
  extends React.PropsWithChildren,
    Pick<React.HtmlHTMLAttributes<HTMLDivElement>, "className"> {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  updateProcessTitle: string;
  updateConfirmationTitle: string;
  updateConfirmationDescription: string;
  description: string;
  triggerComponent?: React.ReactElement;
  noFullScreen?: boolean;
}

const FullScreenDialog = ({
  isOpen,
  onOpenChange,
  title,
  updateProcessTitle,
  description,
  triggerComponent,
  children,
  className,
  noFullScreen = false,
}: FullScreenDialogProps) => {
  const [isProcessing] = React.useState<boolean>(false);

  const fullScreenDialogContentChildren = getChildrenSubcomponents(
    children as React.ReactElement,
    "FullScreenDialogContent",
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerComponent}</DialogTrigger>
      {isProcessing ? (
        <DialogContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">{updateProcessTitle}</h1>
            <p>Por favor espera un momento...</p>
            <LoadingSpinner className="mt-4 h-16 w-16" />
          </div>
        </DialogContent>
      ) : (
        <DialogContent
          className={cn(
            noFullScreen ? "" : "h-[95vh] w-[98vw] max-w-[1870px]",
            className,
          )}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {fullScreenDialogContentChildren.length > 0
            ? fullScreenDialogContentChildren
            : null}
        </DialogContent>
      )}
    </Dialog>
  );
};

const FullScreenDialogContent = ({ children }: React.PropsWithChildren) => {
  return children;
};

FullScreenDialogContent.displayName = "FullScreenDialogContent";

export default FullScreenDialog;

export { FullScreenDialogContent };
