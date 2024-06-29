import { zodResolver } from "@hookform/resolvers/zod";
import { type PropertyNote } from "@prisma/client";
import { CircleCheck, CircleX, PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormTextarea from "~/components/forms/form-textarea";
import { api } from "~/utils/api";
import { Button } from "../components/ui/button";
import { Form } from "../components/ui/form";

interface PropertyNoteFormProps {
  onPropertyNoteCreated?: () => void;
  onPropertyNoteUpdated?: () => void;
  propertyNoteToUpdate?: PropertyNote;
  propertyId?: string;
}

const propertyNoteformSchema = z.object({
  id: z.string().cuid2().optional().or(z.literal("")),
  propertyId: z.string().cuid2().optional(),
  content: z
    .string()
    .min(5, "Se necesita una nota de al menos 5 caracteres")
    .trim(),
});

const PropertyNoteForm = ({
  onPropertyNoteCreated,
  onPropertyNoteUpdated,
  propertyNoteToUpdate,
  propertyId,
}: PropertyNoteFormProps) => {
  const form = useForm<z.infer<typeof propertyNoteformSchema>>({
    resolver: zodResolver(propertyNoteformSchema),
    defaultValues: {
      id: propertyNoteToUpdate?.id ?? "",
      propertyId: propertyNoteToUpdate?.propertyId ?? propertyId ?? "",
      content: propertyNoteToUpdate?.content ?? "",
    },
  });

  const createPropertyNoteMutation = api.propertyNotes.createNote.useMutation();
  const updatePropertyNoteMutation = api.propertyNotes.updateNote.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof propertyNoteformSchema>) => {
      try {
        if (formData.propertyId && !formData.id) {
          // create
          await createPropertyNoteMutation.mutateAsync({
            ...formData,
            propertyId: formData.propertyId,
          });

          toast("Nota creada", {
            description: "Se ha creado la nota exitosamente",
            icon: <CircleCheck />,
          });

          onPropertyNoteCreated?.();
        } else if (formData.id) {
          // update
          await updatePropertyNoteMutation.mutateAsync({
            id: formData.id,
            content: formData.content,
          });

          toast("Nota actualizada", {
            description: "Se ha actualizado la nota exitosamente",
            icon: <CircleCheck />,
          });

          onPropertyNoteUpdated?.();
        } else {
          console.error("Invalid form data", formData);
        }
      } catch (error) {
        console.error(error);

        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [
      createPropertyNoteMutation,
      onPropertyNoteCreated,
      onPropertyNoteUpdated,
      updatePropertyNoteMutation,
    ],
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
              rows={10}
              name="content"
              label="Nota"
              placeholder="Escribe una nota para los demás usuarios que tengan acceso a este inmueble"
              required
              error={form.formState.errors.content?.message}
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

export default PropertyNoteForm;
