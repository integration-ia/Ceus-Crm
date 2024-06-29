import { zodResolver } from "@hookform/resolvers/zod";
import Avatar from "boring-avatars";
import { CircleX, Edit, PlusCircle } from "lucide-react";
import Image from "next/image";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";
import FormCombobox from "~/components/forms/form-combobox";
import FormInput from "~/components/forms/form-input";
import FormPhoneInput from "~/components/forms/form-phone-input";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import Greeter from "~/components/ui/greeter";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getCloudflareImage, getCountriesList } from "~/lib/utils";
import { api } from "~/utils/api";
import imageCompression from "browser-image-compression";
import { type UploadedImageResponseBody } from "~/lib/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

interface AccountConfigurationProps {
  onStepFinished: () => void;
}

const configureAccountFormSchema = z.object({
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
  countryCode: z.string().min(1, "El país es requerido").length(2).trim(),
  profilePhoto: z.object({
    sourceFile: z.custom(),
  }),
});

const AccountConfiguration = ({
  onStepFinished,
}: AccountConfigurationProps) => {
  const router = useRouter();
  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/sign-in").catch(console.error);
    },
  });

  const user = session.data?.user;

  const form = useForm<z.infer<typeof configureAccountFormSchema>>({
    resolver: zodResolver(configureAccountFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      countryCode: user?.countryCode ?? "",
      profilePhoto: {
        sourceFile: null,
      },
    },
  });

  const setupProfileMutation = api.profiles.setupProfile.useMutation();
  const generateSignedUrlsMutation =
    api.media.generateSignedUrlsForPhotos.useMutation();
  const updateProfilePhotoMutation =
    api.profiles.updateProfilePhoto.useMutation();

  const onSubmit = useCallback(
    async (formData: z.infer<typeof configureAccountFormSchema>) => {
      try {
        await setupProfileMutation.mutateAsync(formData);

        if (formData.profilePhoto.sourceFile) {
          const [url] = await generateSignedUrlsMutation.mutateAsync({
            filesCount: 1,
          });

          if (!url) {
            return;
          }

          const cloudflareFormData = new FormData();

          const compressedSourceFile = await imageCompression(
            formData.profilePhoto.sourceFile,
            {
              maxSizeMB: 10,
              maxWidthOrHeight: 800,
              useWebWorker: true,
            },
          );

          cloudflareFormData.append("file", compressedSourceFile);

          const response = await fetch(url, {
            method: "POST",
            body: cloudflareFormData,
          });

          const responseContent =
            (await response.json()) as UploadedImageResponseBody;

          await updateProfilePhotoMutation.mutateAsync(
            responseContent.result.id,
          );
        }

        await session.update();

        onStepFinished?.();
      } catch (error) {
        console.error(error);

        toast("Error", {
          description: (error as Error)?.message,
          icon: <CircleX />,
        });
      }
    },
    [
      generateSignedUrlsMutation,
      onStepFinished,
      session,
      setupProfileMutation,
      updateProfilePhotoMutation,
    ],
  );

  return (
    <div className="p-12 lg:p-24">
      <Greeter
        title="Configuración de cuenta"
        subtitle="Ingresa tus datos personales"
      />
      <div className="mt-12 flex flex-col gap-12 lg:flex-row">
        <div className="flex-1">
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
                <div className="flex justify-end gap-4 lg:flex-row">
                  <Button disabled={form.formState.isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl">Foto de perfil</h2>
          <div className="mt-8 flex w-full flex-1 flex-col items-center gap-4 md:items-center">
            <div className="flex min-w-56 max-w-80 flex-col items-center gap-4">
              {form.watch("profilePhoto").sourceFile || user?.picture ? (
                <AspectRatio ratio={1} className="max-h-96 max-w-96">
                  <Image
                    fill
                    alt="Foto del usuario"
                    src={
                      form.watch("profilePhoto").sourceFile
                        ? URL.createObjectURL(
                            form.getValues("profilePhoto").sourceFile,
                          )
                        : user?.picture
                          ? getCloudflareImage(user.picture, "public")
                          : ""
                    }
                    className="rounded-full object-cover"
                  />
                </AspectRatio>
              ) : (
                <Avatar
                  size={240}
                  name={form.watch("email")}
                  variant="beam"
                  colors={["#FACC15", "#FDE68A", "#FBBF24", "#CA8A04"]}
                />
              )}
              <div className="rounded-md px-4 py-2 transition-colors hover:bg-stone-800">
                <Label htmlFor="picture">
                  {" "}
                  <Edit className="mb-1 mr-2 inline h-4 w-4" />
                  Agregar foto de perfil
                </Label>
                <Input
                  id="picture"
                  accept="image/png, image/jpeg, image/webp"
                  type="file"
                  className="hidden"
                  onClick={(event) => {
                    event.currentTarget.value = "";
                  }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    form.setValue("profilePhoto", { sourceFile: file });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountConfiguration;
