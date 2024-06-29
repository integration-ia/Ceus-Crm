import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useForm } from "react-hook-form";
import { useCallback, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/utils/api";
import Link from "next/link";

const resetPasswordFormSchema = z.object({
  email: z
    .string()
    .email("El correo es inválido")
    .min(1, "El correo es requerido"),
});

const ResetPasswordForm = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);

  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const requestPasswordResetMutation =
    api.auth.requestPasswordReset.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof resetPasswordFormSchema>) => {
      try {
        await requestPasswordResetMutation.mutateAsync(formData);
        setResetEmailSent(true);
      } catch (error) {
        console.error((error as Error).message);
        setFormError((error as Error).message);
      }
    },
    [requestPasswordResetMutation],
  );

  if (resetEmailSent) {
    return (
      <div className="flex h-lvh items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Correo enviado</CardTitle>
            <CardDescription>
              Hemos enviado un correo a la dirección proporcionada con
              instrucciones para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-lvh flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico, y si existe una cuenta con ese
            correo, te enviaremos un correo con instrucciones para restablecer
            tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name={"email"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      {form.formState.errors.email?.message ? (
                        <FormDescription
                          className={"text-xs text-red-600 dark:text-red-400"}
                        >
                          {form.formState.errors.email.message}
                        </FormDescription>
                      ) : null}
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Restablecer contraseña
                </Button>
                {formError ? (
                  <div
                    className={
                      "text-center text-xs text-red-600 dark:text-red-400"
                    }
                  >
                    {formError}
                  </div>
                ) : null}
              </div>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            ¿Quieres iniciar sesión?{" "}
            <Link href="/sign-in" className="underline">
              Inicia sesión aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;
