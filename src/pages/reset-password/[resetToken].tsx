import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  Form,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/utils/api";

const newPasswordFormSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(1, "Se requiere una nueva contraseña"),
    newPasswordConfirmation: z
      .string()
      .min(1, "Se requiere confirmar la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["newPasswordConfirmation"],
  });

const ResetTokenVerificationPage = () => {
  const router = useRouter();
  const token = router.query.resetToken;

  const [passwordHasReset, setPasswordHasReset] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof newPasswordFormSchema>>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      newPasswordConfirmation: "",
    },
  });

  const confirmNewPasswordMutation = api.auth.confirmNewPassword.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof newPasswordFormSchema>) => {
      if (!formData.token) {
        setFormError("Restablecimiento de contraseña no válido");
      }

      try {
        await confirmNewPasswordMutation.mutateAsync(formData);
        setPasswordHasReset(true);
      } catch (error) {
        console.error((error as Error).message);
        setFormError((error as Error).message);
      }
    },
    [confirmNewPasswordMutation],
  );

  useEffect(() => {
    if (token && !form.getValues("token") && typeof token === "string") {
      form.setValue("token", token);
    }
  }, [form, token]);

  if (passwordHasReset) {
    return (
      <div className="flex h-lvh flex-col items-center justify-center">
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Contraseña actualizada</CardTitle>
            <CardDescription>
              Tu contraseña ha sido actualizada con éxito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm">
              <Link href="/sign-in" className="underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-lvh flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Crear nueva contraseña</CardTitle>
          <CardDescription>
            Crea una nueva contraseña para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="token"
                  defaultValue={typeof token === "string" ? token : ""}
                  render={({ field }) => <Input type="hidden" {...field} />}
                />
                <FormField
                  control={form.control}
                  name={"newPassword"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs text-red-600 dark:text-red-400">
                        {form.formState.errors.newPassword?.message}
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"newPasswordConfirmation"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs text-red-600 dark:text-red-400">
                        {form.formState.errors.newPasswordConfirmation?.message}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Usar nueva contraseña
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

export default ResetTokenVerificationPage;
