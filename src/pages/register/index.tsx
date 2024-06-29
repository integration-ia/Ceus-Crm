import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
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

const signUpFormSchema = z.object({
  email: z
    .string()
    .email("El correo es inválido")
    .min(1, "El correo es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const SignUpForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpMutation = api.auth.signUp.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof signUpFormSchema>) => {
      try {
        await signUpMutation.mutateAsync(formData);
        const result = await signIn("credentials", formData);

        if (result) {
          router.push("/welcome").catch(console.error);
        }
      } catch (error) {
        console.error((error as Error).message);
        setFormError((error as Error).message);
      }
    },
    [router, signUpMutation],
  );

  return (
    <div className="flex h-lvh flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Crea una cuenta</CardTitle>
          <CardDescription>
            Ingresa un correo electrónico y una contraseña para crear una cuenta
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
                        <FormDescription className="text-xs text-red-600 dark:text-red-400">
                          {form.formState.errors.email.message}
                        </FormDescription>
                      ) : null}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"password"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      {form.formState.errors.password?.message ? (
                        <FormDescription className="text-xs text-red-600 dark:text-red-400">
                          {form.formState.errors.password.message}
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
                  Crea una cuenta
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
            ¿Ya tienes una cuenta?{" "}
            <Link href="/sign-in" className="underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;
