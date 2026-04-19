"use client";

import { useLayoutStore } from "@/store/useLayoutStore";
import { formatFeetInches } from "@/lib/geometry";
import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "@/lib/constants";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2 py-1">{children}</div>;
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  suffix = '"',
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <Row>
      <label className="text-[12px] text-slate-600">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
          className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-[12px] tabular-nums text-slate-800 focus:border-[#2563eb] focus:outline-none"
        />
        <span className="w-3 text-[11px] text-slate-400">{suffix}</span>
      </div>
    </Row>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Row>
      <label className="text-[12px] text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-800 focus:border-[#2563eb] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
}

const DOOR_TYPES = new Set(["singleDoor", "doubleDoor"]);
const HINGED = new Set(["singleDoor", "doubleDoor", "wallFridge"]);

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
  const archFocus =
    focused?.type === "archElement"
      ? archElements.find((e) => e.id === focused.id) ?? null
      : null;
  const shelfFocus =
    focused?.type === "shelf"
      ? shelvingSegments.find((s) => s.id === focused.id) ?? null
      : null;

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 text-slate-700">
      {!focused ? (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Room
          </h2>
          <dl className="text-[13px]">
            <Row>
              <dt className="text-slate-600">Width</dt>
              <dd className="tabular-nums text-slate-900">
                {formatFeetInches(width)}
              </dd>
            </Row>
            <Row>
              <dt className="text-slate-600">Depth</dt>
              <dd className="tabular-nums text-slate-900">
                {formatFeetInches(depth)}
              </dd>
            </Row>
            <NumField
              label="Wall thickness"
              value={wallThickness}
              onChange={setWallThickness}
            />
            <Row>
              <dt className="text-slate-600">Base PPI</dt>
              <dd className="tabular-nums text-slate-900">{basePPI}</dd>
            </Row>
          </dl>
          <p className="text-[12px] leading-snug text-slate-500">
            Click the dimension label on any wall to type a new length
            (e.g. <code className="rounded bg-slate-100 px-1">20'</code> or{" "}
            <code className="rounded bg-slate-100 px-1">12' 4"</code>).
          </p>
        </>
      ) : null}

      {archFocus ? (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {ARCH_ELEMENT_DEFAULTS[archFocus.type].label}
          </h2>
          <div className="text-[13px]">
            <NumField
              label="X"
              value={archFocus.x}
              onChange={(n) => updateArchElement(archFocus.id, { x: n })}
            />
            <NumField
              label="Y"
              value={archFocus.y}
              onChange={(n) => updateArchElement(archFocus.id, { y: n })}
            />
            <NumField
              label="Width"
              value={archFocus.widthInches}
              onChange={(n) =>
                updateArchElement(archFocus.id, { widthInches: n })
              }
            />
            <NumField
              label="Depth"
              value={archFocus.depthInches}
              onChange={(n) =>
                updateArchElement(archFocus.id, { depthInches: n })
              }
            />
            <NumField
              label="Rotation"
              value={archFocus.rotation}
              step={90}
              suffix="°"
              onChange={(n) => updateArchElement(archFocus.id, { rotation: n })}
            />
            {HINGED.has(archFocus.type) ? (
              <Select
                label="Hinge side"
                value={archFocus.hingeSide ?? "left"}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
                onChange={(v) =>
                  updateArchElement(archFocus.id, { hingeSide: v })
                }
              />
            ) : null}
            {DOOR_TYPES.has(archFocus.type) || archFocus.type === "wallFridge" ? (
              <Select
                label="Swing"
                value={archFocus.swingDirection ?? "inward"}
                options={[
                  { value: "inward", label: "Inward" },
                  { value: "outward", label: "Outward" },
                ]}
                onChange={(v) =>
                  updateArchElement(archFocus.id, { swingDirection: v })
                }
              />
            ) : null}
          </div>
        </>
      ) : null}

      {shelfFocus ? (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {SHELF_DEFAULTS[shelfFocus.type].label}
          </h2>
          <div className="text-[13px]">
            <NumField
              label="X"
              value={shelfFocus.x}
              onChange={(n) => updateShelf(shelfFocus.id, { x: n })}
            />
            <NumField
              label="Y"
              value={shelfFocus.y}
              onChange={(n) => updateShelf(shelfFocus.id, { y: n })}
            />
            <NumField
              label="Length"
              value={shelfFocus.lengthInches}
              onChange={(n) => updateShelf(shelfFocus.id, { lengthInches: n })}
            />
            <NumField
              label="Depth"
              value={shelfFocus.widthInches}
              onChange={(n) => updateShelf(shelfFocus.id, { widthInches: n })}
            />
            <NumField
              label="Height"
              value={shelfFocus.heightInches}
              onChange={(n) => updateShelf(shelfFocus.id, { heightInches: n })}
            />
            <NumField
              label="Rotation"
              value={shelfFocus.rotation}
              step={90}
              suffix="°"
              onChange={(n) => updateShelf(shelfFocus.id, { rotation: n })}
            />
          </div>
        </>
      ) : null}

      {selection.length > 1 ? (
        <p className="text-[12px] text-slate-500">
          {selection.length} elements selected. Use keyboard shortcuts for bulk
          operations (Delete, Ctrl+D, arrows to nudge).
        </p>
      ) : null}
    </aside>
  );
}
