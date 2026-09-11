'use client';

import { StudioContext } from './index';
import { Studio } from '@/components/studio';

export default function Home() {
  return <StudioContext.Provider><Studio /></StudioContext.Provider>;
}
