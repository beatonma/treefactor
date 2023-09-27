import React, { useId } from "react";
import { Options } from "src/tree";
import { StateUpdate } from "src/ui/types";

export const checkboxProps = (
  field: keyof Options,
  options: Options,
  setOptions: StateUpdate<Options>,
): CheckboxProps => {
  const currentValue = options[field] as boolean;
  return {
    name: fieldToName(field),
    isChecked: currentValue,
    onChange: () => {
      setOptions((prev) => {
        const result = { ...prev };
        result[field] = !currentValue;
        return result;
      });
    },
  };
};

interface CheckboxProps {
  name: string;
  isChecked: boolean;
  onChange: () => void;
}
export const Checkbox = (props: CheckboxProps) => {
  const { name, isChecked, onChange } = props;
  const id = useId();

  return (
    <div className="checkbox-wrapper">
      <label htmlFor={id}>{name}</label>
      <input id={id} type="checkbox" checked={isChecked} onChange={onChange} />
    </div>
  );
};

const fieldToName = (field: string): string =>
  field
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
