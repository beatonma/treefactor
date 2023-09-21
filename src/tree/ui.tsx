import { DragEvent, useContext } from "react";
import { Tree, TreeDirectory, TreeFile, TreeNode } from "./data";
import { OptionsContext } from "./options";

interface NodeProps {
  editable: boolean;
}
export const TreeUI = (props: {
  tree: Tree;
  onEdit?: (update: (prev: Tree) => Tree) => void;
}) => {
  const { tree, onEdit } = props;
  const editable = onEdit !== undefined;

  return (
    <div className="tree" data-editable={editable}>
      <Name name={tree.root.name} />
      <Contents children={tree.children} editable={editable} />
    </div>
  );
};

const DragDropKey = "node";
const startDrag = (node: TreeNode) => (ev: DragEvent) => {
  console.log(JSON.stringify(node));
  ev.dataTransfer.setData(DragDropKey, JSON.stringify(node));
};

const enableDragDrop = (ev: DragEvent) => {
  ev.preventDefault();
};

const DirectoryUI = (props: { directory: TreeDirectory } & NodeProps) => {
  const { directory, editable } = props;

  const dragDrop = (ev: DragEvent) => {
    ev.preventDefault();
    const data = ev.dataTransfer.getData(DragDropKey);
    console.log(
      `Drag dropped DirectoryUI: ${data} ${JSON.stringify(
        ev.dataTransfer.items,
      )}`,
    );
  };

  return (
    <div
      className="directory"
      draggable={editable}
      onDragStart={startDrag(directory)}
      onDragOver={enableDragDrop}
      onDrop={dragDrop}
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
  return <div className="name">{props.name}</div>;
};

const Contents = (props: { children: TreeNode[] } & NodeProps) => {
  const options = useContext(OptionsContext);
  if (!options.showFiles) return <SummarizedContents {...props} />;
  const { children, editable } = props;

  return (
    <div className="children">
      {children.map((child) => {
        if (child instanceof TreeDirectory)
          return (
            <DirectoryUI
              key={child.path}
              directory={child}
              editable={editable}
            />
          );
        return <FileUI key={child.fullPath} file={child} editable={editable} />;
      })}
    </div>
  );
};

const SummarizedContents = (props: { children: TreeNode[] } & NodeProps) => {
  const { children, editable } = props;

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

  const summarized: (string | TreeDirectory)[] = [...dirs, ...fileTypes];

  return (
    <div className="children">
      {summarized.map((child, index) => {
        if (child instanceof TreeDirectory)
          return (
            <DirectoryUI key={index} directory={child} editable={editable} />
          );
        return (
          <code className="file-summary" key={index}>
            {child}
          </code>
        );
      })}
    </div>
  );
};
