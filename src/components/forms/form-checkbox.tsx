import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

interface FormInputProps
  extends Pick<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  label: string;
}

const FormCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<
  ControllerProps<TFieldValues, TName>,
  "render" | "rules" | "shouldUnregister"
> &
  FormInputProps) => {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 px-1">
          <FormControl>
            <Checkbox
              disabled={props.disabled}
              checked={field.value}
              onCheckedChange={field.onChange}
              className={props.className}
            />
          </FormControl>
          <div className="flex">
            <FormLabel>
              {props.label}{" "}
              {props.required ? (
                <p className="inline text-xs text-stone-600 dark:text-stone-500">
                  (Requerido)
                </p>
              ) : null}
            </FormLabel>
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
          </div>
        </FormItem>
      )}
    />
  );
};

export default FormCheckbox;
