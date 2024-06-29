import { ControlPosition, Map, Marker } from "@vis.gl/react-google-maps";
import { CircleHelp, DollarSign, MapPinOff, Percent } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import FormCheckbox from "~/components/forms/form-checkbox";
import FormCurrencyInput from "~/components/forms/form-currency-input";
import FormInput from "~/components/forms/form-input";
import FormSelect from "~/components/forms/form-select";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { CustomMapControl } from "~/components/ui/custom-map-control";
import { Label } from "~/components/ui/label";
import MapHandler from "~/components/ui/map-handler";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { SelectItem } from "~/components/ui/select";
import { type propertyFormSchema } from "./schema";
import { type z } from "zod";
import { api, type RouterOutputs } from "~/utils/api";
import {
  getCitiesOfState,
  getCountriesList,
  getFormattedBuiltAreaSizeUnits,
  getFormattedListingTypes,
  getFormattedPhysicalStatuses,
  getFormattedPropertyTypes,
  getFormattedPublicationStatuses,
  getFormattedRentTimes,
  getStatesOfCountry,
} from "~/lib/utils";
import Image from "next/image";
import { useSession } from "next-auth/react";
import FormCombobox from "~/components/forms/form-combobox";
import { ListingTypeEnum } from "@prisma/client";
import FormTextarea from "~/components/forms/form-textarea";

interface GeneralSectionProps {
  propertyToEdit?: RouterOutputs["dashboard"]["getLatestData"]["properties"][number];
}

const GeneralSection = ({ propertyToEdit }: GeneralSectionProps) => {
  const form = useFormContext<z.infer<typeof propertyFormSchema>>();

  const [placeSearched, setPlaceSearched] =
    useState<google.maps.places.PlaceResult | null>(null);

  const session = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/sign-in";
    },
  });

  const { data: agentsList, isLoading: agentsListIsLoading } =
    api.users.listAgents.useQuery();

  const listOfAgents = useMemo(
    () =>
      session.data
        ? [
            {
              id: session.data?.user.id ?? "",
              name: session.data?.user.name
                ? session.data.user.name
                : "Nombre no definido",
            },
            ...(agentsList ?? []).map((agent) => ({
              id: agent.id,
              name: `${agent.firstName} ${agent.lastName}`,
            })),
          ]
        : [],
    [agentsList, session.data],
  );

  return (
    <>
      <FormInput
        control={form.control}
        name="title"
        label="Título de la publicación"
        placeholder="Hermosa casa en zona exclusiva de la capital"
        required
        disabled={form.formState.isSubmitting}
        error={form.formState.errors.title?.message}
      />
      {propertyToEdit ? null : (
        <div className="flex h-fit flex-col gap-4 lg:flex-row">
          <FormCheckbox
            control={form.control}
            className="rounded-[4px]"
            name="shareWithCEUS"
            label="Me gustaría que CEUS también promueva este inmueble"
          />
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormSelect
          control={form.control}
          name={"propertyType"}
          label="Tipo de inmueble"
          placeholder="Selecciona el tipo de inmueble"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.propertyType?.message}
          required
        >
          {getFormattedPropertyTypes().map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelect>

        <FormSelect
          control={form.control}
          name={"publicationStatus"}
          label="Estado"
          placeholder="Selecciona el estado de publicación"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.publicationStatus?.message}
          required
        >
          {getFormattedPublicationStatuses().map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelect>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormInput
          control={form.control}
          name="constructionYear"
          type="number"
          placeholder={new Date().getFullYear().toString()}
          disabled={form.formState.isSubmitting}
          label="Año de construcción"
          error={form.formState.errors.constructionYear?.message}
        />
        <FormSelect
          control={form.control}
          name={"physicalStatus"}
          label="Estado físico"
          placeholder="Selecciona el estado físico de la propiedad"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.physicalStatus?.message}
          fullWidth
          required
        >
          {getFormattedPhysicalStatuses().map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelect>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormSelect
          control={form.control}
          name={"agentInChargeId"}
          label="Agente encargado"
          placeholder="Selecciona a un agente"
          disabled={form.formState.isSubmitting || agentsListIsLoading}
          error={form.formState.errors.agentInChargeId?.message}
          required
        >
          {listOfAgents.map(({ id, name }) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </FormSelect>

        <FormSelect
          control={form.control}
          name={"listingType"}
          label="Tipo de negocio"
          placeholder="Selecciona el tipo de negocio"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.listingType?.message}
          required
        >
          {getFormattedListingTypes().map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FormSelect>
      </div>
      {form.getValues("listingType").includes("RENT") ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <FormSelect
            control={form.control}
            name={"rentTime"}
            label="Tiempo de alquiler"
            placeholder="Selecciona el tiempo de alquiler"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.countryCode?.message}
          >
            {getFormattedRentTimes().map(({ label, value }) => (
              <SelectItem key={value} value={value} className="relative">
                {label}
              </SelectItem>
            ))}
          </FormSelect>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormCombobox
          control={form.control}
          name="countryCode"
          label="País"
          placeholder="Selecciona un país"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.countryCode?.message}
          onChange={(value) => {
            form.setValue("regionCode", undefined);
            form.setValue("cityName", undefined);
            form.setValue("countryCode", value);
          }}
          required
          items={getCountriesList().map(({ isoCode, name, flag }) => {
            return {
              value: isoCode,
              label: `${name} ${flag}`,
            };
          })}
          setValue={form.setValue}
        />

        <FormSelect
          control={form.control}
          name={"regionCode"}
          label="Departamento, estado o provincia"
          placeholder="Selecciona el departamento o estado"
          disabled={
            form.formState.isSubmitting ||
            !form.watch("countryCode") ||
            Boolean(
              form.watch("countryCode") &&
                getStatesOfCountry(form.watch("countryCode")).length === 0,
            )
          }
          onChange={(value) => {
            form.setValue("cityName", undefined);
            form.setValue("regionCode", value);
          }}
          error={form.formState.errors.regionCode?.message}
        >
          {form.watch("countryCode")
            ? getStatesOfCountry(form.watch("countryCode")).map(
                ({ name, isoCode }) => (
                  <SelectItem key={isoCode} value={isoCode}>
                    {name}
                  </SelectItem>
                ),
              )
            : []}
        </FormSelect>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormSelect
          control={form.control}
          name={"cityName"}
          label="Ciudad"
          placeholder="Selecciona una ciudad"
          disabled={
            !form.watch("regionCode") ||
            !!(
              form.watch("countryCode") &&
              form.watch("regionCode") &&
              getCitiesOfState(
                form.watch("countryCode"),
                form.watch("regionCode")!,
              ).length === 0
            )
          }
          error={form.formState.errors.cityName?.message}
        >
          {getCitiesOfState(
            form.watch("countryCode"),
            form.watch("regionCode")!,
          ).map(({ name }) => (
            <SelectItem key={name} value={name} className="relative">
              {name}
            </SelectItem>
          ))}
        </FormSelect>

        {form.watch("countryCode") === "GT" ? (
          <FormInput
            control={form.control}
            name={"zone"}
            label="Zona"
            placeholder="0"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.zone?.message}
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormInput
          control={form.control}
          name={"address"}
          label="Dirección"
          placeholder="Dirección física del inmueble"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.address?.message}
          description="Este campo es privado y no será visible en la publicación del inmueble"
          required
        />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="h-full w-full">
          <div className="flex h-[450px] flex-col  gap-2">
            <p className="mb-1 text-sm">
              Ubicacion geográfica del inmueble
              <Popover>
                <PopoverTrigger asChild className="cursor-pointer">
                  <CircleHelp className="ml-1 inline h-4" />
                </PopoverTrigger>
                <PopoverContent className="space-y-2">
                  <p className="text-xs">
                    Cuando selecciones la ubicación exacta esta será solo para
                    ti, pero los clientes en tu website la verán como el
                    siguiente ejemplo
                  </p>

                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src="/tutorial/tutorial-map.webp"
                      alt="Ejemplo de ubicación aproximada"
                      fill
                    />
                  </AspectRatio>
                </PopoverContent>
              </Popover>
            </p>
            <Map
              mapId={"map"}
              className="h-full w-full"
              defaultCenter={{
                lat: propertyToEdit?.addressLatitude ?? 14.634915,
                lng: propertyToEdit?.addressLongitude ?? -90.506882,
              }} // TODO: grab from user's profile
              defaultZoom={13}
              gestureHandling={"greedy"}
              disableDefaultUI={true}
              onClick={(e) => {
                if (e.detail.latLng) {
                  const { lat, lng } = e.detail.latLng;

                  form.setValue("addressLatitude", lat);
                  form.setValue("addressLongitude", lng);
                }
              }}
            >
              {form.watch("addressLatitude") &&
              form.watch("addressLongitude") ? (
                <Marker
                  position={
                    form.watch("addressLatitude") &&
                    form.watch("addressLongitude")
                      ? {
                          lat: form.watch("addressLatitude")!,
                          lng: form.watch("addressLongitude")!,
                        }
                      : undefined
                  }
                  clickable
                  label={"Ubicación del inmueble"}
                  title={"Ubicación del inmueble"}
                  draggable
                  onDrag={(e) => {
                    if (!e.latLng) return;

                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    const { lat, lng } = e.latLng;

                    form.setValue("addressLatitude", lat());
                    form.setValue("addressLongitude", lng());
                  }}
                />
              ) : null}
            </Map>
          </div>

          {form.formState.errors.addressLatitude ??
          form.formState.errors.addressLongitude ? (
            <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              {form.formState.errors.addressLatitude?.message ??
                form.formState.errors.addressLongitude?.message}
            </p>
          ) : null}
          <CustomMapControl
            controlPosition={ControlPosition.TOP_LEFT}
            onPlaceSelect={(place) => {
              if (place?.geometry?.location) {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                const { lat, lng } = place.geometry.location;

                form.setValue("addressLatitude", lat());
                form.setValue("addressLongitude", lng());
                setPlaceSearched(place);
              }
            }}
          />
          <MapHandler place={placeSearched} />
        </div>
      </div>
      <div>
        {form.watch("addressLatitude") && form.watch("addressLongitude") ? (
          <Button
            onClick={() => {
              form.setValue("addressLatitude", undefined);
              form.setValue("addressLongitude", undefined);
            }}
            variant="outline"
            className="dark:bg-stone-900"
          >
            <MapPinOff className="mr-2 h-4 w-4" />
            Borrar ubicación
          </Button>
        ) : null}
      </div>
      {form.watch("listingType") === ListingTypeEnum.SALE_RENT ? null : (
        <>
          {form.watch("listingType") !== ListingTypeEnum.SALE_RENT ? (
            form.watch?.("listingType")?.includes("SALE") ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <FormCurrencyInput
                    control={form.control}
                    name={"salePriceDollars"}
                    label="Precio de venta"
                    placeholder="1,000,000"
                    disabled={form.formState.isSubmitting}
                    error={form.formState.errors.salePriceDollars?.message}
                    iconLeft={
                      <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                    }
                    required
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="serviceFeePercentage" className="mb-2">
                      Porcentaje de comisión
                    </Label>
                    <div className="w-20">
                      <FormInput
                        control={form.control}
                        name={"serviceFeePercentage"}
                        label=""
                        placeholder="25"
                        disabled={form.formState.isSubmitting}
                        error={
                          form.formState.errors.serviceFeePercentage?.message
                        }
                        iconRight={
                          <Percent className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                        }
                      />
                    </div>
                  </div>
                </div>
                <FormCurrencyInput
                  control={form.control}
                  name={"uniqueTaxForPropertyDollars"}
                  label="IUSI (Impuesto único sobre inmueble trimestral)"
                  placeholder="1200"
                  disabled={form.formState.isSubmitting}
                  error={
                    form.formState.errors.uniqueTaxForPropertyDollars?.message
                  }
                  iconLeft={
                    <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <FormCurrencyInput
                      control={form.control}
                      name={"rentPriceDollars"}
                      label="Precio de renta"
                      placeholder="600"
                      disabled={form.formState.isSubmitting}
                      error={form.formState.errors.rentPriceDollars?.message}
                      iconLeft={
                        <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                      }
                      required
                    />
                    <div className="flex flex-col">
                      <Label htmlFor="serviceFeePercentage" className="mb-2">
                        Porcentaje de comisión
                      </Label>
                      <div className="w-20">
                        <FormInput
                          control={form.control}
                          name={"serviceFeePercentage"}
                          label=""
                          placeholder="25"
                          disabled={form.formState.isSubmitting}
                          error={
                            form.formState.errors.serviceFeePercentage?.message
                          }
                          iconRight={
                            <Percent className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </>
      )}
      {form.watch("listingType") === ListingTypeEnum.SALE_RENT ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormCurrencyInput
              control={form.control}
              name={"salePriceDollars"}
              label="Precio de venta"
              placeholder="1,000,000"
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.salePriceDollars?.message}
              iconLeft={
                <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
              }
              required
            />
            <FormCurrencyInput
              control={form.control}
              name={"rentPriceDollars"}
              label="Precio de renta"
              placeholder="600"
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.rentPriceDollars?.message}
              iconLeft={
                <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
              }
              required
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormCurrencyInput
              control={form.control}
              name={"uniqueTaxForPropertyDollars"}
              label="IUSI (Impuesto único sobre inmueble trimestral)"
              placeholder="1200"
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.uniqueTaxForPropertyDollars?.message}
              iconLeft={
                <DollarSign className="h-5 w-5 text-stone-600 dark:text-stone-500" />
              }
            />
            <div className="flex flex-col">
              <Label htmlFor="serviceFeePercentage" className="mb-2">
                Porcentaje de comisión
              </Label>
              <div className="w-20">
                <FormInput
                  control={form.control}
                  name={"serviceFeePercentage"}
                  label=""
                  placeholder="25"
                  disabled={form.formState.isSubmitting}
                  error={form.formState.errors.serviceFeePercentage?.message}
                  iconRight={
                    <Percent className="h-5 w-5 text-stone-600 dark:text-stone-500" />
                  }
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormSelect
          control={form.control}
          name={"bathrooms"}
          label="Baños"
          placeholder="1"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.bathrooms?.message}
        >
          {Array.from({ length: 11 }, (_, i) => i).map((i, _, source) => (
            <SelectItem key={i} value={i.toString()}>
              {i + (i >= source.length ? "+" : "")}
            </SelectItem>
          ))}
        </FormSelect>
        <FormSelect
          control={form.control}
          name={"bedrooms"}
          label="Habitaciones"
          placeholder="1"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.bedrooms?.message}
        >
          {Array.from({ length: 16 }, (_, i) => i).map((i, _, source) => (
            <SelectItem key={i} value={i.toString()}>
              {i + (i >= source.length ? "+" : "")}
            </SelectItem>
          ))}
        </FormSelect>
        <FormSelect
          control={form.control}
          name={"parkingSpaces"}
          label="Garages"
          placeholder="1"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.parkingSpaces?.message}
        >
          {Array.from({ length: 21 }, (_, i) => i).map((i, _, source) => (
            <SelectItem key={i} value={i.toString()}>
              {i + (i >= source.length ? "+" : "")}
            </SelectItem>
          ))}
        </FormSelect>
        <FormSelect
          control={form.control}
          name={"floorNumber"}
          label="Nivel"
          placeholder="1"
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.floorNumber?.message}
        >
          {Array.from({ length: 26 }, (_, i) => i).map((i, _, source) => (
            <SelectItem key={i} value={i.toString()}>
              {i + (i >= source.length ? "+" : "")}
            </SelectItem>
          ))}
        </FormSelect>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 gap-1">
          <FormInput
            control={form.control}
            name={"builtAreaSize"}
            label="Área construida"
            placeholder="200"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.builtAreaSize?.message}
          />
          <div className="w-20">
            <FormSelect
              control={form.control}
              name={"builtAreaSizeUnit"}
              label=""
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.builtAreaSizeUnit?.message}
            >
              {getFormattedBuiltAreaSizeUnits().map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormSelect>
          </div>
        </div>
        <div className="flex flex-1 gap-1">
          <FormInput
            control={form.control}
            name={"totalAreaSize"}
            label="Área total / terreno"
            placeholder="200"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.totalAreaSize?.message}
          />
          <div className="w-20">
            <FormSelect
              control={form.control}
              name={"totalAreaSizeUnit"}
              label=""
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.totalAreaSizeUnit?.message}
            >
              {getFormattedBuiltAreaSizeUnits().map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <FormTextarea
          control={form.control}
          name="description"
          label="Descripción"
          placeholder="Descripción detallada del inmueble"
          required
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.description?.message}
          rows={10}
        />
      </div>
      {propertyToEdit ? null : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <FormTextarea
            control={form.control}
            name="notes"
            label="Observaciones"
            placeholder="Observaciones privadas sobre el inmueble"
            description="Este campo es privado y no será visible en la publicación del inmueble"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.notes?.message}
            rows={10}
          />
        </div>
      )}
    </>
  );
};

export default GeneralSection;
