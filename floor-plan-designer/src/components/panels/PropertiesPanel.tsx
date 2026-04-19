"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { formatFeetInches } from "@/lib/geometry";
import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "@/lib/constants";

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="w-20 border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-white focus:border-[#00ffff] focus:outline-none"
      />
    </label>
  );
}

export function PropertiesPanel() {
  const room = useLayoutStore((s) => s.room);
  const wallThickness = useLayoutStore((s) => s.room.wallThicknessInches);
  const basePPI = useLayoutStore((s) => s.view.basePixelsPerInch);
  const selection = useLayoutStore((s) => s.selection);
  const archElements = useLayoutStore((s) => s.archElements);
  const shelvingSegments = useLayoutStore((s) => s.shelvingSegments);
  const updateArchElement = useLayoutStore((s) => s.updateArchElement);
  const updateShelf = useLayoutStore((s) => s.updateShelf);
  const setWallThickness = useLayoutStore((s) => s.setWallThickness);

  const xs = room.polygonVertices.map((v) => v.x);
  const ys = room.polygonVertices.map((v) => v.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...ys) - Math.min(...ys);

  const focused = selection.length === 1 ? selection[0] : null;
  const archFocus = focused?.type === "archElement"
    ? archElements.find((e) => e.id === focused.id) ?? null
    : null;
  const shelfFocus = focused?.type === "shelf"
    ? shelvingSegments.find((s) => s.id === focused.id) ?? null
    : null;

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 bg-black/30 p-4 font-mono text-xs uppercase tracking-widest text-white/70">
      {!focused ? (
        <>
          <div className="text-[#ff00ff]">Room</div>
          <dl className="space-y-2">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <dt>Room W</dt>
              <dd className="text-white">{formatFeetInches(width)}</dd>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <dt>Room D</dt>
              <dd className="text-white">{formatFeetInches(depth)}</dd>
            </div>
            <NumberField
              label="Wall &quot;"
              value={wallThickness}
              onChange={setWallThickness}
            />
            <div className="flex justify-between border-b border-white/5 pb-1">
              <dt>Base PPI</dt>
              <dd className="text-white">{basePPI}</dd>
            </div>
          </dl>
          <p className="text-white/40 normal-case tracking-normal">
            Click or drag any element on the canvas to edit it here.
          </p>
        </>
      ) : null}

      {archFocus ? (
        <>
          <div className="text-[#ff00ff]">
            {ARCH_ELEMENT_DEFAULTS[archFocus.type].label}
          </div>
          <dl className="space-y-2">
            <NumberField
              label="X &quot;"
              value={archFocus.x}
              onChange={(n) => updateArchElement(archFocus.id, { x: n })}
            />
            <NumberField
              label="Y &quot;"
              value={archFocus.y}
              onChange={(n) => updateArchElement(archFocus.id, { y: n })}
            />
            <NumberField
              label="W &quot;"
              value={archFocus.widthInches}
              onChange={(n) =>
                updateArchElement(archFocus.id, { widthInches: n })
              }
            />
            <NumberField
              label="D &quot;"
              value={archFocus.depthInches}
              onChange={(n) =>
                updateArchElement(archFocus.id, { depthInches: n })
              }
            />
            <NumberField
              label="Rot °"
              value={archFocus.rotation}
              step={90}
              onChange={(n) => updateArchElement(archFocus.id, { rotation: n })}
            />
          </dl>
        </>
      ) : null}

      {shelfFocus ? (
        <>
          <div className="text-[#ff00ff]">
            {SHELF_DEFAULTS[shelfFocus.type].label}
          </div>
          <dl className="space-y-2">
            <NumberField
              label="X &quot;"
              value={shelfFocus.x}
              onChange={(n) => updateShelf(shelfFocus.id, { x: n })}
            />
            <NumberField
              label="Y &quot;"
              value={shelfFocus.y}
              onChange={(n) => updateShelf(shelfFocus.id, { y: n })}
            />
            <NumberField
              label="L &quot;"
              value={shelfFocus.lengthInches}
              onChange={(n) => updateShelf(shelfFocus.id, { lengthInches: n })}
            />
            <NumberField
              label="W &quot;"
              value={shelfFocus.widthInches}
              onChange={(n) => updateShelf(shelfFocus.id, { widthInches: n })}
            />
            <NumberField
              label="H &quot;"
              value={shelfFocus.heightInches}
              onChange={(n) => updateShelf(shelfFocus.id, { heightInches: n })}
            />
            <NumberField
              label="Rot °"
              value={shelfFocus.rotation}
              step={90}
              onChange={(n) => updateShelf(shelfFocus.id, { rotation: n })}
            />
          </dl>
        </>
      ) : null}

      {selection.length > 1 ? (
        <p className="text-white/60">
          {selection.length} elements selected. Bulk operations via keyboard
          shortcuts.
        </p>
      ) : null}
    </aside>
  );
}
