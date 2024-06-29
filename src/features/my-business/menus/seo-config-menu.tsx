import { Edit, PackageOpen } from "lucide-react";
import React, { useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Empty from "~/components/ui/empty";
import { ScrollArea } from "~/components/ui/scroll-area";
import SeoConfigForm from "~/forms/seo-config-form";
import { api } from "~/utils/api";

const SeoConfigMenu = () => {
  const [
    editSocialMediaLinksDialogIsOpen,
    setEditSocialMediaLinksDialogIsOpen,
  ] = useState(false);

  const { data: seoConfig } = api.organizations.getSeoConfig.useQuery();
  const organizationInfo = api.organizations.getDomain.useQuery();

  const utils = api.useUtils();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <CardTitle>Configuración de SEO</CardTitle>
        <StandardDialog
          isOpen={editSocialMediaLinksDialogIsOpen}
          onOpenChange={setEditSocialMediaLinksDialogIsOpen}
          title="Editar información del SEO de tu website"
          updateProcessTitle="Actualizando información del website de la empresa"
          updateConfirmationTitle="Información del website de la empresa actualizada"
          updateConfirmationDescription="La información del SEO de tu website ha sido actualizado exitosamente."
          description="Puedes editar la información del SEO de tu empresa aquí."
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
              <SeoConfigForm
                dataToUpdate={seoConfig}
                onDataUpdated={() => {
                  setEditSocialMediaLinksDialogIsOpen(false);
                  utils.organizations.getSeoConfig
                    .invalidate()
                    .catch((error) => console.error(error));
                }}
              />
            </ScrollArea>
          </StandardDialogContent>
        </StandardDialog>
      </CardHeader>
      {Boolean(seoConfig?.title) || Boolean(seoConfig?.description) ? (
        <CardContent>
          <p>
            Cuando compartas tu sitio web en chat o redes sociales, se va a ver
            similar a esto:
          </p>
          <Card className="mt-4">
            <CardContent className="flex flex-col gap-2 py-2">
              <h4 className="font-bold">{seoConfig?.title ?? "Sin título"}</h4>
              <p className="text-sm">
                {seoConfig?.description ?? "Sin descripción"}
              </p>
              <p className="text-muted-foreground">
                https://{organizationInfo.data}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      ) : (
        <Empty
          title="No hay datos"
          description="Debes agregar información sobre los valores de tu empresa."
          icon={<PackageOpen />}
        />
      )}
    </Card>
  );
};

export default SeoConfigMenu;
