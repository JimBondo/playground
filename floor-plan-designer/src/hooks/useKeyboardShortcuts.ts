"use client";

import { useEffect } from "react";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useEditorStore } from "@/store/useEditorStore";
import { temporal } from "@/store/temporal";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(): void {
  const store = useLayoutStore;
  const setShiftHeld = useEditorStore((s) => s.setShiftHeld);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
      if (isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key;
      const code = e.code;
      const lower = key.toLowerCase();
      const s = store.getState();

      // Undo / Redo
      if (mod && (lower === "z" || code === "KeyZ")) {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }
      if (mod && (lower === "y" || code === "KeyY")) {
        e.preventDefault();
        temporal.redo();
        return;
      }

      // Select all
      if (mod && (lower === "a" || code === "KeyA")) {
        e.preventDefault();
        s.selectAll();
        return;
      }
      // Duplicate
      if (mod && (lower === "d" || code === "KeyD")) {
        e.preventDefault();
        s.duplicateSelected();
        return;
      }
      // Save
      if (mod && (lower === "s" || code === "KeyS")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("fpd:save"));
        return;
      }

      switch (key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          s.deleteSelected();
          return;
        case "Escape":
          e.preventDefault();
          s.setActiveMode("select");
          s.clearSelection();
          window.dispatchEvent(new CustomEvent("fpd:wire-cancel"));
          return;
        case "+":
        case "=":
          e.preventDefault();
          s.setZoom(Math.min(4, s.view.zoom * 1.2));
          return;
        case "-":
        case "_":
          e.preventDefault();
          s.setZoom(Math.max(0.25, s.view.zoom / 1.2));
          return;
        case "0":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("fpd:fit-to-room"));
          return;
        case "ArrowLeft":
          e.preventDefault();
          s.moveSelected(-s.view.gridSpacingInches, 0);
          return;
        case "ArrowRight":
          e.preventDefault();
          s.moveSelected(s.view.gridSpacingInches, 0);
          return;
        case "ArrowUp":
          e.preventDefault();
          s.moveSelected(0, -s.view.gridSpacingInches);
          return;
        case "ArrowDown":
          e.preventDefault();
          s.moveSelected(0, s.view.gridSpacingInches);
          return;
      }

      switch (lower) {
        case "r":
          e.preventDefault();
          for (const sel of s.selection) {
            if (sel.type === "shelf") s.rotateShelf(sel.id);
            else if (sel.type === "archElement") {
              const el = s.archElements.find((x) => x.id === sel.id);
              if (el) s.updateArchElement(el.id, { rotation: (el.rotation + 90) % 360 });
            }
          }
          return;
        case "g":
          e.preventDefault();
          s.toggleGrid();
          return;
        case "m":
          e.preventDefault();
          s.toggleMeasurements();
          return;
        case "w":
          e.preventDefault();
          s.setActiveMode(s.view.activeMode === "wire" ? "select" : "wire");
          return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [store, setShiftHeld]);
}
