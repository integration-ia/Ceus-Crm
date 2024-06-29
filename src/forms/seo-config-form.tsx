import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormInput from "~/components/forms/form-input";
import FormTextarea from "~/components/forms/form-textarea";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { api } from "~/utils/api";

interface SeoConfigFormProps {
  dataToUpdate:
    | {
        title: string | null;
        description: string | null;
      }
    | undefined;
  onDataUpdated: () => void | Promise<void>;
}

const seoConfigFormSchema = z.object({
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(60, "El título no puede tener más de 60 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede tener más de 200 caracteres"),
});

const SeoConfigForm = ({ dataToUpdate, onDataUpdated }: SeoConfigFormProps) => {
  const updateSeoConfigMutation =
    api.organizations.updateSeoConfig.useMutation();

  const form = useForm<z.infer<typeof seoConfigFormSchema>>({
    resolver: zodResolver(seoConfigFormSchema),
    defaultValues: {
      title: dataToUpdate?.title ?? "",
      description: dataToUpdate?.description ?? "",
    },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof seoConfigFormSchema>) => {
      await updateSeoConfigMutation.mutateAsync(data);
      await onDataUpdated();
    },
    [updateSeoConfigMutation, onDataUpdated],
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
          <FormInput
            control={form.control}
            className="w-full"
            name="title"
            label="Título"
            placeholder="Ingresa un título"
            error={form.formState.errors.title?.message}
          />
        </div>
        <div className="flex flex-col gap-4">
          <FormTextarea
            control={form.control}
            name="description"
            label="Descripción"
            placeholder="Ingrese una descripción"
            error={form.formState.errors.description?.message}
          />
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

export default SeoConfigForm;
