'use client';

import { StudioContext } from './index';
import { Studio } from '@/app/components/studio';

export default function Home() {
  return <StudioContext.Provider><Studio /></StudioContext.Provider>;
}
