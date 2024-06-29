import { zodResolver } from "@hookform/resolvers/zod";
import { ClientTypeEnum } from "@prisma/client";
import { CircleCheck, CircleX, PlusCircle } from "lucide-react";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";
import FormCheckbox from "~/components/forms/form-checkbox";
import FormCombobox from "~/components/forms/form-combobox";
import FormInput from "~/components/forms/form-input";
import FormPhoneInput from "~/components/forms/form-phone-input";
import FormSelect from "~/components/forms/form-select";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { getCountriesList, getFormattedClientTypes } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

const clientFormSchema = z.object({
  id: z.string().cuid2().optional().nullish(),
  firstName: z.string().min(1, "El nombre es requerido").trim(),
  lastName: z.string().min(1, "El apellido es requerido").trim(),
  email: z.string().email().trim().optional().nullish().or(z.literal("")),
  phoneNumber: z
    .string()
    .min(1, "El número de teléfono es requerido")
    .trim()
    .refine(isValidPhoneNumber, { message: "Número de teléfono es inválido" }),
  usesWhatsApp: z.boolean(),
  phoneNumberHome: z
    .string()
    .trim()
    .refine(isValidPhoneNumber, { message: "Número de teléfono es inválido" })
    .optional()
    .nullish()
    .or(z.literal("")),
  address: z.string().trim().optional().nullish(),
  type: z.nativeEnum(ClientTypeEnum, {
    invalid_type_error: "Tipo de cliente inválido",
    required_error: "Tipo de cliente es requerido",
  }),
  countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
});

interface ClientFormProps {
  clientToEdit?: RouterOutputs["clients"]["list"][number];
  onClientCreated?: () => void;
  onClientUpdated?: () => void;
}

const ClientForm = ({
  clientToEdit,
  onClientCreated,
  onClientUpdated,
}: ClientFormProps) => {
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    mode: "onSubmit",
    defaultValues: {
      id: clientToEdit?.id,
      firstName: clientToEdit?.firstName ?? "",
      lastName: clientToEdit?.lastName ?? "",
      email: clientToEdit?.emails.at(0)?.email ?? "",
      phoneNumber:
        clientToEdit?.phoneNumbers.filter((p) => p.type === "MOBILE").at(0)
          ?.phoneNumber ?? "",
      phoneNumberHome:
        clientToEdit?.phoneNumbers.filter((p) => p.type === "HOME").at(0)
          ?.phoneNumber ?? "",
      address: clientToEdit?.address ?? "",
      type: clientToEdit?.type ?? ClientTypeEnum.BUYER,
      countryCode: clientToEdit?.countryCode ?? "",
      usesWhatsApp: clientToEdit?.phoneNumbers.at(0)?.usesWhatsApp ?? false,
    },
  });

  const createClientMutation = api.clients.createClient.useMutation();
  const updateClientMutation = api.clients.updateClient.useMutation();

  const createClient = useCallback(
    async (formData: z.infer<typeof clientFormSchema>) => {
      await createClientMutation.mutateAsync(formData);
    },
    [createClientMutation],
  );

  const updateClient = useCallback(
    async (formData: z.infer<typeof clientFormSchema>) => {
      const { id, ...rest } = formData;

      if (!id) throw new Error("Client ID is required");

      await updateClientMutation.mutateAsync({
        clientId: id,
        ...rest,
      });
    },
    [updateClientMutation],
  );

  const onSubmit = useCallback(
    async (formData: z.infer<typeof clientFormSchema>) => {
      if (!clientToEdit) {
        try {
          await createClient(formData);
        } catch (error) {
          toast("Error", {
            description: (error as Error)?.message,
            icon: <CircleX />,
          });
          return;
        }

        toast("Cliente creado", {
          description: "Se ha creado un nuevo cliente exitosamente",
          icon: <CircleCheck />,
        });

        form.reset();
        onClientCreated?.();
      } else {
        try {
          await updateClient(formData);
        } catch (error) {
          toast("Error", {
            description: (error as Error)?.message,
            icon: <CircleX />,
          });
          return;
        }

        toast("Cliente actualizado", {
          description: "Se ha actualizado al cliente exitosamente",
          icon: <CircleCheck />,
        });

        onClientUpdated?.();
      }
    },
    [
      clientToEdit,
      createClient,
      form,
      onClientCreated,
      onClientUpdated,
      updateClient,
    ],
  );

  return (
    <Form {...form}>
      <form
        onKeyDown={(e) => {
          const key = e.key;
          if (
            key === "Enter" &&
            (e.target as HTMLElement).tagName !== "TEXTAREA"
          ) {
            e.preventDefault();
          }
        }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="firstName"
              label="Nombre"
              placeholder="Nombre del cliente"
              required
              error={form.formState.errors.firstName?.message}
            />
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="lastName"
              label="Apellido"
              placeholder="Apellido del cliente"
              required
              error={form.formState.errors.lastName?.message}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="email"
              type="email"
              label="Email"
              placeholder="john@example.com"
              error={form.formState.errors.email?.message}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-col gap-4">
              <FormPhoneInput
                control={form.control}
                disabled={form.formState.isSubmitting}
                name="phoneNumber"
                label="Teléfono móvil"
                placeholder="Ingresa el número de teléfono"
                required
                error={form.formState.errors.phoneNumber?.message}
              />
              <FormCheckbox
                control={form.control}
                disabled={form.formState.isSubmitting}
                name="usesWhatsApp"
                label="Usa WhatsApp"
                className="rounded-[4px]"
              />
            </div>
            <FormPhoneInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="phoneNumberHome"
              label="Teléfono fijo"
              placeholder="Ingresa el número de teléfono"
              error={form.formState.errors.phoneNumber?.message}
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <FormSelect
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="type"
              label="Tipo de cliente"
              placeholder="Selecciona un tipo"
              required
              error={form.formState.errors.type?.message}
            >
              {getFormattedClientTypes().map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </FormSelect>
            <FormCombobox
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="countryCode"
              label="País"
              placeholder="Selecciona un país"
              error={form.formState.errors.countryCode?.message}
              required
              items={getCountriesList().map(({ isoCode, name, flag }) => {
                return {
                  value: isoCode,
                  label: `${name} ${flag}`,
                };
              })}
              setValue={form.setValue}
            />
          </div>
          <div className="flex justify-end gap-4 lg:flex-row">
            <Button disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
