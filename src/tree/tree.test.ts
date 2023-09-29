import { describe, expect, test } from "bun:test";
import { Tree, TreeDirectory, TreeFile } from "./tree";

const Data = `[
  {"type":"directory","name":"root","contents":[
    {"type":"directory","name":"a","contents":[
      {"type":"directory","name":"1","contents":[
        {"type":"file","name":"image.jpg"},
        {"type":"file","name":"image.png"}
    ]},
      {"type":"directory","name":"2"},
      {"type":"directory","name":"duplicate-dir","contents":[
        {"type":"file","name":"nested-duplicate"},
        {"type":"file","name":"file.txt"}
    ]},
      {"type":"file","name":"duplicate.txt"},
      {"type":"file","name":"icon.svg"}
  ]},
    {"type":"directory","name":"b","contents":[
      {"type":"directory","name":"1","contents":[
        {"type":"file","name":"file.txt"}
    ]},
      {"type":"directory","name":"duplicate-dir","contents":[
        {"type":"file","name":"nested-duplicate"}
    ]},
      {"type":"file","name":"duplicate.txt"},
      {"type":"file","name":"file.md"}
  ]},
    {"type":"file","name":"file.dat"}
  ]},
  {"type":"report","directories":7,"files":11}
]`;
const DataSize = 19;

const testTree = () => Tree.parse(Data);

const testParsedTree = (tree: Tree) => {
  expect(tree.name).toBe("root");
  expect(tree.children.length).toBe(3);

  const dir = tree.children.find(it => it.name === "a") as TreeDirectory;
  expect(dir.name).toBe("a");
  expect(dir.fullPath).toBe("root/a/");
  expect(dir.children.length).toBe(5);

  const file = dir.children.find(it => it.name === "icon.svg") as TreeFile;
  expect(file.fullPath).toBe("root/a/icon.svg");
  expect(file.extension).toBe("svg");
};

describe("Tree data", () => {
  test("Tree parsing and serialization is lossless", () => {
    const original = testTree();

    const repr = testTree().stringify();
    console.log(repr);
    const serialized = Tree.parse(repr);

    expect(serialized).not.toEqual(original);
    expect(serialized.equivalentTo(original)).toBeTrue();
  });

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
    expect(tree.findNode("c")).toBeUndefined();
    expect(tree.findNode("root/a/1/")!.name).toBe("1");
    expect(tree.findNode("root/a/1/image.png")!.name).toBe("image.png");
  });

  test("TreeNode.contains", () => {
    const tree = testTree();
    expect(tree.contains("2")).toBeTrue();
    expect(tree.contains("missing")).toBeFalse();
    expect(tree.contains("image.jpg")).toBeTrue();
    expect(tree.contains("image.bmp")).toBeFalse();
  });

  test("TreeDirectory.size", () => {
    expect(testTree().size()).toBe(DataSize);
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
      expectMoveSuccess(testTree(), "root/a/1/image.jpg", "root/a/");
    });

    test("Move directory to parent directory succeeds", () => {
      expectMoveSuccess(testTree(), "root/a/2/", "root/");
    });

    test("Move to sibling directory succeeds", () => {
      expectMoveSuccess(testTree(), "root/a/2/", "root/b/");
    });

    test("Move directory to descendant directory fails", () => {
      expectMoveFail(testTree(), "root/a/", "root/a/2/");
    });

    test("Moving a directory updates paths of its children", () => {
      const tree = testTree();

      tree.move("root/a/1/", "root/a/2/");
      expect(tree.findNode("root/a/1/")).toBeUndefined();
      expect(tree.findNode("root/a/1/image.jpg")).toBeUndefined();
      expect(tree.findNode("root/a/1/image.png")).toBeUndefined();

      expect(tree.findNode("root/a/2/1/")).toBeDefined();
      expect(tree.findNode("root/a/2/1/image.jpg")).toBeDefined();
      expect(tree.findNode("root/a/2/1/image.png")).toBeDefined();
    });

    test("Moving a duplicate file fails", () => {
      const tree = testTree();

      expectMoveFail(tree, "root/a/duplicate.txt", "root/b/");
    });

    test("Moving a duplicate directory fails", () => {
      const tree = testTree();

      expectMoveFail(tree, "root/a/2/duplicate-dir/", "root/b/");
    });
  });
});
