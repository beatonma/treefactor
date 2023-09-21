export type TreeNode = TreeDirectory | TreeFile;
export type TreeNodeType = "directory" | "file";

interface Search {
  findPath: (targetPath: string) => TreeNode | undefined;
  contains: (substring: string) => boolean;
}

interface TreePath {
  type: TreeNodeType;
  name: string;
  path: string;
  fullPath: string;
}

export class TreeDirectory implements Search, TreePath {
  type: TreeNodeType = "directory";
  name: string;
  path: string;
  fullPath: string;
  children: TreeNode[];

  constructor(path: string, name: string, children: TreeNode[]) {
    this.name = name;
    this.path = dirPath(path);
    this.fullPath = dirPath(joinPath(path, name));
    this.children = [...children];
  }

  findPath = (targetPath: string): TreeNode | undefined => {
    if (this.fullPath === targetPath) return this;

    for (const it of this.children) {
      const result = it.findPath(targetPath);
      if (result) return result;
    }
  };

  contains = (substring: string): boolean =>
    this.name.includes(substring) ||
    this.children.some((it) => it.contains(substring));
}

export class Tree extends TreeDirectory {
  constructor(root: string, children?: TreeNode[]) {
    super(root, root, children ?? []);
    this.name = root;
    this.path = dirPath(root);
    this.fullPath = dirPath(root);
  }
}

export class TreeFile implements Search, TreePath {
  type: TreeNodeType = "file";
  name: string;
  path: string;
  fullPath: string;
  extension: string;

  constructor(path: string, name: string) {
    this.name = name;
    this.path = dirPath(path);
    this.fullPath = joinPath(path, name);
    this.extension = name.split(".").pop() ?? "";
  }

  findPath = (targetPath: string): TreeNode | undefined => {
    if (this.fullPath === targetPath) return this;
  };
  contains = (substring: string): boolean => this.name.includes(substring);
}

const dirPath = (path: string) => (path.endsWith("/") ? path : `${path}/`);
const joinPath = (root: string, node: string) => `${root}${node}`;
