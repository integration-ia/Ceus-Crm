import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationSocialMediaPlatformEnum } from "@prisma/client";
import { PlusCircle, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import FormInput from "~/components/forms/form-input";
import FormSelect from "~/components/forms/form-select";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { SelectItem } from "~/components/ui/select";
import { getFormattedSocialMediaPlatforms } from "~/lib/utils";
import { api } from "~/utils/api";

interface OrganizationSocialMediaLinksFormProps {
  dataToUpdate: {
    id: string;
    platform: OrganizationSocialMediaPlatformEnum;
    link: string;
  }[];
  onDataUpdated: () => void | Promise<void>;
}

const updateOrganizationSocialMediaLinksFormSchema = z.object({
  socialMediaLinks: z
    .array(
      z.object({
        id: z.string().cuid2().optional(),
        platform: z
          .nativeEnum(OrganizationSocialMediaPlatformEnum)
          .or(z.literal(""))
          .refine((value) => value.trim() !== "", {
            message: "La plataforma es requerida",
          }),
        link: z
          .string()
          .min(1)
          .trim()
          .url({ message: "Invalid URL" })
          .refine(
            (value) => {
              // check if the URL is a valid Facebook, Twitter, Instagram or TikTok URL
              if (
                value.includes("facebook") ||
                value.includes("x.com") ||
                value.includes("twitter") ||
                value.includes("instagram") ||
                value.includes("tiktok")
              ) {
                return true;
              }
            },
            {
              message: "El enlace debe ser de Facebook, X, Instagram o TikTok",
            },
          ),
      }),
    )
    .max(4),
});

const OrganizationSocialMediaLinksForm = ({
  dataToUpdate,
  onDataUpdated,
}: OrganizationSocialMediaLinksFormProps) => {
  const updateSocialMediaLinksMutation =
    api.organizations.updateSocialMediaLinks.useMutation();

  const form = useForm<
    z.infer<typeof updateOrganizationSocialMediaLinksFormSchema>
  >({
    resolver: zodResolver(updateOrganizationSocialMediaLinksFormSchema),
    defaultValues: {
      socialMediaLinks: dataToUpdate.length > 0 ? dataToUpdate : [],
    },
  });

  const valuesFieldArray = useFieldArray({
    control: form.control,
    name: "socialMediaLinks",
  });

  const onSubmit = useCallback(
    async ({
      socialMediaLinks,
    }: z.infer<typeof updateOrganizationSocialMediaLinksFormSchema>) => {
      const deletedValues = dataToUpdate.filter(
        (value) =>
          !socialMediaLinks.some((newValue) => newValue.id === value.id),
      );

      await updateSocialMediaLinksMutation.mutateAsync({
        deletedValues: deletedValues.map((value) => value.id),
        values: socialMediaLinks,
      });

      await onDataUpdated?.();
    },
    [dataToUpdate, onDataUpdated, updateSocialMediaLinksMutation],
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
          {valuesFieldArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-4 md:flex-row md:items-end"
            >
              <FormSelect
                className="md:w-32"
                control={form.control}
                name={`socialMediaLinks.${index}.platform`}
                label="Plataforma"
                placeholder="Selecciona una plataforma"
                required
                error={
                  form.formState.errors.socialMediaLinks?.[index]?.platform
                    ?.message
                }
              >
                {getFormattedSocialMediaPlatforms().map((platform) => (
                  <SelectItem
                    disabled={
                      // disable the platform if it's already selected unless it's the current platform
                      form.watch(`socialMediaLinks.${index}.platform`) ===
                      platform.value
                        ? false
                        : form.watch(`socialMediaLinks`).some((field) => {
                            return field.platform === platform.value;
                          })
                    }
                    key={platform.value}
                    value={platform.value}
                  >
                    {platform.label}
                  </SelectItem>
                ))}
              </FormSelect>
              <FormInput
                control={form.control}
                className="w-full"
                name={`socialMediaLinks.${index}.link`}
                label="Enlace"
                required
                placeholder="Ingrese un enlace a una red social"
                error={
                  form.formState.errors.socialMediaLinks?.[index]?.link?.message
                }
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  valuesFieldArray.remove(index);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex w-full justify-end">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={
                form.formState.isSubmitting ||
                valuesFieldArray.fields.length >= 4
              }
              onClick={() => {
                valuesFieldArray.fields.length < 4 &&
                  valuesFieldArray.append({ platform: "", link: "" });
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
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

export default OrganizationSocialMediaLinksForm;
