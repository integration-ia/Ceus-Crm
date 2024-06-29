import { Edit, PackageOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import MyBusinessMenuSkeleton from "~/components/skeleton/my-business-menu-skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Empty from "~/components/ui/empty";
import { ScrollArea } from "~/components/ui/scroll-area";
import OrganizationSocialMediaLinksForm from "~/forms/organization-social-media-links-form";
import { formatSocialMediaPlatform } from "~/lib/utils";
import { api } from "~/utils/api";

const WebsiteSocialMediaLinks = () => {
  const [
    editSocialMediaLinksDialogIsOpen,
    setEditSocialMediaLinksDialogIsOpen,
  ] = useState(false);

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

  if (isLoading || !organization) {
    return <MyBusinessMenuSkeleton />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <CardTitle>Enlaces de redes sociales</CardTitle>
        <StandardDialog
          isOpen={editSocialMediaLinksDialogIsOpen}
          onOpenChange={setEditSocialMediaLinksDialogIsOpen}
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
              <OrganizationSocialMediaLinksForm
                dataToUpdate={organization.socialMediaLinks}
                onDataUpdated={() => {
                  setEditSocialMediaLinksDialogIsOpen(false);
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
        {organization.socialMediaLinks.length > 0 ? (
          organization.socialMediaLinks.map((socialMediaLink) => (
            <Card key={socialMediaLink.id}>
              <CardContent className="flex flex-col gap-2 py-2">
                <h4 className="font-bold">
                  {formatSocialMediaPlatform(socialMediaLink.platform).label}
                </h4>
                <p className="text-sm">{socialMediaLink.link}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Empty
            title="No hay datos"
            description="Debes agregar información sobre los valores de tu empresa."
            icon={<PackageOpen />}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default WebsiteSocialMediaLinks;
