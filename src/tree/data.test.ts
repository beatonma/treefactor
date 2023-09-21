import { describe, expect, test } from "bun:test";
import { TreeDirectory, TreeFile } from "./data";
import { parseTree } from "./parse";

const Data: string = `[
  {"type":"directory","name":"beatonma-gulp/src/raw assets","contents":[
    {"type":"directory","name":"apps","contents":[
      {"type":"file","name":"form.svg"},
      {"type":"file","name":"io16.svg"},
      {"type":"file","name":"microformats-reader.svg"}
  ]},
    {"type":"directory","name":"app-type","contents":[
      {"type":"file","name":"android.svg"},
      {"type":"file","name":"arduino.svg"},
      {"type":"file","name":"chrome.svg"},
      {"type":"file","name":"django.svg"},
      {"type":"file","name":"node-js.svg"},
      {"type":"file","name":"webapp.png"},
      {"type":"file","name":"python.svg"},
      {"type":"file","name":"webapp.svg"}
  ]},
    {"type":"file","name":"mb.svg"}
  ]}
,
  {"type":"report","directories":2,"files":11}
]
`;

describe("Tree data", () => {
  test("parseTree", () => {
    const tree = parseTree(Data);
    expect(tree.name).toBe("beatonma-gulp/src/raw assets");
    expect(tree.children.length).toBe(3);

    const appTypeDir = tree.children[1] as TreeDirectory;
    expect(appTypeDir.name).toBe("app-type");
    expect(appTypeDir.fullPath).toBe("beatonma-gulp/src/raw assets/app-type/");
    expect(appTypeDir.children.length).toBe(8);

    const file = appTypeDir.children[0] as TreeFile;
    expect(file.fullPath).toBe(
      "beatonma-gulp/src/raw assets/app-type/android.svg",
    );
    expect(file.extension).toBe("svg");
  });

  test("TreeNode.find", () => {
    const tree = parseTree(Data);
    expect(tree.findPath("beatonma-")).toBeUndefined();
    expect(tree.findPath("beatonma-gulp/src/raw assets/app-type/")?.name).toBe(
      "app-type",
    );
    expect(
      tree.findPath("beatonma-gulp/src/raw assets/app-type/android.svg")?.name,
    ).toBe("android.svg");
  });

  test("TreeNode.contains", () => {
    const tree = parseTree(Data);
    expect(tree.contains("beatonma-")).toBeTrue();
    expect(tree.contains("app-type")).toBeTrue();
    expect(tree.contains("webapp.svg")).toBeTrue();

    expect(tree.contains("webapps.svg")).toBeFalse();
  });
});
