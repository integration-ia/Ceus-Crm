import {
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { useState } from "react";

interface FormComboboxProps {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  label: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  items: { value: string; label: string }[];
}

const FormCombobox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, "render" | "rules"> &
  FormComboboxProps & {
    setValue: (name: FieldPath<TFieldValues>, value: string) => void;
  }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex-1 space-y-2">
          {props.label ? (
            <FormLabel className="mb-[2px] mt-[6px] block">
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
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                  disabled={props.disabled}
                  onClick={() => setIsOpen(true)}
                >
                  {field.value
                    ? props.items.find((item) => item.value === field.value)
                        ?.label
                    : props.placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command className="max-h-[300px]">
                <CommandList>
                  <ScrollArea className="h-[250px]">
                    <CommandInput placeholder="Buscar..." />
                    <CommandEmpty>Sin resultados.</CommandEmpty>
                    <CommandGroup>
                      {props.items.map((item) => (
                        <CommandItem
                          value={item.label}
                          className="gap-2"
                          key={item.value}
                          disabled={props.disabled}
                          onSelect={() => {
                            props.setValue(props.name, item.value);
                            setIsOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              item.value === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {item.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
};

export default FormCombobox;
