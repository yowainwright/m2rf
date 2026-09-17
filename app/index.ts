'use client';

import { createActorContext } from '@xstate/react';
import { APP_MACHINE_CONFIG } from './state/constants';
import { appSetup } from './state/utils';

export const appMachine = appSetup.createMachine(APP_MACHINE_CONFIG);
export const AppContext = createActorContext(appMachine);
