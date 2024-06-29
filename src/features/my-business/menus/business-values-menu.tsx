import { Edit, PackageOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import MyBusinessMenuSkeleton from "~/components/skeleton/my-business-menu-skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Empty from "~/components/ui/empty";
import { ScrollArea } from "~/components/ui/scroll-area";
import OrganizationValuesForm from "~/forms/organization-values-form";
import { api } from "~/utils/api";

const BusinessValuesMenu = () => {
  const [editValuesDialogIsOpen, setEditValuesDialogIsOpen] = useState(false);

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
        <CardTitle>Valores de la empresa</CardTitle>
        <StandardDialog
          isOpen={editValuesDialogIsOpen}
          onOpenChange={setEditValuesDialogIsOpen}
          title="Editar valores de la empresa"
          updateProcessTitle="Actualizando información de los valores de tu empresa"
          updateConfirmationTitle="Información de los valores de tu empresa actualizada"
          updateConfirmationDescription="Se han guardado los valores de tu empresa"
          description="Puedes editar aquí los valores de tu empresa (máximo 4)."
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
              <OrganizationValuesForm
                dataToUpdate={organization.organizationValues}
                onDataUpdated={() => {
                  setEditValuesDialogIsOpen(false);
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
        {organization.organizationValues.length > 0 ? (
          organization.organizationValues.map((value) => (
            <Card key={value.id}>
              <CardContent className="flex flex-col gap-2 py-2">
                <h4 className="font-bold">{value.title}</h4>
                <p className="text-sm">{value.value}</p>
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

export default BusinessValuesMenu;
