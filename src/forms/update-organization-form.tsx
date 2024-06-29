import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import FormCombobox from "~/components/forms/form-combobox";
import FormInput from "~/components/forms/form-input";
import FormPhoneInput from "~/components/forms/form-phone-input";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { getCountriesList } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

interface UpdateOrganizationFormProps {
  organizationToUpdate: RouterOutputs["organizations"]["getDetails"];
  onOrganizationUpdated: () => void | Promise<void>;
}

const updateOrganizationFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").trim(),
  address: z.string().trim().optional(),
  countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
  emails: z.array(
    z.object({
      id: z.string().cuid2().optional(),
      email: z.string().min(1, "El correo es requerido").email().trim(),
    }),
  ),
  phoneNumbers: z.array(
    z.object({
      id: z.string().cuid2().optional(),
      phoneNumber: z
        .string()
        .min(1, "El número de teléfono es requerido")
        .trim(),
    }),
  ),
});

const UpdateOrganizationForm = ({
  organizationToUpdate,
  onOrganizationUpdated,
}: UpdateOrganizationFormProps) => {
  const updateOrganizationMutation =
    api.organizations.updateOrganization.useMutation();

  const form = useForm<z.infer<typeof updateOrganizationFormSchema>>({
    resolver: zodResolver(updateOrganizationFormSchema),
    defaultValues: {
      name: organizationToUpdate?.name ?? "",
      phoneNumbers: organizationToUpdate?.phoneNumbers ?? [],
      emails: organizationToUpdate?.emails ?? [],
      countryCode: organizationToUpdate?.countryCode ?? "",
    },
  });

  const emailFieldArray = useFieldArray({
    control: form.control,
    name: "emails",
  });

  const phoneNumberFieldArray = useFieldArray({
    control: form.control,
    name: "phoneNumbers",
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof updateOrganizationFormSchema>) => {
      if (!organizationToUpdate) return;

      const deletedEmails = organizationToUpdate.emails.filter(
        (email) => !values.emails.some((newEmail) => newEmail.id === email.id),
      );

      const deletedPhoneNumbers = organizationToUpdate.phoneNumbers.filter(
        (phoneNumber) =>
          !values.phoneNumbers.some(
            (newPhoneNumber) => newPhoneNumber.id === phoneNumber.id,
          ),
      );

      await updateOrganizationMutation.mutateAsync({
        ...values,
        deletedEmails: deletedEmails.map((email) => email.id),
        deletedPhoneNumbers: deletedPhoneNumbers.map(
          (phoneNumber) => phoneNumber.id,
        ),
      });

      await onOrganizationUpdated?.();
    },
    [onOrganizationUpdated, organizationToUpdate, updateOrganizationMutation],
  );

  return (
    <Form {...form}>
      <form
        className="px-4"
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
              name="name"
              label="Nombre"
              placeholder="Nombre"
              required
              error={form.formState.errors.name?.message}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="address"
              label="Dirección"
              placeholder="Dirección"
              error={form.formState.errors.address?.message}
            />
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-end gap-5">
              {phoneNumberFieldArray.fields.map((field, index) => {
                return (
                  <div className="flex w-full items-end gap-3" key={field.id}>
                    <FormPhoneInput
                      control={form.control}
                      disabled={form.formState.isSubmitting}
                      name={`phoneNumbers.${index}.phoneNumber`}
                      label="Teléfono"
                      placeholder="Ingresa un número de teléfono"
                      required
                      error={
                        form.formState.errors.phoneNumbers?.[index]?.phoneNumber
                          ?.message
                      }
                    />
                    <Button size="icon" variant="outline">
                      <Trash2
                        type="button"
                        className="h-4 w-4"
                        onClick={() =>
                          phoneNumberFieldArray.fields.length > 1 &&
                          phoneNumberFieldArray.remove(index)
                        }
                      />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() =>
                  phoneNumberFieldArray.append({
                    phoneNumber: "",
                  })
                }
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-end gap-5">
              {emailFieldArray.fields.map((field, index) => {
                return (
                  <div key={field.id} className="flex w-full items-end gap-4">
                    <FormInput
                      control={form.control}
                      disabled={form.formState.isSubmitting}
                      name={`emails.${index}.email`}
                      type="email"
                      label="Email"
                      placeholder="john@example.com"
                      required
                      error={form.formState.errors.emails?.[index]?.message}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        emailFieldArray.fields.length > 1 &&
                        emailFieldArray.remove(index)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() =>
                  emailFieldArray.append({
                    email: "",
                  })
                }
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-4 lg:flex-row">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default UpdateOrganizationForm;
