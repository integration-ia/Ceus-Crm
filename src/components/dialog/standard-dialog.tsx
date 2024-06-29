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
import { ScrollArea } from "../ui/scroll-area";

interface StandardDialogProps
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

const StandardDialog = ({
  isOpen,
  onOpenChange,
  title,
  updateProcessTitle,
  description,
  triggerComponent,
  children,
  className,
}: StandardDialogProps) => {
  const [isProcessing] = React.useState<boolean>(false);

  const standardDialogContentChildren = getChildrenSubcomponents(
    children as React.ReactElement,
    "StandardDialogContent",
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
        <DialogContent className={cn(className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh] lg:max-h-[60vh]">
            {standardDialogContentChildren.length > 0
              ? standardDialogContentChildren
              : null}
          </ScrollArea>
        </DialogContent>
      )}
    </Dialog>
  );
};

const StandardDialogContent = ({ children }: React.PropsWithChildren) => {
  return children;
};

StandardDialogContent.displayName = "StandardDialogContent";

export default StandardDialog;

export { StandardDialogContent };
