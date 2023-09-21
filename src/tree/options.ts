import { createContext, useState } from "react";

export interface Options {
  showFiles: boolean;
}

export const DefaultOptions: Options = {
  showFiles: true,
};

export const OptionsContext = createContext(DefaultOptions);
export const useOptions = () => useState<Options>(DefaultOptions);
