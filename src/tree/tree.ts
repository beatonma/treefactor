import * as Path from "./path";
import { dumpTree, parseTree } from "src/tree/parse";

export type TreeNodeType = "directory" | "file";
export type TreeNode = TreeDirectory | TreeFile;
type ContentDescription = Set<string>;

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
  setPath: (path: string, propagate?: boolean) => void;

  /**
   * File type(s) contained within this node (including itself).
   */
  contentDescription: ContentDescription;

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
  contentDescription!: ContentDescription;

  constructor(path: string, name: string) {
    this.name = name;
    this.extension = name.split(".").pop() ?? "";
    this.contentDescription = new Set([this.extension]);
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
  private _contentDescription!: ContentDescription;

  protected set children(children: TreeNode[]) {
    this._children = [...children];
    this.onChildrenUpdated();
  }
  get children() {
    return this._children;
  }
  private set contentDescription(description: ContentDescription) {
    this._contentDescription = description;
  }
  get contentDescription(): ContentDescription {
    return this._contentDescription;
  }
  private onChildrenUpdated() {
    this._children.sort(TreeNodeComparator);
    this._contentDescription = new Set();
    this._children.forEach(child => {
      child.contentDescription.forEach(cd => this._contentDescription.add(cd));
    });
  }

  constructor(
    path: string,
    name: string,
    children: TreeNode[] | (() => TreeNode[]),
  ) {
    this.name = name;
    this.setPath(path, false);
    this.children = typeof children === "function" ? children() : children;
  }

  size: () => number = () =>
    1 +
    this.children
      .map(it => it.size())
      .reduce((accumulator, current) => accumulator + current, 0);

  clone = (): TreeDirectory =>
    new TreeDirectory(
      this.path,
      this.name,
      this.children.map(it => it.clone()),
    );

  setPath = (path: string, propagate: boolean = true) => {
    this.path = Path.dirPath(path);
    this.fullPath = Path.dirPath(Path.joinPath(path, this.name));
    if (propagate) {
      this.children.forEach(child => child.setPath(this.fullPath, propagate));
    }
  };

  addChild = (node: TreeNode) => {
    node.setPath(this.fullPath);
    this.children.push(node);
    this.onChildrenUpdated();
  };

  removeChild = (child: TreeNode) => {
    this.children = this.children.filter(it => it.fullPath !== child.fullPath);
    this.onChildrenUpdated();
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
    this.children.some(it => it.contains(substring));

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
    const childStrings = this.children.map(it => {
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
  constructor(root: string, children: TreeNode[]) {
    super(root, root, children);
    this.name = root;
    this.path = Path.dirPath(root);
    this.fullPath = Path.dirPath(root);
  }

  clone = (): Tree =>
    new Tree(
      this.name,
      this.children.map(it => it.clone()),
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
    if (obj instanceof TreeDirectory && newParent.isDescendantOf(obj)) return;

    const movedObj = obj.clone();

    movedObj.setPath(newParent.fullPath);
    if (newParent.findNode(movedObj.fullPath)) {
      return;
    }

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

  static parse = (repr: string): Tree => parseTree(repr);

  stringify = (): string => dumpTree(this);
}
