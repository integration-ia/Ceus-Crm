import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import Avatar from "boring-avatars";
import { CircleCheck, Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import StandardDialog, {
  StandardDialogContent,
} from "~/components/dialog/standard-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import SubscriptionBadge from "~/components/ui/subscription-badge";
import UpdateProfileForm from "~/forms/update-profile-form";
import { type UploadedImageResponseBody } from "~/lib/types";
import {
  formatPhoneNumberWorkaround,
  getCloudflareImage,
  getCountryByCode,
} from "~/lib/utils";
import { api } from "~/utils/api";
import imageCompression from "browser-image-compression";

const MyAccountInfo = () => {
  const router = useRouter();

  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);
  const [profilePhotoChangeProcessing, setProfilePhotoChangeProcessing] =
    useState(false);
  const [profilePhotoConfirmationIsOpen, setProfilePhotoConfirmationIsOpen] =
    useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in").catch(console.error);
    },
  });

  const user = session.data?.user;

  const generateSignedUrlsMutation =
    api.media.generateSignedUrlsForPhotos.useMutation();
  const updateProfilePhotoMutation =
    api.profiles.updateProfilePhoto.useMutation();

  const handleProfilePhotoChange = useCallback(async () => {
    if (!profilePhoto) {
      return;
    }

    try {
      setProfilePhotoChangeProcessing(true);

      const [url] = await generateSignedUrlsMutation.mutateAsync({
        filesCount: 1,
      });

      if (!url) {
        return;
      }

      const cloudflareFormData = new FormData();

      const compressedSourceFile = await imageCompression(profilePhoto, {
        maxSizeMB: 10,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      cloudflareFormData.append("file", compressedSourceFile);

      const response = await fetch(url, {
        method: "POST",
        body: cloudflareFormData,
      });

      const responseContent =
        (await response.json()) as UploadedImageResponseBody;

      await updateProfilePhotoMutation.mutateAsync(responseContent.result.id);
      await session.update();

      setProfilePhotoChangeProcessing(false);
      setProfilePhotoConfirmationIsOpen(false);
    } catch (error) {
      console.error((error as Error).message);
      setProfilePhotoChangeProcessing(false);
    }
  }, [
    generateSignedUrlsMutation,
    profilePhoto,
    session,
    updateProfilePhotoMutation,
  ]);

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Información básica
          <StandardDialog
            isOpen={editDialogIsOpen}
            onOpenChange={setEditDialogIsOpen}
            title="Editar perfil"
            updateProcessTitle="Actualizando perfil"
            updateConfirmationTitle="Perfl actualizado"
            updateConfirmationDescription="Tu perfil ha sido actualizado exitosamente"
            description="Puedes tu perfil aquí."
            triggerComponent={
              <Button
                size="icon"
                variant="outline"
                className="ml-4 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
            }
          >
            <StandardDialogContent>
              <ScrollArea className="h-full">
                <UpdateProfileForm
                  onProfileUpdated={() => {
                    setEditDialogIsOpen(false);
                    toast("Perfil actualizado", {
                      description: "Se ha actualizado el perfil exitosamente",
                      icon: <CircleCheck />,
                    });
                  }}
                />
              </ScrollArea>
            </StandardDialogContent>
          </StandardDialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-between gap-12 md:flex-row md:gap-4">
          <div className="flex flex-shrink-0 flex-col gap-4">
            <div className="flex gap-4">
              <h3 className="text-xl">{user.name ?? "Nombre no definido"}</h3>
              <SubscriptionBadge subscription={user.subscriptionTier} />
            </div>
            <p className="text-sm">
              Correo: <strong className="font-semibold">{user.email}</strong>
            </p>
            <p className="text-sm">
              Teléfono:{" "}
              <strong className="font-semibold">
                {user.phoneNumber
                  ? formatPhoneNumberWorkaround(user.phoneNumber)
                  : "No definido"}
              </strong>
            </p>
            <p className="text-sm">
              País:{" "}
              <strong className="font-semibold">
                {user.countryCode
                  ? getCountryByCode(user.countryCode)?.name
                  : "No definido"}
              </strong>
            </p>
            <p className="text-sm">
              Usuario desde:{" "}
              <strong className="font-semibold">
                {new Date(user.createdAt).toLocaleDateString("es-MX")}
              </strong>
            </p>
          </div>
          <div className="flex w-full flex-1 flex-col items-center gap-4 md:items-end">
            <div className="flex min-w-56 max-w-80 flex-col items-center gap-4">
              {user.picture ? (
                <AspectRatio ratio={1} className="max-h-96 max-w-96">
                  <Image
                    fill
                    alt="Foto del usuario"
                    src={getCloudflareImage(user.picture, "public")}
                    className="rounded-full object-cover"
                  />
                </AspectRatio>
              ) : (
                <Avatar
                  size={240}
                  name={user.email ?? "Not defined"}
                  variant="beam"
                  colors={["#FACC15", "#FDE68A", "#FBBF24", "#CA8A04"]}
                />
              )}
              <div className="rounded-md px-4 py-2 transition-colors hover:bg-stone-800">
                <Label htmlFor="picture">
                  {" "}
                  <Edit className="mb-1 mr-2 inline h-4 w-4" />
                  Cambiar foto de perfil
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

                    setProfilePhoto(file);
                    setProfilePhotoConfirmationIsOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <Dialog
        open={profilePhotoConfirmationIsOpen}
        onOpenChange={(value) => {
          if (profilePhotoChangeProcessing) return;

          setProfilePhotoConfirmationIsOpen(value);
          setProfilePhoto(null);
        }}
      >
        {profilePhotoChangeProcessing ? (
          <DialogContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-3xl font-bold">
                Actualizando foto de perfil
              </h1>
              <p>Por favor espera un momento...</p>
              <LoadingSpinner className="mt-4 h-16 w-16" />
            </div>
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar foto de perfil</DialogTitle>
              <DialogDescription>
                Confirma que quieres usar esta foto
              </DialogDescription>
            </DialogHeader>
            {profilePhoto ? (
              <div className="flex flex-col items-center gap-8 px-12">
                <AspectRatio ratio={1} className="w-full">
                  <Image
                    fill
                    alt="Foto del usuario"
                    src={URL.createObjectURL(profilePhoto)}
                    className="rounded-full object-cover"
                  />
                </AspectRatio>
                <Button onClick={handleProfilePhotoChange}>
                  <Edit className="mr-2 h-4 w-4" /> Usar esta foto de perfil
                </Button>
              </div>
            ) : null}
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
};

export default MyAccountInfo;
