'use client';

import { AppContext } from './index';
import { Workspace } from '@/app/components/workspace';

export default function Home() {
  return (
    <AppContext.Provider>
      <Workspace />
    </AppContext.Provider>
  );
}
