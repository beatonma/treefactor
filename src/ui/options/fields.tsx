import React, { useId } from "react";
import { Options } from "src/tree";
import { StateUpdate } from "src/ui/types";
import { Option } from "src/tree/options";

export const checkboxProps = (
  field: keyof Options,
  option: Option<boolean>,
  setOptions: StateUpdate<Options>,
): CheckboxProps => {
  const currentValue = option.value;
  return {
    name: option.name,
    isChecked: currentValue,
    title: option.description,
    onChange: () => {
      setOptions(prev => {
        const result = { ...prev };
        result[field].value = !currentValue;
        return result;
      });
    },
  };
};

interface CheckboxProps {
  name: string;
  isChecked: boolean;
  title: string | undefined;
  onChange: () => void;
}
export const Checkbox = (props: CheckboxProps) => {
  const { name, isChecked, onChange, title } = props;
  const id = useId();

  return (
    <div className="checkbox-wrapper" title={title}>
      <label htmlFor={id}>{name}</label>
      <input id={id} type="checkbox" checked={isChecked} onChange={onChange} />
    </div>
  );
};
