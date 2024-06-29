import React from "react";
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
import { NumericFormat } from "react-number-format";

interface FormCurrencyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  required?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
}

const FormCurrencyInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, "render" | "rules"> &
  FormCurrencyInputProps) => {
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
            <NumericFormat
              autoComplete="off"
              disabled={props.disabled}
              iconLeft={props.iconLeft}
              iconRight={props.iconRight}
              placeholder={props.placeholder}
              allowNegative={false}
              allowLeadingZeros={false}
              allowedDecimalSeparators={["."]}
              decimalScale={2}
              fixedDecimalScale={true}
              thousandSeparator={true}
              customInput={Input}
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

export default FormCurrencyInput;
