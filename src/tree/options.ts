export interface Option<T> {
  value: T;
  name: string;
  description?: string;
}

export interface Options {
  showFiles: Option<boolean>;
  showDirectorySummary: Option<boolean>;
}

export const DefaultOptions: Options = {
  showFiles: { value: false, name: "Show files" },
  showDirectorySummary: {
    value: false,
    name: "Show directory summary",
    description:
      "Show a list of filetypes that can be found in each directory (or its descendants).",
  },
};
