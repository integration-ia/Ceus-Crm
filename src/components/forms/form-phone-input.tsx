import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { PhoneInput } from "../ui/phone-input";

interface FormPhoneInputProps {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
}

const FormPhoneInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<
  ControllerProps<TFieldValues, TName>,
  "render" | "rules" | "shouldUnregister"
> &
  FormPhoneInputProps) => {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>
            {props.label}{" "}
            {props.required ? (
              <p className="inline text-xs text-stone-600 dark:text-stone-500">
                (Requerido)
              </p>
            ) : null}
          </FormLabel>
          <FormControl className="w-full">
            <PhoneInput
              placeholder={props.placeholder}
              required={props.required}
              disabled={props.disabled}
              {...field}
            />
          </FormControl>
          {props.error ? (
            <FormDescription className={"text-xs text-red-400"}>
              {props.error}
            </FormDescription>
          ) : null}
          {props.description ? (
            <FormDescription className={"text-xs"}>
              {props.description}
            </FormDescription>
          ) : null}
        </FormItem>
      )}
    />
  );
};

export default FormPhoneInput;
