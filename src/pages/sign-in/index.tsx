import Image from "next/image";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { useRouter } from "next/router";

const signInFormSchema = z.object({
  email: z
    .string()
    .email("El correo es inválido")
    .min(1, "El correo es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const SignInForm = () => {
  const router = useRouter();

  const callbackUrl = router.query.callbackUrl as string | undefined;

  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = useCallback(
    async (formData: z.infer<typeof signInFormSchema>) => {
      try {
        const response = await signIn("credentials", {
          ...formData,
          redirect: false,
        });

        if (callbackUrl) {
          await router.push(callbackUrl);
        } else {
          await router.push("/");
        }

        if (response?.error?.includes("CredentialsSignin")) {
          console.error("CredentialsSignin error", response.error, response);
          setFormError("Correo y/o contraseña incorrectos");
        } else if (response?.error) {
          console.error("Error signing in", response?.error, response);
          setFormError("Ha ocurrido un error al iniciar sesión");
        }
      } catch (error) {
        console.error((error as Error).message, error);
        setFormError("Ha ocurrido un error al iniciar sesión");
      }
    },
    [callbackUrl, router],
  );

  return (
    <div className="h-lvh w-full lg:min-h-[600px] lg:grid-cols-2 xl:grid xl:min-h-[800px]">
      <div className="flex h-full items-center justify-center py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mx-auto grid w-[350px] gap-6">
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Inicia sesión</h1>
                <p className="text-balance text-muted-foreground">
                  Escribe tu correo electrónico y contraseña
                </p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={"email"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo</FormLabel>
                        <FormControl>
                          <Input placeholder={"email@example.com"} {...field} />
                        </FormControl>
                        {form.formState.errors?.email ? (
                          <FormDescription
                            className={"text-xs text-red-600 dark:text-red-400"}
                          >
                            {form.formState.errors.email.message}
                          </FormDescription>
                        ) : null}
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name={"password"}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Contraseña</FormLabel>
                          <Link
                            href={"/reset-password"}
                            className={"ml-auto inline-block text-xs underline"}
                          >
                            ¿Olvidaste tu contraseña?
                          </Link>
                        </div>
                        <FormControl>
                          <Input type={"password"} {...field} />
                        </FormControl>
                        {form.formState.errors?.password ? (
                          <FormDescription
                            className={"text-xs text-red-600 dark:text-red-400"}
                          >
                            {form.formState.errors.password.message}
                          </FormDescription>
                        ) : null}
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  disabled={form.formState.isSubmitting}
                  type="submit"
                  className="w-full"
                >
                  Iniciar sesión
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
              <div className="mt-4 text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="underline">
                  Crea una cuenta
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
      <div className="hidden bg-muted xl:block">
        <Image
          src="/assets/sign-in-bg.jpg"
          alt="Image"
          width="1024"
          height="1024"
          className="drag pointer-events-none h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
};

export default SignInForm;
