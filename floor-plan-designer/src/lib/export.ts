import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type Konva from "konva";

import type {
  ArchElement,
  ArchElementType,
  ShelfType,
  ShelvingSegment,
} from "@/types";
import { formatFeetInches, polygonSquareFeet } from "./geometry";
import { ARCH_ELEMENT_DEFAULTS, SHELF_DEFAULTS } from "./constants";
import type { LayoutState } from "@/store/useLayoutStore";

export interface BomRow {
  category: "Arch" | "Shelf";
  type: string;
  dimensions: string;
  lit: string;
  quantity: number;
  notes: string;
}

export function buildBom(
  archElements: ArchElement[],
  shelves: ShelvingSegment[],
): BomRow[] {
  const rows: BomRow[] = [];
  const archCounts = new Map<
    ArchElementType,
    { qty: number; w: number; d: number }
  >();
  for (const el of archElements) {
    const existing = archCounts.get(el.type);
    if (existing) {
      existing.qty++;
    } else {
      archCounts.set(el.type, {
        qty: 1,
        w: el.widthInches,
        d: el.depthInches,
      });
    }
  }
  for (const [type, info] of archCounts) {
    rows.push({
      category: "Arch",
      type: ARCH_ELEMENT_DEFAULTS[type].label,
      dimensions: `${formatFeetInches(info.w)} × ${formatFeetInches(info.d)}`,
      lit: "—",
      quantity: info.qty,
      notes: "",
    });
  }

  const shelfCounts = new Map<
    ShelfType,
    { qty: number; l: number; w: number; h: number }
  >();
  for (const s of shelves) {
    const existing = shelfCounts.get(s.type);
    if (existing) {
      existing.qty++;
    } else {
      shelfCounts.set(s.type, {
        qty: 1,
        l: s.lengthInches,
        w: s.widthInches,
        h: s.heightInches,
      });
    }
  }
  for (const [type, info] of shelfCounts) {
    rows.push({
      category: "Shelf",
      type: SHELF_DEFAULTS[type].label,
      dimensions: `${formatFeetInches(info.l)} × ${formatFeetInches(info.w)} × ${formatFeetInches(info.h)}`,
      lit: type === "litShelf" ? "Y" : "N",
      quantity: info.qty,
      notes: "",
    });
  }

  return rows;
}

export function exportProjectJson(state: LayoutState): string {
  return JSON.stringify(
    {
      project: state.project,
      room: state.room,
      archElements: state.archElements,
      shelvingSegments: state.shelvingSegments,
      powerRoutingLines: state.powerRoutingLines,
      view: {
        basePixelsPerInch: state.view.basePixelsPerInch,
        showGrid: state.view.showGrid,
        showMeasurements: state.view.showMeasurements,
        showAlignmentGuides: state.view.showAlignmentGuides,
        gridSpacingInches: state.view.gridSpacingInches,
        snapToGrid: state.view.snapToGrid,
      },
    },
    null,
    2,
  );
}

export function downloadJson(fileName: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<string> {
  return await file.text();
}

export interface PdfExportOptions {
  stage: Konva.Stage;
  state: LayoutState;
  fileName?: string;
}

export async function exportPdf({
  stage,
  state,
  fileName,
}: PdfExportOptions): Promise<void> {
  // ---- Page 1: floorplan (11×17 tabloid landscape) ----
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [11, 17],
  });

  const png = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
  const marginIn = 0.5;
  const titleHeight = 1.25;
  const pageW = 17;
  const pageH = 11;
  const imgMaxW = pageW - marginIn * 2;
  const imgMaxH = pageH - marginIn * 2 - titleHeight;

  // Preserve aspect ratio.
  const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = png;
  });
  const ratio = Math.min(imgMaxW / imgEl.width, imgMaxH / imgEl.height);
  const imgW = imgEl.width * ratio;
  const imgH = imgEl.height * ratio;
  const imgX = (pageW - imgW) / 2;
  const imgY = marginIn;
  doc.addImage(png, "PNG", imgX, imgY, imgW, imgH);

  // Title block (bottom right)
  const xs = state.room.polygonVertices.map((v) => v.x);
  const ys = state.room.polygonVertices.map((v) => v.y);
  const roomW = Math.max(...xs) - Math.min(...xs);
  const roomD = Math.max(...ys) - Math.min(...ys);
  const sqFt = Math.round(polygonSquareFeet(state.room.polygonVertices));
  const titleTop = pageH - titleHeight;
  const titleLeft = pageW - 4;
  doc.setDrawColor(0);
  doc.setLineWidth(0.01);
  doc.rect(titleLeft, titleTop, 3.5, titleHeight - 0.2);
  doc.setFontSize(11);
  doc.text(state.project.name, titleLeft + 0.1, titleTop + 0.25);
  doc.setFontSize(8);
  doc.text(
    new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    titleLeft + 0.1,
    titleTop + 0.45,
  );
  doc.text(
    `${formatFeetInches(roomW)} × ${formatFeetInches(roomD)}  ·  ${sqFt} sq ft`,
    titleLeft + 0.1,
    titleTop + 0.65,
  );
  doc.text("Floor Plan Designer", titleLeft + 0.1, titleTop + 0.85);

  // Scale bar (bottom left)
  const basePPI = state.view.basePixelsPerInch;
  const zoom = state.view.zoom;
  const sourcePixelsPerInchOnStage = basePPI * zoom;
  const pagePixelsPerInch = ratio * 2; // because pixelRatio 2 doubled the image
  const pageInchesPerRoomFoot =
    (12 * sourcePixelsPerInchOnStage * pagePixelsPerInch) / 72;
  // Show a 1-foot segment length on page:
  const scaleBarLenIn = Math.max(0.5, pageInchesPerRoomFoot);
  const sbLeft = marginIn + 0.2;
  const sbTop = pageH - 0.4;
  doc.setLineWidth(0.02);
  doc.line(sbLeft, sbTop, sbLeft + scaleBarLenIn, sbTop);
  doc.line(sbLeft, sbTop - 0.05, sbLeft, sbTop + 0.05);
  doc.line(
    sbLeft + scaleBarLenIn,
    sbTop - 0.05,
    sbLeft + scaleBarLenIn,
    sbTop + 0.05,
  );
  doc.setFontSize(7);
  doc.text(
    `1 ft (scale bar: ${scaleBarLenIn.toFixed(2)}" on page)`,
    sbLeft,
    sbTop - 0.1,
  );

  // ---- Page 2: Bill of Materials (letter portrait) ----
  doc.addPage([8.5, 11], "portrait");
  doc.setFontSize(16);
  doc.text("Bill of Materials", 0.75, 0.9);
  doc.setFontSize(10);
  doc.text(state.project.name, 0.75, 1.15);

  const rows = buildBom(state.archElements, state.shelvingSegments);

  autoTable(doc, {
    head: [["Category", "Type", "Dimensions (L×W×H)", "Lit", "Qty", "Notes"]],
    body: rows.map((r) => [
      r.category,
      r.type,
      r.dimensions,
      r.lit,
      r.quantity.toString(),
      r.notes,
    ]),
    startY: 1.4,
    styles: { fontSize: 9, cellPadding: 0.05 },
    headStyles: { fillColor: [44, 21, 90], textColor: 255 },
    margin: { left: 0.75, right: 0.75 },
  });

  const summaryY =
    // @ts-expect-error jspdf-autotable augments the jsPDF instance at runtime
    (doc.lastAutoTable?.finalY ?? 1.4) + 0.4;
  doc.setFontSize(10);
  const totalShelves = state.shelvingSegments.length;
  const litShelves = state.shelvingSegments.filter(
    (s) => s.type === "litShelf",
  ).length;
  const outlets = state.archElements.filter((e) => e.type === "outlet").length;
  doc.text(`Total shelves: ${totalShelves}`, 0.75, summaryY);
  doc.text(`Lit shelves: ${litShelves}`, 0.75, summaryY + 0.25);
  doc.text(`Outlets: ${outlets}`, 0.75, summaryY + 0.5);
  doc.text(`Room area: ${sqFt} sq ft`, 0.75, summaryY + 0.75);

  // Page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${total}`, pageW - 1, 0.3);
    doc.text(state.project.name, 0.5, 0.3);
  }

  const base = fileName ?? state.project.name.replace(/[^A-Za-z0-9_-]+/g, "_");
  doc.save(`${base}.pdf`);
}
