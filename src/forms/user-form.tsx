import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, PlusCircle, X } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";
import FormCheckbox from "~/components/forms/form-checkbox";
import FormInput from "~/components/forms/form-input";
import FormPhoneInput from "~/components/forms/form-phone-input";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { api, type RouterOutputs } from "~/utils/api";

const userFormSchema = z.object({
  id: z.string().cuid2().optional().nullish(),
  firstName: z.string().min(1, "El nombre es requerido").trim(),
  lastName: z.string().min(1, "El apellido es requerido").trim(),
  phoneNumber: z
    .string()
    .min(1, "El teléfono es requerido")
    .trim()
    .refine(isValidPhoneNumber, { message: "Número de teléfono es inválido" }),
  email: z.string().email("Correo inválido").trim(),
  canCreateProperties: z.boolean(),
  canCreateClients: z.boolean(),
  fullClientAccess: z.boolean(),
  fullPropertyAccess: z.boolean(),
  canSeeGlobalStats: z.boolean(),
  canExportClients: z.boolean(),
  canDeleteClients: z.boolean(),
  canDeleteProperties: z.boolean(),
  canAssignProperties: z.boolean(),
});

interface UserFormProps {
  userToEdit?: RouterOutputs["users"]["list"][number];
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
}

const UserForm = ({
  userToEdit,
  onUserCreated,
  onUserUpdated,
}: UserFormProps) => {
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    mode: "onSubmit",
    defaultValues: {
      id: userToEdit?.id,
      firstName: userToEdit?.firstName ?? "",
      lastName: userToEdit?.lastName ?? "",
      phoneNumber: userToEdit?.phoneNumber ?? "",
      email: userToEdit?.email ?? "",
      canCreateProperties: userToEdit?.canCreateProperties ?? false,
      canCreateClients: userToEdit?.canCreateClients ?? false,
      fullClientAccess: userToEdit?.fullClientAccess ?? false,
      fullPropertyAccess: userToEdit?.fullPropertyAccess ?? false,
      canSeeGlobalStats: userToEdit?.canSeeGlobalStats ?? false,
      canExportClients: userToEdit?.canExportClients ?? false,
      canDeleteClients: userToEdit?.canDeleteClients ?? false,
      canDeleteProperties: userToEdit?.canDeleteProperties ?? false,
      canAssignProperties: userToEdit?.canAssignProperties ?? false,
    },
  });

  const createUserMutation = api.users.createUser.useMutation();
  const updateClientMutation = api.users.updateUser.useMutation();

  const createUser = useCallback(
    async (formData: z.infer<typeof userFormSchema>) => {
      await createUserMutation.mutateAsync(formData);
    },
    [createUserMutation],
  );

  const updateUser = useCallback(
    async (formData: z.infer<typeof userFormSchema>) => {
      const { id, ...rest } = formData;

      if (!id) throw new Error("Client ID is required");

      await updateClientMutation.mutateAsync({
        id,
        ...rest,
      });
    },
    [updateClientMutation],
  );

  const onSubmit = useCallback(
    async (formData: z.infer<typeof userFormSchema>) => {
      try {
        if (!userToEdit) {
          await createUser(formData);

          toast("Usuario creado", {
            description: "Se ha enviado el correo de invitación al usuario",
            icon: <CircleCheck />,
          });

          form.reset();
          onUserCreated?.();
        } else {
          await updateUser(formData);

          toast("Usuario actualizado", {
            description: "Se ha actualizado al usuario exitosamente",
            icon: <CircleCheck />,
          });

          onUserUpdated?.();
        }
      } catch (error) {
        console.log(error);

        if (
          (error as Error).message.includes(
            "Unique constraint failed on the fields: (`email`)",
          )
        ) {
          toast("Error al crear usuario", {
            description: "Ya existe un usuario con este correo en CEUS",
            icon: <X />,
          });
        } else {
          toast("Error al crear usuario", {
            description: (error as Error).message,
            icon: <X />,
          });
        }
      }
    },
    [userToEdit, createUser, form, onUserCreated, onUserUpdated, updateUser],
  );

  return (
    <>
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
                placeholder="Nombre"
                required
                error={form.formState.errors.firstName?.message}
              />
              <FormInput
                control={form.control}
                disabled={form.formState.isSubmitting}
                name="lastName"
                label="Apellido"
                placeholder="Apellido"
                required
                error={form.formState.errors.lastName?.message}
              />
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <FormInput
                control={form.control}
                disabled={form.formState.isSubmitting}
                required
                name="email"
                type="email"
                label="Email"
                placeholder="john@example.com"
                error={form.formState.errors.email?.message}
              />
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <FormPhoneInput
                control={form.control}
                disabled={form.formState.isSubmitting}
                name="phoneNumber"
                label="Teléfono móvil"
                placeholder="Ingresa el número de teléfono"
                required
                error={form.formState.errors.phoneNumber?.message}
              />
            </div>

            <div className="flex flex-col gap-4">
              <h5 className="text-lg">Permisos de usuario</h5>
              <div className="flex flex-col flex-wrap gap-3 md:flex-row">
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canCreateProperties"
                  label="Ingresar inmuebles"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canCreateClients"
                  label="Ingresar clientes"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="fullClientAccess"
                  label="Acceso completo a la base de clientes"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="fullPropertyAccess"
                  label="Acceso completo a la base de inmuebles"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canSeeGlobalStats"
                  label="Ver estadísticas globales"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canExportClients"
                  label="Descargar base de datos de clientes"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canDeleteClients"
                  label="Borrar clientes"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canDeleteProperties"
                  label="Borrar inmuebles"
                />
                <FormCheckbox
                  className="rounded-[4px]"
                  control={form.control}
                  name="canAssignProperties"
                  label="Asignar inmuebles a otros asesores"
                />
              </div>
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
    </>
  );
};

export default UserForm;
