import React, { type HtmlHTMLAttributes } from "react";
import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "~/lib/utils";

interface FormSelectProps extends React.PropsWithChildren {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: HtmlHTMLAttributes<HTMLDivElement>["className"];
  fullWidth?: boolean;
}

const FormSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<
  ControllerProps<TFieldValues, TName>,
  "render" | "rules" | "shouldUnregister"
> &
  FormSelectProps) => {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className={cn(props.fullWidth ? "flex-1" : "")}>
          {props.label ? (
            <FormLabel>
              {props.label}{" "}
              {props.required ? (
                <p className="inline text-xs text-stone-600 dark:text-stone-500">
                  (Requerido)
                </p>
              ) : null}
            </FormLabel>
          ) : (
            <div className="h-6" />
          )}
          <Select
            onValueChange={props?.onChange ?? field.onChange}
            disabled={props.disabled}
            {...field}
          >
            <FormControl>
              <SelectTrigger className={props.className}>
                <SelectValue placeholder={props.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>{props.children}</SelectContent>
          </Select>
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

export default FormSelect;
