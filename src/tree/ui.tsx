import { createContext, DragEvent, useContext } from "react";
import { Tree, TreeDirectory, TreeFile, TreeNode, TreeNodeType } from "./data";
import { OptionsContext } from "./options";

type OnTreeChange = (update: (prev: Tree) => Tree) => void;
const TreeChangeContext = createContext<OnTreeChange | undefined>(undefined);

interface NodeProps {
  editable: boolean;
}
export const TreeUI = (props: {
  tree: Tree;
  onEdit?: (update: (prev: Tree) => Tree) => void;
}) => {
  const { tree, onEdit } = props;
  const editable = onEdit !== undefined;

  const onDrop = (ev: DragEvent) => {
    ev.preventDefault();
    const data = JSON.parse(
      ev.dataTransfer.getData(DragDropKey),
    ) as DragDropPayload;
    ev.dataTransfer.clearData();

    onEdit?.((prev) => {
      const tree = prev.clone();
      tree.move(data.fullPath, tree.fullPath);
      return tree;
    });
  };

  return (
    <TreeChangeContext.Provider value={onEdit}>
      <div
        className="tree"
        data-editable={editable}
        onDrop={onDrop}
        onDragOver={enableDragDrop(editable)}
      >
        <Name name={tree.name} />
        <Contents children={tree.children} editable={editable} />
      </div>
    </TreeChangeContext.Provider>
  );
};

const DragDropKey = "node";
interface DragDropPayload {
  type: TreeNodeType;
  fullPath: string;
}
const toDragDropPayload = (node: TreeNode): DragDropPayload => {
  if (node instanceof TreeDirectory)
    return {
      type: "directory",
      fullPath: node.fullPath,
    };
  return {
    type: "file",
    fullPath: node.fullPath,
  };
};
const startDrag = (node: TreeNode) => (ev: DragEvent) => {
  ev.stopPropagation();
  const payload = toDragDropPayload(node);
  ev.dataTransfer.setData(DragDropKey, JSON.stringify(payload));
};

const enableDragDrop = (enabled: boolean) => {
  if (enabled)
    return (ev: DragEvent) => {
      ev.preventDefault();
    };
};

const DirectoryUI = (props: { directory: TreeDirectory } & NodeProps) => {
  const { directory, editable } = props;
  const onTreeChange = useContext(TreeChangeContext);

  const onDrop = (ev: DragEvent) => {
    ev.preventDefault();
    const data = JSON.parse(
      ev.dataTransfer.getData(DragDropKey),
    ) as DragDropPayload;
    ev.dataTransfer.clearData();

    onTreeChange?.((prev) => {
      const tree = prev.clone();
      tree.move(data.fullPath, directory.fullPath);
      return tree;
    });
  };

  return (
    <div
      className="directory"
      draggable={editable}
      onDragStart={startDrag(directory)}
      onDragOver={enableDragDrop(editable)}
      onDrop={onDrop}
      title={directory.path}
    >
      <Name name={directory.name} />
      <Contents children={directory.children} editable={editable} />
    </div>
  );
};

const FileUI = (props: { file: TreeFile } & NodeProps) => {
  const { file, editable } = props;

  return (
    <div
      className="file"
      draggable={editable}
      onDragStart={startDrag(file)}
      title={file.fullPath}
    >
      <Name name={file.name} />
    </div>
  );
};

const Name = (props: { name: string }) => {
  const { name } = props;
  return <div className="name">{name}</div>;
};

const Contents = (props: { children: TreeNode[] } & NodeProps) => {
  const options = useContext(OptionsContext);
  const { children, editable } = props;

  const renderableContents = options.showFiles
    ? children
    : summarizeContents(children);

  return (
    <div className="children">
      {renderableContents.map((child, index) => {
        if (child instanceof TreeDirectory)
          return (
            <DirectoryUI
              key={child.fullPath}
              directory={child}
              editable={editable}
            />
          );

        if (child instanceof TreeFile) {
          return (
            <FileUI key={child.fullPath} file={child} editable={editable} />
          );
        }

        return (
          <code key={index} className="file-summary">
            {child}
          </code>
        );
      })}
    </div>
  );
};

const summarizeContents = (
  children: TreeNode[],
): (TreeDirectory | string)[] => {
  const dirs: TreeDirectory[] = children.filter(
    (it) => it instanceof TreeDirectory,
  ) as TreeDirectory[];
  const fileTypes = [
    ...new Set(
      (children.filter((it) => it instanceof TreeFile) as TreeFile[]).map(
        (it) => it.extension,
      ),
    ),
  ];

  return [...dirs, ...fileTypes];
};
