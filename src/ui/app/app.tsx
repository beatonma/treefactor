import React, { ReactNode, useRef, useState } from "react";
import { Tree } from "src/tree";
import { OptionsUI, TreeUI } from "src/ui";
import { OptionsContext, useOptions } from "src/ui/options";
import {
  removeSaved,
  isSaved,
  PersistenceKey,
  usePersistentString,
  usePersistentTree,
} from "src/persistence";
import "./app.scss";

const ExampleTree = `[
  {"type":"directory","name":".","contents":[
    {"type":"file","name":"babel.config.js"},
    {"type":"file","name":"bun.lockb"},
    {"type":"file","name":"index.html"},
    {"type":"file","name":"package.json"},
    {"type":"directory","name":"public","contents":[
      {"type":"file","name":"favicon.svg"},
      {"type":"file","name":"index.css"}
  ]},
    {"type":"file","name":"README.md"},
    {"type":"file","name":"refactor-tool.gitbundle"},
    {"type":"directory","name":"src","contents":[
      {"type":"file","name":"entrypoint.tsx"},
      {"type":"directory","name":"tree","contents":[
        {"type":"file","name":"index.ts"},
        {"type":"file","name":"options.ts"},
        {"type":"file","name":"parse.ts"},
        {"type":"file","name":"path.test.ts"},
        {"type":"file","name":"path.ts"},
        {"type":"file","name":"tree.test.ts"},
        {"type":"file","name":"tree.ts"}
    ]},
      {"type":"directory","name":"ui","contents":[
        {"type":"directory","name":"app","contents":[
          {"type":"file","name":"app.scss"},
          {"type":"file","name":"app.tsx"},
          {"type":"file","name":"index.ts"},
          {"type":"file","name":"SampleData.ts"}
      ]},
        {"type":"file","name":"index.ts"},
        {"type":"directory","name":"options","contents":[
          {"type":"file","name":"fields.tsx"},
          {"type":"file","name":"index.ts"},
          {"type":"file","name":"options.tsx"}
      ]},
        {"type":"directory","name":"tree","contents":[
          {"type":"file","name":"drag-drop.ts"},
          {"type":"file","name":"index.ts"},
          {"type":"file","name":"tree.tsx"},
          {"type":"file","name":"types.ts"}
      ]},
        {"type":"file","name":"types.ts"}
    ]}
  ]},
    {"type":"file","name":"tsconfig.json"},
    {"type":"file","name":"webpack.dev.js"}
  ]}
,
  {"type":"report","directories":7,"files":31}
]
`;
const TreeUtilityCommand = () => <code>tree . -J</code>;

export const App = () => {
  const [treeText, setTreeText] = usePersistentString(
    PersistenceKey.InitialTree,
    "",
  );
  const [initialTree, setInitialTree] = useState<Tree | undefined>(
    isSaved(PersistenceKey.EditedTree) ? Tree.parse(treeText) : undefined,
  );
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [errorMessage, setErrorMessage] = useState<ReactNode>();

  if (initialTree) {
    const onClickReset = () => {
      setInitialTree(undefined);
      removeSaved(PersistenceKey.EditedTree);
    };

    return (
      <>
        <MainHeader />
        <button onClick={onClickReset} type="reset">
          Reset
        </button>
        <Editor initialTree={initialTree} />
      </>
    );
  }

  const onClickEditButton = () => {
    try {
      const tree = Tree.parse(textAreaRef?.current?.value ?? "");
      setInitialTree(tree);

      setErrorMessage(undefined);
    } catch (e) {
      setErrorMessage(
        <div className="tree-error">
          <p>{`Parsing error: ${e}`}</p>
          <p>
            Please check that the data above matches the output of{" "}
            <TreeUtilityCommand />.
          </p>
        </div>,
      );
    }
  };

  return (
    <div className="init">
      <MainHeader />
      <Introduction onClickShowExample={() => setTreeText(ExampleTree)} />

      <form action="#">
        <textarea
          ref={textAreaRef}
          value={treeText}
          onChange={e => setTreeText(e.target.value)}
          required
        />

        <p className="tree-error">{errorMessage}</p>
        <button type="button" onClick={onClickEditButton}>
          Start editing
        </button>
      </form>
    </div>
  );
};

const MainHeader = () => {
  return <h1>Treefactor</h1>;
};

const Introduction = (props: { onClickShowExample: () => void }) => (
  <>
    <p>
      This tool allows you to experiment with the structure of an existing file
      tree without actually affecting any real data.
    </p>
    <p>
      It accepts JSON data as provided by the{" "}
      <a href="https://en.wikipedia.org/wiki/Tree_(command)">
        <code>tree</code>
      </a>{" "}
      utility.
    </p>
    <p>
      To get started, run <TreeUtilityCommand /> from your main directory and
      paste the result below.
    </p>
    <button onClick={props.onClickShowExample}>See an example</button>
  </>
);

const Editor = (props: { initialTree: Tree }) => {
  const { initialTree } = props;
  const [editableTree, setEditableTree] = usePersistentTree(
    PersistenceKey.EditedTree,
    initialTree,
  );
  const [options, setOptions] = useOptions();

  return (
    <OptionsContext.Provider value={options}>
      <OptionsUI options={options} setOptions={setOptions} />
      <Report tree={initialTree} />
      <div className="editor">
        <div>
          <h2>Original structure</h2>
          <TreeUI tree={initialTree} />
        </div>
        <div>
          <h2>Editable structure</h2>
          <TreeUI tree={editableTree} onEdit={setEditableTree} />
        </div>
      </div>
    </OptionsContext.Provider>
  );
};

const Report = (props: { tree: Tree }) => {
  const { tree } = props;

  const report = tree.report();

  return (
    <div className="report">
      <span>
        <span className="report-count">{report.directories}</span> directories
      </span>
      <span>
        <span className="report-count">{report.files}</span> files
      </span>
    </div>
  );
};
