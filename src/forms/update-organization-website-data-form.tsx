import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormTextarea from "~/components/forms/form-textarea";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { api } from "~/utils/api";

interface UpdateOrganizationWebsiteDataFormProps {
  dataToUpdate: {
    aboutText?: string;
    missionText?: string;
    visionText?: string;
  } | null;
  onDataUpdated?: () => void | Promise<void>;
}

const udpdateOrganizationWebsiteDataFormSchema = z.object({
  aboutUs: z.string().trim().optional(),
  mission: z.string().trim().optional(),
  vision: z.string().trim().optional(),
});

const UpdateOrganizationWebsiteDataForm = ({
  onDataUpdated,
  dataToUpdate,
}: UpdateOrganizationWebsiteDataFormProps) => {
  const updateWebsiteDataMutation =
    api.organizations.updateWebsiteData.useMutation();

  const form = useForm<
    z.infer<typeof udpdateOrganizationWebsiteDataFormSchema>
  >({
    resolver: zodResolver(udpdateOrganizationWebsiteDataFormSchema),
    defaultValues: {
      aboutUs: dataToUpdate?.aboutText,
      mission: dataToUpdate?.missionText,
      vision: dataToUpdate?.visionText,
    },
  });

  const onSubmit = useCallback(
    async (
      values: z.infer<typeof udpdateOrganizationWebsiteDataFormSchema>,
    ) => {
      await updateWebsiteDataMutation.mutateAsync(values);
      await onDataUpdated?.();
    },
    [onDataUpdated, updateWebsiteDataMutation],
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
            <FormTextarea
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="aboutUs"
              label="Texto de la sección 'Quiénes somos'"
              placeholder="Quiénes somos"
              error={form.formState.errors.aboutUs?.message}
              rows={8}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormTextarea
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="mission"
              label="Texto de la sección 'Misión'"
              placeholder="Misión"
              error={form.formState.errors.mission?.message}
              rows={8}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormTextarea
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="vision"
              label="Texto de la sección 'Visión'"
              placeholder="Visión"
              error={form.formState.errors.vision?.message}
              rows={8}
            />
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

export default UpdateOrganizationWebsiteDataForm;
