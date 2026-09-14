'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AppContext } from '@/app';
import { EDITOR_EXTENSIONS } from './constants';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

export function MermaidEditor() {
  const { send } = AppContext.useActorRef();
  const source = AppContext.useSelector((state) => state.context.input.source);
  const canEditDraft = AppContext.useSelector((state) => state.matches({ document: 'active' }));
  const handleSourceUpdate = (nextSource: string) => send({ type: 'input.update', source: nextSource });

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">Mermaid input</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <CodeMirror
          basicSetup
          readOnly={!canEditDraft}
          extensions={EDITOR_EXTENSIONS}
          height="100%"
          value={source}
          onChange={handleSourceUpdate}
        />
      </CardContent>
    </Card>
  );
}
