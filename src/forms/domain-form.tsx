import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX, PlusCircle } from "lucide-react";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormInput from "~/components/forms/form-input";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { api } from "~/utils/api";

interface DomainFormProps {
  onDomainAdded?: () => void | Promise<void>;
}

const domainFormSchema = z.object({
  domainName: z
    .string()
    .min(1, "El nombre del dominio es requerido")
    .trim()
    .refine(
      (value) => {
        const domainRegex =
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        return domainRegex.test(value);
      },
      {
        message: "Nombre de dominio inválido",
      },
    ),
});

const DomainForm = ({ onDomainAdded }: DomainFormProps) => {
  const form = useForm<z.infer<typeof domainFormSchema>>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domainName: "",
    },
  });

  const addDomainMutation =
    api.webDomains.addWebDomainToOrganization.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof domainFormSchema>) => {
      try {
        await addDomainMutation.mutateAsync(formData.domainName);
        await onDomainAdded?.();
      } catch (error) {
        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [addDomainMutation, onDomainAdded],
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
              name="domainName"
              label="Nombre del dominio"
              placeholder="tu-empresa.com"
              required
              error={form.formState.errors.domainName?.message}
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

export default DomainForm;
