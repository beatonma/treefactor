import { describe, expect, test } from "bun:test";
import { Path, Tree, TreeDirectory, TreeFile } from "./data";
import { parseTree } from "./parse";

const Data: string = `[
  {"type":"directory","name":"beatonma-gulp/src/raw assets","contents":[
    {"type":"directory","name":"apps","contents":[
      {"type":"directory","name":"android","contents":[
        {"type":"file","name":"form.svg"},
        {"type":"file","name":"io16.svg"}
      ]},
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

const testTree = () => parseTree(Data);

const testParsedTree = (tree: Tree) => {
  expect(tree.name).toBe("beatonma-gulp/src/raw assets");
  expect(tree.children.length).toBe(3);

  const appTypeDir = tree.children.find(
    (it) => it.name === "app-type",
  ) as TreeDirectory;
  expect(appTypeDir.name).toBe("app-type");
  expect(appTypeDir.fullPath).toBe("beatonma-gulp/src/raw assets/app-type/");
  expect(appTypeDir.children.length).toBe(8);

  const file = appTypeDir.children[0] as TreeFile;
  expect(file.fullPath).toBe(
    "beatonma-gulp/src/raw assets/app-type/android.svg",
  );
  expect(file.extension).toBe("svg");
};

describe("Tree data", () => {
  test("parseTree", () => {
    const tree = testTree();
    testParsedTree(tree);
  });

  test("Tree.clone", () => {
    const original = testTree();
    const cloned = original.clone();

    expect(cloned).not.toEqual(original);
    expect(cloned.equivalentTo(original)).toBeTrue();
    testParsedTree(cloned);
  });

  test("TreeNode.find", () => {
    const tree = testTree();
    expect(tree.findNode("beatonma-")).toBeUndefined();
    expect(tree.findNode("beatonma-gulp/src/raw assets/app-type/")?.name).toBe(
      "app-type",
    );
    expect(
      tree.findNode("beatonma-gulp/src/raw assets/app-type/android.svg")?.name,
    ).toBe("android.svg");
  });

  test("TreeNode.contains", () => {
    const tree = testTree();
    expect(tree.contains("beatonma-")).toBeTrue();
    expect(tree.contains("app-type")).toBeTrue();
    expect(tree.contains("webapp.svg")).toBeTrue();

    expect(tree.contains("webapps.svg")).toBeFalse();
  });

  test("TreeDirectory.size", () => {
    expect(testTree().size()).toBe(16);
  });

  describe("Tree.move", () => {
    const expectMoveSuccess = (tree: Tree, from: string, to: string) => {
      const originalState = tree.clone();
      const originalSize = tree.size();

      expect(tree.findNode(from)).toBeDefined();
      const resultPath = tree.move(from, to);

      expect(tree.size()).toBe(originalSize);
      expect(tree.findNode(from)).toBeUndefined();
      expect(tree.findNode(resultPath!)).toBeDefined();
      expect(tree.equivalentTo(originalState)).toBeFalse();
    };

    const expectMoveFail = (tree: Tree, from: string, to: string) => {
      const originalState = tree.clone();

      const resultPath = tree.move(from, to);
      expect(resultPath).toBeUndefined();
      expect(tree.equivalentTo(originalState)).toBeTrue();
    };

    test("Move file to parent directory succeeds", () => {
      expectMoveSuccess(
        testTree(),
        "beatonma-gulp/src/raw assets/app-type/android.svg",
        "beatonma-gulp/src/raw assets/",
      );
    });

    test("Move directory to parent directory succeeds", () => {
      expectMoveSuccess(
        testTree(),
        "beatonma-gulp/src/raw assets/apps/android/",
        "beatonma-gulp/src/raw assets/",
      );
    });

    test("Move to sibling directory succeeds", () => {
      expectMoveSuccess(
        testTree(),
        "beatonma-gulp/src/raw assets/apps/android/",
        "beatonma-gulp/src/raw assets/app-type/",
      );
    });

    test("Move to same directory fails", () => {
      expectMoveFail(
        testTree(),
        "beatonma-gulp/src/raw assets/app-type/",
        "beatonma-gulp/src/raw assets/",
      );
    });

    test("Move directory to descendant directory fails", () => {
      expectMoveFail(
        testTree(),
        "beatonma-gulp/src/raw assets/apps/",
        "beatonma-gulp/src/raw assets/apps/android/",
      );
    });
  });

  test("TreeNode.size()", () => {
    expect(testTree().size()).toBe(16);
  });
});

describe("Path", () => {
  test("isDescendant", () => {
    expect(Path.isDescendant("/root/", "/root/subdir/")).toBeTrue();
    expect(Path.isDescendant("/root/", "/root/subdir/file.mp3")).toBeTrue();
    expect(Path.isDescendant("/root/sub/", "/root/sub/file.mp3")).toBeTrue();
    expect(Path.isDescendant("/root/", "/root/file.mp3")).toBeTrue();

    expect(Path.isDescendant("/root/", "/root/")).toBeFalse();
    expect(Path.isDescendant("/root/subdir/file.mp3", "/root/")).toBeFalse();
    expect(Path.isDescendant("/root/subdir/file.mp3", "/root/")).toBeFalse();
  });
});
