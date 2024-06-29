import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import FormInput from "~/components/forms/form-input";
import FormTextarea from "~/components/forms/form-textarea";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { api } from "~/utils/api";

interface OrganizationValuesFormProps {
  dataToUpdate: {
    id: string;
    title: string;
    value: string;
  }[];
  onDataUpdated: () => void | Promise<void>;
}

const udpdateOrganizationWebsiteDataFormSchema = z.object({
  values: z
    .array(
      z.object({
        id: z.string().cuid2().optional(),
        title: z.string().min(1).trim(),
        value: z.string().min(1).trim(),
      }),
    )
    .max(4),
});

const OrganizationValuesForm = ({
  dataToUpdate,
  onDataUpdated,
}: OrganizationValuesFormProps) => {
  const updateValuesMutation = api.organizations.updateValues.useMutation();

  const form = useForm<
    z.infer<typeof udpdateOrganizationWebsiteDataFormSchema>
  >({
    resolver: zodResolver(udpdateOrganizationWebsiteDataFormSchema),
    defaultValues: {
      values:
        dataToUpdate.length > 0 ? dataToUpdate : [{ title: "", value: "" }],
    },
  });

  const valuesFieldArray = useFieldArray({
    control: form.control,
    name: "values",
  });

  const onSubmit = useCallback(
    async (
      values: z.infer<typeof udpdateOrganizationWebsiteDataFormSchema>,
    ) => {
      const deletedValues = dataToUpdate.filter(
        (value) => !values.values.some((newValue) => newValue.id === value.id),
      );

      await updateValuesMutation.mutateAsync({
        deletedValues: deletedValues.map((value) => value.id),
        values: values.values,
      });

      await onDataUpdated?.();
    },
    [dataToUpdate, onDataUpdated, updateValuesMutation],
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
          {valuesFieldArray.fields.map((field, index) => (
            <>
              <div className="flex flex-col items-end gap-4 lg:flex-row">
                <FormInput
                  control={form.control}
                  disabled={form.formState.isSubmitting}
                  name={`values.${index}.title`}
                  label="Título"
                  placeholder="Honestidad, Respeto, Responsabilidad, etc."
                  error={form.formState.errors.values?.[index]?.title?.message}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    valuesFieldArray.remove(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row">
                <FormTextarea
                  control={form.control}
                  disabled={form.formState.isSubmitting}
                  name={`values.${index}.value`}
                  label="Descripción"
                  placeholder="Descripción"
                  error={form.formState.errors.values?.[index]?.value?.message}
                  rows={8}
                />
              </div>
            </>
          ))}
          <div className="flex w-full justify-end">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={
                form.formState.isSubmitting ||
                valuesFieldArray.fields.length >= 4
              }
              onClick={() => {
                valuesFieldArray.fields.length < 4 &&
                  valuesFieldArray.append({ title: "", value: "" });
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-4 lg:flex-row">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OrganizationValuesForm;
