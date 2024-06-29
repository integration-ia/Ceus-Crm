import { useSession } from "next-auth/react";
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import FormCheckbox from "~/components/forms/form-checkbox";
import FormInput from "~/components/forms/form-input";
import FormPhoneInput from "~/components/forms/form-phone-input";
import FormSelect from "~/components/forms/form-select";
import { SelectItem } from "~/components/ui/select";
import { type propertyFormSchema } from "./schema";
import { api } from "~/utils/api";
import { type z } from "zod";

const OwnerSection = () => {
  const form = useFormContext<z.infer<typeof propertyFormSchema>>();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/sign-in";
    },
  });

  const isAdmin = session.data?.user.isAdmin;
  const hasFullClientAccess = session.data?.user.fullClientAccess;

  const { data: owners } = api.clients.listOwners.useQuery();

  const listOfOwners = useMemo(() => {
    const list = [];

    list.push({
      id: "new",
      name: "Crear nuevo propietario",
    });

    if (owners && owners.length > 0) {
      owners.forEach((owner) => {
        list.push({
          id: owner.id,
          name: `${owner.firstName} ${owner.lastName}`,
        });
      });
    }

    return list;
  }, [owners]);

  return (
    <>
      {listOfOwners && listOfOwners.length > 0 ? (
        <div className="flex gap-4">
          <FormSelect
            control={form.control}
            name="ownerId"
            label="Propietario"
            placeholder="Crear nuevo propietario"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.ownerId?.message}
            required
            onChange={(value) => {
              if (value !== "new") {
                const ownerData = owners?.find((owner) => owner.id === value);

                if (ownerData) {
                  form.setValue("ownerFirstName", ownerData.firstName);
                  form.setValue("ownerLastName", ownerData.lastName);
                  form.setValue("ownerEmail", ownerData.emails.at(0)?.email);
                  form.setValue("ownerEmailId", ownerData.emails.at(0)?.id);
                  form.setValue(
                    "ownerPhoneId",
                    ownerData.phoneNumbers
                      .filter((p) => p.type === "MOBILE")
                      .at(0)?.id,
                  );
                  form.setValue(
                    "ownerPhone",
                    ownerData.phoneNumbers
                      .filter((p) => p.type === "MOBILE")
                      .at(0)?.phoneNumber,
                  );
                  form.setValue(
                    "ownerPhoneHomeId",
                    ownerData.phoneNumbers
                      .filter((p) => p.type === "HOME")
                      .at(0)?.id,
                  );
                  form.setValue(
                    "ownerPhoneHome",
                    ownerData.phoneNumbers
                      .filter((p) => p.type === "HOME")
                      .at(0)?.phoneNumber,
                  );

                  form.setValue(
                    "receivesEmail",
                    ownerData.emails.at(0)?.receivesEmail ?? false,
                  );
                }
              } else {
                form.setValue("ownerFirstName", "");
                form.setValue("ownerLastName", "");
                form.setValue("ownerEmail", "");
                form.setValue("ownerPhone", "");
                form.setValue("ownerPhoneHome", "");
                form.setValue("receivesEmail", false);
                form.setValue("ownerId", "");
                return;
              }

              form.setValue("ownerId", value);
            }}
          >
            {listOfOwners.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </FormSelect>
        </div>
      ) : null}
      <div className="flex gap-4">
        <FormInput
          control={form.control}
          name="ownerFirstName"
          label="Nombre"
          error={form.formState.errors.ownerFirstName?.message}
          disabled={form.formState.isSubmitting || !!form.watch("ownerId")}
          required
        />
        <FormInput
          control={form.control}
          name="ownerLastName"
          label="Apellido"
          error={form.formState.errors.ownerLastName?.message}
          disabled={form.formState.isSubmitting || !!form.watch("ownerId")}
          required
        />
      </div>
      {form.getValues("ownerId") &&
      (!isAdmin || !hasFullClientAccess) ? null : (
        <div className="flex gap-4">
          <FormInput
            control={form.control}
            name="ownerEmail"
            type="email"
            label="Email"
            disabled={form.formState.isSubmitting || !!form.watch("ownerId")}
            error={form.formState.errors.ownerEmail?.message}
            shouldUnregister={false}
          />

          <div className="pt-11">
            <FormCheckbox
              control={form.control}
              disabled={
                form.formState.isSubmitting ||
                !form.watch("ownerEmail") ||
                !!form.watch("ownerId")
              }
              name="receivesEmail"
              label="Recibe correo"
              className="rounded-[4px]"
              error={form.formState.errors.receivesEmail?.message}
            />
          </div>
        </div>
      )}
      {form.getValues("ownerId") &&
      (!isAdmin || !hasFullClientAccess) ? null : (
        <div className="flex gap-4">
          <FormPhoneInput
            control={form.control}
            name="ownerPhone"
            label="Teléfono móvil"
            placeholder="Ingresa el número de teléfono"
            disabled={form.formState.isSubmitting || !!form.watch("ownerId")}
            error={form.formState.errors.ownerPhone?.message}
          />
          <FormPhoneInput
            control={form.control}
            name="ownerPhoneHome"
            label="Teléfono fijo"
            placeholder="Ingresa el número de teléfono"
            disabled={form.formState.isSubmitting || !!form.watch("ownerId")}
            error={form.formState.errors.ownerPhoneHome?.message}
          />
        </div>
      )}
    </>
  );
};

export default OwnerSection;
