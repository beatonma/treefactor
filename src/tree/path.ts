export const isDescendant = (parentPath: string, nodePath: string): boolean => {
  return nodePath.startsWith(parentPath) && nodePath !== parentPath;
};

export const dirPath = (path: string) =>
  path.endsWith("/") ? path : `${path}/`;
export const joinPath = (root: string, node: string) =>
  `${dirPath(root)}${node}`;
