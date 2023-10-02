import React, { createContext } from "react";
import { DefaultOptions, Options } from "src/tree";
import { StateUpdate } from "src/ui/types";
import { Checkbox, checkboxProps } from "./fields";
import { PersistenceKey, usePersistent } from "src/persistence";
import { Option } from "src/tree/options";

export const OptionsUI = (props: {
  options: Options;
  setOptions: StateUpdate<Options>;
}) => {
  const { options, setOptions } = props;

  return (
    <>
      <div className="options">
        {(Object.keys(options) as (keyof Options)[]).map(field => (
          <FormField
            key={field}
            field={field}
            option={options[field]}
            setOptions={setOptions}
          />
        ))}
      </div>
    </>
  );
};

const FormField = (props: {
  field: keyof Options;
  option: Option<unknown>;
  setOptions: StateUpdate<Options>;
}) => {
  const { field, option, setOptions } = props;

  const type = typeof option.value;
  if (type === "boolean") {
    return (
      <Checkbox
        key={field}
        {...checkboxProps(field, option as Option<boolean>, setOptions)}
      />
    );
  }
};

export const OptionsContext: React.Context<Options> =
  createContext(DefaultOptions);

export const useOptions = () =>
  usePersistent(PersistenceKey.Options, DefaultOptions, {
    /**
     * Create a copy of DefaultOptions and replace its values with those from
     * saved key:value pairs.
     */
    parse: repr => {
      const mutableDefaults = { ...DefaultOptions };
      const savedOptions = JSON.parse(repr);

      Object.entries(savedOptions).forEach(([key, value]) => {
        if (!(key in mutableDefaults)) {
          // Obsolete/renamed/removed option.
          console.debug(`Ignoring key '${key}'`);
          return;
        }
        const k = key as keyof Options;
        const option = mutableDefaults[k] as Option<typeof value>;
        option.value = value;
      });
      return mutableDefaults;
    },
    /**
     * Save options as simple key:value pairs, dropping name and description fields.
     */
    serialize: obj => {
      return JSON.stringify(
        Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [
            key,
            (value as Option<unknown>).value,
          ]),
        ),
      );
    },
  });
