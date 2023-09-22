import {
  Path,
  Tree,
  TreeDirectory,
  TreeFile,
  TreeNode,
  TreeNodeType,
} from "./data";

interface TreeJson {
  type: TreeNodeType;
  name: string;
  contents?: TreeJson[];
}
/**
 *
 * @param tree Tree JSON data as printed from the `tree -J` shell utility.
 */
export const parseTree = (json: string): Tree => {
  const parseBranch = (path: string, branch: TreeJson): TreeNode => {
    switch (branch.type) {
      case "directory":
        return new TreeDirectory(path, branch.name, () =>
          branch.contents!.map((it) =>
            parseBranch(Path.joinPath(path, branch.name), it),
          ),
        );
      case "file":
        return new TreeFile(path, branch.name);
    }
  };

  const root: TreeJson = JSON.parse(json)[0];
  const children = root.contents!.map((it) => parseBranch(root.name, it));
  return new Tree(root.name, children);
};
