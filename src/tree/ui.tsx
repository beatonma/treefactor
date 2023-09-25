import { createContext, DragEvent, useContext, useRef } from "react";
import { Tree, TreeDirectory, TreeFile, TreeNode, TreeNodeType } from "./data";
import { OptionsContext } from "./options";
import { StateUpdate } from "../types.ts";

type OnTreeChange = StateUpdate<Tree>;
const OnTreeChangeContext = createContext<OnTreeChange | undefined>(undefined);

interface NodeProps {
  isEditable: boolean;
}
export const TreeUI = (props: { tree: Tree; onEdit?: OnTreeChange }) => {
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
      className={directory.type}
      data-type={directory.type}
      title={directory.fullPath}
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
  const DataAttrIsDropTarget = "data-is-drop-target";
  const DataAttrDragDropPreview = "data-drag-drop-preview";
  const DataAttrType = "data-type";

  interface DragDropPayload {
    type: TreeNodeType;
    fullPath: string;
  }

  const toDragDropPayload = (node: TreeNode): DragDropPayload => ({
    type: node.type,
    fullPath: node.fullPath,
  });

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

        // Customise drag preview image.
        const target = ev.target as HTMLElement;
        const name = target
          .querySelector(".name")
          ?.cloneNode(true) as HTMLElement;

        if (name) {
          const preview = document.createElement("div");
          const type = document.createElement("div");
          type.innerText = target.getAttribute(DataAttrType) ?? "";
          preview.appendChild(type);
          preview.setAttribute(DataAttrDragDropPreview, "true");
          preview.setAttribute("aria-hidden", "true");
          preview.appendChild(name);
          document.body.appendChild(preview);
          ev.dataTransfer.setDragImage(preview, 0, 0);
        }
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
    const setDropTarget = (ev: DragEvent) => {
      ev.stopPropagation();
      (ev.currentTarget as HTMLElement).setAttribute(
        DataAttrIsDropTarget,
        "true",
      );
    };
    const removeDropTarget = (ev: DragEvent) => {
      ev.stopPropagation();

      const element = ev.currentTarget as HTMLElement;
      const bounds = element.getBoundingClientRect();
      if (
        ev.clientX < bounds.left ||
        ev.clientX > bounds.right ||
        ev.clientY < bounds.top ||
        ev.clientY > bounds.bottom
      ) {
        element.removeAttribute(DataAttrIsDropTarget);
      }
    };
    const cleanup = () => {
      document.body
        .querySelectorAll(`[${DataAttrIsDropTarget}]`)
        .forEach((el) => {
          el.removeAttribute(DataAttrIsDropTarget);
        });
      document.body
        .querySelectorAll(`[${DataAttrDragDropPreview}]`)
        .forEach((el) => document.body.removeChild(el));
    };

    return {
      "data-droppable": true,
      onDragEnter: setDropTarget,
      onDragLeave: removeDropTarget,
      onDragEnd: cleanup,
      onDragOver: (ev: DragEvent) => {
        ev.preventDefault();
        setDropTarget(ev);
      },
      onDrop: (ev: DragEvent) => {
        ev.preventDefault();
        cleanup();
        const raw = ev.dataTransfer.getData(DragDropKey);
        const data = JSON.parse(raw) as DragDropPayload;
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
