import { createContext, DragEvent, useContext } from "react";
import { Tree, TreeDirectory, TreeFile, TreeNode, TreeNodeType } from "./data";
import { OptionsContext } from "./options";

type OnTreeChange = (update: (prev: Tree) => Tree) => void;
const OnTreeChangeContext = createContext<OnTreeChange | undefined>(undefined);

interface NodeProps {
  isEditable: boolean;
}
export const TreeUI = (props: {
  tree: Tree;
  onEdit?: (update: (prev: Tree) => Tree) => void;
}) => {
  const { tree, onEdit } = props;
  const droppableProps = DragDrop.dropTargetProps(tree.fullPath, onEdit);
  const editable = onEdit !== undefined;

  return (
    <OnTreeChangeContext.Provider value={onEdit}>
      <div className="tree" data-editable={editable} {...droppableProps}>
        <Name name={tree.name} />
        <Contents children={tree.children} isEditable={editable} />
      </div>
    </OnTreeChangeContext.Provider>
  );
};

const DirectoryUI = (props: { directory: TreeDirectory } & NodeProps) => {
  const onTreeChange = useContext(OnTreeChangeContext);
  const { directory, isEditable } = props;
  const draggableProps = DragDrop.draggableSourceProps(isEditable, directory);
  const droppableProps = DragDrop.dropTargetProps(
    directory.fullPath,
    onTreeChange,
  );

  return (
    <div
      className="directory"
      title={directory.path}
      {...draggableProps}
      {...droppableProps}
    >
      <Name name={directory.name} />
      <Contents children={directory.children} isEditable={isEditable} />
    </div>
  );
};

const FileUI = (props: { file: TreeFile } & NodeProps) => {
  const { file, isEditable } = props;

  const draggableProps = DragDrop.draggableSourceProps(isEditable, file);

  return (
    <div className="file" title={file.fullPath} {...draggableProps}>
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
  const { children, isEditable } = props;

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
              isEditable={isEditable}
            />
          );

        if (child instanceof TreeFile) {
          return (
            <FileUI key={child.fullPath} file={child} isEditable={isEditable} />
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

namespace DragDrop {
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
  export const draggableSourceProps = (
    isDraggable: boolean,
    payload: TreeNode,
  ) => {
    return {
      draggable: isDraggable,
      onDragStart: (ev: DragEvent) => {
        ev.stopPropagation();
        const encoded = toDragDropPayload(payload);
        ev.dataTransfer.setData(DragDropKey, JSON.stringify(encoded));
      },
    };
  };

  export const dropTargetProps = (
    targetPath: string,
    onTreeChange: OnTreeChange | undefined,
  ) => {
    if (onTreeChange === undefined) {
      return {};
    }

    return {
      onDragOver: (ev: DragEvent) => {
        ev.preventDefault();
      },

      onDrop: (ev: DragEvent) => {
        ev.preventDefault();
        const data = JSON.parse(
          ev.dataTransfer.getData(DragDropKey),
        ) as DragDropPayload;
        console.log(`onDrop ${data.type} ${data.fullPath}`);
        ev.dataTransfer.clearData();

        onTreeChange((prev) => {
          const tree = prev.clone();
          tree.move(data.fullPath, targetPath);
          return tree;
        });
      },
    };
  };
}
