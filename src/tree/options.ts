import { createContext, useState } from "react";

export interface Options {
  showFiles: boolean;
  showDirectorySummary: boolean;
}

export const DefaultOptions: Options = {
  showFiles: false,
  showDirectorySummary: false,
};

export const OptionsContext = createContext(DefaultOptions);
export const useOptions = () => useState<Options>(DefaultOptions);
