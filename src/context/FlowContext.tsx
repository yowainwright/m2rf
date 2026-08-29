import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AnyActorRef } from 'xstate';

export const FlowActorContext = createContext<AnyActorRef | null>(null);

const subscribeToActor = (
  actor: AnyActorRef,
  onStoreChange: () => void
) => {
  const subscription = actor.subscribe(onStoreChange);

  return () => subscription.unsubscribe();
};

export const useFlowActor = <TActor extends AnyActorRef = AnyActorRef>() => {
  const actor = useContext(FlowActorContext);

  if (!actor) {
    throw new Error('useFlowActor must be used within a MermaidFlow component with an actor prop');
  }

  return actor as TActor;
};

export const useFlowSnapshot = <
  TActor extends AnyActorRef = AnyActorRef,
  TSelected = ReturnType<TActor['getSnapshot']>,
>(
  selector: (snapshot: ReturnType<TActor['getSnapshot']>) => TSelected
) => {
  const actor = useFlowActor<TActor>();

  return useSyncExternalStore(
    (onStoreChange) => subscribeToActor(actor, onStoreChange),
    () => selector(actor.getSnapshot()),
    () => selector(actor.getSnapshot())
  );
};
