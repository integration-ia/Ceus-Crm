/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: remove the eslint-disable comment after fixing the issue
import { Building2, CalendarClock, PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, type ReactNode } from "react";
import DashboardStat from "~/components/dashboard/dashboard-stat";
import RecentClientCard from "~/components/dashboard/recent-client-card";
import RecentPropertyCard from "~/components/dashboard/recent-property-card";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import CmsLayout from "~/components/layout/cms-layout";
import RecentPropertySkeleton from "~/components/skeleton/recent-property-skeleton";
import { Button } from "~/components/ui/button";
import CalendarItem from "~/components/ui/calendar-item";
import { Checkbox } from "~/components/ui/checkbox";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import Empty from "~/components/ui/empty";
import Greeter from "~/components/ui/greeter";
import PageContainer from "~/components/ui/page-container";
import { ScrollArea } from "~/components/ui/scroll-area";
import ClientForm from "~/forms/client-form";
import { getCloudflareImage } from "~/lib/utils";
import { api } from "~/utils/api";

const mockTasks = [
  {
    title: "Llamar a Juan",
    dueDate: new Date(),
    variant: "pending",
    type: "phone",
  },
  {
    title: "Enviar correo a María",
    dueDate: new Date(),
    variant: "completed",
    type: "email",
  },
  {
    title: "Reunión con José",
    dueDate: new Date(),
    variant: "overdue",
    type: "meet",
  },
  {
    title: "Aprobar planos de la casa ubicada en la capital",
    dueDate: new Date(),
    variant: "overdue",
    type: "meet",
  },
  {
    title: "Enviar contrato a Pedro",
    dueDate: new Date(),
    variant: "pending",
    type: "other",
  },
  {
    title: "Probar UI de la aplicación móvil",
    dueDate: new Date(),
    variant: "pending",
    type: "other",
  },
  {
    title: "Probar UI de la aplicación web",
    dueDate: new Date(),
    variant: "pending",
    type: "other",
  },
];

const DashboardPage = () => {
  const router = useRouter();
  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  const [createClientDialogIsOpen, setCreateClientDialogIsOpen] =
    useState(false);

  const {
    data: dashboardData,
    isFetching,
    isSuccess,
  } = api.dashboard.getLatestData.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const utils = api.useUtils();

  return (
    <PageContainer>
      <Greeter
        title={`Buenos días, ${session.data?.user.firstName}`}
        subtitle="Bienvenido de vuelta"
      >
        {session.data?.user.canCreateProperties ? (
          <Button
            onClick={() => {
              router.push("/add-property").catch(console.error);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar inmueble
          </Button>
        ) : null}
        {session.data?.user.canCreateClients ? (
          <StandardDialog
            isOpen={createClientDialogIsOpen}
            onOpenChange={setCreateClientDialogIsOpen}
            title="Agregar cliente"
            updateProcessTitle="Actualizando cliente"
            updateConfirmationTitle="Cliente actualizado"
            updateConfirmationDescription="El cliente ha sido actualizado exitosamente."
            description="Puedes editar la información del cliente aquí."
            triggerComponent={
              <Button variant={"outline"}>Agregar cliente</Button>
            }
          >
            <StandardDialogContent>
              <ScrollArea className="h-full">
                <ClientForm
                  onClientCreated={() => {
                    setCreateClientDialogIsOpen(false);
                    utils.dashboard.getLatestData
                      .invalidate()
                      .catch(console.error);
                  }}
                />
              </ScrollArea>
            </StandardDialogContent>
          </StandardDialog>
        ) : null}
      </Greeter>

      <div className="flex flex-col justify-between gap-4 md:flex-row ">
        <DashboardStat
          title={"Inmuebles en venta"}
          value={dashboardData?.salePropertiesCount ?? 0}
        />
        <DashboardStat
          title={"Inmuebles en alquiler"}
          value={dashboardData?.rentPropertiesCount ?? 0}
        />
        <DashboardStat
          title={"Clientes registrados"}
          value={dashboardData?.clientsCount ?? 0}
        />
        <DashboardStat
          title={"Vistas a tus inmuebles este mes"}
          value={dashboardData?.propertyViewsCount?._sum?.clicks ?? 0}
          percentage={dashboardData?.propertyViewsPercentDifference}
        />
        <DashboardStat
          title={"Personas que te contactaron"}
          value={620}
          percentage={20.1}
        />
      </div>

      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div className="flex h-full flex-col gap-5 rounded-lg border bg-card py-6 text-card-foreground shadow-sm dark:bg-stone-900 md:w-full">
          <h3 className="pl-4 text-2xl font-semibold leading-none tracking-tight">
            Inmuebles recientes
          </h3>
          {isFetching ? (
            <div className="h-[500px] p-4">
              <div className="flex flex-col gap-4">
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
                <RecentPropertySkeleton />
              </div>
            </div>
          ) : (
            <div className="h-[500px]">
              {isSuccess &&
              dashboardData &&
              dashboardData.properties?.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-3 px-4">
                    {dashboardData.properties.map((property) => (
                      <RecentPropertyCard
                        key={property.id}
                        property={property}
                        coverPhoto={
                          property.propertyPhotos.at(0)
                            ? getCloudflareImage(
                                // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
                                property.propertyPhotos.at(0)
                                  ?.cloudflareId as string,
                                "thumbnail",
                              )
                            : null
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[500px]">
                  <div className="flex h-full items-center">
                    <Empty
                      title="No hay inmuebles recientes"
                      description='No has agregado ningún inmueble. Haz clic en el botón de "Crear inmueble" para agregar uno.'
                      icon={<Building2 />}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex h-full flex-col gap-5 rounded-lg border bg-card py-6 text-card-foreground shadow-sm dark:bg-stone-900 md:w-full">
          <h3 className="pl-4 text-2xl font-semibold leading-none tracking-tight">
            Clientes recientes
          </h3>
          <div className="h-[500px]">
            {isSuccess && dashboardData ? (
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-3 px-4">
                  {dashboardData?.clients.map((client) => (
                    <RecentClientCard key={client.id} client={client} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[500px]">
                <div className="flex h-full items-center">
                  <Empty
                    title="No hay inmuebles recientes"
                    description='No has agregado ningún inmueble. Haz clic en el botón de "Crear inmueble" para agregar uno.'
                    icon={<Building2 />}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div className="flex h-full flex-col gap-5 rounded-lg border bg-card py-6 text-card-foreground shadow-sm dark:bg-stone-900 md:w-full">
          <h3 className="pl-4 text-2xl font-semibold leading-none tracking-tight">
            Agenda
          </h3>
          <div className="flex h-[500px] flex-col gap-4">
            <div className="flex flex-col gap-2">
              <DateRangePicker className="px-4" />
              <div className="flex gap-8 px-4 py-4">
                <div className="flex flex-col">
                  <p className="text-xs text-stone-600 dark:text-stone-500">
                    Pendientes: 4
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-500">
                    Retrasadas: 3
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" className="rounded-[4px]" />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Incluir completadas
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <ScrollArea>
              <div className="flex flex-col gap-6 px-4">
                <div className="flex flex-col gap-2">
                  <div className="flex w-full justify-between gap-2 rounded-md bg-amber-100 p-2 px-4 dark:bg-amber-200">
                    <h4 className="text-amber-600 dark:text-amber-700">
                      Pendientes
                    </h4>
                    <CalendarClock className="text-amber-600 dark:text-amber-700" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {mockTasks
                      .filter((task) => task.variant === "pending")
                      .map((task) => (
                        <CalendarItem
                          dueDate={task.dueDate}
                          key={task.title}
                          title={task.title}
                          type={task.type as any}
                          variant={task.variant as any}
                        />
                      ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between gap-2 rounded-md bg-red-100 p-2 px-4 dark:bg-red-200">
                    <h4 className="text-red-600 dark:text-red-700">
                      Retrasadas
                    </h4>
                    <CalendarClock className="text-red-600 dark:text-red-700" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {mockTasks
                      .filter((task) => task.variant === "overdue")
                      .map((task) => (
                        <CalendarItem
                          dueDate={task.dueDate}
                          key={task.title}
                          title={task.title}
                          type={task.type as any}
                          variant={task.variant as any}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex h-full flex-col gap-5 md:w-full"></div>
      </div>
    </PageContainer>
  );
};

DashboardPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default DashboardPage;
