import { DragEvent } from "react";
import { TreeNode, TreeNodeType } from "src/tree";
import { OnTreeChange } from "./types";

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
    document.body.querySelectorAll(`[${DataAttrIsDropTarget}]`).forEach(el => {
      el.removeAttribute(DataAttrIsDropTarget);
    });
    document.body
      .querySelectorAll(`[${DataAttrDragDropPreview}]`)
      .forEach(el => document.body.removeChild(el));
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

      onTreeChange(prev => {
        const tree = prev.clone();
        tree.move(data.fullPath, targetPath);
        return tree;
      });
    },
  };
};
