import { encode, renderSVG } from "uqr";

export type Ecc = "L" | "M" | "Q" | "H";

export interface QrOptions {
  ecc: Ecc;
  border: number;
}

export function qrSvg(
  text: string,
  { ecc, border }: QrOptions,
  pixelSize = 10,
): string {
  if (text === "") throw new Error("empty input");
  return renderSVG(text, { ecc, border, pixelSize });
}

export function qrMatrix(
  text: string,
  { ecc, border }: QrOptions,
): { data: boolean[][]; size: number } {
  if (text === "") throw new Error("empty input");
  const { data, size } = encode(text, { ecc, border });
  return { data, size };
}
