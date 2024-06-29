import {
  ExternalLink,
  PackageOpen,
  PlusCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Empty from "~/components/ui/empty";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import SubscriptionBadge from "~/components/ui/subscription-badge";
import DomainForm from "~/forms/domain-form";
import { api } from "~/utils/api";
import WebDomainStatusAlert from "./web-domain-status-alert";
import { Skeleton } from "~/components/ui/skeleton";
import WebDomainDnsRecord from "./web-domain-dns-record";

const WebDomainSettings = () => {
  const [addFormIsOpen, setAddFormIsOpen] = useState(false);

  const { data: organizationDomain } = api.organizations.getDomain.useQuery();
  const {
    data: domainVerificationData,
    isLoading: domainVerificationIsLoading,
    isFetching: domainVerificationIsFetching,
  } = api.webDomains.verifyDomainStatus.useQuery(undefined, {
    enabled: !!organizationDomain,
  });

  const utils = api.useUtils();

  const removeDomainMutation =
    api.webDomains.removeWebDomainFromOrganization.useMutation();

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (domainVerificationIsLoading) return;

      utils.webDomains.verifyDomainStatus.invalidate().catch(console.error);
    }, 12000); // Invalidate every 8 seconds

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [domainVerificationIsLoading, utils.webDomains.verifyDomainStatus]);

  const verificationErrors = domainVerificationData?.verification ?? [];
  const conflicts = domainVerificationData?.conflicts ?? [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Dominio web de la empresa
          <SubscriptionBadge
            subscription="PREMIUM"
            className="relative bottom-[2px] left-2"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {organizationDomain ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl">https://{organizationDomain}</h3>
                <Button
                  variant="outline"
                  size="icon"
                  className="dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-700"
                  onClick={() => {
                    window.open(`https://${organizationDomain}`, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await utils.webDomains.verifyDomainStatus.refetch();
                  }}
                  disabled={domainVerificationIsFetching}
                >
                  Refrescar {domainVerificationIsFetching && <LoadingSpinner />}
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await removeDomainMutation.mutateAsync();
                    await utils.organizations.getDomain.invalidate();
                  }}
                  disabled={removeDomainMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
            {domainVerificationData ? (
              <WebDomainStatusAlert statusInfo={domainVerificationData} />
            ) : (
              <Skeleton className="h-4 w-80" />
            )}
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Para configurar tu dominio web personalizado, primero asegurate
                de remover{" "}
                <strong>
                  cualquier otro registro DNS de tipo A que ya esté configurado
                  en tu proveedor de dominios.
                </strong>
              </p>
              <p className="text-sm">
                Agrega estos registros DNS a tu proveedor de dominios:
              </p>

              <Card>
                <CardContent className="py-0">
                  <WebDomainDnsRecord type="A" name="@" value="76.76.21.21" />
                </CardContent>
              </Card>
              {verificationErrors.length > 0
                ? verificationErrors.map((error) => (
                    <div className="flex flex-col gap-2" key={error.domain}>
                      {error.reason === "pending_domain_verification" && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-red-500">AVISO:</span> Hemos
                          detectado que una cuenta de Vercel (la plataforma que
                          usamos para alojar tu sitio web) ya está usando este
                          dominio. Por favor, verifica que eres el dueño de este
                          dominio agregando el siguiente registro TXT a tu
                          proveedor de dominios. Una vez CEUS te avise que el
                          dominio ha sido verificado correctamente, puedes
                          borrar este registro si gustas.
                        </p>
                      )}
                      <Card>
                        <CardContent className="py-0">
                          <WebDomainDnsRecord
                            type={error.type}
                            name={
                              error.reason === "pending_domain_verification"
                                ? "_vercel"
                                : error.domain
                            }
                            value={error.value}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ))
                : null}

              {conflicts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-500">AVISO:</span> Hemos detectado
                    que uno o más registros DNS de tu dominio web están en
                    conflicto con los registros que necesitamos para configurar
                    tu dominio web. Por favor, elimina los registros listados
                    abajo para poder continuar.
                  </p>
                  {conflicts.map((conflict) => (
                    <div className="flex flex-col gap-2" key={conflict.value}>
                      <Card>
                        <CardContent className="py-0">
                          <WebDomainDnsRecord
                            type={conflict.type}
                            name={conflict.name}
                            value={conflict.value}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : null}

              <Alert className="border-yellow-400 bg-transparent text-yellow-400">
                <TriangleAlert className="h-4 w-4 !text-yellow-400" />
                <AlertTitle>Aviso</AlertTitle>
                <AlertDescription>
                  Dependiendo de tu proveedor, podría tomar tiempo que los
                  registros de DNS se apliquen.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center">
            <Empty
              className="mt-24"
              title="No tienes ningún dominio web registrado para tu empresa"
              description="Estás usando un dominio auto generado por CEUS"
              icon={<PackageOpen />}
            />
            <StandardDialog
              title="Agregar dominio web"
              description="Asegurate de tener el dominio ya comprado desde un proveedor de dominios antes de agregarlo a CEUS"
              updateProcessTitle="Actualizando cliente"
              updateConfirmationTitle="Cliente actualizado"
              updateConfirmationDescription="El cliente ha sido actualizado exitosamente."
              isOpen={addFormIsOpen}
              onOpenChange={setAddFormIsOpen}
              triggerComponent={
                <Button className="max-w-48">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar dominio web
                </Button>
              }
            >
              <StandardDialogContent>
                <DomainForm
                  onDomainAdded={async () => {
                    setAddFormIsOpen(false);
                    await utils.organizations.getDomain.invalidate();
                  }}
                />
              </StandardDialogContent>
            </StandardDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebDomainSettings;
