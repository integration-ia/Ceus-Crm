import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type FormTextareaProps = {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
  rows?: number;
};

const FormTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<
  ControllerProps<TFieldValues, TName>,
  "render" | "rules" | "shouldUnregister"
> &
  FormTextareaProps) => {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>
            {props.label}{" "}
            {props.required ? (
              <p className="inline text-xs text-stone-600 dark:text-stone-500">
                (Requerido)
              </p>
            ) : null}
          </FormLabel>
          <FormControl>
            <Textarea
              rows={props.rows}
              disabled={props.disabled}
              placeholder={props.placeholder}
              className="resize-none"
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

export default FormTextarea;
