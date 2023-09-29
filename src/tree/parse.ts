import { Tree, TreeDirectory, TreeFile, TreeNode, TreeNodeType } from "./tree";
import { joinPath } from "./path";

export const parseTree = (data: string): Tree => {
  return parseTreeJson(data) as Tree;
};

export const dumpTree = (tree: Tree): string => {
  let dirCount = 0;
  let fileCount = 0;

  const dumpBranch = (branch: TreeNode): TreeJson => {
    const { name, type } = branch;

    if (type === "directory") dirCount++;
    if (type === "file") fileCount++;

    let children = undefined;
    if (branch instanceof TreeDirectory) {
      children = branch.children.map(dumpBranch);
    }

    return {
      name: name,
      type: type,
      contents: children,
    };
  };

  const report = () => ({
    type: "report",
    directories: Math.max(dirCount - 1, 0),
    files: fileCount,
  });

  return JSON.stringify([dumpBranch(tree), report()]);
};

interface TreeJson {
  type: TreeNodeType;
  name: string;
  contents?: TreeJson[];
}

/**
 *
 * @param json Tree JSON data as printed from the `tree -J` shell utility.
 */
const parseTreeJson = (json: string): Tree | undefined => {
  const parseBranch = (path: string, branch: TreeJson): TreeNode => {
    switch (branch.type) {
      case "directory":
        return new TreeDirectory(
          path,
          branch.name,
          () =>
            branch.contents?.map(it =>
              parseBranch(joinPath(path, branch.name), it),
            ) ?? [],
        );
      case "file":
        return new TreeFile(path, branch.name);
    }
  };

  const raw = JSON.parse(json);
  const root: TreeJson = raw[0];
  const children = root.contents!.map(it => parseBranch(root.name, it));
  return new Tree(root.name, children);
};
