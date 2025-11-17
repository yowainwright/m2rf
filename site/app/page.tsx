'use client';

import { MermaidFlow } from 'm2rf';
import { create } from 'zustand';
import 'reactflow/dist/style.css';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state: any) => ({ count: state.count + 1 })),
}));

const Counter = () => {
  const count = useStore((s: any) => s.count);
  const increment = useStore((s: any) => s.increment);

  return (
    <button
      onClick={increment}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Count: {count}
    </button>
  );
};

const Display = () => {
  const count = useStore((s: any) => s.count);

  return (
    <div className="px-4 py-2 bg-green-100 border-2 border-green-500 rounded">
      Value: {count}
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-3">
            m2rf
          </h1>
          <p className="text-xl text-slate-600">
            Mermaid to ReactFlow - Interactive diagrams with embedded React components
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Interactive Counter Demo
          </h2>
          <p className="text-slate-600 mb-6">
            Click the counter button and watch the value update in the display component through shared Zustand state.
          </p>

          <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
            <MermaidFlow
              store={useStore}
              components={{ Counter, Display }}
              height="400px"
            >
              {`
                flowchart LR
                  A[Start] --> B[Counter] --> C[Display] --> D[End]
              `}
            </MermaidFlow>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Simple Diagram
          </h2>
          <p className="text-slate-600 mb-6">
            A basic Mermaid flowchart rendered with ReactFlow.
          </p>

          <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
            <MermaidFlow height="400px">
              {`
                flowchart TB
                  A[Christmas] -->|Get money| B(Go shopping)
                  B --> C{Let me think}
                  C -->|One| D[Laptop]
                  C -->|Two| E[Phone]
                  C -->|Three| F[Car]
              `}
            </MermaidFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
