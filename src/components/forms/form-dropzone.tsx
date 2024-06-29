import { Dropzone as DropzoneUI } from "@dropzone-ui/react";
import { File as FileIcon, UploadCloud } from "lucide-react";
import { createId } from "@paralleldrive/cuid2";
import { ScrollArea } from "../ui/scroll-area";

interface Photo {
  tempId?: string;
  filename: string;
  size?: number | null | undefined;
  sourceFile?: File | string;
  isCoverPhoto: boolean;
}

interface FormDropzoneProps {
  disabled?: boolean;
  error?: string;
  append: (value: Photo) => void;
  fields: Photo[];
}

const FormDropzone = ({
  append,
  fields,
  disabled,
  error,
}: FormDropzoneProps) => {
  return (
    <div className="flex w-full flex-col">
      <DropzoneUI
        className="w-full"
        onChange={(files) => {
          files.forEach((file) => {
            if (!file.file) return;

            const fileToSave = {
              tempId: createId(),
              filename: file.name ?? "No name",
              size: file.size ?? 0,
              sourceFile: file.file,
              isCoverPhoto: false,
            } satisfies Photo;

            // check if file is already in the list
            const exists = fields.some(
              (f) => f.filename === fileToSave.filename,
            );

            if (exists) {
              return;
            }

            append(fileToSave);
          });
        }}
        disabled={disabled}
        accept=".png, .jpg, .jpeg, .webp"
        header={false}
        footer={false}
      >
        <div className="flex flex-col items-center py-4">
          <UploadCloud className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              Sube fotos
            </h3>
            <p className="mx-2 text-sm text-gray-500 dark:text-gray-400">
              Arrastra las fotografías del inmueble o haz clic para
              seleccionarlas
            </p>
          </div>

          <div className="mt-4 flex max-h-60 flex-col gap-1">
            <ScrollArea>
              <div className="flex items-center space-x-2">
                <FileIcon className="h-4 w-4" />
                <p className="text-base font-medium">
                  {fields.length} archivos a subir
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DropzoneUI>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
};

export default FormDropzone;
