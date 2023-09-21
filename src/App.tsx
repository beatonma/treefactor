import { useRef, useState } from "react";
import {
  Options,
  OptionsContext,
  parseTree,
  Tree,
  TreeUI,
  useOptions,
} from "./tree";
import "./App.css";

const SampleText: string = `[
  {"type":"directory","name":"beatonma-gulp/src/raw assets","contents":[
    {"type":"directory","name":"apps","contents":[
      {"type":"file","name":"form.svg"},
      {"type":"file","name":"io16.svg"},
      {"type":"file","name":"microformats-reader.svg"}
  ]},
    {"type":"directory","name":"app-type","contents":[
      {"type":"file","name":"android.svg"},
      {"type":"file","name":"arduino.svg"},
      {"type":"file","name":"chrome.svg"},
      {"type":"file","name":"django.svg"},
      {"type":"file","name":"node-js.svg"},
      {"type":"file","name":"webapp.png"},
      {"type":"file","name":"python.svg"},
      {"type":"file","name":"webapp.svg"}
  ]},
    {"type":"file","name":"mb.svg"}
  ]}
,
  {"type":"report","directories":2,"files":11}
]
`;

const App = () => {
  const [treeText, setTreeText] = useState(SampleText);
  const [initialTree, setInitialTree] = useState<Tree>(parseTree(SampleText));
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

const Options = (props: {
  options: Options;
  setOptions: (update: (prev: Options) => Options) => void;
}) => {
  const { options, setOptions } = props;

  return (
    <div className="options">
      <code>{JSON.stringify(options)}</code>
      <p>
        <label htmlFor="showFiles">Show files</label>
        <input
          id="showFiles"
          type="checkbox"
          checked={options.showFiles}
          onChange={() =>
            setOptions((prev) => {
              const result = { ...prev };
              result.showFiles = !options.showFiles;
              return result;
            })
          }
        />
      </p>
    </div>
  );
};

const Editor = (props: { initialTree: Tree }) => {
  const { initialTree } = props;
  const [editableTree, setEditableTree] = useState<Tree>(initialTree);
  const [options, setOptions] = useOptions();

  return (
    <OptionsContext.Provider value={options}>
      <Options options={options} setOptions={setOptions} />
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
