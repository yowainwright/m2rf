import { ReactFlowProvider } from 'reactflow';
import type { ReactNode } from 'react';

export const ReactFlowWrapper = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <div style={{ width: '500px', height: '500px' }}>
      {children}
    </div>
  </ReactFlowProvider>
);
