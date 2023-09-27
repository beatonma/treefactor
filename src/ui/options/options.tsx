import React, { createContext, useState } from "react";
import { DefaultOptions, Options } from "src/tree";
import { StateUpdate } from "src/ui/types";
import { Checkbox, checkboxProps } from "./fields";

export const OptionsUI = (props: {
  options: Options;
  setOptions: StateUpdate<Options>;
}) => {
  const { options, setOptions } = props;

  return (
    <>
      <div className="options">
        {(Object.keys(options) as (keyof Options)[]).map(field => (
          <Checkbox
            key={field}
            {...checkboxProps(field, options, setOptions)}
          />
        ))}
      </div>
    </>
  );
};

export const OptionsContext = createContext(DefaultOptions);
export const useOptions = () => useState<Options>(DefaultOptions);
