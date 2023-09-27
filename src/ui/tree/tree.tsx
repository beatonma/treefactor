import React, { createContext, HTMLProps, useContext } from "react";
import { OnTreeChange } from "./types";
import { dropTargetProps, draggableSourceProps } from "./drag-drop";
import { Tree, TreeDirectory, TreeFile, TreeNode } from "src/tree";
import { OptionsContext } from "src/ui/options";

const OnTreeChangeContext = createContext<OnTreeChange | undefined>(undefined);

interface NodeProps {
  isEditable: boolean;
}

export const TreeUI = (props: { tree: Tree; onEdit?: OnTreeChange }) => {
  const { tree, onEdit } = props;
  const droppableProps = dropTargetProps(tree.fullPath, onEdit);
  const editable = onEdit !== undefined;

  return (
    <OnTreeChangeContext.Provider value={onEdit}>
      <div className="tree" data-editable={editable} {...droppableProps}>
        <DirectoryName directory={tree} />
        <Contents children={tree.children} isEditable={editable} />
      </div>
    </OnTreeChangeContext.Provider>
  );
};

interface DirectoryProps {
  directory: TreeDirectory;
}
const DirectoryUI = (props: DirectoryProps & NodeProps) => {
  const onTreeChange = useContext(OnTreeChangeContext);
  const { directory, isEditable } = props;
  const draggableProps = draggableSourceProps(isEditable, directory);
  const droppableProps = dropTargetProps(directory.fullPath, onTreeChange);

  const options = useContext(OptionsContext);

  return (
    <div
      className={directory.type}
      data-type={directory.type}
      data-is-summary={!options.showFiles}
      title={directory.fullPath}
      {...draggableProps}
      {...droppableProps}
    >
      <DirectoryName directory={directory} />
      <Contents children={directory.children} isEditable={isEditable} />
    </div>
  );
};

const DirectoryName = (props: DirectoryProps) => {
  const { directory } = props;
  const options = useContext(OptionsContext);

  return (
    <Row>
      <Name name={directory.name} />
      <Label
        contents={
          options.showDirectorySummary ? [...directory.contentDescription] : []
        }
        title="Contained file types"
      />
    </Row>
  );
};

const FileUI = (props: { file: TreeFile } & NodeProps) => {
  const { file, isEditable } = props;
  const draggableProps = draggableSourceProps(isEditable, file);

  return (
    <div
      className={file.type}
      data-type={file.type}
      title={file.fullPath}
      {...draggableProps}
    >
      <Name name={file.name} />
    </div>
  );
};

const Name = (props: { name: string }) => {
  const { name } = props;
  return <div className="name">{name}</div>;
};

const Label = (props: { contents: string[] } & HTMLProps<HTMLDivElement>) => {
  const { contents, ...rest } = props;

  return (
    <div className="labels" {...rest}>
      {contents.join(", ")}
    </div>
  );
};

const Contents = (props: { children: TreeNode[] } & NodeProps) => {
  const options = useContext(OptionsContext);
  const { children, isEditable } = props;

  const renderableContents = options.showFiles
    ? children
    : children.filter(it => it.type === "directory");

  if (renderableContents.length === 0) return null;

  return (
    <div className="children">
      {renderableContents.map(child => {
        if (child instanceof TreeDirectory)
          return (
            <DirectoryUI
              key={child.fullPath}
              directory={child}
              isEditable={isEditable}
            />
          );

        return (
          <FileUI key={child.fullPath} file={child} isEditable={isEditable} />
        );
      })}
    </div>
  );
};

const Row = (props: HTMLProps<HTMLDivElement>) => {
  const { className, ...rest } = props;
  const _className = ["row", className].filter(Boolean).join(" ");

  return <div className={_className} {...rest} />;
};
