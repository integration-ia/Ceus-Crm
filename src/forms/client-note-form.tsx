import { zodResolver } from "@hookform/resolvers/zod";
import { type ClientNote } from "@prisma/client";
import { CircleCheck, CircleX, PlusCircle } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import FormTextarea from "~/components/forms/form-textarea";
import { api } from "~/utils/api";
import { Button } from "../components/ui/button";
import { Form } from "../components/ui/form";

interface ClientNoteFormProps {
  onClientNoteCreated?: () => void;
  onClientNoteUpdated?: () => void;
  clientNoteToUpdate?: ClientNote;
  clientId?: string;
}

const clientNoteformSchema = z.object({
  id: z.string().cuid2().optional().or(z.literal("")),
  clientId: z.string().cuid2().optional(),
  content: z
    .string()
    .min(5, "Se necesita una nota de al menos 5 caracteres")
    .trim(),
});

const ClientNoteForm = ({
  onClientNoteCreated,
  onClientNoteUpdated,
  clientNoteToUpdate,
  clientId,
}: ClientNoteFormProps) => {
  const form = useForm<z.infer<typeof clientNoteformSchema>>({
    resolver: zodResolver(clientNoteformSchema),
    defaultValues: {
      id: clientNoteToUpdate?.id ?? "",
      clientId: clientNoteToUpdate?.clientId ?? clientId ?? "",
      content: clientNoteToUpdate?.content ?? "",
    },
  });

  const createClientNoteMutation = api.clientNotes.createNote.useMutation();
  const updateClientNoteMutation = api.clientNotes.updateNote.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof clientNoteformSchema>) => {
      try {
        if (formData.clientId && !formData.id) {
          // create
          await createClientNoteMutation.mutateAsync({
            ...formData,
            clientId: formData.clientId,
          });

          toast("Nota creada", {
            description: "Se ha creado la nota exitosamente",
            icon: <CircleCheck />,
          });

          onClientNoteCreated?.();
        } else if (formData.id) {
          // update
          await updateClientNoteMutation.mutateAsync({
            id: formData.id,
            content: formData.content,
          });

          toast("Nota actualizada", {
            description: "Se ha actualizado la nota exitosamente",
            icon: <CircleCheck />,
          });

          onClientNoteUpdated?.();
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
      createClientNoteMutation,
      onClientNoteCreated,
      onClientNoteUpdated,
      updateClientNoteMutation,
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

export default ClientNoteForm;
