import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX, PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";
import FormCombobox from "~/components/forms/form-combobox";
import { getCountriesList } from "~/lib/utils";
import { api } from "~/utils/api";
import FormInput from "../components/forms/form-input";
import FormPhoneInput from "../components/forms/form-phone-input";
import { Button } from "../components/ui/button";
import { Form } from "../components/ui/form";

interface UpdateProfileFormProps {
  onProfileUpdated?: () => void;
}

const updateProfileFormSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido").trim(),
    lastName: z.string().min(1, "El apellido es requerido").trim(),
    email: z.string().min(1, "El correo es requerido").email().trim(),
    phoneNumber: z
      .string()
      .min(1, "El número de teléfono es requerido")
      .trim()
      .refine(isValidPhoneNumber, {
        message: "Número de teléfono es inválido",
      }),
    password: z.string().trim(),
    passwordConfirmation: z.string().trim(),
    countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
  })
  .superRefine((data, context) => {
    if (data.password && data.password !== data.passwordConfirmation) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "Las contraseñas no coinciden. Por favor, asegúrate de que las contraseñas sean iguales.",
      });
    }
  });

const UpdateProfileForm = ({ onProfileUpdated }: UpdateProfileFormProps) => {
  const router = useRouter();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  const user = session.data?.user;

  const form = useForm<z.infer<typeof updateProfileFormSchema>>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      password: "",
      passwordConfirmation: "",
      countryCode: user?.countryCode ?? "",
    },
  });

  const updateProfileMutation = api.profiles.updateProfile.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof updateProfileFormSchema>) => {
      try {
        await updateProfileMutation.mutateAsync(formData);
        await session.update();

        onProfileUpdated?.();
      } catch (error) {
        console.error(error);

        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [onProfileUpdated, session, updateProfileMutation],
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
              name="email"
              type="email"
              label="Email"
              placeholder="john@example.com"
              required
              error={form.formState.errors.email?.message}
            />
          </div>
          <div className="flex flex-col gap-4 lg:flex-row">
            <FormPhoneInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="phoneNumber"
              label="Teléfono móvil"
              placeholder="Ingresa tu número de teléfono"
              required
              error={form.formState.errors.phoneNumber?.message}
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
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="password"
              type="password"
              label="Contraseña"
              placeholder="Escribe tu nueva contraseña"
              error={form.formState.errors.password?.message}
            />
            <FormInput
              control={form.control}
              disabled={form.formState.isSubmitting}
              name="passwordConfirmation"
              type="password"
              label="Confirmar contraseña"
              placeholder="Escribe la contraseña nuevamente"
              error={form.formState.errors.passwordConfirmation?.message}
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

export default UpdateProfileForm;
