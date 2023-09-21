export type TreeNode = TreeDirectory | TreeFile;

interface Search {
  search: (query: string | RegExp) => boolean;
}

interface TreePath {
  path: string;
}

const joinPath = (root: string, node: string) => `${root}${node}`;

export class Tree implements Search {
  root: TreeRoot;
  children: TreeNode[];

  constructor(root: string, children?: TreeNode[]) {
    this.root = new TreeRoot(root);
    this.children = children ?? [];
  }

  search = (query: string | RegExp): boolean => this.root.search(query);
}

export class TreeDirectory implements Search, TreePath {
  name: string;
  children: TreeNode[];
  path: string;

  constructor(path: string, name: string, children: TreeNode[]) {
    this.name = name;
    this.children = children;
    this.path = joinPath(path, `${name}/`);
  }

  search = (query: string | RegExp): boolean =>
    this.children.some((it) => it.search(query));
}

export class TreeRoot extends TreeDirectory {
  constructor(name: string) {
    super("", name, []);
  }
}

export class TreeFile implements TreePath {
  path: string;
  name: string;
  fullPath: string;
  extension: string;

  constructor(path: string, name: string) {
    this.name = name;
    this.path = path;
    this.fullPath = joinPath(path, name);
    this.extension = name.split(".").pop() ?? "";
  }

  search = (query: string | RegExp): boolean => this.name.search(query) >= 0;
}

interface TreeJson {
  type: "directory" | "file";
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
        dir.children = (branch.contents ?? []).flatMap((it) => {
          return parseBranch(dir, it);
        });
        return dir;
      case "file":
        return new TreeFile(parent.path, branch.name);
    }
  };

  const root = treeData[0];
  const tree = new Tree(root.name);
  tree.children = root.contents?.map((it) => parseBranch(tree.root, it)) ?? [];

  return tree;
};
