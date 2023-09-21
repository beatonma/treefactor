import { Tree, TreeDirectory, TreeFile, TreeNode, TreeNodeType } from "./data";

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
  const treeData: TreeJson[] = JSON.parse(json);

  const parseBranch = (parent: TreeDirectory, branch: TreeJson): TreeNode => {
    switch (branch.type) {
      case "directory":
        // eslint-disable-next-line no-case-declarations
        const dir = new TreeDirectory(parent.path, branch.name, []);
        dir.children = (branch.contents ?? []).flatMap((it) =>
          parseBranch(dir, it),
        );
        return dir;

      case "file":
        return new TreeFile(parent.fullPath, branch.name);
    }
  };

  const root = treeData[0];
  const tree = new Tree(root.name);
  tree.children = root.contents?.map((it) => parseBranch(tree, it)) ?? [];

  return tree;
};
