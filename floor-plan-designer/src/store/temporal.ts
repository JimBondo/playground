import { useLayoutStore } from "./useLayoutStore";

/**
 * Thin wrapper around zundo's temporal store for ergonomic undo/redo
 * from anywhere (keyboard shortcuts, toolbar buttons).
 */
export const temporal = {
  undo() {
    useLayoutStore.temporal.getState().undo();
  },
  redo() {
    useLayoutStore.temporal.getState().redo();
  },
  get canUndo() {
    return useLayoutStore.temporal.getState().pastStates.length > 0;
  },
  get canRedo() {
    return useLayoutStore.temporal.getState().futureStates.length > 0;
  },
  clear() {
    useLayoutStore.temporal.getState().clear();
  },
};
