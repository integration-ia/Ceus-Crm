/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import MyBusinessMenuSkeleton from "~/components/skeleton/my-business-menu-skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import UpdateOrganizationWebsiteDataForm from "~/forms/update-organization-website-data-form";
import { api } from "~/utils/api";

const WebsiteInformationMenu = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in").catch(console.error);
    },
  });

  const { data: organization, isLoading } =
    api.organizations.getDetails.useQuery(undefined, {
      enabled: !!session.data?.user.organizationId,
    });

  const [editWebsiteDataDialogIsOpen, setEditWebsiteDataDialogIsOpen] =
    useState(false);

  if (isLoading || !organization) {
    return <MyBusinessMenuSkeleton />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <CardTitle>Información para el website de la empresa</CardTitle>
        <StandardDialog
          isOpen={editWebsiteDataDialogIsOpen}
          onOpenChange={setEditWebsiteDataDialogIsOpen}
          title="Editar información del website de la empresa"
          updateProcessTitle="Actualizando información del website de la empresa"
          updateConfirmationTitle="Información del website de la empresa actualizada"
          updateConfirmationDescription="La información de tu website ha sido actualizado exitosamente."
          description="Puedes editar la información de tu empresa aquí."
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
              <UpdateOrganizationWebsiteDataForm
                dataToUpdate={organization.organizationAboutInfo}
                onDataUpdated={() => {
                  setEditWebsiteDataDialogIsOpen(false);
                  utils.organizations.getDetails
                    .invalidate()
                    .catch((error) => console.error(error));
                }}
              />
            </ScrollArea>
          </StandardDialogContent>
        </StandardDialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-bold mb-1 ml-2 text-lg">Quiénes Somos</h3>
          <Card>
            <CardContent className="py-4">
              <p className="whitespace-pre-wrap text-sm">
                {organization.organizationAboutInfo?.aboutText || "No definido"}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-bold mb-1 ml-2 text-lg">Misión</h3>
          <Card>
            <CardContent className="py-4">
              <p className="whitespace-pre-wrap text-sm">
                {organization.organizationAboutInfo?.missionText ||
                  "No definido"}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-bold mb-1 ml-2 text-lg">Visión</h3>
          <Card>
            <CardContent className="py-4">
              <p className="whitespace-pre-wrap text-sm">
                {organization.organizationAboutInfo?.visionText ||
                  "No definido"}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteInformationMenu;
