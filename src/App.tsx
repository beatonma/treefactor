import { useRef, useState } from "react";
import { OptionsContext, parseTree, Tree, TreeUI, useOptions } from "./tree";
import "./App.css";
import { BigSampleJson, SampleJson } from "./SampleData.ts";
import { OptionsUI } from "./OptionsUI.tsx";

const App = () => {
  const [treeText, setTreeText] = useState(BigSampleJson);
  const [initialTree, setInitialTree] = useState<Tree>(parseTree(treeText));
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (initialTree) {
    return (
      <>
        <Editor initialTree={initialTree} />
      </>
    );
  }

  return (
    <>
      <textarea
        ref={textAreaRef}
        value={treeText}
        onChange={(e) => setTreeText(e.target.value)}
      />
      <button
        onClick={() =>
          setInitialTree(parseTree(textAreaRef?.current?.value ?? ""))
        }
      >
        Refactor
      </button>
    </>
  );
};

const Editor = (props: { initialTree: Tree }) => {
  const { initialTree } = props;
  const [editableTree, setEditableTree] = useState<Tree>(initialTree);
  const [options, setOptions] = useOptions();

  return (
    <OptionsContext.Provider value={options}>
      <OptionsUI options={options} setOptions={setOptions} />
      <div className="editor">
        <div>
          <h2>Original</h2>
          <TreeUI tree={initialTree} />
        </div>
        <div>
          <h2>Edited</h2>
          <TreeUI tree={editableTree} onEdit={setEditableTree} />
        </div>
      </div>
    </OptionsContext.Provider>
  );
};

export default App;
