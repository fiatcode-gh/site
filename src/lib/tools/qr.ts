import { encode, renderSVG } from "uqr";

export type Ecc = "L" | "M" | "Q" | "H";

export interface QrOptions {
  ecc: Ecc;
  border: number;
}

export const MAX_BORDER = 10;

// Number inputs don't enforce min/max on typed values, and uqr silently
// corrupts the matrix on a negative border — clamp here, not in the UI.
function clampBorder(border: number): number {
  if (!Number.isFinite(border)) return 0;
  return Math.max(0, Math.min(MAX_BORDER, Math.floor(border)));
}

export function qrSvg(
  text: string,
  { ecc, border }: QrOptions,
  pixelSize = 10,
): string {
  if (text === "") throw new Error("empty input");
  return renderSVG(text, { ecc, border: clampBorder(border), pixelSize });
}

export function qrMatrix(
  text: string,
  { ecc, border }: QrOptions,
): { data: boolean[][]; size: number } {
  if (text === "") throw new Error("empty input");
  const { data, size } = encode(text, { ecc, border: clampBorder(border) });
  return { data, size };
}
