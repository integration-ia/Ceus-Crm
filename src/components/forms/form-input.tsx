import React, { type HtmlHTMLAttributes } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  required?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
  className?: HtmlHTMLAttributes<HTMLInputElement>["className"];
}

const FormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, "render" | "rules"> &
  FormInputProps) => {
  return (
    <FormField
      control={props.control}
      name={props.name}
      shouldUnregister={props.shouldUnregister}
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
          <FormControl>
            <Input
              autoComplete="off"
              iconLeft={props.iconLeft}
              iconRight={props.iconRight}
              placeholder={props.placeholder}
              type={props.type}
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

export default FormInput;
