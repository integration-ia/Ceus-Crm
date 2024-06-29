import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";
import FormDropzone from "~/components/forms/form-dropzone";
import FormInput from "~/components/forms/form-input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { type RouterOutputs } from "~/utils/api";
import { type propertyFormSchema } from "./schema";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { bytesToMegabytes, truncateFileName } from "~/lib/utils";
import FormCheckbox from "~/components/forms/form-checkbox";
import Image from "next/image";

interface MediaSectionProps {
  propertyToEdit?: RouterOutputs["dashboard"]["getLatestData"]["properties"][number];
}

const MediaSection = ({ propertyToEdit }: MediaSectionProps) => {
  const form = useFormContext<z.infer<typeof propertyFormSchema>>();

  const {
    append: appendPhoto,
    remove: removePhoto,
    fields: photos,
  } = useFieldArray({
    control: form.control,
    name: "media",
  });

  const {
    append: appendVideoLink,
    fields: videoLinks,
    remove: removeVideoLink,
  } = useFieldArray({
    control: form.control,
    name: "videoLinks",
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FormDropzone append={appendPhoto} fields={photos} />

          <p className="text-xs text-muted-foreground">
            Tipos de imagen soportados: .jpg, .jpeg, .png, webp
          </p>
        </div>

        <div className="mt-4 flex max-h-[550px] flex-col gap-4">
          <ScrollArea className={photos.length > 0 ? "h-[550px]" : ""}>
            {photos.map((photo, index) => (
              <Card key={photo.tempId} className="my-3">
                <CardContent className="px-4 py-3">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <AspectRatio ratio={16 / 9}>
                        <Image
                          src={
                            typeof photo.sourceFile === "string"
                              ? photo.sourceFile
                              : URL.createObjectURL(photo.sourceFile)
                          }
                          alt={photo.filename}
                          className="rounded-md object-cover"
                          fill
                        />
                      </AspectRatio>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 md:items-end">
                      <div className="flex flex-col gap-1 md:items-end">
                        <p className="text-lg font-semibold">
                          {truncateFileName(photo.filename, 20)}
                        </p>
                        {photo.size ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {bytesToMegabytes(photo.size)} MB
                          </p>
                        ) : null}
                      </div>

                      <FormCheckbox
                        disabled={
                          form.formState.isSubmitting ||
                          form
                            .watch("media")
                            .some(
                              (p) =>
                                p.isCoverPhoto && p.filename !== photo.filename,
                            )
                        }
                        control={form.control}
                        name={`media.${index}.isCoverPhoto`}
                        label="Usar como portada"
                        className="rounded-[4px]"
                      />
                      <Button
                        type="button"
                        disabled={form.formState.isSubmitting}
                        variant="destructive"
                        onClick={() => removePhoto(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover foto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {videoLinks.map((videoLink, index) => (
          <div className="flex items-end gap-2" key={videoLink.id}>
            <FormInput
              control={form.control}
              name={`videoLinks.${index}.url`}
              label="Link de YouTube"
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.videoLinks?.[index]?.url?.message}
            />
            <Button
              size="icon"
              variant="outline"
              type="button"
              disabled={form.formState.isSubmitting}
              className=" dark:bg-stone-900 dark:hover:bg-stone-800"
              onClick={() => removeVideoLink(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <CardTitle>Videos</CardTitle>
      <Button
        type="button"
        disabled={form.formState.isSubmitting}
        onClick={() => appendVideoLink({ url: "", platform: "YOUTUBE" })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Agregar enlace de video
      </Button>
      <p className="mt-12 text-sm">
        {propertyToEdit
          ? "Clic para actualizar el inmueble"
          : "Clic para guardar el inmueble"}
      </p>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {propertyToEdit ? (
            <Edit className="mr-2 h-4 w-4" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          Guardar
        </Button>
      </div>
    </>
  );
};

export default MediaSection;
