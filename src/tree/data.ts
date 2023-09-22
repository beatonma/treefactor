export type TreeNodeType = "directory" | "file";
export type TreeNode = TreeDirectory | TreeFile;

const TreeNodeComparator = (a: TreeNode, b: TreeNode) => {
  if (a.type === b.type) return a.name.localeCompare(b.name);
  if (a.type === "directory") return -1;
  return 1;
};

interface BaseTreeNode {
  type: TreeNodeType;
  name: string;
  path: string;
  fullPath: string;
  setPath: (path: string) => void;

  /**
   * Deep compare this node to the other, returns true if they represent the same structure.
   */
  equivalentTo: (other: BaseTreeNode) => boolean;

  /**
   * Create a deep copy of this node.
   */
  clone: () => TreeNode;

  /**
   * Total number of nodes that have this node as an ancestor.
   * This includes itself, so value is always >= 1.
   */
  size: () => number;

  /**
   * Find the descendant node that corresponds to the given path, if it exists.
   */
  findNode: (targetPath: string) => TreeNode | undefined;

  /**
   * Return true if this or any descendant contains the given substring in its name.
   */
  contains: (substring: string) => boolean;
}

export class TreeFile implements BaseTreeNode {
  type: TreeNodeType = "file";
  name: string;
  path!: string;
  fullPath!: string;
  extension: string;

  constructor(path: string, name: string) {
    this.name = name;
    this.extension = name.split(".").pop() ?? "";
    this.setPath(path);
  }

  setPath = (path: string) => {
    this.path = Path.dirPath(path);
    this.fullPath = Path.joinPath(path, this.name);
  };

  size = () => 1;
  clone = (): TreeFile => new TreeFile(this.path, this.name);
  contains = (substring: string): boolean => this.name.includes(substring);
  findNode = (targetPath: string): TreeNode | undefined => {
    if (this.fullPath === targetPath) return this;
  };
  equivalentTo = (other: BaseTreeNode) =>
    this.type === other.type && this.fullPath === other.fullPath;
  toString = () => this.fullPath;
}

export class TreeDirectory implements BaseTreeNode {
  type: TreeNodeType = "directory";
  name: string;
  path!: string;
  fullPath!: string;
  private _children!: TreeNode[];

  protected set children(children: TreeNode[]) {
    this._children = [...children];
    this._children.sort(TreeNodeComparator);
  }
  get children() {
    return this._children;
  }

  constructor(
    path: string,
    name: string,
    children: TreeNode[] | (() => TreeNode[]),
  ) {
    this.name = name;
    this.setPath(path);
    this.children = typeof children === "function" ? children() : children;
  }

  size: () => number = () =>
    1 +
    this.children
      .map((it) => it.size())
      .reduce((accumulator, current) => accumulator + current);

  clone = (): TreeDirectory =>
    new TreeDirectory(
      this.path,
      this.name,
      this.children.map((it) => it.clone()),
    );

  setPath = (path: string) => {
    this.path = Path.dirPath(path);
    this.fullPath = Path.dirPath(Path.joinPath(path, this.name));
  };

  addChild = (node: TreeNode) => {
    node.setPath(this.fullPath);
    this.children.push(node);
    this.children.sort(TreeNodeComparator);
  };

  removeChild = (child: TreeNode) => {
    this.children = this.children.filter(
      (it) => it.fullPath !== child.fullPath,
    );
  };

  isDescendantOf = (other: TreeDirectory): boolean => {
    return Path.isDescendant(other.fullPath, this.fullPath);
  };

  findNode = (targetPath: string): TreeNode | undefined => {
    if (this.fullPath === targetPath) return this;

    for (const it of this.children) {
      const result = it.findNode(targetPath);
      if (result) return result;
    }
  };

  contains = (substring: string): boolean =>
    this.name.includes(substring) ||
    this.children.some((it) => it.contains(substring));

  equivalentTo = (other: BaseTreeNode) => {
    if (!(other instanceof TreeDirectory)) return false;

    const dir = other as TreeDirectory;
    if (this.fullPath !== dir.fullPath) return false;

    const childCount = this.children.length;
    if (childCount !== dir.children.length) return false;

    for (let i = 0; i < childCount; i++) {
      if (!this.children[i].equivalentTo(dir.children[i])) return false;
    }

    return true;
  };
  toString = () => this.fullPath;
  toPrettyString = (joiner: string = "\n"): string => {
    const indent = "  ";
    const childStrings = this.children.map((it) => {
      if (it instanceof TreeDirectory)
        return it.toPrettyString(joiner + indent);
      return it.name;
    });

    return [`${this.name} (${this.children.length})`, ...childStrings].join(
      joiner + indent,
    );
  };
}

export class Tree extends TreeDirectory {
  constructor(root: string, children?: TreeNode[]) {
    super(root, root, children ?? []);
    this.name = root;
    this.path = Path.dirPath(root);
    this.fullPath = Path.dirPath(root);
  }

  clone = (): Tree =>
    new Tree(
      this.name,
      this.children.map((it) => it.clone()),
    );

  /**
   * Returns the new path of the object if move is successful.
   */
  move = (fromPath: string, toPath: string): string | undefined => {
    if (fromPath === toPath) return;

    const beforeSize = this.size();

    const obj = this.findNode(fromPath);
    if (!obj) return;

    const oldParent = this.findNode(obj.path) as TreeDirectory;
    const newParent = this.findNode(toPath) as TreeDirectory;

    if (!newParent) return;
    if (!oldParent) return;
    if (newParent.fullPath === oldParent.fullPath) return;
    if (obj instanceof TreeDirectory && newParent.isDescendantOf(obj)) return;

    const movedObj = obj.clone();
    oldParent.removeChild(obj);
    newParent.addChild(movedObj);

    const afterSize = this.size();
    console.assert(
      beforeSize === afterSize,
      [beforeSize, afterSize],
      "Tree unexpectedly changed size after move()!",
    );
    return movedObj.fullPath;
  };
}

export namespace Path {
  export const isDescendant = (
    parentPath: string,
    nodePath: string,
  ): boolean => {
    return nodePath.startsWith(parentPath) && nodePath !== parentPath;
  };

  export const dirPath = (path: string) =>
    path.endsWith("/") ? path : `${path}/`;
  export const joinPath = (root: string, node: string) =>
    `${dirPath(root)}${node}`;
}
